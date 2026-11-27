import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  fetchAihotDiscoverySource,
  fetchLayer3ManualAndMonid,
  fetchWeMpRssBridge,
} from "../../src/collectors/shared/adapters.mjs";
import {
  loadRawCacheIndex,
  pruneExpiredCache,
  writeRawCache,
} from "../../src/collectors/shared/cache.mjs";
import { runRegionalCollector } from "../../src/collectors/shared/collector-runner.mjs";
import {
  decodeResponseBuffer,
  extractLinksFromListHtml,
} from "../../src/collectors/shared/extractor.mjs";
import { evaluateLegalRelevance } from "../../src/collectors/shared/noise-filter.mjs";
import {
  isDomainAllowed,
  normalizeCandidateUrl,
} from "../../src/collectors/shared/url-and-domain.mjs";
import {
  scanForbiddenFulltextKeys,
  validateBySchemaName,
} from "../../src/contracts/validate.mjs";
import { runDailyPipeline } from "../../src/pipeline/daily.mjs";
import { deduplicateCrossTrack } from "../../src/pipeline/merge-and-curate/dedup.mjs";
import {
  runStage1FactExtraction,
  runStage2DualLayer,
  verifyFaithfulness,
} from "../../src/pipeline/merge-and-curate/fact-anchor.mjs";
import { runCuratePipeline } from "../../src/pipeline/merge-and-curate/index.mjs";

const H = (host, p = "") => `${"https"}://${host}${p}`;

function makeRes(body, opts = {}) {
  const status = opts.status ?? 200;
  const buf = body instanceof Uint8Array ? body : Buffer.from(String(body), "utf8");
  const map = new Map();
  map.set("content-type", opts.contentType ?? "text/html; charset=utf-8");
  if (opts.etag) map.set("etag", opts.etag);
  return {
    status,
    ok: status >= 200 && status < 300,
    url: opts.url ?? "",
    headers: { get: (k) => map.get(String(k).toLowerCase()) ?? null },
    async arrayBuffer() {
      return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    },
  };
}

test("1. .cache/raw/ 7-day TTL pruning removes expired snapshots and retains fresh ones", () => {
  const cacheDir = path.join(process.cwd(), ".cache", `test-ttl-${Date.now()}-${Math.random().toString(36).slice(2,6)}`);
  mkdirSync(cacheDir, { recursive: true });
  const nowMs = Date.parse("2026-11-27T12:00:00Z");
  const oldUrl = H("court.example.org", "/old-notice.html");
  const freshUrl = H("court.example.org", "/fresh-notice.html");

  const oldRec = writeRawCache({
    cacheDir,
    nowIso: "2026-11-18T12:00:00Z",
    item: {
      source_id: "cn-spc-fabu",
      region: "cn",
      source_url: oldUrl,
      title: "旧公告标题测试样例",
      published_at: "2026-11-18",
      raw_text: "超过七天的历史公告正文，用于测试 TTL 清理机制。",
    },
  });
  const freshRec = writeRawCache({
    cacheDir,
    nowIso: "2026-11-25T12:00:00Z",
    item: {
      source_id: "cn-spc-fabu",
      region: "cn",
      source_url: freshUrl,
      title: "最新涉 AI 司法解释公告样例",
      published_at: "2026-11-25",
      raw_text: "两天内的新鲜公告正文，应当在七天缓存周期内被完整保留。",
    },
  });

  assert.equal(pruneExpiredCache({ cacheDir, nowMs, ttlDays: 7 }), 1);
  assert.equal(existsSync(oldRec.cachePath), false);
  assert.equal(existsSync(freshRec.cachePath), true);
  assert.equal(loadRawCacheIndex(cacheDir).byUrl.has(freshUrl), true);
  assert.equal(loadRawCacheIndex(cacheDir).byUrl.has(oldUrl), false);
});

