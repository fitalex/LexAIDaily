# LD-GOV-01 整改回应（Owner：Claude，含第二、三轮）

- 回应对象：[GPT 网页版独立审计](LD-GOV-01-gpt-audit.md)（2026-11-05，基准 `a87e7fe`，结论：需修改）
- 处理方式：全部采纳，在原 PR #3 修订，保留原审计原文与结论，不改写为通过。
- 本回应是 Owner 的自述，**不构成审计通过**；是否关闭由 GPT 网页版增量复审和 Human 决定。

## 逐项回应

| 编号 | 处理 | 修改位置 | 状态 |
|---|---|---|---|
| S1-01 | 采纳。决策记录补 Human 原话；注明待 Human 在 PR #3 确认、确认前不生效，确认前不启动任何 A 级任务；新增“Claude 起草的记录不单独构成授权” | AGENTS.md 2（三处记录的关系）、3.1、14；STATUS 决策记录 | **待 Human 确认**，我无法自行关闭 |
| S1-02 | 采纳。判级按整体目标和累计变更；涉及权限、授权分级、审计规则、治理标准一律 B 级；降级与豁免审计须 Human 确认；A 级台账写明所属整体目标 | AGENTS.md 3.1；手册 2、9 | 已修改，待复审 |
| S2-01 | 采纳。保留 GPT 双角色，一致性检查与治理审计分别记录；治理 PR 由 Human 审 diff 后合并 | AGENTS.md 6.6(e)(f) | 已修改，待复审 |
| S2-02 | 采纳。新增 6.1(e)：数据契约字段语义、分类逻辑、信源权重与分级、AI 提示词等影响内容真实性的变更须独立审计；同时列入 B 级条件 | AGENTS.md 6.1、3.1 | 已修改，待复审 |
| S2-03 | 采纳。Gate 1 只做 UI 展示字段定义，LD-G1-01 改名并限定范围；正式采集数据契约归 Gate 2，提前须 Human 批准调整 Gate 范围 | AGENTS.md 5、10.3；STATUS；任务书索引 | 已修改，**范围决定待 Human** |
| S2-04 | 采纳。法律高风险条目核查发布机构、日期、版本、效力状态；无法核实标“未核实”，不写成确定事实 | AGENTS.md 8.2；手册 8 | 已修改，待复审 |
| S2-05 | 采纳。Codex 工程与 UI 任务依次执行；记录 Figma 文件版本、素材来源与授权；Codex 提供截图与导出证据，Human 视觉验收；明确 DeepSeek 只测导出结构与兼容，不做视觉判断 | AGENTS.md 5、10.10；STATUS | 已修改，待复审 |
| S2-06 | 采纳。写明 main、PR、STATUS 的关系；审计不通过或 Human 要求修改时转 CHANGES_REQUESTED，由原 Owner 在原 PR 修复；Human 否决转 CANCELLED，不得标 DONE；状态图同步 | AGENTS.md 2、3.2 | 已修改，待复审 |
| S3-01 | 采纳。统一改为“不依赖聊天记忆，事实以仓库中已核验记录为准” | AGENTS.md 1、2、6.4；手册 1 | 已修改 |
| S3-02 | 采纳。本次随 PR 补齐文件地图所列全部文件；新增生效条件（审计通过、D-001 至 D-004 确认、文件齐全且链接检查通过、Human 批准） | AGENTS.md 14 | 已修改 |

## 我自己的核对

- 链接检查：除 `README.md`（仓库已有）外，相对链接全部存在。
- 状态图已重新渲染通过。
- 以上均为文档修改，无 CI 可运行；未运行任何自动化测试。

## Human 工作清单

