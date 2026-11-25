# LexAIDaily 设计系统规范（Design System Specification）

> **版本**：v3.0 · 2026-11-23（Design-in-Code 复古报刊纸美学）  
> **任务依据**：`docs/daily-specs/LD-G1-02C.md`（B 级，D-027）  
> **字段依据**：`design/card-fields-v0.md`（v0.3，D-016 / D-019 / D-027）  
> **配图规范**：`design/illustration-spec.md`（v2.0 清透日光厚涂油画）  
> **交付载体**：静态 HTML/CSS 分层原型（`design/prototype/index.html`）；已按 D-027 放弃 Penpot（替代 D-013）及 v2.0 液态玻璃路线（替代 D-019 视觉形态，v2.0 Penpot 成果已于 PR #16 归档）

## 一、设计理念与视觉哲学

LexAIDaily 面向执业律师、企业法务、合规官、法律研究者与 LegalTech 从业者。v3.0 设计系统全面对标 [Niccolò Miranda — Paper Portfolio](https://www.niccolomiranda.com/) 复古报刊纸美学，确立五项核心准则：

1. **复古新闻纸底 × 印刷墨黑 × 朱红微标**：
   - 全站以暖灰复古新闻纸（`#C8C0B6`）为基底，叠加极轻 SVG 纸张纤维微噪点；正文与框架统一使用印刷墨黑（`#1D1D1B`）；全站唯一彩色强调为朱红（`#C03F13`），仅用于徽标、悬停标题与列表圆点。
2. **锐利 1px 黑线，零毛玻璃与零弥散阴影**：
   - 彻底取消玻璃拟态（`backdrop-filter`）、大圆角白卡片与弥散投影。所有区块与分栏以 `1px` 锐利边框与分栏线切分，卡片文字直接印在 `#C8C0B6` 纸面之上。
3. **首屏报刊仪式感与柔和流动节奏**：
   - 顶部为 1px 极简报眉（日期/地区 + `The Legal AI Daily` + 视口切换与检索抽屉）；首屏上方为 3 栏焦点横轨（左右情报卡片与居中「**今日综述**」以 `requestAnimationFrame` 缓缓横向流动，支持悬停暂停与双向拖拽）；首屏下方以通栏 `#1D1D1B` 反白巨型报头 `LEXAI DAILY` 压阵。
4. **3 分钟极速扫读与信息分层（D-027）**：
   - 列表卡片仅保留 `16:7` 直角黑框插画 + 标题与朱红微标 + 3 行内摘要；**列表卡片严格隐藏来源外链（`example.com`）与「实务影响锚点」**，二者统一收敛于点击弹出的报刊剪报风详情跳板弹窗。
5. **清透日光厚涂油画配图体系（v2.0）**：
   - 严禁科技媒体常见的赛博霓虹、全息网格与 3D 渲染；每张情报卡片接入 `21:9` 生成、`16:7` 裁切的清透日光厚涂油画，按五大官方分类锁死色系，并按 D-014 标注「插画由 AI 生成」。

## 二、色彩令牌（Color Tokens）

| CSS 变量 | 色值 | 适用场景与对比度说明 |
|---|---|---|
| `--paper-bg` | `#C8C0B6` | 全站复古新闻纸主底色、卡片承载面 |
| `--paper-inset` | `#BEB5AA` | 顶部折叠检索与期号抽屉底色 |
| `--paper-modal` | `#D8D1C7` | 详情剪报弹窗纸面底色（略亮于主纸面以区分层级） |
| `--ink` | `#1D1D1B` | 报头黑带、主标题、1px 锐利黑框、按钮实底（vs `#C8C0B6` 对比度 ≥ 9.2:1，AAA 级） |
| `--ink-body` | `#2B2926` | 卡片摘要正文、详情正文、实务影响列表（vs `#C8C0B6` 对比度 ≥ 7.8:1，AAA 级） |
| `--ink-muted` | `#4C4842` | 报眉辅字、期号元数据、提示文案、合规注记（vs `#C8C0B6` 对比度 ≥ 4.8:1，AA 级） |
| `--rule` | `rgba(29, 29, 27, 0.42)` | 报眉底线、三栏网格分隔线、次级边框 |
| `--rule-light` | `rgba(29, 29, 27, 0.20)` | 弹窗底部注记分隔线 |
| `--accent` | `#C03F13` | 唯一彩色强调：头条/分类微标底色、未核实描边、标题悬停态 |
| `--accent-text` | `#F4EDE4` | 朱红微标上的反白文字 |

## 三、字体体系（SIL OFL 1.1 开源字体 + 弱网回退）

所有外部字体严格限定为 SIL OFL 1.1 开源字体，严禁引入未授权商用字库，并在 CSS 中配置完整系统回退栈：

| 角色 | 首选字体（SIL OFL 1.1） | 弱网 / 离线系统回退 | 适用场景与字阶 |
|---|---|---|---|
| **报头展示衬线** | `Bodoni Moda` | `Georgia, "Times New Roman", serif` | 满宽黑带报头 `LEXAI DAILY`、报眉站名 `The Legal AI Daily`（20px / 800） |
| **中文报刊衬线** | `Noto Serif SC` | `"Songti SC", "STSong", "SimSun", Georgia, serif` | 卡片标题（18.5px / 900）、详情标题（25px / 900）、「今日综述」主标题（30–44px / 900） |
| **中文无衬线正文** | `Noto Sans SC` | `-apple-system, "PingFang SC", "Microsoft YaHei", sans-serif` | 列表摘要（14.5px / 1.66，3 行截断）、详情摘要与实务影响（14.5–15.5px）、微标与按钮 |
| **等宽数据字体** | `JetBrains Mono` | `ui-monospace, SFMono-Regular, Menlo, monospace` | 期号（`VOL.04 NO.326`）、日期胶囊、分类计数角标、`ESC / 关闭` |

## 四、核心组件与布局规范

### 4.1 视口断点与零横向溢出红线

- **桌面端基准（`1440px`）**：最大容器宽 `1440px` 居中；首屏横轨每项占 `33.3333%`；下半区报刊网格采用 `grid-template-columns: repeat(3, minmax(0, 1fr))`。
- **移动端基准（`375px` 及 `max-width: 960px`）**：首屏横轨每项占 `84%–86%` 支持触控拖拽；分类索引条横向单行滚动；下半区严格切换为**单栏（`1fr`）**；全视口满足 `document.documentElement.scrollWidth <= window.innerWidth`。

### 4.2 首屏流动横轨（L1）

- 轨道初始排布：`[首条头条卡片] | [今日综述（含 AI 初稿虚线标）] | [次条卡片] ...`，双倍拼接实现无缝循环。
- 动效规范：使用原生 `requestAnimationFrame`（`DRIFT_SPEED = 0.42`，约 25px/s 沉稳流速），鼠标悬停自动暂停，支持鼠标与触控双向拖拽；拖拽距离 > 6px 时屏蔽误触弹窗。

### 4.3 极简列表卡片（L2）

- **画框**：`aspect-ratio: 16 / 7`，`border: 1px solid #1D1D1B`，`border-radius: 0`，图片采用 `object-fit: cover; object-position: center;`。
- **信息结构**：插画画框 → 标题 + 朱红微标（头条实底 / 未核实描边 / 分类实底）+ 演示态小号“示例”框 → 3 行内摘要。
- **严格禁令**：列表卡片绝不展示 `example.com` 外链、来源域名与「实务影响锚点」。

### 4.4 详情剪报跳板弹窗（L2）

- 外观：`2px solid #1D1D1B` 直角边框，`#D8D1C7` 纸面，最大宽 `740px`，支持 `ESC` 与点击遮罩关闭。
- 内容顺序：顶栏元数据（分类 · 事实层级 · 日期 · 占位标记）→ 16:7 插画与「插画由 AI 生成」图注（D-014）→ 主标题 → 完整摘要 → 虚线黑框「实务影响锚点（AI 初稿）」→ 一手信源直达按键与「复制法律人引用格式」按钮 → 合规免责注记。

## 五、视觉资产对接规范（L3）

- 卡片默认按官方分类映射读取 `design/assets/illustrations/baseline-{regulation|models|practice|cases|industry}-v2.webp`（单张 ≤ 120 KB，21:9 比例）。
- 当本地或仓库尚未合入 WebP 文件时，原型自动通过 `onerror` 平滑回退至与 v2.0 色谱一致的内置 SVG 占位，确保单文件离线打开零破图。
- 所有正式 AI 插画均须按 D-014 登记至 `design/ASSETS.md`。

## 六、Gate 3 延续注记

- **Canvas UI（D-018）**：Gate 1 静态原型严格不引入 WebGL/WebGPU 依赖；Gate 3 如需引入特效，仍须按 D-018 履行许可复核与独立审计。
- **公众号端（LD-G1-03）**：微信公众号编辑器不支持外部字体与动态脚本，将基于本系统色板（`#C8C0B6` / `#1D1D1B` / `#C03F13`）与系统楷体/黑体回退栈制作纯内联 HTML 模板。
