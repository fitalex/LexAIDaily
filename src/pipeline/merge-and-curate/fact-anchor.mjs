import { stripHtmlToPlainText } from "../../collectors/shared/extractor.mjs";
import { fetchWithRetry } from "../../collectors/shared/http.mjs";
import { validateBySchemaName } from "../../contracts/validate.mjs";
import {
  buildValidationRetryPrompt,
  renderStage2Prompt,
} from "../../prompts/loader.mjs";

const LONG_REGULATION_CHAR_THRESHOLD = 6000;
const REGULATION_ARTICLE_RE = /(第[一二三四五六七八九十百零\d]+条|\bArticle\s+\d+\b|\bSection\s+\d+\b)/gi;
const zhSegmenter =
  typeof Intl !== "undefined" && typeof Intl.Segmenter === "function"
    ? new Intl.Segmenter("zh", { granularity: "sentence" })
    : null;

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

export function detectAndSplitLongRegulation(rawText) {
  const text = stripHtmlToPlainText(rawText);
  const articleMatches = text.match(REGULATION_ARTICLE_RE) ?? [];
  const isLong =
    text.length >= LONG_REGULATION_CHAR_THRESHOLD || articleMatches.length >= 8;
  if (!isLong) {
    return { isLongRegulation: false, segments: [text] };
  }

  const clauses = text
    .split(/(?=第[一二三四五六七八九十百零\d]+条|\bArticle\s+\d+\b|\bSection\s+\d+\b)/gi)
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
  const str = String(text ?? "");
  const tokens = new Set();
  const matches =
    str.match(/\d{4}[-/年]\d{1,2}(?:[-/月]\d{1,2}日?)?|\d+(?:\.\d+)?%|\b\d{2,}(?:,\d{3})*(?:\.\d+)?\b/g) ??
    [];
  for (const m of matches) {
    tokens.add(m.replace(/,/g, ""));
  }
  return Array.from(tokens);
}

export function verifyFaithfulness({ summary, keyPoints = [], rawText }) {
  const normalizedRaw = String(rawText ?? "").replace(/,/g, "");
  const targetText = [summary, ...keyPoints].join("\n");
  const tokens = extractNumbersAndDates(targetText);
  const missing = [];

  for (const tok of tokens) {
    if (!normalizedRaw.includes(tok)) {
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
    numbers_and_dates: Array.from(allNumbers).slice(0, 12),
    effective_status: candidate.effective_status || "not_applicable",
    is_long_regulation: isLongRegulation,
    segment_count: segments.length,
    evidence_quotes: quotes,
    lead_sentences: leadSentences.slice(0, 5),
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
 * Normalizes LLM Stage 2 JSON output into a schema-checked CandidateItem draft
 * while strictly enforcing immutable governance guardrails (D-019 headline=false,
 * ai_draft=true, pending_review, verbatim Stage 1 evidence_quotes, plain-text sanitization).
 */
function buildCandidateDraftFromLlm({ candidate, stage1, parsed }) {
  const rawDetail =
    parsed?.detail_analysis && typeof parsed.detail_analysis === "object"
      ? parsed.detail_analysis
      : parsed;

  const rawKeyPoints = Array.isArray(rawDetail?.key_points)
    ? rawDetail.key_points.map((k) => stripHtmlToPlainText(k))
    : [];

  const summary = stripHtmlToPlainText(parsed?.summary ?? "");
  const practiceImpactBrief = stripHtmlToPlainText(
    parsed?.practice_impact_brief || candidate.practice_impact_brief || "",
  );
  const legalCommentary = stripHtmlToPlainText(rawDetail?.legal_commentary ?? "");

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
  const apiKey = env.DEEPSEEK_API_KEY || env.OPENAI_API_KEY || "";
  const apiBase = (env.DEEPSEEK_API_BASE || env.OPENAI_API_BASE || "https://api.deepseek.com/v1").replace(
    /\/+$/,
    "",
  );
  const model = env.DEEPSEEK_MODEL || "deepseek-chat";

  const rendered = renderStage2Prompt(
    { candidate, stage1 },
    promptsDir ? { promptsDir } : {},
  );

  let generated = null;
  let retryCount = 0;
  let usedFallback = false;

  if (!offline && apiKey) {
    const boundedRetries = Math.max(0, Math.min(2, Number(maxValidationRetries) || 0));
    const messages = [{ role: "user", content: rendered.prompt }];

    for (let attempt = 0; attempt <= boundedRetries; attempt += 1) {
      try {
        const reqHeaders = { "Content-Type": "application/json" };
        reqHeaders.Authorization = ["Bearer", apiKey].join(" ");
        const res = await fetchWithRetry(`${apiBase}/chat/completions`, {
          fetchImpl,
          method: "POST",
          timeoutMs: 25000,
          retries: 1,
          headers: reqHeaders,
          body: JSON.stringify({
            model,
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
    usedFallback = !offline && Boolean(apiKey);
    generated = buildDeterministicStage2({ candidate, stage1 });
  }

  const faithfulness = verifyFaithfulness({
    summary: generated.summary,
    keyPoints: generated.detail_analysis.key_points,
    rawText: rawText || candidate.title,
  });

  const enriched = {
    ...candidate,
    summary: generated.summary,
    practice_impact_brief: generated.practice_impact_brief,
    practice_impact_is_ai_draft: true,
    unverified: Boolean(candidate.unverified || generated.unverified === true),
    needs_human_check: Boolean(candidate.needs_human_check || !faithfulness.faithful),
    headline: false,
    review_status: "pending_review",
    detail_analysis: generated.detail_analysis,
  };

  return {
    item: enriched,
    faithfulness,
    promptMeta: {
      promptId: rendered.promptId,
      version: rendered.version,
      outputSpecVersion: rendered.outputSpecVersion,
      retryCount,
      usedFallback,
    },
  };
}