- [ ] **工作目标**：确认或修订决策 D-001 至 D-004（回应 S1-01）
  - **工作链接**：[PR #3](https://github.com/fitalex/LexAIDaily/pull/3)；[STATUS 决策记录](../coordination/STATUS.md)
  - **执行步骤**：1. 打开 PR #3，查看 `docs/coordination/STATUS.md` 的决策记录。 2. 对每条写“确认 / 修订为…/ 撤回”。 3. 在 PR 留言提交。
- [ ] **工作目标**：决定 Gate 范围（回应 S2-03）
  - **工作链接**：[README 路线图](https://github.com/fitalex/LexAIDaily/blob/main/README.md)
  - **执行步骤**：选一项并在 PR 留言：(甲) Gate 1 只做 UI 展示字段，正式采集数据契约放 Gate 2（我的建议）；(乙) 批准提前，并相应调整 Gate 范围。
- AI 不得代你确认、批准或合并。

## 第二轮回应（针对 commit `a8bf671` 的增量审计）

我只拿到 GPT 网页版的摘要，评论全文在 GitHub，未能读取；下表只回应摘要中列出的项目，评论中若有更多细节，以评论为准。

| 项目 | 处理 | 位置 |
|---|---|---|
| 任务书模板遗漏审计条件 6.1(e) | 采纳，已改为 6.1(a-e)；同时新增“所属 Gate / 对应验收标准”字段 | docs/templates/TASK_BOOK.md |
| 任务索引仍写“PR 待建” | 采纳，已改为 PR #3 链接 | docs/daily-specs/README.md |
| 首轮审计报告未完全保留原文格式 | **不由我修复。** 我归档的是 Human 提供的文本文件，已用 `cmp` 核对逐字节一致；GPT 网页版聊天界面的渲染格式我拿不到。建议操作员用其原始输出覆盖该文件，我不再改动它 | docs/audits/LD-GOV-01-gpt-audit.md |
| D-001 至 D-004 最终授权确认 | 需 Human 在 PR #3 针对最新版本明确确认或修订；已列入 STATUS 待办 | STATUS 决策记录与待办 |

## 并入的 ROADMAP 对齐修改（新增审计面，请重点复审）

Human 在整改期间提供了 ROADMAP.md（尚未入库）。为对齐它，本轮额外修改：

- AGENTS.md 10.2、10.3、8.1：冻结基线加入 ROADMAP.md；Gate 严格串行，前一 Gate 未经 Human 正式验收前只准备任务书；Gate 目标与验收标准以 ROADMAP 和 README 为准，不一致交 Human。
- AGENTS.md 4、TASK_BOOK：DoD 须对应所属 Gate 验收标准条目。
- AGENTS.md 5：Gate 1 排版模板须经 Human 在 iOS、Android 微信客户端真机预览。
- STATUS、任务书索引：新增 LD-G0-02 至 04、LD-G1-04；LD-G1 系列待 Gate 0 验收后开工；Human 待办补充 README 与 ROADMAP 不一致项（Gate 0 勾选状态、Gate 名称）。
- 手册：新增第 10 节 Gate 分工预案。

## 第三轮回应（针对 commit `8a76086` 的增量审计）

第三轮审计目前只有 PR 评论和 GPT 的摘要，尚未归档为文件；下表回应摘要列出的项目，评论若有更多条目，以评论为准。

**我需要更正一处**：第二轮审计全文（已归档为 [LD-GOV-01-gpt-audit-r2.md](LD-GOV-01-gpt-audit-r2.md)）的 S2-02 同时指出了 AGENTS.md 第 5 节工程行只提 6.1(c)，我第二轮回应表只列了摘要里的项目，漏了这一条；这是回应表不完整，不是审计意见变化。

| 项目 | 处理 | 位置 |
|---|---|---|
| S2-02 遗留：AGENTS.md 第 5 节只引用 6.1(c) | 采纳，改为按 6.1(a)-(e) 判断 | AGENTS.md 5 |
| 任务书模板 Owner 枚举缺 DeepSeek Harness | 采纳 | docs/templates/TASK_BOOK.md |
| LD-G0-04 可能通过 A 级验收清单改变验收标准 | 采纳。验收清单只能转写冻结基线的既有验收标准，不得新增、降低或改写，差异只报告给 Human | AGENTS.md 10.2；STATUS；任务书索引；手册第 10 节 |
| 审计索引仍写“待归档” | 采纳，第二轮已链接；第三轮标明待归档 | docs/audits/README.md |
| STATUS 人工确认记录未同步 | 采纳，引用 Human 在 PR #3 的留言及时间；注明措辞含糊，待明确 | STATUS 决策记录与待办 |
| ROADMAP 未入库，无法核验 | **待 Human**：提供并固定版本，经 LD-G0-02 入库；本轮请 Human 把原文件上传给 GPT 仅作核验 | STATUS 待办 |
| 首轮审计报告格式 | 已由 GPT 按原始回复恢复，本地副本已同步仓库版本 | docs/audits/LD-GOV-01-gpt-audit.md |

**我自行新增的一条规则（请复审）**：AGENTS.md 6.2 增加“审计意见须以文件形式归档，PR 评论只作通知”，原因是我无法读取 PR 评论，只能读仓库文件。

## 第四轮回应（针对 commit `08b29e9` 的增量审计，评论 issuecomment-6653214636）

本轮已读到审计全文（附件），下表覆盖全部新发现；第三轮遗留项的复核结论（已解决 / 部分解决 / 待 Human）以审计为准，我不自行宣称关闭。

| 项目 | 处理 | 位置 |
|---|---|---|
| S2：§6.2 缺少审计文件固定 SHA 与独立来源核验规则 | 采纳。新增审计证据约束：PR 通知须含结论、被审 commit SHA、归档文件固定链接与 blob SHA；已归档文件不得修改，新一轮另存；Claude 用 `git hash-object` 核对并记录；Human 最终批准前核对归档与评论原文；无法核对的意见不得作通过依据。已回填 r1–r3 的 blob SHA | AGENTS.md 6.2；docs/audits/README.md |
| S3：审计索引仍显示 R3 待归档 | 采纳。已链接 r3 文件；新增 r4 行，待操作员原样提交 | docs/audits/README.md |
| S3：STATUS 引用和整改状态滞后 | 采纳。更新整改状态；补记 Human 07:39:30 UTC 更明确的确认留言；区分“决策确认”与“规范正式批准”；不改动 Human 决策原文 | STATUS |
| 部分解决：ROADMAP 未入库 | 待 Human：LD-G0-02 另开 PR；并新增生效条件 (5)：ROADMAP 入库且 README 对齐 | AGENTS.md 14；STATUS |

另：按 Human 本轮三项回复登记 D-005（Gate 甲，**待明确确认**）、D-006（AGENTS.md 列入 Gate 0 交付）、D-007（以 ROADMAP 为准并修改 README），并把 LD-G0-02 范围改为“ROADMAP 入库与 README 对齐”。这些均为我的记录，需 Human 在 PR 中确认才生效。

我的自我核对：新增规则只增加证据约束，不改变权限；未运行自动化测试（无 CI）。
