import { normalizeCandidateUrl } from "../../collectors/shared/url-and-domain.mjs";

const STOP_CHAR_RE = /[\s\p{P}\p{S}]+/gu;

/**
 * SP06: Generic stopwords & bare years excluded from cross-lingual entity fingerprinting
 * so unrelated events sharing only generic terms (e.g. "ai" + "2026") are never wrongly merged.
 */
const GENERIC_ENTITY_STOPWORDS = new Set([
  "ai",
  "llm",
  "llms",
  "new",
  "law",
  "legal",
  "tech",
  "data",
  "news",
  "blog",
  "guide",
  "policy",
  "report",
  "update",
  "updates",
  "china",
  "global",
  "model",
  "models",
  "tool",
  "tools",
  "regulation",
  "regulatory",
  "compliance",
  "roundup",
  "weekly",
  "daily",
  "review",
  "final",
  "draft",
  "guidance",
  "official",
  "code",
  "practice",
  "the",
  "for",
  "and",
  "with",
  "from",
]);

/**
 * R2-SP02: Curated bilingual CN<->EN legal-AI entity canonicalization table so pure Chinese
 * and pure English headlines about the same statute, regulator, or framework share specific
 * canonical entity tokens and merge with global primary source priority.
 */
const BILINGUAL_ENTITY_ALIASES = [
  { canonical: "ent_eu", patterns: [/欧盟/g, /\beu\b/gi, /\beuropean\s+union\b/gi] },
  { canonical: "ent_ai_act", patterns: [/人工智能法案/g, /\bai\s+act\b/gi] },
  { canonical: "ent_gpai", patterns: [/通用人工智能/g, /\bgpai\b/gi, /\bgeneral[- ]purpose\s+ai\b/gi] },
  { canonical: "ent_code_of_practice", patterns: [/行为准则/g, /\bcode\s+of\s+practice\b/gi] },
  { canonical: "ent_cac", patterns: [/网信办|国家互联网信息办公室/g, /\bcac\b/gi] },
  { canonical: "ent_spc", patterns: [/最高法|最高人民法院/g, /\bsupreme\s+people'?s\s+court\b/gi, /\bspc\b/gi] },
  { canonical: "ent_spp", patterns: [/最高检|最高人民检察院/g, /\bsupreme\s+people'?s\s+procuratorate\b/gi] },
  { canonical: "ent_usco", patterns: [/美国版权局/g, /\bu\.?s\.?\s+copyright\s+office\b/gi, /\busco\b/gi] },
  { canonical: "ent_ftc", patterns: [/联邦贸易委员会/g, /\bftc\b/gi, /\bfederal\s+trade\s+commission\b/gi] },
  { canonical: "ent_edpb", patterns: [/欧洲数据保护委员会/g, /\bedpb\b/gi] },
  { canonical: "ent_ico", patterns: [/英国信息专员办公室/g, /\bico\b/gi] },
  { canonical: "ent_gdpr", patterns: [/通用数据保护条例/g, /\bgdpr\b/gi] },
  { canonical: "ent_nist_rmf", patterns: [/风险管理框架/g, /\bnist\s+ai\s+rmf\b/gi] },
  { canonical: "ent_harvey", patterns: [/harvey/gi] },
  { canonical: "ent_co_counsel", patterns: [/cocounsel/gi] },
  { canonical: "ent_lexis", patterns: [/lexisnexis|lexis\+?\s*ai/gi] },
  { canonical: "ent_westlaw", patterns: [/westlaw/gi] },
  { canonical: "ent_openai", patterns: [/openai/gi] },
  { canonical: "ent_anthropic", patterns: [/anthropic|claude/gi] },
  { canonical: "ent_deepseek", patterns: [/deepseek|深度求索/gi] },
];

export function buildBigrams(text) {
  const clean = String(text ?? "")
    .toLowerCase()
    .replace(STOP_CHAR_RE, "");
  const grams = new Set();
  if (clean.length < 2) {
    if (clean.length === 1) grams.add(clean);
    return grams;
  }
  for (let i = 0; i < clean.length - 1; i += 1) {
    grams.add(clean.slice(i, i + 2));
  }
  return grams;
}

export function jaccardSimilarity(setA, setB) {
  if (setA.size === 0 && setB.size === 0) return 0;
  let intersection = 0;
  for (const gram of setA) {
    if (setB.has(gram)) intersection += 1;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Extracts specific named entity tokens (bilingual canonical legal-AI entities + Latin acronyms/orgs),
 * strictly excluding bare 4-digit years and generic stopwords.
 */
export function extractEntityTokens(text) {
  const src = String(text ?? "");
  const out = new Set();

  for (const { canonical, patterns } of BILINGUAL_ENTITY_ALIASES) {
    if (patterns.some((re) => re.test(src))) {
      out.add(canonical);
    }
  }

  const matches = src.match(/[A-Za-z][A-Za-z0-9.-]{1,24}/g) ?? [];
  for (const raw of matches) {
    const token = raw.toLowerCase().replace(/^[.-]+|[.-]+$/g, "");
    if (token.length < 2 || GENERIC_ENTITY_STOPWORDS.has(token)) {
      continue;
    }
    out.add(token);
  }
  return out;
}

function scorePriority(item) {
  // ADR-0003: Prefer `global` primary source URL on cross-track collision
  let score = item.region === "global" ? 100 : 0;
  if (item.fact_tier === "confirmed_fact") score += 30;
  else if (item.fact_tier === "official_data") score += 20;
  else score += 10;
  if (!item.discovered_via) score += 5;
  return score;
}

function isFuzzyMatch(a, b, threshold) {
  const sim = jaccardSimilarity(buildBigrams(a.title), buildBigrams(b.title));
  if (sim >= threshold) return true;

  // SP06 + R2-SP02: Cross-lingual entity fallback requires >= 3 specific non-generic entity tokens & >= 60% overlap
  if (a.region !== b.region) {
    const entA = extractEntityTokens(`${a.title} ${a.summary ?? ""}`);
    const entB = extractEntityTokens(`${b.title} ${b.summary ?? ""}`);
    if (entA.size >= 3 && entB.size >= 3) {
      let overlap = 0;
      for (const token of entA) {
        if (entB.has(token)) overlap += 1;
      }
      if (overlap >= 3 && overlap / Math.min(entA.size, entB.size) >= 0.6) {
        return true;
      }
    }
  }
  return false;
}

export function deduplicateCrossTrack(items, { fuzzyThreshold = 0.72 } = {}) {
  const clusters = [];

  for (const item of items) {
    const normUrl = normalizeCandidateUrl(item.source_url) || item.source_url;
    const guid = item.guid || normUrl;

    let matchedCluster = null;
    for (const cluster of clusters) {
      const exactHit = cluster.guids.has(guid) || cluster.urls.has(normUrl);
      const fuzzyHit =
        !exactHit &&
        cluster.members.some((member) => isFuzzyMatch(member, item, fuzzyThreshold));
      if (exactHit || fuzzyHit) {
        matchedCluster = cluster;
        break;
      }
    }

    if (!matchedCluster) {
      clusters.push({
        winner: item,
        members: [item],
        guids: new Set([guid]),
        urls: new Set([normUrl]),
      });
    } else {
      matchedCluster.members.push(item);
      matchedCluster.guids.add(guid);
      matchedCluster.urls.add(normUrl);
      if (scorePriority(item) > scorePriority(matchedCluster.winner)) {
        matchedCluster.winner = item;
      }
    }
  }

  return clusters.map((c) => ({
    item: c.winner,
    cross_source_count: new Set(c.members.map((m) => m.source_id)).size,
    merged_candidate_ids: c.members.map((m) => m.id),
    primary_source_urls: Array.from(c.urls),
  }));
}
