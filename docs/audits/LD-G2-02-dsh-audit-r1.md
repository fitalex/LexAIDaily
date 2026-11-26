# 复核与审计报告｜LD-G2-02

- 类型：独立审计（架构内交叉独立审计，`AGENTS.md` 6.1(b)(d)(e)、6.2）
- 出具者：DeepSeek Harness｜日期：2026-11-26
- 审计对象：[PR #48](https://github.com/fitalex/LexAIDaily/pull/48)（`gemini/ld-g2-02-source-whitelist`）｜关联 Issue：[#40](https://github.com/fitalex/LexAIDaily/issues/40)｜基准 commit：`21d24da`（`main`）｜被审 head：`df5c32ac5c15d86b88cbcfd6954f6824b19c0d50`
- 检查范围：PR 全部 7 个文件（+749/−5）；`docs/sources/whitelist-admission-standard.md`、`data/sources/whitelist-cn.yaml`、`data/sources/whitelist-global.yaml`、4 项 `node:test`、`package.json` / `package-lock.json`、`THIRD_PARTY_NOTICES.md`。本地复跑 `npm ci`、`node --test tests/sources/*.test.mjs`、`npm audit`；对 24 条白名单入口逐条做 HTTP 可达性/主机名核验，对 AIHOT 文档与 API、CourtListener API 做匿名访问核验；并做 #47+#48 顺序合并试验。对照 Issue #40、Spec #38、`ADR-0003`、`GLOSSARY.md`、`ROADMAP.md` Gate 2 与 PR 模板。
- 未检查项：未判定各信源的可信度、编辑质量或是否应入库（`AGENTS.md` 明确由 Human 决定）；未实现或运行采集器；未验证大陆网络出口下的全部抓取行为（本机为当前网络环境）；未验证 Gate 3 Web/公众号消费端；未逐份阅读 45 个锁文件依赖的 LICENSE 原文；`www.npc.gov.cn` 在本机握手失败，未据此判定站点不可用；未核验 GitHub Actions（仓库无 workflow）。

## 一、DoD 逐项核对

| 序号 | 标准（Issue #40） | 结果 | 证据 |
|---|---|---|---|
| D01 | 两份 YAML 覆盖五大内容分类与五类权威信源主体，均不含二手搬运号或需登录/强验证码站点 | 未达成 | 五维/五类覆盖由测试确认；但 `us-courtlistener` 配置为 `json_api`，其检索 API 匿名访问返回 401/403（需认证，等效于需要凭据），与“不含需登录站点”的硬红线冲突（SP01、ST02）；AIHOT 作为 `discovery_only` 的聚合源例外已写入标准 |
| D02 | `aihot.news/api/v1` 明确标为 `discovery_only: true` 并载明“仅取 `links.original` 回溯一手原链”的合规红线 | 达成 | YAML 第 193–209 行；测试第 148–159 行；API 实测 200 且返回 `links.original`；但契约侧未机器化该红线（见 LD-G2-01 ST04） |
| D03 | 每条白名单信源均附实测可访问的一手入口 URL、`expected_domain` 与抓取模式标识，经 DSH 独立审计后交 Human 批准 | 未达成 | 24/24 入口可访问（2 条需额外处理，见证据）；但 `us-courtlistener` 的“可访问”是 `/help/` 帮助页而非采集端点，API 需认证；本轮审计为“需修改”，Human 批准未发生 |

## 二、双轴发现（分轴报告，不跨轴合并重排）

### 2.1 Standards 轴（仓库规范违背 & Fowler 代码坏味道基线）

| 编号 | 级别 | 类型 | 位置 | 问题与依据 | 建议 |
|---|---|---|---|---|---|
| ST01 | S1 阻断 | 规范违背（第三方许可 / 越界修改） | `THIRD_PARTY_NOTICES.md:207`（PR head） | 第 3 节 MIT 许可证（Tailwind CSS / Radix UI / shadcn/ui）全文被替换为 Canvas UI 的受限表述：删掉 `sublicense, and/or sell`，改成 `as part of an application, website, or product`。基准 `21d24da` 的原文为 `...sublicense, and/or sell copies...`。该改动与 LD-G2-02 无关，PR #47 同一位置也有同一改动，属任务范围外的第三方许可事实错误，违反 `AGENTS.md` 6.1(c) 与 10.7。 | 从 `21d24da` 恢复被改的三行原文；#47 与 #48 各自修复；复核 diff 不再包含该 hunk。 |
| ST02 | S2 重要 | 规范违背（抓取模式与入口不一致） | `data/sources/whitelist-global.yaml:24-38` | `us-courtlistener` 标 `fetch_mode: "json_api"`，`entry_url` 却是 `https://www.courtlistener.com/help/`（HTML 帮助页）。实测 `/help/` 为 `text/html` 的 “Getting Help” 页；`/api/rest/v4/search/?q=AI` 匿名返回 401，`/api/rest/v3/search/` 匿名返回 403；公开的 `/api/rest/v4/courts/` 只是法院元数据。该配置无法按声明方式匿名采集。 | 改为公开可用的 Atom 检索 feed（实测 `https://www.courtlistener.com/feed/search/?q=...` 返回 200 `application/atom+xml`）或可用 HTML 索引；如确需 API token，属新增凭据，须按 B 级另行授权并书面记录，不能以“免登录”表述掩盖。 |
| ST03 | S2 重要 | 规范违背（分级定义不一致） | `whitelist-global.yaml:24-38`；标准 §2 | 标准定义 `T1` 为“立法机构、监管部门、法院及官方公报”；CourtListener 是 Free Law Project 的非营利聚合平台，不是法院本身，却标 `T1`。这会使 T1 的“必核发布机构、日期、版本、效力状态”要求被错误套用，也削弱分级可信度。 | 改为 `T2`（聚合/检索平台）或在标准中写明“经认证的法院文书聚合平台可等同于 T1”的例外及理由；Human 决定。 |
| ST04 | S2 重要 | 规范违背（外部服务条款） | 标准 §4；`whitelist-cn.yaml:193-209` | 标准只写“遵守其…非商业内部使用边界”，但 AIHOT 文档明确：个人、非营利、组织内部使用免费；**面向公众的商业产品、付费服务、代理 API 与批量再分发须事先取得书面许可**。项目 Gate 3/4 计划公开与商业化，当前条目没有记录该前置条件或 gate。 | 在标准与 YAML 的 `verification_note` 写明“Gate 3 公开/商业化前须取得 AIHOT 书面许可”；在取得许可前只用于内部试运行；由 Human 决定是否联系授权。 |
| ST05 | S3 建议 | 规范违背（入口不是更新源） | `whitelist-global.yaml:60-78` | `eu-eur-lex-ai-act` 的 `entry_url` 是单一法规文本页（`/eli/reg/2024/1689/oj/eng`），不是新法规/修订的索引或 feed；`fetch_mode: static_html` 每天抓同一页不会产生新条目。`eu-ai-office` 目前也以政策介绍为主，未体现按日更新的新闻/公告索引。 | 改为 EUR-Lex 的立法更新/新闻索引或官方 RSS，并把单一法规页降为“参考文档”而非采集入口；`eu-ai-office` 同样改为新闻/公告索引。 |
| ST06 | S3 建议 | 规范违背（测试断言过弱） | `tests/sources/whitelist.test.mjs:49,54` | 只断言 `cn >= 8`、`global >= 10`，而 PR body 声称 11 条与 13 条；删掉 3 条 CN 源测试仍通过，无法守住声称的覆盖数。 | 断言精确条数（11/13）与每轨的五类/五维覆盖；对关键源做存在性断言。 |
| ST07 | S3 建议 | 规范违背（测试缺口） | `tests/sources/whitelist.test.mjs` | 未测：重复 `entry_url`、`discovery_api` ⇒ `discovery_only: true`、discovery 源必须有 `compliance_redline`、`authority_tier` 与 `source_type` 的映射、`high_risk_default` 与 tier 的一致性、顶层/条目未知键拒绝。 | 补齐上述用例；把白名单规则提取为共享校验函数，测试与生产共用。 |
| ST08 | S3 建议 | 坏味道（缺少 schema/严格键校验） | `data/sources/*.yaml`；测试 | YAML 没有 JSON Schema 或严格键白名单；`js-yaml` 会静默忽略拼错的键（如把 `high_risk_default` 写成 `high_risk_defualt`），测试只读已知键，无法发现。 | 增加 `whitelist.schema.json` 或在加载时校验允许键；对未知键报错。 |
| ST09 | S3 建议 | 规范违背（验证记录不完整） | `whitelist-cn.yaml:62-79` | `cn-moj-bmgz` 实测返回 302 并设置 `CT6T` / `CT6TS` Cookie，带 Cookie jar 才到 200；`verification_note` 只写“已核验…免登录抓取”，未记录 302/Cookie 行为。这不等于登录，但采集器必须处理 Cookie，否则会停在 302。 | 在 `verification_note` 记录“302 + Cookie 挑战，需 cookie jar”；采集器实现时按此处理并加回归。 |
| ST10 | S3 建议 | 规范违背（分级/风险未交叉校验） | 两份 YAML；测试 | 当前 T1 均为 `high_risk_default: true`、T2/T3 均为 `false`，但测试不校验该映射；未来把 T1 源误设为 false，测试仍通过。 | 加断言：`T1 ⇒ high_risk_default: true`（或显式例外表）；在标准写明例外。 |
| ST11 | S3 建议 | 规范违背（许可证据/编号） | `THIRD_PARTY_NOTICES.md` 表格序号 12（`js-yaml` 行，PR head 第 17 行） | 45 个锁文件包的许可分布与 notice 一致（MIT 26、BSD-2 12、MIT-0 3、ISC 2、BSD-3 1、PSF-2.0 1）；但 PSF-2.0（`argparse`）只有表格行、没有许可证全文归档；js-yaml 许可链接指向 `master` 而非 v5.5.0 tag/commit。与 #47 同时新增“行 12–13 / ### 5.”，合并后需重新编号。 | 补 PSF-2.0 全文或注明“未随仓库分发”；许可链接 pin 到 tag/commit；合并时重新编号。 |
| ST12 | S3 建议 | 规范违背（PR 模板 / CI） | PR #48 body | 缺 DoD 逐项表、CI 链接或“CI 未触发（原因）”、红线自查；`gh pr checks 48` 为 `no checks reported`，仓库无 `.github/workflows`，PR 未记录“未触发”。 | 按模板补全；明确写“CI 未触发（仓库无 workflow）”。 |
| ST13 | S3 建议 | 规范违背（并行合并证据） | `package.json`、`package-lock.json`、`THIRD_PARTY_NOTICES.md` | 与 #47 同时改同一 description/scripts、lock、notices 行 12–13 与 `### 5.`；实测顺序合并产生 3 个冲突，两份依赖都保留时 `npm ci` 报 `Missing: js-yaml@5.5.0 / argparse@3.0.4`。PR body 的“先合其一后另一 PR 仅需做增量合并即可”不足以指导操作。 | 定合并顺序；后合者 rebase 后 `npm install` 重生成 lock；notices 重新编号；在 PR 写明步骤与验证命令。 |
| ST14 | S3 建议 | 坏味道（校验逻辑只在测试里） | `tests/sources/whitelist.test.mjs:58-131` | 白名单的 URL/域名/枚举/区域规则只在测试中实现；生产采集器没有可复用的校验器，未来会复制一套规则，形成双份真相。 | 抽出 `src/sources/validate-whitelist.mjs`（或在采集器加载时校验），测试调用同一函数。 |

### 2.2 Spec 轴（原 Issue/任务书遗漏、偏差与范围蔓延）

| 编号 | 级别 | 类型 | 位置 | 问题与原需求引用 | 建议 |
|---|---|---|---|---|---|
| SP01 | S1 阻断 | 偏差（DoD 硬红线未达成） | `whitelist-global.yaml:24-38` | Issue #40 的验收标准明确“均不含二手搬运号或需登录/强验证码站点”；标准 §1 也把“需登录态”列为一票否决。`us-courtlistener` 的检索 API 匿名返回 401/403，配置却声明 `json_api` 免登录采集，DoD 未达成。 | 按 ST02 改为公开 Atom/HTML；或经 Human 书面 B 级授权使用 token（并记录凭据管理），在此之前不得声明该源可免登录采集。 |
| SP02 | S2 重要 | 遗漏（任务书点名的法域） | 两份 YAML | Issue #40 的“What to build”点名“全国人大”与“美联邦/各州立法”。当前 CN 轨只有司法部部门规章/行政法规库、网信办、数据局、金融监管总局等，没有全国人大/国家法律法规数据库（`flk.npc.gov.cn` 本机实测 200；`www.npc.gov.cn` 本机握手失败，未据此判定不可用）；美国立法源只有联邦纪事，没有州立法源。 | 由 Human 决定是否补入 NPC/国家法律法规数据库与州立法源；若不补，在标准中书面说明“本阶段不覆盖法律层级/州法”的理由。审计不判定信源可信度。 |
| SP03 | S2 重要 | 遗漏（学术类定义） | 标准 §1；两份 YAML | 标准把 `academic_paper` 定义为“顶会与核心期刊论文”，但配置只有 arXiv（预印本）与 Stanford HAI（研究机构新闻页），没有顶会/核心期刊入口。结构与 Issue #40 的“顶会与核心期刊论文”不一致。 | 由 Human 决定补入具体顶会/期刊入口；若不补，把 `academic_paper` 的描述改为“预印本/研究机构”，避免标准与配置不一致。 |
| SP04 | S2 重要 | 偏差（“实测可访问”含义） | `whitelist-global.yaml:38`；PR body | `us-courtlistener` 的 `verification_note` 写“实测免登录可访问；提供…公开 REST API 文档”，实测的是 `/help/` 帮助页，不是采集端点；API 检索需认证。DoD 的“每条源均附实测可访问的一手入口”在该条上未真正成立。 | 重新做“采集端点”级验证并把结果写入 `verification_note`；不要把“文档可访问”写成“采集可访问”。 |
| SP05 | S3 建议 | 遗漏（跨 PR 契约） | 标准 §2；#47 `candidate-item` | 标准要求 T1 必核 `effective_status`，但 #47 的 `effective_status` 是可选的，`high_risk_legal: true` 且无 `effective_status` 仍可通过。 | 与 #47 协商：在契约中加 `if high_risk_legal then effective_status`，或由白名单 tier 在管线侧强制。 |
| SP06 | S3 建议 | 遗漏（失效降级不可实现） | 标准 §5；#47 `collect-meta` | 标准规定“连续 3 次 4xx/5xx/超时/空 → degraded；连续 7 天不可用 → paused”，但 `collect-meta` 没有连续失败计数、最近错误时间或状态迁移记录，单次 `source_results` 不足以实现该规则。 | 在 `collect-meta` 增加 `failure_streak` / `last_error_at` / `previous_status`，或明确状态机由外部存储维护。 |
| SP07 | S3 建议 | 偏差（分类/区域语义） | `whitelist-cn.yaml:193-209` | AIHOT 放在 `region: cn`，但 `jurisdiction: GLOBAL`、内容是全球资讯；`source_type: authoritative_media` 又把“聚合线索源”混入权威媒体类，五类主体语义被拉伸。标准 §2 的 T3 已包含“辅助线索发现源”，但 `source_type` 没有对应类型。 | 为 discovery 源增加独立 `source_type`（或 `source_role`），并说明放 CN 轨的理由（中文入口/大陆出口/运营习惯）；不改也可，但需在标准中写明。 |
| SP08 | S3 建议 | 偏差（合并计划） | PR #48 body | 与 #47 的并行改动会产生实际冲突（见 ST13）；PR body 只给“先合其一后增量合并”的一句话，未给出 rebase、lock 重生成、notices 重编号的步骤。 | 在 PR 写明合并顺序与验证命令；后合者 rebase 后执行 `npm install` 并复跑两套测试。 |
| SP09 | S3 建议 | 偏差（跨 PR 命名漂移） | `whitelist-global.yaml:114` vs #47 fixture | #47 夹具用 `arxiv-cs-ai`，本 PR 白名单用 `arxiv-cs-ai-rss`；同一来源两个 id，跨 PR 无法直接对上。 | 统一 id（建议 `arxiv-cs-ai-rss`），并在 #47 夹具修正；或建立 id 别名表。 |

## 三、证据与红线核验

- **命令与 commit 对应**：是。所有命令在 `pr48` worktree 的 `df5c32a` 上执行；`npm ci` 安装 45 个包；`node --test tests/sources/*.test.mjs` 为 4 pass / 0 fail；`npm audit --registry=https://registry.npmjs.org` 为 `found 0 vulnerabilities`（默认镜像不可用）。
- **白名单入口可达性（24 条，逐条 curl -L + 浏览器 UA）**：24/24 最终可访问；23 条直接 200/202，`cn-moj-bmgz` 为 302 + Cookie 挑战（带 cookie jar 后 200）；`eu-eur-lex` 为 202 异步响应。`expected_domain` 与入口主机名全部一致，协议全部为 `https`。未在海外/大陆另一个出口复测，故只能证明“本机当前网络”可达。
- **CourtListener 专项**：`/help/` 200 `text/html`（“Getting Help”）；`/api/rest/v4/search/?q=AI` 401 `{"detail":"Authentication credentials were not provided."}`；`/api/rest/v3/search/?q=AI` 403 `{"detail":"Anonymous users don't have permission to access the API."}`；`/api/rest/v4/courts/` 200（法院元数据）；`/feed/search/?q=...` 200 `application/atom+xml`。结论：当前 `json_api` + `/help/` 配置不可匿名采集，且 API 需认证。
- **AIHOT 专项**：`https://aihot.news/api/v1/items` 200 `application/json`，返回 `links.original`；文档 `https://aihot.news/en/agent?tab=api` 实测包含“More than about 60 requests a minute from one IP get a 429”与“personal, nonprofit and internal use within an organization is free; public-facing commercial products, paid services, proxy APIs and bulk redistribution need written permission first”。前者与 YAML 的“约 60 req/min”一致；后者未写入标准/配置（ST04）。
- **NPC/州法**：`https://flk.npc.gov.cn/` 本机 200；`https://www.npc.gov.cn/` 本机超时/握手失败，未据此判定站点不可用；海外轨只有联邦纪事，无州立法源（SP02）。
- **许可与依赖**：45 个锁文件包许可分布实测为 MIT 26、BSD-2-Clause 12、MIT-0 3、ISC 2、BSD-3-Clause 1、PSF-2.0 1，与 notices 表格序号 12 一致；`argparse` 的 PSF-2.0 只在表格行，未归档全文（ST11）；shadcn 许可全文被改写（ST01），故本轮仍不通过。
- **合并试验**：#47 + #48 顺序合并产生 `THIRD_PARTY_NOTICES.md`、`package-lock.json`、`package.json` 三处冲突；两份依赖都保留时 `npm ci` 失败（ST13）。
- **CI**：`gh pr checks 48` 为 `no checks reported`；仓库无 `.github/workflows`；PR 未写“CI 未触发”。按 `AGENTS.md` 10.5，不得写成通过。
- **冻结基线 / 密钥 / AI 初稿**：未改 `README.md`、`ROADMAP.md`；未发现密钥、账号或读者数据；本 PR 不含资讯正文，AI 初稿标注不适用。AIHOT 的“仅取 `links.original`”红线已写入 YAML 与标准，但契约侧未机器化（见 LD-G2-01 ST04）。

## 四、建议结论

- **单行汇总**：Standards 轴 14 项（最重：`ST01 S1` 第三方许可全文被改写）｜Spec 轴 9 项（最重：`SP01 S1` 免登录硬红线未达成）。
- **结论**：**需修改**。24 条入口的可达性与域名校验大体成立，AIHOT 的 `discovery_only` 标记也正确；但 CourtListener 以需认证的 API 冒充免登录源，违反 Issue #40 的一票否决项，S1 许可事实错误也必须先纠正；NPC/州法/顶会期刊等覆盖缺口需 Human 决定。

本意见只构成证据，不自动产生权限；合并与最终决定属于 Human Maintainer。

## 五、Human 决策清单

- **工作目标**：决定是否接受本审计意见，是否要求原 Owner（Gemini）在 PR #48 修复 S1/S2 后再合并；并决定 CourtListener 的去留、NPC/州法/顶会期刊是否补入、AIHOT 商业化许可的前置条件。
- **工作链接**：[PR #48](https://github.com/fitalex/LexAIDaily/pull/48)、[Issue #40](https://github.com/fitalex/LexAIDaily/issues/40)、[Spec #38](https://github.com/fitalex/LexAIDaily/issues/38)；本报告归档 PR 的 permalink 与 blob SHA 见 PR #48 通知评论。
- **执行步骤**：
  1. [ ] 阅读本报告，确认 S1（ST01 许可、SP01 CourtListener）是否作为合并前必须修复项。
  2. [ ] 在 PR #48 评论中要求原 Owner 修复 ST01–ST04 与 SP01–SP04；其余 S3 可一并处理或登记后续。
  3. [ ] 决定 CourtListener：改用公开 Atom/HTML 索引、删除该源，或按 B 级授权使用 token（不得由 Agent 自行引入凭据）。
  4. [ ] 决定是否补入全国人大/国家法律法规数据库、美国州立法、顶会/核心期刊入口；审计不判定信源可信度与入库。
  5. [ ] 决定 AIHOT 在 Gate 3 公开/商业化前是否取得书面许可；未取得前只用于内部试运行。
  6. [ ] 修复后要求 DeepSeek Harness 增量复审（新文件 `LD-G2-02-dsh-audit-r2.md`，不改本文件）；核对归档文件与评论原文、blob SHA 后再决定合并或退回。
- **边界**：AI 不得代签、代批、自动合并；本报告与 PR 评论只构成证据，不构成 Human 批准。
