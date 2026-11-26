# Gate 1 设计与排版资产总索引（LD-G1-07）

> **任务依据**：`docs/daily-specs/LD-G1-07.md`（A 级，Owner：Antigravity）  
> **基准快照**：`origin/main`（`93d3c71`，含 PR #25 / #26 / #27 / #28 / #29 / #30 / #32）  
> **范围说明**：本索引仅收录 `git ls-files design/` 下的已合并文件及 Gate 1 核心衔接入口，不改动任何设计与排版资产，不评价视觉效果。

---

## 一、设计路线演进与现行交付全景

LexAIDaily Gate 1 经历了从早期视觉探索、Penpot 阶段归档到 Design-in-Code 复古报刊定稿的三阶段演进：

1. **Penpot 设计系统阶段（`LD-G1-02` / `02A` / `02B`，已归档）**：
   - 采用“雾霭蓝灰 × 晨光亚麻 × 导航液态玻璃”视觉方案（深海军蓝 `#14284B` 强调色、霞鹜文楷 / 思源宋体 / 思源黑体三字体体系），成果留存于 [penpot.md](../design/penpot.md)、DTCG 令牌 [tokens.json](../design/tokens/tokens.json) 与 9 张画板截图 [g1-02b/](../design/screenshots/g1-02b/01-desktop-dashboard.png)（PR #16 已合并 `cec7d31`）。
   - 依决策 `D-027`（2026-11-23），Gate 1 正式放弃 Penpot 路线，不再维护外部设计稿，上述资产作为历史基线归档保留。
2. **Design-in-Code 复古报刊 Web 原型阶段（`LD-G1-02C`，现行基线）**：
   - 转向静态 HTML/CSS 分层迭代，初版参考原型留档于 [gemini-code-1795426339744.html](../design/gemini-code-1795426339744.html)（V3.2，`#C8C0B6` 纸底）与配套规范 [design-system.md](../design/design-system.md)（v3.0）、字段表 [card-fields-v0.md](../design/card-fields-v0.md)（v0.3）。
   - 经 PR #25（`52a8dcf`，`D-029`/`D-030`）与 PR #30（`db902d7`）持续迭代，现行 Web 原型为 [design/prototype/index.html](../design/prototype/index.html)（**V16**）：采用暖调加颗粒欧式新闻纸主底色 `#D5C5AE`（弹窗 `#EBE2D4` / 衬底 `#E4D8C6`）、印刷墨黑 `#1D1D1B`、朱红微标 `#C03F13`、首屏 4 秒报刊动效与三栏流动横轨、近三日日报与按周精选历史归档（`D-029`），以及与公众号同步的 NYT 报刊文字排版详情阅读弹窗。
3. **v3.0 复古半调网点配图体系（`LD-G1-02C` 视觉资产线）**：
   - 配图规范由 v2.0（清透日光厚涂油画）升级为 [illustration-spec.md](../design/illustration-spec.md) **v3.0（复古报刊半调网点档案拼贴）**（PR #28 已合并 `cf65393`）。
   - 5 张五大官方分类基准图（`1584 × 672` / `21:9` WebP，单张 105.94–113.41 KiB）与完整 Prompt / D-014 合规台账已通过 PR #26（`36a8c90`）合入 `design/assets/illustrations/` 与 [ASSETS.md](../design/ASSETS.md)；现行 Web 原型（PR #30）与公众号模板均已指向 `-v3.webp`。
4. **微信公众号 NYT 报刊内联模板阶段（`LD-G1-03` / `LD-G1-06`）**：
   - 以 [template.html](../design/wechat/template.html) 与构建脚本 `scripts/wechat-prototype/build.mjs`（`juice 12.2.6`）实现纯内联排版（PR #29 已合并 `e87d480`）：采用与 Web 同款的逐块 `#D5C5AE` 纸底与 `margin: 0` 零缝隙结构、`#E2D5C2` 卡片衬底、单行流式报眉、**零 `<table>` 与零固定宽度**、开篇「今日综述 · AI 初稿」内嵌 14 条「本期目录 · CONTENTS」、正文零 `<a href>` 外链与文末「阅读原文」单入口跳板（动线见 [read-original-flow.md](../design/wechat/read-original-flow.md)）。
   - 成品样稿 [ld-g1-04-2026-11-24.html](../design/wechat/samples/ld-g1-04-2026-11-24.html) 已通过 `LD-G1-06` 自动化交叉测试（4/4 通过，报告见 [REPORT.md](../tests/wechat-prototype/REPORT.md)，PR #32 已合并 `93d3c71`）。

