# 复核与审计报告｜LD-G2-05（R1 独立审计）

- 类型：独立审计（R1）
- 出具者：DeepSeek Harness｜日期：2026-11-28
- 审计对象：[PR #65](https://github.com/fitalex/LexAIDaily/pull/65)（分支 `gemini/ld-g2-05-dual-export`）｜关联 Issue：[#43](https://github.com/fitalex/LexAIDaily/issues/43)（Parent [#38](https://github.com/fitalex/LexAIDaily/issues/38)）｜基准 `origin/main@e4f6b81f2866eb6083970bce4b5e0de2bb3af260`；待审 HEAD `a44bc3a49bae80ddbe981ae992c8db2b3912fd3e`
- 检查范围：在 `/tmp` 独立共享克隆 `/tmp/lexai-g2-05-audit`（detached HEAD `a44bc3a`，`git status` 干净）中检查 `e4f6b81..a44bc3a` 全部 7 个变更文件；执行 `npm ci`、`TZ=Asia/Shanghai npm test`、`npm run validate:contracts`；两次（另加一次 `TZ=UTC`）实跑 `npm run export:dual -- --in-dir data/bundles --out-dir /tmp/... --approved-only`；逐字节比对公众号 HTML、Web 单日 JSON、`editions-index.json` 与仓库 `data/exports/ld-g2-05/manifest.json` 的 SHA-256；对 3 期 24 条样本做 Schema/白名单/长度/哨兵/链接核验；对 HTML 做禁用标签与底色检查；执行 10 组负向/边界探针；核对 Gate 1 冻结文件哈希；抽查 24 条一手链接的 HTTP 状态与页面标题。
- 未检查项：未调用真实 LLM（无密钥、无付费外部服务；本任务为纯导出审计，不涉及提示词质量）；未在微信公众号后台粘贴预览或做手机端视觉验收；未部署 Web 站点；未重审零改动的 Gate 1 业务代码（仅核对其文件哈希未变）；24 条链接中 2 条对自动抓取返回 403（KWM、Microsoft，疑为反爬），未做人工浏览器逐篇内容核验。
- 结论：**`CHANGES_REQUESTED`（需修改）**。核心导出的确定性、双层结构与 D-029/D-030 机械红线全部通过；但白名单校验存在显式绕过与空白名单静默跳过（S2），3 期样本大量 `source_url` 仅指向栏目/Feed/首页而非文章级原链（S2），另有 4 项 S3 需一并处理或在增量复审中说明。

---

## 一、DoD 逐项核对

| 序号 | 标准 | 结果 | 证据 |
|---|---|---|---|
| D01 | 干净环境 `npm ci`：71 packages、零新增依赖、`package-lock.json` 与 `THIRD_PARTY_NOTICES.md` 零改动 | **达成** | `npm ci` 输出 `added 71 packages in 649ms`；`git diff e4f6b81..a44bc3a -- package-lock.json THIRD_PARTY_NOTICES.md` exit 0；两文件 git blob 在基准与 HEAD 完全相同（`f96fdd36…`、`4c6cb86a…`）；`npm ls --depth=0` 仍为 8 个既有依赖 |
| D02 | `TZ=Asia/Shanghai npm test`：40/40 通过 | **达成（有保留）** | `# tests 40`、`# pass 40`、`# fail 0`、`# cancelled 0`、`# skipped 0`；但全量测试会向仓库 `data/topic-pool/` 写入未跟踪文件，见 ST03 |
| D03 | `npm run validate:contracts`：`filesChecked: 3` 且 `valid: true` | **部分达成（顺序敏感）** | 干净树：`{"valid":true,"trackedFiles":[],"filesChecked":3,"errors":[]}`；按任务顺序先跑 `npm test` 后：`filesChecked: 4`（测试生成的 `data/topic-pool/2026-11-24.json` 被纳入）。根因是既有测试未隔离，见 ST03 |
| D04 | 两次双层导出，公众号 HTML 与 Web JSON（含 `editions-index.json`）SHA-256 与仓库 manifest 100% 一致 | **达成** | 两次 `--approved-only` 均 `exported=3`，`webIndexSha256=5c6a4f4336f9…`；两次 manifest 与仓库 manifest 深比较均为 `true`；3 期 × 2 类文件共 6 个哈希全部命中；`editions-index.json` 哈希 `5c6a4f43…58eb75` 命中；`TZ=UTC` 复跑亦全部命中 |
| D05 | D-030 公众号 HTML：零 `<a href>`、零 `<table>`、零 `<style>`/`<script>`/`class=`、保留 `#D5C5AE` | **达成** | 3 个 HTML：`a_href=0`、`a_any=0`、`table=0`、`style_tag=0`、`script_tag=0`、`class_attr=0`；`background-color:#D5C5AE` 各 37 处；`阅读原文` 各 2 处；`detail_analysis`/`key_points`/`legal_commentary`/`evidence_quotes` 片段均未泄漏进公众号 HTML |
| D06 | D-029 Web V16：近 3 日完整日报 + 按周精选归档 | **达成** | `recent_keys=["2026-11-26","2026-11-25","2026-11-24"]`；`weekly_archive_keys=["2026-W48"]`；W48 归档 6 条，`badge` 全为「周度精选」，低价值条目 0，头条 3、高风险 6 |
| D07 | 3 期样本：100% 合法 HTTPS、零 `[invalid URL]`、零禁用全文字段、白名单 `source_id` 100% 命中、`summary ≤160`、`key_points` 1–3 段且合计 ≤600、哨兵 15%–25% | **达成（按 Schema/SOP/本任务口径；链接粒度见 SP01）** | 24 条：Schema 24/24、白名单 24/24、禁用键 0、`[invalid URL]` 0、`summary` 超限 0（最长 108）、`key_points` 数量 24/24 为 1（合计 182–234）、哨兵各期 2/8=25.0%；24/24 `https://`，22 条 HTTP 200、2 条 403（反爬，非 404）；`aihot.news` 0 |
| D08 | ADR-0002 / ADR-0003 红线 | **部分达成** | ADR-0003：双轨 `cn/global` 齐全、`aihot.news` 0；ADR-0002：无全文字段、`evidence_quotes` 1–3、`legal_commentary` 200–400 全部通过；但 `key_points` 的 ADR/合同文档口径（3–5 条、每条 8–140）与 Schema/SOP（1–3 段、合计 ≤600）不一致，见 ST04 |
| D09 | 未触碰 Gate 1 冻结基线与原型文件 | **达成** | 变更仅 7 个文件；`scripts/wechat-prototype/build.mjs`、`design/prototype/index.html`、`README.md`、`ROADMAP.md`、`AGENTS.md`、两份 ADR 的 git blob 在基准与 HEAD 完全相同 |
| D10 | 对抗性边界：非法 Schema、超 160 摘要、超 600 `key_points`、`raw_text`、`[invalid URL]`、未注册 `source_id`、`--approved-only` 严格 fail-closed | **部分达成** | 默认路径全部 exit 1 且不产出数据；但 `--skip-whitelist-check` 可显式绕过白名单，空白名单也会静默跳过（ST01）；全 pending 的 `--approved-only` 失败后留下空目录（ST02） |
| D11 | `--approved-only` 过滤严格性 | **达成（数据面）** | 混合样本：8 条中 1 条 `pending_review`，`--approved-only` 导出 7 条，manifest/index/WeChat 均为 7，状态全 `approved`；不加 flag 时 8 条（含 pending）；全 pending 时 exit 1、无 manifest/数据文件 |

---

## 二、双轴发现

### 2.1 Standards 轴（仓库规范违背 & 代码坏味道）

| 编号 | 级别 | 类型 | 位置 | 问题与依据 | 建议 |
|---|---|---|---|---|---|
| ST01 | **S2 重要** | 规范违背 | `src/export/dual-export.mjs:337`、`:472-473`、`:520`、`:494` | 白名单校验并非严格 fail-closed：(a) CLI 接受未在 `--help` 中披露的 `--skip-whitelist-check`，`:520` 直接把 `verifyWhitelist` 置 false；探针 P6 用未注册 `source_id` + 该 flag，exit 0 并导出 8 条；(b) `:337` 仅在 `whitelistIds.size > 0` 时校验，`loadWhitelistSourceIds()` 对缺失/空 YAML 静默返回空集合；以空 `repoRoot` 调用 `exportDualLayer`，白名单 size=0，未注册 source 仍成功导出 8 条。PR 描述“导出前强制……白名单 `source_id` 对齐检查”与实现不符，亦与 AGENTS.md 8.2“仅取自信源白名单”冲突。 | 移除隐藏开关，或改为需显式 Human 授权、带醒目告警与审计日志的受控开关；白名单文件缺失/解析为空时直接 fatal；补负向测试（含 flag 与空 YAML 两种向量）。 |
| ST02 | S3 建议 | 坏味道 / 资源清理 | `src/export/dual-export.mjs:375-376` | `mkdirSync(wechatOutDir)`/`mkdirSync(webOutDir)` 在条目过滤与映射之前执行。探针 P7（全部 `pending_review` + `--approved-only`）exit 1、无数据文件，但留下空的 `wechat/`、`web/` 目录。数据面未泄漏，但失败路径不干净。 | 先完成过滤/映射再创建目录，或在 `finally` 中清理本次新建的空目录；补测试断言失败时输出目录不存在。 |
| ST03 | S3 建议 | 测试隔离（既有问题，非本 PR 引入） | `tests/prompts/prompts.test.mjs:709-716`；`src/pipeline/merge-and-curate/index.mjs:66` | R3 用例调用 `runCuratePipeline` 时未传 `topicPoolDir`，默认落到仓库 `data/topic-pool/`，全量测试后生成未跟踪的 `2026-11-24.json`/`.md`；随后 `validate:contracts` 的 `filesChecked` 由 3 变 4。该测试在基准 `e4f6b81` 已存在，PR #65 未修改它，但 PR 描述的 `filesChecked: 3` 因此只在干净树成立，按任务给定顺序执行会得到 4。 | 测试显式传 `topicPoolDir` 到临时目录（与同文件其他用例一致）；测试结束清理；CI 增加 `git status --porcelain` 断言，防止未跟踪产物被误提交。 |
| ST04 | S3 建议 | 文档一致性（既有问题，非本 PR 引入） | `docs/adr/0002-fact-tier-and-no-fulltext.md:12`；`docs/contracts/gate2-data-contract-v1.md:31`；`schemas/candidate-item.schema.json:182-191`；`docs/sop/HUMAN_REVIEW_SOP.md:43` | `key_points` 口径冲突：ADR-0002 与合同文档写“3–5 条、每条 8–140 字”；Schema 在基准 `e4f6b81`（LD-G2-04“Option B detail contract”）已改为“1–3 段、每段 8–600、合计 ≤600”，SOP 与本次任务口径也是 1–3/≤600。3 期样本均只有 1 段，按 Schema/SOP/本任务口径通过，但按 ADR/合同文档字面不通过。该漂移由基准提交引入，不是 PR #65 新增。 | 由 Human 确认最终口径；若以 Schema/SOP 为准，更新 ADR-0002 与合同文档 §2.3；若以 ADR 为准，则 Schema 与样本需回改。建议在本次或紧随的文档任务中消除冲突，避免后续审计各执一词。 |

### 2.2 Spec 轴（Issue/任务书偏差）

| 编号 | 级别 | 类型 | 位置 | 问题与原需求引用 | 建议 |
|---|---|---|---|---|---|
| SP01 | **S2 重要** | 偏差 | `data/bundles/2026-11-24.json`、`2026-11-25.json`、`2026-11-26.json` 的 `source_url` | Issue #43 要求“连续 3 期**真实**双轨白名单试运行样本……**100% 一手链接**”。24 条中仅 5 条为文章级 slug（ICO ×2、EU AI Office、Thomson Reuters 博客、arXiv）；17 条指向栏目/Feed/首页/列表页（如 `https://hai.stanford.edu/news`、`https://api-docs.deepseek.com/updates`、`https://www.courtlistener.com/feed/search/?q=AI`、`https://www.chinalawinsight.com/`、`https://www.court.gov.cn/fabu.html`、`https://openai.com/news/rss.xml`、`https://www.lawnext.com/feed`），另有 2 条为产品/文档页。页面标题多为 `News | Stanford HAI`、`Change Log | DeepSeek API Docs`、`网信政务`、`CourtListener.com Custom Search Feed` 等通用标题，无法直接核验条目标题所声称的具体事实。链接格式与域名为一手 HTTPS 均通过，但“文章级一手原链”未达成；SOP 第 36/41 行也要求“点击 `source_url` 核对一手原页”。 | 将 17 条栏目/Feed 链接替换为对应文章级 URL；若内部试运行确需用栏目页，应在任务书/PR 中显式写明例外并获得 Human 认可，同时不要宣称“100% 一手原链”。建议在 SOP 增加人工检查项：`source_url` 必须落到具体文章/公告/判例页，而非频道首页或 RSS。 |
| SP02 | S3 建议 | 遗漏 / 可验证性 | `data/bundles/*.json` 的 `meta.web_detail_url`；导出产物 | 3 期样本的 `web_detail_url` 均为保留域名 `https://lexaidaily.example/d/<date>`，导出后的 Web JSON 与公众号 HTML 均带该地址（HTML 正文可见）。`.example` 不可解析，因此“引导「阅读原文」跳 Web 详情页”在样本上无法真正端到端点击验证；样本 `internal: true`、标注“不对外发布”，可作为内部占位，但验收证据不应把它当作可用跳转。 | 使用真实预览域名/路径，或在样例与 PR 描述中明确标注“占位，不可点击”；公开导出前增加域名校验，拒绝 `.example`/`localhost` 等非生产地址。 |

---

## 三、证据与红线核验

### 3.1 环境与基线

- 审计克隆：`/tmp/lexai-g2-05-audit`，`git clone --shared` 自工作仓库，`git checkout --detach a44bc3a`；审计前后 `git status --porcelain` 为空（仅临时生成物在审计中被清理）。
- PR 元数据：`gh pr view 65` 显示 `state=OPEN`、`headRefOid=a44bc3a49bae80ddbe981ae992c8db2b3912fd3e`、`baseRefOid=e4f6b81f2866eb6083970bce4b5e0de2bb3af260`、`mergeable=MERGEABLE`；`gh pr checks 65` 返回 `no checks reported`，即 **CI 未触发**（未写成通过）。
- 变更范围：仅 7 个文件——3 个 `data/bundles/*.json`、1 个 `data/exports/ld-g2-05/manifest.json`、`package.json`（仅 scripts）、`src/export/dual-export.mjs`、`tests/export/dual-export.test.mjs`；无删除、无依赖段变化、`git diff --check` exit 0。

### 3.2 干净环境命令记录

```text
$ npm ci
added 71 packages in 649ms

$ TZ=Asia/Shanghai npm test
# tests 40
# pass 40
# fail 0
# cancelled 0
# skipped 0
# todo 0

$ npm run validate:contracts        # 干净树
{"valid":true,"trackedFiles":[],"filesChecked":3,"errors":[]}

$ npm run validate:contracts        # 先跑 npm test 后（ST03）
{"valid":true,"trackedFiles":[],"filesChecked":4,"errors":[]}
```

依赖不变量：

```text
package-lock.json        SHA-256 350305b5b39be031a4806b64643cc94a4dcc5a529fe63ac8503b32c9ee435f93
THIRD_PARTY_NOTICES.md   SHA-256 6479dfe3e7d50b6fb3943d9acc2c00766b76e333d0f37da0d10203cb97f20ce4
git diff e4f6b81..a44bc3a -- package-lock.json THIRD_PARTY_NOTICES.md  → exit 0
npm ls --depth=0 → 8 个既有依赖（readability/ajv/ajv-formats/js-yaml/juice/linkedom/normalize-url/rss-parser）
```

### 3.3 双层导出与确定性哈希

两次 `--approved-only` 实跑（`TZ=Asia/Shanghai`）：

```text
[export:dual] exported=3 editions | webIndexSha256=5c6a4f4336f9 | manifest=/tmp/lexai-g2-05-check/manifest.json
[export:dual] exported=3 editions | webIndexSha256=5c6a4f4336f9 | manifest=/tmp/lexai-g2-05-check2/manifest.json
```

| 日期 | 公众号 HTML SHA-256（实测 = manifest） | Web JSON SHA-256（实测 = manifest） |
|---|---|---|
| 2026-11-24 | `8a7970d2f050b709db9d9260027bdda44c6a70216591d97113078612ef896186` | `74cd6b819167c03d485a53b49ec3b735bc0a2fcda0e9aec5f2899cb0898dadd1` |
| 2026-11-25 | `34becdc7aea3644cfc04d57aff4c51d2c5253660c57cb8f1a07f46714bef8538` | `5957e33595009fc11299615771415d79473b995d962d9af80f0b1fb4ce3a2b2f` |
| 2026-11-26 | `475367e4a946c57d3ef839831e63d285a325bb778f982b76d2fefb3472a8749a` | `9f01340c05e6bb2df29b3c4be5eef73da86e935f78ad2532891b5a597a69d8f6` |
| editions-index | — | `5c6a4f4336f981f118108db4f4b562e9b829466869575b96ddafd37e7458eb75` |

- 两次 manifest 深比较 `true`；仓库 manifest 与两次运行 manifest 深比较 `true`。
- 追加 `TZ=UTC` 第三次运行：manifest 与仓库完全一致，3 期 WeChat/Web 与 index 哈希全部命中，说明输出不依赖本地时区。
- 公众号 HTML 单文件约 40.9 KB；未包含 `detail_analysis`/`key_points`/`legal_commentary`/`evidence_quotes` 的正文片段（抽取首条首 30 字检索均为 false）。

### 3.4 3 期样本红线统计

| 指标 | 2026-11-24 | 2026-11-25 | 2026-11-26 | 合计/结论 |
|---|---|---|---|---|
| 条目数 | 8 | 8 | 8 | 24 |
| Schema valid | true | true | true | 24/24 |
| 白名单 source_id 命中 | 8/8 | 8/8 | 8/8 | 24/24（白名单共 26 个） |
| 禁用全文字段 | 0 | 0 | 0 | 0 |
| `[invalid URL]` | 0 | 0 | 0 | 0 |
| `summary` 超 160 | 0 | 0 | 0 | 0（最长 108） |
| `key_points` 数量/合计 | 1 段/182–234 | 1 段/185–234 | 1 段/182–210 | 均在 1–3 且 ≤600 |
| `evidence_quotes` 1–3、单段 ≤150 | 通过 | 通过 | 通过 | 通过 |
| `legal_commentary` 200–400 | 通过 | 通过 | 通过 | 通过 |
| 高风险哨兵占比 | 2/8=25.0% | 2/8=25.0% | 2/8=25.0% | 15%–25% 内 |
| `cn/global` 双轨、五大分类 | 齐全 | 齐全 | 齐全 | 通过 |
| `review_status` | 全 approved | 全 approved | 全 approved | 通过 |
| AI 初稿标记 | 7/8 条 true；头条 false | 7/8 条 true；头条 false | 7/8 条 true；头条 false | 与“1 条人工精修头条”一致 |
| `aihot.news` | 0 | 0 | 0 | 0 |

### 3.5 对抗性探针结果

| 探针 | 输入 | 实际结果 | 判定 |
|---|---|---|---|
| P1 非法 Schema | 删除 `meta.site` | exit 1；`must have required property 'site'`；不建输出目录 | fail-closed |
| P2 超 160 摘要 | `summary=161` 字 | exit 1；`must NOT have more than 160 characters`；不建目录 | fail-closed |
| P3 超 600 `key_points` | 310+300=610 字（每段均 ≤600） | exit 1；`total length (610) exceeds 600`；不建目录 | fail-closed |
| P4 禁用 `raw_text` | 条目加 `raw_text` | exit 1；`forbidden fulltext field "raw_text"` + `additional properties`；不建目录 | fail-closed |
| P5 `[invalid URL]` | `source_url="[invalid URL]"` | exit 1；`pattern "^https://"` + `format "uri"`；不建目录 | fail-closed |
| P6 未注册 `source_id` | `source_id="unregistered-fake-src"` | 默认 exit 1；`not registered in whitelist`；不建目录 | 默认 fail-closed |
| P6b 未注册 + `--skip-whitelist-check` | 同上 + 隐藏 flag | **exit 0，导出 8 条并写 manifest** | **ST01 绕过** |
| P6c 空白名单 API | `repoRoot=/tmp/lexai-empty-root`（无 whitelist YAML） | whitelist size=0；未注册 source 仍导出 8 条 | **ST01 fail-open** |
| P7 全 pending + `--approved-only` | 8 条全 `pending_review` | exit 1；`无可导出条目`；无数据文件，但留下空 `wechat/`、`web/` | fail-closed（ST02 残留） |
| P8 混合 + `--approved-only` | 1 pending + 7 approved | exit 0；Web/manifest/index/HTML 均 7 条，状态全 approved | 过滤正确 |
| P8b 混合不加 flag | 同上 | exit 0；8 条，含 1 条 pending | 行为符合 flag 语义 |
| P9 多包原子性 | 1 个坏包 + 1 个好包 `--in-dir` | exit 1；坏包被先校验；不建输出目录 | 原子 fail-closed |
| P10 HTML 注入 | `summary` 注入 `<script>`/`<a href>` | exit 0；输出 `script_tags=0`、`a_href=0`（构建转义后通过断言） | 安全 |

### 3.6 Gate 1 冻结基线与原型

`git diff --name-only e4f6b81..a44bc3a` 仅 7 个文件；以下文件在基准与 HEAD 的 git blob 完全相同：

```text
scripts/wechat-prototype/build.mjs
design/prototype/index.html
README.md
ROADMAP.md
AGENTS.md
docs/adr/0002-fact-tier-and-no-fulltext.md
docs/adr/0003-dual-track-regional-collection.md
```

### 3.7 一手链接抽查

- 24/24 为 `https://`，域名均属白名单信源或其官方子域；`aihot.news` 0。
- 自动抓取状态：22 条 HTTP 200；2 条 HTTP 403（`chinalawinsight.com`、`microsoft.com`，疑为反爬，非 404）。
- 页面标题与条目标题的匹配情况显示：文章级 slug（ICO、EU、TR 博客、arXiv）标题基本对应；栏目/Feed/首页类（Stanford HAI News、DeepSeek Change Log、CAC 网信政务、CourtListener Search Feed、Harvey Blog、Anthropic News、SPC 权威发布、Legora Blog、Zhipu Release Notes、Hankun 观点、OpenAI News RSS、Junhe 法评、LawSites、TR Institute 等）只显示通用频道标题，无法直接核验条目声称的具体事实——见 SP01。

---

## 四、建议结论

- **单行汇总**：Standards 轴 4 项（最重：`ST01 S2`）｜Spec 轴 2 项（最重：`SP01 S2`）。
- **结论**：`CHANGES_REQUESTED`（需修改）。核心导出链路、确定性哈希、D-029/D-030 机械红线与 Gate 1 冻结边界均通过；但白名单校验可被隐藏开关绕过、空白名单时静默 fail-open，且 3 期“真实试运行样本”大量使用栏目/Feed 链接，未达到文章级一手原链的严格口径。建议原 Owner 在原 PR 修复 ST01、SP01，并一并处理 ST02/ST03/ST04（或由 Human 对 SP01/ST04 口径作出书面决定），修复后按增量复审。
- 本意见只构成证据，不自动产生权限；合并与最终决定属于 Human Maintainer。本次审计未修改仓库代码、未 push、未合并。

---

## 附录 A：LD-G2-04 R1–R3 审计原稿（可选补档）

本地仍保留以下三份原稿（当前为工作仓库未跟踪文件，未写入 `docs/audits/README.md`；补档需另提 docs PR）：

| 文件 | Git blob SHA（`git hash-object`） | 行数 | 结论 |
|---|---|---|---|
| `docs/audits/LD-G2-04-dsh-audit-r1.md` | `bf98ed80945226546cebf876e51977dece83487e` | 210 | `CHANGES_REQUESTED`（R1） |
| `docs/audits/LD-G2-04-dsh-audit-r2.md` | `b2513d93f5f27e7a2c4530f6e613c98b1dacd3d2` | 177 | `CHANGES_REQUESTED`（R2，2 项 S2） |
| `docs/audits/LD-G2-04-dsh-audit-r3.md` | `6ec6f3c4cc0c625c35df28d4d38bc4689f5e4b37` | 163 | `ACCEPT`（R3，37/37；R2 的 2 S2 + 5 S3 关闭） |

三份文件与用户给出的 SHA 前缀 `bf98ed8` / `b2513d9` / `6ec6f3c` 一致；R1 被审 HEAD `95ebd52`，R2 被审 HEAD `849f34d`，R3 被审 HEAD `bb97409`，基准均为 `df33e91`。

## 附录 B：本次审计报告自身

- 报告文件：`/tmp/lexai-g2-05-dsh-audit-r1.md`
- 报告 blob SHA：归档时以 `git hash-object` 计算，最终值见本次审计回复（AGENTS.md 6.2 通知）。
- 审计对象 HEAD：`a44bc3a49bae80ddbe981ae992c8db2b3912fd3e`。
