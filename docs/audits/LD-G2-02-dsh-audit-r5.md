# 复核与审计报告｜LD-G2-02（R5 增量复审）

- 类型：独立审计（R5 增量复审，`AGENTS.md` 6.1(b)(d)(e)、6.2）
- 出具者：DeepSeek Harness｜日期：2026-11-27
- 审计对象：[PR #54](https://github.com/fitalex/LexAIDaily/pull/54)（`gemini/ld-g2-02-source-whitelist-r5`，v1.2 无冲突定版，替代 #48）｜关联 Issue：[#40](https://github.com/fitalex/LexAIDaily/issues/40)｜基准 commit：`831095f`（`main`）｜被审 head：`3f8428ac13f4f2409086a20e693b783902ba6a6f`
- R4 报告：[LD-G2-02-dsh-audit-r4.md](https://github.com/fitalex/LexAIDaily/blob/b3901aeb743b4f9e8261c2c2d34998de72bb76ed/docs/audits/LD-G2-02-dsh-audit-r4.md)（blob `9f39c51590324ee1f140b1445aa07a767875a448`，结论“需修改”）
- 检查范围：`main@831095f..3f8428a` 全部 19 个变更文件（+2921/−2）；v1.2 双轨 26 条源（12 CN + 14 Global）、准入标准、共享校验器、可解析性冒烟脚本、`test:contracts` / `test:sources` / `smoke:sources`、`THIRD_PARTY_NOTICES.md` 对 `main@831095f` 的增量、`package-lock.json` 51 包、`npm audit`、PR 合并状态、PR #47 夹具 `source_id` 对齐。
- 未检查项：未判定各信源可信度、编辑质量或是否应入库（`AGENTS.md` 明确由 Human 决定）；未使用无头浏览器验证 Cloudflare/JS challenge；未实现或运行完整采集适配器；未验证 Gate 3 Web/公众号消费端；未逐份阅读 51 个锁文件依赖的 LICENSE 原文；未执行合并（PR 当前已 CLEAN，合并属 Human）。

## 一、DoD 逐项核对

| 序号 | 标准（Issue #40） | 结果 | 证据 |
|---|---|---|---|
| D01 | 两份 YAML 覆盖五大内容分类与七类信源主体，均不含二手搬运号或需登录/强验证码站点 | 达成 | 12 CN + 14 Global，五维/七类覆盖；Clio 与 Legal IT 已移除，替换为 `openai-news-rss` / `stanford-hai-news`；未发现需登录源 |
| D02 | `aihot.news/api/v1` 标为 `discovery_only: true` 并载明 `links.original` 回溯红线 | 达成 | `aihot-news-discovery` 标 `discovery_api`、`discovery_only: true`；smoke 实测 200 JSON、50 条 items、含 `links.original`；Gate 3/4 书面许可门禁保留 |
| D03 | 每条信源均附实测可访问的一手入口 URL、`expected_domain` 与抓取模式标识，经 DSH 独立审计后交 Human 批准 | 未达成 | `npm run smoke:sources` 两次运行分别 **23/26**、**22/26**，退出码 1；`checkPayloadParsability` 对两条正常源误报 Cloudflare，且无重试；不能作为“26 源全部可解析”的通过证据（R5-ST01/02/03） |

## 二、R4 整改核验

| R4 编号 | R4 级别 | R5 状态 | 证据 |
|---|---|---|---|
| R4-ST01 | S1 | **已关闭** | `global-clio-ai-blog` 已移除，替换为 `openai-news-rss`（`https://openai.com/news/rss.xml`）；smoke 实测 200 RSS、1430 条 item |
| R4-ST02 | S2 | **已关闭** | `legal-it-insider` 已移除，替换为 `stanford-hai-news`（`https://hai.stanford.edu/news`）；smoke 实测 200、311 KB、107 链接 |
| R4-ST03 | S2 | **已关闭** | PR #54 基于 `main@831095f`，`mergeable: MERGEABLE`、`mergeStateStatus: CLEAN`；package-lock 51 包；notices 顺延为第 14 项 / `### 6.`，对 main 零删行 |
| R4-ST04 | S2 | **未闭环** | 新增 `smoke:sources` 但两次运行均失败（23/26、22/26）；`checkPayloadParsability` 对 `cn-kwm-cli`、`cn-ruanyifeng-blog` 误报，冒烟无重试（R5-ST01/02/03） |
| R4-ST05 | S3 | **已修复** | 测试锁定每轨哨兵比例 `>=0.15 && <=0.25`（tests 第 50–68 行）；当前 CN 2/12=16.7%、Global 3/14=21.4% |
| R4-ST06 | S3 | **仍开** | `cn-pkulaw-mcp`、`cn-tongyi-farui` 仍为产品落地/文档页，未验证按日更新；`cn-sspai-home`、`cn-ruanyifeng-blog` 仍为通用效率/科技内容 |
| R4-ST07 | S3 | **已关闭（源移除）** | Clio/Legal IT 两条不可复现的 `verification_note` 随源移除；替换源的 smoke 实测记录成立 |
| R4-ST08 | S3 | **已关闭** | notices 对 `main@831095f` 零删行；`### 6.` / 第 14 项重编号完成；package-lock 51 包 |
| R4-SP01 | S2 | **已关闭** | Clio/Legal IT 移除；26 条源均可访问（smoke 的网络/误报问题另列）；DoD D03 的“可采集”不再有确定失效源 |
| R4-SP02 | S3 | **已关闭** | 学术类补入 `stanford-hai-news`，与 `arxiv-cs-ai-rss` 共同覆盖 |
| R4-SP03 | S3 | **仍开** | `cn-sspai-home`、`cn-ruanyifeng-blog` 仍属通用效率/科技内容，法律 AI 相关性需 Human 评估 |
| R4-SP04 | S3 | **已关闭** | Global `legal_ai_vendor` 为 Harvey、Legora、Thomson Reuters Legal 3 家；Clio 失效不再影响厂商配比 |

## 三、双轴发现（R5 新增/残留）

### 3.1 Standards 轴（仓库规范违背 & Fowler 代码坏味道基线）

| 编号 | 级别 | 类型 | 位置 | 问题与依据 | 建议 |
|---|---|---|---|---|---|
| R5-ST01 | S1 阻断 | 规范违背（必需验证命令失败） | `scripts/sources/smoke-check.mjs`；`package.json` 的 `smoke:sources` | 在 `3f8428a` 上执行 `npm run smoke:sources`：第一次 **23/26**（失败 `cn-spc-fabu`、`cn-kwm-cli`、`cn-ruanyifeng-blog`），第二次 **22/26**（额外 `us-courtlistener` 超时），两次退出码均为 1。R4-ST04 新增的“26 源可解析”门禁未通过，不能作为 R5 通过证据。 | 修复冒烟检测与重试后重跑，直到 26/26；把 smoke 结果作为 PR 验证表的一部分。 |
| R5-ST02 | S2 重要 | 规范违背（Cloudflare 检测误报） | `src/sources/validate-whitelist.mjs:215` | `checkPayloadParsability` 用包含 `just a moment`、`cf-browser-verification`、`challenge-platform` 的正则扫描整个 HTML；`cn-kwm-cli`（176 KB、123 链接、标题 China Law Insight）与 `cn-ruanyifeng-blog`（19 KB、36 链接、标题阮一峰的网络日志）都因页面含 1 处 `challenge-platform` 脚本而被误判为 Cloudflare 质询页，实际正文完整。 | 只在“标题/状态/正文长度”共同指向质询页时判定；不要因正常页面引用了 Cloudflare 脚本就失败；补真实页面回归夹具。 |
| R5-ST03 | S2 重要 | 规范违背（冒烟无重试/超时过紧） | `scripts/sources/smoke-check.mjs:17` | 单次 fetch 固定 15 秒、无重试。`cn-spc-fabu` 在 3 次定向 Node fetch 中出现 1 次 `fetch failed`（另两次 200/30 KB）；`us-courtlistener` 单测 3 次 200，但在第二次 smoke 中 15 秒超时。单次网络抖动即让整条 `smoke:sources` 失败。 | 增加 2–3 次有限重试与退避，区分“网络瞬时错误”和“源不可解析”；将超时按模式调高；在结果中标注重试次数。 |
| R5-ST04 | S2 重要 | 规范违背（单测与真实冒烟脱节） | `tests/sources/whitelist.test.mjs:137-...` | `checkPayloadParsability` 的 6 项测试全部使用人工构造字符串，6/6 通过；但没有覆盖真实页面中 Cloudflare 脚本误报、单次网络失败、大页面等场景，因此无法阻止 smoke 23/26 的回归。 | 将真实响应样本（脱敏/截断）纳入 fixture，或把 `smoke:sources` 的失败分类纳入测试；至少增加“正常页面含 challenge-platform 脚本”正例。 |
| R5-ST05 | S3 建议 | 规范违背（大 RSS/负载） | `openai-news-rss` | `openai.com/news/rss.xml` 实测 868 KB、1430 条 item；虽通过冒烟，但作为日更源会带来较大的抓取/解析/去重负载，且含大量非法律 AI 内容。 | 由采集器加关键词/分类过滤并限制处理条数；或在标准中说明该源的使用方式。 |
| R5-ST06 | S3 建议 | 规范违背（入口不是更新源） | `cn-pkulaw-mcp`、`cn-tongyi-farui` | 两源为产品落地页/官方文档，smoke 可解析，但不是按日更新的文章列表；可能长期无新条目。 | 由 Human/采集器确认更新频率；若只是产品介绍页，降为参考源或补充其更新日志/博客入口。 |
| R5-ST07 | S3 建议 | 规范违背（合并后许可编号） | `THIRD_PARTY_NOTICES.md` | 对 `main@831095f` 零删行；`### 6.` / 第 14 项已完成；但 PR #54 与 #48 均改 notices，若后续再 rebase 需复核重编号。 | 合并前再次运行 `git diff main -- THIRD_PARTY_NOTICES.md` 与 51 包 audit；保持 pin。 |

### 3.2 Spec 轴（原 Issue/任务书遗漏、偏差与范围蔓延）

| 编号 | 级别 | 类型 | 位置 | 问题与原需求引用 | 建议 |
|---|---|---|---|---|---|
| R5-SP01 | S2 重要 | 偏差（DoD D03 未成立） | `smoke:sources` 结果 | Issue #40 要求每条源经实测可访问并经 DSH 审计；R5 的必需命令 `smoke:sources` 两次均失败（23/26、22/26），DoD D03 的“可采集/可解析”未取得通过证据。 | 修复 R5-ST02/03 后重跑 26/26；在 PR 验证表记录真实输出与重试情况。 |
| R5-SP02 | S3 建议 | 偏差（源组合的实务相关性） | `cn-sspai-home`、`cn-ruanyifeng-blog` | 两源为通用效率/科技内容，非法律 AI 专项；`default_categories` 仅标“实务与工具”可能引入噪音。 | 由 Human 评估；若保留，建议采集/分类阶段加法律 AI 关键词过滤。 |
| R5-SP03 | S3 建议 | 偏差（替换源的相关性） | `openai-news-rss` | OpenAI News 覆盖面广、1430 条 item，含企业级 Agent 与法律应用，但同时有大量非法律内容；替代 Clio 后 Global `legal_ai_vendor` 仍是 3 家（Harvey/Legora/TR），但该源本身不是法律 AI 厂商源。 | 由 Human 确认是否接受其作为“办公 AI/Agent 工作流”源；必要时加法律关键词过滤或另选法律 AI 厂商源。 |
| R5-SP04 | S3 建议 | 偏差（学术类入口） | `stanford-hai-news`；`arxiv-cs-ai-rss` | 学术类已从单一 arXiv 增至 arXiv + Stanford HAI，但仍无顶会/核心期刊入口；标准 v1.2 已把学术类定义为预印本/研究机构，需 Human 决定是否继续补。 | 若不补，接受当前范围；若补，另立任务/由 Human 指定。 |

## 四、证据与红线核验

- **命令与 commit 对应**：是。所有命令在 `pr54` worktree 的 `3f8428a` 上执行；`npm ci` 安装 **51** 个包。
- **`npm run test:contracts`**：**12 pass / 0 fail**（含 PR #47 契约回归）。
- **`npm run test:sources`**：**6 pass / 0 fail**（含 15%–25% 配比、PR #47 夹具 ID、T2 高风险、parsability 合成用例）。
- **`npm run smoke:sources`**：第一次 **23/26**、第二次 **22/26**，两次均 exit 1。失败项：
  - `cn-spc-fabu` status=0 “fetch failed”（定向 Node fetch 3 次：200 / ERR / 200；源本身可访问，冒烟无重试）
  - `cn-kwm-cli` 200 / 176 KB / 123 链接，因 `challenge-platform` 误报
  - `cn-ruanyifeng-blog` 200 / 19 KB / 36 链接，因 `challenge-platform` 误报
  - `us-courtlistener` 第二次 15 秒超时（定向 3 次均 200；单次抖动）
- **`THIRD_PARTY_NOTICES.md` 对 `main@831095f`**：删除行 **0**；js-yaml 行顺延为第 14 项、`### 6.`；51 包许可分布与 notices 一致。
- **`package-lock.json`**：51 个包；`npm audit --omit=dev --registry=https://registry.npmjs.org` 为 **0 vulnerabilities**。
- **PR 合并状态**：`mergeable: MERGEABLE`、`mergeStateStatus: CLEAN`；base `831095f`，无冲突。
- **PR #47 夹具**：`uk-ico-news`、`arxiv-cs-ai-rss`、`thomson-reuters-institute` 全部存在；测试断言通过。
- **CI**：`gh pr checks 54` 为 `no checks reported`；仓库无 `.github/workflows`；PR body 已写“CI 未触发”。
- **冻结基线 / 密钥 / AI 初稿**：未改 `README.md`、`ROADMAP.md`；未发现密钥、账号或读者数据；本 PR 不含资讯正文。
- **R1–R4 归档**：未修改；R5 另存新文件。

## 五、建议结论

- **单行汇总**：Standards 轴 7 项（最重：`R5-ST01 S1` smoke 两次失败）｜Spec 轴 4 项（最重：`R5-SP01 S2` DoD D03 未成立）。
- **结论**：**需修改**。v1.2 已正确移除 Clio/Legal IT，PR 也无冲突，`test:contracts` / `test:sources`、51 包 audit、notices 零删行与夹具对齐均通过；但 `npm run smoke:sources` 两次均失败，且失败包含两条正常页面的误报与零重试，不能作为 26 源可解析的通过证据。修复后需 R6 增量复审。

本意见只构成证据，不自动产生权限；合并与最终决定属于 Human Maintainer。

## 六、Human 决策清单

- **工作目标**：决定是否接受 R5 “需修改”结论；决定 smoke 误报/重试修复是否作为合并前必须项；确认 `cn-sspai-home`、`cn-ruanyifeng-blog`、`openai-news-rss` 的源定位。
- **工作链接**：[PR #54](https://github.com/fitalex/LexAIDaily/pull/54)、[Issue #40](https://github.com/fitalex/LexAIDaily/issues/40)、[Spec #38](https://github.com/fitalex/LexAIDaily/issues/38)；R5 归档 permalink/blob SHA 见 PR #54 通知评论。
- **执行步骤**：
  1. [ ] 阅读 R5 报告，确认 smoke 23/26、22/26 的失败是否作为合并前必须修复项。
  2. [ ] 要求 Owner 修复 R5-ST02（正常页面 Cloudflare 误报）与 R5-ST03（重试/超时），重跑至 26/26。
  3. [ ] 决定 `cn-sspai-home` / `cn-ruanyifeng-blog` 与 `openai-news-rss` 的源定位；决定是否补顶会/期刊入口。
  4. [ ] 核对 R5 归档文件与 PR 评论原文、blob SHA 一致后，再决定合并。
- **边界**：AI 不得代签、代批、自动合并；本报告与 PR 评论只构成证据，不构成 Human 批准。