---

## 二、`design/` 已合并文件全量清单（`git ls-files design/`，共 31 项）

> 严格对照 `origin/main`（`93d3c71`）下 `git ls-files design/` 输出逐项列出，无遗漏、不含未合并文件。

### 2.1 设计系统、字段表与规范文档（7 项）

| 文件路径 | 相对链接 | 来源 / 阶段 | 一句话用途 |
|---|---|---|---|
| `design/README.md` | [README.md](../design/README.md) | `LD-G1-01` | `design/` 目录早期总览，登记 `card-fields-v0` 字段表与占位示例入口 |
| `design/card-fields-v0.md` | [card-fields-v0.md](../design/card-fields-v0.md) | `LD-G1-01` → `02C` | 资讯卡片展示字段定义 v0.3（四要素、五类标签、展示分层与状态位，非 Gate 2 采集契约） |
| `design/card-fields-v0.example.json` | [card-fields-v0.example.json](../design/card-fields-v0.example.json) | `LD-G1-01` → `01B` | 字段表配套的 8 条虚构占位示例 JSON（`placeholder: true`、`example.com` 占位外链） |
| `design/design-system.md` | [design-system.md](../design/design-system.md) | `LD-G1-02B` → `02C` | Design-in-Code v3.0 复古报刊设计系统规范（色彩令牌、SIL OFL 字体栈与 L1–L3 规范） |
| `design/illustration-spec.md` | [illustration-spec.md](../design/illustration-spec.md) | `LD-G1-02C` (PR #28) | AI 自动配图统一规范 v3.0（复古报刊半调网点档案拼贴、五类构图原型与 Prompt 模板） |
| `design/ASSETS.md` | [ASSETS.md](../design/ASSETS.md) | `LD-G1-02B` → `02C` (PR #26) | AI 生图与设计素材合规台账（登记 5 张 v3.0 基准插画完整 Prompt、体积与 D-014 授权状态） |
| `design/reference-notes.md` | [reference-notes.md](../design/reference-notes.md) | `LD-G1-02A` / `02B` | 历史阶段参考站结构观察与水墨/液态玻璃风格取舍记录（已归档参考） |

### 2.2 Web 原型、令牌与参考稿（4 项）

| 文件路径 | 相对链接 | 来源 / 阶段 | 一句话用途 |
|---|---|---|---|
| `design/prototype/index.html` | [index.html](../design/prototype/index.html) | `LD-G1-02C` (PR #25 / #30) | 现行 Gate 1 Design-in-Code Web 交互原型 V16（暖纸 `#D5C5AE`、流动横轨、按周归档与 NYT 弹窗） |
| `design/gemini-code-1795426339744.html` | [gemini-code-1795426339744.html](../design/gemini-code-1795426339744.html) | `LD-G1-02C` (PR #24) | 早期 V3.2 Miranda 报刊交互原型参考文件（`#C8C0B6` 纸底，供 V16 演进对照） |
| `design/tokens/tokens.json` | [tokens.json](../design/tokens/tokens.json) | `LD-G1-02B` (PR #16) | Penpot v2.0 阶段 DTCG 格式样式令牌文件（v2.1，含已归档水墨配色、字阶、间距与 `dark` 预留组） |
| `design/penpot.md` | [penpot.md](../design/penpot.md) | `LD-G1-02B` (PR #16) | Penpot 云端原型文件元数据、9 画板规格与 B1–B6 还原备份记录（D-027 后归档） |

### 2.3 v3.0 基准插画资产（5 项）

| 文件路径 | 相对链接 | 来源 / 阶段 | 一句话用途 |
|---|---|---|---|
| `design/assets/illustrations/baseline-regulation-v3.webp` | [baseline-regulation-v3.webp](../design/assets/illustrations/baseline-regulation-v3.webp) | `LD-G1-02C` (PR #26) | 「监管与合规」分类 v3.0 基准插画（满幅对称古典建筑 + 朱红圆印，1584×672 WebP，110.04 KiB） |
| `design/assets/illustrations/baseline-models-v3.webp` | [baseline-models-v3.webp](../design/assets/illustrations/baseline-models-v3.webp) | `LD-G1-02C` (PR #26) | 「模型与技术」分类 v3.0 基准插画（错位双格剪报拼贴 + 朱红细线圆点，1584×672 WebP，109.44 KiB） |
| `design/assets/illustrations/baseline-practice-v3.webp` | [baseline-practice-v3.webp](../design/assets/illustrations/baseline-practice-v3.webp) | `LD-G1-02C` (PR #26) | 「实务与工具」分类 v3.0 基准插画（满幅俯拍桌面几何 + 朱红丝带书签，1584×672 WebP，105.94 KiB） |
| `design/assets/illustrations/baseline-cases-v3.webp` | [baseline-cases-v3.webp](../design/assets/illustrations/baseline-cases-v3.webp) | `LD-G1-02C` (PR #26) | 「判例与学术」分类 v3.0 基准插画（左重右轻对角景深 + 朱红双线档案框，1584×672 WebP，113.41 KiB） |
| `design/assets/illustrations/baseline-industry-v3.webp` | [baseline-industry-v3.webp](../design/assets/illustrations/baseline-industry-v3.webp) | `LD-G1-02C` (PR #26) | 「行业与资本」分类 v3.0 基准插画（宽幅水平剪报条 + 朱红同心圆准星，1584×672 WebP，109.48 KiB） |

### 2.4 微信公众号内联排版原型（6 项）

| 文件路径 | 相对链接 | 来源 / 阶段 | 一句话用途 |
|---|---|---|---|
| `design/wechat/template.html` | [template.html](../design/wechat/template.html) | `LD-G1-03` (PR #29) | 公众号每日固定栏目 NYT 报刊风源文件模板（逐块 `#D5C5AE` 纸底、零 `<table>`，待 juice 内联） |
| `design/wechat/samples/ld-g1-04-2026-11-24.json` | [ld-g1-04-2026-11-24.json](../design/wechat/samples/ld-g1-04-2026-11-24.json) | `LD-G1-03` (PR #29) | 源自 `LD-G1-04` 真实样本集的 14 条结构化 JSON 输入（含 1 句实务影响、无外链渲染字段） |
| `design/wechat/samples/ld-g1-04-2026-11-24.html` | [ld-g1-04-2026-11-24.html](../design/wechat/samples/ld-g1-04-2026-11-24.html) | `LD-G1-03` / `06` (PR #29) | 确定性内联成品 HTML 样稿（`sha256`: `799ebf6d92a3f967bb2694d0327d2f7667655502b31790abb797f03e9f7a8243`） |
| `design/wechat/README.md` | [README.md](../design/wechat/README.md) | `LD-G1-03` → `07` | 公众号排版原型用法、视觉基线、样稿差异与微信后台限制（实测/未实测状态）说明 |
| `design/wechat/DEVICE_TEST.md` | [DEVICE_TEST.md](../design/wechat/DEVICE_TEST.md) | `LD-G1-03` → `07` | iOS / Android 微信真机预览检查表与 Human 结论填写模板（AI 严禁代填） |
| `design/wechat/read-original-flow.md` | [read-original-flow.md](../design/wechat/read-original-flow.md) | `LD-G1-03` (PR #29) | 公众号正文无外链约束下经由文末「阅读原文」跳板至 Web 详情页与一手信源的动线设计 |

### 2.5 Penpot v2.0 历史归档截图（9 项，`LD-G1-02B` / PR #16）

> 注：本组截图对应已由 `D-027` 替代的 Penpot v2.0 阶段方案，作为设计演进档案留存。

| 文件路径 | 相对链接 | 来源 / 阶段 | 一句话用途 |
|---|---|---|---|
| `design/screenshots/g1-02b/01-desktop-dashboard.png` | [01-desktop-dashboard.png](../design/screenshots/g1-02b/01-desktop-dashboard.png) | `LD-G1-02B` (PR #16) | Penpot v2.0 桌面端每日大盘画板 01 导出截图（1440×1080） |
| `design/screenshots/g1-02b/02-desktop-category-filter.png` | [02-desktop-category-filter.png](../design/screenshots/g1-02b/02-desktop-category-filter.png) | `LD-G1-02B` (PR #16) | Penpot v2.0 桌面端分类筛选画板 02 导出截图（1440×1080） |
| `design/screenshots/g1-02b/03-desktop-outbound-detail.png` | [03-desktop-outbound-detail.png](../design/screenshots/g1-02b/03-desktop-outbound-detail.png) | `LD-G1-02B` (PR #16) | Penpot v2.0 桌面端详情跳板画板 03 导出截图（1440×1080） |
| `design/screenshots/g1-02b/04-desktop-archive-search.png` | [04-desktop-archive-search.png](../design/screenshots/g1-02b/04-desktop-archive-search.png) | `LD-G1-02B` (PR #16) | Penpot v2.0 桌面端历史归档与检索画板 04 导出截图（1440×1080） |
| `design/screenshots/g1-02b/05-mobile-dashboard.png` | [05-mobile-dashboard.png](../design/screenshots/g1-02b/05-mobile-dashboard.png) | `LD-G1-02B` (PR #16) | Penpot v2.0 移动端每日大盘画板 05 导出截图（390×960） |
| `design/screenshots/g1-02b/06-mobile-category-filter.png` | [06-mobile-category-filter.png](../design/screenshots/g1-02b/06-mobile-category-filter.png) | `LD-G1-02B` (PR #16) | Penpot v2.0 移动端分类筛选画板 06 导出截图（390×960） |
| `design/screenshots/g1-02b/07-mobile-outbound-detail.png` | [07-mobile-outbound-detail.png](../design/screenshots/g1-02b/07-mobile-outbound-detail.png) | `LD-G1-02B` (PR #16) | Penpot v2.0 移动端详情跳板画板 07 导出截图（390×960） |
| `design/screenshots/g1-02b/08-mobile-archive-search.png` | [08-mobile-archive-search.png](../design/screenshots/g1-02b/08-mobile-archive-search.png) | `LD-G1-02B` (PR #16) | Penpot v2.0 移动端历史归档与检索画板 08 导出截图（390×960） |
| `design/screenshots/g1-02b/09-style-sheet.png` | [09-style-sheet.png](../design/screenshots/g1-02b/09-style-sheet.png) | `LD-G1-02B` (PR #16) | Penpot v2.0 设计系统风格样张画板 09 导出截图（1440×1080） |

---

## 三、Penpot 归档元数据摘要（原样引用 `design/penpot.md`）

> 严格引用 [design/penpot.md](../design/penpot.md) 已落盘信息，不作任何补充或推断（该设计源已于 `D-027` 归档，现行原型见 `design/prototype/index.html`）。

- **项目文件名称**：`LexAIDaily Gate 1`（Penpot 文件名 `New File 2`）
- **Penpot 内部 ID**：`124ca123-b2be-80ce-8008-eb252bd959df`
- **当前页面名称**：`LexAIDaily v2.0 (Ink Nav-Glass)`（Page ID：`c79a9564-709e-807f-8008-edf6a988300d`）；归档页面 `Archive v1.0 (Clean Light)`、`Archive v0.1 (Dark Prototype)`
- **当前文件版本号**：`LexAIDaily-Gate1-v2.0-Stage2-B1.1`（平台版本：Penpot 2.19.0 SaaS 免费云端版，MPL-2.0；访问权限：仅受邀者 Restricted / Invite Only）
- **云端在线访问链接**：[https://design.penpot.app/#/workspace/124ca123-b2be-80ce-8008-eb252bd959df](https://design.penpot.app/#/workspace/124ca123-b2be-80ce-8008-eb252bd959df)
- **基线与备份状态**：依据快照 `internal/snapshot/127`（`2026-11-13T03:21:16.790Z`）还原并导出全部 9 张画板截图至 `design/screenshots/g1-02b/`。

---

## 四、令牌、样稿、交叉测试与真实样本入口

| 类别 | 仓库路径与链接 | 核心定位与校验信息 |
|---|---|---|
| **DTCG 设计令牌（v2.1 归档）** | [design/tokens/tokens.json](../design/tokens/tokens.json) | LD-G1-02B 阶段色板、字阶、圆角、投影与 `dark` 预留令牌；现行 V16 原型色彩变量定义于 [design/prototype/index.html](../design/prototype/index.html) `:root` |
| **占位示例 JSON（8 条）** | [design/card-fields-v0.example.json](../design/card-fields-v0.example.json) | 对应 `card-fields-v0.md` 的虚构占位样例（五类齐全，`example.com` 占位外链） |
| **公众号样本输入 JSON（14 条）** | [design/wechat/samples/ld-g1-04-2026-11-24.json](../design/wechat/samples/ld-g1-04-2026-11-24.json) | 源自 `LD-G1-04` 真实样本集的结构化输入，含 1 句实务影响（AI 初稿），`sourceUrl` 仅留档不渲染进正文 |
| **公众号内联成品 HTML 样稿** | [design/wechat/samples/ld-g1-04-2026-11-24.html](../design/wechat/samples/ld-g1-04-2026-11-24.html) | 由 `scripts/wechat-prototype/build.mjs` 确定性构建（62,595 bytes）；`sha256`：`799ebf6d92a3f967bb2694d0327d2f7667655502b31790abb797f03e9f7a8243` |
| **公众号交叉测试报告** | [tests/wechat-prototype/REPORT.md](../tests/wechat-prototype/REPORT.md) | `LD-G1-06`（PR #32）自动化交叉测试结论：**4/4 通过**（零禁用标签/样式、`#D5C5AE` 纸底、14 条目录与 AI 标识完整、零 `<a href>` 外链、确定性构建一致）；测试脚本见 [tests/wechat-prototype/wechat-export.test.mjs](../tests/wechat-prototype/wechat-export.test.mjs) 与 [tests/wechat-prototype/index.js](../tests/wechat-prototype/index.js) |
| **真机预览记录模板** | [design/wechat/DEVICE_TEST.md](../design/wechat/DEVICE_TEST.md) | 供 Human 填写 iOS / Android 微信草稿实机结果；样稿哈希已对齐至 `799ebf6d...`，结果与结论列留空待 Human 填报 |
| **真实法律 AI 资讯样本集** | [docs/samples/LD-G1-04-sample-set.md](samples/LD-G1-04-sample-set.md) | `LD-G1-04`（PR #27）14 条近 30 日真实一手信源样本（覆盖五类 3/3/3/3/2，2026-11-24 逐条打开核验） |

---

## 五、第三方材料登记核对（`THIRD_PARTY_NOTICES.md`）

- **登记表入口**：[THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md)
- **核对范围说明**（依 `LD-G1-07.md` DoD D03）：
  - 条目 `#01`–`#10` 为 Antigravity 在 `LD-G1-02` / `LD-G1-02B`（PR #16）自产登记项，其字段复核由协调者承担，本任务不自审。
  - 除 Antigravity 自产项外，当前 `THIRD_PARTY_NOTICES.md` 仅余 `#11`（由 DeepSeek Harness 于 `LD-G1-03` / PR #29 追加）。

### 非 Antigravity 自产登记项字段核对表

| 序号 / 组件 | 来源仓库 | Commit SHA | 路径 | 许可证 | 改动说明 | 核对结论 |
|---|---|---|---|---|---|---|
| `#11` 样式内联库：`juice` | [Automattic/juice](https://github.com/Automattic/juice)（已填） | `v12.2.6` / 上游 commit `4400c58906440f1041ba444404e5f4d7a2ab09b4`（已填） | npm 包 `juice@12.2.6`（`node_modules/juice`，不入库；许可链接已填） | `MIT`（已填，第三节第 4 项附全文；38 个可见传递依赖亦逐一核对） | 仅作 `LD-G1-03` npm 依赖安装（`--ignore-scripts`），未拷贝、未改动源码（已填） | **5 项字段齐全，无缺项** |

### 跨文件滞后与待同步提示（仅作客观记录，未改原文件）

1. **Google Fonts 外链与登记表版本差**：现行 `design/prototype/index.html`（V16，PR #25 / #30）通过 Google Fonts `<link>` 引用了 `Bodoni Moda`、`Ma Shan Zheng`、`JetBrains Mono`、`Noto Serif SC`、`Noto Sans SC`（未拷贝字体文件进仓库）；而 `THIRD_PARTY_NOTICES.md` 仍停留在 `#09 JetBrains Mono` 记为“历史参考项（未采用）”，且未新增 `Bodoni Moda` 与 `Ma Shan Zheng` 说明（`#01 霞鹜文楷` 与 `#04 Penpot` 仅用于已归档 v2.0 路线）。
2. **其余未授权改动的早期说明文档**：`design/README.md` 仅列出 `card-fields-v0*`；`design/design-system.md`（v3.0 初版）仍写 `--paper-bg: #C8C0B6` 与 `v2.0` 插画；`design/card-fields-v0.md`（v0.3）正文仍引用 `v2.0` 插画规范；`design/wechat/read-original-flow.md` 第 16/39 行仍保留早期逐条引导文案「第 NN 条 · 完整实务锚点与一手信源 → 阅读原文」（本任务按范围边界均未改动，留待协调者后续安排）。

---

## 六、Gate 1 相关任务书与状态入口

- **任务书索引**：[docs/daily-specs/README.md](daily-specs/README.md)
- **状态看板与决策台账**：[docs/coordination/STATUS.md](coordination/STATUS.md)
- **Gate 1 验收清单任务书**：[docs/daily-specs/LD-G1-05.md](daily-specs/LD-G1-05.md)（待 Gate 1 全部前置完成后启动）
