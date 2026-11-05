# 状态看板

最后更新：2026-11-05（Claude）｜当前阶段：Gate 0（文档规划）｜基准：`main`（以实际最新 commit 为准）

状态与分级的含义见 [AGENTS.md](../../AGENTS.md) 第 3 节。本文件是任务状态的唯一记录处，会话中的口头结论不算数。

## 任务看板

| 任务 | 标题 | 级别 | Owner | 复核 / 审计 | 状态 | 备注 |
|---|---|---|---|---|---|---|
| LD-GOV-01 | 多 Agent 协作规范 V1 | B（治理） | Claude | GPT 网页版审计（必须）；Human 批准 | DRAFT | GPT 网页版先作为操作员提交 Draft PR，再独立审计；通过后 Human 合并 |
| LD-G0-01 | README 增加协作规范文档入口 | A | Antigravity | Claude | PROPOSED | 依赖 LD-GOV-01 生效 |
| LD-G1-01 | 资讯卡片数据契约 v0（标题、摘要、实务影响、原始链接、五类分类、来源等级） | B（跨 Gate） | Codex | Claude；DeepSeek Harness 从适配器侧确认 | PROPOSED | 须先由 Human 决定是否开启 Gate 1 |
| LD-G1-02 | 设计系统与 Web 桌面/移动原型 | B（跨 Gate） | Codex | Claude；Human 视觉验收 | PROPOSED | 依赖 LD-G1-01；使用 Figma MCP 与图像生成，须先经 Human 授权 |
| LD-G1-03 | 公众号每日栏目内联排版模板原型 | B（跨 Gate） | Codex | DeepSeek Harness 测试导出兼容；Claude；Human 视觉验收 | PROPOSED | 依赖 LD-G1-01；排在 LD-G1-02 之后，避免并行压给 Codex |

## Human 待办

- [ ] 把审计包发给 GPT 网页版：先请它作为仓库操作员把本批文件原样提交为 Draft PR，再做独立审计，并把意见原文贴回
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
| D-001 | 2026-11-05 | A 级任务由 Claude 直接授权派发 | Human | 会话确认，规范生效前适用 |
| D-002 | 2026-11-05 | DeepSeek Harness 加入，承担适配器、单测与交叉测试 | Human | 会话确认 |
| D-003 | 2026-11-05 | Claude 无 GitHub 权限；GPT 网页版（具备 GitHub 权限）担任仓库操作员 | Human | 会话确认 |
| D-004 | 2026-11-05 | Gate 1 UI 由 Codex 使用 Figma MCP 与自带图像生成完成；Antigravity 只负责文档 | Human | 会话确认 |
