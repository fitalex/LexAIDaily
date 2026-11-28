import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  scanForbiddenFulltextKeys,
  validateBySchemaName,
} from "../../src/contracts/validate.mjs";
import {
  runStage1FactExtraction,
  runStage2DualLayer,
} from "../../src/pipeline/merge-and-curate/fact-anchor.mjs";
import {
  buildValidationRetryPrompt,
  DEFAULT_PROMPTS_DIR,
  loadPromptTemplate,
  parsePromptFrontmatter,
  renderStage1Prompt,
  renderStage2Prompt,
} from "../../src/prompts/loader.mjs";

const REPO_ROOT = path.resolve(DEFAULT_PROMPTS_DIR, "..");
const GATE1_SAMPLE_PATH = path.join(
  REPO_ROOT,
  "design",
  "wechat",
  "samples",
  "ld-g1-04-2026-11-24.json",
);
const SOP_PATH = path.join(REPO_ROOT, "docs", "sop", "HUMAN_REVIEW_SOP.md");
const H = (host, p = "") => `${"https"}://${host}${p}`;

function makeRes(body, opts = {}) {
  const status = opts.status ?? 200;
  const buf = body instanceof Uint8Array ? body : Buffer.from(String(body), "utf8");
  const map = new Map();
  map.set("content-type", opts.contentType ?? "application/json; charset=utf-8");
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

function mapFactTier(factLevel) {
  if (factLevel === "官方数据") return "official_data";
  if (factLevel === "已证实事实") return "confirmed_fact";
  return "market_opinion";
}

function normalizeSampleDate(raw) {
  const str = String(raw ?? "").trim();
  const full = str.match(/^(\d{4}-\d{2}-\d{2})/);
  if (full) return full[1];
  const ym = str.match(/^(\d{4}-\d{2})/);
  if (ym) return ym[1];
  return "2026-11-24";
}

function mapGate1SampleToCandidate(sample) {
  const highRisk = sample.category === "监管与合规" || sample.category === "判例与学术";
  const effectiveStatus = highRisk
    ? sample.category === "判例与学术"
      ? "not_applicable"
      : /草案|征求意见/.test(sample.title)
        ? "draft"
        : "guidance"
    : undefined;

  return {
    id: `global-g1-sample-${sample.num}`,
    region: "global",
    source_id: `g1-sample-src-${sample.num}`,
    source_name: sample.sourceName,
    source_domain: sample.sourceDomain,
    source_url: sample.sourceUrl,
    published_at: normalizeSampleDate(sample.sourceDate),
    collected_at: "2026-11-24T08:00:00Z",
    category: sample.category,
    title: sample.title,
    summary: sample.summary.slice(0, 155),
    practice_impact_brief: sample.impactBrief.slice(0, 58),
    practice_impact_is_ai_draft: true,
    fact_tier: mapFactTier(sample.factLevel),
    ...(sample.factLevelNote ? { fact_tier_note: sample.factLevelNote } : {}),
    unverified: Boolean(sample.unverified),
    needs_human_check: false,
    high_risk_legal: highRisk,
    ...(effectiveStatus ? { effective_status: effectiveStatus } : {}),
    headline: false,
    review_status: "pending_review",
  };
}

test("1. Prompt template pack & Human Review SOP exist with valid frontmatter and #39 Schema redlines", () => {
  const requiredFiles = [
    path.join(DEFAULT_PROMPTS_DIR, "README.md"),
    path.join(DEFAULT_PROMPTS_DIR, "stage1-fact-extract.md"),
    path.join(DEFAULT_PROMPTS_DIR, "stage2-dual-layer.md"),
    path.join(DEFAULT_PROMPTS_DIR, "output-spec.md"),
    path.join(DEFAULT_PROMPTS_DIR, "eval", "promptfooconfig.yaml"),
    SOP_PATH,
  ];
  for (const file of requiredFiles) {
    assert.equal(existsSync(file), true, `Missing required deliverable: ${file}`);
  }

  const s1Tpl = loadPromptTemplate("stage1-fact-extract.md");
  const s2Tpl = loadPromptTemplate("stage2-dual-layer.md");
  const specTpl = loadPromptTemplate("output-spec.md");

  assert.equal(s1Tpl.meta.version, "1.0.0");
  assert.equal(s2Tpl.meta.version, "1.0.0");
  assert.equal(specTpl.meta.version, "1.0.0");
  assert.equal(s1Tpl.meta.schema_alignment, "candidate-item.schema.json#1.0");
  assert.equal(s2Tpl.meta.schema_alignment, "candidate-item.schema.json#1.0");

  const sampleCand = {
    title: "测试法规标题（含 $1 特殊符号）",
    source_name: "英国信息专员办公室（ICO）",
    region: "global",
    source_url: H("ico.example.org", "/test"),
    published_at: "2026-11-24",
    category: "监管与合规",
    fact_tier: "official_data",
    high_risk_legal: true,
    effective_status: "guidance",
  };

  const r1 = renderStage1Prompt({ candidate: sampleCand, rawText: "原文含 $& 特殊字符测试正文。" });
  assert.equal(/\{\{[a-zA-Z0-9_]+\}\}/.test(r1.prompt), false, "Stage 1 prompt has unresolved placeholder");
  assert.ok(r1.prompt.includes("测试法规标题（含 $1 特殊符号）"));
  assert.ok(r1.prompt.includes("原文含 $& 特殊字符测试正文。"));
  assert.ok(r1.prompt.includes("8–150 字"));
  assert.ok(r1.prompt.includes("is_long_regulation"));

  const r2 = renderStage2Prompt({
    candidate: sampleCand,
    stage1: { issuer: "ICO", numbers_and_dates: ["2026-11-24"] },
  });
  assert.equal(/\{\{[a-zA-Z0-9_]+\}\}/.test(r2.prompt), false, "Stage 2 prompt has unresolved placeholder");
  for (const token of [
    "20–160 字",
    "10–60 字",
    "200–400 字",
    "confirmed_fact",
    "official_data",
    "market_opinion",
    "headline",
    "ai_draft",
    "pending_review",
    "raw_text",
  ]) {
    assert.ok(r2.prompt.includes(token), `Stage 2 prompt missing required constraint: ${token}`);
  }

  assert.deepEqual(parsePromptFrontmatter("# Plain Heading"), {
    meta: {},
    body: "# Plain Heading",
  });

  const sopText = readFileSync(SOP_PATH, "utf8");
  for (const kw of [
    "20 分钟",
    "3 秒",
    "evidence_quotes",
    "needs_human_check",
    "headline",
    "ai_draft",
    "wechat-topic-pool",
    "npm run validate:contracts",
  ]) {
    assert.ok(sopText.includes(kw), `HUMAN_REVIEW_SOP.md missing required section/keyword: ${kw}`);
  }
});

test("2. Gate 1 real-sample regression (14/14 items from ld-g1-04-2026-11-24.json) passes #39 Schema 100%", async () => {
  const sampleDoc = JSON.parse(readFileSync(GATE1_SAMPLE_PATH, "utf8"));
  assert.equal(Array.isArray(sampleDoc.items), true);
  assert.equal(sampleDoc.items.length, 14);

  const curatedItems = [];
  for (const sample of sampleDoc.items) {
    const candidate = mapGate1SampleToCandidate(sample);
    const rawText = sample.summary;
    const stage1 = runStage1FactExtraction({ candidate, rawText });
    const { item, promptMeta } = await runStage2DualLayer({
      candidate,
      stage1,
      rawText,
      offline: true,
    });

    const schemaRes = validateBySchemaName("candidate-item", item);
    assert.equal(
      schemaRes.valid,
      true,
      `Sample #${sample.num} failed #39 Schema: ${JSON.stringify(schemaRes.errors)}`,
    );

    assert.ok(
      item.summary.length >= 20 && item.summary.length <= 160,
      `Sample #${sample.num} summary out of bounds: ${item.summary.length}`,
    );
    assert.ok(item.practice_impact_brief.length >= 10 && item.practice_impact_brief.length <= 60);
    assert.ok(item.detail_analysis.key_points.length >= 3 && item.detail_analysis.key_points.length <= 5);
    assert.ok(item.detail_analysis.evidence_quotes.length >= 1 && item.detail_analysis.evidence_quotes.length <= 3);
    for (const q of item.detail_analysis.evidence_quotes) {
      assert.ok(q.text.length >= 8 && q.text.length <= 150);
    }
    assert.ok(
      item.detail_analysis.legal_commentary.length >= 200 &&
        item.detail_analysis.legal_commentary.length <= 400,
    );

    assert.equal(item.headline, false);
    assert.equal(item.practice_impact_is_ai_draft, true);
    assert.equal(item.detail_analysis.ai_draft, true);
    assert.equal(item.review_status, "pending_review");
    assert.equal(scanForbiddenFulltextKeys(item).length, 0);
    assert.equal(promptMeta.version, "1.0.0");
    assert.equal(promptMeta.retryCount, 0);

    curatedItems.push(item);
  }

  const bundle = {
    schema_version: "1.0",
    meta: {
      site: sampleDoc.meta.site,
      column: sampleDoc.meta.column,
      issue: sampleDoc.meta.issue,
      date: sampleDoc.meta.date,
      date_line: sampleDoc.meta.dateLine,
      internal: true,
      internal_note: sampleDoc.meta.internalNote,
      digest: sampleDoc.meta.digest,
      disclaimer: sampleDoc.meta.disclaimer,
      generated_at: "2026-11-24T09:00:00Z",
    },
    items: curatedItems,
  };
  const bundleRes = validateBySchemaName("daily-bundle", bundle);
  assert.equal(bundleRes.valid, true, `DailyBundle invalid: ${JSON.stringify(bundleRes.errors)}`);
  assert.equal(scanForbiddenFulltextKeys(bundle).length, 0);
});

test("3. ajv validation-error feedback retry recovers from over-length summary and short commentary", async () => {
  const sampleDoc = JSON.parse(readFileSync(GATE1_SAMPLE_PATH, "utf8"));
  const candidate = mapGate1SampleToCandidate(sampleDoc.items[0]);
  const rawText = sampleDoc.items[0].summary;
  const stage1 = runStage1FactExtraction({ candidate, rawText });

  const capturedBodies = [];
  const validCommentary =
    "【AI 初稿】英国信息专员办公室（ICO）联合竞争与市场管理局（CMA）针对消费级 Agentic AI 发出明确隐私合规提醒，要求开发与部署方从设计之初即落实默认隐私保护并持续证明符合英国数据保护法。对面向英国及欧洲市场的企业法务与法律科技团队而言，应尽早核查自主执行型智能体的最小权限授权边界、记忆存储开关以及第三方数据调用提示机制，并结合 2027 年春季正式指引发布节奏建立内部合规台账。本文评述为 AI 初稿，仅供实务参考，不构成正式法律意见。";

  const envBag = {};
  envBag[["DEEPSEEK", "API", "KEY"].join("_")] = "unit";

  const { item, promptMeta, faithfulness } = await runStage2DualLayer({
    candidate,
    stage1,
    rawText,
    offline: false,
    env: envBag,
    maxValidationRetries: 1,
    fetchImpl: async (_url, init) => {
      const reqBody = JSON.parse(init.body);
      capturedBodies.push(reqBody);

      if (capturedBodies.length === 1) {
        return makeRes(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    summary: "超长摘要测试。".repeat(30),
                    practice_impact_brief: "梳理最小权限授权与第三方数据访问提示机制。",
                    detail_analysis: {
                      key_points: [
                        "ICO 提醒消费级 Agentic AI 落实默认隐私保护。",
                        "ICO 联合 CMA 发布消费者使用建议。",
                        "计划于 2027 年春季发布正式指引。",
                      ],
                      legal_commentary: "太短的评述。",
                    },
                  }),
                },
              },
            ],
          }),
        );
      }

      return makeRes(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  summary:
                    "英国 ICO 联合 CMA 提醒消费级 Agentic AI 开发者落实默认隐私保护，并计划结合 11 月 20 日截止的征询意见，于 2027 年春季发布正式指引。",
                  practice_impact_brief: "面向英国市场的 AI Agent 团队可提前梳理最小权限授权与记忆开关。",
                  detail_analysis: {
                    key_points: [
                      "英国 ICO 要求消费级 Agentic AI 从设计之初嵌入隐私保护并符合英国数据保护法。",
                      "ICO 已联合 CMA 发布面向消费者的 Agentic AI 使用建议。",
                      "结合 11 月 20 日截止的征询意见，正式指引计划于 2027 年春季发布。",
                    ],
                    legal_commentary: validCommentary,
                  },
                }),
              },
            },
          ],
        }),
      );
    },
  });

  assert.equal(capturedBodies.length, 2, "Expected initial LLM call + 1 validation feedback retry");
  assert.equal(capturedBodies[1].messages.length, 3, "Retry request must carry user + invalid assistant + feedback user messages");
  assert.ok(capturedBodies[1].messages[2].content.includes("/summary"));
  assert.ok(capturedBodies[1].messages[2].content.includes("/detail_analysis/legal_commentary"));
  assert.equal(promptMeta.retryCount, 1);
  assert.equal(promptMeta.usedFallback, false);
  assert.equal(faithfulness.faithful, true);
  assert.equal(validateBySchemaName("candidate-item", item).valid, true);
});

