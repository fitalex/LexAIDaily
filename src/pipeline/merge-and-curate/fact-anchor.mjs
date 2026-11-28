import { stripHtmlToPlainText } from "../../collectors/shared/extractor.mjs";
import { fetchWithRetry } from "../../collectors/shared/http.mjs";
import { validateBySchemaName } from "../../contracts/validate.mjs";
import {
  buildValidationRetryPrompt,
  renderStage1Prompt,
  renderStage2Prompt,
} from "../../prompts/loader.mjs";

const LONG_REGULATION_CHAR_THRESHOLD = 6000;
const REGULATION_ARTICLE_RE =
  /(第\s*[一二三四五六七八九十百零\d]+\s*(?:\(\d+\)\s*)?条|\bArticle\s+\d+(?:\(\d+\))?\b|\bSection\s+\d+(?:\(\d+\))?\b)/gi;
const EFFECTIVE_STATUS_ENUM = new Set([
  "draft",
  "proposed",
  "enacted",
  "in_force",
  "amended",
  "superseded",
  "repealed",
  "guidance",
  "not_applicable",
]);

const zhSegmenter =
  typeof Intl !== "undefined" && typeof Intl.Segmenter === "function"
    ? new Intl.Segmenter("zh", { granularity: "sentence" })
    : null;

const ZH_DIGIT_MAP = {
  零: 0,
  〇: 0,
  一: 1,
  二: 2,
  两: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
};

const ZH_UNIT_MAP = {
  十: 10,
  百: 100,
  千: 1000,
  万: 10000,
};

/**
 * Resolves LLM provider credentials and matching default base URL / model so
 * OPENAI_API_KEY is never routed to DeepSeek's default endpoint.
 */
export function resolveLlmConfig(env = process.env) {
  if (env?.DEEPSEEK_API_KEY) {
    return {
      provider: "deepseek",
      apiKey: env.DEEPSEEK_API_KEY,
      apiBase: (env.DEEPSEEK_API_BASE || "https://api.deepseek.com/v1").replace(/\/+$/, ""),
      model: env.DEEPSEEK_MODEL || "deepseek-chat",
    };
  }
  if (env?.OPENAI_API_KEY) {
    return {
      provider: "openai",
      apiKey: env.OPENAI_API_KEY,
      apiBase: (env.OPENAI_API_BASE || "https://api.openai.com/v1").replace(/\/+$/, ""),
      model: env.OPENAI_MODEL || "gpt-4o-mini",
    };
  }
  return { provider: null, apiKey: "", apiBase: "", model: "" };
}

