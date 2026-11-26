import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  FORBIDDEN_FULLTEXT_KEYS,
  validateCandidateItem,
  validateCollectMeta,
  validateWechatTopicPool,
  validateDailyBundle,
  validateSourceIdAgainstWhitelist,
  checkNoTrackedRawCache,
} from "../../src/contracts/validate.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "../..");
const FIXTURE_PATH = path.join(
  __dirname,
  "fixtures/ld-g1-04-mapped-bundle.json",
);

const mappedBundle = JSON.parse(readFileSync(FIXTURE_PATH, "utf8"));
const sampleItem = structuredClone(mappedBundle.items[0]);

const KNOWN_WHITELIST_IDS = new Set([
  "uk-ico-news",
  "arxiv-cs-ai-rss",
  "thomson-reuters-institute",
  "cn-spc-fabu",
]);

describe("LD-G2-01 Testing Seam 1: Formal Data Contract & Schema Validation", () => {
  it("accepts Gate 1 LD-G1-04 mapped daily-bundle covering all 5 official categories and aligned whitelist source_ids", () => {
    const result = validateDailyBundle(mappedBundle);
    assert.equal(result.valid, true, JSON.stringify(result.errors, null, 2));

    const categories = new Set(mappedBundle.items.map((item) => item.category));
    assert.deepEqual(
      categories,
      new Set(["监管与合规", "模型与技术", "实务与工具", "判例与学术", "行业与资本"]),
    );

    const refCheck = validateSourceIdAgainstWhitelist(
      mappedBundle,
      KNOWN_WHITELIST_IDS,
    );
    assert.equal(refCheck.valid, true, JSON.stringify(refCheck.errors, null, 2));
  });

  it("accepts a Stage 1 pending_review candidate-item without detail_analysis (SP01 lifecycle)", () => {
    const stage1 = structuredClone(sampleItem);
    delete stage1.detail_analysis;
    stage1.id = "cn-20261126-stage1";
    stage1.region = "cn";
    stage1.source_id = "cn-spc-fabu";
    stage1.discovered_via = "aihot-news-discovery";
    stage1.published_at = "2026-11";
    stage1.unverified = true;
    stage1.unverified_reason = "生效日期尚待官方公告进一步确认";
    stage1.needs_human_check = true;
    const result = validateCandidateItem(stage1);
    assert.equal(result.valid, true, JSON.stringify(result.errors, null, 2));
  });

  it("rejects missing detail_analysis on approved candidate-item or inside daily-bundle (SP01)", () => {
    const approvedNoDetail = structuredClone(sampleItem);
    approvedNoDetail.review_status = "approved";
    delete approvedNoDetail.detail_analysis;
    assert.equal(validateCandidateItem(approvedNoDetail).valid, false);

    const bundleNoDetail = structuredClone(mappedBundle);
    delete bundleNoDetail.items[0].detail_analysis;
    assert.equal(validateDailyBundle(bundleNoDetail).valid, false);
  });

  it("enforces ST02 pending_review AI draft & headline rules (AGENTS.md 10.8 & D-019)", () => {
    const badImpactFlag = structuredClone(sampleItem);
    badImpactFlag.practice_impact_is_ai_draft = false;
    assert.equal(validateCandidateItem(badImpactFlag).valid, false);

    const badDetailDraftFlag = structuredClone(sampleItem);
    badDetailDraftFlag.detail_analysis.ai_draft = false;
    assert.equal(validateCandidateItem(badDetailDraftFlag).valid, false);

    const badHeadline = structuredClone(sampleItem);
    badHeadline.headline = true;
    assert.equal(validateCandidateItem(badHeadline).valid, false);
  });

  it("rejects ST03 invalid calendar dates in published_at", () => {
    for (const badDate of ["2026-99-99", "2026-02-31", "2026-13", "2026-00"]) {
      const bad = structuredClone(sampleItem);
      bad.published_at = badDate;
      assert.equal(validateCandidateItem(bad).valid, false);
    }
  });

  it("rejects ST04 discovery_only domain aihot.news as primary source_url", () => {
    const badAihot = structuredClone(sampleItem);
    badAihot.discovered_via = "aihot-news-discovery";
    badAihot.source_url = "https://aihot.news/items/12345";
    const result = validateCandidateItem(badAihot);
    assert.equal(result.valid, false);
    assert.ok(
      result.errors.some((e) => e.keyword === "discoverySourceUrlForbidden"),
    );
  });

  it("requires SP02 effective_status when high_risk_legal is true", () => {
    const bad = structuredClone(sampleItem);
    bad.high_risk_legal = true;
    delete bad.effective_status;
    assert.equal(validateCandidateItem(bad).valid, false);
  });

  it("accepts valid collect-meta and wechat-topic-pool payloads and rejects aihot.news in topic URLs", () => {
    const meta = {
      schema_version: "1.0",
      run_id: "collect-global-20261126-0800",
      region: "global",
      started_at: "2026-11-26T08:00:00Z",
      finished_at: "2026-11-26T08:02:15Z",
      status: "success",
      sources_attempted: 12,
      sources_succeeded: 12,
      sources_failed: 0,
      items_fetched: 38,
      items_deduped: 15,
      cache_ttl_days: 7,
      cache_pruned_count: 4,
      source_results: [
        { source_id: "uk-ico-news", status: "ok", items_count: 3, http_status: 200 },
      ],
    };
    assert.equal(validateCollectMeta(meta).valid, true);

    const pool = {
      schema_version: "1.0",
      updated_at: "2026-11-26T09:00:00Z",
      topics: [
        {
          topic_id: "topic-20261126-agentic-privacy",
          title: "消费级 Agentic AI 默认隐私保护义务与跨境合规实务",
          category: "监管与合规",
          trigger_reasons: ["high_risk_legal_tag", "multi_source_cross_report"],
          cross_source_count: 2,
          candidate_ids: ["g1-04-item-01"],
          primary_source_urls: [sampleItem.source_url],
          angle_brief: "对照英国 ICO 声明与欧盟 AI Act 第 27 条 FRIA 草案拆解权限与审计落点。",
          high_risk_legal: true,
          status: "queued",
          created_at: "2026-11-26T09:00:00Z",
        },
      ],
    };
    assert.equal(validateWechatTopicPool(pool).valid, true);

    const badPool = structuredClone(pool);
    badPool.topics[0].primary_source_urls = ["https://aihot.news/items/999"];
    const res = validateWechatTopicPool(badPool);
    assert.equal(res.valid, false);
    assert.ok(res.errors.some((e) => e.keyword === "discoverySourceUrlForbidden"));
  });

  it("rejects out-of-range summary, practice_impact_brief, key_points, evidence_quotes, and legal_commentary", () => {
    const badSummary = structuredClone(sampleItem);
    badSummary.summary = "测".repeat(161);
    assert.equal(validateCandidateItem(badSummary).valid, false);

    const badBrief = structuredClone(sampleItem);
    badBrief.practice_impact_brief = "【AI 初稿】" + "实务影响".repeat(20);
    assert.equal(validateCandidateItem(badBrief).valid, false);

    const lowKp = structuredClone(sampleItem);
    lowKp.detail_analysis.key_points = ["核心事实要点一。", "核心事实要点二。"];
    assert.equal(validateCandidateItem(lowKp).valid, false);

    const highKp = structuredClone(sampleItem);
    highKp.detail_analysis.key_points = ["要点一内容。", "要点二内容。", "要点三内容。", "要点四内容。", "要点五内容。", "要点六内容。"];
    assert.equal(validateCandidateItem(highKp).valid, false);

    const overLenQuote = structuredClone(sampleItem);
    overLenQuote.detail_analysis.evidence_quotes = [{ text: "引".repeat(151) }];
    assert.equal(validateCandidateItem(overLenQuote).valid, false);

    const overCountQuote = structuredClone(sampleItem);
    overCountQuote.detail_analysis.evidence_quotes = [
      { text: "合规短引文第一段内容。" },
      { text: "合规短引文第二段内容。" },
      { text: "合规短引文第三段内容。" },
      { text: "合规短引文第四段内容。" },
    ];
    assert.equal(validateCandidateItem(overCountQuote).valid, false);

    const shortComm = structuredClone(sampleItem);
    shortComm.detail_analysis.legal_commentary = "评".repeat(199);
    assert.equal(validateCandidateItem(shortComm).valid, false);

    const longComm = structuredClone(sampleItem);
    longComm.detail_analysis.legal_commentary = "评".repeat(401);
    assert.equal(validateCandidateItem(longComm).valid, false);
  });

  it("rejects all 7 forbidden fulltext keys including nested & camelCase variants (ST07 & SP04)", () => {
    for (const key of [...FORBIDDEN_FULLTEXT_KEYS, "rawText", "FULL_TEXT", "bodyHtml"]) {
      const bad = structuredClone(sampleItem);
      bad[key] = "禁止入库的原文全文内容";
      assert.ok(validateCandidateItem(bad).errors.some((e) => e.keyword === "forbiddenFulltextKey"));

      const nestedBad = structuredClone(sampleItem);
      nestedBad.detail_analysis[key] = "嵌套禁止字段";
      assert.ok(validateCandidateItem(nestedBad).errors.some((e) => e.keyword === "forbiddenFulltextKey"));
    }
  });

  it("rejects missing, non-HTTPS, or invalid source_url and missing fact_tier/unverified (ST09 & O4)", () => {
    const missingUrl = structuredClone(sampleItem);
    delete missingUrl.source_url;
    assert.equal(validateCandidateItem(missingUrl).valid, false);

    const httpUrl = structuredClone(sampleItem);
    httpUrl.source_url = "http://example.invalid/test";
    assert.equal(validateCandidateItem(httpUrl).valid, false);

    const missingTier = structuredClone(sampleItem);
    delete missingTier.fact_tier;
    assert.equal(validateCandidateItem(missingTier).valid, false);

    const missingUnverified = structuredClone(sampleItem);
    delete missingUnverified.unverified;
    assert.equal(validateCandidateItem(missingUnverified).valid, false);
  });

  it("passes .cache/ local isolation guard (.gitignore + zero tracked files under .cache/)", () => {
    const cacheCheck = checkNoTrackedRawCache(REPO_ROOT);
    assert.equal(cacheCheck.valid, true, JSON.stringify(cacheCheck, null, 2));
    assert.deepEqual(cacheCheck.trackedFiles, []);
  });
});
