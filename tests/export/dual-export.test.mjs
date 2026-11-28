import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  scanForbiddenFulltextKeys,
  validateAllPublicOutputs,
  validateDailyBundle,
  validateSourceIdAgainstWhitelist,
} from "../../src/contracts/validate.mjs";
import {
  buildWebEditionsIndex,
  DEFAULT_REPO_ROOT,
  exportDualLayer,
  isoWeekKey,
  loadWhitelistSourceIds,
  mapBundleToWebEdition,
  mapBundleToWechatSample,
  parseCliArgs,
} from "../../src/export/dual-export.mjs";

const TRIAL_DATES = ["2026-11-24", "2026-11-25", "2026-11-26"];
const BUNDLES_DIR = path.join(DEFAULT_REPO_ROOT, "data", "bundles");
const EXPORTS_DIR = path.join(DEFAULT_REPO_ROOT, "data", "exports", "ld-g2-05");
const H = (host, p = "") => `${"https"}://${host}${p}`;

const DISALLOWED_SECTION_PATHS = new Set([
  "",
  "/",
  "/blog",
  "/blog/",
  "/news",
  "/news/",
  "/feed",
  "/feed/",
  "/law-reviews",
  "/law-reviews/",
  "/updates",
  "/fabu.html",
  "/en/institute",
]);

test("1. LD-G2-05: 3 consecutive dual-track trial bundles pass #39 Schema, whitelist, article-level URLs, sentinel ratio & zero-fulltext", () => {
  const whitelistIds = loadWhitelistSourceIds(DEFAULT_REPO_ROOT);
  assert.ok(whitelistIds.size >= 20, "Whitelist must load both CN and Global sources");

  for (const date of TRIAL_DATES) {
    const filePath = path.join(BUNDLES_DIR, `${date}.json`);
    assert.equal(existsSync(filePath), true, `Missing trial bundle: ${filePath}`);
    const bundle = JSON.parse(readFileSync(filePath, "utf8"));

    const schemaRes = validateDailyBundle(bundle);
    assert.equal(schemaRes.valid, true, `${date} schema invalid: ${JSON.stringify(schemaRes.errors)}`);
    assert.equal(scanForbiddenFulltextKeys(bundle).length, 0);
    const wlRes = validateSourceIdAgainstWhitelist(bundle, whitelistIds);
    assert.equal(wlRes.valid, true, `${date} whitelist mismatch: ${JSON.stringify(wlRes.errors)}`);

    const regions = new Set(bundle.items.map((i) => i.region));
    assert.equal(regions.has("cn"), true, `${date} must include cn track items`);
    assert.equal(regions.has("global"), true, `${date} must include global track items`);

    const categories = new Set(bundle.items.map((i) => i.category));
    for (const cat of ["监管与合规", "模型与技术", "实务与工具", "判例与学术", "行业与资本"]) {
      assert.equal(categories.has(cat), true, `${date} missing category: ${cat}`);
    }

    for (const item of bundle.items) {
      assert.ok(item.source_url.startsWith(`${"https"}://`));
      assert.equal(item.source_url.includes("aihot.news"), false);
      const parsedUrl = new URL(item.source_url);
      assert.equal(
        DISALLOWED_SECTION_PATHS.has(parsedUrl.pathname),
        false,
        `SP01: ${item.id} must use an article-level primary URL, got ${item.source_url}`,
      );
      assert.ok(item.summary.length >= 20 && item.summary.length <= 160);
      assert.ok(item.detail_analysis.key_points.length >= 1 && item.detail_analysis.key_points.length <= 3);
      const totalKp = item.detail_analysis.key_points.reduce((s, p) => s + p.length, 0);
      assert.ok(totalKp <= 600, `${item.id} key_points total length ${totalKp} > 600`);
    }

    const highRiskCount = bundle.items.filter((i) => i.high_risk_legal).length;
    const ratio = highRiskCount / bundle.items.length;
    assert.ok(ratio >= 0.15 && ratio <= 0.25, `${date} sentinel ratio ${(ratio * 100).toFixed(1)}% out of 15-25%`);
  }

  const allRes = validateAllPublicOutputs(DEFAULT_REPO_ROOT);
  assert.equal(allRes.valid, true, JSON.stringify(allRes.errors));
  assert.ok(allRes.filesChecked >= 3);
});

