import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import { load as parseYaml } from "js-yaml";

import { fetchAihotDiscoverySource } from "../../src/collectors/shared/adapters.mjs";
import { pruneExpiredCache, writeRawCache } from "../../src/collectors/shared/cache.mjs";
import { runRegionalCollector } from "../../src/collectors/shared/collector-runner.mjs";
import {
  checkNoTrackedRawCache,
  scanForbiddenFulltextKeys,
  validateAllPublicOutputs,
} from "../../src/contracts/validate.mjs";
import { exportDualLayer } from "../../src/export/dual-export.mjs";
import { runDailyPipeline } from "../../src/pipeline/daily.mjs";
import { deduplicateCrossTrack } from "../../src/pipeline/merge-and-curate/dedup.mjs";
import { runCuratePipeline } from "../../src/pipeline/merge-and-curate/index.mjs";
import { buildWechatTopicPool } from "../../src/pipeline/merge-and-curate/topic-pool.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "../..");

const TRIAL_DATES = ["2026-11-24", "2026-11-25", "2026-11-26"];
const OFFICIAL_CATEGORIES = [
  "监管与合规",
  "模型与技术",
  "实务与工具",
  "判例与学术",
  "行业与资本",
];
const EFFECTIVE_STATUS_ENUM = new Set([
  "draft",
  "proposed",
  "enacted",
  "in_force",
  "amended",
  "superseded",
  "repealed",
  "guidance",
  "not_applicable",
]);
const FORBIDDEN_FULLTEXT_NORMALIZED = new Set([
  "rawtext",
  "fulltext",
  "htmlcontent",
  "bodyhtml",
  "rawhtml",
  "fullcontent",
  "articlebody",
]);
const META_ANNOTATION_RE =
  /（唯一长句）|\(唯一长句\)|（观点）|（证据）|（论据）|（回应质疑）/;

const EXPECTED_WEB_INDEX_SHA256 =
  "c8e6f9aa192ce80ab01c786756e61b36e3a422ccd65f98c3eef27d4145c8ecde";

function sha256File(filePath) {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex");
}

function createIndependentValidators() {
  const ajv = new Ajv({
    allErrors: true,
    strict: true,
    strictRequired: false,
    allowUnionTypes: false,
  });
  addFormats(ajv);

  const schemaFiles = [
    "candidate-item.schema.json",
    "collect-meta.schema.json",
    "wechat-topic-pool.schema.json",
    "daily-bundle.schema.json",
  ];
  for (const file of schemaFiles) {
    const schema = JSON.parse(
      readFileSync(path.join(REPO_ROOT, "schemas", file), "utf8"),
    );
    ajv.addSchema(schema);
  }

  return {
    candidateItem: ajv.getSchema(
      "https://lexaidaily.local/schemas/candidate-item.schema.json",
    ),
    collectMeta: ajv.getSchema(
      "https://lexaidaily.local/schemas/collect-meta.schema.json",
    ),
    wechatTopicPool: ajv.getSchema(
      "https://lexaidaily.local/schemas/wechat-topic-pool.schema.json",
    ),
    dailyBundle: ajv.getSchema(
      "https://lexaidaily.local/schemas/daily-bundle.schema.json",
    ),
  };
}

function findForbiddenKeysRecursive(value, currentPath = "$", hits = []) {
  if (Array.isArray(value)) {
    value.forEach((v, i) =>
      findForbiddenKeysRecursive(v, `${currentPath}[${i}]`, hits),
    );
    return hits;
  }
  if (value !== null && typeof value === "object") {
    for (const [key, val] of Object.entries(value)) {
      const normalized = key.toLowerCase().replace(/[_-]/g, "");
      if (FORBIDDEN_FULLTEXT_NORMALIZED.has(normalized)) {
        hits.push(`${currentPath}.${key}`);
      }
      findForbiddenKeysRecursive(val, `${currentPath}.${key}`, hits);
    }
  }
  return hits;
}

function loadWhitelistMap() {
  const cnYaml = parseYaml(
    readFileSync(
      path.join(REPO_ROOT, "data/sources/whitelist-cn.yaml"),
      "utf8",
    ),
  );
  const globalYaml = parseYaml(
    readFileSync(
      path.join(REPO_ROOT, "data/sources/whitelist-global.yaml"),
      "utf8",
    ),
  );
  const all = [...cnYaml.sources, ...globalYaml.sources];
  const byId = new Map();
  const entryUrls = new Set();
  for (const src of all) {
    byId.set(src.source_id, src);
    entryUrls.add(src.entry_url.replace(/\/+$/, ""));
  }
  return { byId, entryUrls, cnYaml, globalYaml };
}

function makeMockResponse(body, opts = {}) {
  const status = opts.status ?? 200;
  const buf =
    body instanceof Uint8Array ? body : Buffer.from(String(body), "utf8");
  const headersMap = new Map();
  headersMap.set("content-type", opts.contentType ?? "text/html; charset=utf-8");
  if (opts.etag) headersMap.set("etag", opts.etag);
  return {
    status,
    ok: status >= 200 && status < 300,
    url: opts.url ?? "",
    headers: {
      get: (k) => headersMap.get(String(k).toLowerCase()) ?? null,
    },
    async arrayBuffer() {
      return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    },
  };
}

