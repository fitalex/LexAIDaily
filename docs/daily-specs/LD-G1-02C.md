# LD-G1-02C｜Gate 1 复古报刊风 Design-in-Code HTML 原型与 v2.0 AI 配图规范落地

- 任务类型：Design / Engineering
- 级别：B（理由：变更 Gate 1 设计交付方式——放弃 Penpot 改用 Design-in-Code 静态 HTML/CSS 分层迭代，更新决策 `D-027` 与卡片字段展示分层，需 Human Maintainer 终审验收）
- 授权来源：B 级：Human Maintainer（2026-11-23 确认放弃 Penpot 路线，定稿 V3.2 复古报刊布局与 v2.0 清透日光厚涂油画自动配图规范）
- 任务 Owner：DeepSeek Harness（HTML/CSS 分层原型与 `card-fields-v0.md` v0.3 更新）｜Antigravity（按 `design/illustration-spec.md` 生成 5 类基准插画并归档至 `design/ASSETS.md`）
- 复核者：Gemini（Coordinator）
- 独立审计：否（仅涉及 Gate 1 前端静态原型、字段说明与视觉资产规范，不触及法务正文发布与后端鉴权）
- Final Approver：Human Maintainer
- 基准：`main`（执行前由 Owner 记录当前 `HEAD` Commit SHA）｜分支：`ds/ld-g1-02c-miranda-html`（代码线） / `ag/ld-g1-02c-illustrations`（视觉资产线）｜PR：待创建
- 所属 Gate：Gate 1｜对应验收标准：完成桌面端与移动端 3 分钟扫读高保真可交互原型、字段规范冻结及视觉资产基线
- 依赖：`LD-G1-02B`（审计结论）、`design/illustration-spec.md`（已落盘）｜被依赖：`LD-G1-03` 及后续 Gate 2 前端实现

## 一、背景与目标