test("2. LD-G2-05: Dual-layer CLI produces deterministic WeChat preview HTML (D-030) & Web V16 rich JSON (D-029)", () => {
  const bundlePaths = TRIAL_DATES.map((d) => path.join(BUNDLES_DIR, `${d}.json`));
  const tmp1 = mkdtempSync(path.join(os.tmpdir(), "lexai-g2-05-run1-"));
  const tmp2 = mkdtempSync(path.join(os.tmpdir(), "lexai-g2-05-run2-"));

  try {
    const run1 = exportDualLayer({ bundlePaths, outDir: tmp1, approvedOnly: true });
    const run2 = exportDualLayer({ bundlePaths, outDir: tmp2, approvedOnly: true });

    assert.equal(run1.editions.length, 3);
    assert.equal(run1.manifest.webIndexSha256, run2.manifest.webIndexSha256);

    for (let i = 0; i < run1.editions.length; i += 1) {
      const e1 = run1.editions[i];
      const e2 = run2.editions[i];
      assert.equal(e1.wechatSha256, e2.wechatSha256, `Non-deterministic WeChat HTML hash for ${e1.date}`);
      assert.equal(e1.webSha256, e2.webSha256, `Non-deterministic Web JSON hash for ${e1.date}`);

      const html = readFileSync(path.join(tmp1, e1.wechatHtml), "utf8");
      assert.equal(/<a\b[^>]*href/i.test(html), false);
      assert.equal(/<table[\s>]/i.test(html), false);
      assert.equal(/<style[\s>]/i.test(html), false);
      assert.equal(/<script[\s>]/i.test(html), false);
      assert.equal(/\sclass\s*=/i.test(html), false);
      assert.ok(/background-color:\s*#D5C5AE/i.test(html));
      assert.ok(html.includes("阅读原文"));

      const webJson = JSON.parse(readFileSync(path.join(tmp1, e1.webJson), "utf8"));
      assert.equal(scanForbiddenFulltextKeys(webJson).length, 0);
      assert.equal(webJson.items.length, e1.itemCount);
      for (const item of webJson.items) {
        assert.ok(item.sourceUrl.startsWith(`${"https"}://`));
        assert.ok(item.summary.length <= 160);
        assert.ok(Array.isArray(item.detail_analysis.key_points));
        assert.ok(Array.isArray(item.detail_analysis.evidence_quotes));
        assert.ok(item.detail_analysis.legal_commentary.length >= 200);
      }
    }

    const index = JSON.parse(readFileSync(run1.indexJsonPath, "utf8"));
    assert.deepEqual(index.recent_keys, ["2026-11-26", "2026-11-25", "2026-11-24"]);
    assert.ok(index.weekly_archive_keys.includes(isoWeekKey("2026-11-26")));
    assert.equal(index.editions["2026-11-26"].label, "11-26 今日");
    assert.equal(index.editions["2026-11-25"].label, "11-25 昨日");
    assert.equal(index.editions["2026-11-24"].label, "11-24 前日");

    const committedManifestPath = path.join(EXPORTS_DIR, "manifest.json");
    if (existsSync(committedManifestPath)) {
      const committedManifest = JSON.parse(readFileSync(committedManifestPath, "utf8"));
      assert.equal(committedManifest.webIndexSha256, run1.manifest.webIndexSha256);
      assert.deepEqual(
        committedManifest.editions.map((e) => e.wechatSha256),
        run1.manifest.editions.map((e) => e.wechatSha256),
      );
    }
  } finally {
    rmSync(tmp1, { recursive: true, force: true });
    rmSync(tmp2, { recursive: true, force: true });
  }
});

test("3. LD-G2-05: Negative & R1-ST01/S3-1 guardrails reject bad schema, fulltext, aihot, hidden bypass, empty whitelist & leave zero empty dirs", () => {
  const baseBundle = JSON.parse(readFileSync(path.join(BUNDLES_DIR, "2026-11-24.json"), "utf8"));
  const tmpDir = mkdtempSync(path.join(os.tmpdir(), "lexai-g2-05-neg-"));
  const outDir = path.join(tmpDir, "out");

  try {
    const writeCase = (name, mutator) => {
      const copy = structuredClone(baseBundle);
      mutator(copy);
      const p = path.join(tmpDir, `${name}.json`);
      writeFileSync(p, JSON.stringify(copy, null, 2), "utf8");
      return p;
    };

    const badSummaryPath = writeCase("bad-summary", (b) => {
      b.items[0].summary = "超".repeat(161);
    });
    assert.throws(() => exportDualLayer({ bundlePaths: [badSummaryPath], outDir }), /Schema 校验/);

    const badFulltextPath = writeCase("bad-fulltext", (b) => {
      b.items[0].raw_text = "禁止入库原文";
    });
    assert.throws(() => exportDualLayer({ bundlePaths: [badFulltextPath], outDir }), /Schema 校验|禁用全文字段/);

    const badAihotPath = writeCase("bad-aihot", (b) => {
      b.items[0].source_url = H("aihot.news", "/items/999");
    });
    assert.throws(() => exportDualLayer({ bundlePaths: [badAihotPath], outDir }), /Schema 校验/);

    const badKpTotalPath = writeCase("bad-kp-total", (b) => {
      b.items[0].detail_analysis.key_points = ["观".repeat(310), "点".repeat(300)];
    });
    assert.throws(() => exportDualLayer({ bundlePaths: [badKpTotalPath], outDir }), /Schema 校验/);

    const badWhitelistPath = writeCase("bad-wl", (b) => {
      b.items[0].source_id = "unregistered-fake-src";
    });
    assert.throws(() => exportDualLayer({ bundlePaths: [badWhitelistPath], outDir }), /白名单/);

    // R1-ST01: hidden --skip-whitelist-check flag removed & empty repoRoot fails closed
    assert.throws(
      () => parseCliArgs(["--in", "a.json", "--out-dir", "b", "--skip-whitelist-check"]),
      /未知参数/,
    );
    const emptyRepoRoot = mkdtempSync(path.join(os.tmpdir(), "lexai-empty-repo-"));
    try {
      assert.throws(
        () =>
          exportDualLayer({
            bundlePaths: [path.join(BUNDLES_DIR, "2026-11-24.json")],
            outDir,
            repoRoot: emptyRepoRoot,
          }),
        /白名单文件缺失或为空/,
      );
    } finally {
      rmSync(emptyRepoRoot, { recursive: true, force: true });
    }

    // R1-S3-1: --approved-only with all pending items fails BEFORE creating empty wechat/ or web/ dirs
    const allPendingPath = writeCase("all-pending", (b) => {
      for (const it of b.items) {
        it.review_status = "pending_review";
        it.headline = false;
        it.practice_impact_is_ai_draft = true;
        it.detail_analysis.ai_draft = true;
      }
    });
    const pendingOutDir = path.join(tmpDir, "pending-out");
    assert.throws(
      () => exportDualLayer({ bundlePaths: [allPendingPath], outDir: pendingOutDir, approvedOnly: true }),
      /无可导出条目/,
    );
    assert.equal(existsSync(path.join(pendingOutDir, "wechat")), false);
    assert.equal(existsSync(path.join(pendingOutDir, "web")), false);

    const wxSample = mapBundleToWechatSample(baseBundle);
    assert.equal(wxSample.items[0].num, "01");
    assert.equal(wxSample.items[0].factLevel, "官方数据");
    const webEd = mapBundleToWebEdition(baseBundle);
    assert.equal(webEd.items[0].badge, "头条");
    const idx = buildWebEditionsIndex([baseBundle]);
    assert.deepEqual(idx.recent_keys, ["2026-11-24"]);
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
});
