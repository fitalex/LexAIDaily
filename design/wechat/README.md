# 微信公众号「每日固定栏目」内联排版模板（LD-G1-03）

> **状态：内部原型样稿，不对外发布。** 本目录的 HTML 仅用于 Gate 1 评审与公众号后台草稿预览。
> 本任务**未登录微信公众号后台，也未做 iOS / Android 真机预览**；文末“微信后台限制”一节中凡未标注“已实测”的条目，一律为**未实测**，不得当作兼容性结论。
> **2026-11-25 视觉改版说明**：经 Human Maintainer 审美复审确认，由 Gemini 接管并升级为《纽约时报》（*The New York Times*）风格报刊文字排版，并接入已合入 `main` 的 5 张 v3.0 复古网点拼贴插画（`b672ec43` 同步暖调纸底 `#D5C5AE`、零 `<table>` 与综述 14 条目录）；改版样稿已由 `LD-G1-06`（Antigravity）完成确定性 `sha256`（`799ebf6d92a3f967bb2694d0327d2f7667655502b31790abb797f03e9f7a8243`）与 4/4 结构交叉测试（[REPORT.md](../../tests/wechat-prototype/REPORT.md)）。

## 一、产出清单

| 文件 | 作用 |
|---|---|
| `template.html` | NYT 风格报刊栏目模板源文件：样式集中写在 `<style>` 中，逐块声明 `#D5C5AE` 纸底且零 `<table>`，含 `CHAPTER_TEMPLATE_START/END` 与 `ITEM_TEMPLATE_START/END` 单元标记，由构建脚本内联 |
| `samples/ld-g1-04-2026-11-24.json` | 真实样本输入（14 条，源自已合入 `main` 的 `docs/samples/LD-G1-04-sample-set.md`，已清洗第 10 条原文残留的 `**` 符号） |
| `samples/ld-g1-04-2026-11-24.html` | 对应成品 HTML（全部样式内联，零 `<style>` / `class=` / `<script>` / `<table>`，综述内嵌 14 条目录并按五大官方分类章节嵌入 5 张 v3.0 复古插画） |
| `read-original-flow.md` | 「阅读原文」→ Web 详情页 → 一手信源的联动动线 |
| `DEVICE_TEST.md` | 真机预览记录模板（由 Human 填写，AI 不得代填） |
| `../../scripts/wechat-prototype/build.mjs` | 原型构建脚本（按五大分类章节编排 + 综述 14 条目录 + 接入 v3.0 插画 + juice 内联 + 结构断言） |

## 二、视觉与字段基线（NYT 报刊改版）

- **纸面与色彩**：完全对齐 Web 原型暖调复古新闻纸基色 `#D5C5AE`，且 `<html>`、`<body>`、根 `<section>`、全部 13 个顶层主区块与 14 条资讯卡片 `<section>` 均独立声明 `background-color: #D5C5AE` 与 `margin: 0`（零间距缝隙），确保微信粘贴剥离外层容器后仍保留整张暖报纸底面；导读/实务影响/尾声卡片使用暖纸衬底 `#E2D5C2`，印刷墨黑 `#1D1D1B`，朱红 `#C03F13` 严格克制用于章节号（`SEC. 01`）、头条微标与文末唯一「阅读原文」提示；**零毛玻璃、零投影、零圆角**。
- **NYT 报刊文字层次**：
  - **阅读层（全衬线）**：标题（首条 `15.5px` / 常规 `14.5px`，紧行距 `1.4–1.42`）、正文摘要（`12px` / 行高 `1.8`，左对齐防中英混排河道）、今日综述（`12px` / 行高 `1.8`）、实务影响（`11px` / 行高 `1.72`）统一采用系统宋体 / Georgia 衬线回退栈。
  - **索引层（无衬线 / 等宽）**：单行居中报眉（`法律人的 AI 情报雷达 · VOL.I NO.001 · 日期`）、小眉题（Kicker）、标题正下方的 NYT 署名电头栏（信源 · 日期 · 事实层级 · 域名）、版画图注与合规底注采用极轻无衬线与等宽字栈。
  - **报头、综述目录与零 `<table>` 流式分栏**：单行报眉 + 满宽墨黑反白 `LEXAI DAILY` 报头带 + 厚薄双线收束；开篇「今日综述 · AI 初稿」内嵌「本期目录 · CONTENTS」全部 14 条编号标题（`01`–`14`）；全篇**零 `<table>`（不含 `<tr>`/`<td>`）与零固定像素宽度**，统一以流式块级 `<section>` / `<p>` 实现微信移动端自适应不裁切。
- **插画策略（v3.0 + Gate 2 预留）**：
  - Gate 1 按五大官方分类（`监管与合规`、`模型与技术`、`实务与工具`、`判例与学术`、`行业与资本`）在每章顶部嵌入 1 张 21:9 v3.0 复古网点拼贴插画（`design/assets/illustrations/baseline-*-v3.webp`，外加 `1px` 黑框与右对齐「插画由 AI 生成」图注）。
  - 模板同时在单条资讯内保留可选 `image` 字段（JSON 传入 `image` 时自动渲染），供 Gate 2 接入“每日按标题生图”工作流。
  - **公众号粘贴实操注意**：成品默认使用仓库相对路径 `../../assets/illustrations/baseline-*-v3.webp`（支持本地离线预览；亦可通过 `--image-base` 指定托管 URL）。微信后台可能剥离大体积 `base64` 或外链图片，人工粘贴进草稿时请在公众号后台上传对应插画图片。
