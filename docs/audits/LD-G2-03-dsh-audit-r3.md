# 复核与审计报告｜LD-G2-03（R3 增量复核）

- **类型**：独立审计（R3 增量复核）
- **出具者**：DeepSeek Harness｜**日期**：2026-11-27
- **审计对象**：[PR #58](https://github.com/fitalex/LexAIDaily/pull/58)｜**Issue**：[#41](https://github.com/fitalex/LexAIDaily/issues/41)
- **基准**：`origin/main@3f8fd49b30e87b0abf13368cd722dbf17208f152`
- **R2 已审 HEAD**：`a5a3b28a78d9ee83082e0bdc2301dca8ff521274`
- **R3 待审 HEAD**：`82f4d2fda937d50a9623c054d8c07c26ec1fe526`
- **结论**：**需修改（CHANGES_REQUESTED）**
- **归档草稿**：[docs/audits/LD-G2-03-dsh-audit-r3.md](docs/audits/LD-G2-03-dsh-audit-r3.md)（未 commit/push），Git blob SHA：`d028b4765f0faab8c7a863e9ac7f2a94215e6db6`

## 一、R2 发现逐项关闭核验

| R2 编号 | R3 状态 | 核验证据 |
|---|---|---|
| **R2-ST01**（S1，notices 零删行/逐字许可） | **未关闭** | `git diff --numstat 3f8fd49...HEAD -- THIRD_PARTY_NOTICES.md` = `98 0`，零删行已达成；4 个新增包 LICENSE 全文逐字匹配；但 juice/ajv/ajv-formats 三块仍非逐字一致（见 R3-ST01）。 |
| R2-ST02（S2，undici 未声明） | **已关闭** | `grep -rn undici src/` = 0；`package.json` 无 `undici`；4 个新增直接依赖不变；`npm ci` 成功 71 包、`npm audit` 0；71 个 `resolved` 全部 npmjs。 |
| R2-SP01（S2，无时区日期提前一天） | **已关闭** | `parseDateToken("2026-11-20T00:00:00")` -> `2026-11-20`；`extractPublishedDateFromHtml` 同样返回 `2026-11-20`。 |
| R2-SP02（S2，纯中文/英文同事件） | **部分关闭** | 单次调用可合并为 1 cluster 且 global 胜出；但 `/g` 正则的 `lastIndex` 状态污染使同一输入第二次调用变为 2 cluster（见 R3-SP01）。 |
| R2-ST03（S3，纯文本比较符被吞） | **已关闭** | `stripHtmlToPlainText("3 < 5 且 7 > 2")` -> `3 < 5 且 7 > 2`；`&lt;100万元&gt;` -> `<100万元>`。 |
| R2-ST04（S3，daily 双轨失败退出码） | **已关闭** | 临时 CLI：CN/Global 均 `failed`、`stage_errors=0`，`status=failed`，exit 1。 |
| R2-ST05（S3，validate 数组/批量） | **已关闭** | `validatePayloadOrArray("candidate-item", [])` 有效；`--batch` 通过；`validate:contracts` 已切 `--all`，返回 `filesChecked:0`（干净检出无 data 文件）。 |
| R2-ST06（S3，PR 正文同步） | **已关闭** | PR 正文已更新为 HEAD `82f4d2f`、31/31、98/0；Owner 评论与实测一致。 |
| R2-SP03（S3，无日期回退） | **部分关闭** | 已加 `unverified_reason`，但 fallback 仍取 `nowIso.slice(0,10)`（UTC 日期），Asia/Shanghai 凌晨会落到前一天（见 R3-SP02）。 |
| R2-SP04（S3，旧字符串 etag 缓存） | **已关闭** | 旧字符串 etag 自动迁移；实测旧缓存场景 1 条，未再丢 304。 |
| R2-SP05（S3，force-https/Layer 2 域名） | **已关闭** | `preserveHttp:true` 保留抓取协议；Layer 2 默认 `mp.weixin.qq.com`，越域条目 0 条、`degraded`。 |
| R2-SP06（S3，academic_paper 事实层级） | **已关闭** | `academic_paper` -> `market_opinion` + `unverified:true`；回归测试通过。 |

**小结**：R2 的 12 项中 **9 项完全关闭、3 项部分关闭**；R3 剩余 **1×S1、1×S2、2×S3**。

## 二、DoD 逐项核对

| 序号 | 标准 | 结果 | 证据 |
|---|---|---|---|
| D01 | 四个入口可独立运行，产出 100% 通过 #39 Schema | 部分达成 | 31/31 测试与模块级 E2E 通过；未跑真实公网 CLI。 |
| D02 | 离线单测覆盖 TTL、去重、AIHOT、忠实度、零全文 | 达成（有去重状态缺口） | 31/31；新增比较符、naive datetime、纯 CN/EN 去重、旧 etag、L2 域名、academic_paper、数组校验测试；但去重存在状态泄漏。 |
| D03 | 依赖锁版本、notices、无密钥 | 部分达成 | lock 全 npmjs、`npm ci`/`npm audit` 通过、src 零 undici；但现有 juice/ajv/ajv-formats 许可块非逐字一致。 |
| D04 | `.cache/raw/` 7 天 TTL；`.gitignore`；零追踪 | 达成 | TTL 测试；`validate:contracts --all` `trackedFiles:[]`。 |
| D05 | AIHOT 严格 discovery_only、gzip、ETag/304 | 达成 | score/304/旧缓存/L2 域名均通过；live gzip/304 已在 R2 核验。 |
| D06 | Layer 2 只读降级；Layer 3 硬熔断 | 达成 | 401/403 degraded、非法 source_id 跳过、abc 熔断 0 调用。 |
| D07 | Stage 2 标注、忠实度、长法规入池 | 部分达成 | 标注/忠实度/长法规通过；无日期 fallback 仍为 UTC 日期。 |
| D08 | 命令/CI 对应 commit，未执行如实 | 达成（本地）/CI 未触发 | 本地命令在 `82f4d2f`；`gh pr checks 58` 无检查项。 |

## 三、剩余问题清单

### 3.1 Standards 轴

| 编号 | 级别 | 位置 | 问题与依据 | 建议 |
|---|---|---|---|---|
| **R3-ST01** | **S1 阻断** | `THIRD_PARTY_NOTICES.md:236-260`（juice）、`:266-289`（ajv/ajv-formats） | 零删行已达成（98/0），4 个新增包全文逐字匹配；但 `juice` 块以 `MIT License` 开头，安装包为 `# MIT License`；`ajv` 块加了 `(ajv)` 和 `Copyright (c) 2020 ... (ajv-formats)`；`ajv-formats` 块以 `The MIT License (MIT)` 开头，安装包为 `MIT License`。三块均非逐字一致，直接违反本轮“juice/ajv/ajv-formats 及 4 个新增包 LICENSE 全文均与 node_modules 逐字一致”的硬门禁。 | 将 juice、ajv、ajv-formats 拆为三个独立 `###` 块，逐字复制各自 `node_modules/*/LICENSE`（含 `#`、不加 `(ajv)` 等注释）；用脚本验证 7 个包全部 `includes(exact) === true`。 |
| R3-ST02 | S3 建议 | `src/collectors/shared/http.mjs:98-116`、`:196-202` | 新内置代理的 HTTP 路径不跟随重定向：本地代理返回 302 时 `fetchWithRetry` 得到 `status:302, ok:false`；原生 fetch 路径使用 `redirect:"follow"`。带代理的 global 源若 301/302（http→https、canonical）会直接失败。 | 在代理路径实现最多 N 次重定向，或明确不支持并在状态/文档中标注；补本地代理 302 测试。 |

### 3.2 Spec 轴

| 编号 | 级别 | 位置 | 问题与原需求引用 | 建议 |
|---|---|---|---|---|
| **R3-SP01** | S2 重要 | `src/pipeline/merge-and-curate/dedup.mjs:56-77`、`:108-126`、`:139-158` | `BILINGUAL_ENTITY_ALIASES` 的 patterns 全部带 `/g`；`patterns.some((re) => re.test(src))` 推进 `lastIndex`。实测 `extractEntityTokens("欧盟人工智能法案通用人工智能行为准则")` 连续调用返回 `[4, 0, 4]`；同一输入 `deduplicateCrossTrack([pureCn, pureEn])` 新进程连续调用返回 `1, 2`（首次合并、第二次不合并）。测试 8 只调用一次且受前序测试状态影响，不能证明确定性；跨轨去重/global 优先在多批次或多簇时不稳定。 | 在 `re.test(src)` 前重置 `re.lastIndex = 0`，或移除 patterns 的 `/g`；测试重复调用同一输入并断言结果一致，覆盖多个 CN/EN 簇。 |
| R3-SP02 | S3 建议 | `src/collectors/shared/adapters-l1.mjs:29-37`；`src/collectors/shared/extractor.mjs:98-110` | `normalizePublishedAt` 注释称“falls back to local calendar date”，实际用 `fallbackIso.slice(0,10)`（UTC）。`TZ=Asia/Shanghai` 下 `nowIso=2026-11-26T18:30:00Z` 得到 `2026-11-26`，本地日期为 `2026-11-27`；无日期候选的 `published_at` 仍可能早一天。另 `parseDateToken("2026-11-20T00:00:00+08:00")` 返回 `2026-11-19T16:00:00Z`，按 UTC 显示会落到 19 日。 | 用 `getLocalDateString(fallbackIso, TZ)` 生成 fallback；对带偏移日期先按目标时区取日历日期；补 Asia/Shanghai 凌晨用例。 |

## 四、实测命令与证据

在干净 worktree `/tmp/lexai-audit/r3`（`HEAD 82f4d2f`，`origin/main 3f8fd49`）执行：

| 命令 / 场景 | 结果 |
|---|---|
| `npm ci` | `added 71 packages in 723ms`；仅 `whatwg-encoding@3.1.1` deprecated。 |
| `TZ=Asia/Shanghai npm test` | `# tests 31`、`# pass 31`、`# fail 0`、`duration_ms 362.8`。 |
| `npm run validate:contracts` | `{"valid":true,"trackedFiles":[],"filesChecked":0,"errors":[]}`，exit 0。 |
| `npm audit --registry=https://registry.npmjs.org` | `found 0 vulnerabilities`，exit 0。 |
| `grep -c registry.npmmirror.com package-lock.json` | `0`；71 个 `resolved` 全部 `registry.npmjs.org`。 |
| `grep -rn undici src/` | `0`；`package.json` 无 `undici`；`npm ls` 中 `undici` 仅为 juice→cheerio 传递依赖。 |
| `git diff --numstat 3f8fd49...HEAD -- THIRD_PARTY_NOTICES.md` | `98	0`（严格零删行）。 |
| 许可逐字检查 | readability/linkedom/normalize-url/rss-parser = `true`；juice/ajv/ajv-formats = `false`。 |
| `gh pr checks 58` | `no checks reported on the 'gemini/ld-g2-03-dual-collect-pipeline' branch`；无 `.github/workflows`。 |
| 对抗性：纯文本比较符 | `"3 < 5 且 7 > 2"` 原样保留；`&lt;100万元&gt;` -> `<100万元>`。 |
| 对抗性：naive datetime | `2026-11-20T00:00:00` -> `2026-11-20`。 |
| 对抗性：无日期 fallback | `TZ=Asia/Shanghai`、`2026-11-26T18:30:00Z` -> `2026-11-26`（本地日期 `2026-11-27`）。 |
| 对抗性：去重状态 | token 连续调用 `[4,0,4]`；同一 CN/EN 输入连续 `deduplicateCrossTrack` -> `1, 2`；无关“AI+2026” -> 2 cluster。 |
| 对抗性：旧字符串 etag | 旧 `.aihot-etags.json` 场景 -> 1 条、未丢 304。 |
| 对抗性：Layer 2 域名 | 外域 `evil.example.net` -> 0 条、`degraded`。 |
| 对抗性：daily 双轨失败 | `[daily] status=failed`，exit 1；两份 meta 均 `failed`。 |
| `validate --batch candidate-item` 空数组 | `valid:true`、`count:0`。 |
| 对抗性：代理 | 本地 HTTP 代理 200 -> `ok:true`；302 -> `status:302, ok:false`（未跟随）。 |
| `git diff --check 3f8fd49...HEAD` | 无输出，exit 0。 |
| 密钥扫描 | 无实际 key；仅 env 变量名与 docs 示例。 |

### 红线核验

- **命令与 commit 对应**：本地命令在 `82f4d2f`；CI 未触发，未写成通过。
- **许可**：71 包均宽松许可；4 个新增依赖全文逐字匹配；但 juice/ajv/ajv-formats 三块非逐字（R3-ST01）；零删行已达成。
- **供应链**：src 零 undici；package.json 无 undici；lock 全 npmjs；`npm ci`/`npm audit` 通过。
- **缓存/密钥**：`.cache/raw` 仅本地；无 `.env`/`.local`/key 入库；`validate:contracts` 零追踪。
- **AI 初稿标注**：E2E 夹具 `practice_impact_is_ai_draft:true`、`detail_analysis.ai_draft:true`、`headline:false`；无变更。
- **AIHOT 条款**：公开规则 v1.1 仍要求对外商业产品/收费/公开镜像事先书面授权；白名单 `compliance_redline` 已记录 Gate 3/4 前置；本 PR 未新增授权证据，对外发布前需 Human 确认。
- **冻结基线**：`README.md`、`ROADMAP.md`、`AGENTS.md`、`GLOSSARY.md`、`schemas/`、`data/sources/`、`docs/adr/` 未被本 PR 修改。

## 五、建议结论

- **单行汇总**：R2 的 12 项中 9 项完全关闭、3 项部分关闭；R3 剩余 **1×S1、1×S2、2×S3**。
- **结论**：**需修改（CHANGES_REQUESTED）**。
- **理由**：R3 已达成 98/0 零删行、src 零 undici、31/31、数组校验、daily 失败退出、旧 etag 回退、Layer 2 域名、academic_paper 等整改；但 **R3-ST01** 仍不满足“juice/ajv/ajv-formats 与 node_modules 逐字一致”的 S1 硬门禁（三块均非逐字），且 **R3-SP01** 的 `/g` 正则状态污染使跨语种同事件去重在重复调用时失效（S2）。
- **R4 复测建议**：三块既有许可逐字一致（7/7 true）；重复调用去重结果稳定（1/1）；`TZ=Asia/Shanghai` 凌晨无日期候选落本地日；代理 302 跟随或明确不支持；HTTPS CONNECT 实测。
- **状态**：未修改代码、未合并 PR、未 push；本报告只构成证据，不自动产生合并权限。

本意见只构成证据，不自动产生权限；合并与最终决定属于 Human Maintainer。
