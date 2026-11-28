# 状态看板

最后更新：2026-11-28（Gemini）｜当前阶段：**Gate 2 已于 2026-11-28 正式验收通过（[#38](https://github.com/fitalex/LexAIDaily/issues/38) 已关闭），Gate 3 已解锁（待立项规划）**｜基准：`main`（`b037fc3`）

状态与分级的含义见 [AGENTS.md](../../AGENTS.md) 第 3 节。本文件是任务状态的唯一记录处，会话中的口头结论不算数。

## 任务看板

状态图例（每个状态固定一个 emoji，Human 2026-11-09 要求，见 [PR #11 评论](https://github.com/fitalex/LexAIDaily/pull/11#issuecomment-6735751050)）：📄 DRAFT｜📝 PROPOSED｜🟢 AUTHORIZED_TO_EXECUTE｜🤝 ACCEPTED｜🔧 IN_PROGRESS｜👀 READY_FOR_REVIEW｜✏️ CHANGES_REQUESTED｜🔍 IN_AUDIT｜⚖️ HUMAN_DECISION｜✅ DONE｜⛔ BLOCKED｜❌ CANCELLED

| 任务 | 标题 | 级别 | Owner | 复核 / 审计 | 状态 | 备注 |
|---|---|---|---|---|---|---|
| LD-GOV-01 | 多 Agent 协作规范 V1 | B（治理） | Claude | GPT 网页版审计（必须）；Human 批准 | ✅ DONE（已合并 `3ea52c0`；Human 2026-11-07 豁免第六轮） | PR #3（已合并）；前四轮审计（至 commit `08b29e9`）均为“需修改”，第四轮余 1 项 S2、2 项 S3，已在本轮整改；回应见 docs/audits/LD-GOV-01-claude-response.md；第五轮 S2、S3 未整改，Human 已在 PR #3 评论 6701898915 书面豁免第六轮复审并承担，后续可另开任务清理 |
| LD-G0-01 | README 增加协作规范文档入口 | A | Antigravity | Claude | 📝 PROPOSED | 依赖 LD-GOV-01 生效；不得改动 README 定位与路线图段落 |
| LD-G0-02 | ROADMAP.md 入库与 README 对齐（以 ROADMAP 为准，D-007） | B（冻结基线） | GPT 网页版（操作员） | Claude 核对与原文一致；Human 审 diff | ✅ DONE | 已通过 PR #4 合并入 main（merge commit `0570956`）；Human 2026-11-07 授权合并；同次 Human 指示 ROADMAP Gate 3 增加“供 AI Agent 调用的 LexAIDaily Skill” |
| LD-G0-03 | README 与 ROADMAP 一致性核对 | A | Claude（Human 2026-11-07 指示开始，由 Claude 直接执行） | 待 Human 阅读；未单独审计 | ✅ DONE | 报告摘要见 docs/coordination/GATE0_ACCEPTANCE.md 第三节；Human 2026-11-07 18:05 表态“Gate 0 签署通过”，视为对 A1 所依据的核对报告的接受（Claude 代记，已回应审计 F01） |
| LD-G0-04 | Gate 0 验收清单 | A | Claude | 独立审计 LD-G0-05 已完成（Astra，结论：需修改，已整改，整改未再审）；Human 签署 | ✅ DONE（Human 本人于 [PR #6 评论](https://github.com/fitalex/LexAIDaily/pull/6#issuecomment-6705455666) 签署） | 依赖 LD-GOV-01、LD-G0-02、LD-G0-03；只能转写 ROADMAP 既有验收标准，不得新增、降低或改写 |
| LD-G0-05 | Gate 0 验收清单独立审计（1 轮） | A | Codex（Astra，Human 2026-11-07 指定） | Claude | ✅ DONE | 审计已交付并归档：[PR #8](https://github.com/fitalex/LexAIDaily/pull/8) 已合并 `31a2d0a`；只审 1 轮，不再复审 |
| LD-GOV-02 | 修订 AGENTS.md 过时表述（文首“DRAFT，未生效”；Claude 已有 GitHub 读写权限，D-003 前提已变） | B（治理） | Claude | 独立审计已由 Human 豁免 | ✅ DONE | Human 2026-11-07 授权修订并豁免审计（原话“PR#7直接合并，不审计”，记录见 PR #7 评论 6705408705）；已合并 `9551b6e` |
| LD-GOV-03 | 重组多 Agent 协作架构与治理文档（V2.0：Gemini 接任总协调者、ChatGPT 网页版退出、Codex 移出主表、交叉独立审计） | B（治理） | Gemini | 独立审计已由 Human 豁免（D-026）；Human 审 diff 合并 | ✅ DONE（PR #22 已合并 `f035894`） | [任务书](../daily-specs/LD-GOV-03.md)；`AGENTS.md` V2.0 与 `GEMINI.md` 已正式生效 |
| LD-GOV-04 | 收口 GEMINI.md 对话输出与决策规范并清理下游冲突 | B（治理） | Gemini | 独立审计已由 Human 书面豁免（PR #23 评论确认）；Human 审 diff 合并 | ✅ DONE（[PR #23](https://github.com/fitalex/LexAIDaily/pull/23) 已合并 `1c64319`） | 无独立任务书（依 Human 2026-11-23 会话指令立项）；收口 `GEMINI.md`、`AGENTS.md` 与 `docs/COORDINATOR_PLAYBOOK.md` 冲突 |
| LD-G1-01 | 资讯卡片展示字段定义 v0（仅供 UI 与排版原型；正式采集数据契约归 Gate 2） | A（Human 2026-11-07 由 B 降为 A，D-010） | DeepSeek Harness（D-011，原 Codex） | Claude；独立审计已豁免（D-010） | ✅ DONE（[PR #12](https://github.com/fitalex/LexAIDaily/pull/12) 已合并 `419cda7`；Claude 复核两轮，第二轮通过；Human 2026-11-11 答复三个待决问题并要求合并） | [任务书](../daily-specs/LD-G1-01.md)；首轮复核 F01–F04 已由 Owner 在原 PR 修复；三个答复见 D-016，由 LD-G1-01A 写入字段表 |
| LD-G1-01A | 字段表定稿：写入 Human 对三个待决问题的答复（D-016） | A | DeepSeek Harness（D-011） | Claude；不触发独立审计（Claude 判断，Human 可追加） | ✅ DONE（[PR #14](https://github.com/fitalex/LexAIDaily/pull/14) 已合并，merge commit `6e2b986`；Claude 复核通过，Human 2026-11-11 合并） | [任务书](../daily-specs/LD-G1-01A.md)；复核无 S1、S2，余 3 项 S3 不阻断 |
| LD-G1-02 | 设计系统与 Web 桌面/移动原型 | B（跨 Gate） | Antigravity（D-012，原 Codex） | Claude；GPT 网页版独立审计（6.1(c)，Human 可豁免）；Human 视觉验收 | ❌ CANCELLED（已由 LD-G1-02B / LD-G1-02C 替代升级） | [任务书](../daily-specs/LD-G1-02.md)；首版被否决后演进至 Design-in-Code |
| LD-G1-02A | 设计系统与 Web 原型返工（推倒重做；参考 iandaily.xyz 与 Canvas UI） | B（同 LD-G1-02） | Antigravity（D-012） | Claude；Human 视觉验收 | ❌ CANCELLED（已由 LD-G1-02B / LD-G1-02C 替代升级） | [任务书](../daily-specs/LD-G1-02A.md) |
| LD-G1-01B | 字段表 v0.2：列表卡片不含实务影响、新增重要度（头条/常规）、占位标记改为字段 | A | DeepSeek Harness（D-011） | Gemini（接替 Claude）；Human 已在 PR #18 豁免审计 | ✅ DONE（PR #19 已合并 `2307eed`） | [任务书](../daily-specs/LD-G1-01B.md)；公众号栏目字段规则见 D-030 |
| LD-G1-02B | 设计系统与 Web 原型第二版（宣纸 × 楷体标题 × 导航玻璃，深海军蓝，D-019） | B（同 LD-G1-02） | Antigravity（D-012） | Gemini（接替 Claude）；字体许可增量复审已由 Human 豁免（D-026）；Human 视觉验收 | ✅ DONE（[PR #16](https://github.com/fitalex/LexAIDaily/pull/16) 已合并 `cec7d31`；视觉与交付路线随后由 D-027 与 LD-G1-02C 替代升级） | [任务书](../daily-specs/LD-G1-02B.md)；Penpot 阶段归档完成 |
| LD-G1-02C | 复古报刊风 Design-in-Code HTML 原型与 v3.0 AI 配图规范落地（放弃 Penpot，替代 D-013；D-027） | B（跨 Gate） | Gemini（代码线，D-028）｜Antigravity（视觉资产线） | 代码线：Human 书面豁免 6.1(d) 审计并视觉验收；视觉资产线：Gemini 复核 + Human 视觉验收 | ✅ DONE（代码线 [PR #25](https://github.com/fitalex/LexAIDaily/pull/25)、视觉资产线 [PR #26](https://github.com/fitalex/LexAIDaily/pull/26) 与详情页 NYT 排版同步 [PR #30](https://github.com/fitalex/LexAIDaily/pull/30) 均已合并入 `main`，最新 `db902d7`） | [任务书](../daily-specs/LD-G1-02C.md)；代码原型：[index.html](../../design/prototype/index.html)；配图规范：[illustration-spec.md](../../design/illustration-spec.md)（v3.0） |
| LD-G1-03 | 公众号每日栏目内联排版模板原型 | B（跨 Gate） | DeepSeek Harness（初版）｜Gemini（2026-11-25 经 Human 授权接管 NYT 报刊改版与微信实测修复） | LD-G1-06 交叉测试（Antigravity，D-015）；Human 公众号后台 0 告警与手机端实机预览验收通过 | ✅ DONE（[PR #29](https://github.com/fitalex/LexAIDaily/pull/29) 已合并 `e87d480`；样稿 `c3dddfa` 确定性 `sha256` 校验通过） | [任务书](../daily-specs/LD-G1-03.md)；juice 依赖已授权（D-009）；字段规则见 D-030 |
| LD-G1-04 | 真实资讯样本集（原型填充与扫读评审用，不对外发布） | A | Gemini（D-025，原 GPT 网页版） | Human 审阅质量达标并合并 | ✅ DONE（[PR #27](https://github.com/fitalex/LexAIDaily/pull/27) 已合并） | [任务书](../daily-specs/LD-G1-04.md)；交付文件：`docs/samples/LD-G1-04-sample-set.md` |
| LD-G1-05 | Gate 1 验收清单（只转写 ROADMAP 既有验收标准） | A | Gemini（接替 Claude） | 独立审计已豁免（D-010）；Human 签署 | ✅ DONE（[PR #35](https://github.com/fitalex/LexAIDaily/pull/35) 已合并 `a6ee3d0`，Gate 1 正式验收通过） | [验收清单](GATE1_ACCEPTANCE.md) |
| LD-G1-06 | 公众号排版导出结构与兼容性交叉测试（不做视觉判断） | A | Antigravity（D-015） | Gemini（复核 ACCEPT） | ✅ DONE（[PR #32](https://github.com/fitalex/LexAIDaily/pull/32) 已合并 `93d3c71`；4/4 通过） | [任务书](../daily-specs/LD-G1-06.md)；报告：`tests/wechat-prototype/REPORT.md` |
| LD-G1-07 | Gate 1 文档同步与交叉引用核对（不改设计内容） | A | Antigravity | Gemini（复核 ACCEPT） | ✅ DONE（[PR #33](https://github.com/fitalex/LexAIDaily/pull/33) 已合并 `5ff8d74`；31 项文件与 80 条相对链接全通过） | [任务书](../daily-specs/LD-G1-07.md)；交付索引：[docs/gate1-design-index.md](../gate1-design-index.md) |
| LD-G2-01 | 正式采集与日更数据契约 v1.0（4 套 JSON Schema + `ajv` 校验接缝 1） | B（契约） | Gemini | DeepSeek Harness R1–R2 独立审计（R2 通过） | ✅ DONE（[PR #47](https://github.com/fitalex/LexAIDaily/pull/47) `831095f`；[#39](https://github.com/fitalex/LexAIDaily/issues/39) 已关闭） | 审计归档：[PR #50](https://github.com/fitalex/LexAIDaily/pull/50)、[PR #51](https://github.com/fitalex/LexAIDaily/pull/51)；12/12 单测通过；确立 `fact_tier` 必填枚举与零原文全文字段红线 |
| LD-G2-02 | 双轨权威信源白名单库 v1.2（CN 12 + Global 14 + AIHOT 线索源）与准入标准 | B（信源） | Gemini | DeepSeek Harness R1–R6 独立审计（R6 通过） | ✅ DONE（[PR #54](https://github.com/fitalex/LexAIDaily/pull/54) `6be8689`；[#40](https://github.com/fitalex/LexAIDaily/issues/40) 已关闭） | 审计归档：[PR #50](https://github.com/fitalex/LexAIDaily/pull/50)–[#53](https://github.com/fitalex/LexAIDaily/pull/53)、[#55](https://github.com/fitalex/LexAIDaily/pull/55)、[#56](https://github.com/fitalex/LexAIDaily/pull/56)；7/7 单测通过；在线冒烟 25/26～26/26 可解析 |
| LD-G2-03 | 双轨分域采集器、`.cache/raw/` 7 天缓存、跨轨去重与公共汇流/选题池管线 | B（管线） | Gemini | DeepSeek Harness R1–R6 独立审计（R6 ACCEPT） | ✅ DONE（[PR #58](https://github.com/fitalex/LexAIDaily/pull/58) `e28edfa`；[#41](https://github.com/fitalex/LexAIDaily/issues/41) 含 #46 已关闭） | 审计归档：[PR #59](https://github.com/fitalex/LexAIDaily/pull/59)–[#62](https://github.com/fitalex/LexAIDaily/pull/62)；9/9 单测通过；`npm run daily` 统一总入口落盘 |
| LD-G2-04 | 两阶段提示词模板包（`v1.0.0`/`v1.1.0`）、Option B 详情契约与人工审校 SOP | B（内容与红线） | Gemini | DeepSeek Harness R1–R3 独立审计（R3 ACCEPT）+ Human 实测定稿 | ✅ DONE（[PR #63](https://github.com/fitalex/LexAIDaily/pull/63) `e4f6b81`；[#42](https://github.com/fitalex/LexAIDaily/issues/42) 已关闭） | 审计归档：[PR #64](https://github.com/fitalex/LexAIDaily/pull/64)（`c730c57`）；5/5 单测通过；确立 D-031（Option B `key_points` 1–3 段、合计 ≤600 字） |
| LD-G2-05 | 双层差异化一键导出 CLI（`export:dual`）、V16 富数据包与连续 3 期 24 条试运行样本 | A | Gemini | DeepSeek Harness R1–R2 独立审计（R2 ACCEPT） | ✅ DONE（[PR #65](https://github.com/fitalex/LexAIDaily/pull/65) `c38786a`；[#43](https://github.com/fitalex/LexAIDaily/issues/43) 已关闭） | 审计归档：[PR #66](https://github.com/fitalex/LexAIDaily/pull/66)（`fc57d46`）；3/3 单测通过；`webIndexSha256` `c8e6f9aa…c8ecde` 确定性复现 |
| LD-G2-06 | Gate 2 管线与双端导出独立交叉测试 + Gate 2 文档总索引同步 | A | Antigravity | Gemini 复核（ACCEPT） | ✅ DONE（[PR #67](https://github.com/fitalex/LexAIDaily/pull/67) `65f5641`；[#44](https://github.com/fitalex/LexAIDaily/issues/44) 已关闭） | 交叉测试 7/7 通过（`tests/cross-test/REPORT.md`）；总索引：[docs/gate2-index.md](../gate2-index.md)（89 条相对链接 0 断链） |
| LD-G2-07 | Gate 2 验收清单（逐字转写 ROADMAP 既有标准，供 Human 签署） | A | Gemini | DeepSeek Harness R1 独立审计（ACCEPT）；Human 签署 | ✅ DONE（[PR #68](https://github.com/fitalex/LexAIDaily/pull/68) `b037fc3`；[#45](https://github.com/fitalex/LexAIDaily/issues/45) 与父 Issue [#38](https://github.com/fitalex/LexAIDaily/issues/38) 均已关闭） | [验收清单](GATE2_ACCEPTANCE.md)；Human 于 [PR #68 评论 #7240865870](https://github.com/fitalex/LexAIDaily/pull/68#issuecomment-7240865870) 正式签署通过 Gate 2 并解锁 Gate 3 |

Gate 严格串行（ROADMAP）：**Gate 0、Gate 1、Gate 2 均已正式验收通过**（底座 ADR-0001～0003 及 `LD-G2-01`–`LD-G2-07` 全部合入 `main` 且对应 Issue `#38`–`#46` 全部关闭）；现正式解锁 **Gate 3（MVP 开发与双端上线）**。

## Human 待办

- [x] 首轮独立审计已完成（PR #3，2026-11-05，结论：需修改），报告原文见 docs/audits/LD-GOV-01-gpt-audit.md
- [x] （已于 PR #3 评论 `6652115636`、`6652516660` 确认）在 PR #3 留言确认或修订决策记录 D-001 至 D-004（审计 S1-01）
- [x] （已于 PR #3 评论 `6679648988` 确认选甲）明确确认 Gate 范围（D-005）
- [x] （已完成，PR #22 已合并 `f035894`）审阅并合并 `LD-GOV-03` PR，确认 D-025、D-026
- [x] （已完成，PR #24 已合并 `aa01a5d`）审阅并合并 `LD-G1-02C` 规范同步 PR，确认 D-027
- [x] （已完成，2026-11-24 已合并 [PR #25](https://github.com/fitalex/LexAIDaily/pull/25) 与 [PR #27](https://github.com/fitalex/LexAIDaily/pull/27)）审阅合并 `LD-G1-02C` 代码线与 `LD-G1-04` 真实样本集
- [x] （已完成，2026-11-25 已合并 PR #26 / #29 / #30 / #32 / #33 / #34）完成 Gate 1 全部设计原型、样本、交叉测试与文档索引合并
- [x] （已完成，2026-11-26 [PR #35](https://github.com/fitalex/LexAIDaily/pull/35) `a6ee3d0`）审阅并签署 `LD-G1-05`（`docs/coordination/GATE1_ACCEPTANCE.md`），正式解锁 Gate 2
- [x] （已完成，2026-11-26 `LD-G2-01` [PR #47](https://github.com/fitalex/LexAIDaily/pull/47)）确定“事实层级”（`fact_tier`）在 Gate 2 正式契约中为必填三档枚举，配 `unverified: boolean` 兜底
- [x] （已完成，2026-11-28 [PR #68](https://github.com/fitalex/LexAIDaily/pull/68) `b037fc3`）审阅并正式签署 `LD-G2-07`（`docs/coordination/GATE2_ACCEPTANCE.md`），通过 Gate 2 并解锁 Gate 3
- [ ] 启动 **Gate 3（MVP 开发与双端上线）** 架构对齐与 Spec 立项（含 Web 独立站点域名与部署方案、`editions-index.json` 动态接入、公众号「阅读原文」真机联调、LexAIDaily Skill 接口规范、GitHub Actions CI 配置，以及带入的 O1–O5 观察项收口）
- [ ] （可选）最终抽检 `docs/audits/README.md` 归档文件 blob SHA 与原报告一致（AGENTS.md 6.2）
- [ ] （可选）把仓库简介中的 “Leagal” 改为 “Legal”

## A 级授权台账

| 日期 | 任务 | 授权依据（一句话） | Human 已知悉 |
|---|---|---|---|
| 2026-11-07 | LD-G0-03 | Human 回复“开始 G0-03”，A 级只出报告，不改基线 | 是 |
| 2026-11-07 | LD-GOV-02 | B 级；Human 授权修订 AGENTS.md 过时表述，并于 18:05 豁免审计 | 是 |
| 2026-11-07 | LD-G0-05 | Human 指定 Astra 做 PR #6 的 1 轮独立审计并要求 Claude 写任务书；A 级，只出审计意见 | 是 |
| 2026-11-07 | LD-G0-04 | Human 回复“开这个 PR 并继续 G0-04”，A 级、Claude 为 Owner，触发 6.1(d) 审计 | 是 |
| 2026-11-09 | LD-G1-01 | 整体目标：Gate 1 原型。Human 2026-11-07 确认降为 A 并豁免审计（D-010） | 是 |
| 2026-11-11 | LD-G1-01A | 整体目标：Gate 1 原型。只把 Human 的三个答复（D-016）写入字段表 | 是 |
| 2026-11-11 | LD-G1-01B | 整体目标：Gate 1 原型。只改字段表展示层级、重要度与占位标记（D-019） | 是 |
| 2026-11-11 | LD-G1-04 | 整体目标：Gate 1 原型。真实资讯样本集，随 D-025 转由 Gemini 执行 | 是 |
| 2026-11-25 | LD-G1-06 | 整体目标：Gate 1 公众号导出结构与兼容性交叉测试（Antigravity）；经 PR #32 合并 | 是 |
| 2026-11-25 | LD-G1-07 | 整体目标：Gate 1 文档同步与交叉引用核对（Antigravity）；经 PR #33 合并 | 是 |
| 2026-11-26 | LD-G1-05 | 整体目标：Gate 1 验收清单（Gemini）；经 PR #35 合并签收 | 是 |
| 2026-11-28 | LD-G2-05 | 整体目标：Gate 2 双层导出 CLI 与 3 期试运行样本（Gemini 实现，DSH R1–R2 独立审计通过，零新增依赖）；经 PR #65 合并 | 是 |
| 2026-11-28 | LD-G2-06 | 整体目标：Gate 2 独立交叉测试与文档总索引（Antigravity 实现，Gemini 复核通过，零改业务代码）；经 PR #67 合并 | 是 |
| 2026-11-28 | LD-G2-07 | 整体目标：Gate 2 验收清单（Gemini 逐字转写 ROADMAP 原文，DSH R1 独立审计 ACCEPT，Human 正式签署）；经 PR #68 合并 | 是 |

## 决策记录

| 编号 | 日期 | 决策 | 决定者 | 依据 |
|---|---|---|---|---|
| D-001 | 2026-11-05 | A 级任务由 Claude 直接授权派发（后随 D-025 由 Gemini 承接） | Human | 原话：“A级任务你可以直接派发”（PR #3 两次留言确认） |
| D-002 | 2026-11-05 | DeepSeek Harness 加入，承担适配器、单测与独立审计/交叉测试 | Human | PR #3 两次留言确认 |
| D-003 | 2026-11-05 | Claude 无 GitHub 权限；GPT 网页版担任仓库操作员（后随 D-025 废止） | Human | PR #3 两次留言确认 |
| D-004 | 2026-11-05 | Gate 1 UI 由 Codex 使用 Figma MCP 完成（后随 D-011/012/013/027 替代） | Human | PR #3 两次留言确认 |
| D-005 | 2026-11-06 | Gate 范围按甲：Gate 1 只定义 UI 展示字段，正式采集数据契约归 Gate 2 | Human | PR #3 评论 `6679648988` 确认选甲 |
| D-006 | 2026-11-06 | 协作规范（AGENTS.md）列入 Gate 0 交付成果 | Human | [PR #6 评论](https://github.com/fitalex/LexAIDaily/pull/6#issuecomment-6705455666) 确认 |
| D-007 | 2026-11-06 | README 与 ROADMAP 不一致处以 ROADMAP 为准，并修改 README | Human | [PR #6 评论](https://github.com/fitalex/LexAIDaily/pull/6#issuecomment-6705455666) 确认 |
| D-008 | 2026-11-07 | 第三方代码与素材复用策略：宽松许可合规拷贝优先并登记 `THIRD_PARTY_NOTICES.md`，GPL/AGPL 只参考不拷贝 | Human | [PR #11 评论](https://github.com/fitalex/LexAIDaily/pull/11#issuecomment-6735751050) 确认 |
| D-009 | 2026-11-07 | 授权新增依赖 `juice`（MIT），用于公众号内联样式脚本 | Human | [PR #11 评论](https://github.com/fitalex/LexAIDaily/pull/11#issuecomment-6735751050) 确认 |
| D-010 | 2026-11-07 | `LD-G1-01` 由 B 降为 A；`LD-G1-01` 与 `LD-G1-05` 独立审计豁免 | Human | [PR #11 评论](https://github.com/fitalex/LexAIDaily/pull/11#issuecomment-6735751050) 确认 |
| D-011 | 2026-11-09 | 临时分工调整：Codex 暂停执行，任务改由 DeepSeek Harness 与 Antigravity 分担（后随 D-025 转正） | Human | [PR #11 评论](https://github.com/fitalex/LexAIDaily/pull/11#issuecomment-6735751050) 确认 |
| D-012 | 2026-11-09 | Antigravity 承担 `LD-G1-02` 原型设计 | Human | [PR #11 评论](https://github.com/fitalex/LexAIDaily/pull/11#issuecomment-6735751050) 确认 |
| D-013 | 2026-11-09 | Gate 1 设计工具由 Figma 改为 Penpot（后随 D-027 改为 Design-in-Code） | Human | [PR #11 评论](https://github.com/fitalex/LexAIDaily/pull/11#issuecomment-6735751050) 确认 |
| D-014 | 2026-11-09 | 授权 Antigravity 在 `LD-G1-02` 内使用图像生成（Nano Banana），标注“AI 生成” | Human | [PR #11 评论](https://github.com/fitalex/LexAIDaily/pull/11#issuecomment-6735751050) |
| D-015 | 2026-11-09 | `LD-G1-06` 交叉测试由 Antigravity 负责（仅限测试脚本，不改被测代码） | Human | [PR #11 评论](https://github.com/fitalex/LexAIDaily/pull/11#issuecomment-6735751050) |
| D-016 | 2026-11-11 | 资讯卡片按单标签；采纳“事实层级”三档；README/ROADMAP 简称差异先不改 | Human | [PR #12 评论](https://github.com/fitalex/LexAIDaily/pull/12#issuecomment-6785145973) |
| D-017 | 2026-11-11 | `LD-G1-02` 首版作废，按 `LD-G1-02A` 参考 iandaily.xyz 与 Canvas UI 返工 | Human | 2026-11-11 会话确认 |
| D-018 | 2026-11-11 | Canvas UI（MIT + Commons Clause）留待 Gate 3 Web 前端使用；Gate 1 不引入代码 | Human | [PR #17 评论](https://github.com/fitalex/LexAIDaily/pull/17#issuecomment-6790808909) |
| D-019 | 2026-11-11 | Web 列表卡片不展示实务影响（移至详情页）；“重要度（头条/常规）”由 Human 终审勾选，AI 不得自标 | Human | 2026-11-11 会话确认 |
| D-020 | 2026-11-13 | 移动端卡片摘要字号不小于 14px、不超过 3 行；桌面端摘要 15px | Human | PR #16 评论 `6847634086` |
| D-021 | 2026-11-14 | 示例数据口径：桌面端 11 条、移动端 6 条，全部标“示例” | Human | PR #16 评论 `6869545932` |
| D-022 | 2026-11-14 | 分类筛选结果少的页面下半屏留白可接受 | Human | PR #16 评论 `6874207216` |
| D-024 | 2026-11-15 | 画板 05 摘要 10px 仅为原型示意，Gate 3 网页实现按不小于 14px | Human | PR #16 评论 `6888462817` |
| D-025 | 2026-11-22 | 多 Agent 协作架构重组（`AGENTS.md` V2.0）：Gemini 接任总协调者，ChatGPT 退出，DeepSeek Harness 与 Antigravity 分工转正 | Human | PR #22 已合并 |
| D-026 | 2026-11-22 | Human 书面豁免 `LD-GOV-03` 与 PR #16 字体许可增量复审的独立审计 | Human | PR #22 已合并 |
| D-027 | 2026-11-23 | Gate 1 放弃 Penpot，改用复古报刊风 Design-in-Code 静态 HTML/CSS 原型（`LD-G1-02C`） | Human | PR #24 已合并 |
| D-028 | 2026-11-23 | `LD-G1-02C` 代码线由 Gemini 负责并豁免 6.1(d) 审计，由 Human 直接视觉验收 | Human | PR #25 已合并 |
| D-029 | 2026-11-24 | 历史归档规范：前端近 3 日保留完整日报，超期按 ISO 周归档高价值情报、剔除低价值堆积 | Human | PR #25 已合并 |
| D-030 | 2026-11-24 | 公众号单条保留 1 句极简「实务影响」+「阅读原文」跳 Web 详情页；Web 主纸底采用 `#D5C5AE` | Human | PR #25 / #29 已合并 |
| D-031 | 2026-11-28 | Gate 2 详情页 `key_points` 采纳 Option B 契约（1–3 段核心观点四步论证、合计 ≤600 字、每段最多 1 长句、去 AI 腔与零元标注），并在通过 DSH R1–R6 独立审计与 Antigravity 7/7 交叉测试后，正式签署验收 Gate 2（关闭 `#38`、`#40`、`#45`），解锁 Gate 3 | Human | PR #63 实测确认；[PR #68 评论 #7240865870](https://github.com/fitalex/LexAIDaily/pull/68#issuecomment-7240865870) 正式签署 |

决策记录须附 Human 原话或链接，并经 Human 在 PR 中确认后生效；协调者起草的记录不单独构成授权。
