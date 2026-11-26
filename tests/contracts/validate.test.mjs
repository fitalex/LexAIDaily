import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  validateCandidateItem,
  validateCollectMeta,
  validateWechatTopicPool,
  validateDailyBundle,
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

describe("LD-G2-01 Testing Seam 1: Formal Data Contract & Schema Validation", () => {
  it("accepts Gate 1 LD-G1-04 mapped daily-bundle covering all 5 official categories", () => {
    const result = validateDailyBundle(mappedBundle);
    assert.equal(result.valid, true, JSON.stringify(result.errors, null, 2));

    const categories = new Set(mappedBundle.items.map((item) => item.category));
    assert.deepEqual(
      categories,
      new Set(["监管与合规", "模型与技术", "实务与工具", "判例与学术", "行业与资本"]),
    );
  });

  it("accepts a valid candidate-item with preview + detail_analysis + optional discovered_via", () => {
    const cnCandidate = {
      ...structuredClone(sampleItem),
      id: "cn-20261126-01",
      region: "cn",
      source_id: "cn-spc-fabu",
      discovered_via: "aihot-news-discovery",
      unverified: true,
      unverified_reason: "生效日期尚待官方公告进一步确认",
      needs_human_check: true,
    };
    const result = validateCandidateItem(cnCandidate);
    assert.equal(result.valid, true, JSON.stringify(result.errors, null, 2));
  });

  it("accepts a valid collect-meta payload", () => {
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
        {
          source_id: "uk-ico-news",
          status: "ok",
          items_count: 3,
          http_status: 200,
        },
      ],
    };
    const result = validateCollectMeta(meta);
    assert.equal(result.valid, true, JSON.stringify(result.errors, null, 2));
  });

  it("accepts a valid wechat-topic-pool payload", () => {
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
    const result = validateWechatTopicPool(pool);
    assert.equal(result.valid, true, JSON.stringify(result.errors, null, 2));
  });

  it("rejects summary exceeding 160 chars (O2 hard ceiling)", () => {
    const bad = structuredClone(sampleItem);
    bad.summary = "测".repeat(161);
    const result = validateCandidateItem(bad);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.instancePath.includes("summary")));
  });

  it("rejects practice_impact_brief exceeding 60 chars", () => {
    const bad = structuredClone(sampleItem);
    bad.practice_impact_brief = "【AI 初稿】" + "实务影响".repeat(20);
    const result = validateCandidateItem(bad);
    assert.equal(result.valid, false);
    assert.ok(
      result.errors.some((e) => e.instancePath.includes("practice_impact_brief")),
    );
  });

  it("rejects evidence_quotes exceeding max length (150 chars) or count (>3)", () => {
    const overLen = structuredClone(sampleItem);
    overLen.detail_analysis.evidence_quotes = [{ text: "引".repeat(151) }];
    const resLen = validateCandidateItem(overLen);
    assert.equal(resLen.valid, false);

    const overCount = structuredClone(sampleItem);
    overCount.detail_analysis.evidence_quotes = [
      { text: "合规短引文第一段内容。" },
      { text: "合规短引文第二段内容。" },
      { text: "合规短引文第三段内容。" },
      { text: "合规短引文第四段内容。" },
    ];
    const resCount = validateCandidateItem(overCount);
    assert.equal(resCount.valid, false);
  });

  it("rejects legal_commentary outside 200-400 char range", () => {
    const tooShort = structuredClone(sampleItem);
    tooShort.detail_analysis.legal_commentary = "评述过短".repeat(20);
    assert.equal(validateCandidateItem(tooShort).valid, false);

    const tooLong = structuredClone(sampleItem);
    tooLong.detail_analysis.legal_commentary = "评".repeat(401);
    assert.equal(validateCandidateItem(tooLong).valid, false);
  });

  it("rejects public payload containing forbidden fulltext fields (raw_text / full_text / body_html)", () => {
    for (const key of ["raw_text", "full_text", "body_html"]) {
      const bad = structuredClone(sampleItem);
      bad[key] = "禁止入库的原文全文内容";
      const result = validateCandidateItem(bad);
      assert.equal(result.valid, false);
      assert.ok(
        result.errors.some((e) => e.keyword === "forbiddenFulltextKey"),
        `Expected forbiddenFulltextKey error for ${key}`,
      );
    }
  });

  it("rejects missing or non-HTTP source_url", () => {
    const missingUrl = structuredClone(sampleItem);
    delete missingUrl.source_url;
    assert.equal(validateCandidateItem(missingUrl).valid, false);

    const invalidUrl = structuredClone(sampleItem);
    invalidUrl.source_url = "not-a-valid-url";
    assert.equal(validateCandidateItem(invalidUrl).valid, false);
  });

  it("rejects missing fact_tier or missing unverified boolean (O4)", () => {
    const missingTier = structuredClone(sampleItem);
    delete missingTier.fact_tier;
    assert.equal(validateCandidateItem(missingTier).valid, false);

    const badTier = structuredClone(sampleItem);
    badTier.fact_tier = "rumor";
    assert.equal(validateCandidateItem(badTier).valid, false);

    const missingUnverified = structuredClone(sampleItem);
    delete missingUnverified.unverified;
    assert.equal(validateCandidateItem(missingUnverified).valid, false);
  });

  it("passes .cache/raw/ local isolation guard (.gitignore + zero tracked files)", () => {
    const cacheCheck = checkNoTrackedRawCache(REPO_ROOT);
    assert.equal(cacheCheck.valid, true, JSON.stringify(cacheCheck, null, 2));
    assert.deepEqual(cacheCheck.trackedFiles, []);
  });
});
