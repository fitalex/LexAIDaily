# 复核与审计报告｜LD-G2-02（R6 增量复审）

- 类型：独立审计（R6 增量复审，`AGENTS.md` 6.1(b)(d)(e)、6.2）
- 出具者：DeepSeek Harness｜日期：2026-11-27
- 审计对象：[PR #54](https://github.com/fitalex/LexAIDaily/pull/54)（`gemini/ld-g2-02-source-whitelist-r5`，v1.2）｜关联 Issue：[#40](https://github.com/fitalex/LexAIDaily/issues/40)｜基准 commit：`831095f`（`main`）｜被审 head：`c7949a3d4d43997cc512697be867c116ec0f311b`
- R5 报告：[LD-G2-02-dsh-audit-r5.md](https://github.com/fitalex/LexAIDaily/blob/d0f11721edf598e0f64d6b3280fc6498b025ad00/docs/audits/LD-G2-02-dsh-audit-r5.md)（blob `214b4f6bdff5f6497892a161da0fd531f3a77420`，结论“需修改”）
- 检查范围：`3f8428a..c7949a3` 全部 3 个变更文件（+166/−62）；`test:contracts` / `test:sources` / `smoke:sources`（两次）、51 包 `package-lock.json`、`npm audit`、`THIRD_PARTY_NOTICES.md` 对 `main@831095f` 的增量、PR 合并状态、PR #47 夹具 `source_id` 对齐。R1–R5 报告未改动。
- 未检查项：未判定各信源可信度、编辑质量或是否应入库（`AGENTS.md` 明确由 Human 决定）；未使用无头浏览器验证 Cloudflare/JS challenge；未实现或运行完整采集适配器；未验证 Gate 3 Web/公众号消费端；未逐份阅读 51 个锁文件依赖的 LICENSE 原文；未执行合并（PR 当前 CLEAN，合并属 Human）。

## 一、DoD 逐项核对

| 序号 | 标准（Issue #40） | 结果 | 证据 |
|---|---|---|---|
| D01 | 两份 YAML 覆盖五大内容分类与七类信源主体，均不含二手搬运号或需登录/强验证码站点 | 达成 | 12 CN + 14 Global；五维/七类覆盖；Clio、Legal IT 已移除；替换的 `openai-news-rss`、`stanford-hai-news` 在 smoke 中通过 |
| D02 | `aihot.news/api/v1` 标为 `discovery_only: true` 并载明 `links.original` 回溯红线 | 达成 | `aihot-news-discovery` 标 `discovery_api`、`discovery_only: true`；smoke 200 JSON、50 条 items、含 `links.original` |
| D03 | 每条信源均附实测可访问的一手入口 URL、`expected_domain` 与抓取模式标识，经 DSH 独立审计后交 Human 批准 | 达成 | `npm run smoke:sources` 第二次 **26/26 passed、exit 0**；第一次 25/26（`cn-cac-wxzw` 瞬时 fetch failed，定向 5/5 均 200、第二次 26/26）；`expected_domain`/HTTPS、`fetch_mode` 均一致 |

## 二、R5 整改核验

| R5 编号 | R5 级别 | R6 状态 | 证据 |
|---|---|---|---|
| R5-ST01 | S1 | **已修复（有 S3 稳定性观察）** | `smoke:sources` 第二次 **26/26**、exit 0；第一次 25/26，仅 `cn-cac-wxzw` 3 次 fetch failed；定向 5 次 Node fetch 与 curl 均 200；第二次通过。属瞬时网络，不是确定性源失效 |
| R5-ST02 | S2 | **已修复** | `checkPayloadParsability` 改为“标题含质询文案，或含质询标记且链接 <10”才判拦截；`cn-kwm-cli`（176 KB/123 链接）与 `cn-ruanyifeng-blog`（19 KB/36 链接）本次均 PASS |
| R5-ST03 | S2 | **已修复** | `probeSource` 超时 25s、最多 2 次重试（共 3 次，线性退避）；本次 `cn-spc-fabu` attempts=2 后 PASS；`us-courtlistener` attempts=1 PASS |
| R5-ST04 | S2 | **已修复** | `tests/sources` 扩至 **7/7**，新增“正常页面含被动 Cloudflare 脚本应放行”与 `probeSource` 瞬时重试/403 立即停止的确定性单测 |
| R5-ST05 | S3 | **仍开** | `openai-news-rss` 868 KB、1430 条 item，含大量非法律 AI 内容；建议采集/分类阶段过滤 |
| R5-ST06 | S3 | **仍开** | `cn-pkulaw-mcp`、`cn-tongyi-farui` 为产品落地/文档页；`cn-sspai-home`、`cn-ruanyifeng-blog` 为通用效率/科技内容，需 Human 评估 |
| R5-ST07 | S3 | **已关闭** | notices 对 `main@831095f` 零删行；js-yaml 为第 14 项 / `### 6.`；51 包 audit 0 |
| R5-SP01 | S2 | **已关闭** | 第二次 smoke 26/26；DoD D03 取得通过证据；第一次失败为瞬时网络 |
| R5-SP02 | S3 | **仍开** | 通用效率/科技媒体定位仍需 Human 决定 |
| R5-SP03 | S3 | **仍开** | `openai-news-rss` 的相关性/过滤策略需 Human 决定 |
| R5-SP04 | S3 | **仍开** | 学术类仍为 arXiv + Stanford HAI，无顶会/核心期刊入口 |

## 三、双轴发现（R6 新增/残留）

### 3.1 Standards 轴（仓库规范违背 & Fowler 代码坏味道基线）

| 编号 | 级别 | 类型 | 位置 | 问题与依据 | 建议 |
|---|---|---|---|---|---|
| R6-ST01 | S3 建议 | 规范违背（冒烟网络稳定性） | `scripts/sources/smoke-check.mjs:23-25`；两次运行 | 第一次 `smoke:sources` 25/26：`cn-cac-wxzw` 连续 3 次 `fetch failed`；定向 5 次 Node fetch 均 200，第二次 smoke 26/26。属网络瞬时抖动，非确定性源失效；但说明 3 次重试仍可能被短时网络故障击穿，单次结果不宜作为唯一“26/26”证据。 | 审计/CI 记录至少两次运行与 `attempts`；可考虑对纯网络错误增加第 4 次或更长退避，但不阻断本次合并。 |
| R6-ST02 | S3 建议 | 规范违背（Cloudflare 标题判定偏宽） | `src/sources/validate-whitelist.mjs:220-225` | `hasCfChallengeTitle` 对标题中的 `cloudflare` 一词直接判拦截；若正常页面标题含 “Cloudflare”（如厂商博客/文档），可能误报。当前 26 源均通过，属潜在风险。 | 仅匹配 “Just a moment... / Attention Required!” 等质询标题，或结合正文长度/链接数；补一个“标题含 Cloudflare 的正常页面”正例。 |
| R6-ST03 | S3 建议 | 规范违背（Bot Verification 判定） | `src/sources/validate-whitelist.mjs:228` | Bot Verification/CAPTCHA 仅在 `linkCount < 10` 时判失败；若拦截页附带 ≥10 个站内链接，可能漏判。当前 26 源无误报/漏报。 | 结合标题/正文长度/状态码判定，不仅依赖链接数；补 10+ 链接的负例。 |
| R6-ST04 | S3 建议 | 规范违背（大 RSS/负载） | `openai-news-rss` | 实测 868 KB、1430 条 item；虽通过 smoke，但作为日更源会带来较大抓取/解析/去重负载，且含大量非法律 AI 内容。 | 采集器加关键词/分类过滤与条数上限；在标准中说明使用方式。 |
| R6-ST05 | S3 建议 | 规范违背（入口不是更新源） | `cn-pkulaw-mcp`、`cn-tongyi-farui` | 两源为产品落地页/官方文档，smoke 可解析，但不是按日更新的文章列表。 | 确认更新频率；若只是产品介绍，降为参考源或补充更新日志入口。 |
| R6-ST06 | S3 建议 | 规范违背（通用媒体相关性） | `cn-sspai-home`、`cn-ruanyifeng-blog` | 两源为通用效率/科技内容，非法律 AI 专项；`default_categories` 仅标“实务与工具”可能引入噪音。 | 由 Human 评估；若保留，采集/分类阶段加法律 AI 关键词过滤。 |

### 3.2 Spec 轴（原 Issue/任务书遗漏、偏差与范围蔓延）

| 编号 | 级别 | 类型 | 位置 | 问题与原需求引用 | 建议 |
|---|---|---|---|---|---|
| R6-SP01 | S3 建议 | 偏差（源组合的相关性） | `cn-sspai-home`、`cn-ruanyifeng-blog`、`openai-news-rss` | v1.2 以“法律人 AI 实务效率雷达”为核心；三条替换/保留源分别是通用效率、通用科技与 OpenAI 全量新闻，法律 AI 相关性需 Human 判断。 | 由 Human 决定保留/替换；若保留，建议在采集/分类层加法律 AI 过滤，并在标准注释其定位。 |
| R6-SP02 | S3 建议 | 遗漏（学术类入口） | `arxiv-cs-ai-rss`、`stanford-hai-news` | 学术类仍为 arXiv + Stanford HAI，无顶会/核心期刊入口；标准 v1.2 已把范围写明为预印本/研究机构，需 Human 决定是否继续补。 | 若不补，接受当前范围；若补，另立任务/由 Human 指定。 |

## 四、证据与红线核验

- **命令与 commit 对应**：是。所有命令在 `pr54r6` worktree 的 `c7949a3` 上执行；`npm ci` 安装 **51** 个包。
- **`npm run test:contracts`**：**12 pass / 0 fail**。
- **`npm run test:sources`**：**7 pass / 0 fail**（新增 parsability/重试回归）。
- **`npm run smoke:sources`**：
  - 第一次：**25/26**、exit 1；仅 `cn-cac-wxzw` `status=0 attempts=3` “fetch failed”。
  - 第二次：**26/26**、exit 0；`cn-spc-fabu` attempts=2，其余 attempts=1。
  - 定向 `cn-cac-wxzw`：5 次 Node fetch 均 200（1.9s/0.7s/0.7s/1.2s/0.4s），curl 200；判定为瞬时网络，非源失效。
  - `cn-kwm-cli`、`cn-ruanyifeng-blog` 本次均 PASS，R5 的 Cloudflare 误报已消除。
- **`THIRD_PARTY_NOTICES.md` 对 `main@831095f`**：删除行 **0**；js-yaml 第 14 项 / `### 6.`；51 包许可分布一致。
- **`package-lock.json`**：51 个包；`npm audit --omit=dev --registry=https://registry.npmjs.org` **0 vulnerabilities**。
- **PR 合并状态**：`mergeable: MERGEABLE`、`mergeStateStatus: CLEAN`（base `831095f`）。
- **PR #47 夹具**：`uk-ico-news`、`arxiv-cs-ai-rss`、`thomson-reuters-institute` 全部存在。
- **CI**：`gh pr checks 54` 为 `no checks reported`；仓库无 `.github/workflows`；PR body 已写“CI 未触发”。
- **冻结基线 / 密钥 / AI 初稿**：未改 `README.md`、`ROADMAP.md`；未发现密钥、账号或读者数据；本 PR 不含资讯正文。
- **R1–R5 归档**：未修改；R6 另存新文件。

## 五、建议结论

- **单行汇总**：Standards 轴 6 项（全部 S3）｜Spec 轴 2 项（全部 S3）；无 S1/S2 残留。
- **结论**：**通过**。R5 的 S1/S2（smoke 门禁、Cloudflare 误报、无重试、测试脱节）已闭环；第二次 `smoke:sources` 26/26，首次仅 `cn-cac-wxzw` 瞬时失败且定向 5/5 与复跑均通过；`test:contracts` 12/12、`test:sources` 7/7、51 包 audit 0、notices 零删行、PR CLEAN 全部满足。剩余为 S3/人工决策项，不阻断合并。

本意见只构成证据，不自动产生权限；合并与最终决定属于 Human Maintainer。

## 六、Human 决策清单

- **工作目标**：决定是否接受 R6 “通过”结论并合并 PR #54；决定通用效率/科技媒体、OpenAI 全量新闻与学术类入口的取舍。
- **工作链接**：[PR #54](https://github.com/fitalex/LexAIDaily/pull/54)、[Issue #40](https://github.com/fitalex/LexAIDaily/issues/40)、[Spec #38](https://github.com/fitalex/LexAIDaily/issues/38)；R6 归档 permalink/blob SHA 见 PR #54 通知评论。
- **执行步骤**：
  1. [ ] 阅读 R6 报告，确认第二次 smoke 26/26 与首次 25/26 的瞬时差异可接受。
  2. [ ] 决定 `cn-sspai-home` / `cn-ruanyifeng-blog` / `openai-news-rss` 的源定位；决定是否补顶会/期刊入口。
  3. [ ] 合并前复核 `THIRD_PARTY_NOTICES.md` 第 14 项 / `### 6.` 与 51 包 audit；确认 PR CLEAN。
  4. [ ] 核对 R6 归档文件与 PR 评论原文、blob SHA 一致后，再决定合并。
- **边界**：AI 不得代签、代批、自动合并；本报告与 PR 评论只构成证据，不构成 Human 批准。