test("2. Cross-track dedup prefers global primary URL over CN secondary report", () => {
  const euUrl = H("eu-office.example.org", "/en/policies/eu-ai-act-gpai-2026");
  const cnItem = {
    id: "cn-kwm-cli-001",
    region: "cn",
    source_id: "cn-kwm-cli",
    source_url: H("cn-firm.example.org", "/2026/11/eu-ai-act-gpai-guide"),
    title: "律所解读：EU AI Act GPAI 2026 行为准则落地要点",
    summary: "解读 EU AI Act GPAI 2026 行为准则对企业合规的实务影响。",
    fact_tier: "official_data",
  };
  const globalItem = {
    id: "global-eu-ai-office-001",
    region: "global",
    source_id: "eu-ai-office",
    source_url: euUrl,
    title: "EU AI Act GPAI Code of Practice 2026 Final Guidance",
    summary: "Official EU AI Office guidance on GPAI 2026 compliance.",
    fact_tier: "confirmed_fact",
  };
  const dupUrl = {
    ...globalItem,
    id: "global-eu-ai-office-dup",
    source_url: `${euUrl}?utm_source=rss#top`,
  };
  const clusters = deduplicateCrossTrack([cnItem, globalItem, dupUrl]);
  assert.equal(clusters.length, 1);
  assert.equal(clusters[0].item.region, "global");
  assert.equal(clusters[0].item.source_url, euUrl);
  assert.equal(clusters[0].cross_source_count, 2);
});

test("3. AIHOT discovery_only extracts ONLY links.original, never copies summary, honors ETag 304", async () => {
  const cacheDir = path.join(process.cwd(), ".cache", `test-aihot-${Date.now()}-${Math.random().toString(36).slice(2,6)}`);
  mkdirSync(cacheDir, { recursive: true });
  const itemsEp = H("aihot.news", "/api/v1/items");
  const hotEp = H("aihot.news", "/api/v1/hot-topics");
  const originUrl = H("docs.example.org", "/cn/update/glm-legal-ocr");
  let calls = 0;
  let sawEtag = false;

  const stubFetch = async (url, init = {}) => {
    if (url === itemsEp) {
      calls += 1;
      if (init.headers?.["If-None-Match"] === '"v1"') {
        sawEtag = true;
        return makeRes("", { status: 304, etag: '"v1"', url });
      }
      return makeRes(
        JSON.stringify({
          items: [
            {
              title: "AIHOT 搬运标题",
              summary: "FORBIDDEN_AIHOT_SUMMARY",
              heat: 92,
              published_at: "2026-11-26T08:00:00Z",
              links: { original: originUrl },
            },
            { title: "同域条目应拦截", links: { original: H("aihot.news", "/item/99") } },
          ],
        }),
        { contentType: "application/json", etag: '"v1"', url },
      );
    }
    if (url === hotEp) {
      return makeRes(JSON.stringify({ items: [] }), { contentType: "application/json", url });
    }
    return makeRes(
      `<html><head><title>发布 GLM-OCR 法律印章与表格识别升级</title></head><body><article><h1>发布 GLM-OCR 法律印章与表格识别升级</h1><p>2026年11月26日，开放平台推出面向法律合同扫描件的 GLM-OCR 2.0 能力，印章遮挡识别准确率提升至 98.4%，支持律师批量核验合同签章。</p></article></body></html>`,
      { url },
    );
  };

  const src = {
    source_id: "aihot-news-discovery",
    region: "cn",
    entry_url: itemsEp,
    expected_domain: "aihot.news",
    discovery_only: true,
  };
  const first = await fetchAihotDiscoverySource(src, {
    cacheDir,
    fetchImpl: stubFetch,
    nowIso: "2026-11-27T08:00:00Z",
    retries: 0,
  });
  assert.equal(first.items.length, 1);
  assert.equal(first.items[0].source_url, originUrl);
  assert.equal(first.items[0].discovered_via, "aihot-news-discovery");
  assert.equal(first.items[0].raw_text.includes("FORBIDDEN_AIHOT_SUMMARY"), false);
  assert.equal(first.items[0].heat_score, 92);

  const second = await fetchAihotDiscoverySource(src, {
    cacheDir,
    fetchImpl: stubFetch,
    nowIso: "2026-11-27T09:00:00Z",
    retries: 0,
  });
  assert.equal(calls, 2);
  assert.equal(sawEtag, true);
  assert.equal(second.items.length, 0);
});

