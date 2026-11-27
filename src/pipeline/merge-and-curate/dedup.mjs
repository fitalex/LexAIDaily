import { normalizeCandidateUrl } from "../../collectors/shared/url-and-domain.mjs";

const STOP_CHAR_RE = /[\s\p{P}\p{S}]+/gu;

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

export function extractEntityTokens(text) {
  const matches = String(text ?? "").match(/[A-Za-z][A-Za-z0-9.-]{1,24}|\d{4}/g) ?? [];
  return new Set(matches.map((m) => m.toLowerCase()));
}

function scorePriority(item) {
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

  if (a.region !== b.region) {
    const entA = extractEntityTokens(`${a.title} ${a.summary ?? ""}`);
    const entB = extractEntityTokens(`${b.title} ${b.summary ?? ""}`);
    if (entA.size >= 2 && entB.size >= 2) {
      let overlap = 0;
      for (const token of entA) {
        if (entB.has(token)) overlap += 1;
      }
      if (overlap >= 2 && overlap / Math.min(entA.size, entB.size) >= 0.6) {
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
      if (exactHit || isFuzzyMatch(cluster.winner, item, fuzzyThreshold)) {
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
