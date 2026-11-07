# 状态看板

最后更新：2026-11-07（Claude）｜当前阶段：Gate 0 已由 Human 验收通过（2026-11-07），Gate 1 可启动准备｜基准：`main`（以实际最新 commit 为准）

状态与分级的含义见 [AGENTS.md](../../AGENTS.md) 第 3 节。本文件是任务状态的唯一记录处，会话中的口头结论不算数。

## 任务看板

| 任务 | 标题 | 级别 | Owner | 复核 / 审计 | 状态 | 备注 |
|---|---|---|---|---|---|---|
| LD-GOV-01 | 多 Agent 协作规范 V1 | B（治理） | Claude | GPT 网页版审计（必须）；Human 批准 | DONE（已合并 `3ea52c0`；Human 2026-11-07 豁免第六轮） | PR #3（已合并）；前四轮审计（至 commit `08b29e9`）均为“需修改”，第四轮余 1 项 S2、2 项 S3，已在本轮整改；回应见 docs/audits/LD-GOV-01-claude-response.md；第五轮 S2、S3 未整改，Human 已在 PR #3 评论 6701898915 书面豁免第六轮复审并承担，后续可另开任务清理 |
| LD-G0-01 | README 增加协作规范文档入口 | A | Antigravity | Claude | PROPOSED | 依赖 LD-GOV-01 生效；不得改动 README 定位与路线图段落 |
| LD-G0-02 | ROADMAP.md 入库与 README 对齐（以 ROADMAP 为准，D-007） | B（冻结基线） | GPT 网页版（操作员） | Claude 核对与原文一致；Human 审 diff | DONE | 已通过 PR #4 合并入 main（merge commit `0570956`）；Human 2026-11-07 授权合并；同次 Human 指示 ROADMAP Gate 3 增加“供 AI Agent 调用的 LexAIDaily Skill” |
| LD-G0-03 | README 与 ROADMAP 一致性核对 | A | Claude（Human 2026-11-07 指示开始，由 Claude 直接执行） | 待 Human 阅读；未单独审计 | DONE | 报告摘要见 docs/coordination/GATE0_ACCEPTANCE.md 第三节；Human 2026-11-07 18:05 表态“Gate 0 签署通过”，视为对 A1 所依据的核对报告的接受（Claude 代记，已回应审计 F01） |
| LD-G0-04 | Gate 0 验收清单 | A | Claude | 独立审计 LD-G0-05 已完成（Astra，结论：需修改，已整改，整改未再审）；Human 签署 | DONE（Human 本人于 [PR #6 评论](https://github.com/fitalex/LexAIDaily/pull/6#issuecomment-6705455666) 签署） | 依赖 LD-GOV-01、LD-G0-02、LD-G0-03；只能转写 ROADMAP 既有验收标准，不得新增、降低或改写 |
| LD-G0-05 | Gate 0 验收清单独立审计（1 轮） | A | Codex（Astra，Human 2026-11-07 指定） | Claude | DONE | 审计已交付并归档：[PR #8](https://github.com/fitalex/LexAIDaily/pull/8) 已合并 `31a2d0a`；只审 1 轮，不再复审 |
| LD-GOV-02 | 修订 AGENTS.md 过时表述（文首“DRAFT，未生效”；Claude 已有 GitHub 读写权限，D-003 前提已变） | B（治理） | Claude | 独立审计已由 Human 豁免 | DONE | Human 2026-11-07 授权修订并豁免审计（原话“PR#7直接合并，不审计”，记录见 PR #7 评论 6705408705）；已合并 `9551b6e` |
| LD-G1-01 | 资讯卡片展示字段定义 v0（仅供 UI 与排版原型；正式采集数据契约归 Gate 2） | B（跨 Gate） | Codex | Claude | PROPOSED | 须待 Human 正式验收 Gate 0 后才能开工（ROADMAP 串行准入）；提前做正式契约须 Human 批准调整 Gate 范围 |
| LD-G1-02 | 设计系统与 Web 桌面/移动原型 | B（跨 Gate） | Codex | Claude；Human 视觉验收 | PROPOSED | 依赖 LD-G1-01；使用 Figma MCP 与图像生成，须先经 Human 授权；Codex 提供截图、Figma 版本与素材来源记录 |
| LD-G1-03 | 公众号每日栏目内联排版模板原型 | B（跨 Gate） | Codex | DeepSeek Harness 测试导出结构与兼容（不做视觉判断）；Claude；Human 视觉验收 | PROPOSED | 依赖 LD-G1-01；排在 LD-G1-02 之后，避免并行压给 Codex；微信 iOS/Android 真机预览由 Human 执行 |
| LD-G1-04 | 真实资讯样本集（原型填充与扫读评审用，不对外发布） | A | GPT 网页版 | Claude 核验一手链接与事实 | PROPOSED | 须待 Gate 0 验收 |

Gate 严格串行（ROADMAP）：LD-G1 系列须待 Human 正式验收 Gate 0 后才能开工，当前只准备任务书。

## Human 待办

- [x] 首轮独立审计已完成（PR #3，2026-11-05，结论：需修改），报告原文见 docs/audits/LD-GOV-01-gpt-audit.md
- [x] （已于 PR #3 评论 `6652115636`、`6652516660` 确认）在 PR #3 留言确认或修订决策记录 D-001 至 D-004（审计 S1-01）；确认前不启动任何 A 级任务
- [x] （已于 PR #3 评论 `6679648988` 确认选甲）明确确认 Gate 范围（D-005）：甲 = Gate 1 只做 UI 展示字段、正式采集数据契约放 Gate 2（建议，与 ROADMAP 一致）；乙 = 提前并调整 ROADMAP。你说“以路线图为准”，我按甲记录，请在 PR 留言确认
- [ ] 确认 Figma 文件与权限、Codex 图像生成的使用方式；Figma 凭据只放你本机或 Codex 环境，不入库
- [x] 批准并合并 LD-GOV-01：Human 2026-11-07 豁免第六轮（PR #3 评论 6701898915）并指示合并
- [x] 正式验收 Gate 0：Human 本人于 2026-11-07 在 [PR #6 评论](https://github.com/fitalex/LexAIDaily/pull/6#issuecomment-6705455666) 写明“确认 D-006、D-007；Gate 0 验收通过”（验收后 LD-G1-01 至 04 才能开工；ROADMAP 要求 README 与 ROADMAP 一致）
- [x] 授权 LD-G0-02：已由 PR #4 合并（2026-11-07，`0570956`），ROADMAP 版本由此固定
- [x] D-006 已由 Human 在会话中确认（Human 2026-11-07 18:05 会话原话：“D-006、D-007 确认”；Human 本人已在 [PR #6 评论](https://github.com/fitalex/LexAIDaily/pull/6#issuecomment-6705455666) 确认）：协作规范（AGENTS.md）列入 Gate 0 交付成果（ROADMAP Gate 0 相应条目随 LD-G0-02 修改）
- [ ] 最终核对审计归档文件与 PR 评论原文一致（AGENTS.md 6.2；blob SHA 见 docs/audits/README.md）
- [ ] 对 D-001 至 D-004 作最终治理批准：你已在 PR #3 留言“确认修订D-001到D-004”（07:14:58 UTC）及更明确的确认留言（07:39:30 UTC，针对当时最新版本；a8bf671 之后 D-001 至 D-004 文字未变）。决策确认与规范正式批准是两件事，后者须待审计通过后由你另行批准
- [ ] （可选）把仓库简介中的 “Leagal” 改为 “Legal”

## A 级授权台账

| 日期 | 任务 | 授权依据（一句话） | Human 已知悉 |
|---|---|---|---|
| 2026-11-07 | LD-G0-03 | Human 回复“开始 G0-03”，A 级只出报告，不改基线 | 是 |
| 2026-11-07 | LD-GOV-02 | B 级；Human 授权修订 AGENTS.md 过时表述，并于 18:05 豁免审计 | 是 |
| 2026-11-07 | LD-G0-05 | Human 指定 Astra 做 PR #6 的 1 轮独立审计并要求 Claude 写任务书；A 级，只出审计意见 | 是 |
| 2026-11-07 | LD-G0-04 | Human 回复“开这个 PR 并继续 G0-04”，A 级、Claude 为 Owner，触发 6.1(d) 审计 | 是 |

## 决策记录

| 编号 | 日期 | 决策 | 决定者 | 依据 |
|---|---|---|---|---|
| D-001 | 2026-11-05 | A 级任务由 Claude 直接授权派发 | Human | 原话：“A级任务你可以直接派发”。Human 已在 PR #3 留言“确认修订D-001到D-004”（2026-11-05 07:14:58 UTC，措辞含糊），并于 07:39:30 UTC 再次留言明确确认（针对当时最新版本）；规范正式批准仍待审计通过后由 Human 另行决定 |
| D-002 | 2026-11-05 | DeepSeek Harness 加入，承担适配器、单测与交叉测试 | Human | 原话：“本地还有deepseek harness，你也可以加进来安排合适的任务”。同 D-001 的 PR #3 两次留言 |
| D-003 | 2026-11-05 | Claude 无 GitHub 权限；GPT 网页版（具备 GitHub 权限）担任仓库操作员 | Human | 原话：“ChatGPT网页这边有GitHub权限”。同 D-001 的 PR #3 两次留言 |
| D-004 | 2026-11-05 | Gate 1 UI 由 Codex 使用 Figma MCP 与自带图像生成完成；Antigravity 只负责文档 | Human | 原话：“UI我准备让codex结合自带的imagegen和figma mcp来做”。同 D-001 的 PR #3 两次留言 |
| D-005 | 2026-11-06 | Gate 范围按甲：Gate 1 只定义 UI 展示字段，正式采集数据契约归 Gate 2 | Human | 原话：“不一致的以路线图为准”；Human 已在 PR #3 评论 `6679648988` 明确“确认 D-005 选甲” |
| D-006 | 2026-11-06 | 协作规范（AGENTS.md）列入 Gate 0 交付成果 | Human | 原话：“确认列入gate0交付”；ROADMAP 相应修改已随 PR #4 合并。Human 2026-11-07 18:05 会话原话：“D-006、D-007 确认”；Human 本人已在 [PR #6 评论](https://github.com/fitalex/LexAIDaily/pull/6#issuecomment-6705455666) 确认 |
| D-007 | 2026-11-06 | README 与 ROADMAP 不一致处以 ROADMAP 为准，并修改 README | Human | 原话：“不一致的以路线图为准，顺便修改一下”；已经 PR #4 执行并合并。Human 2026-11-07 18:05 会话原话：“D-006、D-007 确认”；Human 本人已在 [PR #6 评论](https://github.com/fitalex/LexAIDaily/pull/6#issuecomment-6705455666) 确认 |

决策记录须附 Human 原话或链接，并经 Human 在 PR 中确认后生效；Claude 起草的记录不单独构成授权。
