# LexAIDaily 权威信源白名单准入与分级标准（v1.0）

- **任务编号**：`LD-G2-02`（父级 Spec #38 / 子 Issue #40）
- **架构依据**：`ADR-0003`（中国大陆与大陆以外双轨分域采集）、`GLOSSARY.md`（**白名单信源**定义）
- **配置文件**：`data/sources/whitelist-cn.yaml`（`region: cn`）与 `data/sources/whitelist-global.yaml`（`region: global`），均由 `js-yaml` 读取并经 `src/sources/validate-whitelist.mjs` 执行严格键与红线校验。

## 1. 五类权威信源主体与准入标准

本白名单仅收录具备一手发布资质的权威机构与官方入口，按 `source_type` 分为五类：

| `source_type` | 中文名称 | 典型代表 | 一手判定标准 |
|---|---|---|---|
| `legislation_regulator` | 立法与监管机构 | 全国人大国家法律法规数据库、中央网信办、司法部、国家数据局、欧盟 AI 办公室、EUR-Lex、英国 ICO、美国 Federal Register、美国 NCSL 50 州 AI 立法数据库 | 法规、规章、监管指引、州立法追踪与征求意见稿的官方/权威发布入口 |
| `court_judiciary` | 法院公开文书 | 最高人民法院、英国最高法院、CourtListener（公开 Atom 裁判检索订阅源） | 司法解释、典型案例、法院规程与公开裁判文书官方入口或经验证的公开裁判归档 |
| `academic_paper` | 预印本、高校研究机构与顶会/核心期刊 | arXiv（`cs.AI` 官方 RSS）、Stanford HAI（顶会与法学核心期刊入口按 Human 审定持续增补） | 论文预印本原始提交页、高校研究所官方发布页或期刊/顶会官方入口 |
| `official_tech_blog` | 官方技术博客 | DeepSeek、Qwen、OpenAI、Anthropic | 模型与产品研发机构官方新闻室、技术博客或 API 变更日志 |
| `authoritative_media` | 权威科技与法律科技媒体 | Thomson Reuters Institute、Artificial Lawyer、LawSites（及带 `discovery_only` 隔离标记的辅助线索源） | 具独立采编与原始调研报告能力的行业权威媒体/研究机构 |

### 严禁收录红线（一票否决）
1. **严禁二手搬运号与内容农场**：不收录无独立信源的自媒体转载站、营销号或洗稿聚合页。
2. **严禁需登录态、API 鉴权凭据或强验证码封闭站点**：中国大陆与海外轨均只收录免登录、无强交互验证码的公开页面、RSS/Atom 或公开匿名只读 API（若某源仅开放需认证 API，必须降级改用其公开 Atom/HTML 入口，或经 Human 按 B 级另行授权凭据管理，严禁以“免登录”掩盖）。

## 2. 权威分级（`authority_tier`）与高风险触发规则

| 等级 | 适用范围 | `high_risk_default` 默认值 | 人工终审要求 |
|---|---|---|---|
| `T1` | 立法机构、监管部门、法院及官方公报 | **强制 `true`** | 必核发布机构、日期、版本号与 `effective_status`（效力状态，契约侧已机器化校验） |
| `T2` | 预印本/高校智库、模型厂商官方博客、非营利公开法院文书/州法聚合平台（如 CourtListener、NCSL） | 默认 `false`；**涉法院文书/立法聚合的 `T2` 源（`court_judiciary` / `legislation_regulator`）置为 `true`** | 核对核心数据指标、原始裁判/法案链接与效力状态 |
| `T3` | 权威法律科技媒体、行业研究机构、辅助线索发现源 | `false` | 严格回溯一手原链；辅助线索源不得直接作为引用依据 |

## 3. 五维内容分类映射

每条信源通过 `default_categories` 标注其主要覆盖的官方五维分类（对齐 `ROADMAP.md`）：
- `监管与合规` / `模型与技术` / `实务与工具` / `判例与学术` / `行业与资本`

## 4. 辅助线索发现源合规红线与 Gate 3/4 商业化前置条件（`aihot.news/api/v1`）

`whitelist-cn.yaml` 收录 `aihot-news-discovery`（入口 `https://aihot.news/api/v1/items`，接口文档见 `https://aihot.news/en/agent?tab=api`）作为 **辅助线索发现源**（置于 CN 轨便于国内中文热点与大陆网络出口调度），强制遵守以下红线：
1. 配置必须显式标记 `discovery_only: true`、`fetch_mode: discovery_api` 与非空 `compliance_redline`。
2. 采集器仅允许读取 `links.original` 与事件热度字段，用于发现热点线索并**回溯至一手官方原链**独立抓取正文；契约校验入口（`LD-G2-01`）已机器化拒收指向 `aihot.news` 的 `source_url`。
3. **严禁直接搬运、改写或对外再分发 AIHOT 的摘要文本**。
4. **Gate 3/4 公开与商业化前置条件（强制门禁）**：AIHOT 官方条款明确“个人、非营利及组织内部使用免费；**面向公众的商业产品、付费服务、代理 API 与批量再分发须事先取得书面许可**”，且单 IP 速率限制约 60 req/min。在取得 AIHOT 书面许可前，本源**仅限内部试运行与研发验证**，Gate 3/4 对外公开或商业化上线前必须由 Human 决定取得书面授权或停用该源。

## 5. 失效源降级与维护规则

- `status: active`：正常调度采集。
- `status: degraded`：连续 3 次采集返回 HTTP 4xx/5xx、超时或解析为空时自动降级为 `degraded`，记录至 `*-meta.json` 并提示人工复核，不阻断同轨其他信源运行。
- `status: paused`：连续 7 天不可用、页面改版或新增强制登录/验证码时置为 `paused`，须经人工确认后恢复或替换。
- **防域名劫持（`expected_domain`）**：每条白名单信源必须声明 `expected_domain`，且与 `entry_url` 主机名完全一致，用于约束抓取入口（文章一手原链域名作用域由 `LD-G2-01` 数据契约界定）。