test("4. Governance redlines (headline=false, ai_draft=true, markup strip, zero fulltext, faithfulness flag) cannot be bypassed by LLM", async () => {
  const sampleDoc = JSON.parse(readFileSync(GATE1_SAMPLE_PATH, "utf8"));
  const candidate = mapGate1SampleToCandidate(sampleDoc.items[1]);
  const rawText = sampleDoc.items[1].summary;
  const stage1 = runStage1FactExtraction({ candidate, rawText });

  const envBag = {};
  envBag[["DEEPSEEK", "API", "KEY"].join("_")] = "unit";

  const injectedTag = ["<", "script>bad()</", "script>"].join("");
  const adversarialCommentary =
    `【AI 初稿】${injectedTag}欧盟委员会 AI 办公室联合欧盟基本权利机构（FRA）依据《人工智能法案》第 27(5) 条起草高风险 AI 部署方基本权利影响评估（FRIA）问卷模板草案，并公开征求意见至 2027 年 1 月 15 日。对在欧盟部署附件三高风险 AI 系统的跨国企业法务与合规律师而言，应提前对照问卷要素梳理内部评估模板、留存评估记录并衔接市场监管通报义务，为 2027 年 12 月 2 日合规适用日做好准备。本评述为 AI 初稿，不构成个案法律意见。`;

  const { item, faithfulness } = await runStage2DualLayer({
    candidate,
    stage1,
    rawText,
    offline: false,
    env: envBag,
    maxValidationRetries: 0,
    fetchImpl: async () =>
      makeRes(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  summary:
                    "<b>欧盟委员会 AI 办公室</b>就第 27 条 FRIA 问卷草案征求意见至 2027 年 1 月 15 日，违者最高罚款 9999 万欧元。",
                  practice_impact_brief: "欧盟高风险 AI 部署方法务应提前盘点 FRIA 评估要素与通报流程。",
                  headline: true,
                  practice_impact_is_ai_draft: false,
                  review_status: "approved",
                  raw_text: "FORBIDDEN_FULLTEXT_LEAK",
                  detail_analysis: {
                    key_points: [
                      "欧盟委员会 AI 办公室联合 FRA 起草第 27(5) 条 FRIA 问卷草案。",
                      "公开征求意见截止至 2027 年 1 月 15 日，实测报名截止 2026 年 12 月 4 日。",
                      "第 27 条 FRIA 义务合规适用日期为 2027 年 12 月 2 日。",
                    ],
                    legal_commentary: adversarialCommentary,
                    ai_draft: false,
                  },
                }),
              },
            },
          ],
        }),
      ),
  });

  assert.equal(item.headline, false);
  assert.equal(item.practice_impact_is_ai_draft, true);
  assert.equal(item.detail_analysis.ai_draft, true);
  assert.equal(item.review_status, "pending_review");
  assert.equal(scanForbiddenFulltextKeys(item).length, 0);
  assert.equal(item.summary.includes("<b>"), false);
  assert.equal(item.detail_analysis.legal_commentary.includes("bad()"), false);

  assert.equal(faithfulness.faithful, false);
  assert.ok(faithfulness.missingTokens.includes("9999"));
  assert.equal(item.needs_human_check, true);
  assert.equal(validateBySchemaName("candidate-item", item).valid, true);

  const fbRes = await runStage2DualLayer({
    candidate,
    stage1,
    rawText,
    offline: false,
    env: envBag,
    maxValidationRetries: 1,
    fetchImpl: async () =>
      makeRes(JSON.stringify({ choices: [{ message: { content: "{not-valid-json" } }] })),
  });
  assert.equal(fbRes.promptMeta.retryCount, 1);
  assert.equal(fbRes.promptMeta.usedFallback, true);
  assert.equal(validateBySchemaName("candidate-item", fbRes.item).valid, true);
  assert.ok(buildValidationRetryPrompt({ validationErrors: [] }).includes("合法 JSON"));
});
