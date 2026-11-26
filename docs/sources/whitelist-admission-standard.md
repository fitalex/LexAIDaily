# LexAIDaily 权威信源白名单准入与分级标准（v1.0）

- **任务编号**：`LD-G2-02`（父级 Spec #38 / 子 Issue #40）
- **架构依据**：`ADR-0003`（中国大陆与大陆以外双轨分域采集）、`GLOSSARY.md`（**白名单信源**定义）
- **配置文件**：`data/sources/whitelist-cn.yaml`（`region: cn`）与 `data/sources/whitelist-global.yaml`（`region: global`），均由 `js-yaml` 直接读取解析。

## 1. 五类权威信源主体与准入标准

本白名单仅收录具备一手发布资质的权威机构与官方入口，按 `source_type` 分为五类：

| `source_type` | 中文名称 | 典型代表 | 一手判定标准 |
|---|---|---|---|
| `legislation_regulator` | 立法与监管机构 | 中央网信办、司法部、国家数据局、欧盟 AI 办公室、EUR-Lex、英国 ICO、美国 Federal Register | 法规、规章、监管指引与征求意见稿的官方发布入口 |
| `court_judiciary` | 法院公开文书 | 最高人民法院、英国最高法院、CourtListener（公开法院文书与 RECAP 归档） | 司法解释、典型案例、法院规程与公开裁判文书官方入口 |
| `academic_paper` | 顶会与核心期刊论文 | arXiv（`cs.AI` 等官方 RSS/Atom）、Stanford HAI | 论文预印本原始提交页或高校研究所官方发布页 |
| `official_tech_blog` | 官方技术博客 | DeepSeek、Qwen、OpenAI、Anthropic | 模型与产品研发机构官方新闻室、技术博客或 API 变更日志 |
| `authoritative_media` | 权威科技与法律科技媒体 | Thomson Reuters Institute、Artificial Lawyer、LawSites | 具独立采编与原始调研报告能力的行业权威媒体/研究机构 |

### 严禁收录红线（一票否决）
1. **严禁二手搬运号与内容农场**：不收录无独立信源的自媒体转载站、营销号或洗稿聚合页。
2. **严禁需登录态或强验证码封闭站点**：中国大陆与海外轨均只收录免登录、无强交互验证码的公开页面、RSS/Atom 或公开只读 API。

## 2. 权威分级（`authority_tier`）与高风险触发规则

| 等级 | 适用范围 | `high_risk_default` 默认值 | 人工终审要求 |
|---|---|---|---|
| `T1` | 立法机构、监管部门、法院及官方公报 | `true` | 必核发布机构、日期、版本号与 `effective_status`（效力状态） |
| `T2` | 顶会/预印本论文平台、高校智库、模型厂商官方博客 | `false`（涉合规承诺或政策白皮书时由人工/管线提升） | 核对核心数据指标、评测口径与原始论文/公告链接 |
| `T3` | 权威法律科技媒体、行业研究机构、辅助线索发现源 | `false` | 严格回溯一手原链；辅助线索源不得直接作为引用依据 |

## 3. 五维内容分类映射

每条信源通过 `default_categories` 标注其主要覆盖的官方五维分类（对齐 `ROADMAP.md`）：
- `监管与合规`
- `模型与技术`
- `实务与工具`
- `判例与学术`
- `行业与资本`

## 4. 辅助线索发现源合规红线（`aihot.news/api/v1`）

`whitelist-cn.yaml` 收录 `aihot-news-discovery`（入口 `https://aihot.news/api/v1/items`，接口文档见 `https://aihot.news/en/agent?tab=api`）作为 **辅助线索发现源**，强制遵守以下合规红线：
1. 配置必须显式标记 `discovery_only: true` 与 `fetch_mode: discovery_api`。
2. 采集器仅允许读取 `links.original` 与事件热度字段，用于发现热点线索并**回溯至一手官方原链**独立抓取正文。
3. **严禁直接搬运、改写或对外再分发 AIHOT 的摘要文本**；所有对外输出的一手链接必须是 `source_url`（原链），`discovered_via` 仅作内部溯源留痕。
4. 遵守其匿名只读接口速率限制（约 60 req/min）及非商业内部使用边界。

## 5. 失效源降级与维护规则

- `status: active`：正常调度采集。
- `status: degraded`：连续 3 次采集返回 HTTP 4xx/5xx、超时或解析为空时自动降级为 `degraded`，记录至 `*-meta.json` 并提示人工复核，不阻断同轨其他信源运行。
- `status: paused`：连续 7 天不可用、页面改版或新增强制登录/验证码时置为 `paused`，须经人工确认后恢复或替换。
- **防域名劫持（`expected_domain`）**：每条白名单信源必须声明 `expected_domain`，采集器抓取与重定向时须校验目标主机名匹配预期域名。
