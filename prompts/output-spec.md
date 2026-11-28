---
spec_id: ld-g2-04-output-spec
version: 1.1.0
schema_ref: schemas/candidate-item.schema.json
---

## 独立格式规范段（Strict Output Contract）

仅输出**单个合法 JSON 对象**（UTF-8 纯文本，不得包含任何 HTML 标签、`<script>`、Markdown 围栏外解释或注释），并严格满足下表全部字段与字数硬约束：

| 字段路径 | 类型 | 必填 | 约束与枚举（与 `#39` Schema 100% 对齐） |
|---|---|---|---|
| `summary` | `string` | 是 | **20–160 字**（O2 硬上限，纯文本，禁止 HTML） |
| `practice_impact_brief` | `string` | 是 | **10–60 字**（1 句极简实务影响锚点） |
| `practice_impact_is_ai_draft` | `boolean` | 是 | 恒为 `true`（`pending_review` 状态下不可为 `false`） |
| `fact_tier` | `string` | 是 | 三选一：`confirmed_fact` \| `official_data` \| `market_opinion` |
| `unverified` | `boolean` | 是 | 未经官方一手核实或商业通稿/预印本时必须为 `true`（O4 兜底） |
| `headline` | `boolean` | 是 | 恒为 `false`（D-019，仅人工终审勾选） |
| `review_status` | `string` | 是 | 恒为 `"pending_review"` |
| `detail_analysis.key_points` | `string[]` | 是 | **1–3 段**实质核心观点论证（按「观点→证据→解析→回应」展开，每段仅 1 句长句，严禁元标注标签），**各段合计 ≤600 字**（单段 8–600 字） |
| `detail_analysis.evidence_quotes` | `object[]` | 是 | **1–3 条**，每条含 `text`（**8–150 字**逐字短引文）与可选 `locator`（≤80 字） |
| `detail_analysis.legal_commentary` | `string` | 是 | **200–400 字**（固定以 `【AI 初稿】` 开头、`本评述为 AI 初稿，仅作实务参考，不构成正式法律意见。` 结尾，严禁下确定个案法律结论） |
| `detail_analysis.ai_draft` | `boolean` | 是 | 恒为 `true`（全块标「AI 初稿」） |

### 严禁输出的禁用字段（ADR-0002）

严禁在 JSON 任意层级出现以下全文字段（大小写或驼峰变体均禁止）：
`raw_text`、`full_text`、`html_content`、`body_html`、`raw_html`、`full_content`、`article_body`。

### 返回 JSON 模板

```json
{
  "summary": "20-160字精炼摘要",
  "practice_impact_brief": "10-60字实务影响锚点",
  "practice_impact_is_ai_draft": true,
  "fact_tier": "confirmed_fact",
  "unverified": false,
  "headline": false,
  "review_status": "pending_review",
  "detail_analysis": {
    "key_points": [
      "核心观点段落1（观点→理由与原文证据→逻辑解析→回应质疑，仅1句长句，无元标注，全部段落合计≤600字）"
    ],
    "evidence_quotes": [
      {
        "text": "8-150字逐字短引文（直接复用Stage 1）",
        "locator": "出处定位"
      }
    ],
    "legal_commentary": "【AI 初稿】200-400字一线法律实务深度评述，聚焦工作流落地与合规排查。本评述为 AI 初稿，仅作实务参考，不构成正式法律意见。",
    "ai_draft": true
  }
}
```