function withTempDir(prefix, fn) {
  const dir = mkdtempSync(path.join(os.tmpdir(), prefix));
  try {
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

async function withTempDirAsync(prefix, fn) {
  const dir = mkdtempSync(path.join(os.tmpdir(), prefix));
  try {
    return await fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function parseSections(html) {
  const tokenRe = /<\/?section\b([^>]*)>/gi;
  const stack = [];
  const roots = [];
  for (const match of html.matchAll(tokenRe)) {
    const tag = match[0];
    const attrs = match[1] || "";
    const isClose = tag.startsWith("</");
    if (!isClose) {
      const styleMatch = attrs.match(/\bstyle\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
      const node = {
        start: match.index,
        openEnd: match.index + tag.length,
        end: -1,
        style: styleMatch ? (styleMatch[1] ?? styleMatch[2] ?? "") : "",
        children: [],
        innerHtml: "",
      };
      if (stack.length > 0) {
        stack[stack.length - 1].children.push(node);
      } else {
        roots.push(node);
      }
      stack.push(node);
    } else {
      assert.ok(stack.length > 0, "Unbalanced </section>");
      const node = stack.pop();
      node.end = match.index + tag.length;
      node.innerHtml = html.slice(node.openEnd, match.index);
    }
  }
  assert.equal(stack.length, 0, "Unclosed <section>");
  return roots;
}

const validators = createIndependentValidators();
const whitelist = loadWhitelistMap();

describe("LD-G2-06 Cross-Test Suite 1: 3-Day Dual-Track Trial Bundles (Testing Seam 1)", () => {
  it("validates all 3 bundles (24 items) independently with Ajv/ajv-formats, whitelist alignment, article-level HTTPS URLs, Option B key_points, fact_tier, sentinel ratio & zero fulltext", () => {
    const disallowedSectionPaths = new Set([
      "",
      "/",
      "/blog",
      "/blog/",
      "/news",
      "/news/",
      "/feed",
      "/feed/",
      "/updates",
      "/updates/",
      "/law-reviews",
      "/law-reviews/",
      "/fabu.html",
      "/en/institute",
      "/en/policies/ai-office",
      "/api/v1/items",
    ]);

    let totalItems = 0;

    for (const date of TRIAL_DATES) {
      const filePath = path.join(REPO_ROOT, "data/bundles", `${date}.json`);
      assert.equal(existsSync(filePath), true, `Missing bundle ${filePath}`);
      const bundle = JSON.parse(readFileSync(filePath, "utf8"));

      assert.equal(
        validators.dailyBundle(bundle),
        true,
        `${date} failed independent Ajv DailyBundle schema: ${JSON.stringify(validators.dailyBundle.errors)}`,
      );
      assert.deepEqual(
        findForbiddenKeysRecursive(bundle),
        [],
        `${date} contains forbidden fulltext keys`,
      );
      assert.deepEqual(scanForbiddenFulltextKeys(bundle), []);

      assert.equal(bundle.meta.date, date);
      assert.equal(bundle.items.length, 8, `${date} expected 8 items`);
      totalItems += bundle.items.length;

      const regions = new Set(bundle.items.map((i) => i.region));
      assert.equal(regions.has("cn"), true, `${date} missing cn track`);
      assert.equal(regions.has("global"), true, `${date} missing global track`);

      const cats = new Set(bundle.items.map((i) => i.category));
      for (const c of OFFICIAL_CATEGORIES) {
        assert.equal(cats.has(c), true, `${date} missing category ${c}`);
      }

      for (const item of bundle.items) {
        assert.equal(
          validators.candidateItem(item),
          true,
          `${item.id} failed independent Ajv CandidateItem schema: ${JSON.stringify(validators.candidateItem.errors)}`,
        );

        const wlEntry = whitelist.byId.get(item.source_id);
        assert.ok(wlEntry, `${item.id}: source_id "${item.source_id}" not in whitelist`);
        assert.equal(
          item.region,
          wlEntry.region,
          `${item.id}: region "${item.region}" != whitelist region "${wlEntry.region}"`,
        );

        assert.ok(
          item.source_url.startsWith("https://"),
          `${item.id}: source_url must be https://`,
        );
        const parsed = new URL(item.source_url);
        const host = parsed.hostname.toLowerCase();
        assert.equal(
          host === "aihot.news" || host.endsWith(".aihot.news"),
          false,
          `${item.id}: aihot.news prohibited as source_url`,
        );
        assert.equal(
          host === "example.com" || host.endsWith(".example.com"),
          false,
          `${item.id}: example.com prohibited as item source_url`,
        );
        assert.equal(
          whitelist.entryUrls.has(item.source_url.replace(/\/+$/, "")),
          false,
          `${item.id}: source_url must not be whitelist section/feed entry_url`,
        );
        assert.equal(
          disallowedSectionPaths.has(parsed.pathname),
          false,
          `${item.id}: source_url pathname "${parsed.pathname}" is not article-level`,
        );
        const pathSegments = parsed.pathname.split("/").filter(Boolean);
        assert.ok(
          pathSegments.length >= 2,
          `${item.id}: expected >=2 article path segments, got "${parsed.pathname}"`,
        );

        if (item.source_domain) {
          const dom = item.source_domain.toLowerCase();
          const bareHost = host.replace(/^www\./, "");
          const bareDom = dom.replace(/^www\./, "");
          assert.equal(
            bareHost,
            bareDom,
            `${item.id}: source_url host (${host}) incompatible with source_domain (${dom})`,
          );
        }

        // Summary 20-160 chars & Practice Impact Brief 10-60 chars
        assert.ok(
          item.summary.length >= 20 && item.summary.length <= 160,
          `${item.id}: summary length ${item.summary.length} out of [20, 160]`,
        );
        assert.ok(
          item.practice_impact_brief.length >= 10 &&
            item.practice_impact_brief.length <= 60,
          `${item.id}: practice_impact_brief length ${item.practice_impact_brief.length} out of [10, 60]`,
        );

        // Option B detail_analysis.key_points: 1-3 segments, total <= 600 chars, zero meta-annotations
        const kps = item.detail_analysis.key_points;
        assert.ok(
          Array.isArray(kps) && kps.length >= 1 && kps.length <= 3,
          `${item.id}: key_points count ${kps?.length} out of [1, 3]`,
        );
        let kpTotal = 0;
        for (const kp of kps) {
          assert.ok(kp.length >= 8 && kp.length <= 600);
          assert.equal(
            META_ANNOTATION_RE.test(kp),
            false,
            `${item.id}: key_points contains meta-annotation residue`,
          );
          kpTotal += kp.length;
        }
        assert.ok(
          kpTotal <= 600,
          `${item.id}: key_points total length ${kpTotal} exceeds 600`,
        );

        // Quotes & Commentary
        assert.ok(
          item.detail_analysis.evidence_quotes.length >= 1 &&
            item.detail_analysis.evidence_quotes.length <= 3,
        );
        for (const q of item.detail_analysis.evidence_quotes) {
          assert.ok(q.text.length >= 8 && q.text.length <= 150);
        }
        assert.ok(
          item.detail_analysis.legal_commentary.length >= 200 &&
            item.detail_analysis.legal_commentary.length <= 400,
        );

        // Fact tier & unverified compliance
        assert.ok(
          ["confirmed_fact", "official_data", "market_opinion"].includes(
            item.fact_tier,
          ),
        );
        assert.equal(typeof item.unverified, "boolean");
        if (item.fact_tier === "market_opinion") {
          assert.equal(
            item.unverified,
            true,
            `${item.id}: market_opinion item should carry unverified=true`,
          );
          assert.ok(
            typeof item.unverified_reason === "string" &&
              item.unverified_reason.length > 0,
            `${item.id}: unverified=true should record unverified_reason`,
          );
        }

        // High-risk effective_status & AI draft labeling consistency
        if (item.high_risk_legal) {
          assert.ok(
            EFFECTIVE_STATUS_ENUM.has(item.effective_status),
            `${item.id}: high_risk_legal item missing valid effective_status`,
          );
        }
        if (item.detail_analysis.ai_draft) {
          assert.ok(
            item.detail_analysis.legal_commentary.startsWith("【AI 初稿】"),
            `${item.id}: ai_draft=true legal_commentary must carry 【AI 初稿】 prefix`,
          );
        }
      }

      const sentinelCount = bundle.items.filter((i) => i.high_risk_legal).length;
      const ratio = sentinelCount / bundle.items.length;
      assert.ok(
        ratio >= 0.15 && ratio <= 0.25,
        `${date}: high-risk sentinel ratio ${(ratio * 100).toFixed(1)}% outside [15%, 25%]`,
      );
    }

    assert.equal(totalItems, 24, "Expected 24 total items across 3 trial bundles");
    const cacheGuard = checkNoTrackedRawCache(REPO_ROOT);
    assert.equal(cacheGuard.valid, true, JSON.stringify(cacheGuard));
    const allPublic = validateAllPublicOutputs(REPO_ROOT);
    assert.equal(allPublic.valid, true, JSON.stringify(allPublic));
    assert.equal(allPublic.filesChecked, 3);
  });
});

describe("LD-G2-06 Cross-Test Suite 2: Collection & Public Merge Pipeline (LD-G2-03)", () => {
  it("deduplicates duplicate URL, duplicate GUID, and cross-track same-event items while preferring global primary URL", () => {
    const primaryUrl = "https://digital-strategy.ec.europa.eu/en/policies/gpai-code-final";
    const cnCommentary = {
      id: "cn-kwm-cli-gpai",
      region: "cn",
      source_id: "cn-kwm-cli",
      guid: "cn-guid-gpai-01",
      source_url: "https://www.chinalawinsight.com/2026/11/eu-ai-act-gpai-review/",
      title: "金杜解读：欧盟人工智能法案通用人工智能行为准则最终版实务要点",
      summary: "剖析 European Union AI Act GPAI Code of Practice 合规影响。",
      fact_tier: "market_opinion",
    };
    const globalPrimary = {
      id: "global-eu-ai-office-gpai",
      region: "global",
      source_id: "eu-ai-office",
      guid: "eu-guid-gpai-01",
      source_url: primaryUrl,
      title: "European Union AI Act GPAI Code of Practice Final Release",
      summary: "EU AI Office publishes final General-Purpose AI Code of Practice.",
      fact_tier: "confirmed_fact",
    };
    const duplicateTrackingUrl = {
      ...globalPrimary,
      id: "global-eu-ai-office-dup-url",
      guid: "eu-guid-gpai-dup-url",
      source_url: `${primaryUrl}/?utm_source=newsletter&fbclid=xyz#section-1`,
    };
    const duplicateGuidDifferentUrl = {
      ...cnCommentary,
      id: "cn-junhe-dup-guid",
      source_id: "cn-junhe-reviews",
      guid: "eu-guid-gpai-01",
      source_url: "https://www.junhe.com/law-reviews/9999",
      title: "另一标题但命中同一 GUID 的重复条目",
    };

    // Order A: CN first, Global second
    const clustersOrderA = deduplicateCrossTrack([
      cnCommentary,
      globalPrimary,
      duplicateTrackingUrl,
      duplicateGuidDifferentUrl,
    ]);
    assert.equal(clustersOrderA.length, 1);
    assert.equal(clustersOrderA[0].item.region, "global");
    assert.equal(clustersOrderA[0].item.source_url, primaryUrl);
    assert.equal(clustersOrderA[0].cross_source_count, 3);
    assert.equal(clustersOrderA[0].merged_candidate_ids.length, 4);

    // Order B: Global first, CN second -> deterministic winner
    const clustersOrderB = deduplicateCrossTrack([
      globalPrimary,
      cnCommentary,
      duplicateTrackingUrl,
      duplicateGuidDifferentUrl,
    ]);
    assert.equal(clustersOrderB.length, 1);
    assert.equal(clustersOrderB[0].item.region, "global");
    assert.equal(clustersOrderB[0].item.source_url, primaryUrl);

    // Negative test: distinct events sharing only generic "AI" + "2026" must NOT merge
    const distinctCn = {
      id: "cn-distinct-1",
      region: "cn",
      source_id: "cn-cac-wxzw",
      source_url: "https://www.cac.gov.cn/2026-11/20/c_1001.htm",
      title: "2026年法律AI合规指南",
      summary: "2026年国内AI合规通知。",
      fact_tier: "confirmed_fact",
    };
    const distinctGlobal = {
      id: "gl-distinct-1",
      region: "global",
      source_id: "uk-ico-news",
      source_url: "https://ico.org.uk/news/2026/ai-data-guidance",
      title: "2026 Legal AI Data Protection Update",
      summary: "2026 global AI legal practice review.",
      fact_tier: "official_data",
    };
    assert.equal(deduplicateCrossTrack([distinctCn, distinctGlobal]).length, 2);
  });

  it("supports degraded execution when one track is missing or corrupted, and runs partial daily pipeline when one collector fails", async () => {
    await withTempDirAsync("lexai-xtest-degrade-", async (tmpRepo) => {
      const date = "2026-11-28";
      const nowIso = "2026-11-28T09:00:00Z";
      const sourcesDir = path.join(tmpRepo, "data", "sources");
      mkdirSync(sourcesDir, { recursive: true });

      // Provide ONLY whitelist-global.yaml (omit whitelist-cn.yaml so collect:cn fails)
      const glFeedUrl = "https://courts.example.org/feed/ai";
      const glArtUrl = "https://courts.example.org/opinions/2026/rule11-sanctions";
      writeFileSync(
        path.join(sourcesDir, "whitelist-global.yaml"),
        [
          'schema_version: "1.0"',
          "region: global",
          'updated_at: "2026-11-28"',
          'description: "cross-test fixture"',
          "sources:",
          "  - source_id: us-courtlistener",
          "    region: global",
          "    name: CourtListener AI 判例测试源",
          "    source_type: court_judiciary",
          "    language: en",
          "    jurisdiction: US",
          "    default_categories: [判例与学术]",
          "    fetch_mode: atom",
          `    entry_url: ${glFeedUrl}`,
          "    expected_domain: courts.example.org",
          "    authority_tier: T2",
          "    high_risk_default: true",
          "    discovery_only: false",
          "    status: active",
          '    verified_at: "2026-11-28"',
          '    verification_note: "cross-test offline fixture"',
        ].join("\n"),
        "utf8",
      );

      const stubFetch = async (url) =>
        makeMockResponse(
          `<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom"><title>CL</title><entry><id>cl-xtest-1</id><title>Federal Court Imposes Rule 11 Sanctions for AI Fabricated Citations</title><link href="${glArtUrl}"/><updated>2026-11-28T08:00:00Z</updated><summary>On 2026-11-28, the federal court issued an order enforcing strict Rule 11 citation verification duties when counsel rely on generative AI tools in filings.</summary></entry></feed>`,
          { contentType: "application/atom+xml", url },
        );

      const dailyRes = await runDailyPipeline({
        repoRoot: tmpRepo,
        date,
        nowIso,
        offline: true,
        fetchImpl: stubFetch,
        retries: 0,
        perSourceDelayMs: 0,
        fetchArticleBodyForFeeds: false,
      });

      assert.equal(dailyRes.status, "partial");
      assert.equal(dailyRes.errors.length, 1);
      assert.equal(dailyRes.errors[0].stage, "collect:cn");
      assert.equal(dailyRes.curated.degraded.missingTracks.includes("cn"), true);
      assert.ok(dailyRes.curated.bundle.meta.digest.includes("缺失轨=cn"));
      assert.equal(dailyRes.curated.bundle.items.length, 1);
      assert.equal(
        validators.dailyBundle(dailyRes.curated.bundle),
        true,
        JSON.stringify(validators.dailyBundle.errors),
      );
      assert.equal(
        validators.wechatTopicPool(dailyRes.curated.topicPool),
        true,
        JSON.stringify(validators.wechatTopicPool.errors),
      );

      // Corrupt global.json while cn.json is valid -> curate still degrades cleanly
      const candDir = path.join(tmpRepo, "data", "candidates", "2026-11-29");
      mkdirSync(candDir, { recursive: true });
      writeFileSync(path.join(candDir, "global.json"), "{not valid json", "utf8");
      const validCnCand = {
        id: "cn-cac-wxzw-xtest1",
        region: "cn",
        source_id: "cn-cac-wxzw",
        source_name: "中央网信办测试源",
        source_domain: "www.cac.gov.cn",
        source_url: "https://www.cac.gov.cn/2026-11/29/c_123456.htm",
        published_at: "2026-11-29",
        collected_at: "2026-11-29T08:00:00Z",
        category: "监管与合规",
        title: "网信办发布人工智能标识合规指引测试样例",
        summary: "网信办于 2026 年 11 月 29 日发布人工智能生成内容标识合规指引，要求服务提供者落实显式与隐式双轨标识。",
        practice_impact_brief: "法务须对照最新标识指引核查 AI 输出合规留痕。",
        practice_impact_is_ai_draft: true,
        fact_tier: "confirmed_fact",
        unverified: false,
        needs_human_check: false,
        high_risk_legal: true,
        effective_status: "guidance",
        headline: false,
        review_status: "pending_review",
      };
      writeFileSync(path.join(candDir, "cn.json"), JSON.stringify([validCnCand]), "utf8");

      const degradedCurate = await runCuratePipeline({
        repoRoot: tmpRepo,
        date: "2026-11-29",
        nowIso: "2026-11-29T09:00:00Z",
        candidatesDir: candDir,
        cacheDir: path.join(tmpRepo, ".cache", "raw"),
        bundlesDir: path.join(tmpRepo, "data", "bundles"),
        topicPoolDir: path.join(tmpRepo, "data", "topic-pool"),
        offline: true,
      });
      assert.deepEqual(degradedCurate.degraded.missingTracks, ["global(corrupted)"]);
      assert.equal(degradedCurate.bundle.items.length, 1);
      assert.equal(validators.dailyBundle(degradedCurate.bundle), true);
    });
  });

  it("routes high-heat (>=80), high-risk, multi-source & long-regulation items into wechat-topic-pool and filters low-heat routine items", () => {
    const baseItem = {
      id: "cn-aihot-heat-01",
      region: "cn",
      source_id: "aihot-news-discovery",
      discovered_via: "aihot-news-discovery",
      source_name: "智谱开放平台",
      source_url: "https://docs.bigmodel.cn/cn/update/glm-legal-ocr",
      published_at: "2026-11-28",
      collected_at: "2026-11-28T08:00:00Z",
      category: "实务与工具",
      title: "智谱发布法律合同印章识别工作流更新",
      summary: "智谱发布面向法律合同扫描件的 OCR 工作流能力更新，支持印章遮挡与表格核验。",
      practice_impact_brief: "律所可验证扫描合同印章自动比对工作流。",
      practice_impact_is_ai_draft: true,
      fact_tier: "market_opinion",
      unverified: true,
      needs_human_check: false,
      high_risk_legal: false,
      headline: false,
      review_status: "pending_review",
    };

    const pool = buildWechatTopicPool({
      nowIso: "2026-11-28T09:00:00Z",
      curatedClusters: [
        {
          item: baseItem,
          cross_source_count: 1,
          merged_candidate_ids: [baseItem.id],
          primary_source_urls: [baseItem.source_url],
          heat_score: 88,
          is_long_regulation: false,
        },
        {
          item: {
            ...baseItem,
            id: "global-ico-risk-01",
            region: "global",
            source_id: "uk-ico-news",
            source_url: "https://ico.org.uk/news/2026/11/agentic-ai-enforcement",
            title: "英国 ICO 发布高风险智能体执法指引",
            category: "监管与合规",
            high_risk_legal: true,
            effective_status: "guidance",
          },
          cross_source_count: 2,
          merged_candidate_ids: ["global-ico-risk-01", "cn-kwm-cli-ico"],
          primary_source_urls: [
            "https://ico.org.uk/news/2026/11/agentic-ai-enforcement",
            "https://www.chinalawinsight.com/2026/11/ico-agentic-ai",
          ],
          heat_score: null,
          is_long_regulation: true,
        },
        {
          item: {
            ...baseItem,
            id: "cn-low-heat-01",
            source_url: "https://sspai.com/post/99999",
            title: "常规低热度单源短讯不应入池",
          },
          cross_source_count: 1,
          merged_candidate_ids: ["cn-low-heat-01"],
          primary_source_urls: ["https://sspai.com/post/99999"],
          heat_score: 45,
          is_long_regulation: false,
        },
      ],
    });

    assert.equal(
      validators.wechatTopicPool(pool),
      true,
      JSON.stringify(validators.wechatTopicPool.errors),
    );
    assert.equal(pool.topics.length, 2, "Low-heat single-source item must not enter topic pool");
    assert.deepEqual(pool.topics[0].trigger_reasons, ["heat_or_controversy_threshold"]);
    assert.deepEqual(pool.topics[1].trigger_reasons, [
      "multi_source_cross_report",
      "high_risk_legal_tag",
      "long_regulation_split",
    ]);
  });

  it("enforces aihot.news discovery-only trace-back to links.original without copying AIHOT summary and honors 7-day cache TTL", async () => {
    await withTempDirAsync("lexai-xtest-aihot-", async (tmpDir) => {
      const cacheDir = path.join(tmpDir, "cache");
      const outDir = path.join(tmpDir, "candidates");
      const wlPath = path.join(tmpDir, "wl-cn.yaml");
      const itemsUrl = "https://aihot.news/api/v1/items";
      const hotUrl = "https://aihot.news/api/v1/hot-topics";
      const originUrl = "https://docs.example.org/cn/update/legal-ocr-2026";
      const noiseUrl = "https://tech.example.org/gaming-mouse-review";
      const canarySummary = "CANARY_FORBIDDEN_AIHOT_SUMMARY_DO_NOT_COPY";

      writeFileSync(
        wlPath,
        [
          'schema_version: "1.0"',
          "region: cn",
          'updated_at: "2026-11-28"',
          'description: "aihot xtest"',
          "sources:",
          "  - source_id: aihot-news-discovery",
          "    region: cn",
          "    name: AIHOT 热点聚合 API（仅线索发现）",
          "    source_type: authoritative_media",
          "    language: zh",
          "    jurisdiction: CN",
          "    default_categories: [实务与工具]",
          "    fetch_mode: discovery_api",
          `    entry_url: ${itemsUrl}`,
          "    expected_domain: aihot.news",
          "    authority_tier: T3",
          "    high_risk_default: false",
          "    discovery_only: true",
          '    compliance_redline: "仅限读取 links.original 线索并回溯一手官方原链独立抓取"',
          "    status: active",
          '    verified_at: "2026-11-28"',
          '    verification_note: "cross-test offline fixture"',
        ].join("\n"),
        "utf8",
      );

      const stubFetch = async (url) => {
        if (url === itemsUrl) {
          return makeMockResponse(
            JSON.stringify({
              items: [
                {
                  title: "CANARY_AIHOT_TITLE",
                  summary: canarySummary,
                  score: 91,
                  source: { name: "开放平台官方" },
                  published_at: "2026-11-28T07:00:00Z",
                  links: { original: originUrl },
                },
                {
                  title: "AIHOT 自指条目",
                  summary: canarySummary,
                  score: 95,
                  links: { original: "https://aihot.news/items/888" },
                },
                {
                  title: "游戏鼠标评测",
                  summary: "游戏外设评测",
                  score: 75,
                  links: { original: noiseUrl },
                },
              ],
            }),
            { contentType: "application/json", url },
          );
        }
        if (url === hotUrl) {
          return makeMockResponse(JSON.stringify({ items: [] }), {
            contentType: "application/json",
            url,
          });
        }
        if (url === noiseUrl) {
          return makeMockResponse(
            "<html><head><title>无线游戏鼠标拆解评测</title></head><body><article><p>本期测评两款轻量化无线游戏鼠标的微动寿命与电池续航表现。</p></article></body></html>",
            { url },
          );
        }
        return makeMockResponse(
          '<html><head><title>发布法律合同 OCR 与条款核验引擎 2.0</title><meta property="article:published_time" content="2026-11-28"></head><body><article><h1>发布法律合同 OCR 与条款核验引擎 2.0</h1><p>2026年11月28日，开放平台面向律所与企业法务推出合同扫描件印章核验与条款风险比对接口，支持百页尽调卷宗结构化抽取。</p></article></body></html>',
          { url },
        );
      };

      // Seed an expired (>7d) cache record to verify TTL pruning during collection
      const expired = writeRawCache({
        cacheDir,
        nowIso: "2026-11-18T00:00:00Z",
        item: {
          source_id: "cn-spc-fabu",
          region: "cn",
          source_url: "https://www.court.gov.cn/expired-test.html",
          title: "过期缓存清理测试条目",
          published_at: "2026-11-18",
          raw_text: "超过七天的缓存内容应当被自动清理。",
        },
      });
      assert.equal(existsSync(expired.cachePath), true);

      const res = await runRegionalCollector({
        region: "cn",
        date: "2026-11-28",
        nowIso: "2026-11-28T09:00:00Z",
        repoRoot: tmpDir,
        cacheDir,
        outputDir: outDir,
        whitelistPath: wlPath,
        fetchImpl: stubFetch,
        retries: 0,
        perSourceDelayMs: 0,
      });

      assert.equal(existsSync(expired.cachePath), false, "Expired >7d cache must be pruned");
      assert.equal(res.meta.cache_ttl_days, 7);
      assert.equal(res.meta.cache_pruned_count, 1);
      assert.equal(validators.collectMeta(res.meta), true);

      assert.equal(res.candidates.length, 1);
      const cand = res.candidates[0];
      assert.equal(cand.source_url, originUrl);
      assert.equal(cand.discovered_via, "aihot-news-discovery");
      assert.equal(cand.unverified, true);
      assert.equal(validators.candidateItem(cand), true);
      assert.deepEqual(findForbiddenKeysRecursive(cand), []);

      const cnJsonRaw = readFileSync(path.join(outDir, "cn.json"), "utf8");
      assert.equal(cnJsonRaw.includes(canarySummary), false);
      assert.equal(cnJsonRaw.includes("CANARY_AIHOT_TITLE"), false);
      assert.equal(cnJsonRaw.includes("aihot.news/items"), false);

      // Verify raw_text & heat_score live in local cacheDir and feed curate topicPool
      const curated = await runCuratePipeline({
        repoRoot: tmpDir,
        date: "2026-11-28",
        nowIso: "2026-11-28T09:05:00Z",
        candidatesDir: outDir,
        cacheDir,
        bundlesDir: path.join(tmpDir, "bundles"),
        topicPoolDir: path.join(tmpDir, "topic-pool"),
        offline: true,
      });
      assert.equal(curated.topicPool.topics.length, 1);
      assert.ok(
        curated.topicPool.topics[0].trigger_reasons.includes(
          "heat_or_controversy_threshold",
        ),
      );
      assert.equal(
        pruneExpiredCache({
          cacheDir,
          nowMs: Date.parse("2026-12-06T10:00:00Z"),
          ttlDays: 7,
        }) >= 1,
        true,
      );
    });
  });
});

describe("LD-G2-06 Cross-Test Suite 3: Dual-Layer Export CLI (LD-G2-05, Testing Seam 2)", () => {
  it("produces deterministic CLI outputs matching data/exports/ld-g2-05/manifest.json and D-030 WeChat / V16 Web compatibility", async () => {
    await withTempDirAsync("lexai-xtest-export-", async (tmpBase) => {
      const out1 = path.join(tmpBase, "run1");
      const out2 = path.join(tmpBase, "run2");
      const cliScript = path.join(REPO_ROOT, "src/export/dual-export.mjs");
      const bundlesDir = path.join(REPO_ROOT, "data/bundles");

      execFileSync(
        process.execPath,
        [cliScript, "--in-dir", bundlesDir, "--out-dir", out1, "--approved-only"],
        { cwd: REPO_ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
      );
      execFileSync(
        process.execPath,
        [cliScript, "--in-dir", bundlesDir, "--out-dir", out2, "--approved-only"],
        { cwd: REPO_ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
      );

      const committedManifest = JSON.parse(
        readFileSync(
          path.join(REPO_ROOT, "data/exports/ld-g2-05/manifest.json"),
          "utf8",
        ),
      );
      const manifest1 = JSON.parse(
        readFileSync(path.join(out1, "manifest.json"), "utf8"),
      );
      const manifest2 = JSON.parse(
        readFileSync(path.join(out2, "manifest.json"), "utf8"),
      );

      assert.deepEqual(manifest1, manifest2);
      assert.deepEqual(manifest1, committedManifest);
      assert.equal(manifest1.webIndexSha256, EXPECTED_WEB_INDEX_SHA256);

      const idx1Hash = sha256File(path.join(out1, "web/editions-index.json"));
      const idx2Hash = sha256File(path.join(out2, "web/editions-index.json"));
      assert.equal(idx1Hash, idx2Hash);
      assert.equal(idx1Hash, EXPECTED_WEB_INDEX_SHA256);

      for (const ed of committedManifest.editions) {
        const html1Path = path.join(out1, ed.wechatHtml);
        const html2Path = path.join(out2, ed.wechatHtml);
        const web1Path = path.join(out1, ed.webJson);
        const web2Path = path.join(out2, ed.webJson);

        assert.equal(sha256File(html1Path), sha256File(html2Path));
        assert.equal(sha256File(html1Path), ed.wechatSha256);
        assert.equal(sha256File(web1Path), sha256File(web2Path));
        assert.equal(sha256File(web1Path), ed.webSha256);

        // WeChat D-030 & Gate 1 structural assertions
        const html = readFileSync(html1Path, "utf8");
        for (const [label, pattern] of [
          ["<table>", /<table[\s>]|<\/table>|<tr[\s>]|<td[\s>]/i],
          ["<a href>", /<a[\s>]|\bhref\s*=/i],
          ["<style>", /<style[\s>]|<\/style>/i],
          ["<script>", /<script[\s>]|<\/script>/i],
          ["class=", /\sclass\s*=/i],
          ["<link>", /<link[\s>]/i],
          ["@font-face", /@font-face/i],
          ["backdrop-filter", /backdrop-filter/i],
          ["box-shadow", /box-shadow/i],
          ["border-radius", /border-radius/i],
        ]) {
          assert.equal(
            pattern.test(html),
            false,
            `${ed.wechatHtml}: contains forbidden ${label}`,
          );
        }

        const htmlMatch = html.match(/<html\b[^>]*\bstyle="([^"]*)"/i);
        const bodyMatch = html.match(/<body\b[^>]*\bstyle="([^"]*)"/i);
        assert.ok(htmlMatch && /background-color:\s*#D5C5AE/i.test(htmlMatch[1]));
        assert.ok(bodyMatch && /background-color:\s*#D5C5AE/i.test(bodyMatch[1]));
        const roots = parseSections(html);
        assert.equal(roots.length, 1);
        assert.match(roots[0].style, /background-color:\s*#D5C5AE/i);
        for (const block of roots[0].children) {
          assert.match(block.style, /background-color:\s*#D5C5AE/i);
          assert.match(block.style, /margin:\s*0\b/i);
        }
        assert.ok(html.includes("今日综述"));
        assert.ok(html.includes("本期目录 · CONTENTS"));
        assert.ok(html.includes("阅读原文"));
        assert.equal((html.match(/插画由 AI 生成/g) || []).length, 5);
        assert.equal((html.match(/实务影响<span[^>]*>\s*·?\s*AI 初稿<\/span>/g) || []).length, 8);
        assert.equal(html.includes("本评述为 AI 初稿"), false, "WeChat HTML must not leak detail legal_commentary");

        // Web JSON compatibility with V16 prototype + Gate 2 detail layer
        const webEd = JSON.parse(readFileSync(web1Path, "utf8"));
        assert.deepEqual(findForbiddenKeysRecursive(webEd), []);
        assert.equal(webEd.isWeekly, false);
        assert.ok(typeof webEd.vol === "string" && webEd.vol.startsWith("VOL."));
        assert.ok(typeof webEd.label === "string" && webEd.label.length > 0);
        assert.ok(typeof webEd.digest === "string" && webEd.digest.length > 0);
        assert.equal(webEd.items.length, ed.itemCount);
        for (const item of webEd.items) {
          for (const reqKey of [
            "id",
            "badge",
            "badgeOutline",
            "category",
            "factLevel",
            "placeholder",
            "sourceDomain",
            "date",
            "title",
            "summary",
            "impact",
            "sourceUrl",
            "detail_analysis",
          ]) {
            assert.ok(
              Object.prototype.hasOwnProperty.call(item, reqKey),
              `${ed.date} Web item ${item.id} missing V16/Gate2 key "${reqKey}"`,
            );
          }
          assert.ok(OFFICIAL_CATEGORIES.includes(item.category));
          assert.ok(["官方数据", "已证实事实", "市场观点"].includes(item.factLevel));
          assert.equal(item.placeholder, false);
          assert.ok(Array.isArray(item.impact) && item.impact.length === 1);
          assert.ok(item.sourceUrl.startsWith("https://"));
          assert.ok(item.detail_analysis.key_points.length >= 1);
          assert.ok(item.detail_analysis.evidence_quotes.length >= 1);
          assert.ok(item.detail_analysis.legal_commentary.length >= 200);
        }
      }

      // V16 prototype HTML check + editions-index.json structure check
      const prototypeHtml = readFileSync(
        path.join(REPO_ROOT, "design/prototype/index.html"),
        "utf8",
      );
      for (const expectedSymbol of [
        "RECENT_KEYS",
        "WEEKLY_ARCHIVE_KEYS",
        "EDITIONS",
        "ed.isWeekly",
        "weekEd.rangeText",
        "item.badgeOutline",
        "item.factLevel",
        "item.sourceDomain",
        "item.impact",
      ]) {
        assert.ok(
          prototypeHtml.includes(expectedSymbol),
          `V16 prototype missing expected field reference: ${expectedSymbol}`,
        );
      }

      const editionsIndex = JSON.parse(
        readFileSync(path.join(out1, "web/editions-index.json"), "utf8"),
      );
      assert.deepEqual(findForbiddenKeysRecursive(editionsIndex), []);
      assert.deepEqual(editionsIndex.recent_keys, [
        "2026-11-26",
        "2026-11-25",
        "2026-11-24",
      ]);
      assert.deepEqual(editionsIndex.weekly_archive_keys, ["2026-W48"]);
      const weeklyEd = editionsIndex.editions["2026-W48"];
      assert.equal(weeklyEd.isWeekly, true);
      assert.equal(weeklyEd.label, "W48 精选");
      assert.equal(weeklyEd.rangeText, "2026-W48 · 11/24–11/26");
      assert.equal(weeklyEd.items.length, 6);
      for (const wItem of weeklyEd.items) {
        assert.equal(wItem.badge, "周度精选");
        assert.equal(wItem.headline || wItem.highRiskLegal, true);
      }
    });
  });

  it("enforces --approved-only filtering and fail-closed CLI/API guardrails for pending-only, unregistered whitelist, empty repoRoot, and bypass flags", () => {
    withTempDir("lexai-xtest-failclosed-", (tmpDir) => {
      const cliScript = path.join(REPO_ROOT, "src/export/dual-export.mjs");
      const baseBundle = JSON.parse(
        readFileSync(path.join(REPO_ROOT, "data/bundles/2026-11-24.json"), "utf8"),
      );

      // 1. Mixed review_status bundle with --approved-only exports ONLY approved items
      const mixedBundle = structuredClone(baseBundle);
      mixedBundle.items[1].review_status = "pending_review";
      mixedBundle.items[2].review_status = "rejected";
      const mixedPath = path.join(tmpDir, "mixed.json");
      writeFileSync(mixedPath, JSON.stringify(mixedBundle, null, 2), "utf8");
      const mixedOut = path.join(tmpDir, "mixed-out");
      execFileSync(
        process.execPath,
        [cliScript, "--in", mixedPath, "--out-dir", mixedOut, "--approved-only"],
        { cwd: REPO_ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
      );
      const exportedMixed = JSON.parse(
        readFileSync(path.join(mixedOut, "web/2026-11-24.json"), "utf8"),
      );
      assert.equal(exportedMixed.items.length, 6);
      assert.equal(
        exportedMixed.items.every((it) => it.reviewStatus === "approved"),
        true,
      );

      // 2. All pending_review + --approved-only fails closed via CLI and leaves zero dirs
      const allPending = structuredClone(baseBundle);
      for (const it of allPending.items) {
        it.review_status = "pending_review";
        it.headline = false;
        it.practice_impact_is_ai_draft = true;
        it.detail_analysis.ai_draft = true;
      }
      const allPendingPath = path.join(tmpDir, "all-pending.json");
      writeFileSync(allPendingPath, JSON.stringify(allPending, null, 2), "utf8");
      const pendingOut = path.join(tmpDir, "pending-out");
      assert.throws(() =>
        execFileSync(
          process.execPath,
          [cliScript, "--in", allPendingPath, "--out-dir", pendingOut, "--approved-only"],
          { cwd: REPO_ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
        ),
      );
      assert.equal(existsSync(pendingOut), false);

      // 3. Unregistered whitelist source_id fails closed via CLI
      const badWl = structuredClone(baseBundle);
      badWl.items[0].source_id = "unregistered-xtest-source";
      const badWlPath = path.join(tmpDir, "bad-wl.json");
      writeFileSync(badWlPath, JSON.stringify(badWl, null, 2), "utf8");
      const badWlOut = path.join(tmpDir, "bad-wl-out");
      assert.throws(() =>
        execFileSync(
          process.execPath,
          [cliScript, "--in", badWlPath, "--out-dir", badWlOut],
          { cwd: REPO_ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
        ),
      );
      assert.equal(existsSync(badWlOut), false);

      // 4. Bypass flag --skip-whitelist-check fails closed via CLI
      const bypassOut = path.join(tmpDir, "bypass-out");
      assert.throws(() =>
        execFileSync(
          process.execPath,
          [
            cliScript,
            "--in",
            badWlPath,
            "--out-dir",
            bypassOut,
            "--skip-whitelist-check",
          ],
          { cwd: REPO_ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
        ),
      );
      assert.equal(existsSync(bypassOut), false);

      // 5. Empty repoRoot fails closed via exportDualLayer API
      const emptyRepo = path.join(tmpDir, "empty-repo");
      mkdirSync(emptyRepo, { recursive: true });
      const emptyRepoOut = path.join(tmpDir, "empty-repo-out");
      assert.throws(
        () =>
          exportDualLayer({
            bundlePaths: [path.join(REPO_ROOT, "data/bundles/2026-11-24.json")],
            outDir: emptyRepoOut,
            repoRoot: emptyRepo,
          }),
        /白名单文件缺失或为空/,
      );
      assert.equal(existsSync(emptyRepoOut), false);

      // 6. Forbidden fulltext key & aihot.news source_url fail closed via CLI
      const leakedFulltext = structuredClone(baseBundle);
      leakedFulltext.items[0].detail_analysis.bodyHtml = "<p>leak</p>";
      const leakPath = path.join(tmpDir, "leak.json");
      writeFileSync(leakPath, JSON.stringify(leakedFulltext, null, 2), "utf8");
      const leakOut = path.join(tmpDir, "leak-out");
      assert.throws(() =>
        execFileSync(
          process.execPath,
          [cliScript, "--in", leakPath, "--out-dir", leakOut],
          { cwd: REPO_ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
        ),
      );
      assert.equal(existsSync(leakOut), false);
    });
  });
});