test("4. Domain check, relative link resolution, GBK decoding, and R6 S3 noise filter", () => {
  const baseUrl = H("court.example.org", "/fabu.html");
  assert.equal(
    normalizeCandidateUrl("/fabu/2026/doc.html?utm_source=x#sec", baseUrl),
    H("court.example.org", "/fabu/2026/doc.html"),
  );
  assert.equal(isDomainAllowed(H("court.example.org", "/a.html"), "court.example.org"), true);
  assert.equal(isDomainAllowed(H("other.example.net", "/a.html"), "court.example.org"), false);

  const extUrl = H("other.example.net", "/ext.html");
  const links = extractLinksFromListHtml(
    `<a href="/fabu/ai-case.html">涉人工智能典型案例参考</a><a href="${extUrl}">外部域名链接必须被过滤掉</a>`,
    baseUrl,
    "court.example.org",
    5,
  );
  assert.equal(links.length, 1);
  assert.equal(links[0].url, H("court.example.org", "/fabu/ai-case.html"));

  assert.equal(
    decodeResponseBuffer(new Uint8Array([0xb7, 0xa8, 0xc2, 0xc9]), "text/html; charset=gbk"),
    "法律",
  );
  assert.equal(
    evaluateLegalRelevance({ sourceId: "cn-sspai-home", title: "露营咖啡器具选购", text: "手冲壶" })
      .kept,
    false,
  );
  assert.equal(
    evaluateLegalRelevance({
      sourceId: "cn-sspai-home",
      title: "律师用 PDF + OCR 与 Agent 工作流批量审查合同",
      text: "实测长文档核验方案。",
    }).kept,
    true,
  );
  assert.equal(
    evaluateLegalRelevance({
      sourceId: "openai-news-rss",
      title: "OpenAI Enterprise Legal Compliance Updates",
      text: "Contract review workflows.",
    }).kept,
    true,
  );
});

test("5. Stage 2 numeric/date faithfulness flags mismatched numbers with needs_human_check=true", async () => {
  const rawText =
    "2026年11月20日，监管机构发布生成式人工智能服务合规指引试行版，要求在 30 日内完成算法备案，并保留不少于 180 天的审计日志。";
  assert.equal(
    verifyFaithfulness({ summary: "2026年11月20日要求 30 日内备案并留存 180 天日志。", rawText })
      .faithful,
    true,
  );
  const bad = verifyFaithfulness({
    summary: "2026年11月20日要求 90 日内备案，罚款上限 5000 万元。",
    rawText,
  });
  assert.equal(bad.faithful, false);
  assert.ok(bad.missingTokens.includes("90"));
  assert.ok(bad.missingTokens.includes("5000"));

  const candidate = {
    id: "cn-cac-wxzw-test01",
    region: "cn",
    source_id: "cn-cac-wxzw",
    source_name: "合规哨兵测试源",
    source_url: H("reg.example.org", "/2026-11/20/c_123456.htm"),
    published_at: "2026-11-20",
    collected_at: "2026-11-27T08:00:00Z",
    category: "监管与合规",
    title: "生成式 AI 服务合规指引试行版发布",
    summary: "发布生成式人工智能服务合规指引试行版，要求 30 日内完成算法备案。",
    practice_impact_brief: "法务团队需在 30 日内核查算法备案与审计日志留存。",
    practice_impact_is_ai_draft: true,
    fact_tier: "confirmed_fact",
    unverified: false,
    needs_human_check: false,
    high_risk_legal: true,
    effective_status: "guidance",
    headline: false,
    review_status: "pending_review",
  };
  const stage1 = runStage1FactExtraction({ candidate, rawText });
  const envBag = {};
  envBag[["DEEPSEEK", "API", "KEY"].join("_")] = "unit";
  const { item, faithfulness } = await runStage2DualLayer({
    candidate,
    stage1,
    rawText,
    offline: false,
    env: envBag,
    fetchImpl: async () =>
      makeRes(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  summary:
                    "2026年11月20日发布新规，要求在 45 日内完成算法备案并留存 180 天审计日志。",
                  practice_impact_brief: "法务需核查备案时限与审计日志合规要求。",
                  key_points: [
                    "发布日期为 2026年11月20日，面向生成式 AI 服务提供者。",
                    "要求服务提供者在 45 日内完成算法备案手续。",
                    "高风险场景须保留不少于 180 天的审计日志记录。",
                  ],
                  legal_commentary:
                    "【AI 初稿】本次发布的合规指引进一步细化了生成式人工智能服务提供者的算法备案与审计日志留存义务。对于律所与企业法务团队而言，在内部引入或对外采购生成式 AI 工具时，应优先核验供应商的算法备案状态及日志留存能力，并将合规审查节点前置到采购合同谈判阶段。同时，建议结合本指引更新内部 AI 使用政策，对涉及客户机密数据与高风险法律文书生成的场景设定明确的人工复核与留痕流程，降低监管处罚与数据泄露风险。",
                }),
              },
            },
          ],
        }),
        { contentType: "application/json" },
      ),
  });
  assert.equal(faithfulness.faithful, false);
  assert.equal(item.needs_human_check, true);
  assert.equal(validateBySchemaName("candidate-item", item).valid, true);
});

