# LexAIDaily《人工审校与发布 SOP 文档》（LD-G2-04）

> **适用阶段**：Gate 2 每日早报汇流后的人工终审与双端发布准备（关联 Issue `#42`、`ADR-0002`、`ADR-0003`、`D-019`）。
> **目标耗时**：**单日 ≤ 20 分钟**（依靠 Stage 1 `evidence_quotes` 与 `needs_human_check` 告警实现 3 秒对照核验）。
> **终审权归属**：AI 仅产出标注「AI 初稿」的待审候选；入刊、摘除「AI 初稿」、勾选「头条」与对外发布的最终决定权**严格属于 Human Maintainer**。

---

## 一、审校前输入清单

执行 `npm run daily`（或分步执行 `collect:cn` / `collect:global` / `curate`）后，当日审校人员打开以下 4 组产物：

| 文件路径 | 用途 |
|---|---|
| `data/candidates/<YYYY-MM-DD>/{cn,global}-meta.json` | 查看当日双轨抓取成功率、降级源与异常告警 |
| `data/bundles/<YYYY-MM-DD>.json` | 当日待审早报初稿（含预览层摘要、详情页 `detail_analysis`、`unverified_reason` 与 `needs_human_check` 标记） |
| `data/bundles/<YYYY-MM-DD>-review.md` | 当日 AI 审校诊断简报（逐条展示 Stage 1/2 模式、模板版本、Schema 校验重试次数、LLM 降级状态与具体未命中数字/日期） |
| `data/topic-pool/<YYYY-MM-DD>.md` | 当日自动入池的公众号深度选题清单（多源交叉 / 高风险法规 / 高热度 / 超长法规） |

---

## 二、单日 ≤ 20 分钟标准化审校流水线

### 步骤 1（0–3 分钟）：异常与降级快检

1. 打开 `data/bundles/<YYYY-MM-DD>.json` 的 `meta.digest` 与 `data/bundles/<YYYY-MM-DD>-review.md`，确认是否存在降级提示（如 `缺失轨`、`异常源`、`缓存缺失`、`LLM降级`、`校验重试`）。
2. 检查 `{cn,global}-meta.json` 中 `status` 为 `error` 或 `degraded` 的信源：
   - 若为 T1 合规哨兵（最高法、网信办、EU AI Office、UK ICO）故障，确认是否需在 `.local/manual-inbox.yaml` 人工补录链接后重跑 `npm run daily`。
   - 若为 Layer 2 公众号桥接（`we-mp-rss`）401/403 降级，记录待登录续期，不阻塞当日早报发布。

### 步骤 2（3–12 分钟）：依托 `evidence_quotes` 的 3 秒真伪核验

按优先级依次审校 `items`（**先审 `needs_human_check: true` 与 `high_risk_legal: true` 条目**）：

1. **优先排查红旗项（`needs_human_check: true`）**：
   - 若因 Stage 2 数字/日期忠实度未命中触发：查看 `data/bundles/<YYYY-MM-DD>-review.md` 与该条目的 `unverified_reason`（已直接列出未命中数字/日期），对照 `detail_analysis.evidence_quotes` 中的逐字短引文（含 `locator` 定位）或点击 `source_url` 核对一手原页，修正错误数字/日期，确认无误后将 `needs_human_check` 改为 `false`。
   - 若因无明确发布日期触发（查看 `unverified_reason`）：打开 `source_url` 确认原页真实发布日期，回填准确 `published_at`。
2. **高风险法律条目复核（`high_risk_legal: true`）**：
   - 必须人工核对 `effective_status`（`draft` / `proposed` / `enacted` / `in_force` / `amended` / `superseded` / `repealed` / `guidance` / `not_applicable`）与官方原页一致。
   - 若新规已替代旧规，须补填 `superseded_by`。
   - 若条目来自 `aihot-news-discovery`（`discovered_via` 非空），确认 `source_url` 为合法一手外域原链且事实层级准确。
