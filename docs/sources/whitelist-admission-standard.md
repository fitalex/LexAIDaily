# LexAIDaily 权威信源白名单准入与分级标准（v1.2｜法律人 AI 实务效率雷达定版）

- **任务编号**：`LD-G2-02`（父级 Spec #38 / 子 Issue #40）
- **核心定位**：**构建法律人的 AI 实务信息雷达，重点提供「如何使用 AI 提升法律工作效率」的一手实务信息源**。
- **架构依据**：`ADR-0003`（中国大陆与大陆以外双轨分域采集）、`GLOSSARY.md`（**白名单信源**定义）
- **配置文件**：`data/sources/whitelist-cn.yaml`（`region: cn`，12 源）与 `data/sources/whitelist-global.yaml`（`region: global`，14 源），均由 `js-yaml` 读取并经 `src/sources/validate-whitelist.mjs` 执行严格键、配比与红线校验；在线可解析性由 `npm run smoke:sources`（`scripts/sources/smoke-check.mjs`）执行标准浏览器 UA 冒烟探测。

## 1. 选源配比原则（实务效率优先，合规哨兵克制）

为避免白名单滑向“纯政务/司法公报库”或“纯底层模型参数榜”，双轨均执行以下配比红线（已由单元测试机器化锁定）：
1. **合规哨兵克制占比（每轨 15%–25%）**：立法、监管与法院官网仅保留 2–3 个高信噪比合规哨兵（CN 2/12 = 16.7%，Global 3/14 = 21.4%），专门监测 AI 监管新规与司法红线，不堆砌无 AI 实务价值的常规政务发布页。
2. **实务提效与前沿源占比（每轨 ≥75%）**：重心集中在四类真正服务法律人用 AI 提效的一手源：
   - **法律 AI 产品与工具官方发布页/博客**（`legal_ai_vendor`）：Harvey AI、Legora、Thomson Reuters Legal (CoCounsel)、北大法宝 MCP、阿里云通义法睿；
   - **头部律所公开 AI 实务与合规专栏**（`law_firm_practice`）：金杜 China Law Insight、君合法评、汉坤观点；
   - **权威法律科技与效率实战媒体/研究**（`authoritative_media`）：Artificial Lawyer、LawSites、Thomson Reuters Institute、少数派、阮一峰科技周刊；
   - **办公/Agent 工作流一手技术博客与实证学术研究**（`official_tech_blog` / `academic_paper`）：Microsoft Copilot Blog（含 Copilot for Legal）、Anthropic Newsroom（含 Claude for Legal）、OpenAI News RSS、智谱/DeepSeek 更新日志、Stanford HAI（含法律 AI 实证评测）与 arXiv `cs.AI`。

## 2. 七类权威信源主体与准入标准

本白名单仅收录具备一手发布资质的权威机构与官方入口，按 `source_type` 分为七类：

| `source_type` | 中文名称 | 典型代表 | 一手判定标准 |
|---|---|---|---|
| `legal_ai_vendor` | 法律 AI / 律所工具产品官方源 | Harvey AI、Legora、Thomson Reuters Legal (CoCounsel)、北大法宝 MCP、阿里云通义法睿 | 法律科技厂商官方博客、产品更新日志、MCP/工作流文档与客户落地实务案例 |
| `law_firm_practice` | 头部律所公开实务专栏 | 金杜 China Law Insight、君合法评、汉坤观点 | 头部律所官网公开免登录的 AI 实务、数据合规与新规实操评述 |
| `authoritative_media` | 法律科技与效率实战媒体 | Artificial Lawyer、LawSites、Thomson Reuters Institute、少数派、阮一峰科技周刊（及带 `discovery_only` 隔离标记的辅助线索源） | 具独立采编、实测评测或原始调研能力的法律科技/AI 效率媒体与研究机构 |
| `official_tech_blog` | 办公 AI 与 Agent 工作流官方博客 | Microsoft Copilot Blog、Anthropic Newsroom、OpenAI News、智谱 AI 开放文档、DeepSeek 更新日志 | 直接影响法律人文档审阅、检索、Office 集成与 Agent 工作流的官方发布页 |
| `legislation_regulator` | 立法与监管合规哨兵 | 中央网信办、欧盟 AI 办公室、英国 ICO | 聚焦 AI 治理与数据合规红线的官方监管发布入口（每轨严格控制数量） |
| `court_judiciary` | 司法判例合规哨兵 | 最高人民法院、CourtListener（公开 Atom AI 判例订阅源） | 涉 AI 司法解释、典型案例与公开判例归档入口 |
| `academic_paper` | 前沿学术预印本与高校研究所 | arXiv（`cs.AI` 官方 RSS）、Stanford HAI | 论文预印本原始提交页、高校法律 AI 实证研究官方发布页 |

