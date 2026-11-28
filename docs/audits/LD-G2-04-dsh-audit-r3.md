# 复核与审计报告｜LD-G2-04（R3 增量复核）

- 类型：独立审计（R3 增量复核 / 最终结论）
- 出具者：DeepSeek Harness｜日期：2026-11-28
- 审计对象：[PR #63](https://github.com/fitalex/LexAIDaily/pull/63)（分支 `gemini/ld-g2-04-prompts-sop`）｜关联 Issue：[#42](https://github.com/fitalex/LexAIDaily/issues/42)｜基准：`df33e918fb95e85f80da3726587654d98e55c2e7`；R2 已审 HEAD：`849f34da063490d3ebc8a99e8d26f5fe06af76a6`；R3 待审 HEAD：`bb9740909d20e399c37ac5077c21f2c65fe62a17`
- 检查范围：干净 detached worktree `/tmp/lexai-audit-r3-17280`（HEAD `bb97409`，`git status` 干净）；`git diff 849f34d..bb97409` 的 6 个文件；`npm ci`、`TZ=Asia/Shanghai npm test`（37/37）、`npm run test:prompts`（5/5）、`npm run test:pipeline`（9/9）、`npm run validate:contracts`、`git diff --check`；R2 剩余 2 项 S2 + 5 项 S3 逐项复测；8 组独立探针；PR #63 描述与 promptfoo 配置核验。
- 未检查项：未调用真实 LLM（无密钥、无付费外部服务）；未实跑 `npx promptfoo eval`；未做 20 分钟人工计时与微信真机粘贴；未重审零改动的冻结基线内容。
- 结论：**`ACCEPT`**（R2 的 2 项 S2 与 5 项 S3 全部关闭；37/37 通过；剩余 4 项 S3 为非阻断观察）。

---

## 一、R2 剩余项关闭核验

| R2 编号 | R2 级别 | R3 状态 | 独立复测证据 | 结论 |
|---|---|---|---|---|
| ST02 | S2 | **关闭** | `fact-anchor.mjs:347-360` 的 `verifyFaithfulness` 已加入 `practiceImpactBrief`；`runStage2DualLayer:824-831` 已传入 `generated.practice_impact_brief`。探针 P2：brief 写“9999 万英镑” → `faithful=false`、`missingTokens=["9999"]`、`needs_human_check=true`、`unverified_reason="数字/日期未在原文命中: 9999"`，Schema `valid=true`。 | R2-ST02 关闭。 |
| N1 | S2 | **关闭** | `runStage1WithLlm` 的 `validQuotes`/`validLeads` 均调用 `isGroundedInSource`（`fact-anchor.mjs:499-528`）；`issuer`/`document_number_or_version` 也做同源校验（`:537-558`）。探针 P1（全部虚构）：`mode=deterministic`、`usedFallback=true`、`rejectedUngrounded=true`；最终 item 无“虚构监管机构”、quote 来自原文、Schema valid。探针 P3（部分虚构）：fake issuer/doc/lead 被替换，保留的 quote 在原文中，未进入最终 item。 | R2-N1 关闭（Stage 1 层）。 |
| ST05 | S3 | **关闭** | `loader.mjs:79-83` 正则改为 `<\s*\/?\s*raw_source_text(?:\b[^>]*)?\/?>`；探针 P4：`</raw_source_text foo>`、`<raw_source_text/>`、`<RAW_SOURCE_TEXT x=1>` 均变为 `[raw_source_text]`；测试 5 覆盖。 | R2-ST05 关闭。 |
| ST08 | S3 | **关闭** | `pickAllowedCandidateFields`（`fact-anchor.mjs:84-95`）按 Schema 白名单剥离未知/禁全文键；`runStage2DualLayer`、`buildCandidateDraftFromLlm`、fallback 均使用 `cleanCandidate`。探针 P5：带 `raw_text/full_text/html_content` 的脏候选 → `forbiddenHits=[]`、Schema valid、无 `raw_text`/`full_text`。 | R2-ST08 关闭。 |
| SP03 | S3 | **关闭** | `prompts/stage1-fact-extract.md` 已写 `locator` **≤80 字**（第 35 行）与“仅输出单个合法纯 JSON 对象……不得包含 Markdown 代码块围栏”（第 41 行）；探针 P6/P7 与测试 5 通过。 | R2-SP03 关闭。 |
| ST07 | S3 | **关闭** | `prompts/eval/promptfooconfig.yaml` 现有 5 个 `tests`，覆盖监管与合规、模型与技术、实务与工具、判例与学术、行业与资本；`output_spec: file://../output-spec.md` 解析到存在的 `prompts/output-spec.md`；YAML 解析通过。 | R2-ST07 关闭（静态配置；未实跑 promptfoo）。 |
| N2 | S3 | **关闭** | `index.mjs:38-45` 的 Stage1 列改为 `Stage1 模板/模式`，输出 `v${stage1Meta.version} / ${mode}`；探针 P7 的 `review.md` 含 `v1.0.0 / deterministic`。 | R2-N2 关闭。 |

**R2 关闭统计**：2 项 S2（ST02、N1）全部关闭；5 项 S3（ST05、ST08、SP03、ST07、N2）全部关闭。R1/R2 累计无未关闭的 S1/S2。

---

## 二、独立复测证据

### 2.1 全量基线

| 命令 / 场景 | 结果 |
|---|---|
| `git worktree add --detach /tmp/lexai-audit-r3-17280 bb97409` | 干净 detached worktree；`git status` 仅 `## HEAD (no branch)`。 |
| `git rev-parse HEAD` | `bb9740909d20e399c37ac5077c21f2c65fe62a17`。 |
| `git diff --name-status 849f34d..HEAD` | 6 个文件：promptfoo config、Stage 1 prompt、fact-anchor、curate index、loader、prompts tests。 |
| `git diff --numstat df33e91..HEAD -- package-lock.json THIRD_PARTY_NOTICES.md schemas data/sources docs/adr` | 空输出；冻结路径零改动。 |
| `npm ci` | `added 71 packages in 734ms`。 |
| `TZ=Asia/Shanghai npm test` | `# tests 37`、`# suites 2`、`# pass 37`、`# fail 0`，exit 0。 |
| `TZ=Asia/Shanghai npm run test:prompts` | 5/5 通过，exit 0。 |
| `TZ=Asia/Shanghai npm run test:pipeline` | 9/9 通过，exit 0。 |
| `npm run validate:contracts` | `{"valid":true,"trackedFiles":[],"filesChecked":0,"errors":[]}`，exit 0。 |
| `git diff --check df33e91..HEAD` | 无输出，exit 0。 |
| `gh pr checks 63` | `no checks reported on the 'gemini/ld-g2-04-prompts-sop' branch`；CI 未触发。 |

### 2.2 关键探针输出

ST02（P2）：

```json
{
  "brief": "罚款金额最高可达 9999 万英镑，企业应尽快自查。",
  "faithful": false,
  "missingTokens": ["9999"],
  "needs_human_check": true,
  "unverified_reason": "数字/日期未在原文命中: 9999",
  "schemaValid": true
}
```

N1 全部虚构（P1）：

```json
{
  "mode": "deterministic",
  "usedFallback": true,
  "rejectedUngrounded": true,
  "issuer": "审计测试信源",
  "doc": null,
  "finalHasFakeIssuer": false,
  "finalQuoteInRaw": true,
  "finalSchemaValid": true
}
```

N1 部分虚构（P3）：

```json
{
  "mode": "llm",
  "usedFallback": false,
  "rejectedUngrounded": true,
  "issuer": "审计测试信源",
  "doc": null,
  "lead": "英国 ICO 于 2026 年 11 月 24 日发布指引，要求企业在 30 日内完成整改。",
  "quoteInRaw": true
}
```

ST05（P4）：

```json
{
  "attr": "a[raw_source_text]b",
  "selfClosing": "a[raw_source_text]b",
  "upper": "a[raw_source_text]b",
  "normal": "a[raw_source_text]b"
}
```

ST08（P5）：

```json
{
  "forbiddenHits": [],
  "schemaValid": true,
  "hasRaw": false,
  "hasFull": false,
  "usedFallback": false
}
```

N2（P7）`review.md` 摘录：

```text
| 条目 ID | 标题 | Stage1 模板/模式 | Stage2 模板/重试/降级 | 数字/日期忠实度 | 需人工复核 |
| `global-r3-probe-1` | 审计测试标题（不少于六字） | v1.0.0 / deterministic | v1.0.0 / retry=0 / fb=false | 通过 | **是** |
```

---

## 三、R3 非阻断观察（S3）

| 编号 | 级别 | 类型 | 位置 | 观察与依据 | 建议 |
|---|---|---|---|---|---|
| O1 | **S3 建议** | 语义边界 / 残余风险 | `fact-anchor.mjs:347-360`；`prompts/stage2-dual-layer.md:26-28` | N1 已封闭 Stage 1 的 `issuer`/quote 虚构；但 Stage 2 仍可在 summary 中独立写出不在 Stage 1 的机构名。独立探针：Stage 1 使用原文事实，Stage 2 mock 写“虚构监管机构…”；`faithful=true`、`needs_human_check=false`、Schema `valid=true`。这属于 Stage 2 专名语义校验缺口，不是 R2-N1 的 Stage 1 回归；当前依赖 Human 对照 evidence_quotes 复核。 | 如后续要求自动拦截 Stage 2 机构名，可增加“专名/机构名白名单或与 stage1.issuer/source_name 比对”的独立任务；本轮不阻断。 |
| O2 | **S3 建议** | 可观测性 | `fact-anchor.mjs:582-588`；`index.mjs:31-55` | P3 的部分虚构场景：`rejectedUngrounded=true`、`usedFallback=false`、`mode=llm`；fake 字段被替换，最终 item 安全，但 `review.md`/digest 未显示“曾拒绝未锚定字段”。 | 在 `review.md` 增加 `rejectedUngrounded` 标记，或把任何 rejectedUngrounded 计入 digest 的“Stage1 拒收”计数；非阻断。 |
| O3 | **S3 建议** | 证据同步 | PR #63 描述 | PR 描述仍写“36/36”“等待 DSH R2”；R3 实际 37/37、已完成 R3。 | 合并前更新 PR 描述为 37/37（contracts 12 + pipeline 9 + prompts 5 + sources 7 + wechat 4）并改为等待/完成 R3 的表述。 |
| O4 | **S3 建议** | 验证覆盖 | `prompts/eval/promptfooconfig.yaml` | 5 个栏目样本已覆盖、YAML 可解析；但未实跑 `npx promptfoo eval`，仅静态核对。 | 首次使用前手动跑一次并记录结果；或在 README 标注“示例配置，未纳入 CI”。 |

---

## 四、证据与红线核验

- **命令与 commit 对应**：是。所有命令均在 `bb97409` 的干净 worktree 执行；未在 `main` 或其他分支运行。
- **冻结基线/依赖**：`package-lock.json`、`THIRD_PARTY_NOTICES.md`、`schemas/`、`data/sources/`、`docs/adr/` 零改动；R3 未改 `package.json`/lock，`npm ci` 仍为 71 packages。
- **治理红线**：`headline=false`、`practice_impact_is_ai_draft=true`、`detail_analysis.ai_draft=true`、`review_status="pending_review"` 仍由代码强制覆盖；零全文键由 Schema/扫描器强制，脏候选 fallback 已剥离（P5）。
- **内容真实性**：Stage 1 引文/机构/文号/lead 已做原文锚定（P1/P3）；`practice_impact_brief` 已纳入数字忠实度（P2）；Stage 2 专名语义仍依赖人工复核（O1）。
- **未验证项**：真实 LLM 输出质量、promptfoo 实跑、20 分钟人工计时、微信真机粘贴；本轮“在线”14/14 仍为本地 stub provider，不是真实模型。

---

## 五、建议结论

- **单行汇总**：R2 剩余 **2×S2 + 5×S3 全部关闭**；R1/R2 无未关闭 S1/S2；R3 新增 4 项 S3 观察（O1–O4），均不阻断。
- **结论**：`ACCEPT`（通过）。
- **理由**：ST02 的 `practice_impact_brief` 已纳入 `verifyFaithfulness` 并端到端触发 `needs_human_check`/`unverified_reason`；N1 的 Stage 1 虚构 quote/issuer/doc/lead 已被原文锚定拒绝并安全降级；ST05/ST08/SP03/ST07/N2 均通过独立复测。37/37 测试、`validate:contracts`、`git diff --check` 全部通过，冻结基线与依赖零改动。
- **合并前建议**：更新 PR 描述为 37/37（O3）；O1/O2/O4 可作为 Gate 2 后续加固，不阻断本轮。
- **说明**：本意见只构成证据，不自动产生权限；未修改 PR 代码、未 commit、未 push、未合并。

---

## 六、Human 决策清单

- **工作目标**：决定是否批准 PR #63 合并；本审计建议 `ACCEPT`。
- **工作链接**：[PR #63](https://github.com/fitalex/LexAIDaily/pull/63)｜[Issue #42](https://github.com/fitalex/LexAIDaily/issues/42)｜本报告 `docs/audits/LD-G2-04-dsh-audit-r3.md`（当前为未提交草稿）。
- **执行步骤**：
  1. 打开 PR #63，核对 HEAD `bb97409` 与本报告“R2 剩余项关闭核验”一致。
  2. 更新 PR 描述为 37/37，并确认 O3 已同步；O1/O2/O4 可记录为后续加固。
  3. 由协调者按 `docs/audits/README.md` 归档并登记 blob SHA；Human 在最终批准前核对归档版本与原文一致。
- **边界**：AI 不代签、不代批、不自动合并；合并与最终内容决定属于 Human Maintainer。

本意见只构成证据，不自动产生权限；合并与最终决定属于 Human Maintainer。