3. **常规实务条目抽核（每条 ≤ 30 秒）**：
   - 用 `evidence_quotes` 快速交叉验证 `summary`（≤160 字）与 `key_points`（3–5 条），剔除低价值或重复条目（将 `review_status` 设为 `"rejected"`）。

### 步骤 3（12–16 分钟）：选刊、勾选「头条」与注入实务锐评

1. **勾选当日入刊条目**：保留 8–14 条高价值实务与合规条目，确认双轨合规哨兵占比控制在 **15%–25%**，≥75% 聚焦「法律人如何用 AI 提升工作效率」。
2. **人工勾选「头条」（D-019 硬红线）**：
   - 默认所有条目 `headline` 均为 `false`。
   - 仅由审校人员结合当日实务影响力度，手工为 1–2 条核心条目将 `headline` 改为 `true`。
3. **审校评述并摘除「AI 初稿」标识**：
   - 审阅 `practice_impact_brief`（≤60 字）与 `detail_analysis.legal_commentary`（200–400 字），删除空泛表述，按需注入一线律师/法务实务锐评。
   - 逐条核对通过后，将：
     - `review_status` 改为 `"approved"`
     - `practice_impact_is_ai_draft` 改为 `false`
     - `detail_analysis.ai_draft` 改为 `false`
     - 若已完成官方一手核实且确认无误，可将 `unverified` 改为 `false` 并移除 `unverified_reason`。
   - **未人工精修的条目禁止摘除 `ai_draft: true`**。

### 步骤 4（16–18 分钟）：周度深度选题池筛选

1. 浏览 `data/topic-pool/<YYYY-MM-DD>.md`（对应 `schemas/wechat-topic-pool.schema.json`），重点关注触发 `long_regulation_split`（超长法规分段）或 `multi_source_cross_report`（多源交叉报道）的条目。
2. 对具备公众号深度长文价值的选题，在对应 `data/topic-pool/<YYYY-MM-DD>.json` 中将 `status` 从 `"queued"` 更新为 `"selected"`（每周集中挑选 1–2 篇）。

### 步骤 5（18–20 分钟）：契约终检与双端导出粘贴检查

1. 运行公开契约与缓存隔离校验：
   ```bash
   npm run validate:contracts
   ```
   确认输出 `{"valid": true, "trackedFiles": [], ...}`，且无任何 `.cache/raw/` 或禁用全文字段混入公开 JSON。
2. 渲染微信公众号内联 HTML 样稿并检查粘贴效果：
   - 确认公众号正文不含任何 `<a href>` 外部超链接（遵循 Gate 1 微信规范，一手原链仅存于 Web 详情页与 JSON）。
   - 在微信公众平台编辑器粘贴预览，核对今日综述目录条数、事实层级标签、暖报纸底色 `#D5C5AE` 与免责声明显示正常。
   - 确认无误后执行发布。

---

## 三、不可逾越的审校红线清单

| 红线编号 | 检查项 | 违背后果与处置 |
|---|---|---|
| **R-01** | **零全文入公开库（ADR-0002）** | 严禁将 `.cache/raw/` 原文或超过 150 字的长段原文粘贴进 `summary`、`evidence_quotes` 或任何公开 JSON |
| **R-02** | **AI 严禁自标头条（D-019）** | 凡 `review_status: "pending_review"` 的条目 `headline` 必须为 `false`；仅有权审校人可终审勾选 |
| **R-03** | **严禁个案确定性法律结论** | `legal_commentary` 只能提供实务工作流建议与合规排查要点，不得替读者下达“必然违法/必然胜诉”等个案法律结论 |
| **R-04** | **AIHOT 严禁作正文信源（ADR-0003）** | 严禁出现 `aihot.news` 作为 `source_url` 或引用 AIHOT 站内摘要；Gate 3/4 对外商业发布前须完成 AIHOT 书面授权确认 |
| **R-05** | **未经核实必须保留兜底标（O4）** | 无法确认发布日期、效力状态或来自二手/预印本的条目，必须保留 `unverified: true` 与 `fact_tier: "market_opinion"` |
