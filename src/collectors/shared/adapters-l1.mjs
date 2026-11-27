import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  decodeResponseBuffer,
  extractArticleFromHtml,
  extractLinksFromListHtml,
  extractPublishedDateFromHtml,
  parseFeedXml,
  stripHtmlToPlainText,
} from "./extractor.mjs";
import { fetchWithRetry } from "./http.mjs";
import { evaluateLegalRelevance } from "./noise-filter.mjs";
import {
  isDiscoveryOnlyUrl,
  isDomainAllowed,
  normalizeCandidateUrl,
} from "./url-and-domain.mjs";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function normalizePublishedAt(rawDate, fallbackIso) {
  if (!rawDate) return { value: fallbackIso, inferred: true };
  const str = String(rawDate).trim();
  if (/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(str) || /^\d{4}-(0[1-9]|1[0-2])$/.test(str)) {
    return { value: str, inferred: false };
  }
  const parsed = new Date(str);
  if (!Number.isNaN(parsed.getTime())) {
    return { value: parsed.toISOString(), inferred: false };
  }
  return { value: fallbackIso, inferred: true };
}

export function loadJsonSafe(filePath, fallback) {
  if (!filePath || !existsSync(filePath)) return fallback;
  try {
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

export function saveJsonSafe(filePath, data) {
  if (!filePath) return;
  const dir = path.dirname(filePath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const tmpPath = `${filePath}.tmp-${process.pid}-${Date.now()}`;
  writeFileSync(tmpPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  renameSync(tmpPath, filePath);
}

export async function fetchRssOrAtomSource(source, ctx) {
  const res = await fetchWithRetry(source.entry_url, {
    fetchImpl: ctx.fetchImpl,
    timeoutMs: ctx.timeoutMs,
    retries: ctx.retries,
    backoffBaseMs: ctx.backoffBaseMs,
    useEnvProxy: ctx.useEnvProxy,
    env: ctx.env,
  });
  if (!res.ok) {
    return {
      items: [],
      status: "error",
      http_status: res.status,
      error_message: `HTTP ${res.status} fetching feed ${source.entry_url}`,
    };
  }
  const finalFeedUrl = normalizeCandidateUrl(res.finalUrl || source.entry_url);
  if (source.expected_domain && !isDomainAllowed(finalFeedUrl, source.expected_domain)) {
    return {
      items: [],
      status: "error",
      http_status: res.status,
      error_message: `Domain mismatch on feed URL: ${finalFeedUrl} vs ${source.expected_domain}`,
    };
  }

  const xml = decodeResponseBuffer(res.buffer, res.contentType);
  const feed = await parseFeedXml(xml, finalFeedUrl);
  const maxItems = ctx.maxItemsPerSource ?? 10;
  const items = [];

  for (const entry of feed.items.slice(0, maxItems)) {
    const normalizedUrl = normalizeCandidateUrl(entry.link, finalFeedUrl);
    if (!normalizedUrl || isDiscoveryOnlyUrl(normalizedUrl)) continue;
    if (source.expected_domain && !isDomainAllowed(normalizedUrl, source.expected_domain)) {
      continue;
    }

    let rawText = stripHtmlToPlainText(entry.content);
    if (ctx.fetchArticleBodyForFeeds !== false && rawText.length < 300) {
      try {
        const artRes = await fetchWithRetry(normalizedUrl, {
          fetchImpl: ctx.fetchImpl,
          timeoutMs: ctx.timeoutMs,
          retries: 1,
          backoffBaseMs: ctx.backoffBaseMs,
          useEnvProxy: ctx.useEnvProxy,
          env: ctx.env,
        });
        if (artRes.ok) {
          const finalUrl = normalizeCandidateUrl(artRes.finalUrl || normalizedUrl) || normalizedUrl;
          if (!source.expected_domain || isDomainAllowed(finalUrl, source.expected_domain)) {
            const html = decodeResponseBuffer(artRes.buffer, artRes.contentType);
            const extracted = extractArticleFromHtml(html, finalUrl);
            if (extracted.textContent.length > rawText.length) {
              rawText = extracted.textContent;
            }
          }
        }
      } catch {
        // Degrade gracefully to plain-text feed body
      }
    }

    const rel = evaluateLegalRelevance({
      sourceId: source.source_id,
      title: entry.title,
      text: rawText,
    });
    if (!rel.kept) continue;

    const pub = normalizePublishedAt(entry.published_at, ctx.nowIso);
    items.push({
      guid: entry.guid || normalizedUrl,
      source_id: source.source_id,
      region: source.region,
      layer: "L1_PUBLIC",
      source_url: normalizedUrl,
      title: entry.title,
      published_at: pub.value,
      published_date_inferred: pub.inferred,
      raw_text: rawText || entry.title,
    });
  }

  return { items, status: "ok", http_status: res.status };
}

export async function fetchStaticHtmlSource(source, ctx) {
  const listRes = await fetchWithRetry(source.entry_url, {
    fetchImpl: ctx.fetchImpl,
    timeoutMs: ctx.timeoutMs,
    retries: ctx.retries,
    backoffBaseMs: ctx.backoffBaseMs,
    useEnvProxy: ctx.useEnvProxy,
    env: ctx.env,
  });
  if (!listRes.ok) {
    return {
      items: [],
      status: "error",
      http_status: listRes.status,
      error_message: `HTTP ${listRes.status} fetching list ${source.entry_url}`,
    };
  }
  const finalListUrl = normalizeCandidateUrl(listRes.finalUrl || source.entry_url);
  if (source.expected_domain && !isDomainAllowed(finalListUrl, source.expected_domain)) {
    return {
      items: [],
      status: "error",
      http_status: listRes.status,
      error_message: `Domain mismatch on list page: ${finalListUrl} vs ${source.expected_domain}`,
    };
  }

  const listHtml = decodeResponseBuffer(listRes.buffer, listRes.contentType);
  const maxItems = ctx.maxItemsPerSource ?? 6;
  const links = extractLinksFromListHtml(listHtml, finalListUrl, source.expected_domain, maxItems);
  const items = [];
  const rateLimitMs = ctx.perSourceDelayMs ?? 0;

  for (const link of links) {
    if (rateLimitMs > 0) await sleep(rateLimitMs);
    try {
      const artRes = await fetchWithRetry(link.url, {
        fetchImpl: ctx.fetchImpl,
        timeoutMs: ctx.timeoutMs,
        retries: 1,
        backoffBaseMs: ctx.backoffBaseMs,
        useEnvProxy: ctx.useEnvProxy,
        env: ctx.env,
      });
      if (!artRes.ok) continue;
      const finalArtUrl = normalizeCandidateUrl(artRes.finalUrl || link.url);
      if (!finalArtUrl || isDiscoveryOnlyUrl(finalArtUrl)) continue;
      if (source.expected_domain && !isDomainAllowed(finalArtUrl, source.expected_domain)) {
        continue;
      }
      const artHtml = decodeResponseBuffer(artRes.buffer, artRes.contentType);
      const extracted = extractArticleFromHtml(artHtml, finalArtUrl);
      const parsedDate = extractPublishedDateFromHtml(artHtml);
      const pub = normalizePublishedAt(parsedDate, ctx.nowIso);
      const title = extracted.title && extracted.title !== "Untitled" ? extracted.title : link.title;
      const rawText = extracted.textContent || title;

      const rel = evaluateLegalRelevance({
        sourceId: source.source_id,
        title,
        text: rawText,
      });
      if (!rel.kept) continue;

      items.push({
        guid: finalArtUrl,
        source_id: source.source_id,
        region: source.region,
        layer: "L1_PUBLIC",
        source_url: finalArtUrl,
        title,
        published_at: pub.value,
        published_date_inferred: pub.inferred,
        raw_text: rawText,
      });
    } catch {
      // Single article failure does not abort source
    }
  }

  return { items, status: "ok", http_status: listRes.status };
}

function extractAihotHeatScore(row) {
  if (typeof row?.score === "number" && Number.isFinite(row.score)) return row.score;
  if (typeof row?.heat === "number" && Number.isFinite(row.heat)) return row.heat;
  if (typeof row?.heat_score === "number" && Number.isFinite(row.heat_score)) return row.heat_score;
  if (typeof row?.signalCount === "number" && Number.isFinite(row.signalCount)) {
    return Math.min(100, row.signalCount * 10);
  }
  return null;
}

export async function fetchAihotDiscoverySource(source, ctx) {
  const etagFile = ctx.cacheDir ? path.join(ctx.cacheDir, ".aihot-etags.json") : null;
  const etagState = loadJsonSafe(etagFile, {});
  const endpoints = [source.entry_url];
  if (source.entry_url.endsWith("/items")) {
    endpoints.push(source.entry_url.replace(/\/items$/, "/hot-topics"));
  }

  const candidateOrigins = [];
  let lastStatus = 200;

  for (const endpoint of endpoints) {
    const cachedEntry = etagState[endpoint] ?? {};
    const prevEtag = typeof cachedEntry === "string" ? cachedEntry : cachedEntry.etag;
    const res = await fetchWithRetry(endpoint, {
      fetchImpl: ctx.fetchImpl,
      timeoutMs: ctx.timeoutMs,
      retries: ctx.retries,
      backoffBaseMs: ctx.backoffBaseMs,
      etag: prevEtag,
      useEnvProxy: ctx.useEnvProxy,
      env: ctx.env,
    });
    lastStatus = res.status;

    let payload = null;
    if (res.notModified) {
      payload = cachedEntry.payload ?? null;
    } else if (res.ok) {
      const text = decodeResponseBuffer(res.buffer, res.contentType);
      try {
        payload = JSON.parse(text);
      } catch {
        payload = null;
      }
      if (payload !== null) {
        etagState[endpoint] = {
          etag: res.etag || prevEtag || null,
          cached_at: ctx.nowIso,
          payload,
        };
      }
    }

    if (!payload) continue;
    const list = Array.isArray(payload)
      ? payload
      : Array.isArray(payload.items)
        ? payload.items
        : Array.isArray(payload.data)
          ? payload.data
          : [];

    for (const row of list) {
      const origRaw = row?.links?.original;
      const origUrl = normalizeCandidateUrl(origRaw);
      if (!origUrl || isDiscoveryOnlyUrl(origUrl)) continue;
      candidateOrigins.push({
        original_url: origUrl,
        published_at: row?.published_at || row?.publishedAt || row?.latestAt || null,
        heat_score: extractAihotHeatScore(row),
        origin_source_name:
          typeof row?.source?.name === "string" && row.source.name.trim()
            ? row.source.name.trim()
            : null,
      });
    }
  }
  saveJsonSafe(etagFile, etagState);

  const maxTrace = ctx.maxAihotTrace ?? 6;
  const seen = new Set();
  const items = [];

  for (const cand of candidateOrigins) {
    if (seen.has(cand.original_url)) continue;
    seen.add(cand.original_url);
    if (items.length >= maxTrace) break;

    try {
      const originRes = await fetchWithRetry(cand.original_url, {
        fetchImpl: ctx.fetchImpl,
        timeoutMs: ctx.timeoutMs,
        retries: 1,
        backoffBaseMs: ctx.backoffBaseMs,
        useEnvProxy: ctx.useEnvProxy,
        env: ctx.env,
      });
      if (!originRes.ok) continue;
      const finalUrl = normalizeCandidateUrl(originRes.finalUrl || cand.original_url);
      if (!finalUrl || isDiscoveryOnlyUrl(finalUrl)) continue;

      const html = decodeResponseBuffer(originRes.buffer, originRes.contentType);
      const extracted = extractArticleFromHtml(html, finalUrl);
      if (!extracted.title || extracted.textContent.length < 30) continue;

      const rel = evaluateLegalRelevance({
        sourceId: "aihot-news-discovery",
        title: extracted.title,
        text: extracted.textContent,
      });
      if (!rel.kept) continue;

      const htmlDate = extractPublishedDateFromHtml(html);
      const pub = normalizePublishedAt(htmlDate || cand.published_at, ctx.nowIso);

      items.push({
        guid: finalUrl,
        source_id: source.source_id,
        discovered_via: source.source_id,
        origin_source_name: cand.origin_source_name,
        region: source.region,
        layer: "L1_PUBLIC",
        source_url: finalUrl,
        title: extracted.title,
        published_at: pub.value,
        published_date_inferred: pub.inferred,
        heat_score: cand.heat_score,
        raw_text: extracted.textContent,
      });
    } catch {
      // Origin fetch failure skipped gracefully
    }
  }

  return { items, status: "ok", http_status: lastStatus };
}
