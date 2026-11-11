# LD-G1-02A｜设计系统与 Web 原型返工（推倒重做）

- 任务类型：Design
- 级别：B（同 LD-G1-02：Penpot 与图像生成、第三方授权）
- 授权来源：Human 2026-11-11 会话指示“设计效果非常不好看，需要推倒重做……需要重新让 Antigravity 执行”，并提供 iandaily.xyz 截图与 Canvas UI 仓库（D-017、D-018）；范围不超出 LD-G1-02 已有授权（[PR #11 评论](https://github.com/fitalex/LexAIDaily/pull/11#issuecomment-6735352277)、D-013、D-014）。Human 在本任务书 PR 中确认后生效
- 任务 Owner：Antigravity（D-012）
- 复核者：Claude
- 独立审计：是：GPT 网页版，依据 AGENTS.md 6.1(c)（含 Canvas UI 许可）；Human 可书面豁免
- Final Approver：Human Maintainer（视觉验收，阶段 1 确认）
- 基准：`main`（以最新为准）｜分支：`ag/ld-g1-02-design-system`（沿用，在原 PR 返工；AGENTS 12 禁止用新 PR 掩盖历史）｜PR：[#16](https://github.com/fitalex/LexAIDaily/pull/16)
- 所属 Gate：Gate 1｜对应验收标准：ROADMAP Gate 1 核心任务 1、2、3；验收标准 1、3
- 依赖：LD-G1-01、LD-G1-01A（已合并）；阶段 2 填充依赖 LD-G1-04 合并｜被依赖：LD-G1-03

## 一、背景与目标

PR #16 的 8 个画板被 Human 否决：不好看。本任务重做视觉与版式。目标：像 [iandaily.xyz](https://iandaily.xyz/) 那样“轻、干净、高密度、一眼可扫读”，同时保留法律情报站的严谨（来源、事实层级、AI 初稿标识）。字段、画板数量、交互路径沿用 LD-G1-02，不变。

## 二、Claude 对 PR #16 的问题记录（依据：截图 01、05，只覆盖已看到的部分）

| 编号 | 问题 | 严重度 |
|---|---|---|
| P1 | **编造内容**：大盘卡片写了看似真实的事件与机构，如“DeepSeek 推出 Legal-R1”“Harvey 完成 1 亿美元 C 轮”“Clifford Chance 审阅效率提升 40%”，并配 `cac.gov.cn` 等真实域名链接。违反 AGENTS 10.9 与字段表“占位内容”规则。须全部清除 | S1 |
| P2 | **虚构统计**：顶栏“128 个信源 / 46 条候选”“第 042 期”等无来源数字；侧栏“双端协同联动引擎”是产品自述，不是读者内容 | S2 |
| P3 | **配色噪音**：深色底加五种饱和分类色块、青色发光边与多个高亮框，一屏 5+ 种颜色 | S2 |
| P4 | **卡片过重**：每条资讯同时有外框、底色、内嵌高亮框、多个色标与 emoji | S2 |
| P5 | **版面缺陷**：桌面右栏下半屏空白；移动端顶栏文字被挤压、分类 chip 被裁切 | S2 |
| P6 | emoji 当图标，风格不统一 | S3 |

## 三、参考一：iandaily.xyz 设计规范（Human 提供的桌面截图，Claude 目测整理）

以下数值是按截图目测的**目标范围**，不是精确值。Antigravity 须自己浏览真站，在 `design/reference-notes.md` 校准并记录访问日期；与本节冲突时以校准后的观察为准，并在 PR 里说明。只借鉴结构、密度、层级、间距与节奏，**不拷贝**其 CSS、代码、文案、图片、Logo、字体文件、站名或品牌元素（D-008）。

**页面骨架（桌面）**
- 浅灰外底 + 一块大圆角白色主面板（圆角约 16–24px）。左侧为固定侧栏，主面板内是内容区。
- 左侧栏自上而下：手写体站名；一句话简介 + 文字链接；**日期列表**（当天高亮为白底圆角块，右侧显示当天条数；其余日期纯文字灰色；末尾“更多”）；一张社区/订阅引导卡；底部“瀑布流 / 列表”视图切换与亮暗模式开关。
- 内容区为 **3 列瀑布流 + 1 列“今日看点”**（右列顶部是当天一段综述，下面接普通卡片）。列间距约 24–32px。
- 底部居中**悬浮胶囊分类栏**：全部（选中为黑底白字）+ 各分类文字；固定在视口底部，白底圆角胶囊带轻阴影。
- 鼠标悬停卡片时，卡片右下出现小圆形“↗”按钮；左下角浏览器状态栏显示目标链接。

**卡片**
- 白底、1px 浅灰边或无边、圆角约 12–16px、无重阴影。卡片可有顶部封面图，也可纯文字；高度由内容决定（瀑布流）。
- 结构自上而下：**来源行**（分类 · 来源域名，小号灰字）→ **标题**（2 行内，半粗体，约 18–20px，黑色）→ **摘要**（约 14–15px，灰色，最多 3 行）。
- 卡片内没有彩色标签块、没有高亮框。信息靠字号与灰度分层，不靠颜色。

**色彩与字体**
- 颜色只有：黑、几档灰、白，加一层极淡的背景灰。**没有彩色强调色**；选中态用黑底白字。
- 无衬线中文字体，字号层级约 4 级：站名/大标题 > 卡片标题 > 正文摘要 > 元信息。
- 行高偏松（正文约 1.6），卡片内边距约 20–24px。

**移动端**：参考站移动版 Claude 没有看到，Antigravity 浏览后记录。默认处理：单列；侧栏收为顶部日期横滚条；悬浮胶囊分类栏保留在底部；视图切换入口收进顶栏。

## 四、本项目的适配要求（在参考结构上叠加的约束）

1. **卡片内容只用字段表 v0.1 的字段**，不新增字段。字段表没有“封面图”，所以**默认纯文字卡片**；不得为了好看加图。
2. 卡片结构 = 来源行（分类 · 事实层级 · 来源域名，灰色小字）→ 标题 → 摘要 → **实务影响锚点**（浅灰底圆角条，前缀“实务影响：”，Human 确认前带“AI 初稿”文字标识）→ 原始信源链接（小号带 ↗）。“未核实”用小号文字标识，排在来源行末尾。降级规则按字段表执行。
3. 颜色预算：黑、灰、白之外，**只允许 1 个强调色**（用于链接与“AI 初稿 / 未核实”标识；由你提出并说明理由）。五类分类只用文字区分，不用五种颜色。
4. “今日看点”栏改为“今日综述”：内容必须是占位或样本库内容，不得写无来源数字。
5. 左侧栏的“日期列表”对应“历史归档”入口；日期旁的条数只能是占位，并标“示例”。不放社区引导卡和产品自述。
6. 视图切换（瀑布流 / 列表）保留；亮暗模式：先只做浅色，暗色以令牌形式预留（`tokens.json` 里 `dark` 组），不出暗色画板。
7. 不使用 emoji，图标用线性矢量；不预设域名；设计中不得出现“已实现”“已上线”。
8. 移动端：顶栏单行不挤压；分类栏不裁切（可横向滚动并露出滚动提示）。

## 五、参考二：Canvas UI（[DavidHDev/canvas-ui](https://github.com/DavidHDev/canvas-ui)）

**Claude 核对结果（读了仓库源码、README 与 LICENSE，基准 commit `a0be3b7`）：**
- 它是 **WebGL/WebGPU 特效组件库**（液体、火焰、玻璃、故障等 35 个），多数依赖实验性的 HTML-in-canvas API，不支持时降级为 GPU 覆盖层。它不是布局或卡片组件库。
- 许可证是 **MIT + Commons Clause**：可用于网站、应用、产品，**含商用**；禁止单独出售、再授权或再分发组件本身（含打包或移植版本）。这**不在 D-008 的宽松许可名单内**，且我们的仓库是公开的，把组件源码提交进公开仓库是否算“再分发”存在灰区。
- 它是 React/Vue/Svelte 等前端代码。Gate 1 的 LD-G1-02 范围是 Penpot 设计稿，“不写前端工程、不引入依赖”。公众号排版也不能运行脚本。

**因此本任务的处理（Human 的“直接拿来用”按此落地，D-018 待 Human 确认）：**
1. **Gate 1 不引入 Canvas UI 代码。** 在 Penpot 里为它预留“效果槽位”：只标注哪个画板的哪个位置将使用哪个 Canvas UI 组件，附静态示意（可截图其官网演示作内部参考，**不入库**），写入 `design/design-system.md` 的“Canvas UI 效果槽位”一节。
2. **Gate 3 的 Web 前端任务才直接使用其代码**（用其官方安装方式），前提是 Human 确认 D-018（见下）。
3. 选用原则：效果服务“精密雷达工具感”，不得盖住正文可读性。候选（Claude 初选，Antigravity 可在看过官网演示后调整）：Magnify（扫描镜头，雷达感）、Decrypt Reveal（标题揭示）、Laser（滚动揭示）。每页最多 1 处效果；移动端与低性能设备默认关闭；不用于卡片正文。
4. 登记：`THIRD_PARTY_NOTICES.md` 增加一行 Canvas UI（来源仓库、commit `a0be3b7`、许可证“MIT + Commons Clause”、状态“Gate 1 仅参考，未拷贝；Gate 3 使用待 Human 确认 D-018”）。

## 六、范围

- **输入**：`README.md` 第 3 节；`ROADMAP.md` Gate 1；`design/card-fields-v0.md`（v0.1）与 `card-fields-v0.example.json`；LD-G1-04 样本集（合并后）；AGENTS 10.9、10.10。
- **输出**：
  1. `design/reference-notes.md`：对 iandaily.xyz 的结构观察、对第三节数值的校准、对本项目的取舍，附访问日期；只写观察，无拷贝内容。
  2. 阶段 1 草图：“每日精选大盘”桌面与移动各 1 张，导出到 `design/screenshots/g1-02a/stage1/`。
  3. 阶段 2（Human 确认阶段 1 后）：重做全部 8 个画板、`design/design-system.md`、`design/tokens/tokens.json`、截图 `design/screenshots/g1-02a/`；更新 `design/penpot.md`、`design/ASSETS.md`、`THIRD_PARTY_NOTICES.md`。
  4. 旧画板：在 Penpot 里改名为 `archive-v0.1-*` 并移到单独页面，不删除；旧截图 `design/screenshots/g1-02/` 在最终提交时删除，历史留在 git。
- **可改文件**：`design/`、`THIRD_PARTY_NOTICES.md`。
- **不可改文件**：`README.md`、`ROADMAP.md`、`AGENTS.md`、`docs/` 全部、`design/card-fields-v0*`（需要改字段请回 Claude）。
- **非范围**：不写前端代码；不引入依赖；不安装或拷贝 Canvas UI；不做公众号排版；不新增字段；不添加许可证。

## 七、流程（两个阶段，阶段 1 后必须停）

1. 接单确认；Penpot 连通小测（沿用 LD-G1-02 第五节）。
2. 写 `reference-notes.md`，出阶段 1 的桌面与移动大盘各 1 张，在 PR #16 评论贴截图，**然后停止**，等 Human 回复“通过”或修改意见。未获确认不得开始阶段 2。
3. 阶段 2 完成后提交到 PR #16，不合并。

## 八、DoD

| 序号 | 验收标准 | 证明方式 |
|---|---|---|
| D01 | `reference-notes.md` 已写，只含观察与取舍，无拷贝内容 | 文件 |
| D02 | 阶段 1 截图已贴到 PR，Human 已书面确认 | PR 评论 |
| D03 | 阶段 2：8 个画板齐全、可点击走通；颜色符合第四节第 3 条（黑灰白 + 至多 1 个强调色） | Penpot 链接；截图 |
| D04 | 全部示例内容为占位或 LD-G1-04 样本，`grep -rIn -E "Harvey|Legal-R1|Clifford|cac\.gov\.cn|huggingface" design/` 无输出；无 emoji | 命令输出 |
| D05 | 四要素、单标签五分类、三档事实层级、“AI 初稿”“未核实”及降级显示与字段表 v0.1 一致；无新增字段、无封面图要求 | 截图 |
| D06 | `design-system.md`（含“Canvas UI 效果槽位”一节）与 `tokens.json`（含 `dark` 组）与新设计一致，`python3 -m json.tool` 通过；`design/penpot.md` 记录新版本与旧版归档页 | 文件 |
| D07 | 用 LD-G1-04 样本填充大盘桌面与移动，导出截图供 Human 做 3 分钟扫读评审（样本未合并则写明，使用占位，并保留此项为未完成） | `design/screenshots/g1-02a/` |
| D08 | `ASSETS.md`、`THIRD_PARTY_NOTICES.md`（含 Canvas UI 行）与实际一致；无凭据入库；仓库内无 Canvas UI 代码；未改不可改文件 | 命令输出 |

## 九、验证

- `git diff --name-only origin/main...HEAD`（全部落在可改文件内）
- `grep -rIn -E "figd_[A-Za-z0-9_-]{10,}|sk-[A-Za-z0-9]{20,}" design/ THIRD_PARTY_NOTICES.md`（应无输出）
- `python3 -m json.tool design/tokens/tokens.json`
- D04 的 grep。CI 写“CI 未触发（原因：仓库未配置 CI）”。

## 十、升级条件

停止并交 Claude：无法访问参考站；Penpot MCP 不通；图像生成需付费；需要改字段；需要拷贝或安装 Canvas UI；需要拷贝非宽松许可的内容；发现事实或合规问题。

## 十一、Human 工作清单

- [ ] **工作目标**：给 Antigravity 派发返工任务
  - **工作链接**：任务书 `docs/daily-specs/LD-G1-02A.md`（合并本 PR 后可见）
  - **执行步骤**：1. 合并任务书 PR；2. 打开 Penpot 与 MCP 插件；3. 对 Antigravity 说“执行 LD-G1-02A”
- [ ] **工作目标**：阶段 1 确认
  - **工作链接**：[PR #16](https://github.com/fitalex/LexAIDaily/pull/16) 评论里的桌面与移动大盘截图
  - **执行步骤**：1. 看两张图；2. 在评论写“通过”或修改意见
- [ ] **工作目标**：决定是否在 Gate 3 使用 Canvas UI 代码（D-018，不影响本任务）
  - **工作链接**：本任务书第五节；[Canvas UI 许可证](https://github.com/DavidHDev/canvas-ui/blob/main/LICENSE.md)
  - **执行步骤**：见 PR 描述
- AI 不得代签、代批的边界：阶段 1 确认、视觉验收、扫读评审、D-018、合并。
