#!/usr/bin/env node
/**
 * LexAIDaily 双层差异化一键导出 CLI（LD-G2-05｜Issue #43）
 *
 * 读取经人工终审的结构化日更数据包（DailyBundle JSON，对齐 #39 Schema）：
 *   1. 先执行 #39 ajv 契约校验、禁用全文字段扫描与白名单 source_id 核对；
 *   2. 公众号固定栏目（预览层，依 D-030）：直接调用 Gate 1 已验收的
 *      scripts/wechat-prototype/build.mjs（juice@12.2.6），仅渲染 ≤160 字摘要 +
 *      1 句极简实务影响 + 引导「阅读原文」跳 Web 详情页（零 <table>、零 <a href>）；
 *   3. Web V16 富数据包（预览层 + 详情层，依 D-029）：输出可供 design/prototype/index.html
 *      直接消费的单日 JSON 与多日 editions-index.json（近 3 日完整日报 + 按周精选归档），
 *      完整保留 detail_analysis（核心观点论证、逐字短引文、法律实务深度评述）与一手原链。
 *
 * 用法：
 *   node src/export/dual-export.mjs --in <bundle.json> --out-dir <dir>
 *   node src/export/dual-export.mjs --in-dir <bundlesDir> --out-dir <dir> [--approved-only] [--image-base <prefix>]
 */
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { load as parseYaml } from "js-yaml";
import {
  scanForbiddenFulltextKeys,
  validateDailyBundle,
  validateSourceIdAgainstWhitelist,
} from "../contracts/validate.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const DEFAULT_REPO_ROOT = path.resolve(__dirname, "../..");
const DEFAULT_BUILD_SCRIPT = path.join(
  DEFAULT_REPO_ROOT,
  "scripts",
  "wechat-prototype",
  "build.mjs",
);
const DEFAULT_IMAGE_BASE = "../../design/assets/illustrations";

const FACT_TIER_LABEL = Object.freeze({
  official_data: "官方数据",
  confirmed_fact: "已证实事实",
  market_opinion: "市场观点",
});

export function mapFactTierToLabel(factTier) {
  return FACT_TIER_LABEL[factTier] || "市场观点";
}

export function sha256Hex(content) {
  return createHash("sha256").update(content, "utf8").digest("hex");
}

export function loadWhitelistSourceIds(repoRoot = DEFAULT_REPO_ROOT) {
  const ids = new Set();
  for (const file of ["whitelist-cn.yaml", "whitelist-global.yaml"]) {
    const full = path.join(repoRoot, "data", "sources", file);
    if (!existsSync(full)) continue;
    const parsed = parseYaml(readFileSync(full, "utf8"));
    const list = Array.isArray(parsed?.sources) ? parsed.sources : [];
    for (const src of list) {
      if (typeof src?.source_id === "string" && src.source_id.trim()) {
        ids.add(src.source_id.trim());
      }
    }
  }
  return ids;
}

