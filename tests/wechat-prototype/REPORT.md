# LD-G1-06｜公众号排版导出结构与兼容性交叉测试报告

- **任务编号**：LD-G1-06（A 级，Owner：Antigravity，依据 D-015）
- **参考规范**：[docs/daily-specs/LD-G1-06.md](../../docs/daily-specs/LD-G1-06.md)、[PR #29 最新派发评论（#issuecomment-7164363493）](https://github.com/fitalex/LexAIDaily/pull/29#issuecomment-7164363493)
- **被测对象**：PR #29（分支 `ds/ld-g1-03-wechat-template`，样式/脚本最新 commit `b672ec43`；步骤 1 重建样稿并推送至 `c3dddfa`）
- **测试分支**：`ag/ld-g1-06-wechat-xtest`（基于 `c3dddfa` 切出）
- **运行环境**：macOS / Node.js `v22.22.3`（零新增依赖，仅使用 Node 内置 `node:test`、`node:assert/strict`、`node:crypto` 等标准库）
- **总体结论**：**通过（4/4 用例全部通过，0 失败、0 跳过）**；不替代视觉验收与微信实机渲染。

---

## 一、已运行命令与原始输出

### 1. 步骤 1：在 `ds/ld-g1-03-wechat-template`（`b672ec43`）重建样稿并校验确定性

```text
$ npm install --ignore-scripts

up to date in 342ms

$ npm run build:samples

> lexaidaily-wechat-prototype@0.0.0 build:samples
> node scripts/wechat-prototype/build.mjs --in design/wechat/samples/ld-g1-04-2026-11-24.json --out design/wechat/samples/ld-g1-04-2026-11-24.html

已生成 design/wechat/samples/ld-g1-04-2026-11-24.html｜5 个分类章节｜14 条资讯｜62595 bytes｜模板 /Users/feilu/Desktop/ALL in AI/Antigravity/LexAIDaily/design/wechat/template.html

$ node scripts/wechat-prototype/build.mjs --in design/wechat/samples/ld-g1-04-2026-11-24.json --out /tmp/a.html
已生成 /tmp/a.html｜5 个分类章节｜14 条资讯｜62595 bytes｜模板 /Users/feilu/Desktop/ALL in AI/Antigravity/LexAIDaily/design/wechat/template.html

$ node scripts/wechat-prototype/build.mjs --in design/wechat/samples/ld-g1-04-2026-11-24.json --out /tmp/b.html
已生成 /tmp/b.html｜5 个分类章节｜14 条资讯｜62595 bytes｜模板 /Users/feilu/Desktop/ALL in AI/Antigravity/LexAIDaily/design/wechat/template.html

$ shasum -a 256 /tmp/a.html /tmp/b.html design/wechat/samples/ld-g1-04-2026-11-24.html
799ebf6d92a3f967bb2694d0327d2f7667655502b31790abb797f03e9f7a8243  /tmp/a.html
799ebf6d92a3f967bb2694d0327d2f7667655502b31790abb797f03e9f7a8243  /tmp/b.html
799ebf6d92a3f967bb2694d0327d2f7667655502b31790abb797f03e9f7a8243  design/wechat/samples/ld-g1-04-2026-11-24.html
```

已仅将重建后的 `design/wechat/samples/ld-g1-04-2026-11-24.html` 提交并推送至 `ds/ld-g1-03-wechat-template`（commit `c3dddfa`），未修改 `template.html` 与 `build.mjs`。

### 2. 步骤 2：在 `ag/ld-g1-06-wechat-xtest` 运行自动化交叉测试

```text
$ node --test tests/wechat-prototype/
✔ D01：成品 HTML 零禁用标签/样式，且主区块均保留 #D5C5AE 暖报纸底色 (1.355209ms)
✔ D02：今日综述内嵌 14 条目录、14 条字段与 AI 初稿/AI 生成插画标识完整 (0.691ms)
✔ D03：公众号正文不含任何 <a href> 外链，且样本 JSON 14 条 sourceUrl 均为合法 https:// 链接 (0.305792ms)
✔ D04：同一输入调用 build.mjs 构建两次，输出 sha256 与仓库样稿完全一致 (312.819125ms)
ℹ tests 4
ℹ suites 0
ℹ pass 4
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 366.204292
```

> 说明：Node.js v22 直接传目录路径 `node --test tests/wechat-prototype/` 时会按模块入口查找 `index.js`，因此本目录提供 `tests/wechat-prototype/index.js` 引入 `wechat-export.test.mjs`，确保 `node --test tests/wechat-prototype/`、`node --test tests/wechat-prototype/*.test.mjs` 与 `node --test` 三种运行方式均直接通过。

---

## 二、DoD 验收核对（对齐 D-030 与 2026-11-25 微信实测约束）

| 序号 | 验收项 | 结果 | 核验内容与证据 |
|---|---|---|---|
| D01 | 零禁用标签与样式 + `#D5C5AE` 底色 | **通过** | 成品 HTML 零 `<style>`、`class=`、`<script>`、`<link>`、`@font-face`、`<table>`（含 `<tr>`/`<td>`）、`backdrop-filter`、`box-shadow`、`border-radius` 与旧底色 `#EBE2D4`；`<html>`、`<body>`、根 `<section>`、全部 13 个顶层主区块与 14 条资讯卡片 `<section>` 均保留 `background-color: #D5C5AE` 与 `margin: 0` |
| D02 | 字段、目录与 AI 标识完整 | **通过** | 「今日综述」带 `AI 初稿` 标识及 `meta.digest`，内嵌「本期目录 · CONTENTS」全部 14 条标题；5 个官方分类章节顺序渲染 14 条资讯（覆盖 3/3/3/3/2），每条均含编号、分类标签、标题、摘要、1 句「实务影响 · AI 初稿」、信源名称/日期/域名与事实层级；5 章均含对应 `baseline-*-v3.webp` 插画 `<img>` 及「插画由 AI 生成」图注（全篇「AI 初稿」共 16 处 ≥ 15，「插画由 AI 生成」共 5 处） |
| D03 | D-030 微信无外链约束 | **通过** | 成品 HTML 含 `0` 个 `<a>` 与 `0` 个 `href=` 属性，14 条原始 `sourceUrl` 未进入正文，文末保留「查看今日完整版与一手信源」与「点击左下角「阅读原文」直达」及占位地址 `https://lexaidaily.example/d/2026-11-24`；样本 JSON 全部 14 条 `sourceUrl` 均为合法 `https://` URL 且域名与 `sourceDomain` 完全一致 |
| D04 | 确定性构建 | **通过** | 测试脚本内两次实际调用 `scripts/wechat-prototype/build.mjs` 输出临时文件，两者与仓库内 `design/wechat/samples/ld-g1-04-2026-11-24.html` 的 `sha256` 均为 `799ebf6d92a3f967bb2694d0327d2f7667655502b31790abb797f03e9f7a8243` |
| D05 | 测试报告 | **通过** | 本文件如实记录全部命令、输出、S1/S2/S3 发现与未检查项 |

---

## 三、按严重程度排序的发现（S1 / S2 / S3）

### S1（阻断性缺陷）
- 无（0 项）。

### S2（重要风险 / 已知门禁前待办）
1. **样本摘要长度超出字段表上限（既有已知项，已在 `design/wechat/README.md` 第四节登记）**：`design/wechat/samples/ld-g1-04-2026-11-24.json` 中 14 条摘要实测长度为 167–283 字，均超过 `design/card-fields-v0.md` 规定的 160 字上限。当前作为 Gate 1 内部评审样稿照录 `LD-G1-04` 原文；正式对外发布前仍须由 Human 精简至 160 字以内。

### S3（轻微观察与文档同步提示，不阻断）
1. **同目录文档与 `b672ec43` 改版存在滞后**：`design/wechat/DEVICE_TEST.md` 第 11 行仍登记旧版样稿哈希 `f2e6171bd45039100b64aa878471fb0d9582caa8aa04106270179e785ffc19f9`，且第 42–58 项检查表与 `design/wechat/README.md`、`design/wechat/read-original-flow.md` 仍留有旧版 `#EBE2D4` 底色、`<table>` 报眉/章节头及「第 NN 条 · 完整实务锚点与一手信源 → 阅读原文」等描述（受本任务「不可改文件：`design/`」约束未在本 PR 修改）。建议在 PR #29 合并前或 `LD-G1-07` 文档同步任务中统一刷新。
2. **分支基线内的本地图片路径解析**：`ds/ld-g1-03-wechat-template` 分支基线为 `cf65393`，5 张 v3.0 插画资产（`design/assets/illustrations/baseline-*-v3.webp`）位于后续合并进 `origin/main`（`36a8c90`，PR #26）的提交中，故当前分支工作树尚无 `design/assets/illustrations/` 目录；待 PR #29 合入 `main` 后，样本 HTML 中的相对路径 `../../assets/illustrations/baseline-*-v3.webp` 即可在仓库内直接解析。
3. **根目录 `.gitignore` 未忽略 `node_modules/`**：执行 `npm install --ignore-scripts` 后本地存在未跟踪目录 `node_modules/`；提交本 PR 时已核对仅包含 `tests/wechat-prototype/` 下文件。

---

## 四、未检查项与外部验收说明

1. **视觉审美判断**：按 `LD-G1-06` 任务书「非范围」规定，本次交叉测试只校验导出 HTML 结构、字段完整度、无外链约束与确定性构建，不做视觉审美判断。
2. **微信公众号后台粘贴与手机端真机渲染**：
   - 本测试脚本未登录微信公众号后台，未实际抓取或模拟微信客户端 WebView 渲染。
   - 依据 PR #29 最新协调者同步记录（[#issuecomment-7164363493](https://github.com/fitalex/LexAIDaily/pull/29#issuecomment-7164363493)），**Human Maintainer 已于 2026-11-25 基于样式与结构已同步至 `b672ec43` 的 `preview-redesign.html`（`9e566c59`）完成公众号后台内容结构检测（0 告警）与手机端实机预览验收通过**。本轮重建的 `design/wechat/samples/ld-g1-04-2026-11-24.html`（`c3dddfa`）尚未由本测试重新人工粘贴入微信后台复测。
3. **原始信源外部链接连通性**：D03 仅校验样本 JSON 中 14 条 `sourceUrl` 均为合法 `https://` URL 且与 `sourceDomain` 一致，未发起外部 HTTP 请求核验实时状态码（URL 真实性已由 `LD-G1-04` 样本集在 2026-11-24 核验）。
4. **CI**：**CI 未触发**（仓库当前未配置 `.github/workflows/`）。

---

## 五、边界声明

- 本 PR 仅新增 `tests/wechat-prototype/` 下文件，未修改 `scripts/`、`design/`、`package.json`、`README.md`、`ROADMAP.md`、`AGENTS.md`。
- 本 PR **不自行合并**，合并与 Gate 验收决定权归 Human Maintainer。
