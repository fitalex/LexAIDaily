# LexAIDaily 两阶段事实锚定提示词模板包（LD-G2-04）

> **版本**：`v1.0.0`｜**关联任务**：Issue `#42`（`LD-G2-04`，Parent `#38`）
> **契约基准**：100% 对齐 `schemas/candidate-item.schema.json`（`LD-G2-01` / `#39`）与 `docs/adr/ADR-0002`、`ADR-0003`、`GLOSSARY.md`。
> **依赖策略**：方案 A（零新增 npm 运行时依赖）；校验与失败回灌重试直接复用 `src/contracts/validate.mjs`（`ajv` + `ajv-formats`）。

## 1. 目录结构

| 文件 | 作用 | 版本 |
|---|---|---|
| `prompts/stage1-fact-extract.md` | **Stage 1（事实卡片 + 合规短引文抽取）**：从 `.cache/raw/` 完整纯文本抽取机构、日期、文号/版本、效力状态、关键数字与 1–3 句逐字短引文（单段 ≤150 字），超长法规按条款分段提炼并标记送入深度选题池 | `1.0.0` |
| `prompts/stage2-dual-layer.md` | **Stage 2（双层内容生成）**：仅基于 Stage 1 事实卡片生成预览层（≤160 字摘要 + ≤60 字实务影响锚点）与详情页（3–5 条要点 + 1–3 句短引文 + 200–400 字法律实务深度评述） | `1.0.0` |
| `prompts/output-spec.md` | **独立格式规范段**：与任务指令解耦的严格 JSON 字段、字数上下限、枚举值、禁含全文字段与回灌重试纠错模板（概念参考 TrendRadar 独立格式段思路，未拷贝其代码） | `1.0.0` |
| `prompts/eval/promptfooconfig.yaml` | **可选离线/多模型横向评测配置**：零依赖参考模板，按需通过 `npx promptfoo eval -c prompts/eval/promptfooconfig.yaml` 运行，不写入 `package.json` | `1.0.0` |

## 2. 运行时调用与校验重试流程

1. `src/prompts/loader.mjs` 读取并缓存上述模板文件，解析 YAML frontmatter（`prompt_id`、`version`）并渲染 `{{variable}}` 占位符。
2. `src/pipeline/merge-and-curate/fact-anchor.mjs` 在 `runStage2DualLayer` 中调用 `renderStage2Prompt(...)` 生成提示词（注入 `output-spec.md`）。
3. 收到 LLM 返回的 JSON 后，先执行 `#39` `validateBySchemaName("candidate-item", candidate)`；若校验失败（例如 `summary` 超 160 字或 `legal_commentary` 不足 200 字），自动调用 `buildValidationRetryPrompt(errors)` 把精确的 `ajv` 错误回灌给模型进行至多 1 次纠错重试（借鉴 `instructor-js` 校验回灌思路，不引入额外 SDK）。
4. 最终输出强制执行代码级硬约束：`practice_impact_is_ai_draft = true`、`detail_analysis.ai_draft = true`、`headline = false`、`review_status = "pending_review"`，并对 `summary` 与 `key_points` 中的数字/日期执行 `verifyFaithfulness` 忠实度核验，未命中则自动置 `needs_human_check = true`。

## 3. 版本演进规范

- 任何字段长度、枚举值或红线条款调整必须同步递增模板 frontmatter 的 `version`，并在 `tests/prompts/prompts.test.mjs` 通过 Gate 1 真实样本集回归测试。
- 严禁在提示词模板或公开 JSON 中引入 `raw_text`、`full_text`、`html_content` 等全文归档字段（ADR-0002）。
