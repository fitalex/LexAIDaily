# 任务书索引

任务书记录编号、授权范围、验收条件、依赖及对应 PR；不得借任务书修改冻结基线。写法见 [任务书模板](../templates/TASK_BOOK.md)，状态以 [STATUS.md](../coordination/STATUS.md) 为准，本索引只列链接和摘要。

## 编号规则

| 前缀 | 用途 | 示例 |
|---|---|---|
| `LD-G<Gate>-<两位序号>` | 阶段工程任务 | LD-G1-02 |
| `LD-GOV-<序号>` | 治理与协作规范 | LD-GOV-01 |
| `LD-OPS-<序号>` | 内容线运营任务 | LD-OPS-01 |

修订追加字母后缀（如 LD-G1-02A）；文件名即任务号，如 `LD-G1-02.md`。

## 索引

| 任务 | 日期 | 范围 | 级别 | Owner | 任务书 / PR |
|---|---|---|---|---|---|
| LD-GOV-01 | 2026-11-04 | 多 Agent 协作规范 V1、协调者手册、模板与状态看板 | B | Claude | [PR #3](https://github.com/fitalex/LexAIDaily/pull/3)（Draft，未合并） |
| LD-G0-01 | 待定 | README 增加协作规范文档入口（不改定位与路线图段落） | A | Antigravity | 待 LD-GOV-01 生效后发布任务书 |
| LD-G0-02 | 待定 | ROADMAP.md 入库（Human 提供原文，操作员原样提交） | B（冻结基线） | GPT 网页版（操作员） | 待 Human 提供并授权 |
| LD-G0-03 | 待定 | README 与 ROADMAP 一致性核对（勾选状态、Gate 名称、阶段划分），只出报告不改基线 | A | GPT 网页版 | 待 LD-G0-02；Claude 复核 |
| LD-G0-04 | 待定 | Gate 0 验收清单（只转写 ROADMAP 既有验收标准；供 Human 签署；触发 6.1(d) 审计） | A | Claude | 待 LD-GOV-01、LD-G0-02、LD-G0-03 |
| LD-G1-01 | 待定 | 资讯卡片展示字段定义 v0（仅 UI；正式契约归 Gate 2） | B | Codex | 待 Human 决定开启 Gate 1 |
| LD-G1-02 | 待定 | 设计系统与 Web 原型 | B | Codex | 同上 |
| LD-G1-03 | 待定 | 公众号内联排版模板原型 | B | Codex | 同上 |
| LD-G1-04 | 待定 | 真实资讯样本集（用于原型填充与 3 分钟扫读评审，不对外发布） | A | GPT 网页版 | 待 Gate 0 验收；Claude 核验一手链接 |

本索引不代表任务已完成验收；交付与 CI 证据以对应 PR 为准。公开版本不得包含密钥或读者私域数据。
