# 复核与审计报告｜LD-G2-02（R4 增量复审）

- 类型：独立审计（R4 增量复审，`AGENTS.md` 6.1(b)(d)(e)、6.2）
- 出具者：DeepSeek Harness｜日期：2026-11-26
- 审计对象：[PR #48](https://github.com/fitalex/LexAIDaily/pull/48)（`gemini/ld-g2-02-source-whitelist`）｜关联 Issue：[#40](https://github.com/fitalex/LexAIDaily/issues/40)｜基准 commit：`21d24da`（`main`）｜被审 head：`9d5e63b414f0989e671c2070e4bc4e71d0febeb5`
- R3 报告：[LD-G2-02-dsh-audit-r3.md](https://github.com/fitalex/LexAIDaily/blob/4c85fbecaacf19874d2f00e1298441af8ab9628e/docs/audits/LD-G2-02-dsh-audit-r3.md)（blob `ddae7ab8b23294f00d5a8b78f4d5f3b3569aadff`，结论“通过”）
- 检查范围：`4d62ac1..9d5e63b` 全部 5 个变更文件（+460/−409）；v1.1 双轨 26 条源（12 CN + 14 Global）、准入标准、共享校验器、5 项测试、`THIRD_PARTY_NOTICES.md` 对 `main@21d24da` 的增量、PR #47 夹具 `source_id` 对齐、当前合并状态。本地复跑 `npm ci`、`node --test`、`npm audit`；对 26 条入口逐条做 HTTP、内容类型、正文/条目可解析性、SPA 空壳与 `fetch_mode` 一致性核验。
- 未检查项：未判定各信源可信度、编辑质量或是否应入库（`AGENTS.md` 明确由 Human 决定）；未使用无头浏览器验证 Cloudflare/JS challenge（Clio 403、Legal IT 的 UA 差异已实际记录）；未实现或运行采集适配器；未验证 Gate 3 Web/公众号消费端；未逐份阅读 45 个锁文件依赖的 LICENSE 原文；未执行 rebase/合并（PR 正文已写明 R4 后由 Gemini rebase）。

## 一、DoD 逐项核对

| 序号 | 标准（Issue #40） | 结果 | 证据 |
|---|---|---|---|
| D01 | 两份 YAML 覆盖五大内容分类与七类信源主体，均不含二手搬运号或需登录/强验证码站点 | 未达成 | 12 CN + 14 Global、五维/七类覆盖成立；但 `global-clio-ai-blog` 实测 403 Cloudflare “Just a moment...”，`legal-it-insider` 在浏览器 UA 下为 “Bot Verification”，均与“无强验证/可静态解析”要求冲突（R4-ST01/02） |
| D02 | `aihot.news/api/v1` 标为 `discovery_only: true` 并载明 `links.original` 回溯红线 | 达成 | `aihot-news-discovery` 标 `discovery_api`、`discovery_only: true`；实测 200 JSON、50 条 items、含 `links.original`；Gate 3/4 书面许可门禁保留 |
| D03 | 每条信源均附实测可访问的一手入口 URL、`expected_domain` 与抓取模式标识，经 DSH 独立审计后交 Human 批准 | 未达成 | 26 条中 25 条 HTTP 200、1 条 403；24 条在浏览器 UA 下可静态解析，1 条仅非浏览器 UA 可解析，1 条不可解析；`fetch_mode` 类型基本一致但“可采集”在 Clio/Legal IT 上不成立（R4-SP01） |

## 二、R3 整改与 v1.1 重构核验

| R3 编号 | R3 级别 | R4 状态 | 证据 |
|---|---|---|---|
| R3-ST01 | S3 | **已关闭（源移除）** | v1.1 移除 `cn-npc-flk`；CN 轨改为 12 源的新配比，不再存在 aggregateData 覆盖问题 |
| R3-ST02 | S3 | **已关闭（源移除）** | v1.1 移除 `us-ncsl-ai-legislation`；不再使用 2025 静态摘要页 |
| R3-ST03 | S3 | **仍开** | 测试仍只断言 URL 子串与 `fetch_mode`，未验证正文/条目可解析性；本次 Clio/Legal IT 失败未被测试发现（R4-ST04） |
| R3-ST04 | S3 | **已修复** | PR body 已更新 head `9d5e63b`、v1.1 选源说明与合并顺序提醒 |
| R3-ST05 | S3 | **已修复** | `validate-whitelist.mjs` 新增 `T2` 法院/立法源 `high_risk_default: true` 强制校验（第 135–140 行），并有负例测试 |
| R3-ST06 | S3 | **部分关闭（移除 EUR-Lex）** | v1.1 移除 `eu-eur-lex-ai-act`（单一法规页）；`eu-ai-office` 保留为合规哨兵，入口未变。R3-ST06 的 EUR-Lex 问题已关闭；EU AI Office 的更新频率仍属 S3 观察项 |
| R3-ST07 | S3 | **仍开** | `collect-meta` 仍无 `failure_streak` / `last_error_at`，失效降级规则仍不可实现 |
| R3-ST08 | S3 | **升级为当前冲突** | PR #48 当前 `mergeable: CONFLICTING`；main 已推进到 `831095f`（含 PR #47），`package.json`/`package-lock.json`/`THIRD_PARTY_NOTICES.md` 三处冲突（R4-ST03） |
| R3-SP01 | S3 | **已关闭（源移除）** | `cn-npc-flk` 已移除；NPC 覆盖问题不再存在 |
| R3-SP02 | S3 | **已关闭（源移除）** | `us-ncsl-ai-legislation` 已移除；2025 时效问题不再存在 |
| R3-SP03 | S3 | **仍开** | 学术类仍只有 arXiv `cs.AI`；顶会/核心期刊入口仍未补 |
| R3-SP04 | S3 | **仍开（新实例）** | Clio 的 Cloudflare challenge 与 Legal IT 的 Bot Verification 属于新的强验证/反爬风险（R4-ST01/02） |

## 三、双轴发现（R4 新增/残留）

### 3.1 Standards 轴（仓库规范违背 & Fowler 代码坏味道基线）

| 编号 | 级别 | 类型 | 位置 | 问题与依据 | 建议 |
|---|---|---|---|---|---|
| R4-ST01 | S1 阻断 | 规范违背（强验证/不可静态解析） | `data/sources/whitelist-global.yaml:118-134`（`global-clio-ai-blog`） | `fetch_mode: static_html`，`entry_url: https://www.clio.com/blog/topic/ai/`。实测 3 种 UA（Chrome/Windows/curl）均返回 **403**、约 5.6 KB “Just a moment...”（Cloudflare challenge），无正文/文章列表。`verification_note` 却写“实测公开静态列表可读（2026-10/11 更新）”，不可复现。违反标准 v1.1 §1 的“严禁强验证”红线，以及 `static_html` 必须可静态解析的抓取模式约定。 | 删除/替换该源，或改用其公开 RSS/可匿名访问的官方入口；若必须用浏览器渲染，应新增明确的浏览器模式/适配器并重新审计，不能以 `static_html` 声明。同步修正 `verification_note`。 |
| R4-ST02 | S2 重要 | 规范违背（反爬/UA 敏感） | `data/sources/whitelist-global.yaml:174-190`（`legal-it-insider`） | `fetch_mode: static_html`，`entry_url: https://legaltechnology.com/`。浏览器 UA 实测 200、约 3 KB、75 字、0 链接，标题 “Bot Verification”；改用 `curl/8.0` 或 Googlebot UA 才返回约 300 KB 完整页面。`verification_note` 的“实测公开静态列表可读（2026-11-25）”未注明 UA/反爬条件。该源对普通采集 UA 不可解析，且依赖特定 UA 规避反爬存在稳定性与合规风险。 | 改用稳定的公开 feed/文章索引；或明确记录允许的 UA/访问条件并由 Human 决定；不得把“特定 UA 可绕过 Bot Verification”写成“公开静态可读”。 |
| R4-ST03 | S2 重要 | 规范违背（合并就绪性） | PR #48 当前状态 | `baseRefOid=21d24da`，main 已到 `831095f`（PR #47 已合并）；`mergeStateStatus: DIRTY`、`mergeable: CONFLICTING`。`package.json`、`package-lock.json`、`THIRD_PARTY_NOTICES.md` 三处冲突（本地 `git merge origin/main` 复现）。PR body 已写明 R4 后 rebase，但当前 head 不能直接合并。 | 由 Owner 在 R4 后 rebase 到最新 main、保留 ajv/ajv-formats/js-yaml、重生成 lock、重编号 notices，复跑两套测试后再交 Human。 |
| R4-ST04 | S2 重要 | 规范违背（测试未覆盖可解析性） | `tests/sources/whitelist.test.mjs:49-63` | v1.1 新增的断言仍只检查 `fetch_mode` 与 URL 子串；没有验证 `static_html` 是否真有正文/列表、RSS/Atom 是否有条目、JSON 是否有 items。因此 Clio 403 和 Legal IT Bot Verification 仍能让测试 5/5 通过。 | 增加轻量契约/冒烟测试（fixture 或可选网络标记），至少检查 HTML 正文/链接、RSS/Atom 条目数、AIHOT items；对反爬失败建立已知例外清单。 |
| R4-ST05 | S3 建议 | 规范违背（配比下界未机器化） | `docs/sources/whitelist-admission-standard.md:11`；`tests/sources/whitelist.test.mjs:54-64` | 标准要求每轨合规哨兵 **15%–25%**；测试只断言 `>=1` 且 `<=25%`。当前 CN 2/12=16.7%、Global 3/14=21.4% 合规，但 1/12=8.3% 也会通过。 | 测试增加 `>=0.15` 下界；或把“2–3 个”与比例同时断言。 |
| R4-ST06 | S3 建议 | 规范违背（入口不是更新源） | `cn-pkulaw-mcp`、`cn-tongyi-farui` | 两源为产品落地页/官方文档，实测静态可解析，但不是按日更新的文章列表；可能长期无新条目，不能支撑“效率雷达”的日更节奏。 | 由 Human/采集器确认其更新频率与可提取条目；若只是产品介绍页，降为参考源或补充其更新日志/博客入口。 |
| R4-ST07 | S3 建议 | 规范违背（验证记录不可复现） | `global-clio-ai-blog`、`legal-it-insider` 的 `verification_note` | 两条 note 都写“实测公开静态列表可读”，但未记录 UA、HTTP 状态、反爬条件；Clio 完全不可读、Legal IT 依赖非浏览器 UA。与 `AGENTS.md` 6.4/10.9 的“如实记录、不编造验证结果”不符。 | 记录完整命令/UA/状态/内容长度；失败或条件性成功必须写明；不要把浏览器人工访问结果写成 `static_html` 可采集。 |
| R4-ST08 | S3 建议 | 规范违背（并行合并/许可编号） | `THIRD_PARTY_NOTICES.md` | 对 `main@21d24da` 零删行（R4 实测 0 删除），但 main 已含 PR #47 的 ajv 行；rebase 后必须把 js-yaml 重编号为 14/`### 6.`，否则冲突/重号。 | 按 PR body 步骤 rebase 后重编号；复跑 `npm audit` 与两套测试。 |

### 3.2 Spec 轴（原 Issue/任务书遗漏、偏差与范围蔓延）

| 编号 | 级别 | 类型 | 位置 | 问题与原需求引用 | 建议 |
|---|---|---|---|---|---|
| R4-SP01 | S2 重要 | 偏差（DoD “可采集”未成立） | 26 条白名单 | Issue #40 要求每条源“实测可访问”并经审计；v1.1 的 26 条中，Clio 不可静态解析、Legal IT 仅在非浏览器 UA 下可解析。DoD D01/D03 的“无强验证/可采集”在这两条上不成立。 | 修复 R4-ST01/02 后再复审；若保留，必须在标准中明确例外与采集适配器，并由 Human 决定是否接受。 |
| R4-SP02 | S3 建议 | 遗漏（学术类入口） | `arxiv-cs-ai-rss` | 学术类仍只有 arXiv；顶会/核心期刊入口未补，标准 v1.1 仍把 `academic_paper` 作为七类之一。 | 由 Human 指定具体顶会/期刊后补入，或把学术类降为“预印本”并写明范围。 |
| R4-SP03 | S3 建议 | 偏差（源组合的实务相关性） | `cn-sspai-home`、`cn-ruanyifeng-blog` | 两源为通用效率/科技内容，非法律 AI 专项；与“法律人的 AI 实务效率雷达”定位存在相关性风险。`default_categories` 仅标“实务与工具”可能引入噪音。 | 由 Human 评估是否保留；若保留，建议在采集/分类阶段加法律 AI 关键词过滤，或在标准中说明其“效率工具”定位。 |
| R4-SP04 | S3 建议 | 偏差（法律 AI 厂商覆盖） | `global-clio-ai-blog` | v1.1 将 Clio 列为 4 家一线法律 AI 厂商之一；Clio 入口不可静态解析，实际厂商覆盖降为 3 家，削弱 v1.1 的核心配比目标。 | 替换为 Clio 可匿名访问的官方 RSS/博客入口，或补入另一家可验证厂商；修复后重算配比。 |

## 四、证据与红线核验

- **命令与 commit 对应**：是。所有命令在 `pr48r4` worktree 的 `9d5e63b` 上执行；`npm ci` 安装 45 个包；`node --test tests/sources/*.test.mjs` 为 **5 pass / 0 fail**；`npm audit --registry=https://registry.npmjs.org` 为 **0 vulnerabilities**。
- **26 条入口**：25 条 HTTP 200，1 条 403（Clio）；24 条在浏览器 UA 下可静态解析，1 条仅非浏览器 UA 可解析（Legal IT），1 条不可解析（Clio）。所有 `expected_domain` 与入口主机名一致，协议均为 `https`。
- **`fetch_mode` 一致性**：`rss` 源（Artificial Lawyer、LawSites、arXiv）均为 XML `<rss>`，条目数 10/100/398；`atom` 源（CourtListener）为 `<feed>`、20 条；`discovery_api`（AIHOT）为 JSON、50 条 items、含 `links.original`；`static_html` 均为 `text/html`，但 Clio/Legal IT 的内容不可用/条件可用。
- **静态可解析性**：未发现 `#app`/`#root` 空壳；`cn-junhe-reviews`（1087 字、88 链接）、`cn-ruanyifeng-blog`（782 字、36 链接）、`uk-ico-news`（1205 字、43 链接）等虽正文较短，但有明确列表/链接，判定可解析。Clio 403 与 Legal IT Bot Verification 是例外。
- **许可**：`git diff 21d24da..9d5e63b -- THIRD_PARTY_NOTICES.md` 删除行为 **0**；js-yaml 许可链接 `5.5.0` 实测 200；45 包许可分布与 notices 一致；`npm audit` 0。
- **PR #47 夹具对齐**：main 夹具 `source_id` 为 `uk-ico-news`、`arxiv-cs-ai-rss`、`thomson-reuters-institute`；v1.1 两份 YAML 全部包含，测试也有断言，**通过**。
- **合并状态**：PR #48 当前 `mergeStateStatus: DIRTY`、`mergeable: CONFLICTING`；本地 `git merge origin/main` 在 `package.json`、`package-lock.json`、`THIRD_PARTY_NOTICES.md` 三处冲突；PR body 已写 R4 后 rebase，但 head 当前不可直接合并。
- **CI**：`gh pr checks 48` 为 `no checks reported`；仓库无 `.github/workflows`；PR body 已写“CI 未触发”。
- **冻结基线 / 密钥 / AI 初稿**：未改 `README.md`、`ROADMAP.md`；未发现密钥、账号或读者数据；本 PR 不含资讯正文。

## 五、建议结论

- **单行汇总**：Standards 轴 8 项（最重：`R4-ST01 S1` Clio Cloudflare 403）｜Spec 轴 4 项（最重：`R4-SP01 S2` 两条源不可采集）。
- **结论**：**需修改**。v1.1 的选源配比与测试升级方向成立，`THIRD_PARTY` 零删行与 PR #47 夹具对齐也通过；但 Clio 403、Legal IT 的 Bot Verification 违反“无强验证/static_html 可解析”要求，且当前 PR 与 main 冲突，不能直接合并。修复后需 R5 增量复审。

本意见只构成证据，不自动产生权限；合并与最终决定属于 Human Maintainer。

## 六、Human 决策清单

- **工作目标**：决定是否接受 R4 “需修改”结论；决定 Clio / Legal IT 是否保留或替换；决定 v1.1 的源组合（含通用效率媒体、学术类）是否准入。
- **工作链接**：[PR #48](https://github.com/fitalex/LexAIDaily/pull/48)、[Issue #40](https://github.com/fitalex/LexAIDaily/issues/40)、[Spec #38](https://github.com/fitalex/LexAIDaily/issues/38)；R4 归档 permalink/blob SHA 见 PR #48 通知评论。
- **执行步骤**：
  1. [ ] 阅读 R4 报告，确认 Clio 403 与 Legal IT Bot Verification 的处理方式（替换/移除/新增浏览器适配器）。
  2. [ ] 决定 `cn-sspai-home` / `cn-ruanyifeng-blog` 与 arXiv-only 学术类是否保留，或补充更贴近法律 AI 实务的源。
  3. [ ] 要求 Owner 修复 R4-ST01/02、R4-ST03（rebase 冲突）并更新 `verification_note`；修复后由 DSH 做 R5。
  4. [ ] 合并前按 PR body 执行 #47→#48 rebase、lock 重生成、notices 重编号，复跑两套测试。
  5. [ ] 核对 R4 归档文件与 PR 评论原文、blob SHA 一致后，再决定合并。
- **边界**：AI 不得代签、代批、自动合并；本报告与 PR 评论只构成证据，不构成 Human 批准。
