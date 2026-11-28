# 复核与审计报告｜LD-G2-04（R2 增量复核）

- 类型：独立审计（R2 增量复核）
- 出具者：DeepSeek Harness｜日期：2026-11-28
- 审计对象：[PR #63](https://github.com/fitalex/LexAIDaily/pull/63)（分支 `gemini/ld-g2-04-prompts-sop`）｜关联 Issue：[#42](https://github.com/fitalex/LexAIDaily/issues/42)｜基准：`df33e918fb95e85f80da3726587654d98e55c2e7`；R1 已审 HEAD：`95ebd52f1a7a61b97f9a7449cd9560da11cca832`；R2 待审 HEAD：`849f34da063490d3ebc8a99e8d26f5fe06af76a6`
- 检查范围：干净 detached worktree `/tmp/lexai-audit-r2-11705`（HEAD `849f34d`，`git status` 干净）；`git diff 95ebd52..849f34d` 的 8 个文件；`npm ci`、`TZ=Asia/Shanghai npm test`、`npm run test:prompts`、`npm run test:pipeline`、`npm run validate:contracts`、`git diff --check`；R1 逐项关闭核验；8 组本地对抗/边界探针；`HUMAN_REVIEW_SOP.md` 与 PR #63 描述同步核验。
- 未检查项：未调用真实 LLM（无密钥、无付费外部服务），R2 的“在线”14/14 是本地 stub provider，只验证代码路径、提示词渲染、Schema/重试，不构成真实模型质量证据；未实跑 `npx promptfoo eval`；未做 20 分钟人工计时与微信真机粘贴；未重审零改动的冻结基线内容。
- 结论：**`CHANGES_REQUESTED`**（R2 仍有 2 项 S2：R1-ST02 的 `practice_impact_brief` 残余 + 新发现 N1 在线 Stage 1 事实卡未锚定原文；另有 S3 残余）。

---

## 一、R2 核验结论摘要

| 核验项 | 结果 | 摘要 |
|---|---|---|
| R1 S1（SP01）关闭 | **关闭（mock 链路）** | `runStage1WithLlm` 已接入 `curate`（`index.mjs:11`、`:113-127`）；`extractDocumentNumberOrVersion` 可对 Gate 1 样本输出文号；14/14 在线 stub 两阶段 + 离线降级双路径测试通过。真实模型质量未验证。 |
| R1 S2 全部关闭 | **未全部关闭** | HTML 实体、严格类型、可观测性、OpenAI 路由已关闭；但 `practice_impact_brief` 仍不参与 `verifyFaithfulness`（P2），且新增 N1 在线 Stage 1 事实卡未锚定原文（P1/P1b）。 |
| R1 S3 全部关闭 | **部分关闭** | 带空格条文、PR 测试数已关闭；围栏/精确标签注入已中和，但属性变体未处理（P5）；promptfoo 仅 1 个示例用例且未实跑；最终 `finalCheck` 的 fallback 仍可返回非法 item（P3）；Stage 1 `locator`/纯 JSON 措辞仍未修（SP03）。 |
| 全量基线与回归 | **通过** | `npm ci` 71 packages；`TZ=Asia/Shanghai npm test` 36/36；`validate:contracts` valid；`git diff --check` exit 0；冻结路径零改动、无新增依赖；CI 未触发。 |

---

## 二、R1 逐项关闭表

| R1 编号 | R1 级别 | R2 状态 | 核验证据 | 说明 |
|---|---|---|---|---|
| SP01 | S1 | **关闭（mock 链路）** | `index.mjs:11` 导入、`:113-127` 调用 `runStage1WithLlm`；`tests/prompts/prompts.test.mjs:208-384` 覆盖 14/14 在线 stub + 离线双路径；`:359-362` 校验 `27(5)`、`15`、`Rule 11`；`extractDocumentNumberOrVersion` 见 `fact-anchor.mjs:171-197`。 | 在线路径是本地 stub，不是真实模型；测试证明接线、提示词渲染与校验链，不证明模型输出质量。 |
| ST01 | S2 | **关闭** | `extractor.mjs:62-79` 两轮实体解码后清标签；`prompts.test.mjs:468-475` 单重/双重 `&lt;script&gt;`、`3 < 5`、`条款 &lt;100万元&gt;` 均通过；独立探针 P7 结果一致。 | 单重/双重已修；三重编码未在要求内。 |
| ST02 | S2 | **部分关闭** | `fact-anchor.mjs:283-309` 已覆盖 `summary` + `key_points` + `legal_commentary`；全角、中文数字、无年份月日、30 vs 300 测试见 `prompts.test.mjs:477-511`。 | **`practice_impact_brief` 仍不参与核验**：`verifyFaithfulness` 签名与 `runStage2DualLayer:723-729` 均未传该字段；探针 P2 中 `9999` 只出现在 brief，`faithful=true`、`needs_human_check=false`。 |
| ST03 | S2 | **关闭** | `fact-anchor.mjs:558-596` 保留非字符串原类型；`prompts.test.mjs:386-466` 用数字 summary/数组 brief/数字 key_points 触发 `ajv` 重试，第二次通过。 | 严格类型已恢复；测试覆盖。 |
| ST04 | S2 | **关闭** | `index.mjs:31-55` 生成 `-review.md`；`:113-132` 汇总 Stage1/2 fallback 与 retry；`:163-172` 写入 digest；`:208-224` 写文件；`prompts.test.mjs:527-562` 断言 digest/`review.md`/retry/fb；`fact-anchor.mjs:731-742` 写 `unverified_reason`；SOP 已同步 `review.md` 与 `unverified_reason`。 | 主要可观测性已恢复；`review.md` 未显示 Stage1 提示词版本，属 S3 小残余。 |
| SP02 | S2 | **关闭** | `review.md` 逐条展示 Stage1/2 模式、retry/fallback、`missingTokens` 与 `needs_human_check`；`fact-anchor.mjs:731-742` 把未命中数字/日期写入 `unverified_reason`；`index.mjs:163-172` 把 LLM 降级/校验重试写入 digest；`prompts.test.mjs:527-562` 断言；SOP 第 1/2 步已接入。 | R1 的“只知有红旗、不知为何”已解决；`practice_impact_brief` 未覆盖的问题另见 ST02。 |
| ST05 | S3 | **部分关闭** | `loader.mjs:79-83` 中和三反引号围栏与精确 `<raw_source_text>`；`prompts.test.mjs:143-161` 断言。 | 探针 P5：`</raw_source_text foo>` 与 `<raw_source_text/>` 未被中和；精确标签之外的属性/自闭合变体仍是提示词边界残余。 |
| ST06 | S3 | **关闭** | `fact-anchor.mjs:11-12` 允许 `第\s*...\s*条` 与 `(n)`；`prompts.test.mjs:513-518` 8 条带空格条文返回 `isLongRegulation=true`。 | 已修。 |
| ST07 | S3 | **部分关闭** | `promptfooconfig.yaml:17-19` 用 `file://../output-spec.md`；`:52-53` 仍只有 1 个 `Gate 1 Sample 01` 用例；测试仅断言字符串存在（`prompts.test.mjs:183-185`）。 | 输出规范引用已补；14 条样本未纳入，且未实跑 promptfoo，不能作为 DoD 证据。 |
| ST08 | S3 | **部分关闭** | `fact-anchor.mjs:749-765` 新增最终 `validateBySchemaName` 守卫并 fallback。 | 探针 P3：输入候选自带 `raw_text` 时，finalCheck 失败后 `safe` 仍 spread 候选，返回 item 仍含 `$.raw_text`，`validateBySchemaName` 为 false；`runCuratePipeline:138-143` 会再次校验并抛错，端到端不泄漏。 |
| ST09 | S3 | **关闭** | PR #63 描述已改为 36/36，并列出 contracts 12 + pipeline 9 + prompts 4 + sources 7 + wechat 4；实测一致。 | 已对齐。 |
| ST10 | S2（既有） | **关闭** | `fact-anchor.mjs:56-74` 的 `resolveLlmConfig` 按 provider 配对 base；`prompts.test.mjs:520-525` 断言仅 `OPENAI_API_KEY` → `https://api.openai.com/v1`；探针 P8 一致。 | 已修；若用户手动把 `DEEPSEEK_API_BASE` 指向非 DeepSeek 端点，仍可能误配，但默认路由已安全。 |
| SP03 | S3 | **未关闭** | `stage1-fact-extract.md:32-37` 仍无 `locator` ≤80 字说明；`:41` 仍写“不要包含 Markdown 代码块之外的多余解释”。 | 代码在 `fact-anchor.mjs:436-438` 对 locator 截断 80，但提示词仍未对齐；纯 JSON 措辞仍有歧义。 |

**统计**：R1 13 项（含既有 ST10）中，8 项关闭（SP01、SP02、ST01、ST03、ST04、ST06、ST09、ST10），4 项部分关闭（ST02、ST05、ST07、ST08），1 项未关闭（SP03）。

---

## 三、新发现

| 编号 | 级别 | 类型 | 位置 | 问题与依据 | 建议 |
|---|---|---|---|---|---|
| N1 | **S2 重要** | 内容真实性 / 事实锚定 | `src/pipeline/merge-and-curate/fact-anchor.mjs:424-440`、`:471-488`、`:591`；`src/pipeline/merge-and-curate/fact-anchor.mjs:283-309` | `runStage1WithLlm` 对 Stage 1 模型输出只做长度/枚举/字符串类型过滤，**不验证 `evidence_quotes`、`issuer`、`document_number_or_version`、`lead_sentences` 是否出现在 `rawText`**；`runStage2DualLayer` 直接把 Stage 1 的 `evidence_quotes` 复制进最终 item（`:591`），`verifyFaithfulness` 只查数字/日期，不查引文/机构名。探针 P1：`stage1Meta.mode="llm"`，虚构引文/机构/文号全部被接受；P1b：最终 `detail_analysis.evidence_quotes[0].text` 与 summary 中的“虚构监管机构”均不在原文，`faithful=true`、`needs_human_check=false`、Schema `valid=true`。 | 对每条 quote 做归一化后的 `rawText.includes` 校验；`issuer` 应等于 `candidate.source_name` 或在原文中出现；`document_number_or_version` 应在原文中出现，否则置 null/触发 fallback；`lead_sentences` 同样校验。未锚定时至少置 `unverified=true`/`needs_human_check=true` 并在 `review.md` 标注。补一条“虚构引文/机构”对抗测试。 |
| N2 | **S3 建议** | 可观测性 / 版本追踪 | `src/pipeline/merge-and-curate/index.mjs:42-50`；`src/pipeline/merge-and-curate/fact-anchor.mjs:489-494` | `review.md` 的 Stage1 列只显示 `mode`，未显示 `stage1Meta.version`/`promptId`；Stage 2 列显示版本。Stage 1 提示词版本变化无法从诊断简报追溯。 | 在 Stage1 列追加 `v${stage1Meta.version}`，或增加“Stage1 模板”列；不影响本轮阻断。 |
| N3 | **S3 建议** | 提示词边界 | `src/prompts/loader.mjs:79-83` | `sanitizePromptRawText` 只匹配精确/空白变体的 `<raw_source_text>`，不匹配带属性的 `</raw_source_text foo>` 或自闭合 `<raw_source_text/>`；探针 P5 显示两者原样保留。 | 用 `<\/?raw_source_text\b[^>]*>` 统一中和开始/结束/自闭合/属性变体；补测试。 |
| N4 | **S3 建议** | 评测覆盖 | `prompts/eval/promptfooconfig.yaml:52-53` | 仍只有 1 个 `Gate 1 Sample 01` 用例，不是 14 条；测试只断言 `file://` 字符串存在，未实跑 promptfoo。 | 把 14 条 Gate 1 样本纳入 `tests`，或在 README 明确该配置只是示例；若作为 R1-ST07 关闭证据，应至少实跑一次并记录。 |

> 说明：N1 是本轮新增的 S2；N2–N4 为 S3 建议。R1-ST02 的 `practice_impact_brief` 残余已在关闭表标为“部分关闭”，不重复列为新发现。

---

## 四、实测命令与探针证据

### 4.1 命令

| 命令 / 场景 | 结果 |
|---|---|
| `git worktree add --detach /tmp/lexai-audit-r2-11705 849f34d` | 干净 detached worktree；`git status` 仅 `## HEAD (no branch)`。 |
| `git rev-parse HEAD` | `849f34da063490d3ebc8a99e8d26f5fe06af76a6`。 |
| `git diff --name-status 95ebd52..HEAD` | 8 个文件：SOP、promptfoo config、Stage 1 prompt、extractor、fact-anchor、curate index、loader、prompts tests。 |
| `git diff --numstat df33e91..HEAD -- package-lock.json THIRD_PARTY_NOTICES.md schemas data/sources docs/adr` | 空输出；冻结路径零改动。 |
| `npm ci` | `added 71 packages in 601ms`。 |
| `TZ=Asia/Shanghai npm test` | `# tests 36`、`# suites 2`、`# pass 36`、`# fail 0`，exit 0。 |
| `TZ=Asia/Shanghai npm run test:prompts` | 4/4 通过，exit 0。 |
| `TZ=Asia/Shanghai npm run test:pipeline` | 9/9 通过，exit 0。 |
| `npm run validate:contracts` | `{"valid":true,"trackedFiles":[],"filesChecked":0,"errors":[]}`，exit 0。 |
| `git diff --check df33e91..HEAD` | 无输出，exit 0。 |
| `gh pr checks 63` | `no checks reported on the 'gemini/ld-g2-04-prompts-sop' branch`；CI 未触发。 |

### 4.2 独立探针

| 编号 | 输入 / 场景 | 结果 | 关联 |
|---|---|---|---|
| P1 | 在线 Stage 1 mock 返回虚构 quote/issuer/文号/lead | `mode="llm"`；quote、issuer、文号均不在 `rawText`，仍被接受。 | N1 |
| P1b | 用 P1 的 Stage 1 结果跑 Stage 2，summary 写“虚构监管机构” | 最终 quote 与 summary 均含虚构内容；`faithful=true`、`needs_human_check=false`、`schema_valid=true`。 | N1 |
| P2 | summary/key_points/commentary 均来自原文，`practice_impact_brief` 写“9999 万英镑” | `faithful=true`、`needs_human_check=false`、`unverified_reason=null`；最终 brief 保留 `9999`。 | ST02 残余 |
| P3 | 输入候选自带 `raw_text`，finalCheck 失败后 fallback | 返回 item 仍含 `$.raw_text`；`validateBySchemaName` false；`usedFallback=true`；管线终检会抛错。 | ST08 残余 |
| P4 | `2026年11月` vs `2026年11月20日`、`2026-11` vs `2026-11-20` | 均 `faithful=true`；月份前缀与完整日期可正确互相匹配，未发现误报。 | — |
| P5 | `</raw_source_text foo>`、`<raw_source_text/>`、`~~~` | 属性/自闭合标签未被中和；`~~~` 未处理（当前 XML 标签场景不构成围栏）。 | N3 |
| P6 | Gate 1 样本 02/03/10 文号提取 | `02` → `《人工智能法案》第 27(5) 条`；`03` → `UK GDPR 第 15 条`；`10` title → `Rule 11`。 | SP01 证据 |
| P7 | 实体编码/双重编码脚本、`3 < 5`、`条款 &lt;100万元&gt;` | 脚本被清除；不等式与 `<100万元>` 保留。 | ST01 关闭 |
| P8 | 仅 `OPENAI_API_KEY` | provider `openai`、base `https://api.openai.com/v1`、model `gpt-4o-mini`。 | ST10 关闭 |

### 4.3 关键输出摘录

P1b（Stage 1 虚构内容进入最终 item）：

```json
{
  "stage1_mode": "llm",
  "stage1_quote": "这是一条完全不在原文中的虚构引文但长度足以通过校验。",
  "stage1_quote_in_raw": false,
  "final_quote": "这是一条完全不在原文中的虚构引文但长度足以通过校验。",
  "final_quote_in_raw": false,
  "final_summary": "虚构监管机构于 2026 年 11 月 24 日发布指引，要求企业整改。",
  "final_summary_has_fake_issuer": true,
  "faithful": true,
  "needs_human_check": false,
  "schema_valid": true
}
```

P2（practice_impact_brief 未核验）：

```json
{
  "p2_brief": "罚款金额最高可达 9999 万英镑，企业应尽快自查。",
  "p2_faithful": true,
  "p2_needs_human_check": false,
  "p2_reason": null
}
```

P3（finalCheck fallback）：

```json
{
  "p3_valid": false,
  "p3_has_raw_text": true,
  "p3_used_fallback": true,
  "p3_errors": [
    {"instancePath": "$.raw_text", "keyword": "forbiddenFulltextKey"},
    {"instancePath": "$", "keyword": "additionalProperties"}
  ]
}
```

P5（sanitizer 变体）：

```json
{
  "p5_exact": "a[raw_source_text]b",
  "p5_attr": "a</raw_source_text foo>b",
  "p5_self_closing": "a<raw_source_text/>b"
}
```

---

## 五、证据与红线核验

- **命令与 commit 对应**：是。所有命令均在 `849f34d` 的干净 worktree 执行；未在 `main` 或其他分支运行。
- **PR 证据**：PR #63 描述已改为 36/36，并列出 12/9/4/7/4 分项，与实测一致。CI 未触发，未写成通过。
- **冻结基线/依赖**：`package-lock.json`、`THIRD_PARTY_NOTICES.md`、`schemas/`、`data/sources/`、`docs/adr/` 零改动；`package.json` 与 R1 相同，无新增依赖；`npm ci` 71 packages。
- **治理红线**：`headline=false`、`practice_impact_is_ai_draft=true`、`detail_analysis.ai_draft=true`、`review_status="pending_review"` 仍由代码强制覆盖；测试 4 覆盖 LLM 篡改。零全文键由 Schema/扫描器强制；P3 的 direct-call 残余由管线终检拦截。
- **AI 初稿/来源**：`unverified_reason`、digest、review.md 已同步；但 Stage 1 在线事实卡未锚定（N1）意味着“逐字引文/机构名”仍可能被模型虚构，需在 R3 修复。
- **未验证项**：真实 LLM 输出质量、promptfoo 实跑、20 分钟人工计时、微信真机粘贴；本轮“在线”14/14 是 stub provider，不是真实模型。

---

## 六、建议结论

- **单行汇总**：R1 13 项（含既有 ST10）中 8 项关闭、4 项部分关闭、1 项未关闭；R2 新增 1 项 S2（N1）。当前仍有 2 项 S2：R1-ST02 的 `practice_impact_brief` 残余、N1 在线 Stage 1 事实卡未锚定。
- **结论**：`CHANGES_REQUESTED`（需修改）。
- **理由**：R2 已修复 Stage 1 接入、HTML 实体、严格类型、可观测性、OpenAI 路由与带空格条文，36/36 测试通过；但 `practice_impact_brief` 仍可写入未在原文出现的数字而不触发 `needs_human_check`（P2），且在线 Stage 1 的虚构引文/机构可进入最终 item 并通过 Schema/忠实度检查（P1b）。这直接触及“零幻觉事实锚定”和“逐字短引文”红线，R2 不应通过。
- **R3 前必须关闭**：ST02 的 `practice_impact_brief` 核验；N1 的 Stage 1 引文/机构/文号/lead 原文锚定。
- **建议一并处理**：ST05 属性/自闭合标签、ST07 14 条 promptfoo 用例与实跑、ST08 finalCheck fallback 再校验、SP03 `locator`/纯 JSON 措辞、N2 Stage1 版本展示。

---

## 七、Human 决策清单

- **工作目标**：决定是否要求 Owner 在 PR #63 修复 R2 的 2 项 S2（ST02 `practice_impact_brief`、N1 Stage 1 事实卡锚定）后提交 R3 增量复审。
- **工作链接**：[PR #63](https://github.com/fitalex/LexAIDaily/pull/63)｜[Issue #42](https://github.com/fitalex/LexAIDaily/issues/42)｜本报告 `docs/audits/LD-G2-04-dsh-audit-r2.md`（当前为未提交草稿）。
- **执行步骤**：
  1. 打开 PR #63，核对本报告“R1 逐项关闭表”和 N1/P2 证据是否与 HEAD `849f34d` 一致。
  2. 在 PR 评论中要求 Owner 修复 ST02 的 `practice_impact_brief` 核验与 N1 的 Stage 1 原文锚定，并说明按 R3 增量复审。
  3. 若认可本报告，由协调者按 `docs/audits/README.md` 归档并登记 blob SHA；Human 在最终批准前核对归档版本与原文一致。
- **边界**：AI 不代签、不代批、不自动合并；合并与最终内容决定属于 Human Maintainer。

本意见只构成证据，不自动产生权限；合并与最终决定属于 Human Maintainer。
