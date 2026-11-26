# 复核与审计报告｜LD-G2-02（R3 增量复审）

- 类型：独立审计（R3 增量复审，`AGENTS.md` 6.1(b)(d)(e)、6.2）
- 出具者：DeepSeek Harness｜日期：2026-11-26
- 审计对象：[PR #48](https://github.com/fitalex/LexAIDaily/pull/48)（`gemini/ld-g2-02-source-whitelist`）｜关联 Issue：[#40](https://github.com/fitalex/LexAIDaily/issues/40)｜基准 commit：`21d24da`（`main`）｜被审 head：`4d62ac15a4fc139df150e3fb1b9beb317592ac87`
- R2 报告：[LD-G2-02-dsh-audit-r2.md](https://github.com/fitalex/LexAIDaily/blob/9628b7da879b44f16b5a28b4f29ccd5bcbdadf18/docs/audits/LD-G2-02-dsh-audit-r2.md)（blob `da3264919febfeee375917f8a37d9454be73a20f`，结论“需修改”）
- 检查范围：`ec8c0c3..4d62ac1` 全部 4 个变更文件（+13/−9）；NPC 新 JSON 入口、NCSL 新静态入口、`THIRD_PARTY_NOTICES.md` 许可链接与对 `main` 的增量、5 项测试、26 条白名单入口。本地复跑 `npm ci`、`node --test`、`npm audit --registry=https://registry.npmjs.org`；对 NPC `aggregateData`/`flfgDetails`、NCSL 2025 静态页、CourtListener Atom 做内容级核验；检查 js-yaml `5.5.0` 许可链接与 PR 正文一致性。
- 未检查项：未判定各信源可信度、编辑质量或是否应入库（`AGENTS.md` 明确由 Human 决定）；未实现或运行采集适配器，未验证 NPC `xfsd`→详情 URL 的实际生成；未确认 NPC 搜索接口或 NCSL 数据库检索是否触发验证码（本轮改用静态/聚合入口，未使用检索表单）；未验证 2026 年 NCSL 汇总页（不存在）；未执行 #47+#48 的实际 rebase/合并（PR 正文已写明步骤）；未验证 Gate 3 Web/公众号消费端；未逐份阅读 45 个锁文件依赖的 LICENSE 原文。

## 一、DoD 逐项核对

| 序号 | 标准（Issue #40） | 结果 | 证据 |
|---|---|---|---|
| D01 | 两份 YAML 覆盖五大内容分类与五类权威信源主体，均不含二手搬运号或需登录/强验证码站点 | 达成 | 26 条源（12 CN + 14 Global）；五类主体与五维分类全覆盖；CourtListener 为公开 Atom，NPC 为公开 JSON，NCSL 为公开静态页；均为免登录入口，未发现需鉴权站点 |
| D02 | `aihot.news/api/v1` 明确标为 `discovery_only: true` 并载明“仅取 `links.original` 回溯一手原链”的合规红线 | 达成 | YAML `aihot-news-discovery`；`compliance_redline` 同时写入 Gate 3/4 书面许可前置门禁；测试断言 `links.original` 与“书面许可” |
| D03 | 每条白名单信源均附实测可访问的一手入口 URL、`expected_domain` 与抓取模式标识，经 DSH 独立审计后交 Human 批准 | 达成 | 26/26 入口可达；NPC `json_api` 返回 200 JSON 且含 `xfsd` 新法条目；NCSL `static_html` 返回 200 静态汇总页；`expected_domain`/HTTPS 全部一致；本轮 R3 结论“通过”（Human 批准仍属合并门禁） |

## 二、R2 整改进度（S1/S2 逐项）

| R2 编号 | R2 级别 | R3 状态 | 证据 |
|---|---|---|---|
| R2-ST01 | S2 | **已修复** | `cn-npc-flk` 改为 `fetch_mode: "json_api"`、`entry_url: https://flk.npc.gov.cn/law-search/index/aggregateData`；实测 200 `application/json`，含 `data.xfsd` 5 条新法（首条 2026-11-06）及分类计数 |
| R2-ST02 | S2 | **已修复** | `us-ncsl-ai-legislation` 改为 `static_html` + 2025 年静态汇总页；实测 200、约 1 MB，含各州 AI 立法摘要；2026 年页 404 已写入 `verification_note` |
| R2-SP01 | S2 | **已修复（入口级）** | 两个新源均从“无法按声明模式产出”变为可访问入口：NPC 为 JSON、NCSL 为静态 HTML；剩余“条目字段/URL/时效”见 R3-ST01、R3-ST02 |
| R2-ST03 | S3 | **已修复** | js-yaml 许可链接改为 `https://github.com/nodeca/js-yaml/blob/5.5.0/LICENSE`，实测 200；notices 对 `main` 零删行 |
| R2-ST04 | S3 | **仍开** | 校验器只强制 T1 高风险；T2 court/legislation 的 `high_risk_default` 未机器化，见 R3-ST05 |
| R2-ST05 | S3 | **仍开** | `eu-eur-lex-ai-act` 仍是单一法规文本页，不是更新索引/feed，见 R3-ST06 |
| R2-SP02 | S3 | **仍开/人工决策** | 顶会/核心期刊入口仍未补；标准已写明由 Human 后续审定，见 R3-ST09 |
| R2-SP03 | S3 | **已缓解** | NCSL 改用 2025 静态页；但 2025 页更新于 2025-07-10，2026 页 404，时效问题转为 R3-ST02 |
| R2-SP04 | S3 | **已缓解** | NPC 本轮使用无表单的聚合 JSON；NCSL 使用静态页，不触发检索验证码；若未来切回数据库需重新验证，见 R3-ST10 |
| R2-SP05 | S3 | **仍开** | `collect-meta` 仍无 failure_streak/last_error_at，失效降级规则不可实现，见 R3-ST07 |
| R2-ST06 | S3 | **仍开（流程）** | 两 PR 仍改 package.json/lock/notices；PR 正文已写明 rebase/lock/重编号步骤，实际合并仍需执行，见 R3-ST08 |

## 三、双轴发现（R3 新增/残留）

### 3.1 Standards 轴（仓库规范违背 & Fowler 代码坏味道基线）

| 编号 | 级别 | 类型 | 位置 | 问题与依据 | 建议 |
|---|---|---|---|---|---|
| R3-ST01 | S3 建议 | 规范违背（聚合端点覆盖面） | `data/sources/whitelist-cn.yaml:6-23`（`cn-npc-flk`） | `aggregateData` 是首页聚合接口：返回 `flflCount`（6 类计数）、`xfsd`（5 条新法）、`popularSearch`/`popularDownload`，不是完整法律法规列表。`xfsd` 条目含 `title`/`gbrq`/`flxz`/`bbbs`，但不含可直接使用的文章 URL；`flfgDetails?bbbs=...` 返回 200 且含标题/日期，但同样没有 URL 字段。 | 在契约/适配器文档中写明“只消费 `xfsd` 的 5 条新法”及 `bbbs`→详情 URL 的生成规则；若需要完整库，改用带参数的搜索端点并验证。当前作为“新法速递”源可接受，但不要宣称覆盖全库。 |
| R3-ST02 | S3 建议 | 规范违背（时效性） | `data/sources/whitelist-global.yaml:24-40`（`us-ncsl-ai-legislation`） | 新入口为 2025 年静态汇总页，页面标注 `Updated July 10, 2025`；2026 年页实测 404。`status: "active"` 表示正常调度，但该页在 2026 年不会产生新条目；名称也由“Database”改为“Summary”。 | 由 Human 决定：将 `status` 暂置 `degraded`/`paused` 直至 2026 页上线，或保留为背景/年度摘要源并明确“非日更”；若需实时州法追踪，改用数据库表单/API 适配器。 |
| R3-ST03 | S3 建议 | 规范违背（测试只断言 URL） | `tests/sources/whitelist.test.mjs:49-63` | 新增断言只检查 `fetch_mode` 与 URL 子串，没有验证 NPC 返回 `xfsd`、NCSL 页面含静态摘要、CourtListener 返回 Atom；端点变更/失效不会被测试发现。 | 增加轻量契约测试（可用 fixture/可选网络测试），至少断言 NPC 响应含 `data.xfsd`、NCSL 页面含标题/州名、CourtListener 含 `<feed`。 |
| R3-ST04 | S3 建议 | 规范违背（PR 正文与 head 不一致） | PR #48 body | 正文仍写“最新 head：`ec8c0c3`”，NPC 入口仍是旧 `https://flk.npc.gov.cn/`，NCSL 仍是旧 database 页；验证表也写 `commit ec8c0c3`。整改回应评论已写 `4d62ac1`，但 PR 正文未同步。 | 把正文更新为 `4d62ac1`、新入口/新验证命令；Human 最终核对应以正文+评论+文件三者一致为准。 |
| R3-ST05 | S3 建议 | 规范违背（分级规则未完全机器化） | `src/sources/validate-whitelist.mjs:124` | 校验器只强制 `T1 ⇒ high_risk_default: true`；标准 §2 要求“涉法院文书/立法聚合的 T2 源置为 true”，当前 CourtListener/NCSL 手工为 true，但未来 T2 court/legislation 源设 false 仍会通过。 | 加 `T2 ∧ source_type ∈ {court_judiciary, legislation_regulator} ⇒ high_risk_default: true`（或显式例外表），并补负例。 |
| R3-ST06 | S3 建议 | 规范违背（入口不是更新源） | `data/sources/whitelist-global.yaml:87` | `eu-eur-lex-ai-act` 仍是单一法规文本页（`/eli/reg/2024/1689/oj/eng`），不是新法规/修订索引或 feed；`static_html` 每天抓同一页不会产生新条目。`eu-ai-office` 也以政策介绍为主。 | 改为 EUR-Lex 立法更新/新闻索引或官方 RSS，单一法规页降为参考文档；`eu-ai-office` 改为新闻/公告索引。 |
| R3-ST07 | S3 建议 | 规范违背（失效降级不可实现） | 标准 §5；#47 `collect-meta` | `collect-meta` 没有连续失败计数、最近错误时间或状态迁移字段，标准“连续 3 次降级、7 天 paused”无法从单次 `source_results` 实现。 | 在 `collect-meta` 增加 `failure_streak` / `last_error_at` / `previous_status`，或明确状态机由外部存储维护。 |
| R3-ST08 | S3 建议 | 规范违背（并行合并） | `package.json`、`package-lock.json`、`THIRD_PARTY_NOTICES.md` | 与 #47 仍改同一文件；PR 正文已给出“先合 #47 → rebase → `npm install` → js-yaml 重编号 14/###6”的正确步骤，但本轮未执行，合并时仍会有冲突。 | 合并时严格按 PR 正文执行并复跑两套测试；不要把“步骤已写明”当成“合并已验证”。 |

### 3.2 Spec 轴（原 Issue/任务书遗漏、偏差与范围蔓延）

| 编号 | 级别 | 类型 | 位置 | 问题与原需求引用 | 建议 |
|---|---|---|---|---|---|
| R3-SP01 | S3 建议 | 偏差（NPC 覆盖范围） | `cn-npc-flk` | Issue #40 期望“立法与监管机构官方发布入口”；`aggregateData` 只给 5 条 `xfsd` 新法，不是完整法规库。作为“新法速递”可用，但不能覆盖全库检索需求。 | 在标准/任务书说明该源定位为“新法速递”；若 Gate 2 需要全库覆盖，另配搜索端点或补充其他官方源。 |
| R3-SP02 | S3 建议 | 偏差（NCSL 时效） | `us-ncsl-ai-legislation` | 2025 年静态汇总页无法覆盖 2026 年州法；`status: active` 与“追踪”语义不完全一致。 | 由 Human 决定是否接受“2025 摘要作为背景源”，或将状态改为 `degraded`/`paused`，待 2026 页/适配器就绪。 |
| R3-SP03 | S3 建议 | 遗漏（学术类入口） | 标准 §1；两份 YAML | 顶会/核心期刊入口仍未补；标准已改为“预印本、高校研究机构与顶会/核心期刊”，并写明由 Human 后续审定。 | 由 Human 指定具体顶会/期刊（如 ICAIL/FAccT/JOLT）后补入；若不补，标准已披露范围。 |
| R3-SP04 | S3 建议 | 未排除风险（验证码） | NPC 搜索接口；NCSL 数据库页 | 本轮改用 NPC 聚合 JSON 与 NCSL 静态页，未使用检索表单，因此当前入口不触发验证码；若未来切回数据库/搜索端点，需重新验证是否触发 `captchaImage`/reCAPTCHA。 | 在切换端点时做无验证码/无鉴权验证；若触发，按红线降级/移除或由 Human 走 B 级例外。 |

## 四、证据与红线核验

- **命令与 commit 对应**：是。所有命令在 `pr48r3` worktree 的 `4d62ac1` 上执行；`npm ci` 安装 45 个包；`node --test tests/sources/*.test.mjs` 为 5 pass / 0 fail；`npm audit --registry=https://registry.npmjs.org` 为 0 vulnerabilities。
- **26 条入口可达性**：26/26 可达；24 条直接 200，`cn-moj-bmgz` 为 302 + Cookie（带 jar 后 200），`eu-eur-lex` 为 202 异步。CourtListener 在首轮并行核验中出现一次 `000`（超时），单独重试 3 次均 200 `application/atom+xml`（14.1s / 1.6s / 2.1s），记录为瞬时超时，不判定失效。
- **NPC**：`aggregateData` 200 JSON；`data` 含 `flflCount`（6 类计数）、`xfsd`（5 条新法，首条 2026-11-06）、`popularSearch`/`popularDownload`；`flfgDetails?bbbs=...` 200，含 `title`/`gbrq`/`flxz`/`zdjgName`，无 URL 字段。当前入口可产出 5 条“新法速递”，不是完整法规列表。
- **NCSL**：2025 静态页 200、约 1 MB、376K 文本，页面标注 `Updated July 10, 2025`；2026 年度页实测 404；当前页含各州 AI 立法摘要/示例，但不会在 2026 年产生新条目。
- **许可与依赖**：js-yaml 链接 `5.5.0` 实测 200；notices 对 `main` 零删行；45 包许可分布与 notices 一致；`npm audit` 0。`4d62ac1` 恢复了 e5031e4 中误改的 OFL/Canvas UI 行，净 diff 与 main 零删行。
- **AIHOT / CourtListener**：AIHOT `/api/v1/items` 200 JSON、含 `links.original`；CourtListener Atom 200；T2 与标准 §2 例外一致。
- **CI**：`gh pr checks 48` 为 `no checks reported`；仓库无 `.github/workflows`；PR 正文已写“CI 未触发（仓库无 workflow）”。
- **冻结基线 / 密钥 / AI 初稿**：未改 `README.md`、`ROADMAP.md`；未发现密钥、账号或读者数据；本 PR 不含资讯正文。
- **PR 正文一致性**：**不一致**——正文仍写 head `ec8c0c3`、旧 NPC/NCSL 入口、验证表旧 commit；整改回应评论已写 `4d62ac1`（R3-ST04）。

## 五、建议结论

- **单行汇总**：Standards 轴 8 项（全部 S3，最重：`R3-ST01` NPC 聚合端点覆盖面、`R3-ST02` NCSL 时效）｜Spec 轴 4 项（全部 S3，最重：`R3-SP01` NPC 覆盖、`R3-SP02` NCSL 时效）。
- **结论**：**通过**。R2 的两个 S2（NPC/NCSL 抓取模式不匹配）已通过 `json_api`/`static_html` 入口修复，26/26 可达；R1 的 S1/S2 主要项已闭环，R1 SP03（顶会/期刊入口）仍为部分并转 S3/Human 决策；剩余 12 项为 S3 建议与 Human 决策项（NPC 仅“新法速递”、NCSL 2025 时效、PR 正文同步等），不阻断合并。

本意见只构成证据，不自动产生权限；合并与最终决定属于 Human Maintainer。

## 六、Human 决策清单

- **工作目标**：决定是否接受 R3 “通过”结论并推进 PR #48；决定 NPC 仅覆盖 5 条新法是否足够、NCSL 2025 摘要是否可作为当前源，或暂置 `degraded`/`paused`。
- **工作链接**：[PR #48](https://github.com/fitalex/LexAIDaily/pull/48)、[Issue #40](https://github.com/fitalex/LexAIDaily/issues/40)、[Spec #38](https://github.com/fitalex/LexAIDaily/issues/38)；R3 归档 permalink/blob SHA 见 PR #48 通知评论。
- **执行步骤**：
  1. [ ] 阅读 R3 报告，确认 R2 的两个 S2 已闭环。
  2. [ ] 决定 NPC：接受“新法速递 5 条”定位，或要求补完整搜索端点/适配器。
  3. [ ] 决定 NCSL：接受 2025 摘要作为背景源，或暂置 `degraded`/`paused`，待 2026 页或数据库适配器。
  4. [ ] 要求 Owner 把 PR 正文更新到 `4d62ac1` 与新入口（R3-ST04），并按 PR 正文执行 #47→#48 rebase/lock/重编号后复跑两套测试。
  5. [ ] 核对 R3 归档文件与 PR 评论原文、blob SHA 一致后，再决定合并。
- **边界**：AI 不得代签、代批、自动合并；本报告与 PR 评论只构成证据，不构成 Human 批准。
