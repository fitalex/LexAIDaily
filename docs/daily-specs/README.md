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
| LD-GOV-01 | 2026-11-04 | 多 Agent 协作规范 V1、协调者手册、模板与状态看板 | B | Claude | [PR #3](https://github.com/fitalex/LexAIDaily/pull/3)（已合并 `3ea52c0`） |
| LD-G0-01 | 待定 | README 增加协作规范文档入口（不改定位与路线图段落） | A | Antigravity | 待 LD-GOV-01 生效后发布任务书 |
| LD-G0-02 | 待定 | ROADMAP.md 入库与 README 对齐（以 ROADMAP 为准，操作员原样提交；D-007） | B（冻结基线） | GPT 网页版（操作员） | [PR #4](https://github.com/fitalex/LexAIDaily/pull/4)（已合并 `0570956`） |
| LD-G0-03 | 待定 | README 与 ROADMAP 一致性核对（勾选状态、Gate 名称、阶段划分），只出报告不改基线 | A | Claude | 报告已写完，完成确认待 Human；摘要见 [验收清单第三节](../coordination/GATE0_ACCEPTANCE.md) |
| LD-G0-04 | 待定 | Gate 0 验收清单（只转写 ROADMAP 既有验收标准；供 Human 签署；触发 6.1(d) 审计） | A | Claude | [LD-G0-04](LD-G0-04.md)；清单：[GATE0_ACCEPTANCE.md](../coordination/GATE0_ACCEPTANCE.md) |
| LD-G0-05 | 2026-11-07 | Gate 0 验收清单独立审计（Human 指定 Codex 的 Astra，1 轮） | A | Codex（Astra） | [LD-G0-05](LD-G0-05.md)；审计 [PR #8](https://github.com/fitalex/LexAIDaily/pull/8)（Draft） |
| LD-G1-01 | 2026-11-09 | 资讯卡片展示字段定义 v0（仅 UI；正式契约归 Gate 2） | A | DeepSeek Harness（D-011） | [LD-G1-01](LD-G1-01.md) |
| LD-G1-02 | 2026-11-09 | 设计系统与 Web 桌面/移动原型 | B | DeepSeek Harness（D-011） | [LD-G1-02](LD-G1-02.md)（待 Human 授权） |
| LD-G1-03 | 2026-11-09 | 公众号内联排版模板原型（juice 依赖，D-009） | B | DeepSeek Harness（D-011） | [LD-G1-03](LD-G1-03.md)（待 Human 授权） |
| LD-G1-04 | 2026-11-09 | 真实资讯样本集（用于原型填充与 3 分钟扫读评审，不对外发布） | A | GPT 网页版 | [LD-G1-04](LD-G1-04.md)；Claude 核验一手链接 |
| LD-G1-05 | 2026-11-09 | Gate 1 验收清单（只转写 ROADMAP 既有标准） | A | Claude | [LD-G1-05](LD-G1-05.md) |
| LD-G1-06 | 2026-11-09 | 公众号排版导出结构与兼容性交叉测试 | A | 待 Human 指定 | [LD-G1-06](LD-G1-06.md) |
| LD-G1-07 | 2026-11-09 | Gate 1 文档同步与交叉引用核对 | A | Antigravity | [LD-G1-07](LD-G1-07.md) |

本索引不代表任务已完成验收；交付与 CI 证据以对应 PR 为准。公开版本不得包含密钥或读者私域数据。
