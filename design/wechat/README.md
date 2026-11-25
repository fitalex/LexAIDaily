# 微信公众号「每日固定栏目」内联排版模板（LD-G1-03）

> **状态：内部原型样稿，不对外发布。** 本目录的 HTML 仅用于 Gate 1 评审与公众号后台草稿预览。
> 本任务**未登录微信公众号后台，也未做 iOS / Android 真机预览**；文末“微信后台限制”一节中凡未标注“已实测”的条目，一律为**未实测**，不得当作兼容性结论。

## 一、产出清单

| 文件 | 作用 |
|---|---|
| `template.html` | 栏目模板源文件：样式集中写在 `<style>` 中，含 `ITEM_TEMPLATE_START/END` 单元标记，由构建脚本内联 |
| `samples/ld-g1-04-2026-11-24.json` | 真实样本输入（14 条，源自已合入 `main` 的 `docs/samples/LD-G1-04-sample-set.md`） |
| `samples/ld-g1-04-2026-11-24.html` | 用上述样本生成的成品 HTML（全部样式内联，零 `<style>` / `class=` / `<script>`） |
| `read-original-flow.md` | 「阅读原文」→ Web 详情页 → 一手信源的联动动线 |
| `DEVICE_TEST.md` | 真机预览记录模板（由 Human 填写，AI 不得代填） |
| `../../scripts/wechat-prototype/build.mjs` | 原型构建脚本（juice 内联 + 结构断言） |

## 二、视觉与字段基线

- **视觉**：对齐 `design/prototype/index.html` 与 D-030——暖调新闻纸 `#D5C5AE`、印刷墨黑 `#1D1D1B`、朱红微标 `#C03F13`、1px 直角细线；**零毛玻璃、零投影、零圆角**。
- **字体**：公众号不支持外部字体，模板全部使用系统回退栈（宋体 / 苹方 / 系统等宽），不加载 `@font-face` 或外链字体。
- **纸纹**：原型中的颗粒纸纹依赖 data-URI 背景图，公众号后台是否保留未实测，故成品**只用 `background-color: #D5C5AE` 实色**，不内联纸纹。
- **字段（D-030）**：栏目头（含日期）→ 五类官方标签索引 → 今日综述（AI 初稿）→ 每条资讯（编号 + 五类标签之一 + 事实层级 + 核心标题 + 精炼摘要 + 1–2 句极简「实务影响（AI 初稿）」+ 信源名称、日期与来源域名（纯文本） + 「→ 阅读原文」引导）→ 阅读原文引导区 → 合规注记。
- **「AI 初稿」不可省略**：每条资讯的实务影响与今日综述均带该标识；构建脚本会断言数量不足时失败。
- **「头条」由 Human 勾选**：依 D-019，AI 不得自行标「头条」。样稿 14 条全部为常规，未标头条；模板支持 `headline: true` 时渲染黑底「头条」标记。
- **「未核实」状态位**：模板支持 `unverified: true` 时渲染朱红描边「未核实」标记；本期 14 条样本均已核验，不出现该标记。
- **图片**：公众号端不内联插画（字段表允许「按 LD-G1-03 裁切或省略」）；本期样稿全部省略，避免未授权素材与后台裁剪问题。

## 三、用法

要求 Node.js `>= 22.12.0`（juice 12.2.6 的 engines 要求）。

```bash
# 1. 安装（仅 juice 一个直接依赖，固定版本，禁用安装脚本）
npm install --ignore-scripts

# 2. 用样本 JSON 生成成品 HTML
node scripts/wechat-prototype/build.mjs \
  --in design/wechat/samples/ld-g1-04-2026-11-24.json \
  --out /tmp/sample.html

# 或直接重建仓库内样稿
npm run build:samples
```

参数：

- `--in`：样本 JSON（必填）。
- `--out`：成品 HTML（必填）。
- `--template`：模板路径（可选，默认 `design/wechat/template.html`）。
- `--help`：打印说明。

脚本在写盘前自动断言：成品不含 `<style>`、`<script>`、`class=`、`<link>`、`@font-face`、`backdrop-filter`、`box-shadow`、`border-radius`，且保留 `#D5C5AE` 底色与足够的「AI 初稿」标识；任一项不满足即退出，不产出半成品。

## 四、样本 JSON 结构

```json
{
  "meta": {
    "site": "The Legal AI Daily",
    "column": "每日固定栏目",
    "issue": "第 001 期",
    "date": "2026-11-24",
    "dateLine": "2026-11-24 · 星期二 · 第 001 期",
    "internal": true,
    "internalNote": "内部样稿 · 不对外发布 · 仅供 Gate 1 评审",
    "digest": "今日综述……",
    "disclaimer": "合规注记……",
    "webDetailUrl": "https://lexaidaily.example/d/2026-11-24",
    "readOriginalNote": "……"
  },
  "items": [
    {
      "num": "01",
      "category": "监管与合规",
      "factLevel": "官方数据",
      "headline": false,
      "unverified": false,
      "title": "核心标题",
      "summary": "精炼摘要",
      "impactBrief": "1–2 句极简实务影响（AI 初稿）",
      "sourceName": "发布机构",
      "sourceDate": "2026-11-24",
      "sourceDomain": "ico.org.uk",
      "sourceUrl": "https://…（仅留档，不渲染进公众号正文）"
    }
  ]
}
```

