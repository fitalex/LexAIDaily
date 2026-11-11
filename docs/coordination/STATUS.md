# 状态看板

最后更新：2026-11-11（Claude）｜当前阶段：Gate 1 进行中；LD-G1-01、LD-G1-01A 已完成并合并（PR #12、#14），字段表 v0.1 已定稿（D-016）；下一步 LD-G1-02（待 Penpot 就绪后由 Human 触发），LD-G1-04 可并行；LD-G1-03 待 LD-G1-02 合并｜基准：`main`（以实际最新 commit 为准）

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
| LD-G1-01 | 资讯卡片展示字段定义 v0（仅供 UI 与排版原型；正式采集数据契约归 Gate 2） | A（Human 2026-11-07 由 B 降为 A，D-010） | DeepSeek Harness（D-011，原 Codex） | Claude；独立审计已豁免（D-010） | ✅ DONE（[PR #12](https://github.com/fitalex/LexAIDaily/pull/12) 已合并 `419cda7`；Claude 复核两轮，第二轮通过；Human 2026-11-11 答复三个待决问题并要求合并） | [任务书](../daily-specs/LD-G1-01.md)；首轮复核 F01–F04 已由 Owner 在原 PR 修复；三个答复见 D-016，由 LD-G1-01A 写入字段表 |
| LD-G1-01A | 字段表定稿：写入 Human 对三个待决问题的答复（D-016） | A | DeepSeek Harness（D-011） | Claude；不触发独立审计（Claude 判断，Human 可追加） | ✅ DONE（[PR #14](https://github.com/fitalex/LexAIDaily/pull/14) 已合并，merge commit `6e2b986`；Claude 复核通过，Human 2026-11-11 合并） | [任务书](../daily-specs/LD-G1-01A.md)；复核无 S1、S2，余 3 项 S3（PR 行数统计不自洽、3.3 节两条重复、第六节一句流程说明）不阻断；事实层级是否必填仍待 Human 决定 |
| LD-G1-02 | 设计系统与 Web 桌面/移动原型 | B（跨 Gate） | Antigravity（D-012，原 Codex） | Claude；GPT 网页版独立审计（6.1(c)，Human 可豁免）；Human 视觉验收 | 🟢 AUTHORIZED_TO_EXECUTE（Human 已于 [PR #11 评论](https://github.com/fitalex/LexAIDaily/pull/11#issuecomment-6735352277) 授权；LD-G1-01、LD-G1-01A 已合并；待 Penpot 就绪（见 Human 待办）后由 Human 触发；基准以最新 main 为准，任务书所写 `048cb09` 已过期） | [任务书](../daily-specs/LD-G1-02.md)；依赖 LD-G1-01、LD-G1-01A；使用 Penpot（开源免费，D-013）及其 MCP 服务，**须先经 Human 授权**；图像生成可使用 Nano Banana（D-014）；第三方拷贝按 D-008 登记；执行者提供截图、Penpot 版本与素材来源记录 |
| LD-G1-03 | 公众号每日栏目内联排版模板原型 | B（跨 Gate） | DeepSeek Harness（D-011，原 Codex） | LD-G1-06 交叉测试（执行者待指定）；Claude；GPT 网页版独立审计（6.1(c)，Human 可豁免）；Human 视觉验收 | 🟢 AUTHORIZED_TO_EXECUTE（Human 已于 [PR #11 评论](https://github.com/fitalex/LexAIDaily/pull/11#issuecomment-6735352277) 授权；待 LD-G1-01、LD-G1-01A、LD-G1-02 合并后开工） | [任务书](../daily-specs/LD-G1-03.md)；依赖 LD-G1-01、LD-G1-01A、LD-G1-02（DeepSeek Harness 任务不并行）；juice 依赖已授权（D-009），其余须 Human 授权；微信 iOS/Android 真机预览由 Human 执行 |
| LD-G1-04 | 真实资讯样本集（原型填充与扫读评审用，不对外发布） | A | GPT 网页版 | Claude 核验一手链接与事实 | 🟢 AUTHORIZED_TO_EXECUTE（A 级，已登记台账；交接包已备好，待 Human 粘贴给 GPT 网页版） | [任务书](../daily-specs/LD-G1-04.md)；[交接包](../daily-specs/LD-G1-04-handoff.md)；可与 LD-G1-02 并行；AGENTS 4 未定义 GPT 网页版分支前缀，待补 |
| LD-G1-05 | Gate 1 验收清单（只转写 ROADMAP 既有验收标准） | A | Claude | GPT 网页版（核对转写）；独立审计已豁免（D-010，Human 已确认且未更正范围）；Human 签署 | 📝 PROPOSED | [任务书](../daily-specs/LD-G1-05.md)；依赖 LD-G1-01 至 04、06 完成 |
| LD-G1-06 | 公众号排版导出结构与兼容性交叉测试（不做视觉判断） | A | Antigravity（D-015） | Claude | 📝 PROPOSED | [任务书](../daily-specs/LD-G1-06.md)；依赖 LD-G1-03 READY_FOR_REVIEW；Antigravity 不是 LD-G1-03 的实现者，符合交叉测试要求 |
| LD-G1-07 | Gate 1 文档同步与交叉引用核对（不改设计内容） | A | Antigravity | Claude | 📝 PROPOSED | [任务书](../daily-specs/LD-G1-07.md)；依赖 LD-G1-01、02、03 中已合并者，可分批 |

Gate 严格串行（ROADMAP）：Gate 0 已验收，LD-G1 系列可按依赖顺序开工；LD-G1-01（已完成）、LD-G1-01A、LD-G1-02（Antigravity，D-012）、LD-G1-03（DeepSeek Harness）依次执行，不并行；LD-G1-04（GPT 网页版）可与它们并行。B 级任务（LD-G1-02、03）须 Human 授权后才能开工。

## Human 待办

- [x] 首轮独立审计已完成（PR #3，2026-11-05，结论：需修改），报告原文见 docs/audits/LD-GOV-01-gpt-audit.md
- [x] （已于 PR #3 评论 `6652115636`、`6652516660` 确认）在 PR #3 留言确认或修订决策记录 D-001 至 D-004（审计 S1-01）；确认前不启动任何 A 级任务
- [x] （已于 PR #3 评论 `6679648988` 确认选甲）明确确认 Gate 范围（D-005）：甲 = Gate 1 只做 UI 展示字段、正式采集数据契约放 Gate 2（建议，与 ROADMAP 一致）；乙 = 提前并调整 ROADMAP。你说“以路线图为准”，我按甲记录，请在 PR 留言确认
- [ ] 注册 Penpot 免费账号并新建文件，在 Antigravity 连接 Penpot MCP（见 LD-G1-02 第八节）；访问令牌只放你本机或 Antigravity 所在环境，不入库
- [x] 合并 PR #11：Human 2026-11-09 17:07 会话原话“直接帮我合并合并 PR #11”，授权 Claude 执行合并（Claude 不自行决定合并）
- [x] 对 DeepSeek Harness 说“执行 LD-G1-01”：已完成，PR #12 已合并（2026-11-11）
- [x] 回答 LD-G1-01 的三个待决问题并合并 PR #12：Human 2026-11-11 于 [PR #12 评论](https://github.com/fitalex/LexAIDaily/pull/12#issuecomment-6785145973) 答复（见 D-016），并指示 Claude 合并
- [x] 对 DeepSeek Harness 说“执行 LD-G1-01A”并合并 PR #14：已完成（2026-11-11，`6e2b986`）
- [ ] 决定“事实层级”是否必填（目前为条件显示；Claude 建议 Gate 1 保持条件显示，Gate 2 定数据契约时再决定）
- [ ] 把 [LD-G1-04 交接包](../daily-specs/LD-G1-04-handoff.md) 全文粘贴给 GPT 网页版，并把它的回复原文贴回对应 PR
- [x] （已于 [PR #11 评论](https://github.com/fitalex/LexAIDaily/pull/11#issuecomment-6735751050) 确认 D-008 至 D-013）在 Gate 1 任务书 PR 中确认决策 D-008 至 D-010 等
- [x] （已于 [PR #11 评论](https://github.com/fitalex/LexAIDaily/pull/11#issuecomment-6735352277) 授权）LD-G1-02、LD-G1-03（B 级）；图像生成见 D-014
- [x] （已于 [PR #11 评论](https://github.com/fitalex/LexAIDaily/pull/11#issuecomment-6735751050) 确认）D-011、D-012、D-013；并指定 LD-G1-06 的交叉测试执行者为 Antigravity（D-015）
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
| 2026-11-09 | LD-G1-01 | 整体目标：Gate 1 原型。Human 2026-11-07 确认降为 A 并豁免审计（D-010）；Claude 依 D-001 授权派发，Owner 依 D-011 为 DeepSeek Harness；仅定义 UI 展示字段，无依赖、无对外发布 | 是 |
| 2026-11-11 | LD-G1-01A | 整体目标：Gate 1 原型。只把 Human 的三个答复（D-016）写入字段表，无新增字段、依赖与对外发布；Claude 依 D-001 授权派发，Owner 依 D-011 为 DeepSeek Harness | 是（内容即 Human 的答复；已执行并合并） |
| 2026-11-11 | LD-G1-04 | 整体目标：Gate 1 原型。真实资讯样本集，内部评审用，不对外发布，无依赖与费用；Claude 依 D-001 授权派发，Owner 为 GPT 网页版；交接包已备好 | 是（待 Human 触发） |

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
| D-008 | 2026-11-07 | 第三方代码与素材的复用策略：合规拷贝优先，其余参考。“合规拷贝”的做法：许可证须为 MIT、Apache-2.0、BSD、ISC、WTFPL、CC0 一类宽松许可，并且取最小必要部分、保留版权与许可证声明、登记到根目录 `THIRD_PARTY_NOTICES.md`（来源仓库、commit SHA、路径、许可证、改动说明）；GPL、AGPL、非商用、无许可证的内容只参考，不拷贝；许可证只覆盖代码，不覆盖品牌标识、图片与内容数据。登记表只记录第三方许可，不构成本仓库许可证声明（AGENTS 10.7）。每个涉及拷贝的任务按 6.1(c) 触发独立审计，Human 可书面豁免 | Human（做法由 Claude 起草） | Human 原话：“复用策略为：合规拷贝优先，其余参考”；上述具体做法由 Claude 补充，Human 已于 [PR #11 评论](https://github.com/fitalex/LexAIDaily/pull/11#issuecomment-6735751050) 确认（2026-11-09） |
| D-009 | 2026-11-07 | 授权新增依赖 juice（Automattic/juice，MIT），仅用于 LD-G1-03 的公众号内联样式原型脚本；版本固定、锁文件入库、`--ignore-scripts` 安装 | Human | Human 原话：“授权 juice 这个依赖”；Human 已于 [PR #11 评论](https://github.com/fitalex/LexAIDaily/pull/11#issuecomment-6735751050) 确认（2026-11-09） |
| D-010 | 2026-11-07 | LD-G1-01 由 B 降为 A；独立审计豁免。豁免范围：Claude 记为适用于 LD-G1-01，并适用于 LD-G1-05（对应 Claude 当时的提问“是否给 LD-G1-05 做独立审计”），范围若与 Human 本意不同，Human 确认时未更正；LD-G1-02、03 的 6.1(c) 审计不在此豁免内 | Human | Human 原话：“确认 LD-G1-01 降为 A，审计豁免”；Human 已于 [PR #11 评论](https://github.com/fitalex/LexAIDaily/pull/11#issuecomment-6735751050) 确认（2026-11-09） |
| D-011 | 2026-11-09 | 临时分工调整：Codex 暂时不执行任务，原 Codex 任务改由 DeepSeek Harness 负责；Antigravity 可配合工作。影响：(1) 在此期间本决策取代 D-004 中“UI 由 Codex 完成”的部分（其中 LD-G1-02 的承担者随后由 D-012 改为 Antigravity）；(2) AGENTS.md 未修改，其中各 Agent 的职责与权限边界仍按原文，本决策只对任务书载明的具体任务作明示例外（如 `design/`、`scripts/` 默认归 Codex，由任务书授权 DeepSeek Harness 使用）；(3) DeepSeek Harness 不能再交叉测试自己实现的模块，LD-G1-06 执行者已由 D-015 指定为 Antigravity；(4) 恢复 Codex 由 Human 指示；若要永久修改 AGENTS.md，须另开 LD-GOV 任务（B 级，6.1(a) 审计） | Human | Human 原话：“Codex暂时不执行任务，改由Deepseek harness负责；此外Antigravity可以配合工作”；Human 已于 [PR #11 评论](https://github.com/fitalex/LexAIDaily/pull/11#issuecomment-6735751050) 确认（2026-11-09） |
| D-012 | 2026-11-09 | Antigravity 承担 LD-G1-02 的原型设计，并放宽其任务范围：在 LD-G1-02 范围内可产出设计稿（工具见 D-013）、设计令牌及 `design/` 下相关文件。AGENTS 1 中“不写代码”的限制不变（不写前端工程），其他边界不变（不改冻结基线、编辑原则、数据契约）。LD-G1-02 的承担者由 D-011 的 DeepSeek Harness 改为 Antigravity，LD-G1-01、03 仍由 DeepSeek Harness。图像生成仅在 Antigravity 环境具备且 Human 另行授权时使用。AGENTS.md 未修改，同 D-011 只作任务书载明范围内的例外 | Human | Human 原话：“Antigravity有figma插件，可以Antigravity承担原型设计工作，放宽它的任务范围”；Human 已于 [PR #11 评论](https://github.com/fitalex/LexAIDaily/pull/11#issuecomment-6735751050) 确认（2026-11-09） |
| D-013 | 2026-11-09 | Gate 1 设计工具由 Figma 改为开源免费方案 Penpot（MPL-2.0；免费云端版，也可自托管），由 Antigravity 经其 MCP 服务操作。理由：Human 使用 Figma 免费账号，而 Figma 官方文档显示其 MCP 对免费 Starter 套餐的 Full 与 Dev 席位不提供访问。影响：(1) 取代 D-004 中“Figma MCP”的部分；(2) AGENTS 10.10 中的“Figma”按 Penpot 理解，`design/` 保存 Penpot 链接、版本、导出的设计令牌与截图，另可保存 Penpot 文件导出备份；AGENTS.md 未修改，同 D-011 只作任务书载明范围内的例外；(3) Penpot 免费版只保留 7 天版本历史，故要求导出备份；(4) Penpot MCP 与 Antigravity 的兼容性未验证，开工前连通小测，失败则交 Claude；(5) 只使用工具，不拷贝 Penpot 代码，使用其内置 UI 库或模板按 D-008 登记 | Human（工具选择由 Claude 检索后提出） | Human 原话：“我是Figma免费账号，直接改成开源免费方案吧，你检索一些”；选 Penpot 是 Claude 的建议，Human 已于 [PR #11 评论](https://github.com/fitalex/LexAIDaily/pull/11#issuecomment-6735751050) 确认（2026-11-09） |
| D-014 | 2026-11-09 | 授权 Antigravity 在 LD-G1-02 内使用其可调用的图像生成（Nano Banana）。条件沿用任务书：登记生成方式、提示词、来源与授权，标注“AI 生成”，不生成真实人物肖像与仿冒真实机构的标识。Human 未设费用上限，故如需付费或超出免费额度，停止并交 Claude | Human | 原话：“Antigravity可以生图，可直接调用nanobananan”（[PR #11 评论](https://github.com/fitalex/LexAIDaily/pull/11#issuecomment-6735751050)） |
| D-015 | 2026-11-09 | LD-G1-06 交叉测试由 Antigravity 负责。Claude 的理解：这同时是 Human 对该任务放宽 AGENTS 1“不写代码”限制，范围仅限 `tests/wechat-prototype/` 下的测试脚本，不得改被测代码。Antigravity 不是 LD-G1-03 的实现者，符合“实现者与交叉测试者不得是同一 Agent”。放宽范围若与 Human 本意不同，请在 PR 中更正 | Human（放宽范围为 Claude 的理解） | 原话：“LD-G1-06交叉测试让Antigravity负责”（[PR #11 评论](https://github.com/fitalex/LexAIDaily/pull/11#issuecomment-6735751050)） |
| D-016 | 2026-11-11 | 对 LD-G1-01 三个待决问题的答复：(1) 资讯卡片按单标签（每条一个分类）；(2) 采纳“事实层级”三档（已证实事实 / 官方数据 / 市场观点）；(3) README 简称与 ROADMAP 全称的差异先不改。Claude 的记录说明：Human 原话未限定“单标签”的适用范围，Claude 提议的表述是“Gate 1 按单标签”，Gate 2 数据契约是否沿用，届时另行决定；“采纳”未说明事实层级是否必填，字段表保持“条件显示”，待 Human 另行决定 | Human | 原话：“1.按单标签；2.采纳；3.先不改；”（[PR #12 评论](https://github.com/fitalex/LexAIDaily/pull/12#issuecomment-6785145973)）；由 LD-G1-01A 写入字段表 |

决策记录须附 Human 原话或链接，并经 Human 在 PR 中确认后生效；Claude 起草的记录不单独构成授权。
