# LexAIDaily Gate 2 正式数据契约（v1.0）

- **任务编号**：`LD-G2-01`（父级 Spec #38 / 子 Issue #39）
- **架构依据**：`ADR-0001`（Node.js / TypeScript 单一技术栈）、`ADR-0002`（**本地私有缓存** + 两阶段事实锚定 + 预览/详情双层信息密度）、`ADR-0003`（双轨分域采集）
- **术语基准**：严格沿用 `GLOSSARY.md` 既定术语，禁止混用别名。

## 1. 四套核心 JSON Schema 与文件位置

| Schema 名称 | 文件路径 | 对应术语与用途 |
|---|---|---|
| `candidate-item` | `schemas/candidate-item.schema.json` | **候选条目**（单条待审校资讯单元，支持双轨采集输出与汇流） |
| `collect-meta` | `schemas/collect-meta.schema.json` | **采集运行状态 Meta**（`cn-meta.json` / `global-meta.json` 运行状态、信源成功率、TTL 清理记录） |
| `wechat-topic-pool` | `schemas/wechat-topic-pool.schema.json` | **公众号深度选题池**（按量化规则沉淀的待选深度长文队列） |
| `daily-bundle` | `schemas/daily-bundle.schema.json` | **结构化日更数据包**（人工终审后导出的多端唯一共享事实源） |

## 2. 双层内容字段模型（ADR-0002）

### 2.1 预览层（Web 列表卡片 / 微信公众号每日固定栏目）

用于 3 分钟极速扫读：
- `summary`：精炼摘要，**硬上限 ≤160 字（O2）**，最小 20 字。
- `practice_impact_brief`：1 句极简 **实务影响锚点**，**硬上限 ≤60 字**，面向法律从业者。
- `practice_impact_is_ai_draft`：布尔标记；人工终审确认前必须为 `true`，渲染层须显式标注「AI 初稿」，不得写成确定法律结论。

### 2.2 Web 卡片详情层（`detail_analysis`，**详情页深度评述**）

基于本机 `.cache/raw/` 完整正文经两阶段事实锚定生成，仅在 Web 详情页消费：
- `key_points`：3–5 条结构化核心事实要点（每条 10–140 字）。
- `evidence_quotes`：1–3 句逐字合规原文短引文（对象数组 `{ text, locator? }`），单段 `text` **严格限长 8–150 字**，仅作合理引用与 3 秒核验依据，非整篇转载。
- `legal_commentary`：**200–400 字**面向法律从业者的深度评述。
- `ai_draft`：布尔标记；人工终审确认前必须为 `true`，全块标注「AI 初稿」。

## 3. 真实性、溯源与法规效力字段

- `region`：必填分域枚举 `"cn" | "global"`（对应双轨采集架构 `ADR-0003`）。
- `source_id`：必填 **白名单信源** 唯一标识（小写字母/数字/连字符）。
- `discovered_via`：可选辅助线索发现源标识（例如 `"aihot-news-discovery"`），仅记录线索来源，一手正文与原链必须来自 `source_url`。
- `source_url`：必填 100% 合法的一手原始链接（`http://` 或 `https://` URI）。
- `category`：必填官方五维分类枚举：`监管与合规` / `模型与技术` / `实务与工具` / `判例与学术` / `行业与资本`。
- `fact_tier`：必填 **事实层级** 三选一枚举（O4）：`confirmed_fact`（已证实事实）/ `official_data`（官方数据）/ `market_opinion`（市场观点）。
- `unverified`：必填 **未核实标记** 布尔兜底位（O4）；凡发布机构、日期、版本或效力状态无法核实时必须置为 `true`，禁止 AI 强行归类为已证实事实。
- `needs_human_check`：必填布尔位；Stage 2 数字/日期忠实度校验未命中本地原文时自动置为 `true`。
- `high_risk_legal`：必填布尔位；涉及法规、监管指引、法院规程或重大司法裁判时置为 `true`。
- `effective_status` / `superseded_by`：可选法规效力追踪字段（概念参考 `delschlangen/ai-legislation-tracker` MIT，未拷贝其代码），支持 `draft`、`proposed`、`enacted`、`in_force`、`amended`、`superseded`、`repealed`、`guidance`、`not_applicable`。

## 4. 版权红线与测试接缝 1（防泄密检查）

1. **公开数据零原文全文**：所有四套 Schema 均启用 `additionalProperties: false`，且校验入口 `src/contracts/validate.mjs` 对任意嵌套层级执行禁用字段递归扫描，明确拒收 `raw_text`、`full_text`、`html_content`、`body_html`、`raw_html`、`full_content`、`article_body`。
2. **本地私有缓存隔离**：`.gitignore` 强制忽略 `.cache/` 与 `.cache/raw/`；校验入口提供 `checkNoTrackedRawCache()` 守卫，核验 `.gitignore` 规则生效且 `git ls-files .cache/raw` 为空。
3. **CLI 校验命令**：
   ```bash
   node src/contracts/validate.mjs daily-bundle tests/contracts/fixtures/ld-g1-04-mapped-bundle.json
   node src/contracts/validate.mjs --check-cache
   npm run test:contracts
   ```