### 严禁收录红线（一票否决）
1. **严禁二手搬运号与内容农场**：不收录无独立信源的自媒体转载站、营销号或洗稿聚合页。
2. **严禁需登录态、API 鉴权凭据或强反爬拦截站点**：中国大陆与海外轨均只收录免登录、在标准浏览器 UA 下可稳定返回正文/列表/订阅流的公开入口；触发 Cloudflare 403 质询或 Bot Verification 拦截页的站点一律移出公网白名单（由 Wave 2 `#41` 外部扩展层按需处理）。
3. **严禁纯前端 SPA 空壳充当 `static_html`**：任何标记为 `static_html` 的入口，必须实测返回可静态解析的正文或文章列表 HTML（响应 ≥1500B 且含 ≥5 个有效链接），不得收录需无头浏览器渲染的空壳页或交互检索表单。

## 3. 权威分级（`authority_tier`）与高风险触发规则

| 等级 | 适用范围 | `high_risk_default` 默认值 | 人工终审要求 |
|---|---|---|---|
| `T1` | 立法机构、监管部门、法院及官方公报（合规哨兵） | **强制 `true`**（校验器机器化拦截） | 必核发布机构、日期、版本号与 `effective_status`（效力状态，契约侧已机器化校验） |
| `T2` | 法律 AI 厂商官方源、头部律所实务专栏、办公 AI 官方博客、学术机构/预印本、非营利公开法院文书平台（如 CourtListener） | 默认 `false`；**涉法院文书/立法监管的 `T2` 源（`court_judiciary` / `legislation_regulator`）强制 `true`**（校验器机器化拦截） | 核对产品功能事实、实务操作前提、核心数据指标或原始裁判链接 |
| `T3` | 权威法律科技媒体、AI 效率实战媒体、行业研究机构、辅助线索发现源 | `false` | 严格回溯一手原链；辅助线索源不得直接作为引用依据 |

## 4. 五维内容分类映射

每条信源通过 `default_categories` 标注其主要覆盖的官方五维分类（对齐 `ROADMAP.md`）：
- `实务与工具`（核心主轴）/ `模型与技术` / `监管与合规` / `判例与学术` / `行业与资本`

## 5. 辅助线索发现源合规红线与 Gate 3/4 商业化前置条件（`aihot.news/api/v1`）

`whitelist-cn.yaml` 收录 `aihot-news-discovery`（入口 `https://aihot.news/api/v1/items`，接口文档见 `https://aihot.news/en/agent?tab=api`）作为 **辅助线索发现源**（置于 CN 轨便于国内中文热点与大陆网络出口调度），强制遵守以下红线：
1. 配置必须显式标记 `discovery_only: true`、`fetch_mode: discovery_api` 与非空 `compliance_redline`。
2. 采集器仅允许读取 `links.original` 与事件热度字段，用于发现热点线索并**回溯至一手官方原链**独立抓取正文；契约校验入口（`LD-G2-01`）已机器化拒收指向 `aihot.news` 的 `source_url`。
3. **严禁直接搬运、改写或对外再分发 AIHOT 的摘要文本**。
4. **Gate 3/4 公开与商业化前置条件（强制门禁）**：AIHOT 官方条款明确“个人、非营利及组织内部使用免费；**面向公众的商业产品、付费服务、代理 API 与批量再分发须事先取得书面许可**”，且单 IP 速率限制约 60 req/min。在取得 AIHOT 书面许可前，本源**仅限内部试运行与研发验证**，Gate 3/4 对外公开或商业化上线前必须由 Human 决定取得书面授权或停用该源。

## 6. 失效源降级、可解析性冒烟与维护规则

- **可解析性冒烟测试**：执行 `npm run smoke:sources` 对全部 `active` 入口使用标准浏览器 UA 实测，自动拦截 HTTP 非 2xx、Cloudflare 质询、Bot Verification、SPA 空壳、空 RSS/Atom 或缺失 `links.original` 的异常源。
- `status: active`：正常调度采集。
- `status: degraded`：连续 3 次采集返回 HTTP 4xx/5xx、超时或解析为空时自动降级为 `degraded`，记录至 `*-meta.json` 并提示人工复核，不阻断同轨其他信源运行。
- `status: paused`：连续 7 天不可用、页面改版或新增强制登录/反爬拦截时置为 `paused`，须经人工确认后恢复或替换。
- **防域名劫持（`expected_domain`）**：每条白名单信源必须声明 `expected_domain`，且与 `entry_url` 主机名完全一致，用于约束抓取入口（文章一手原链域名作用域由 `LD-G2-01` 数据契约界定）。
