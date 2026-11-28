# Gate 2 法律 AI 信息采集与内容工作流总索引（LD-G2-06）

> **任务依据**：Issue [#44](https://github.com/fitalex/LexAIDaily/issues/44)（`LD-G2-06`｜Parent [#38](https://github.com/fitalex/LexAIDaily/issues/38)｜级别 A｜Owner：Antigravity）  
> **基准快照**：`origin/main` @ `fc57d46940783b4b77c816a99aede05df1af239e`（含 PR #37、#47、#50–#66 全部已合并成果）  
> **交叉参照**：Gate 1 设计与排版资产总索引见 [gate1-design-index.md](gate1-design-index.md)

---

## 一、Gate 2 任务全景与 Issue / PR 对照（#38 及 #39–#46）

| 编号 / Issue | 标题与范围 | GitHub 状态 | Owner / 审计 | 已合并 PR 与主干 Commit |
|---|---|---|---|---|
| **Spec #38** | `[Spec] Gate 2：法律 AI 信息采集与内容工作流` | OPEN（父级追踪） | 协调：Gemini | 底座术语与 ADR：[PR #37](https://github.com/fitalex/LexAIDaily/pull/37)（`21d24da`） |
| **LD-G2-01**（[#39](https://github.com/fitalex/LexAIDaily/issues/39)） | 正式采集与日更数据契约 v1.0（4 套 Schema + `ajv` 校验接缝 1） | CLOSED | Owner：Gemini｜审计：DSH R1–R2 | 代码：[PR #47](https://github.com/fitalex/LexAIDaily/pull/47)（`831095f`）；审计：[PR #50](https://github.com/fitalex/LexAIDaily/pull/50)、[PR #51](https://github.com/fitalex/LexAIDaily/pull/51) |
| **LD-G2-02**（[#40](https://github.com/fitalex/LexAIDaily/issues/40)） | 双轨权威信源白名单库（CN 12 + Global 14 + AIHOT 线索源）与准入标准 v1.2 | OPEN（代码已合入，待 Human 复核 S3 源取舍） | Owner：Gemini｜审计：DSH R1–R6 | 代码：[PR #54](https://github.com/fitalex/LexAIDaily/pull/54)（`6be8689`，替代已关闭的 PR #48）；审计：[PR #50](https://github.com/fitalex/LexAIDaily/pull/50)–[#53](https://github.com/fitalex/LexAIDaily/pull/53)、[#55](https://github.com/fitalex/LexAIDaily/pull/55)、[#56](https://github.com/fitalex/LexAIDaily/pull/56) |
| **LD-G2-03**（[#41](https://github.com/fitalex/LexAIDaily/issues/41)，含 [#46](https://github.com/fitalex/LexAIDaily/issues/46)） | 双轨采集器、`.cache/raw/` 7 天缓存、跨轨去重、两阶段事实锚定汇流与选题池管线 | CLOSED | Owner：Gemini｜审计：DSH R1–R6 | 代码：[PR #58](https://github.com/fitalex/LexAIDaily/pull/58)（`e28edfa`）；审计：[PR #59](https://github.com/fitalex/LexAIDaily/pull/59)–[#62](https://github.com/fitalex/LexAIDaily/pull/62) |
| **LD-G2-04**（[#42](https://github.com/fitalex/LexAIDaily/issues/42)） | 两阶段提示词模板包（`v1.0.0`/`v1.1.0`）、`ajv` 纠错重试、Option B 详情契约与人工审校 SOP | CLOSED | Owner：Gemini｜审计：DSH R1–R3 | 代码：[PR #63](https://github.com/fitalex/LexAIDaily/pull/63)（`e4f6b81`）；审计：[PR #64](https://github.com/fitalex/LexAIDaily/pull/64) |
| **LD-G2-05**（[#43](https://github.com/fitalex/LexAIDaily/issues/43)） | 双端一键导出 CLI（`export:dual`）、V16 富数据包与连续 3 期试运行样本（24 条） | CLOSED | Owner：Gemini｜审计：DSH R1–R2 | 代码：[PR #65](https://github.com/fitalex/LexAIDaily/pull/65)（`c38786a`）；审计：[PR #66](https://github.com/fitalex/LexAIDaily/pull/66) |
| **LD-G2-06**（[#44](https://github.com/fitalex/LexAIDaily/issues/44)） | Gate 2 管线与双端导出独立交叉测试 + 文档总索引同步（本索引及测试报告） | OPEN（本分支待审合并） | Owner：Antigravity｜复核：Gemini | 分支：`ag/ld-g2-06-cross-test-docs`（关联 `Closes #44`） |
| **LD-G2-07**（[#45](https://github.com/fitalex/LexAIDaily/issues/45)） | Gate 2 验收清单（逐字转写 `ROADMAP.md` 既有标准，供 Human 签署解锁 Gate 3） | OPEN（依赖 #44 完成） | Owner：Gemini｜验收：Human | 待 `LD-G2-06` 合并后提交 `docs/coordination/GATE2_ACCEPTANCE.md` |

---

## 二、核心术语与架构决策记录（`GLOSSARY.md` & `docs/adr/`）

| 文件路径 | 相对链接 | 阶段 / 来源 | 核心内容 |
|---|---|---|---|
| `GLOSSARY.md` | [GLOSSARY.md](../GLOSSARY.md) | PR #37 | Gate 2 统一术语表（白名单信源、候选条目、本地私有缓存、事实层级、未核实标记、实务影响锚点、详情页深度评述、公众号深度选题池、结构化日更数据包） |
| `docs/adr/0001-node-single-stack.md` | [0001-node-single-stack.md](adr/0001-node-single-stack.md) | PR #37 | ADR-0001：全程统一采用 Node.js / TypeScript 单一技术栈（`>=22.12.0`），零跨语言胶水层 |
| `docs/adr/0002-fact-tier-and-no-fulltext.md` | [0002-fact-tier-and-no-fulltext.md](adr/0002-fact-tier-and-no-fulltext.md) | PR #37 | ADR-0002：`.cache/raw/` 7 天私有缓存 + 两阶段事实锚定 + 预览/详情双层密度 + 公开库零原文全文红线 |
| `docs/adr/0003-dual-track-regional-collection.md` | [0003-dual-track-regional-collection.md](adr/0003-dual-track-regional-collection.md) | PR #37 / 后续更新 | ADR-0003：CN / Global 双轨解耦采集 + Gemini 编码 / DSH 独立审计 / Antigravity 交叉测试 + Hydrogen 运营规划 |

---

## 三、正式数据契约与校验接缝（`schemas/`、`docs/contracts/`、`src/contracts/`）

| 文件路径 | 相对链接 | 阶段 / PR | 核心用途与约束 |
|---|---|---|---|
| `schemas/candidate-item.schema.json` | [candidate-item.schema.json](../schemas/candidate-item.schema.json) | `LD-G2-01` (PR #47) → `04` (PR #63 Option B) | 候选条目正式契约 v1.0：`additionalProperties: false`、`https://` 一手链接、`summary` 20–160 字、`practice_impact_brief` 10–60 字、`key_points` 1–3 段（单段 8–600 字，合计 ≤600 字由校验器与加载器锁定）、`evidence_quotes` 1–3 条（8–150 字）、`legal_commentary` 200–400 字、`pending_review` 与 `high_risk_legal` 条件约束 |
| `schemas/collect-meta.schema.json` | [collect-meta.schema.json](../schemas/collect-meta.schema.json) | `LD-G2-01` (PR #47) | 双轨采集运行状态 Meta（`cn-meta.json` / `global-meta.json`），锁定 `cache_ttl_days: 7` 与单源状态追踪 |
| `schemas/wechat-topic-pool.schema.json` | [wechat-topic-pool.schema.json](../schemas/wechat-topic-pool.schema.json) | `LD-G2-01` (PR #47) | 公众号深度选题池队列契约（4 类触发原因：`multi_source_cross_report` / `high_risk_legal_tag` / `heat_or_controversy_threshold` / `long_regulation_split`） |
| `schemas/daily-bundle.schema.json` | [daily-bundle.schema.json](../schemas/daily-bundle.schema.json) | `LD-G2-01` (PR #47) | 日更结构化数据包契约 v1.0（`$ref` 引用 `candidate-item.schema.json` 且强制 `detail_analysis` 必填） |
| `docs/contracts/gate2-data-contract-v1.md` | [gate2-data-contract-v1.md](contracts/gate2-data-contract-v1.md) | `LD-G2-01` (PR #47) | Gate 2 正式数据契约说明文档（含三阶段生命周期与防泄密接缝 1 说明；注：第 31 行 `key_points` 仍记旧口径，见第七节漂移说明） |
| `src/contracts/validate.mjs` | [validate.mjs](../src/contracts/validate.mjs) | `LD-G2-01` (PR #47) → `03` / `04` | `ajv@8.20.0` + `ajv-formats@3.0.1` 校验入口、7 个禁用全文字段归一化扫描、`aihot.news` 拦截、`key_points` 合计 ≤600 字检查、`.cache/` 隔离守卫与 `npm run validate:contracts` CLI |
| `src/contracts/types.d.ts` | [types.d.ts](../src/contracts/types.d.ts) | `LD-G2-01` (PR #47) | TypeScript 静态类型定义（供 Gate 3 消费；`detail_analysis` 可选性见第七节漂移说明） |
| `tests/contracts/validate.test.mjs` | [validate.test.mjs](../tests/contracts/validate.test.mjs) | `LD-G2-01` (PR #47) → `04` | 契约单元测试（12 pass） |
| `tests/contracts/fixtures/ld-g1-04-mapped-bundle.json` | [ld-g1-04-mapped-bundle.json](../tests/contracts/fixtures/ld-g1-04-mapped-bundle.json) | `LD-G2-01` (PR #47) | 基于 Gate 1 真实样本映射的 `DailyBundle` 校验夹具（5 条覆盖五维分类） |

---

## 四、双轨权威信源白名单与准入标准（`data/sources/`、`docs/sources/`、`src/sources/`）

| 文件路径 | 相对链接 | 阶段 / PR | 核心用途与数量核对 |
|---|---|---|---|
| `data/sources/whitelist-cn.yaml` | [whitelist-cn.yaml](../data/sources/whitelist-cn.yaml) | `LD-G2-02` (PR #54) | 中国大陆轨白名单 v1.2（**12 源**：2 合规哨兵 + 3 红圈所 + 3 法律 AI 工具 + 3 效率底座 + 1 `aihot-news-discovery` `discovery_only` 线索源，合规哨兵占比 `16.7%`） |
| `data/sources/whitelist-global.yaml` | [whitelist-global.yaml](../data/sources/whitelist-global.yaml) | `LD-G2-02` (PR #54) | 大陆以外轨白名单 v1.2（**14 源**：3 合规哨兵 + 3 法律 AI 厂商 + 3 垂直媒体研究 + 3 办公 AI 博客 + 2 前沿学术，合规哨兵占比 `21.4%`） |
| `docs/sources/whitelist-admission-standard.md` | [whitelist-admission-standard.md](sources/whitelist-admission-standard.md) | `LD-G2-02` (PR #54) | 权威信源白名单准入与分级标准 v1.2（七类 `source_type`、`T1`/`T2`/`T3` 分级、`aihot.news` Gate 3/4 书面许可前置门禁） |
| `src/sources/validate-whitelist.mjs` | [validate-whitelist.mjs](../src/sources/validate-whitelist.mjs) | `LD-G2-02` (PR #54) | YAML 结构/未知键/域名防劫持/`T1`+法院`T2` 强制高风险/Cloudflare 与 SPA 壳识别器 |
| `scripts/sources/smoke-check.mjs` | [smoke-check.mjs](../scripts/sources/smoke-check.mjs) | `LD-G2-02` (PR #54) | `npm run smoke:sources` 在线可解析性冒烟探测（浏览器 UA + 25s 超时 + 瞬时重试 + 4xx 立即止损） |
| `tests/sources/whitelist.test.mjs` | [whitelist.test.mjs](../tests/sources/whitelist.test.mjs) | `LD-G2-02` (PR #54) | 白名单配比、红线、可解析性与重试单测（7 pass） |

---

## 五、采集、私有缓存与公共汇流管线（`src/collectors/`、`src/pipeline/`）

| 文件路径 | 相对链接 | 阶段 / PR | 核心职责 |
|---|---|---|---|
| `src/collectors/cn/index.mjs` | [cn/index.mjs](../src/collectors/cn/index.mjs) | `LD-G2-03` (PR #58) | 大陆轨采集 CLI 入口（`npm run collect:cn`） |
| `src/collectors/global/index.mjs` | [global/index.mjs](../src/collectors/global/index.mjs) | `LD-G2-03` (PR #58) | 海外轨采集 CLI 入口（`npm run collect:global`，支持环境变量代理） |
| `src/collectors/shared/collector-runner.mjs` | [collector-runner.mjs](../src/collectors/shared/collector-runner.mjs) | `LD-G2-03` (PR #58) | 双轨共用执行器：7 天 TTL 清理、白名单校验、L1/L2/L3 调度、写私有缓存、单条 Schema 隔离与 `*-meta.json` 输出 |
| `src/collectors/shared/adapters.mjs` | [adapters.mjs](../src/collectors/shared/adapters.mjs) | `LD-G2-03` (PR #58) | L1 / L2 / L3 采集适配器聚合导出 |
| `src/collectors/shared/adapters-l1.mjs` | [adapters-l1.mjs](../src/collectors/shared/adapters-l1.mjs) | `LD-G2-03` (PR #58) | L1 公开 RSS/Atom、静态 HTML 与 `aihot.news`（仅取 `links.original` + ETag 304 缓存迁移 + 不抄摘要）适配器 |
| `src/collectors/shared/adapters-ext.mjs` | [adapters-ext.mjs](../src/collectors/shared/adapters-ext.mjs) | `LD-G2-03` (PR #58) | L2 `we-mp-rss` 只读桥接（401/403 降级 + 域名白名单）与 L3 `.local/manual-inbox.yaml` + Monid 每日硬上限 fail-closed 兜底 |
| `src/collectors/shared/cache.mjs` | [cache.mjs](../src/collectors/shared/cache.mjs) | `LD-G2-03` (PR #58) | `.cache/raw/` 读写、SHA-256 索引与 7 天 TTL 自动清理 |
| `src/collectors/shared/extractor.mjs` | [extractor.mjs](../src/collectors/shared/extractor.mjs) | `LD-G2-03` (PR #58) | GBK/UTF-8 解码、HTML/实体脚本剥离、`@mozilla/readability` + `linkedom` 正文提取与日期解析 |
| `src/collectors/shared/http.mjs` | [http.mjs](../src/collectors/shared/http.mjs) | `LD-G2-03` (PR #58) | 重试退避与纯内置 `node:http`/`https`/`tls` 代理 CONNECT/重定向解析（零 `undici` 额外依赖） |
| `src/collectors/shared/noise-filter.mjs` | [noise-filter.mjs](../src/collectors/shared/noise-filter.mjs) | `LD-G2-03` (PR #58) | 泛科技源（OpenAI 全量/少数派/阮一峰/AIHOT）法律 AI 与效率工作流相关性过滤 |
| `src/collectors/shared/url-and-domain.mjs` | [url-and-domain.mjs](../src/collectors/shared/url-and-domain.mjs) | `LD-G2-03` (PR #58) | `normalize-url` 追踪参数清洗、反域名劫持与 `aihot.news` 隔离拦截 |
| `src/pipeline/daily.mjs` | [daily.mjs](../src/pipeline/daily.mjs) | `LD-G2-03` (PR #58) | 统一总入口（`npm run daily`）：双轨容错采集 + 公共汇流，供后续 Hydrogen 自动化调用 |
| `src/pipeline/merge-and-curate/index.mjs` | [merge-and-curate/index.mjs](../src/pipeline/merge-and-curate/index.mjs) | `LD-G2-03` (PR #58) → `04` (PR #63) | 公共汇流主入口（`npm run curate`）：单轨缺失/损坏降级、两阶段抽取、审校诊断简报 `-review.md` 与日更数据包/选题池落盘 |
| `src/pipeline/merge-and-curate/dedup.mjs` | [dedup.mjs](../src/pipeline/merge-and-curate/dedup.mjs) | `LD-G2-03` (PR #58) | 归一化 URL / GUID / 双语实名实体跨轨去重（优先保留 `global` 一手原链，剔除泛词误合并） |
| `src/pipeline/merge-and-curate/fact-anchor.mjs` | [fact-anchor.mjs](../src/pipeline/merge-and-curate/fact-anchor.mjs) | `LD-G2-03` (PR #58) → `04` (PR #63) | Stage 1 事实抽取与逐字同源锚定、超长法规切分、Stage 2 双层生成（含 `ajv` 校验重试）与全字段数字/日期忠实度校验 |
| `src/pipeline/merge-and-curate/topic-pool.mjs` | [topic-pool.mjs](../src/pipeline/merge-and-curate/topic-pool.mjs) | `LD-G2-03` (PR #58) | 按跨源/高风险/热度 ≥80/超长法规四类量化规则沉淀公众号深度选题池（JSON + Markdown） |
| `tests/pipeline/pipeline.test.mjs` | [pipeline.test.mjs](../tests/pipeline/pipeline.test.mjs) | `LD-G2-03` (PR #58) | 采集、缓存 TTL、去重、AIHOT、忠实度与降级端到端单测（9 pass） |

---

## 六、两阶段提示词模板、人工审校 SOP 与双端导出试运行

### 6.1 两阶段提示词包与审校 SOP（`prompts/`、`src/prompts/`、`docs/sop/`）

| 文件路径 | 相对链接 | 版本 / PR | 核心用途 |
|---|---|---|---|
| `prompts/README.md` | [prompts/README.md](../prompts/README.md) | `v1.1.0` (PR #63) | 两阶段事实锚定提示词包架构、防注入与版本演进规范 |
| `prompts/stage1-fact-extract.md` | [stage1-fact-extract.md](../prompts/stage1-fact-extract.md) | `v1.0.0` (PR #63) | Stage 1：从 `.cache/raw/` 纯文本抽取机构、日期、文号、效力状态、数字与 1–3 条逐字短引文（8–150 字、`locator` ≤80 字） |
| `prompts/stage2-dual-layer.md` | [stage2-dual-layer.md](../prompts/stage2-dual-layer.md) | `v1.1.0` (PR #63) | Stage 2：生成预览层摘要/实务影响与详情页四步核心观点论证（Option B：1–3 段、合计 ≤600 字、去 AI 腔与元标注禁用） |
| `prompts/output-spec.md` | [output-spec.md](../prompts/output-spec.md) | `v1.1.0` (PR #63) | 与任务指令解耦的独立 JSON 输出契约段 |
| `prompts/eval/promptfooconfig.yaml` | [promptfooconfig.yaml](../prompts/eval/promptfooconfig.yaml) | `v1.1.0` (PR #63) | 可选离线多模型横向评测配置（零依赖、未写入 `package.json`） |
| `src/prompts/loader.mjs` | [loader.mjs](../src/prompts/loader.mjs) | PR #63 | Frontmatter 解析、模板缓存、围栏/XML 边界防注入清理与 `ajv` 校验失败回灌提示词构造 |
| `docs/sop/HUMAN_REVIEW_SOP.md` | [HUMAN_REVIEW_SOP.md](sop/HUMAN_REVIEW_SOP.md) | `LD-G2-04` (PR #63) | 《人工审校与发布 SOP 文档》：单日 ≤20 分钟 5 步审校流、3 秒引文对照、头条与 `ai_draft` 摘除门槛及 5 条不可逾越红线 |
| `tests/prompts/prompts.test.mjs` | [prompts.test.mjs](../tests/prompts/prompts.test.mjs) | `LD-G2-04` (PR #63) | 提示词模板、Gate 1 14/14 在线/离线回归、校验重试、防注入与忠实度单测（5 pass） |

### 6.2 双端一键导出、3 期试运行样本与交叉测试（`src/export/`、`data/`、`tests/`）

| 文件路径 | 相对链接 | 阶段 / PR | 核心用途与校验哈希 |
|---|---|---|---|
| `src/export/dual-export.mjs` | [dual-export.mjs](../src/export/dual-export.mjs) | `LD-G2-05` (PR #65) | `npm run export:dual` 一键导出 CLI：复用 Gate 1 [build.mjs](../scripts/wechat-prototype/build.mjs) 与 [template.html](../design/wechat/template.html) 生成公众号内联 HTML，同时输出对齐 V16 [index.html](../design/prototype/index.html) 的单日 JSON 与多日 `editions-index.json` |
| `data/bundles/2026-11-24.json` | [2026-11-24.json](../data/bundles/2026-11-24.json) | `LD-G2-05` (PR #65) | 连续试运行第 1 期（第 001 期，8 条：CN 1 / Global 7，高风险 2 条 = 25.0%，含 1 条人工精修头条） |
| `data/bundles/2026-11-25.json` | [2026-11-25.json](../data/bundles/2026-11-25.json) | `LD-G2-05` (PR #65) | 连续试运行第 2 期（第 002 期，8 条：CN 3 / Global 5，高风险 2 条 = 25.0%，含 1 条人工精修头条） |
| `data/bundles/2026-11-26.json` | [2026-11-26.json](../data/bundles/2026-11-26.json) | `LD-G2-05` (PR #65) | 连续试运行第 3 期（第 003 期，8 条：CN 3 / Global 5，高风险 2 条 = 25.0%，含 1 条人工精修头条） |
| `data/exports/ld-g2-05/manifest.json` | [manifest.json](../data/exports/ld-g2-05/manifest.json) | `LD-G2-05` (PR #65) | 3 期导出确定性 SHA-256 清单：`webIndexSha256` = `c8e6f9aa192ce80ab01c786756e61b36e3a422ccd65f98c3eef27d4145c8ecde`（经 `LD-G2-06` 两次 CLI 实测 100% 复现） |
| `tests/export/dual-export.test.mjs` | [dual-export.test.mjs](../tests/export/dual-export.test.mjs) | `LD-G2-05` (PR #65) | 双端导出单元与负例门禁测试（3 pass） |
| `tests/cross-test/index.js` | [tests/cross-test/index.js](../tests/cross-test/index.js) | `LD-G2-06` (#44) | `node --test tests/cross-test/` 目录测试入口 |
| `tests/cross-test/gate2-cross-test.test.mjs` | [gate2-cross-test.test.mjs](../tests/cross-test/gate2-cross-test.test.mjs) | `LD-G2-06` (#44) | Antigravity 独立交叉测试套件（7 pass / 3 suites，覆盖 Testing Seams 1 & 2） |
| `tests/cross-test/REPORT.md` | [tests/cross-test/REPORT.md](../tests/cross-test/REPORT.md) | `LD-G2-06` (#44) | 独立交叉测试完整命令输出、SHA-256 核对表与 S1–S3 发现报告 |

---

## 七、独立审计归档核对（`docs/audits/README.md`）

审计总索引：[docs/audits/README.md](audits/README.md)。经 `git hash-object` 逐一复核，Gate 2 全部 18 份已入库 DSH 独立审计报告的 Git blob SHA 与索引登记 **18/18 完全一致**：

| 任务 | 已归档轮次与文件链接 | 最终审计结论 | Git blob SHA（最终通过轮次） | 归档 PR |
|---|---|---|---|---|
| `LD-G2-01` | [r1](audits/LD-G2-01-dsh-audit-r1.md)、[r2](audits/LD-G2-01-dsh-audit-r2.md) | R2 **通过** | `e320b6458a7b3e0b655f4e7202a935083da4c694` | [PR #50](https://github.com/fitalex/LexAIDaily/pull/50)、[PR #51](https://github.com/fitalex/LexAIDaily/pull/51) |
| `LD-G2-02` | [r1](audits/LD-G2-02-dsh-audit-r1.md)、[r2](audits/LD-G2-02-dsh-audit-r2.md)、[r3](audits/LD-G2-02-dsh-audit-r3.md)、[r4](audits/LD-G2-02-dsh-audit-r4.md)、[r5](audits/LD-G2-02-dsh-audit-r5.md)、[r6](audits/LD-G2-02-dsh-audit-r6.md) | R6 **通过** | `4b2b1234fab99c0c6decf270703eb6a4e74a94a2` | [PR #50](https://github.com/fitalex/LexAIDaily/pull/50)–[#53](https://github.com/fitalex/LexAIDaily/pull/53)、[#55](https://github.com/fitalex/LexAIDaily/pull/55)、[#56](https://github.com/fitalex/LexAIDaily/pull/56) |
| `LD-G2-03` | R1 待补原稿（登记 SHA `ae43b159634b0470346979379c41a4873670d34c`）、[r2](audits/LD-G2-03-dsh-audit-r2.md)、[r3](audits/LD-G2-03-dsh-audit-r3.md)、[r4](audits/LD-G2-03-dsh-audit-r4.md)、[r5](audits/LD-G2-03-dsh-audit-r5.md)、[r6](audits/LD-G2-03-dsh-audit-r6.md) | R6 **通过（ACCEPT）** | `20868d201528e725f307de988061be15a5373804` | [PR #59](https://github.com/fitalex/LexAIDaily/pull/59)–[#62](https://github.com/fitalex/LexAIDaily/pull/62) |
| `LD-G2-04` | [r1](audits/LD-G2-04-dsh-audit-r1.md)、[r2](audits/LD-G2-04-dsh-audit-r2.md)、[r3](audits/LD-G2-04-dsh-audit-r3.md) | R3 **通过（ACCEPT）** | `6ec6f3c4cc0c625c35df28d4d38bc4689f5e4b37` | [PR #64](https://github.com/fitalex/LexAIDaily/pull/64) |
| `LD-G2-05` | [r1](audits/LD-G2-05-dsh-audit-r1.md)、[r2](audits/LD-G2-05-dsh-audit-r2.md) | R2 **通过（ACCEPT）** | `61d43c406233189ba8814b050e76531e1b43b09f` | [PR #66](https://github.com/fitalex/LexAIDaily/pull/66) |

---

## 八、第三方依赖与许可登记核对（`THIRD_PARTY_NOTICES.md`）

- **登记表入口**：[THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md)｜**清单文件**：[package.json](../package.json)、[package-lock.json](../package-lock.json)（`npm ci` 共 **71** 个包，零新增依赖）。
- **直接依赖全量核对（共 8 项：1 项 Gate 1 `#11` + 7 项 Gate 2 `#12`–`#18`）**：

| 序号 / 包名 | 版本 | 来源仓库 | 许可证 | 引入任务 | D-008 登记字段核对 |
|---|---|---|---|---|---|
| `#11` `juice` | `12.2.6` | [Automattic/juice](https://github.com/Automattic/juice) | `MIT` | `LD-G1-03` | 仓库、commit/版本、路径/许可链接、许可证（含全文附录 `### 4`/`### 11`）、改动说明 **齐全** |
| `#12` `ajv` | `8.20.0` | [ajv-validator/ajv](https://github.com/ajv-validator/ajv) | `MIT` | `LD-G2-01` | 仓库、版本、路径/许可链接、许可证（含全文附录 `### 5`/`### 12`）、改动说明 **齐全** |
| `#13` `ajv-formats` | `3.0.1` | [ajv-validator/ajv-formats](https://github.com/ajv-validator/ajv-formats) | `MIT` | `LD-G2-01` | 仓库、版本、路径/许可链接、许可证（含全文附录 `### 5`/`### 13`）、改动说明 **齐全** |
| `#14` `js-yaml` | `5.5.0` | [nodeca/js-yaml](https://github.com/nodeca/js-yaml) | `MIT` | `LD-G2-02` | 仓库、版本、路径/许可链接、许可证（含全文附录 `### 6`/`### 14`，含传递依赖 `argparse@3.0.4` PSF-2.0 说明）、改动说明 **齐全** |
| `#15` `@mozilla/readability` | `0.6.0` | [mozilla/readability](https://github.com/mozilla/readability) | `Apache-2.0` | `LD-G2-03` | 仓库、版本、路径/许可链接、许可证（含全文 `### 7`）、改动说明 **齐全** |
| `#16` `linkedom` | `0.18.15` | [WebReflection/linkedom](https://github.com/WebReflection/linkedom) | `ISC` | `LD-G2-03` | 仓库、版本、路径/许可链接、许可证（含全文 `### 8`）、改动说明 **齐全** |
| `#17` `normalize-url` | `10.0.0` | [sindresorhus/normalize-url](https://github.com/sindresorhus/normalize-url) | `MIT` | `LD-G2-03` | 仓库、版本、路径/许可链接、许可证（含全文 `### 9`）、改动说明 **齐全** |
| `#18` `rss-parser` | `3.13.0` | [rbren/rss-parser](https://github.com/rbren/rss-parser) | `MIT` | `LD-G2-03` | 仓库、版本、路径/许可链接、许可证（含全文 `### 10`）、改动说明 **齐全** |

---

## 九、跨文件版本一致性与已知待同步提示（仅客观记录）

1. **`key_points` Option B 口径漂移（`LD-G2-05` ST04）**：[candidate-item.schema.json](../schemas/candidate-item.schema.json)、[stage2-dual-layer.md](../prompts/stage2-dual-layer.md)、[output-spec.md](../prompts/output-spec.md) 与 [HUMAN_REVIEW_SOP.md](sop/HUMAN_REVIEW_SOP.md) 均为 **1–3 段且各段合计 ≤600 字**；[0002-fact-tier-and-no-fulltext.md](adr/0002-fact-tier-and-no-fulltext.md) 与 [gate2-data-contract-v1.md](contracts/gate2-data-contract-v1.md) 仍留有“3–5 条”早期表述，[types.d.ts](../src/contracts/types.d.ts) 中 `detail_analysis` 仍未标记可选。
2. **试运行样本细节观察**：[2026-11-26.json](../data/bundles/2026-11-26.json) 第 5 条（`cn-junhe-reviews`）`source_url` 为 `junhe.com` 而 `source_domain` 为 `www.junhe.com`；3 期样本 `meta.web_detail_url` 均采用 `https://lexaidaily.example/d/<date>` 占位地址（内部试运行标记为 `internal: true`，Gate 3 上线前替换为正式域名）。
3. **协同治理待同步**：[STATUS.md](coordination/STATUS.md) 仍停留在 2026-11-26（Gate 1 终审），[docs/audits/README.md](audits/README.md) 中 `LD-G2-03` R1 原稿尚待补档；`LD-G2-07`（[#45](https://github.com/fitalex/LexAIDaily/issues/45)）起草 Gate 2 验收清单时可一并统筹收口。
