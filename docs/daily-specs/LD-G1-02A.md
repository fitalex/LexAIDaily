# LD-G1-02A｜设计系统与 Web 原型返工（推倒重做）

- 任务类型：Design
- 级别：B（同 LD-G1-02：Penpot 与图像生成、第三方授权）
- 授权来源：Human 2026-11-11 会话指示“设计效果非常不好看，需要推倒重做……需要重新让 Antigravity 执行”（D-017）；范围不超出 LD-G1-02 已有授权（[PR #11 评论](https://github.com/fitalex/LexAIDaily/pull/11#issuecomment-6735352277)、D-013、D-014）。Human 在本任务书 PR 中确认后生效
- 任务 Owner：Antigravity（D-012）
- 复核者：Claude
- 独立审计：是：GPT 网页版，依据 AGENTS.md 6.1(c)；Human 可书面豁免
- Final Approver：Human Maintainer（视觉验收，阶段 1 选方向）
- 基准：`main`（以最新为准）｜分支：`ag/ld-g1-02-design-system`（沿用，在原 PR #16 返工；AGENTS 12 禁止用新 PR 掩盖历史）｜PR：[#16](https://github.com/fitalex/LexAIDaily/pull/16)
- 所属 Gate：Gate 1｜对应验收标准：ROADMAP Gate 1 核心任务 1、2、3；验收标准 1、3
- 依赖：LD-G1-01、LD-G1-01A（已合并）；阶段 2 填充依赖 LD-G1-04 合并｜被依赖：LD-G1-03

## 一、背景与目标

PR #16 的 8 个画板被 Human 否决：不好看。本任务重做视觉与版式，目标是“克制、高密度、可扫读”的法律情报站，而不是深色霓虹大屏。字段、画板数量、交互路径沿用 LD-G1-02，不变。

## 二、Claude 对 PR #16 的问题记录（依据：截图 01、05，只覆盖已看到的部分）

| 编号 | 问题 | 严重度 |
|---|---|---|
| P1 | **编造内容**：大盘卡片写了看似真实的事件与机构，如“DeepSeek 推出 Legal-R1”“Harvey 完成 1 亿美元 C 轮”“Clifford Chance 审阅效率提升 40%”，并配 `cac.gov.cn` 等真实域名链接。违反 AGENTS 10.9 与字段表“占位内容”规则。须全部清除 | S1 |
| P2 | **虚构统计**：顶栏“128 个信源 / 46 条候选”“第 042 期”等无来源数字；侧栏“双端协同联动引擎”是产品自述，不是读者内容 | S2 |
| P3 | **配色噪音**：深色底加五种饱和分类色块、青色发光边与多个高亮框。一屏 5+ 种颜色，与“克制的组件语言”“高对比度现代排版”（README 设计理念）不符 | S2 |
| P4 | **卡片过重**：每条资讯同时有外框、底色、内嵌高亮框、多个色标与 emoji，3 分钟扫读负担大 | S2 |
| P5 | **版面缺陷**：桌面右栏下半屏空白；移动端顶栏文字被挤压、分类 chip 被裁切 | S2 |
| P6 | emoji 当图标（🔥⚡📡📱），风格不统一 | S3 |

## 三、范围

- **输入**：`README.md` 第 3 节设计理念；`ROADMAP.md` Gate 1；`design/card-fields-v0.md`（v0.1）与 `card-fields-v0.example.json`；LD-G1-04 样本集（合并后）；AGENTS 10.9、10.10。
- **参考（只参考，不拷贝）**：
  1. [iandaily.xyz](https://iandaily.xyz/)（README 的“Ian’s Daily 模式”：高密度日报策展、3 分钟扫读）。
  2. “Canvas UI”（README 原文：画布式空间秩序感，清晰网格、微妙边框层级、高对比度现代排版）。若你无法确定“Canvas UI”具体指哪套设计或站点，停止并问 Claude，不要自行猜测。
  3. 只借鉴结构、密度、层级、间距与节奏。不拷贝其 CSS、代码、文案、图片、Logo、字体文件或品牌元素（D-008）。登记在 `design/reference-notes.md`。
- **输出**：
  1. `design/reference-notes.md`：参考站的结构观察（页面骨架、条目密度、字号层级、间距、分隔方式、移动端处理）与对本项目的取舍，只写观察，附访问日期。若无法访问站点，写明并停止，由 Human 提供截图。
  2. 阶段 1 草图：两个方向各出“每日精选大盘”桌面与移动各 1 张，导出到 `design/screenshots/g1-02a/stage1/`。
  3. 阶段 2（Human 选定方向后）：重做全部 8 个画板、`design/design-system.md`、`design/tokens/tokens.json`、截图 `design/screenshots/g1-02a/`；更新 `design/penpot.md`、`design/ASSETS.md`、`THIRD_PARTY_NOTICES.md`。
  4. 旧画板：在 Penpot 里改名为 `archive-v0.1-*` 并移到单独页面，不删除；旧截图 `design/screenshots/g1-02/` 在最终提交时删除，历史留在 git。
- **可改文件**：`design/`、`THIRD_PARTY_NOTICES.md`（同 LD-G1-02）。
- **不可改文件**：`README.md`、`ROADMAP.md`、`AGENTS.md`、`docs/` 全部、`design/card-fields-v0*`（需要改字段请回 Claude）。
- **非范围**：不写前端工程；不引入依赖；不做公众号排版；不新增字段；不添加许可证。

## 四、设计要求

1. **两个方向（阶段 1）**，差异要明显，各用一句话写明取舍：
   - 方向 A：浅色、报刊式。白或暖灰底，黑色高对比文字，单一强调色。
   - 方向 B：中性深色。低饱和灰黑底，无发光效果，单一强调色。
   - 若 `reference-notes.md` 显示参考站有更贴近的路线，可把其中一个方向替换为该路线，并说明原因。
2. **一屏颜色预算**：底色、文字色之外，只允许 1 个强调色。五类分类用文字标签区分（字重、位置、极淡底或细线），不用五种饱和色块。
3. **卡片轻量化**：条目之间以细分隔线或留白分隔，不给每条加外框；“AI 初稿”“未核实”为小号文字标识，保持字段表要求（不得省略、不得写成法律意见）。
4. **扫读层级**：核心标题 > 分类与事实层级 > 摘要 > 实务影响锚点 > 来源。字号层级不超过 5 级。
5. **清除 P1、P2、P6**：内容只用 `card-fields-v0.example.json` 的占位（标题含“【示例占位，非真实资讯】”，链接用 `example.com`），或合并后的 LD-G1-04 样本。顶栏、侧栏不放无来源数字；如需展示期号、数量，用“示例”字样标明。不使用 emoji，图标用线性矢量。
6. **版面**：桌面栏宽与留白按网格；无大面积空白区。移动端：顶栏单行不挤压，分类用可横向滚动且不被裁切的单行 chip，并露出可滚动提示。
7. **交互路径沿用**：大盘 → 分类筛选 → 详情跳板 → 历史检索 → 返回大盘，桌面与移动共 8 个画板。
8. 设计中不得出现“已实现”“已上线”等表述；不预设域名。

## 五、流程（两个阶段，阶段 1 后必须停）

1. 接单确认；Penpot 连通小测（沿用 LD-G1-02 第五节）。
2. 先写 `reference-notes.md`，再出阶段 1 草图，在 PR #16 评论贴 4 张截图与两个方向的一句话取舍，**然后停止**，等 Human 选方向（选 A、选 B、或给修改意见）。未经选定不得开始阶段 2。
3. 阶段 2 完成后，提交到 PR #16，不合并。

## 六、DoD

| 序号 | 验收标准 | 证明方式 |
|---|---|---|
| D01 | `reference-notes.md` 已写，只含观察与取舍，无拷贝内容；已登记到 `THIRD_PARTY_NOTICES.md`（如无拷贝，写“仅参考，无拷贝”） | 文件 |
| D02 | 阶段 1 两个方向 × 桌面、移动共 4 张截图已贴到 PR，Human 已书面选定方向 | PR 评论 |
| D03 | 阶段 2：8 个画板齐全、可点击走通；一屏颜色符合“颜色预算” | Penpot 链接；截图 |
| D04 | 全部示例内容为占位或 LD-G1-04 样本，`grep -rIn -E "Harvey|Legal-R1|Clifford|cac\.gov\.cn|huggingface" design/` 无输出 | 命令输出 |
| D05 | 四要素、单标签五分类、三档事实层级、“AI 初稿”“未核实”及降级显示与字段表 v0.1 一致 | 截图 |
| D06 | `design-system.md` 与 `tokens.json` 与新设计一致，`python3 -m json.tool` 通过；`design/penpot.md` 记录新版本与旧版归档页 | 文件 |
| D07 | 用 LD-G1-04 样本填充大盘桌面与移动，导出截图供 Human 做 3 分钟扫读评审（样本未合并则写明，使用占位并保留此项为未完成） | `design/screenshots/g1-02a/` |
| D08 | `ASSETS.md`、`THIRD_PARTY_NOTICES.md` 与实际一致；无凭据入库；未改不可改文件 | 命令输出 |

## 七、验证

- `git diff --name-only origin/main...HEAD`（全部落在可改文件内）
- `grep -rIn -E "figd_[A-Za-z0-9_-]{10,}|sk-[A-Za-z0-9]{20,}" design/ THIRD_PARTY_NOTICES.md`（应无输出）
- `python3 -m json.tool design/tokens/tokens.json`
- D04 的 grep。CI 写“CI 未触发（原因：仓库未配置 CI）”。

## 八、升级条件

停止并交 Claude：无法访问参考站；“Canvas UI”指代不明；Penpot MCP 不通；图像生成需付费；需要改字段；需要拷贝非宽松许可的内容；发现事实或合规问题。

## 九、Human 工作清单

- [ ] **工作目标**：给 Antigravity 派发返工任务
  - **工作链接**：任务书 `docs/daily-specs/LD-G1-02A.md`（合并本 PR 后可见）
  - **执行步骤**：1. 合并任务书 PR；2. 打开 Penpot 与 MCP 插件；3. 对 Antigravity 说“执行 LD-G1-02A”
- [ ] **工作目标**：阶段 1 选方向
  - **工作链接**：[PR #16](https://github.com/fitalex/LexAIDaily/pull/16) 评论里的 4 张草图
  - **执行步骤**：1. 看 A、B 两个方向的桌面和移动图；2. 在评论写“选 A”“选 B”或修改意见
- [ ] （可选）如 Antigravity 打不开参考站，贴 iandaily.xyz 的几张截图到 PR #16
- AI 不得代签、代批的边界：方向选择、视觉验收、扫读评审结论、合并。