`LD-G1-02B` 多视角审计确认原设计方案在报刊阅读节奏、视觉质感与信息密度上未达标。经 Human Maintainer 拍板（`D-027`）：
1. **放弃 Penpot（替代 `D-013`）**，改用 **Design-in-Code 单文件/模块化静态 HTML + CSS 分层迭代**，直接在浏览器验收真实字体、滚动动效与移动端响应表现；
2. 全面对标 [Niccolò Miranda — Paper Portfolio](https://www.niccolomiranda.com/) 复古报刊纸美学（`#C8C0B6` 纸底、`#1D1D1B` 印刷墨黑、`#C03F13` 朱红微标、1px 锐利黑线、零毛玻璃与零弥散阴影）；
3. 接入 `design/illustration-spec.md`（v2.0 清透日光厚涂油画规范），实现每张情报卡片的 16:7 主题适配插画与后续全自动配图能力。

## 二、范围

- **输入**：
  - `design/illustration-spec.md`（v2.0 清透日光厚涂油画自动配图规范）
  - `design/card-fields-v0.md`（现有字段表基线）
  - `design/gemini-code-1795426339744.html`（已确认的 V3.2 报刊交互原型参考）
  - [Niccolò Miranda — Paper Portfolio](https://www.niccolomiranda.com/) 视觉与首屏结构参考
- **输出**：
  - `design/prototype/index.html`（含配套独立样式或单文件自包含，支持桌面端 1440px 与移动端 375px 响应式视图）
  - `design/card-fields-v0.md`（升级至 v0.3：明确列表卡片隐藏 `example.com` 外链与「实务影响」，二者下沉至点击详情跳板弹窗）
  - `design/assets/illustrations/baseline-{regulation|models|practice|cases|industry}-v2.webp`（5 类 v2.0 基准插画，单张 ≤ 120 KB）
  - `design/ASSETS.md`（按 `D-014` 完整登记 5 张基准插画的模型、Prompt、日期与「AI 生成」声明）
  - `design/design-system.md`（更新设计令牌以对齐 `#C8C0B6` / `#1D1D1B` / `#C03F13` 与 `Bodoni Moda` + `Noto Serif SC` + `Noto Sans SC`）
- **可改文件**：
  - `design/prototype/**`
  - `design/assets/illustrations/**`
  - `design/card-fields-v0.md`
  - `design/design-system.md`
  - `design/ASSETS.md`
- **不可改文件**：
  - `README.md`、`ROADMAP.md`、`AGENTS.md`、`LICENSE`
  - `design/illustration-spec.md`（已冻结 v2.0 规范，如需修订须先报 Human Maintainer）
- **非范围**：
  - 不再维护或导出任何 Penpot 设计稿；
  - 不接入真实后端抓取/数据库 API，原型仅使用标注为模拟数据的法律 AI 样例内容；
  - 不做账号登录、评论区、深色模式切换或复杂筛选弹窗。

## 三、冻结边界

- 严禁修改 `ROADMAP.md` 中五大官方分类名称（`监管与合规`、`模型与技术`、`实务与工具`、`判例与学术`、`行业与资本`）；
- 严禁突破 `D-016` 事实分级三档规范（`已证实事实` / `官方数据` / `市场观点`）与单卡单分类约束；
- 严禁违反 `D-014`：所有 AI 插画必须标注「AI 生成」并留档 Prompt，严禁真人肖像及仿冒真实机构 Logo；
- 所有外部字体仅限 SIL OFL 1.1 开源字体（`Bodoni Moda`、`Noto Serif SC`、`Noto Sans SC`），不可引入商用未授权字库。

## 四、分层交付与 DoD（Design-in-Code 四层验收）

| 序号 | 分层 | 验收标准 | 对应 Gate 验收条目 | 证明方式 |
|---|---|---|---|---|
| D01 | L1 骨架与首屏 | 1px 顶栏 → 首屏 3 栏焦点区（左右卡片支持 `requestAnimationFrame` 缓缓横向流动、悬停暂停与双向拖拽；中间固定为「**今日综述**」并含当日综述摘要与 `AI 初稿` 标签）→ 通栏 `#1D1D1B` 反白大报头 `LEXAI DAILY` | 首屏视觉与报刊品牌识别 | 本地浏览器桌面/移动端截图 + 交互录屏 |
| D02 | L2 极简卡片与详情弹窗 | 列表卡片严格仅展示：`16:7` 直角 1px 黑框插画 + 标题与朱红 `#C03F13` 微标 + 3 行内摘要，直接印在 `#C8C0B6` 纸面；**绝不展示 `example.com` 来源链接与「实务影响」**；点击卡片弹出报刊剪报风详情跳板页，完整呈现「实务影响」、事实分级、一手信源外链与「插画由 AI 生成」标注；移动端严格单栏 | 3 分钟扫读效率与 `card-fields-v0.md` v0.3 合规 | `design/card-fields-v0.md` diff + 桌面/移动端卡片与弹窗截图 |
| D03 | L3 接入 v2.0 插画基线 | 5 个官方分类全部接入符合 `design/illustration-spec.md` v2.0 的 `21:9` 清透日光厚涂油画（100% 满涂无生麻布、清透粉彩阴影、左侧 55%–60% 留白、静物隐喻匹配标题、零文字），单张 WebP ≤ 120 KB，并在 `design/ASSETS.md` 完成 `D-014` 登记 | 视觉一致性与 AI 资产合规（`D-014`） | `design/ASSETS.md` + 5 张图文件体积检查输出 + 页面实景截图 |
| D04 | L4 响应式与性能验收 | 桌面端（1440px）与移动端（375px）均无横向溢出、字体加载正常、首屏流动动效在 60fps 下无卡顿，支持分类筛选与期号切换 | Gate 1 前端可交付原型标准 | 浏览器 DevTools 控制台零报错截图 + 375px/1440px 截图 |

## 五、验证与证据要求

- **DeepSeek Harness（代码线）必须执行**：
  - 在无外网/弱网 fallback 下检查中英文字体退化表现；
  - 验证 1440px 桌面端与 375px 移动端零横向滚动条（`document.documentElement.scrollWidth <= window.innerWidth`）；
  - 验证控制台零 JS/CSS 报错，提交 L1–L4 关键状态截图（首屏、列表区、详情弹窗、移动端单栏）。
- **Antigravity（视觉资产线）必须执行**：
  - 对照 `design/illustration-spec.md` 第五节逐条勾选 5 张基准图自检项；
  - 运行文件体积与尺寸检查（如 `ls -lh design/assets/illustrations/`），确认单张 ≤ 120 KB 且比例为 `21:9`。
- 如实记录命令、输出与未执行项；CI 未配置时明确说明，不得写成通过。

## 六、交接与回传

- 完成后分别开启 PR（或由协调者整合后合入），PR 必须使用 `.github/PULL_REQUEST_TEMPLATE.md`；
- 回传内容必须包含：修改文件列表、验证证据截图、`design/ASSETS.md` 登记确认，以及需 Human Maintainer 在浏览器中亲测的预览入口。

## 七、升级条件

遇到以下情况立即停止并交协调者 / Human Maintainer 裁决：
- 需要调整 `design/illustration-spec.md` 中的五类色系或 Prompt 底座；
- 发现 `card-fields-v0.md` 字段变更影响下游数据契约（`card-fields-v0.example.json`）；
- 需要引入新的第三方 JS 框架或付费字体资源。

## 八、Human 工作清单

- [ ] **工作目标**：在本地浏览器实测 `design/prototype/index.html` 的桌面端（1440px）与移动端（375px）效果，确认首屏流动速度、「今日综述」信息密度、5 类 v2.0 插画质感及 3 分钟扫读体验达到 Gate 1 放行标准。
  - **工作链接**：本地文件 `design/prototype/index.html`（待 PR 提交后在本地分支直接双击或通过本地静态服务打开）
  - **执行步骤**：
    1. 审阅 PR 中的 `design/card-fields-v0.md` v0.3 与 `design/ASSETS.md`；
    2. 在浏览器打开 `design/prototype/index.html`，实测首屏缓慢流动/拖拽、分类切换、卡片点击弹窗与移动端单栏视图；
    3. 在 PR 下回复「验收通过」并由本人合并 PR，或列出需要下一轮微调的具体条目。
- **AI 不得代签、代批的边界**：Gemini、DeepSeek Harness 与 Antigravity 均不得代为签署 Gate 1 视觉验收结论，也不得代为合并 PR。
