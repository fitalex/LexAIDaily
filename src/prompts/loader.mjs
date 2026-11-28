import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_PROMPTS_DIR = path.resolve(__dirname, "../../prompts");

const templateCache = new Map();

/**
 * Parses YAML-like scalar frontmatter delimited by `---` at the start of a prompt markdown file.
 */
export function parsePromptFrontmatter(rawMarkdown) {
  const text = String(rawMarkdown ?? "").replace(/\r\n/g, "\n");
  const match = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) {
    return { meta: {}, body: text.trim() };
  }
  const meta = {};
  for (const line of match[1].split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const sepIdx = trimmed.indexOf(":");
    if (sepIdx <= 0) continue;
    const key = trimmed.slice(0, sepIdx).trim();
    const val = trimmed
      .slice(sepIdx + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
    meta[key] = val;
  }
  return { meta, body: match[2].trim() };
}

/**
 * Loads and caches a versioned prompt template from `prompts/`.
 */
export function loadPromptTemplate(
  filename,
  { promptsDir = DEFAULT_PROMPTS_DIR, bypassCache = false } = {},
) {
  const resolvedPath = path.resolve(promptsDir, filename);
  if (!bypassCache && templateCache.has(resolvedPath)) {
    return templateCache.get(resolvedPath);
  }
  const raw = readFileSync(resolvedPath, "utf8");
  const { meta, body } = parsePromptFrontmatter(raw);
  const record = {
    filename,
    path: resolvedPath,
    meta,
    body,
    raw,
  };
  if (!bypassCache) {
    templateCache.set(resolvedPath, record);
  }
  return record;
}

/**
 * Safely interpolates `{{placeholder}}` tokens using a function replacer
 * so `$&` / `$1` sequences in legal text are never interpreted as regex backreferences.
 */
export function renderTemplate(templateBody, vars = {}) {
  return String(templateBody ?? "").replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (full, key) => {
    if (Object.prototype.hasOwnProperty.call(vars, key)) {
      const val = vars[key];
      return val === undefined || val === null ? "" : String(val);
    }
    return full;
  });
}

export function renderStage1Prompt({ candidate, rawText }, options = {}) {
  const tpl = loadPromptTemplate("stage1-fact-extract.md", options);
  const prompt = renderTemplate(tpl.body, {
    title: candidate?.title ?? "",
    source_name: candidate?.source_name ?? "",
    region: candidate?.region ?? "global",
    source_url: candidate?.source_url ?? "",
    published_at: candidate?.published_at ?? "",
    high_risk_legal: Boolean(candidate?.high_risk_legal),
    raw_text: String(rawText ?? ""),
  });
  return {
    prompt,
    promptId: tpl.meta.prompt_id || "ld-g2-04-stage1-fact-extract",
    version: tpl.meta.version || "1.0.0",
  };
}

export function renderStage2Prompt({ candidate, stage1 }, options = {}) {
  const tpl = loadPromptTemplate("stage2-dual-layer.md", options);
  const outputSpec = loadPromptTemplate("output-spec.md", options);
  const prompt = renderTemplate(tpl.body, {
    title: candidate?.title ?? "",
    source_name: candidate?.source_name ?? "",
    published_at: candidate?.published_at ?? "",
    category: candidate?.category ?? "实务与工具",
    fact_tier: candidate?.fact_tier ?? "market_opinion",
    high_risk_legal: Boolean(candidate?.high_risk_legal),
    effective_status: candidate?.effective_status ?? stage1?.effective_status ?? "not_applicable",
    stage1_json: JSON.stringify(stage1 ?? {}, null, 2),
    output_spec: outputSpec.body,
  });
  return {
    prompt,
    promptId: tpl.meta.prompt_id || "ld-g2-04-stage2-dual-layer",
    version: tpl.meta.version || "1.0.0",
    outputSpecVersion: outputSpec.meta.version || "1.0.0",
  };
}

/**
 * Formats ajv schema validation errors into a concise structured correction prompt
 * for bounded validation-error feedback retry (inspired by instructor-js pattern, zero extra deps).
 */
export function buildValidationRetryPrompt({ validationErrors = [], attempt = 1 } = {}) {
  const formatted = validationErrors
    .slice(0, 8)
    .map((err, idx) => {
      const loc = err.instancePath || "$";
      const detail = err.message || err.keyword || "schema mismatch";
      const params = err.params ? ` (${JSON.stringify(err.params)})` : "";
      return `${idx + 1}. 路径 \`${loc}\`：${detail}${params}`;
    })
    .join("\n");

  return [
    `你上一次输出的 JSON 未通过 LexAIDaily #39 CandidateItem JSON Schema 校验（第 ${attempt} 次纠错重试）。`,
    "请严格逐项修复以下校验错误，并重新输出单个合法纯 JSON 对象（严禁包含 HTML、严禁超出字数上限、严禁编造 Stage 1 之外的数字或日期）：",
    formatted || "1. 输出不是合法 JSON 对象或缺少必填字段。",
  ].join("\n\n");
}
