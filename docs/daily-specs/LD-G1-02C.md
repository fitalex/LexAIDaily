# LD-G1-02C｜PR #16 设计收尾（还原画板 05，冻结设计）

- 任务类型：Design
- 级别：B（同 LD-G1-02B 整体目标；变更执行者与使用外部工具 Cursor、Penpot MCP 须 Human 授权）
- 授权来源：待 Human 在本任务书 PR 中确认（Human 2026-11-15 提议由 Cursor 接手 PR #16 设计收尾）
- 任务 Owner：Cursor（Human 指定，取代 Antigravity 接手收尾；记为 D-023，待 Human 确认）
- 复核者：Claude
- 独立审计：是，GPT 网页版，依据 AGENTS.md 6.1(c)，范围限三套字体 OFL 许可与第三方素材记录；仅 Human 可豁免
- Final Approver：Human Maintainer
- 基准：PR #16 head `6ad4918`｜分支：沿用 PR #16 原分支 `ag/ld-g1-02-design-system`（原 PR 修复，不开新 PR；Antigravity 已停止推送）｜PR：[#16](https://github.com/fitalex/LexAIDaily/pull/16)
- 所属 Gate：Gate 1｜对应验收标准：以 LD-G1-02B 任务书为准
- 依赖：LD-G1-02B 已交付（Claude 复核至第十一轮）｜被依赖：LD-G1-03、LD-G1-05

## 一、背景与目标

Claude 第十一轮复核（[`docs/audits/LD-G1-02B-claude-review-r11.md`](../audits/LD-G1-02B-claude-review-r11.md)）发现 B6 把画板 05 改坏（文字重叠、摘要溢出）。Human 要求尽快收尾，不再深究设计细节。目标：只还原 05，其余冻结，使 PR #16 可交 Human 决定合并。

## 二、范围

- **输入**：Penpot 文件及版本历史；`d8232cc` 时的 `design/screenshots/g1-02b/05-mobile-dashboard.png`（还原对照）；第十一轮复核。
- **输出**：还原后的画板 05 导出图；两份文档中关于 05 的说明改写。
- **可改文件**：`design/screenshots/g1-02b/05-mobile-dashboard.png`；`design/penpot.md`、`design/design-system.md` 中关于画板 05 的段落；`design/tokens/tokens.json` 中 B6 为 05 新增或改动的移动端令牌（`margin`、列宽、摘要字号相关）还原为 `d8232cc` 的值。
- **不可改文件**：其余全部 `design/` 内容与截图；`AGENTS.md`、`README.md`、ROADMAP.md、`docs/`。
- **非范围**：任何新的设计改动；B7；移动端 14px 摘要（转 Gate 3 网页实现落实）。

## 三、冻结边界

画板 01、02、03、04、06、07、08、09 一律不改，导出图必须与 `6ad4918` 逐字节相同。D-019 至 D-022 已定内容不改。

## 四、DoD

| 序号 | 验收标准 | 证明方式 |
|---|---|---|
| D01 | 05 与 `d8232cc` 的 05 一致（允许因字体渲染差异 >24 阈值差异 ≤0.1%） | 双阈值像素比对命令与输出 |
| D02 | 其余八张图与 `6ad4918` 逐字节相同 | `cmp` 或哈希输出 |
| D03 | 文档不再声称 05 达到“14px 严格 3 行”“边距 14px、列宽 173px”；改写为“未达成，转 Gate 3 网页实现落实”；令牌与 `d8232cc` 中 05 相关值一致 | `git diff` |
| D04 | 无凭据；JSON 有效 | `python3 -m json.tool` 与 `grep` 输出 |

## 五、验证与证据要求

- 必须运行：九张图的双阈值像素比对（基准分别为 `d8232cc`（仅 05）与 `6ad4918`（其余八张））；JSON 校验；凭据扫描。
- 报告里的数字只能来自你自己运行的命令。如实记录未执行项。

## 六、交接与回传

- 完成后：在 PR #16 原分支提交一个提交，PR 评论贴证据；停下，不合并。
- Penpot 访问令牌不入库、不贴进 PR。

## 七、升级条件

遇到以下情况停止并交 Claude：版本历史无法还原 05；还原需要改动其他画板；发现 05 之外的新缺陷（只报告，不修）。

## 八、Human 工作清单

- [ ] **工作目标**：确认 D-023（Cursor 接手收尾）并授权 LD-G1-02C。**工作链接**：本任务书 PR。**执行步骤**：1. 在 PR 评论回复“确认 D-023，授权 LD-G1-02C”。2. 把 Penpot MCP 接入 Cursor。3. 对 Cursor 说“执行 LD-G1-02C”并附任务书路径；同时确认 Antigravity 不再向该分支推送。
- [ ] **工作目标**：决定独立审计。**执行步骤**：回复“做字体许可短审计”，或“豁免审计，理由：…”。
- AI 不得代签、代批的边界：授权、合并、视觉验收、审计豁免。
