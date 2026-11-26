# LexAIDaily Gate 2 正式数据契约（v1.0）

- **任务编号**：`LD-G2-01`（父级 Spec #38 / 子 Issue #39）
- **架构依据**：`ADR-0001`（Node.js / TypeScript 单一技术栈）、`ADR-0002`（**本地私有缓存** + 两阶段事实锚定 + 预览/详情双层信息密度）、`ADR-0003`（双轨分域采集）
- **术语基准**：严格沿用 `GLOSSARY.md` 既定术语，禁止混用别名。

## 1. 四套核心 JSON Schema 与文件位置

| Schema 名称 | 文件路径 | 对应术语与用途 |
|---|---|---|
| `candidate-item` | `schemas/candidate-item.schema.json` | **候选条目**（单条待审校资讯单元；双轨分区文件 `cn.json` / `global.json` 为 `candidate-item[]` 数组） |
| `collect-meta` | `schemas/collect-meta.schema.json` | **采集运行状态 Meta**（`cn-meta.json` / `global-meta.json` 运行状态、信源成功率、TTL 清理记录） |
| `wechat-topic-pool` | `schemas/wechat-topic-pool.schema.json` | **公众号深度选题池**（按量化规则沉淀的待选深度长文队列） |
| `daily-bundle` | `schemas/daily-bundle.schema.json` | **结构化日更数据包**（人工终审后导出的多端唯一共享事实源，每条 item 必须含完整 `detail_analysis`） |

> **Schema 加载说明**：`daily-bundle.schema.json` 通过 `$ref` 引用 `https://lexaidaily.local/schemas/candidate-item.schema.json`；外部消费者独立加载前须先注册 `candidate-item.schema.json`，或直接调用 `src/contracts/validate.mjs`。

## 2. 生命周期与双层内容字段模型（ADR-0002）

### 2.1 三阶段生命周期（机器化校验）
1. **采集初筛期（`pending_review`，Stage 2 完成前）**：允许 `detail_analysis` 缺省，但必须满足 `practice_impact_is_ai_draft: true` 与 `headline: false`（机器化 `AGENTS.md` 10.8 与 D-019）。
2. **待审校期（`pending_review`，Stage 2 完成后）**：若已填充 `detail_analysis`，则 `detail_analysis.ai_draft` 必须为 `true`；`headline` 仍必须为 `false`。
3. **人工终审导出期（`approved` / `daily-bundle`）**：`detail_analysis` 必填；仅经 Human 终审后方可将 `headline` 置为 `true` 或解除「AI 初稿」状态。

### 2.2 预览层（Web 列表卡片 / 微信公众号每日固定栏目）
- `summary`：精炼摘要，**硬上限 ≤160 字（O2）**，最小 20 字。
- `practice_impact_brief`：1 句极简 **实务影响锚点**，**硬上限 ≤60 字**（单句语义由 Stage 2 提示词与人工审校约束，Schema 守住长度上限）。
- `practice_impact_is_ai_draft`：布尔标记；`pending_review` 状态下强制为 `true`。

### 2.3 Web 卡片详情层（`detail_analysis`，**详情页深度评述**）
- `key_points`：3–5 条结构化核心事实要点（每条 **8–140 字**）。
- `evidence_quotes`：1–3 条逐字合规原文短引文（对象数组 `{ text, locator? }`），单段 `text` **严格限长 8–150 字**，仅作合理引用与 3 秒核验依据，非整篇转载（句数由 Stage 2 校验约束）。
- `legal_commentary`：**200–400 字**面向法律从业者的深度评述。
- `ai_draft`：布尔标记；`pending_review` 状态下强制为 `true`，全块标注「AI 初稿」。

## 3. 真实性、溯源、作用域与法规效力字段

- `region`：必填分域枚举 `"cn" | "global"`（对应双轨采集架构 `ADR-0003`）。
- `source_id`：必填 **白名单信源** 唯一标识（小写字母/数字/连字符），须与 `whitelist-cn.yaml` / `whitelist-global.yaml` 对齐（可通过 `validateSourceIdAgainstWhitelist()` 做跨文件引用校验）。
- `discovered_via`：可选辅助线索发现源标识（例如 `"aihot-news-discovery"`）。
- `source_url`：必填 100% 合法的 **HTTPS** 一手原始链接（`^https://`）。**作用域区分**：白名单 `expected_domain` 仅约束采集抓取入口域名；`source_url` 指向一手文章原链（例如 arXiv feed 在 `rss.arxiv.org` 而文章在 `arxiv.org`，AIHOT 回溯至外部一手原链），但校验入口强制拒收任何指向 `discovery_only` 域名（如 `aihot.news`）的 `source_url`。
- `published_at`：严格日历日期校验（`format: "date"` / `format: "date-time"` / 有效年月 `YYYY-(01..12)`），拒收 `2026-99-99`、`2026-02-31` 等非法日期。
- `category`：必填官方五维分类枚举：`监管与合规` / `模型与技术` / `实务与工具` / `判例与学术` / `行业与资本`。
- `fact_tier`：必填 **事实层级** 三选一枚举（O4）：`confirmed_fact` / `official_data` / `market_opinion`。
- `unverified`：必填 **未核实标记** 布尔兜底位（O4）。
- `needs_human_check`：必填布尔位；Stage 2 数字/日期忠实度校验未命中本地原文时自动置为 `true`。
- `high_risk_legal` & `effective_status`：当 `high_risk_legal: true` 时，Schema 强制要求提供 `effective_status`（概念参考 `delschlangen/ai-legislation-tracker` MIT，未拷贝其代码）。

## 4. 版权红线与测试接缝 1（防泄密检查）

1. **公开数据零原文全文**：四套 Schema 均启用 `additionalProperties: false` 作为主防线，校验入口 `src/contracts/validate.mjs` 对任意嵌套层级执行**大小写与分隔符归一化**的禁用键扫描作为兜底防线，明确拒收 `raw_text`、`full_text`、`html_content`、`body_html`、`raw_html`、`full_content`、`article_body`（含 `rawText`、`bodyHtml` 等变体）。
2. **本地私有缓存隔离**：`.gitignore` 强制忽略 `.cache/` 与 `.cache/raw/`；`checkNoTrackedRawCache()` 核验 `.gitignore` 规则生效且 `git ls-files .cache` 为空。
3. **CLI 校验命令**：
   ```bash
   node src/contracts/validate.mjs daily-bundle tests/contracts/fixtures/ld-g1-04-mapped-bundle.json
   node src/contracts/validate.mjs --check-cache
   npm run test:contracts
   ```
