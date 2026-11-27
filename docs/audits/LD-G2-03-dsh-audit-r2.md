# 复核与审计报告｜LD-G2-03（R2 增量复核）

- **类型**：独立审计（R2 增量复核）
- **出具者**：DeepSeek Harness｜**日期**：2026-11-27
- **审计对象**：[PR #58](https://github.com/fitalex/LexAIDaily/pull/58)｜**Issue**：[#41](https://github.com/fitalex/LexAIDaily/issues/41)
- **基准**：`origin/main@3f8fd49b30e87b0abf13368cd722dbf17208f152`
- **R1 已审 HEAD**：`4a5f16806d406882fb54360eec88fc617f8cfb95`
- **R2 待审 HEAD**：`a5a3b28a78d9ee83082e0bdc2301dca8ff521274`（`a63e761` + `a5a3b28`）
- **结论**：**需修改（CHANGES_REQUESTED）**
- **归档草稿**：[docs/audits/LD-G2-03-dsh-audit-r2.md](docs/audits/LD-G2-03-dsh-audit-r2.md)（未 commit/push），Git blob SHA：`33941408b4d5ed36e237231be190afe847cb2e59`

---

## 一、R1 发现逐项关闭核验

| R1 编号 | R2 状态 | 核验证据 |
|---|---|---|
| **ST01**（S1，RSS HTML/XSS） | **已关闭** | `stripHtmlToPlainText` 已覆盖 RSS 解析与候选生成；全链路对抗测试中 `summary` 不含 `<p>`、`<script>`、`alert(1)`。 |
| **ST02**（S2，npmmirror lock） | **已关闭** | `registry.npmmirror.com` 残留 0；71 个 `resolved` 全部 npmjs；`npm ci` 成功 71 包；`npm audit` 0 vulnerabilities。 |
| **ST03**（S2，MONID 熔断） | **已关闭** | `parseStrictDailyCap("abc")`/`"-3"` -> 0；`MONID_DAILY_MAX_CALLS=abc` 对抗测试 0 次调用。 |
| **ST04**（S2，单条 Schema 失败拖垮整轨） | **已关闭** | 单条失败记入 `rejectedItems`，源置 `degraded` 并继续；L2 非法 `source_id` 被跳过。 |
| **ST05**（S2，UTC 日期） | **已关闭** | `getLocalDateString` 按 `TZ \|\| Asia/Shanghai`；测试 `2026-11-26T18:30:00Z` -> `2026-11-27`。 |
| **ST06**（S3，notices 准确性） | **未关闭，升为 R2-ST01 S1** | 4 个新增包 LICENSE 全文逐字匹配；但相对 `origin/main` 出现 **2 行删除**，且 juice/ajv-formats 的 MIT 文本被改写。 |
| **ST07**（S3，测试/校验接缝） | **部分关闭** | `npm test` 已包含 wechat，30/30；但 `candidate-item` CLI 仍不接受 `cn.json` 数组，`validate:contracts` 仍未批量校验公开产出。 |
| **ST08**（S3，原子写/退出码） | **部分关闭** | 原子写与损坏轨降级已实现；`daily` 在 CN/Global 均 `failed` 时仍退出 0。 |
| **SP01**（S2，AIHOT 热度） | **已关闭** | 读取 live `score`；夹具 `score:86` -> `heat_score:86`。 |
| **SP02**（S2，304 数据丢失） | **部分关闭** | 新对象格式缓存 304 复用 -> 1 条；旧 R1 字符串 etag 缓存命中 304 仍返回 0 条。 |
| **SP03**（S2，中文分句） | **已关闭** | `Intl.Segmenter("zh")`；无空格 4 句 -> 4 句；长法规 8 条款 -> 4 段，引文命中“核心条款段 2”。 |
| **SP04**（S2，事实层级/来源） | **基本关闭** | T2 律所 -> `market_opinion` + `unverified:true`；AIHOT 最高法原链 -> `confirmed_fact` + `high_risk_legal:true` + 原来源名；`academic_paper` 仍为 `official_data`（R2-SP06）。 |
| **SP05**（S2，发布日期/效力状态） | **部分关闭** | 静态页 meta 日期可解析，法院 -> `not_applicable`；无时区时间提前一天；无日期仍以采集时间填 `published_at`（有 inferred/needs 标记）。 |
| **SP06**（S2，跨轨去重误合并） | **部分关闭** | “AI+2026”无关负例已通过；纯中文 vs 纯英文同事件仍为 2 个 cluster，global 优先未生效。 |
| **SP07**（S2，代理缺失） | **功能已关闭，新增 S2** | `EnvHttpProxyAgent` 已接入；但 `undici` 未写入 `package.json`，是 juice→cheerio 的传递依赖。 |
| **SP08**（S2，缓存缺失静默降级） | **已关闭** | cache 未命中 -> `needs_human_check:true` + `cacheMissingIds` + digest 降级提示。 |
| **SP09**（S2，长法规分段） | **已关闭** | 全部分段参与数字/引文提取；第 2 段起可命中，`999` 进入 `numbers_and_dates`。 |
| **SP10**（S3，AIHOT 字段/降噪） | **已关闭** | `score`/`signalCount`/`latestAt`/`source.name` 映射；AIHOT 回溯项过 `evaluateLegalRelevance`。 |
| **SP11**（S3，域名/URL） | **部分关闭** | RSS `finalUrl` 已校验；`normalizeCandidateUrl` 仍强制 http→https，Layer 2 仍无 `expected_domain`。 |

**小结**：R1 的 19 项中 **10 项完全关闭、9 项部分关闭/未关闭**；R2 剩余 **1×S1、3×S2、8×S3**。

---

## 二、剩余问题清单

### 2.1 Standards 轴

| 编号 | 级别 | 位置 | 问题与依据 | 建议 |
|---|---|---|---|---|
| **R2-ST01** | **S1 阻断** | `THIRD_PARTY_NOTICES.md:243,274`；`git diff 3f8fd49...HEAD` | 本轮明确要求“相对 origin/main 严格零删行”，实测 `git diff --numstat` 为 **101 加法 / 2 删除**。juice 与 ajv-formats 的 MIT 文本被改为 “merge, publish, and distribute...”，与 `node_modules/juice/LICENSE.md`、`node_modules/ajv-formats/LICENSE` 不一致。4 个新增包全文已逐字匹配，但既有两条被改写，零删行不成立。 | 从 `origin/main` 恢复 juice/ajv 两段逐字文本，仅追加第 15–18 项与 `### 7.`–`### 10.`；重跑 `git diff --numstat` 必须为 `N 0`；脚本逐字比对 `node_modules/{juice,ajv,ajv-formats}` 许可文件。 |
| **R2-ST02** | S2 重要 | `src/collectors/shared/http.mjs:1`；`package.json` | `import { EnvHttpProxyAgent } from "undici"`，但 `package.json` 无 `undici`；`npm ls undici` 显示仅经 `juice@12.2.6 -> cheerio@1.2.0 -> undici@7.30.2` 传递安装。当前 `npm ci` 可用，但 juice/cheerio 升级或依赖树变化即断；#38 只授权四个新增直接依赖，`undici` 未登记/未授权。 | 将 `undici` 作为直接依赖写入 `package.json` 并取得 Human 授权、登记 notices；或改用 Node 内置代理能力/不依赖未声明包。 |
| R2-ST03 | S3 建议 | `src/collectors/shared/extractor.mjs:44-55` | `stripHtmlToPlainText` 只要出现 `<`/`>` 就按 HTML 解析，纯文本比较符会被吞：实测 `"3 < 5 且 7 > 2"` -> `"3 2"`；法律金额/区间/不等式文本可能被截断。 | 仅在检测到真实标签时解析；否则原样保留；对 `<`、`>`、`&lt;` 加回归测试。 |
| R2-ST04 | S3 建议 | `src/pipeline/daily.mjs:42-49` | `daily` 只在 `errors.length >= 2 && itemCount === 0` 时置 1；两个 collector 都返回 `meta.status="failed"` 但不抛异常时，`errors` 为空，退出 0。临时 CLI 实测：CN/Global 均 `failed`、`stage_errors=0`、exit 0。 | 检查 `results.cn.meta.status` 与 `results.global.meta.status`；两者均 `failed` 或总候选为 0 时置非零。 |
| R2-ST05 | S3 建议 | `package.json:13`；`src/contracts/validate.mjs:292-296` | `validate:contracts` 仍只跑 `--check-cache`；`candidate-item` CLI 直接传 `global.json` 数组仍报 `must be object`，无法单命令批量校验当日公开产出。 | 增加 `--batch candidate-item <file>` / `--all data/...`；`validate:contracts` 遍历 candidates/bundles/topic-pool。 |
| R2-ST06 | S3 建议 | PR #58 正文；Owner 评论 | PR 正文仍写“25/25 通过”“零删行”“锁文件 4a5f168”，与 R2 实测 30/30、2 删行、HEAD `a5a3b28` 不一致；Owner 评论虽写 30/30，但正文未同步。 | 更新 PR 正文的测试数、HEAD、deletions 与依赖 commit；附本次 R2 命令证据。 |

### 2.2 Spec 轴

| 编号 | 级别 | 位置 | 问题与依据 | 建议 |
|---|---|---|---|---|
| **R2-SP01** | S2 重要 | `src/collectors/shared/extractor.mjs:98-110`；`adapters-l1.mjs:196,340` | 无时区 meta 时间 `2026-11-20T00:00:00` 经 `new Date(...).toISOString()` 变为 `2026-11-19T16:00:00Z`（Asia/Shanghai 解释），候选发布日期提前一天。测试只用纯日期 `2026-11-20`，未覆盖。 | 无时区日期时间按“本地日历日期”保留 `YYYY-MM-DD`，或统一按 Asia/Shanghai 解析后再格式化；补两种输入测试。 |
| **R2-SP02** | S2 重要 | `src/pipeline/merge-and-curate/dedup.mjs:72-112` | `extractEntityTokens` 只提取拉丁字母 token；纯中文标题没有实体 token。实测“欧盟人工智能法案通用人工智能行为准则最终版”与“EU AI Act GPAI Code of Practice Final Guidance” -> 2 个 cluster，global 优先不生效。Issue #41 要求同事件优先保留 global 一手原链。 | 增加中文实体/别名词典或标题翻译/嵌入匹配；至少对“同一日期 + 同一法规名”做跨语种别名；补“纯中文 vs 纯英文同事件应合并”正向测试。 |
| R2-SP03 | S3 建议 | `src/collectors/shared/adapters-l1.mjs:23-33,196` | 无日期时仍把 `published_at` 填成采集时间（`2026-11-27T08:00:00Z`），仅加 `published_date_inferred`/`unverified`/`needs_human_check`。字段语义仍是“发布日期”，下游若只看 `published_at` 会误读。 | 无日期时不要用采集时间填充 `published_at`；可改 schema/字段语义，或写 `null`/明确 `published_at_source: "collected_at"`。 |
| R2-SP04 | S3 建议 | `src/collectors/shared/adapters-l1.mjs:246-260` | R1 的 `.aihot-etags.json` 存字符串 etag；R2 期望 `{etag,payload}` 对象。旧缓存命中 304 时无 `cachedEntry.payload` -> 0 条；实测旧字符串缓存 304 返回 0。 | 读取旧格式时迁移为 `{etag, payload:null}`，并在 304 无 payload 时回退 200 请求；或清理旧缓存并文档说明。 |
| R2-SP05 | S3 建议 | `src/collectors/shared/url-and-domain.mjs:51-53`；`adapters-ext.mjs:101-121` | `normalizeCandidateUrl` 仍强制 http→https，改变一手链接且 http-only 站点可能抓取失败；Layer 2 仍从任意 `WE_MP_RSS_FEEDS_JSON` URL 读取，无 `expected_domain`/`mp.weixin.qq.com` 限制。 | 保留原始 URL 或先探测 https 可达；Layer 2 增加域名白名单/映射，非法域名 degraded。 |
| R2-SP06 | S3 建议 | `src/collectors/shared/collector-runner.mjs:90-95` | `academic_paper`（arXiv 预印本、Stanford HAI news）仍映射 `official_data` + `unverified:false`；GLOSSARY 的“官方数据”不应等同预印本/研究观点。实测 arXiv 夹具 `fact_tier:"official_data"`。 | 预印本/研究新闻默认 `market_opinion`，或明确 `confirmed_fact` 的条件（同行评议/官方发布）；加来源类型测试。 |

---

## 三、实测命令与证据

在干净 worktree `/tmp/lexai-audit/r2`（`HEAD a5a3b28`，`origin/main 3f8fd49`）执行：

| 命令 / 场景 | 结果 |
|---|---|
| `npm ci` | `added 71 packages in 675ms`；仅 `whatwg-encoding@3.1.1` deprecated。 |
| `npm test` | `# tests 30`、`# pass 30`、`# fail 0`、`duration_ms 374.5`；含 4 个 wechat 测试。 |
| `npm run validate:contracts` | `{"valid": true, "trackedFiles": [], "errors": []}`，exit 0。 |
| `npm audit --registry=https://registry.npmjs.org` | `found 0 vulnerabilities`，exit 0。 |
| `grep -c registry.npmmirror.com package-lock.json` | `0`；71 个 `resolved` 全部 `registry.npmjs.org`。 |
| `git diff --numstat 3f8fd49...HEAD -- THIRD_PARTY_NOTICES.md` | `101	2`；2 行删除对应 juice/ajv-formats MIT 文本。 |
| 4 个新增依赖 LICENSE 逐字检查 | readability/linkedom/normalize-url/rss-parser 均 `true`；juice/ajv/ajv-formats 为 `false`。 |
| `npm ls undici --all` | `juice@12.2.6 -> cheerio@1.2.0 -> undici@7.30.2`；`package.json` 无 `undici`。 |
| `gh pr checks 58` | `no checks reported on the 'gemini/ld-g2-03-dual-collect-pipeline' branch`；无 `.github/workflows`。 |
| 对抗性：HTML/script 全链路 | candidate `summary` 纯文本，`/<[^>]+>\|alert\(1\)/` = false。 |
| 对抗性：MONID `abc` | `calls:0`，`items:0`（fail closed）。 |
| 对抗性：AIHOT `score`/304 | `score:86` -> `heat_score:86`；新格式 304 复用 -> 1 条；旧字符串缓存 304 -> 0 条。 |
| 对抗性：无空格中文长法规 | 8 条 -> 4 段；`locators` 含 `核心条款段 2`；`numbers_and_dates` 含 `999`。 |
| 对抗性：跨语种去重 | 无关负例 -> 2 cluster（不误合并）；纯中文 vs 纯英文同事件 -> 2 cluster（漏合并）。 |
| 对抗性：无时区日期 | `2026-11-20T00:00:00` -> `2026-11-19T16:00:00.000Z`。 |
| 对抗性：纯文本比较符 | `"3 < 5 且 7 > 2"` -> `"3 2"`。 |
| 临时 CLI：两个 collector 均失败 | `[daily] ... curated_items=0 stage_errors=0`，exit 0；两份 meta 均 `failed`。 |
| `validate.mjs candidate-item global.json` | `valid:false`，`must be object`。 |
| `git diff --check 3f8fd49...HEAD` | 无输出，exit 0。 |
| 密钥扫描 | 无实际 key；仅 env 变量名与 docs 示例。 |

### 红线核验

- **命令与 commit 对应**：本地命令均在 `a5a3b28`；CI 未触发，未写成通过。
- **许可**：71 包均宽松许可；4 个新增依赖全文逐字匹配；但既有 2 行被改写、零删行失败（R2-ST01）。
- **供应链**：lock 全 npmjs，`npm ci`/`npm audit` 通过；`undici` 未声明（R2-ST02）。
- **缓存/密钥**：`.cache/raw` 仅本地；无 `.env`/`.local`/key 入库；`validate:contracts` 零追踪。
- **AI 初稿标注**：E2E 夹具 `practice_impact_is_ai_draft:true`、`detail_analysis.ai_draft:true`、`headline:false`；无变更。
- **AIHOT 条款**：公开规则 v1.1 仍要求对外商业产品/收费/公开镜像事先书面授权；白名单 `compliance_redline` 已记录 Gate 3/4 前置；本 PR 未新增授权证据，对外发布前需 Human 确认。
- **冻结基线**：`README.md`、`ROADMAP.md`、`AGENTS.md`、`GLOSSARY.md`、`schemas/`、`data/sources/`、`docs/adr/` 未被本 PR 修改。

---

## 四、建议结论

- **单行汇总**：R1 19 项中 10 项完全关闭、9 项部分关闭/未关闭；R2 剩余 **1×S1、3×S2、8×S3**。
- **结论**：**需修改（CHANGES_REQUESTED）**。
- **理由**：R2 的 S1 直接违反本轮“`THIRD_PARTY_NOTICES.md` 相对 origin/main 严格零删行”的硬门禁——实测 2 行删除且 juice/ajv-formats 的 MIT 文本被改写；同时存在 3 项 S2：`undici` 是未声明的传递依赖（供应链）、无时区发布日期提前一天（事实日期）、纯中文/纯英文同一事件未合并（global 优先失效）。
- **R3 复测建议**：notices `0` 删除且既有 MIT 文本逐字一致；`undici` 声明/授权；无时区日期；纯中文/英文同事件合并；旧 etag 缓存；`daily` 失败退出码；`validate` 批量入口。
- **状态**：未修改代码、未合并 PR、未 push；本报告只构成证据，不自动产生合并权限。

本意见只构成证据，不自动产生权限；合并与最终决定属于 Human Maintainer。