export function isoWeekKey(dateStr) {
  const m = String(dateStr ?? "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return "0000-W00";
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function deriveSourceDomain(item) {
  if (typeof item.source_domain === "string" && item.source_domain.trim()) {
    return item.source_domain.trim();
  }
  try {
    return new URL(item.source_url).hostname;
  } catch {
    return "";
  }
}

function selectPublishableItems(bundle, { approvedOnly = false } = {}) {
  const items = Array.isArray(bundle?.items) ? bundle.items : [];
  return items.filter((item) => {
    if (item.review_status === "rejected") return false;
    if (approvedOnly && item.review_status !== "approved") return false;
    return true;
  });
}

/**
 * Maps a #39 DailyBundle into the strict preview-only input JSON expected by
 * Gate 1 scripts/wechat-prototype/build.mjs (D-030: <=160 char summary + 1-line impactBrief, zero fulltext).
 */
export function mapBundleToWechatSample(bundle, { approvedOnly = false } = {}) {
  const items = selectPublishableItems(bundle, { approvedOnly });
  if (items.length === 0) {
    throw new Error(`DailyBundle (${bundle?.meta?.date || "unknown"}) 无可导出条目`);
  }

  const webDetailUrl =
    bundle.meta.web_detail_url ||
    `https://lexaidaily.example/d/${bundle.meta.date}`;

  return {
    meta: {
      site: bundle.meta.site,
      column: bundle.meta.column,
      issue: bundle.meta.issue,
      date: bundle.meta.date,
      dateLine: bundle.meta.date_line,
      internal: Boolean(bundle.meta.internal),
      ...(bundle.meta.internal_note ? { internalNote: bundle.meta.internal_note } : {}),
      digest: bundle.meta.digest,
      disclaimer: bundle.meta.disclaimer,
      webDetailUrl,
      readOriginalNote:
        "点击左下角「阅读原文」跳转 Web 详情页，查看核心观点论证、原文短引文与法律实务深度评述",
    },
    items: items.map((item, idx) => ({
      num: String(idx + 1).padStart(2, "0"),
      category: item.category,
      factLevel: mapFactTierToLabel(item.fact_tier),
      ...(item.fact_tier_note ? { factLevelNote: item.fact_tier_note } : {}),
      headline: Boolean(item.headline),
      unverified: Boolean(item.unverified),
      title: item.title,
      summary: item.summary,
      impactBrief: item.practice_impact_brief,
      sourceName: item.source_name,
      sourceDate: item.published_at,
      sourceDomain: deriveSourceDomain(item),
      sourceUrl: item.source_url,
    })),
  };
}

/**
 * Maps a #39 DailyBundle into a V16 Web edition JSON object compatible with
 * design/prototype/index.html cards (preview layer) and detail modal (detail_analysis layer).
 */
export function mapBundleToWebEdition(
  bundle,
  { approvedOnly = false, dayLabel = "" } = {},
) {
  const items = selectPublishableItems(bundle, { approvedOnly });
  if (items.length === 0) {
    throw new Error(`DailyBundle (${bundle?.meta?.date || "unknown"}) 无可导出条目`);
  }

  const issueNum = (bundle.meta.issue || "").replace(/[^\d]/g, "") || "001";
  const mmdd = String(bundle.meta.date || "").slice(5);

  return {
    schema_version: bundle.schema_version || "1.0",
    date: bundle.meta.date,
    vol: `VOL.01 NO.${issueNum.padStart(3, "0")}`,
    label: dayLabel || mmdd,
    dateLine: bundle.meta.date_line,
    isWeekly: false,
    internal: Boolean(bundle.meta.internal),
    ...(bundle.meta.internal_note ? { internalNote: bundle.meta.internal_note } : {}),
    digest: bundle.meta.digest,
    disclaimer: bundle.meta.disclaimer,
    webDetailUrl:
      bundle.meta.web_detail_url ||
      `https://lexaidaily.example/d/${bundle.meta.date}`,
    generatedAt: bundle.meta.generated_at,
    items: items.map((item, idx) => {
      const badge = item.headline ? "头条" : item.unverified ? "未核实" : "";
      return {
        id: item.id,
        seq: String(idx + 1).padStart(2, "0"),
        badge,
        badgeOutline: !item.headline && Boolean(item.unverified),
        category: item.category,
        factLevel: mapFactTierToLabel(item.fact_tier),
        factTier: item.fact_tier,
        ...(item.fact_tier_note ? { factTierNote: item.fact_tier_note } : {}),
        placeholder: false,
        region: item.region,
        sourceId: item.source_id,
        sourceName: item.source_name,
        sourceDomain: deriveSourceDomain(item),
        sourceUrl: item.source_url,
        date: item.published_at,
        title: item.title,
        summary: item.summary,
        practiceImpactBrief: item.practice_impact_brief,
        practiceImpactIsAiDraft: Boolean(item.practice_impact_is_ai_draft),
        // Backward-compatible V16 modal impact list + full Gate 2 detail_analysis
        impact: [item.practice_impact_brief],
        highRiskLegal: Boolean(item.high_risk_legal),
        ...(item.effective_status ? { effectiveStatus: item.effective_status } : {}),
        unverified: Boolean(item.unverified),
        ...(item.unverified_reason ? { unverifiedReason: item.unverified_reason } : {}),
        headline: Boolean(item.headline),
        reviewStatus: item.review_status,
        detail_analysis: {
          key_points: [...item.detail_analysis.key_points],
          evidence_quotes: item.detail_analysis.evidence_quotes.map((q) => ({
            text: q.text,
            ...(q.locator ? { locator: q.locator } : {}),
          })),
          legal_commentary: item.detail_analysis.legal_commentary,
          ai_draft: Boolean(item.detail_analysis.ai_draft),
        },
      };
    }),
  };
}

/**
 * Builds the V16 multi-day editions index following D-029:
 *   - recent_keys: up to 3 most recent full daily editions (descending by date)
 *   - weekly_archive_keys: curated weekly rollups (headlines + high-risk items)
 */
export function buildWebEditionsIndex(bundles, { approvedOnly = false } = {}) {
  const sorted = [...bundles].sort((a, b) =>
    String(b.meta.date).localeCompare(String(a.meta.date)),
  );
  const recentLabels = ["今日", "昨日", "前日"];
  const editions = {};
  const recentKeys = [];

  sorted.slice(0, 3).forEach((bundle, idx) => {
    const mmdd = String(bundle.meta.date).slice(5);
    const label = `${mmdd} ${recentLabels[idx] || ""}`.trim();
    editions[bundle.meta.date] = mapBundleToWebEdition(bundle, {
      approvedOnly,
      dayLabel: label,
    });
    recentKeys.push(bundle.meta.date);
  });

  // Group all bundles by ISO week to provide weekly curated archive entries (D-029)
  const weeklyMap = new Map();
  for (const bundle of sorted) {
    const wk = isoWeekKey(bundle.meta.date);
    if (!weeklyMap.has(wk)) {
      weeklyMap.set(wk, { dates: [], items: [] });
    }
    const bucket = weeklyMap.get(wk);
    bucket.dates.push(bundle.meta.date);
    const webEd = mapBundleToWebEdition(bundle, { approvedOnly });
    const curated = webEd.items.filter((it) => it.headline || it.highRiskLegal);
    for (const it of curated) {
      bucket.items.push({
        ...it,
        badge: "周度精选",
        badgeOutline: false,
      });
    }
  }

  const weeklyArchiveKeys = [];
  for (const [wk, bucket] of weeklyMap.entries()) {
    if (bucket.items.length === 0) continue;
    const datesAsc = [...bucket.dates].sort();
    const rangeStart = datesAsc[0].slice(5).replace("-", "/");
    const rangeEnd = datesAsc[datesAsc.length - 1].slice(5).replace("-", "/");
    const wkShort = wk.split("-")[1] || wk;
    weeklyArchiveKeys.push(wk);
    editions[wk] = {
      schema_version: "1.0",
      date: wk,
      vol: `WEEKLY ${wk}`,
      label: `${wkShort} 精选`,
      rangeText: `${wk} · ${rangeStart}–${rangeEnd}`,
      isWeekly: true,
      digest: `${wkShort} 周度精选归档：收录本周 ${bucket.items.length} 条头条与高风险合规重点情报，供律师与法务团队按周回溯。`,
      items: bucket.items,
    };
  }

  return {
    schema_version: "1.0",
    recent_keys: recentKeys,
    weekly_archive_keys: weeklyArchiveKeys,
    editions,
  };
}

function assertWechatHtmlCompliance(html) {
  const checks = [
    ["<a href>", /<a\b[^>]*\bhref\s*=/i],
    ["<table>", /<table[\s>]/i],
    ["<style>", /<style[\s>]/i],
    ["<script>", /<script[\s>]/i],
    ["class=", /\sclass\s*=/i],
  ];
  for (const [label, re] of checks) {
    if (re.test(html)) {
      throw new Error(`导出公众号 HTML 违反 Gate 1 规范，包含禁用内容：${label}`);
    }
  }
  if (!/background-color:\s*#D5C5AE/i.test(html)) {
    throw new Error("导出公众号 HTML 缺失暖报纸主底色 #D5C5AE");
  }
}

function validateBundleOrThrow(bundle, sourceLabel, whitelistIds) {
  const schemaRes = validateDailyBundle(bundle);
  if (!schemaRes.valid) {
    const summary = schemaRes.errors
      .slice(0, 5)
      .map((e) => `${e.instancePath}: ${e.message}`)
      .join("; ");
    throw new Error(`DailyBundle (${sourceLabel}) 未通过 #39 Schema 校验：${summary}`);
  }
  const forbidden = scanForbiddenFulltextKeys(bundle);
  if (forbidden.length > 0) {
    throw new Error(
      `DailyBundle (${sourceLabel}) 含禁用全文字段：${forbidden.map((h) => h.path).join(", ")}`,
    );
  }
  if (whitelistIds && whitelistIds.size > 0) {
    const wlRes = validateSourceIdAgainstWhitelist(bundle, whitelistIds);
    if (!wlRes.valid) {
      throw new Error(
        `DailyBundle (${sourceLabel}) 含未注册白名单 source_id：${wlRes.errors.map((e) => e.message).join("; ")}`,
      );
    }
  }
}

export function exportDualLayer({
  bundlePaths = [],
  outDir,
  imageBase = DEFAULT_IMAGE_BASE,
  approvedOnly = false,
  verifyWhitelist = true,
  repoRoot = DEFAULT_REPO_ROOT,
  buildScriptPath = DEFAULT_BUILD_SCRIPT,
}) {
  if (!Array.isArray(bundlePaths) || bundlePaths.length === 0) {
    throw new Error("必须至少提供一个 DailyBundle JSON 输入路径");
  }
  if (!outDir) {
    throw new Error("必须指定 --out-dir 输出目录");
  }

  const whitelistIds = verifyWhitelist ? loadWhitelistSourceIds(repoRoot) : null;
  const loadedBundles = bundlePaths.map((p) => {
    const abs = path.resolve(p);
    const raw = readFileSync(abs, "utf8");
    const parsed = JSON.parse(raw);
    validateBundleOrThrow(parsed, abs, whitelistIds);
    return { path: abs, bundle: parsed };
  });

  const absOutDir = path.resolve(outDir);
  const wechatOutDir = path.join(absOutDir, "wechat");
  const webOutDir = path.join(absOutDir, "web");
  mkdirSync(wechatOutDir, { recursive: true });
  mkdirSync(webOutDir, { recursive: true });

  const tmpDir = mkdtempSync(path.join(os.tmpdir(), "lexai-dual-export-"));
  const exportedEditions = [];

  try {
    for (const { bundle } of loadedBundles) {
      const date = bundle.meta.date;
      const wechatSample = mapBundleToWechatSample(bundle, { approvedOnly });
      const tmpWechatJson = path.join(tmpDir, `${date}-wechat-input.json`);
      const wechatHtmlPath = path.join(wechatOutDir, `${date}.html`);
      writeFileSync(tmpWechatJson, `${JSON.stringify(wechatSample, null, 2)}\n`, "utf8");

      execFileSync(
        process.execPath,
        [
          buildScriptPath,
          "--in",
          tmpWechatJson,
          "--out",
          wechatHtmlPath,
          "--image-base",
          imageBase,
        ],
        { cwd: repoRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
      );

      const wechatHtml = readFileSync(wechatHtmlPath, "utf8");
      assertWechatHtmlCompliance(wechatHtml);

      const webEdition = mapBundleToWebEdition(bundle, { approvedOnly });
      if (scanForbiddenFulltextKeys(webEdition).length > 0) {
        throw new Error(`Web 导出产物 (${date}) 检测到禁用全文字段`);
      }
      const webJsonStr = `${JSON.stringify(webEdition, null, 2)}\n`;
      const webJsonPath = path.join(webOutDir, `${date}.json`);
      writeFileSync(webJsonPath, webJsonStr, "utf8");

      exportedEditions.push({
        date,
        issue: bundle.meta.issue,
        itemCount: webEdition.items.length,
        wechatHtml: path.relative(absOutDir, wechatHtmlPath),
        wechatSha256: sha256Hex(wechatHtml),
        webJson: path.relative(absOutDir, webJsonPath),
        webSha256: sha256Hex(webJsonStr),
      });
    }
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }

  const indexObj = buildWebEditionsIndex(
    loadedBundles.map((x) => x.bundle),
    { approvedOnly },
  );
  if (scanForbiddenFulltextKeys(indexObj).length > 0) {
    throw new Error("Web editions-index.json 检测到禁用全文字段");
  }
  const indexJsonStr = `${JSON.stringify(indexObj, null, 2)}\n`;
  const indexJsonPath = path.join(webOutDir, "editions-index.json");
  writeFileSync(indexJsonPath, indexJsonStr, "utf8");

  const manifest = {
    schema_version: "1.0",
    editions: exportedEditions.sort((a, b) => a.date.localeCompare(b.date)),
    webIndex: path.relative(absOutDir, indexJsonPath),
    webIndexSha256: sha256Hex(indexJsonStr),
  };
  const manifestPath = path.join(absOutDir, "manifest.json");
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  return {
    manifest,
    manifestPath,
    indexJsonPath,
    editions: exportedEditions,
  };
}

function parseCliArgs(argv) {
  const args = {
    in: null,
    inDir: null,
    outDir: null,
    imageBase: DEFAULT_IMAGE_BASE,
    approvedOnly: false,
    skipWhitelistCheck: false,
    help: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--help" || token === "-h") {
      args.help = true;
    } else if (token === "--approved-only") {
      args.approvedOnly = true;
    } else if (token === "--skip-whitelist-check") {
      args.skipWhitelistCheck = true;
    } else if (token === "--in" || token === "--in-dir" || token === "--out-dir" || token === "--image-base") {
      const val = argv[(i += 1)];
      if (!val || val.startsWith("--")) {
        throw new Error(`参数 ${token} 缺少取值`);
      }
      if (token === "--in") args.in = val;
      if (token === "--in-dir") args.inDir = val;
      if (token === "--out-dir") args.outDir = val;
      if (token === "--image-base") args.imageBase = val;
    } else {
      throw new Error(`未知参数：${token}`);
    }
  }
  return args;
}

function runCli() {
  const args = parseCliArgs(process.argv.slice(2));
  if (args.help) {
    console.log(
      "用法：node src/export/dual-export.mjs (--in <bundle.json> | --in-dir <dir>) --out-dir <dir> [--approved-only] [--image-base <prefix>]",
    );
    return;
  }
  const bundlePaths = [];
  if (args.in) {
    bundlePaths.push(path.resolve(process.cwd(), args.in));
  }
  if (args.inDir) {
    const dir = path.resolve(process.cwd(), args.inDir);
    const files = readdirSync(dir)
      .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
      .sort();
    for (const f of files) {
      bundlePaths.push(path.join(dir, f));
    }
  }
  if (bundlePaths.length === 0 || !args.outDir) {
    throw new Error("必须指定 --in 或 --in-dir，以及 --out-dir");
  }

  const res = exportDualLayer({
    bundlePaths,
    outDir: path.resolve(process.cwd(), args.outDir),
    imageBase: args.imageBase,
    approvedOnly: args.approvedOnly,
    verifyWhitelist: !args.skipWhitelistCheck,
  });

  console.log(
    `[export:dual] exported=${res.editions.length} editions | webIndexSha256=${res.manifest.webIndexSha256.slice(0, 12)} | manifest=${res.manifestPath}`,
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  try {
    runCli();
  } catch (err) {
    console.error(`[export:dual] 失败：${err.message}`);
    process.exit(1);
  }
}
