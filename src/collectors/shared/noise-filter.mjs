export const NOISY_GENERAL_SOURCE_IDS = Object.freeze([
  "openai-news-rss",
  "cn-sspai-home",
  "cn-ruanyifeng-blog",
  "aihot-news-discovery",
]);

const LEGAL_AND_WORKFLOW_KEYWORDS = Object.freeze([
  "法律",
  "律师",
  "法务",
  "合规",
  "司法",
  "法院",
  "裁判",
  "判例",
  "合同",
  "监管",
  "立法",
  "法案",
  "条例",
  "隐私",
  "数据安全",
  "知识产权",
  "版权",
  "著作权",
  "取证",
  "证据",
  "审查",
  "尽调",
  "文书",
  "工作流",
  "效率",
  "ocr",
  "pdf",
  "长文档",
  "知识库",
  "mcp",
  "agent",
  "rag",
  "legal",
  "lawyer",
  "law firm",
  "attorney",
  "counsel",
  "compliance",
  "regulation",
  "regulatory",
  "court",
  "litigation",
  "contract",
  "statute",
  "legislation",
  "ai act",
  "copyright",
  "privacy",
  "governance",
  "enterprise",
  "workflow",
  "document",
  "reasoning",
  "deep research",
  "policy",
]);

export function shouldFilterGeneralSource(sourceId, extraSources = []) {
  return (
    NOISY_GENERAL_SOURCE_IDS.includes(sourceId) ||
    extraSources.includes(sourceId)
  );
}

export function evaluateLegalRelevance({ sourceId, title = "", text = "" }) {
  if (!shouldFilterGeneralSource(sourceId)) {
    return { kept: true, matchedKeywords: [] };
  }
  const haystack = `${title}\n${text.slice(0, 2000)}`.toLowerCase();
  const matched = [];
  for (const kw of LEGAL_AND_WORKFLOW_KEYWORDS) {
    if (haystack.includes(kw)) {
      matched.push(kw);
    }
  }
  return {
    kept: matched.length > 0,
    matchedKeywords: matched,
  };
}
