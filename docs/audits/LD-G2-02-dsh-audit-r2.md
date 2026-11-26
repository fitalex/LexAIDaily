# 复核与审计报告｜LD-G2-02（R2 增量复审）

- 类型：独立审计（R2 增量复审，`AGENTS.md` 6.1(b)(d)(e)、6.2）
- 出具者：DeepSeek Harness｜日期：2026-11-26
- 审计对象：[PR #48](https://github.com/fitalex/LexAIDaily/pull/48)（`gemini/ld-g2-02-source-whitelist`）｜关联 Issue：[#40](https://github.com/fitalex/LexAIDaily/issues/40)｜基准 commit：`21d24da`（`main`）｜被审 head：`ec8c0c339b5d2e1eea88c5157894d2a885047fc8`
- R1 报告：[LD-G2-02-dsh-audit-r1.md](https://github.com/fitalex/LexAIDaily/blob/06158c11769d0ea84cf0caaa4a56c9fd4f841d00/docs/audits/LD-G2-02-dsh-audit-r1.md)（blob `2522ac589a7ffb419f0a27737c6a1d7f0f54aadb`，结论“需修改”）
- 检查范围：`df5c32a..ec8c0c3` 全部 6 个变更文件（+346/−181）；双轨共 26 条源（12 CN + 14 Global）、准入标准、共享校验器 `src/sources/validate-whitelist.mjs`、5 项测试、notices 对 `main` 的增量。本地复跑 `npm ci`、`node --test`、`npm audit --registry=https://registry.npmjs.org`；对 26 条入口逐条做 HTTP/主机名核验；对新增的 NPC、NCSL 与改用的 CourtListener Atom 入口做内容级核验；检查 js-yaml 许可链接与 tag。
- 未检查项：未判定各信源可信度、编辑质量或是否应入库（`AGENTS.md` 明确由 Human 决定）；未实现或运行采集器，未验证 NPC/NCSL 的表单/API/JS 适配器；未确认 NPC 搜索接口或 NCSL 检索是否触发验证码（页面存在相关脚本，见 §四）；未验证大陆/海外另一个网络出口；未执行 #47+#48 的实际 rebase/合并（PR 正文已写明步骤）；未验证 Gate 3 Web/公众号消费端；未逐份阅读 45 个锁文件依赖的 LICENSE 原文。

## 一、DoD 逐项核对

| 序号 | 标准（Issue #40） | 结果 | 证据 |
|---|---|---|---|
| D01 | 两份 YAML 覆盖五大内容分类与五类权威信源主体，均不含二手搬运号或需登录/强验证码站点 | 无法判断 | 26 条源（12 CN + 14 Global）；五类主体与五维分类全覆盖；CourtListener 已改公开 Atom，NPC/NCSL 页面免登录可达；验证码风险见 §四/R2-SP04，未发现需登录站点 |
| D02 | `aihot.news/api/v1` 明确标为 `discovery_only: true` 并载明“仅取 `links.original` 回溯一手原链”的合规红线 | 达成 | YAML `aihot-news-discovery`；`compliance_redline` 同时写入 Gate 3/4 书面许可前置门禁；测试断言 `links.original` 与“书面许可” |
| D03 | 每条白名单信源均附实测可访问的一手入口 URL、`expected_domain` 与抓取模式标识，经 DSH 独立审计后交 Human 批准 | 未达成 | 26/26 入口 HTTP 可达；但 `cn-npc-flk` 与 `us-ncsl-ai-legislation` 的 `fetch_mode: static_html` 与实际页面（SPA/交互式检索库）不匹配，无法按声明模式产出条目；本轮审计为“需修改” |

## 二、R1 整改进度（S1/S2 逐项）

| R1 编号 | R1 级别 | R2 状态 | 证据 |
|---|---|---|---|
| ST01 | S1 | **已修复** | notices 对 `main@21d24da` 零删行；shadcn MIT 全文恢复；js-yaml 许可行/全文已增量登记（链接问题见 R2-ST03） |
| ST02 | S2 | **已修复** | CourtListener 改为 `https://www.courtlistener.com/feed/search/?q=AI`、`fetch_mode: atom`；实测 200 `application/atom+xml`；不再使用需认证 REST |
| ST03 | S2 | **已修复** | CourtListener 定级 `T2`、`high_risk_default: true`；标准 §2 明确“非营利公开法院文书/州法聚合平台 T2 + 涉裁判/立法时 high_risk true”例外 |
| ST04 | S2 | **已修复** | 标准 §4 与 YAML 写入 AIHOT“Gate 3/4 商业化须事先取得书面许可，取得前仅限内部试运行” |
| SP01 | S1 | **已修复** | CourtListener 检索 API 401/403 问题消除；Atom 入口匿名可读，DoD 的“免登录”在页面/订阅源层面成立 |
| SP02 | S2 | **部分** | 已补 `cn-npc-flk` 与 `us-ncsl-ai-legislation`；但两者 `static_html` 与 SPA/交互式数据库不匹配，见 R2-ST01、R2-ST02、R2-SP01 |
| SP03 | S2 | **部分** | `academic_paper` 口径已改为“预印本、高校研究机构与顶会/核心期刊”，并写明顶会/期刊入口由 Human 后续审定；具体入口仍未补，作为 Human 决策项保留 |
| SP04 | S2 | **已修复** | CourtListener 的 `verification_note` 已写清“Atom 订阅源、弃用需鉴权 REST”，不再把帮助页当采集端点 |

## 三、双轴发现（R2 新增/残留）

### 3.1 Standards 轴（仓库规范违背 & Fowler 代码坏味道基线）

| 编号 | 级别 | 类型 | 位置 | 问题与依据 | 建议 |
|---|---|---|---|---|---|
| R2-ST01 | S2 重要 | 规范违背（抓取模式与入口不一致） | `data/sources/whitelist-cn.yaml:6-23`（`cn-npc-flk`） | `fetch_mode: static_html`，入口 `https://flk.npc.gov.cn/`；实测响应仅 552 bytes，`<div id="app"></div>` + 单一 module script，正文由 JS 渲染。`static_html` 无法取得法律法规条目。站点确有公开 JSON 端点（`/law-search/index/aggregateData` 200），但当前配置未使用。 | 改为经核验的公开 `json_api`（含正确查询参数、确认无验证码/鉴权），或增加 JS 渲染适配器并更新 fetch_mode 枚举；两者都不成立时把该源标 `paused`/移除，勿以 `static_html` 声明可采集。 |
| R2-ST02 | S2 重要 | 规范违背（抓取模式与入口不一致） | `data/sources/whitelist-global.yaml:24-40`（`us-ncsl-ai-legislation`） | `fetch_mode: static_html`，入口是 NCSL 交互式检索库；实测页面 200、106 KB，但两张 `<table>` 都是 Topics/States 复选框，正文只有“Bill Number”等筛选输入与 Search 按钮，没有法案行；实际结果需提交表单/JS 加载。`static_html` GET 无法产出条目。 | 改用可按年抓取的静态汇总页（2025 年页实测 200；2026 年页 404），或为数据库增加 POST/JS 适配器并明确参数；在此之前不得声明该源可静态采集。 |
| R2-ST03 | S3 建议 | 规范违背（许可证据链接错误） | `THIRD_PARTY_NOTICES.md:17,257` | js-yaml 许可链接指向 `https://github.com/nodeca/js-yaml/blob/v5.5.0/LICENSE`，实测 **404**；该仓库 tag 名为 `5.5.0`（无 `v`），`https://github.com/nodeca/js-yaml/blob/5.5.0/LICENSE` 为 200。 | 把两处链接改为 `5.5.0` tag（或对应 commit）；重新核对许可证据。 |
| R2-ST04 | S3 建议 | 规范违背（分级规则未完全机器化） | `src/sources/validate-whitelist.mjs:124` | 校验器只强制 `T1 ⇒ high_risk_default: true`；标准 §2 还要求“涉法院文书/立法聚合的 T2 源置为 true”，当前 CourtListener/NCSL 手工为 true，但未来 T2 court/legislation 源设 false 仍会通过。 | 加 `T2 ∧ source_type ∈ {court_judiciary, legislation_regulator} ⇒ high_risk_default: true`（或显式例外表），并补负例。 |
| R2-ST05 | S3 建议 | 规范违背（入口不是更新源） | `data/sources/whitelist-global.yaml:78` | R1 ST05 仍未处理：`eu-eur-lex-ai-act` 仍是单一法规文本页（`/eli/reg/2024/1689/oj/eng`），不是新法规/修订索引或 feed；`static_html` 每天抓同一页不会产生新条目。`eu-ai-office` 也以政策介绍为主。 | 改为 EUR-Lex 立法更新/新闻索引或官方 RSS，单一法规页降为参考文档；`eu-ai-office` 改为新闻/公告索引。 |
| R2-ST06 | S3 建议 | 规范违背（并行合并） | `package.json`、`package-lock.json`、`THIRD_PARTY_NOTICES.md` | 与 #47 同时改同一文件；PR 正文已给出“先合 #47 → rebase → `npm install` → js-yaml 重编号 14/###6”的正确步骤，但本轮未执行，合并时仍会有冲突。 | 合并时严格按 PR 正文执行并复跑两套测试；不要把“步骤已写明”当成“合并已验证”。 |

### 3.2 Spec 轴（原 Issue/任务书遗漏、偏差与范围蔓延）

| 编号 | 级别 | 类型 | 位置 | 问题与原需求引用 | 建议 |
|---|---|---|---|---|---|
| R2-SP01 | S2 重要 | 偏差（DoD 的“可采集”未成立） | `data/sources/whitelist-cn.yaml:6-23`；`data/sources/whitelist-global.yaml:24-40` | Issue #40 要求每条源标注抓取方式并“经实测可访问核验”；R2 新增的 NPC/NCSL 只验证了页面 HTTP 200，没有验证按 `static_html` 能产出条目。DoD D03 的“可采集”在这两条上未成立。 | 先做端点级验证（GET 是否返回条目/列表，或 POST/JS 适配器是否可用），再写 `verification_note`；不能只写“页面 200”。 |
| R2-SP02 | S3 建议 | 遗漏（学术类入口） | 标准 §1；两份 YAML | R1 SP03 的“顶会/核心期刊入口”仍未补；标准改为“预印本、高校研究机构与顶会/核心期刊”，并写明由 Human 后续审定。属于口径调整而非入口补齐。 | 由 Human 指定具体顶会/期刊（如 ICAIL/FAccT/JOLT）后补入；若不补，标准已披露范围，可接受但不应当作已完成。 |
| R2-SP03 | S3 建议 | 偏差（NCSL 静态替代入口） | NCSL 页面 | `https://www.ncsl.org/technology-and-communication/artificial-intelligence-2026-legislation` 实测 404；2025 年静态页 200、约 1 MB。当前数据库页没有静态法案行。 | 若走静态路线，需确认可用年度页（可能滞后）并调整入口；若走数据库，需 POST/API 适配器。两者都需 Human 确认数据时效。 |
| R2-SP04 | S3 建议 | 未排除风险（验证码） | `cn-npc-flk` JS；NCSL 页面 | NPC SPA JS 存在 `/law-search/index/captchaImage` 调用；NCSL 页面加载 reCAPTCHA 脚本（可能用于其它表单）。本轮未能确认普通检索是否触发验证码；若触发，则违反 Issue #40“无强验证码”的一票否决项。 | 在采集端点级验证：无验证码/无鉴权才可保留；若触发，按红线降级/移除，或由 Human 走 B 级例外。 |
| R2-SP05 | S3 建议 | 遗漏（失效降级不可实现） | 标准 §5；#47 `collect-meta` | R1 SP06 仍未处理：`collect-meta` 没有连续失败计数/最近错误时间/状态迁移字段，标准“连续 3 次降级、7 天 paused”无法从单次 `source_results` 实现。 | 在 `collect-meta` 增加 `failure_streak` / `last_error_at` / `previous_status`，或明确状态机由外部存储维护。 |

## 四、证据与红线核验

- **命令与 commit 对应**：是。所有命令在 `pr48r2` worktree 的 `ec8c0c3` 上执行；`npm ci` 安装 45 个包；`node --test tests/sources/*.test.mjs` 为 5 pass / 0 fail；`npm audit --registry=https://registry.npmjs.org` 为 0 vulnerabilities。
- **26 条入口可达性**：26/26 最终可访问；24 条直接 200，`cn-moj-bmgz` 为 302 + Cookie 挑战（带 cookie jar 后 200），`eu-eur-lex` 为 202 异步响应。`expected_domain` 与入口主机名全部一致，协议全部为 `https`。
- **CourtListener**：`https://www.courtlistener.com/feed/search/?q=AI` 200 `application/atom+xml`；不再使用需认证的 REST v3/v4。T2 与标准 §2 的例外一致。
- **NPC**：`https://flk.npc.gov.cn/` 200，但 552 bytes、`<div id="app"></div>` + 单一 module script；正文需 JS。公开 `/law-search/index/aggregateData` 200（返回分类计数）；`/law-search/search/list` 用空 POST 返回 500，正确参数/验证码未验证。
- **NCSL**：入口 200、106 KB；两张表均为 Topics/States 复选框，81 个 `<tr>`，没有法案行；“Bill Number”为输入框 + Search 按钮；实际检索需表单/JS。2025 年度静态页 200（约 1 MB），2026 年度页 404。页面加载 reCAPTCHA 脚本，未确认检索是否触发。
- **许可与依赖**：45 个锁文件包许可分布与 notices 一致；`npm audit` 0；notices 对 `main` 零删行；js-yaml 链接 `v5.5.0` **404**，tag 实际为 `5.5.0`（R2-ST03）。
- **AIHOT**：`/api/v1/items` 200 JSON、含 `links.original`；文档明确约 60 req/min 与“公众商业化须书面许可”；标准/YAML 已写入 Gate 3/4 门禁。
- **CI**：`gh pr checks 48` 为 `no checks reported`；仓库无 `.github/workflows`；PR 正文已明确写“CI 未触发（仓库无 workflow）”。
- **冻结基线 / 密钥 / AI 初稿**：未改 `README.md`、`ROADMAP.md`；未发现密钥、账号或读者数据；本 PR 不含资讯正文，AI 初稿标注不适用。
- **合并步骤**：PR #47/#48 正文均写明“先合 #47 → #48 rebase → 保留三项依赖 → `npm install` 重生成 lock → js-yaml 重编号 14/`### 6.` → 复跑两套测试”；本轮未代执行合并。

## 五、建议结论

- **单行汇总**：Standards 轴 6 项（最重：`R2-ST01`、`R2-ST02` S2 抓取模式不匹配）｜Spec 轴 5 项（最重：`R2-SP01` S2 DoD“可采集”未成立）。
- **结论**：**需修改**。R1 的 S1（许可全文）与 CourtListener 鉴权、AIHOT 门禁等 S1/S2 已闭环；SP02/SP03 仅部分闭环；R2 新增的 NPC 与 NCSL 两个源以 `static_html` 指向 SPA/交互式数据库，实际无法按声明模式产出条目，属新的 S2。修复后需 R3 增量复审。

本意见只构成证据，不自动产生权限；合并与最终决定属于 Human Maintainer。

## 六、Human 决策清单

- **工作目标**：决定是否接受 R2 “需修改”结论；决定 NPC/NCSL 的准入与采集方式，以及是否在修复后要求 R3。
- **工作链接**：[PR #48](https://github.com/fitalex/LexAIDaily/pull/48)、[Issue #40](https://github.com/fitalex/LexAIDaily/issues/40)、[Spec #38](https://github.com/fitalex/LexAIDaily/issues/38)；R2 归档 permalink/blob SHA 见 PR #48 通知评论。
- **执行步骤**：
  1. [ ] 阅读 R2 报告，确认 NPC/NCSL 的 `static_html` 问题是否作为合并前必须修复项。
  2. [ ] 决定 NPC：改用公开 `json_api`（先验证正确参数、无验证码/鉴权）、增加 JS 适配器，或移除/暂停该源。
  3. [ ] 决定 NCSL：改用可用年度静态页（2025 可用、2026 暂 404）、增加表单/API 适配器，或移除/暂停；确认检索不触发验证码。
  4. [ ] 决定是否保留 `eu-eur-lex-ai-act` 作为参考文档而非采集入口；决定顶会/期刊入口是否补入。
  5. [ ] 要求原 Owner 修复 R2-ST01/02 与 R2-SP01，并修正 js-yaml 许可链接；修复后由 DSH 做 R3 增量复审。
- **边界**：AI 不得代签、代批、自动合并；本报告与 PR 评论只构成证据，不构成 Human 批准。