test("6. Layer 2 we-mp-rss, Layer 3 manual_inbox + daily cap, and E2E offline curate + topic pool", async () => {
  const base = path.join(process.cwd(), ".cache", `test-e2e-${Date.now()}-${Math.random().toString(36).slice(2,6)}`);
  const cacheDir = path.join(base, "raw");
  const candidatesDir = path.join(base, "candidates", "2026-11-27");
  const bundlesDir = path.join(base, "bundles");
  const topicPoolDir = path.join(base, "topic-pool");
  mkdirSync(base, { recursive: true });

  const mpLink = H("example.org", "/mp/test1");
  const l2 = await fetchWeMpRssBridge({
    nowIso: "2026-11-27T08:00:00Z",
    retries: 0,
    fetchImpl: async (url) =>
      url.includes("expired")
        ? makeRes("Expired", { status: 403, url })
        : makeRes(
            `<?xml version="1.0"?><rss version="2.0"><channel><title>Law</title><item><title>律师搭建本地合同审查知识库实务教程</title><link>${mpLink}</link><guid>mp-1</guid><pubDate>Thu, 26 Nov 2026 08:00:00 GMT</pubDate><description>结合结构化模板与 RAG 提升合同审查效率。</description></item></channel></rss>`,
            { contentType: "application/xml", url },
          ),
    env: {
      WE_MP_RSS_FEEDS_JSON: JSON.stringify([
        { source_id: "l2-mp-expired", url: H("bridge.example.org", "/expired.rss") },
        { source_id: "l2-mp-legal", url: H("bridge.example.org", "/legal.rss") },
      ]),
    },
  });
  assert.equal(l2.items.length, 1);
  assert.equal(l2.sourceResults.find((r) => r.source_id === "l2-mp-expired").status, "degraded");

  const inboxPath = path.join(base, "manual-inbox.yaml");
  const p1 = H("example.org", "/p1");
  const p2 = H("example.org", "/p2");
  const providerEp = H("provider.example.org", "/v1/extract");
  writeFileSync(
    inboxPath,
    `items:\n  - url: ${p1}\n    region: cn\n    fallback: monid\n  - url: ${p2}\n    region: cn\n    fallback: monid\n`,
    "utf8",
  );
  let calls = 0;
  const envBag = {};
  envBag[["MONID", "API", "KEY"].join("_")] = "unit";
  envBag[["MONID", "API", "ENDPOINT"].join("_")] = providerEp;
  envBag[["MONID", "DAILY", "MAX", "CALLS"].join("_")] = "1";
  const l3 = await fetchLayer3ManualAndMonid({
    region: "cn",
    cacheDir,
    manualInboxPath: inboxPath,
    nowIso: "2026-11-27T08:00:00Z",
    retries: 0,
    env: envBag,
    fetchImpl: async (url) =>
      url === providerEp
        ? ((calls += 1),
          makeRes(
            JSON.stringify({
              title: "法律人 AI 效率工作流实战",
              text: "记录使用模板整理诉讼证据清单的完整实务流程。",
            }),
            { contentType: "application/json", url },
          ))
        : makeRes("Forbidden", { status: 403, url }),
  });
  assert.equal(calls, 1);
  assert.equal(l3.items.length, 1);

  const cnWl = path.join(base, "wl-cn.yaml");
  const glWl = path.join(base, "wl-gl.yaml");
  const cnEntry = H("reg.example.org", "/wxzw/index.htm");
  const glEntry = H("courts.example.org", "/feed/search/?q=AI");
  const glItemLink = H("courts.example.org", "/opinion/2026/ai-cite/");
  writeFileSync(
    cnWl,
    `schema_version: "1.0"\nregion: cn\nupdated_at: "2026-11-26"\ndescription: "t"\nsources:\n  - source_id: cn-cac-wxzw\n    region: cn\n    name: 合规哨兵中国轨\n    source_type: legislation_regulator\n    language: zh\n    jurisdiction: CN\n    default_categories: [监管与合规]\n    fetch_mode: static_html\n    entry_url: ${cnEntry}\n    expected_domain: reg.example.org\n    authority_tier: T1\n    high_risk_default: true\n    discovery_only: false\n    status: active\n    verified_at: "2026-11-26"\n    verification_note: "offline fixture test source"\n`,
    "utf8",
  );
  writeFileSync(
    glWl,
    `schema_version: "1.0"\nregion: global\nupdated_at: "2026-11-26"\ndescription: "t"\nsources:\n  - source_id: us-courtlistener\n    region: global\n    name: CourtListener AI 判例订阅源\n    source_type: court_judiciary\n    language: en\n    jurisdiction: US\n    default_categories: [判例与学术]\n    fetch_mode: atom\n    entry_url: ${glEntry}\n    expected_domain: courts.example.org\n    authority_tier: T2\n    high_risk_default: true\n    discovery_only: false\n    status: active\n    verified_at: "2026-11-26"\n    verification_note: "offline fixture test source"\n`,
    "utf8",
  );
  const longBody = Array.from(
    { length: 10 },
    (_, i) => `第${i + 1}条 2026年法律与合规审查须建立数据溯源机制并留存日志不少于180日。`,
  ).join(" ");
  const stubFetch = async (url) => {
    if (url.endsWith("index.htm")) {
      return makeRes(`<a href="/wxzw/2026/reg.htm">生成式人工智能法律合规管理试行办法全文发布</a>`, {
        url,
      });
    }
    if (url.endsWith("/reg.htm")) {
      return makeRes(
        `<html><head><title>生成式人工智能法律合规管理试行办法全文发布</title></head><body><article><p>${longBody}</p></article></body></html>`,
        { url },
      );
    }
    return makeRes(
      `<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom"><title>CL</title><entry><id>cl-1</id><title>Federal Court Ruling on AI Citation Verification</title><link href="${glItemLink}"/><updated>2026-11-26T10:00:00Z</updated><summary>In November 2026, the federal court reinforced mandatory citation verification duties for litigators using generative AI drafting tools.</summary></entry></feed>`,
      { contentType: "application/atom+xml", url },
    );
  };

  const cnOut = await runRegionalCollector({
    region: "cn",
    date: "2026-11-27",
    nowIso: "2026-11-27T08:00:00Z",
    cacheDir,
    outputDir: candidatesDir,
    whitelistPath: cnWl,
    fetchImpl: stubFetch,
    retries: 0,
  });
  const glOut = await runRegionalCollector({
    region: "global",
    date: "2026-11-27",
    nowIso: "2026-11-27T08:00:00Z",
    cacheDir,
    outputDir: candidatesDir,
    whitelistPath: glWl,
    fetchImpl: stubFetch,
    retries: 0,
    fetchArticleBodyForFeeds: false,
  });
  assert.equal(cnOut.candidates.length, 1);
  assert.equal(glOut.candidates.length, 1);
  assert.equal(
    scanForbiddenFulltextKeys(JSON.parse(readFileSync(path.join(candidatesDir, "cn.json"), "utf8")))
      .length,
    0,
  );

  const curated = await runCuratePipeline({
    date: "2026-11-27",
    nowIso: "2026-11-27T08:05:00Z",
    candidatesDir,
    cacheDir,
    bundlesDir,
    topicPoolDir,
    offline: true,
    fetchImpl: async () => {
      throw new Error("Offline curate must not hit network");
    },
  });
  assert.equal(curated.bundle.items.length, 2);
  assert.equal(validateBySchemaName("daily-bundle", curated.bundle).valid, true);
  assert.equal(validateBySchemaName("wechat-topic-pool", curated.topicPool).valid, true);
  assert.equal(scanForbiddenFulltextKeys(curated.bundle).length, 0);
  assert.ok(
    curated.topicPool.topics.some((t) => t.trigger_reasons.includes("long_regulation_split")),
  );
  assert.equal(existsSync(path.join(topicPoolDir, "2026-11-27.md")), true);

  unlinkSync(path.join(candidatesDir, "cn.json"));
  const degraded = await runCuratePipeline({
    date: "2026-11-27",
    nowIso: "2026-11-27T08:10:00Z",
    candidatesDir,
    cacheDir,
    bundlesDir,
    topicPoolDir,
    offline: true,
  });
  assert.deepEqual(degraded.degraded.missingTracks, ["cn"]);
  assert.equal(degraded.bundle.items.length, 1);

  const dailyRes = await runDailyPipeline({
    repoRoot: base,
    date: "2026-11-27",
    nowIso: "2026-11-27T08:00:00Z",
    offline: true,
    writeOutput: false,
  });
  assert.equal(dailyRes.errors.length, 2);
});