export function normalizeFullwidthDigits(input) {
  return String(input ?? "")
    .replace(/[０-９]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
    .replace(/％/g, "%")
    .replace(/．/g, ".");
}

export function chineseNumberToArabic(rawZh) {
  const s = String(rawZh ?? "").trim();
  if (!s || !/^[零〇一二两三四五六七八九十百千万]+$/.test(s)) return null;
  let total = 0;
  let section = 0;
  let current = 0;

  for (const ch of s) {
    if (Object.prototype.hasOwnProperty.call(ZH_DIGIT_MAP, ch)) {
      current = ZH_DIGIT_MAP[ch];
    } else if (Object.prototype.hasOwnProperty.call(ZH_UNIT_MAP, ch)) {
      const unit = ZH_UNIT_MAP[ch];
      if (unit === 10000) {
        section = (section + current) * unit;
        total += section;
        section = 0;
        current = 0;
      } else {
        if (current === 0 && unit === 10) {
          current = 1;
        }
        section += current * unit;
        current = 0;
      }
    }
  }
  const result = total + section + current;
  return Number.isFinite(result) && result > 0 ? String(result) : null;
}

function normalizeForNumberMatching(text) {
  let out = normalizeFullwidthDigits(text);
  // Remove thousand-separator commas inside numbers (e.g. 1,920 -> 1920)
  out = out.replace(/(?<=\d),(?=\d{3}\b)/g, "");
  // Normalize spaced Chinese dates (e.g. "2026 年 11 月 20 日" -> "2026年11月20日", "11 月 20 日" -> "11月20日")
  out = out.replace(/(\d{4})\s*年\s*(\d{1,2})\s*月(?:\s*(\d{1,2})\s*日)?/g, (_m, y, mo, d) =>
    d ? `${y}年${mo}月${d}日` : `${y}年${mo}月`,
  );
  out = out.replace(/(?<!\d)(\d{1,2})\s*月\s*(\d{1,2})\s*日/g, "$1月$2日");
  // Expand Chinese percentages & unit-bound Chinese numerals so cross-script matching works
  out = out.replace(/百分之([零〇一二两三四五六七八九十百千万]+)/g, (m, zh) => {
    const num = chineseNumberToArabic(zh);
    return num ? `${m} ${num}%` : m;
  });
  out = out.replace(
    /([零〇一二两三四五六七八九十百千万]+)(?=\s*(?:日|天|个月|年|万元|亿元|元|条|项|款|家|个法域|名|倍|篇|份|次))/g,
    (m, zh) => {
      const num = chineseNumberToArabic(zh);
      return num ? `${m} ${num} ` : m;
    },
  );
  return out;
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function splitSentences(text) {
  const clean = stripHtmlToPlainText(text).replace(/\r\n/g, "\n");
  if (!clean) return [];

  let rawParts = [];
  if (zhSegmenter) {
    for (const seg of zhSegmenter.segment(clean)) {
      const trimmed = seg.segment.replace(/\s+/g, " ").trim();
      if (trimmed) rawParts.push(trimmed);
    }
  } else {
    rawParts = clean
      .split(/(?<=[。！？!?])|(?<=\.)\s+|\n+/)
      .map((s) => s.replace(/\s+/g, " ").trim())
      .filter(Boolean);
  }
  return rawParts.filter((s) => s.length >= 10);
}

function clampText(text, minLen, maxLen, pad = "，详情请核对原始出处。") {
  let out = stripHtmlToPlainText(text).replace(/\s+/g, " ").trim();
  if (out.length > maxLen) {
    out = out.slice(0, maxLen).trim();
  }
  while (out.length < minLen) {
    out = `${out}${pad}`;
  }
  return out;
}

export function extractDocumentNumberOrVersion(text) {
  const clean = normalizeFullwidthDigits(stripHtmlToPlainText(text));
  if (!clean) return null;

  const patterns = [
    // Chinese official document numbers, e.g. 国发〔2026〕12号 / 法释〔2026〕3号
    /[\u4e00-\u9fa5]{1,10}[〔\[（(]\s*20\d{2}\s*[〕\]）)]\s*\d+\s*号/,
    // Named statutory / rule clauses, e.g. UK GDPR 第 15 条 / Rule 11 / Article 27(5)
    /(?:UK\s+GDPR|GDPR|《[^》]{2,24}》)\s*第\s*[一二三四五六七八九十百零\d]+(?:\(\d+\))?\s*条/,
    /\b(?:Rule|Article|Section)\s+\d+(?:\(\d+\))?\b/i,
    // Release / edition / preprint / model versions
    /20\d{2}\s*年\s*\d{1,2}\s*月(?:版本|版)/,
    /第\s*\d+\s*期/,
    /\bv\d+(?:\.\d+){1,2}\b/i,
    /\b2\d{3}\.\d{4,5}v\d+\b/i,
    /\bTRL\s*\d+\s*[-–—]\s*\d+\b/i,
    /第\s*[一二三四五六七八九十百零\d]+(?:\(\d+\))?\s*条/,
  ];

  for (const re of patterns) {
    const m = clean.match(re);
    if (m && m[0]) {
      return m[0].replace(/\s+/g, " ").trim();
    }
  }
  return null;
}

export function detectAndSplitLongRegulation(rawText) {
  const text = stripHtmlToPlainText(rawText);
  const articleMatches = text.match(REGULATION_ARTICLE_RE) ?? [];
  const isLong =
    text.length >= LONG_REGULATION_CHAR_THRESHOLD || articleMatches.length >= 8;
  if (!isLong) {
    return { isLongRegulation: false, segments: [text] };
  }

  const clauses = text
    .split(
      /(?=第\s*[一二三四五六七八九十百零\d]+\s*(?:\(\d+\)\s*)?条|\bArticle\s+\d+(?:\(\d+\))?\b|\bSection\s+\d+(?:\(\d+\))?\b)/gi,
    )
    .map((c) => c.trim())
    .filter(Boolean);

  if (clauses.length >= 4) {
    const segCount = Math.min(4, clauses.length);
    const perSeg = Math.ceil(clauses.length / segCount);
    const segments = [];
    for (let i = 0; i < clauses.length; i += perSeg) {
      segments.push(clauses.slice(i, i + perSeg).join(" "));
    }
    return { isLongRegulation: true, segments };
  }

  const segments = [];
  const chunkSize = Math.ceil(text.length / 4);
  for (let i = 0; i < text.length && segments.length < 4; i += chunkSize) {
    segments.push(text.slice(i, i + chunkSize));
  }
  return { isLongRegulation: true, segments };
}

export function extractNumbersAndDates(text) {
  const normalized = normalizeForNumberMatching(text);
  const tokens = new Set();

  // 1. Full dates (YYYY-MM-DD, YYYY/MM/DD, YYYY年M月D日, YYYY年M月)
  const fullDates =
    normalized.match(/\d{4}[-/年]\d{1,2}(?:[-/月]\d{1,2}日?)?/g) ?? [];
  for (const d of fullDates) {
    tokens.add(d);
  }

  // 2. Yearless month-day dates (e.g. 11月20日, 12月4日) not preceded by YYYY年
  const monthDays = normalized.match(/(?<!\d年)(?<!\d)\d{1,2}月\d{1,2}日/g) ?? [];
  for (const md of monthDays) {
    tokens.add(md);
  }

  // 3. Percentages (e.g. 76.2%, 85%, including expanded Chinese percentages)
  const pcts = normalized.match(/\d+(?:\.\d+)?%/g) ?? [];
  for (const p of pcts) {
    tokens.add(p);
  }

  // 4. Standalone Arabic numbers (>= 2 digits or decimals)
  const nums = normalized.match(/(?<!\d)\d{2,}(?:\.\d+)?(?!\d)|(?<!\d)\d+\.\d+(?!\d)/g) ?? [];
  for (const n of nums) {
    tokens.add(n);
  }

  // 5. Unit-bound Chinese numerals (e.g. 三十日 -> 30, 三个月 -> 3)
  const zhNumRe =
    /([零〇一二两三四五六七八九十百千万]+)(?=\s*(?:日|天|个月|年|万元|亿元|元|条|项|款|家|个法域|名|倍|篇|份|次))/g;
  for (const m of String(text ?? "").matchAll(zhNumRe)) {
    const val = chineseNumberToArabic(m[1]);
    if (val) tokens.add(val);
  }

  return Array.from(tokens);
}

function tokenExistsInNormalizedText(token, normalizedSource) {
  const escaped = escapeRegExp(token);
  if (/^\d+(?:\.\d+)?%?$/.test(token)) {
    const re = new RegExp(`(?<!\\d)${escaped}(?!\\d)`);
    return re.test(normalizedSource);
  }
  const re = new RegExp(`(?<!\\d)${escaped}(?!\\d)`);
  return re.test(normalizedSource);
}

export function verifyFaithfulness({
  summary = "",
  keyPoints = [],
  legalCommentary = "",
  rawText = "",
  allowedTokens = [],
}) {
  const normalizedRaw = normalizeForNumberMatching(rawText);
  const normalizedAllowed = normalizeForNumberMatching(allowedTokens.join("\n"));
  const targetText = [summary, ...keyPoints, legalCommentary].join("\n");
  const tokens = extractNumbersAndDates(targetText);
  const missing = [];

  for (const tok of tokens) {
    const inRaw = tokenExistsInNormalizedText(tok, normalizedRaw);
    const inAllowed =
      normalizedAllowed.length > 0 && tokenExistsInNormalizedText(tok, normalizedAllowed);
    if (!inRaw && !inAllowed) {
      missing.push(tok);
    }
  }
  return {
    faithful: missing.length === 0,
    missingTokens: missing,
    checkedTokens: tokens,
  };
}

export function runStage1FactExtraction({ candidate, rawText }) {
  const text = stripHtmlToPlainText(rawText);
  const { isLongRegulation, segments } = detectAndSplitLongRegulation(text);

  const quotes = [];
  const leadSentences = [];
  const allNumbers = new Set();

  for (let segIdx = 0; segIdx < segments.length; segIdx += 1) {
    const segText = segments[segIdx];
    for (const num of extractNumbersAndDates(segText)) {
      allNumbers.add(num);
    }
    const segSentences = splitSentences(segText);
    if (isLongRegulation) {
      if (segSentences[0]) {
        leadSentences.push(segSentences[0]);
        if (quotes.length < 3) {
          quotes.push({
            text: clampText(segSentences[0], 8, 150, ""),
            locator: `核心条款段 ${segIdx + 1}`,
          });
        }
      }
    } else {
      for (let i = 0; i < segSentences.length; i += 1) {
        if (leadSentences.length < 5) leadSentences.push(segSentences[i]);
        if (quotes.length < 3) {
          quotes.push({
            text: clampText(segSentences[i], 8, 150, ""),
            locator: `正文第 ${i + 1} 句`,
          });
        }
      }
    }
  }

  if (quotes.length === 0) {
    quotes.push({
      text: clampText(candidate.title, 8, 150, "（原始标题摘录）"),
      locator: "标题",
    });
  }

  return {
    issuer: candidate.source_name,
    published_at: candidate.published_at,
    document_number_or_version:
      extractDocumentNumberOrVersion(`${candidate.title}\n${text}`) ?? null,
    numbers_and_dates: Array.from(allNumbers).slice(0, 12),
    effective_status: candidate.effective_status || "not_applicable",
    is_long_regulation: isLongRegulation,
    segment_count: segments.length,
    evidence_quotes: quotes,
    lead_sentences: leadSentences.slice(0, 5),
  };
}

/**
 * Runtime Stage 1 entry point wired to `prompts/stage1-fact-extract.md`.
 * Uses LLM extraction when online with credentials and falls back cleanly to
 * deterministic `runStage1FactExtraction` when offline or on invalid output.
 */
export async function runStage1WithLlm({
  candidate,
  rawText,
  offline = false,
  env = process.env,
  fetchImpl = globalThis.fetch,
  promptsDir = undefined,
}) {
  const deterministic = runStage1FactExtraction({ candidate, rawText });
  const rendered = renderStage1Prompt(
    { candidate, rawText },
    promptsDir ? { promptsDir } : {},
  );
  const llmCfg = resolveLlmConfig(env);

  if (offline || !llmCfg.apiKey) {
    return {
      stage1: deterministic,
      stage1Meta: {
        promptId: rendered.promptId,
        version: rendered.version,
        mode: "deterministic",
        usedFallback: false,
      },
    };
  }

  try {
    const reqHeaders = { "Content-Type": "application/json" };
    reqHeaders.Authorization = ["Bearer", llmCfg.apiKey].join(" ");
    const res = await fetchWithRetry(`${llmCfg.apiBase}/chat/completions`, {
      fetchImpl,
      method: "POST",
      timeoutMs: 25000,
      retries: 1,
      headers: reqHeaders,
      body: JSON.stringify({
        model: llmCfg.model,
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [{ role: "user", content: rendered.prompt }],
      }),
    });

    if (res.ok) {
      const bodyText = new TextDecoder("utf-8").decode(res.buffer);
      const completion = JSON.parse(bodyText);
      const content = completion?.choices?.[0]?.message?.content;
      if (typeof content === "string" && content.trim()) {
        const parsed = JSON.parse(content);
        const validQuotes = Array.isArray(parsed?.evidence_quotes)
          ? parsed.evidence_quotes
              .filter(
                (q) =>
                  q &&
                  typeof q.text === "string" &&
                  stripHtmlToPlainText(q.text).length >= 8 &&
                  stripHtmlToPlainText(q.text).length <= 150,
              )
              .slice(0, 3)
              .map((q) => ({
                text: stripHtmlToPlainText(q.text),
                ...(typeof q.locator === "string" && q.locator.trim()
                  ? { locator: stripHtmlToPlainText(q.locator).slice(0, 80) }
                  : {}),
              }))
          : [];

        const validLeads = Array.isArray(parsed?.lead_sentences)
          ? parsed.lead_sentences
              .filter((s) => typeof s === "string" && stripHtmlToPlainText(s).length >= 8)
              .map((s) => stripHtmlToPlainText(s))
              .slice(0, 5)
          : [];

        if (validQuotes.length >= 1) {
          const effStatus =
            typeof parsed.effective_status === "string" &&
            EFFECTIVE_STATUS_ENUM.has(parsed.effective_status)
              ? parsed.effective_status
              : deterministic.effective_status;

          const docNum =
            typeof parsed.document_number_or_version === "string" &&
            parsed.document_number_or_version.trim()
              ? stripHtmlToPlainText(parsed.document_number_or_version).slice(0, 120)
              : parsed.document_number_or_version === null
                ? deterministic.document_number_or_version
                : deterministic.document_number_or_version;

          const nums = Array.isArray(parsed.numbers_and_dates)
            ? parsed.numbers_and_dates
                .filter((x) => typeof x === "string" && x.trim())
                .map((x) => stripHtmlToPlainText(x))
                .slice(0, 12)
            : deterministic.numbers_and_dates;

          return {
            stage1: {
              issuer:
                typeof parsed.issuer === "string" && parsed.issuer.trim()
                  ? stripHtmlToPlainText(parsed.issuer).slice(0, 120)
                  : deterministic.issuer,
              published_at: deterministic.published_at,
              document_number_or_version: docNum,
              numbers_and_dates: nums.length > 0 ? nums : deterministic.numbers_and_dates,
              effective_status: effStatus,
              is_long_regulation:
                typeof parsed.is_long_regulation === "boolean"
                  ? parsed.is_long_regulation || deterministic.is_long_regulation
                  : deterministic.is_long_regulation,
              segment_count: deterministic.segment_count,
              evidence_quotes: validQuotes,
              lead_sentences: validLeads.length > 0 ? validLeads : deterministic.lead_sentences,
            },
            stage1Meta: {
              promptId: rendered.promptId,
              version: rendered.version,
              mode: "llm",
              usedFallback: false,
            },
          };
        }
      }
    }
  } catch {
    // Graceful fallback to deterministic Stage 1
  }

  return {
    stage1: deterministic,
    stage1Meta: {
      promptId: rendered.promptId,
      version: rendered.version,
      mode: "deterministic",
      usedFallback: true,
    },
  };
}

function buildDeterministicStage2({ candidate, stage1 }) {
  const lead = stage1.lead_sentences[0] || candidate.title;
  const summary = clampText(lead, 20, 160, "，详见一手原始信源披露内容。");

  const keyPoints = [];
  for (const s of stage1.lead_sentences.slice(0, 4)) {
    keyPoints.push(clampText(s, 8, 140, "。"));
  }
  while (keyPoints.length < 3) {
    const idx = keyPoints.length + 1;
    keyPoints.push(
      clampText(
        `要点 ${idx}：信源 ${candidate.source_name} 于 ${candidate.published_at} 发布「${candidate.title}」。`,
        8,
        140,
      ),
    );
  }

  const commentaryBase =
    `【AI 初稿】本条动态由 ${candidate.source_name} 于 ${candidate.published_at} 披露，聚焦「${candidate.title}」。` +
    `对法律从业者而言，建议结合原文核对适用边界、合规义务及实务提效场景，重点评估其在合同审查、法规检索、证据梳理或内部治理工作流中的可落地性。` +
    `若涉及监管红线或高风险法律适用，团队应先完成内部风险分级与人工复核，再决定是否纳入标准化办案与法务 SOP。` +
    `本文评述由程序基于一手原文自动生成，供人工终审参考，不构成正式法律意见。`;

  const legalCommentary = clampText(commentaryBase, 200, 400, "请结合最新官方文本持续跟踪。");

  return {
    summary,
    practice_impact_brief: clampText(candidate.practice_impact_brief, 10, 60),
    detail_analysis: {
      key_points: keyPoints.slice(0, 5),
      evidence_quotes: stage1.evidence_quotes.slice(0, 3),
      legal_commentary: legalCommentary,
      ai_draft: true,
    },
  };
}

/**
 * Normalizes LLM Stage 2 JSON output into a schema-checked CandidateItem draft.
 * Strictly preserves non-string types so ajv catches type violations and triggers retry,
 * while enforcing immutable governance guardrails (headline=false, ai_draft=true, pending_review).
 */
function buildCandidateDraftFromLlm({ candidate, stage1, parsed }) {
  const rawDetail =
    parsed?.detail_analysis && typeof parsed.detail_analysis === "object"
      ? parsed.detail_analysis
      : parsed;

  const rawKeyPoints = Array.isArray(rawDetail?.key_points)
    ? rawDetail.key_points.map((k) => (typeof k === "string" ? stripHtmlToPlainText(k) : k))
    : rawDetail?.key_points;

  const summary =
    typeof parsed?.summary === "string" ? stripHtmlToPlainText(parsed.summary) : parsed?.summary;
  const practiceImpactBrief =
    parsed?.practice_impact_brief === undefined
      ? candidate.practice_impact_brief
      : typeof parsed.practice_impact_brief === "string"
        ? stripHtmlToPlainText(parsed.practice_impact_brief)
        : parsed.practice_impact_brief;
  const legalCommentary =
    typeof rawDetail?.legal_commentary === "string"
      ? stripHtmlToPlainText(rawDetail.legal_commentary)
      : rawDetail?.legal_commentary;

  return {
    ...candidate,
    summary,
    practice_impact_brief: practiceImpactBrief,
    practice_impact_is_ai_draft: true,
    unverified: Boolean(candidate.unverified || parsed?.unverified === true),
    headline: false,
    review_status: "pending_review",
    detail_analysis: {
      key_points: rawKeyPoints,
      evidence_quotes: stage1.evidence_quotes.slice(0, 3),
      legal_commentary: legalCommentary,
      ai_draft: true,
    },
  };
}

function appendUnverifiedReason(existingReason, addition) {
  const base = String(existingReason ?? "").trim();
  const extra = String(addition ?? "").trim();
  if (!extra) return base || undefined;
  const merged = base ? `${base}；${extra}` : extra;
  return merged.length > 200 ? `${merged.slice(0, 197)}...` : merged;
}

export async function runStage2DualLayer({
  candidate,
  stage1,
  rawText,
  offline = false,
  env = process.env,
  fetchImpl = globalThis.fetch,
  promptsDir = undefined,
  maxValidationRetries = 1,
}) {
  const llmCfg = resolveLlmConfig(env);

  const rendered = renderStage2Prompt(
    { candidate, stage1 },
    promptsDir ? { promptsDir } : {},
  );

  let generated = null;
  let retryCount = 0;
  let usedFallback = false;

  if (!offline && llmCfg.apiKey) {
    const boundedRetries = Math.max(0, Math.min(2, Number(maxValidationRetries) || 0));
    const messages = [{ role: "user", content: rendered.prompt }];

    for (let attempt = 0; attempt <= boundedRetries; attempt += 1) {
      try {
        const reqHeaders = { "Content-Type": "application/json" };
        reqHeaders.Authorization = ["Bearer", llmCfg.apiKey].join(" ");
        const res = await fetchWithRetry(`${llmCfg.apiBase}/chat/completions`, {
          fetchImpl,
          method: "POST",
          timeoutMs: 25000,
          retries: 1,
          headers: reqHeaders,
          body: JSON.stringify({
            model: llmCfg.model,
            temperature: 0.2,
            response_format: { type: "json_object" },
            messages,
          }),
        });
        if (!res.ok) {
          break;
        }
        const bodyText = new TextDecoder("utf-8").decode(res.buffer);
        const completion = JSON.parse(bodyText);
        const content = completion?.choices?.[0]?.message?.content;
        if (typeof content !== "string" || !content.trim()) {
          if (attempt < boundedRetries) {
            retryCount += 1;
            messages.push({
              role: "user",
              content: buildValidationRetryPrompt({
                validationErrors: [{ instancePath: "$", message: "响应内容为空，必须返回合法 JSON 对象" }],
                attempt: retryCount,
              }),
            });
            continue;
          }
          break;
        }

        let parsed;
        try {
          parsed = JSON.parse(content);
        } catch (parseErr) {
          if (attempt < boundedRetries) {
            retryCount += 1;
            messages.push({ role: "assistant", content });
            messages.push({
              role: "user",
              content: buildValidationRetryPrompt({
                validationErrors: [{ instancePath: "$", message: `JSON 解析失败: ${parseErr.message}` }],
                attempt: retryCount,
              }),
            });
            continue;
          }
          break;
        }

        const candidateDraft = buildCandidateDraftFromLlm({ candidate, stage1, parsed });
        const check = validateBySchemaName("candidate-item", candidateDraft);
        if (check.valid) {
          generated = {
            summary: candidateDraft.summary,
            practice_impact_brief: candidateDraft.practice_impact_brief,
            unverified: candidateDraft.unverified,
            detail_analysis: candidateDraft.detail_analysis,
          };
          break;
        }

        if (attempt < boundedRetries) {
          retryCount += 1;
          messages.push({ role: "assistant", content });
          messages.push({
            role: "user",
            content: buildValidationRetryPrompt({
              validationErrors: check.errors,
              attempt: retryCount,
            }),
          });
          continue;
        }
      } catch {
        break;
      }
    }
  }

  if (!generated) {
    usedFallback = !offline && Boolean(llmCfg.apiKey);
    generated = buildDeterministicStage2({ candidate, stage1 });
  }

  const faithfulness = verifyFaithfulness({
    summary: generated.summary,
    keyPoints: generated.detail_analysis.key_points,
    legalCommentary: generated.detail_analysis.legal_commentary,
    rawText: rawText || candidate.title,
    allowedTokens: [candidate.published_at].filter(Boolean),
  });

  const faithfulnessReason = !faithfulness.faithful
    ? `数字/日期未在原文命中: ${faithfulness.missingTokens.slice(0, 6).join(", ")}`
    : undefined;
  const mergedReason = appendUnverifiedReason(candidate.unverified_reason, faithfulnessReason);

  let enriched = {
    ...candidate,
    summary: generated.summary,
    practice_impact_brief: generated.practice_impact_brief,
    practice_impact_is_ai_draft: true,
    unverified: Boolean(candidate.unverified || generated.unverified === true),
    ...(mergedReason ? { unverified_reason: mergedReason } : {}),
    needs_human_check: Boolean(candidate.needs_human_check || !faithfulness.faithful),
    headline: false,
    review_status: "pending_review",
    detail_analysis: generated.detail_analysis,
  };

  // Final post-assembly #39 Schema guard
  const finalCheck = validateBySchemaName("candidate-item", enriched);
  if (!finalCheck.valid) {
    usedFallback = true;
    const safe = buildDeterministicStage2({ candidate, stage1 });
    enriched = {
      ...candidate,
      summary: safe.summary,
      practice_impact_brief: safe.practice_impact_brief,
      practice_impact_is_ai_draft: true,
      unverified: Boolean(candidate.unverified),
      needs_human_check: true,
      headline: false,
      review_status: "pending_review",
      detail_analysis: safe.detail_analysis,
    };
  }

  return {
    item: enriched,
    faithfulness,
    promptMeta: {
      promptId: rendered.promptId,
      version: rendered.version,
      outputSpecVersion: rendered.outputSpecVersion,
      provider: llmCfg.provider,
      retryCount,
      usedFallback,
    },
  };
}