- **「AI 初稿」与「插画由 AI 生成」不可省略**：每条实务影响、今日综述均带「AI 初稿」标识，每章插画均带「插画由 AI 生成」图注；构建脚本会自动断言。

## 三、用法

要求 Node.js `>= 22.12.0`（juice 12.2.6 的 engines 要求）。

```bash
# 1. 安装（仅 juice 一个直接依赖，固定版本，禁用安装脚本）
npm install --ignore-scripts

# 2. 用样本 JSON 生成成品 HTML
node scripts/wechat-prototype/build.mjs \
  --in design/wechat/samples/ld-g1-04-2026-11-24.json \
  --out /tmp/sample.html

# 可选：指定插画路径前缀（默认 ../../assets/illustrations）
node scripts/wechat-prototype/build.mjs \
  --in design/wechat/samples/ld-g1-04-2026-11-24.json \
  --out /tmp/sample.html \
  --image-base https://raw.githubusercontent.com/fitalex/LexAIDaily/main/design/assets/illustrations

# 或直接重建仓库内样稿
npm run build:samples
```

## 四、样稿说明（内部样稿，不对外发布）

- 来源：`docs/samples/LD-G1-04-sample-set.md`（14 条，2026-11-24 核验；五类覆盖 3/3/3/3/2）。
- 标题与摘要原文照录（已清洗第 10 条原文残留的 `**` Markdown 符号）；`impactBrief` 为样本「实务影响锚点」的 1 句压写，仍标注「AI 初稿」。
- 所有条目 `headline: false`、`unverified: false`：头条待 Human 终审勾选；样本集声明全部链接已核验。
- **长度差异（已发现，未擅改）**：14 条样本摘要均超过字段表 v0.3 的 160 字上限（实测 167–283 字），样稿按原文展示、未截断；正式发布前需 Human 精简至 160 字内。
- `webDetailUrl` 使用保留域名占位 `https://lexaidaily.example/d/2026-11-24`，不对应任何真实站点。

## 五、微信后台限制（实测状态）

**已主动规避（成品 HTML 中不存在）：**

- `<style>` 块、`class=` 选择器、`<script>`、外链 CSS / 字体（`<link>`、`@font-face`）、`<table>`（含 `<tr>`/`<td>`）与固定像素容器宽度。
- data-URI 纸纹背景、伪元素、`position`、`flex`、`grid`、`box-shadow`、`backdrop-filter`、`border-radius` 与旧浅色纸底 `#EBE2D4`。

**未实测（需 Human 在公众号后台草稿与真机确认，不得预先下结论）：**

- 后台是否完整保留单行流式报眉与章节头（零 `<table>`）排版。
- 后台是否完整保留 `#D5C5AE` 逐块暖报纸底色（含 `margin: 0` 零间距）、`#E2D5C2` 卡片衬底与 `2px` 左侧竖线引文块。
- `Songti SC` / `Georgia` 衬线栈在 iOS、Android 微信 WebView 的实际字形与回退效果。
- 5 张 v3.0 复古插画在公众号后台上传后的压缩清晰度与 `1px` 黑框留存情况。

> 历史实测备注：据 [PR #29 协调者同步记录（#issuecomment-7164363493）](https://github.com/fitalex/LexAIDaily/pull/29#issuecomment-7164363493)，Human Maintainer 已于 2026-11-25 基于样式与结构已同步至 `b672ec43` 的 `preview-redesign.html`（`9e566c59`）完成公众号后台检测与手机端实机预览通过；对应仓库重建样稿 `design/wechat/samples/ld-g1-04-2026-11-24.html`（`799ebf6d...`）的真机预览结果仍留空于 `DEVICE_TEST.md` 待 Human 填报，本文件不代写“微信兼容”结论。

## 六、第三方与许可

- 直接依赖只有 **juice 12.2.6（MIT）**，版本固定，`package-lock.json` 入库，安装使用 `npm install --ignore-scripts`；完整登记见根目录 `THIRD_PARTY_NOTICES.md`。
- 未拷贝 `doocs/md` 的任何代码、Logo、图片或 CDN 链接。

## 七、复现与自检命令

```bash
npm install --ignore-scripts
npm ls
npm audit --registry=https://registry.npmjs.org

node scripts/wechat-prototype/build.mjs --in design/wechat/samples/ld-g1-04-2026-11-24.json --out /tmp/a.html
node scripts/wechat-prototype/build.mjs --in design/wechat/samples/ld-g1-04-2026-11-24.json --out /tmp/b.html
sha256sum /tmp/a.html /tmp/b.html

grep -c -E "<style|class=|<script" design/wechat/samples/*.html   # 期望 0
git diff --name-only origin/main...HEAD                            # 应全部落在任务书「可改文件」内
```
