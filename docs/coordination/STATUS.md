# 状态看板

最后更新：2026-11-05（Claude）｜当前阶段：Gate 0（文档规划）｜基准：`main`（以实际最新 commit 为准）

状态与分级的含义见 [AGENTS.md](../../AGENTS.md) 第 3 节。本文件是任务状态的唯一记录处，会话中的口头结论不算数。

## 任务看板

| 任务 | 标题 | 级别 | Owner | 复核 / 审计 | 状态 | 备注 |
|---|---|---|---|---|---|---|
| LD-GOV-01 | 多 Agent 协作规范 V1 | B（治理） | Claude | GPT 网页版审计（必须）；Human 批准 | IN_AUDIT（整改稿，待增量复审） | PR #3（Draft）；首轮审计“需修改”（2 S1、6 S2、2 S3），回应见 docs/audits/LD-GOV-01-claude-response.md |
| LD-G0-01 | README 增加协作规范文档入口 | A | Antigravity | Claude | PROPOSED | 依赖 LD-GOV-01 生效 |
| LD-G1-01 | 资讯卡片展示字段定义 v0（仅供 UI 与排版原型；正式采集数据契约归 Gate 2） | B（跨 Gate） | Codex | Claude | PROPOSED | 须先由 Human 决定是否开启 Gate 1；提前做正式契约须 Human 批准调整 Gate 范围 |
| LD-G1-02 | 设计系统与 Web 桌面/移动原型 | B（跨 Gate） | Codex | Claude；Human 视觉验收 | PROPOSED | 依赖 LD-G1-01；使用 Figma MCP 与图像生成，须先经 Human 授权；Codex 提供截图、Figma 版本与素材来源记录 |
| LD-G1-03 | 公众号每日栏目内联排版模板原型 | B（跨 Gate） | Codex | DeepSeek Harness 测试导出结构与兼容（不做视觉判断）；Claude；Human 视觉验收 | PROPOSED | 依赖 LD-G1-01；排在 LD-G1-02 之后，避免并行压给 Codex |

## Human 待办

- [x] 首轮独立审计已完成（PR #3，2026-11-05，结论：需修改），报告原文见 docs/audits/LD-GOV-01-gpt-audit.md
- [ ] 在 PR #3 留言确认或修订决策记录 D-001 至 D-004（审计 S1-01）；确认前不启动任何 A 级任务
- [ ] 确认 Gate 范围：Gate 1 只做 UI 展示字段、正式采集数据契约放 Gate 2（我的建议），或批准调整 Gate 范围（审计 S2-03）
- [ ] 确认 Figma 文件与权限、Codex 图像生成的使用方式；Figma 凭据只放你本机或 Codex 环境，不入库
- [ ] 审计通过后批准并合并 LD-GOV-01
- [ ] 决定是否开启 Gate 1（决定后 LD-G1-01 至 03 才能派发）
- [ ] （可选）把仓库简介中的 “Leagal” 改为 “Legal”

## A 级授权台账

| 日期 | 任务 | 授权依据（一句话） | Human 已知悉 |
|---|---|---|---|
| — | — | — | — |

## 决策记录

| 编号 | 日期 | 决策 | 决定者 | 依据 |
|---|---|---|---|---|
| D-001 | 2026-11-05 | A 级任务由 Claude 直接授权派发 | Human | 原话：“A级任务你可以直接派发”。**待 Human 在 PR #3 确认，确认前不生效** |
| D-002 | 2026-11-05 | DeepSeek Harness 加入，承担适配器、单测与交叉测试 | Human | 原话：“本地还有deepseek harness，你也可以加进来安排合适的任务”。待 PR #3 确认 |
| D-003 | 2026-11-05 | Claude 无 GitHub 权限；GPT 网页版（具备 GitHub 权限）担任仓库操作员 | Human | 原话：“ChatGPT网页这边有GitHub权限”。待 PR #3 确认 |
| D-004 | 2026-11-05 | Gate 1 UI 由 Codex 使用 Figma MCP 与自带图像生成完成；Antigravity 只负责文档 | Human | 原话：“UI我准备让codex结合自带的imagegen和figma mcp来做”。待 PR #3 确认 |

决策记录须附 Human 原话或链接，并经 Human 在 PR 中确认后生效；Claude 起草的记录不单独构成授权。