- `category` 只接受五类官方标签：`监管与合规`、`模型与技术`、`实务与工具`、`判例与学术`、`行业与资本`；单条单标签（D-016）。
- `factLevel` 固定三选一：`已证实事实`、`官方数据`、`市场观点`；样本中的括注另存 `factLevelNote`，仅留档不渲染。
- `impactBrief` 由 LD-G1-04 的「实务影响锚点（AI 初稿）」压写为 1 句，仍属 AI 初稿，未经 Human 确认。
- `sourceDomain` 以纯文本显示在信源行（字段表要求公众号显示来源域名），不是可点击链接。
- `sourceUrl` 只作追溯留档，公众号正文不出现外链；跳转统一走「阅读原文」。

## 五、样稿说明（内部样稿，不对外发布）

- 来源：`docs/samples/LD-G1-04-sample-set.md`（14 条，2026-11-24 核验；五类覆盖 3/3/3/3/2）。
- 标题与摘要原文照录；`impactBrief` 为样本「实务影响锚点」的 1 句压写，未改变事实判断，但仍标注「AI 初稿」。
- 所有条目 `headline: false`、`unverified: false`：头条待 Human 终审勾选；样本集声明全部链接已核验。
- **长度差异（已发现，未擅改）**：14 条样本摘要均超过字段表 v0.3 的 160 字上限（实测 167–283 字）。为不改变已合入样本的事实表述，样稿按原文展示、未截断；正式发布前需 Human 精简至 160 字内。
- 成品 HTML 顶部有黑底「内部样稿 · 不对外发布 · 仅供 Gate 1 评审」横幅，文末重复合规注记。
- `webDetailUrl` 使用保留域名占位 `https://lexaidaily.example/d/2026-11-24`，不对应任何真实站点。

## 六、微信后台限制（实测状态）

**已主动规避（成品 HTML 中不存在）：**

- `<style>` 块、`class=` 选择器、`<script>`、外链 CSS / 字体（`<link>`、`@font-face`）。
- data-URI 纸纹背景、伪元素、`position`、`flex`、`box-shadow`、`backdrop-filter`、`border-radius`。

**未实测（需 Human 在公众号后台草稿与真机确认，不得预先下结论）：**

- 后台是否完整保留 `border`（含 `dashed` 与单边 `border-left`）、`letter-spacing`、`text-align: justify`、`word-break: break-all`。
- `background-color` 施加在 `<section>` 上时，后台是否保留为整块纸面。
- `ui-monospace` / `Songti SC` 等系统字体栈在 iOS、Android 微信 WebView 的实际字形与回退效果。
- 复制粘贴后段落间距、首行缩进是否被后台二次清洗。
- 后台是否保留 `rgba()` 边框色与 `vertical-align`。

真机预览与截图由 Human 按 `DEVICE_TEST.md` 填写；本任务不写“微信兼容”结论。

## 七、第三方与许可

- 直接依赖只有 **juice 12.2.6（MIT）**，用于把模板 CSS 内联到标签；版本固定，`package-lock.json` 入库，安装使用 `npm install --ignore-scripts`。
- juice 的 38 个传递依赖经安装后逐一读取 `package.json` 核对，许可证均为 MIT / MIT-0 / ISC / BSD-2-Clause / BSD-3-Clause；完整版本与来源见 `package-lock.json`。
- 登记见根目录 `THIRD_PARTY_NOTICES.md`（LD-G1-02 初始化，本任务追加 juice 条目与 MIT 全文）。
- 未拷贝 `doocs/md` 的任何代码、Logo、图片或 CDN 链接；本模板为原创实现，仅借鉴“主题 CSS → 内联”的通用思路。

## 八、复现与自检命令

```bash
npm install --ignore-scripts
npm ls
npm audit                       # 本地默认镜像不支持 audit 端点时会报 NOT_IMPLEMENTED，见 PR 记录
npm audit --registry=https://registry.npmjs.org

node scripts/wechat-prototype/build.mjs --in design/wechat/samples/ld-g1-04-2026-11-24.json --out /tmp/a.html
node scripts/wechat-prototype/build.mjs --in design/wechat/samples/ld-g1-04-2026-11-24.json --out /tmp/b.html
sha256sum /tmp/a.html /tmp/b.html

grep -c -E "<style|class=|<script" design/wechat/samples/*.html   # 期望 0（grep 无匹配时退出码为 1，属正常）
git diff --name-only origin/main...HEAD                            # 应全部落在任务书「可改文件」内
```

## 九、非范围

本目录只是原型生成，不是 Gate 2 的“一键渲染导出脚本”：不采集、不发布、不定时、不登录后台、不接凭据、不实现外链跳转（Gate 3）；不选正式域名，不写正式栏目期号规则。
