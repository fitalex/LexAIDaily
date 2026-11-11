# LD-G1-01A｜字段表定稿：写入 Human 对三个待决问题的答复

- 任务类型：Documentation（修订 LD-G1-01 的交付文件）
- 级别：A（理由：只把 Human 已作出的决定（D-016）转写进字段表，不新增字段、不改五类标签、不涉及依赖与对外发布；字段表是 UI 展示字段，不是 Gate 2 数据契约，D-005）
- 授权来源：A 级：Claude，见 STATUS 台账（2026-11-11）；决定依据 D-016
- 任务 Owner：DeepSeek Harness（D-011）
- 复核者：Claude
- 独立审计：否。我的判断：本任务只转写 Human 的决定，不改变字段语义，不触发 AGENTS 6.1。这是 Claude 的判断而不是豁免；Human 如认为应审，可在 PR 中追加
- Final Approver：Human Maintainer
- 基准：`main`（Commit SHA：`419cda7`；开工前以最新 main 为准）｜分支：`ds/ld-g1-01a-card-fields-final`｜PR：见 STATUS
- 所属 Gate：Gate 1｜对应验收标准：ROADMAP Gate 1 核心任务 2；验收标准 1
- 依赖：LD-G1-01（已合并）｜被依赖：LD-G1-02、LD-G1-03（两者开工前须先合并本任务）

## 一、背景与目标

LD-G1-01 合并时有三个问题留给 Human。Human 已在 [PR #12 评论](https://github.com/fitalex/LexAIDaily/pull/12#issuecomment-6785145973) 答复，原话：“1.按单标签；2.采纳；3.先不改；”。本任务把答复写进字段表，让 LD-G1-02、03 拿到的是定稿版，不再看到“待决”。

## 二、范围

- **输入**：`design/card-fields-v0.md`、`design/card-fields-v0.example.json`、D-016（STATUS）。
- **输出**：修改上述两个文件，修改点只有下表五处。

| 序号 | 位置 | 改成 |
|---|---|---|
| 1 | 字段总表“分类标签”行“必填/可选”列 | “必填（单标签，五类取一；D-016）”，删去“能否多选见第六节第 1 条” |
| 2 | 字段总表、字段依据表、第三节 3.3 标题与正文中的“提议，待 Human 确认”“本项为提议”“Human 确认前只作原型示意” | 改为“Human 已采纳三档（D-016）”。三档短称、展示位置按现有文字保留。其余“待确认”字样一并核对 |
| 3 | 第五节键表 `category` 行；示例 JSON 的 `note` | 删去“不预设多标签结论”及对第六节第 1 条的引用；改为“单标签，五类取一（D-016）”。`fact_level` 行去掉“提议项” |
| 4 | 第六节“待 Human 决定的问题” | 改标题为“Human 已决定的问题”，三条各写：问题、Human 的决定、依据（D-016 与评论链接）。第 3 条写“先不改，README 保持现状” |
| 5 | 文首与第七节 | 版本行改为“v0.1 · <日期>”并注明“写入 D-016”；第七节最后一条“事实层级等提议项未经 Human 确认前…”删去或改为已确认的表述 |

- **可改文件**：`design/card-fields-v0.md`、`design/card-fields-v0.example.json`（D-011 期间由本任务书授权 DeepSeek Harness 修改）。
- **不可改文件**：`README.md`、`ROADMAP.md`、`AGENTS.md`、`CLAUDE.md`、`docs/` 全部、`design/README.md`。
- **非范围**：不新增、不删除字段；不改五类标签的名称与顺序；不改长度参考、降级规则、跨端规则；不改示例的占位性质；不定义采集数据契约。
- **需要回报但不得自行决定**：事实层级目前是“条件显示（状态位）”。Human 说“采纳”，没有说它是否必填。保持“条件显示”，不要改成必填；在 PR 描述的“待决事项”里写一句，由 Claude 交 Human。
- **复用与参考**：无第三方拷贝。

## 三、冻结边界

README 定位与路线图、ROADMAP、编辑原则、AGENTS.md。D-016 只含 Human 的三个决定，不得借此扩写其他规则。

## 四、DoD

| 序号 | 验收标准 | 对应 Gate 验收条目 | 证明方式 |
|---|---|---|---|
| D01 | 五处修改全部完成，且除这五处外无其他语义改动 | 验收标准 1 | PR 中的 diff；Claude 逐词对比 |
| D02 | `card-fields-v0.md` 中“待 Human”“提议”“待确认”“多标签”字样全部核对：要么已删除，要么仅出现在“Human 已决定”的叙述中 | 验收标准 1 | `grep -n -E "待 Human|提议|待确认|多标签" design/card-fields-v0.md` 的输出与逐处说明 |
| D03 | 第六节三条决定与 Human 原话一致（“按单标签”“采纳”“先不改”），并附评论链接 | 验收标准 1 | 文件第六节 |
| D04 | 示例 JSON 合法，5 条、五类各 1 条，占位标记与 `example.com` 不变 | 验收标准 3 的前置条件 | `python3 -m json.tool` |
| D05 | 改动文件全部在可改范围内；无依赖与配置文件新增 | 范围 | `git diff --name-only origin/main...HEAD` |

## 五、验证与证据要求

- 必须运行：
  - `python3 -m json.tool design/card-fields-v0.example.json`
  - `git diff --name-only origin/main...HEAD`
  - `grep -n -E "待 Human|提议|待确认|多标签" design/card-fields-v0.md`
- 如实记录命令与结果；CI 未配置，写“CI 未触发（原因：仓库未配置 CI）”。

## 六、交接与回传

- 完成后开 PR（PR 模板），不合并。PR 描述写明五处修改的行号，以及上述“事实层级是否必填”的待决事项。

## 七、升级条件

遇到以下情况停止并交 Claude：发现 D-016 的决定与字段表其他部分冲突；需要新增或删除字段才能落实决定；发现 ROADMAP 与字段表不一致。

## 八、Human 工作清单

- [ ] **工作目标**：对 DeepSeek Harness 说“执行 LD-G1-01A”，并在合并前扫一眼第六节是否如实转写了你的决定
  - **工作链接**：本任务书 `docs/daily-specs/LD-G1-01A.md`；执行者 PR 中的 `design/card-fields-v0.md` 第六节
  - **执行步骤**：1. 对 DeepSeek Harness 说“执行 LD-G1-01A”，附任务书路径；2. 在 PR 里看第六节；3. 在 PR 评论写“同意”，再合并
- AI 不得代签、代批的边界：合并 PR；事实层级是否必填的决定。
