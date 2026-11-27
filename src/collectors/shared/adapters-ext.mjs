import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { load as loadYaml } from "js-yaml";
import {
  loadJsonSafe,
  normalizePublishedAt,
  saveJsonSafe,
} from "./adapters-l1.mjs";
import {
  decodeResponseBuffer,
  extractArticleFromHtml,
  extractPublishedDateFromHtml,
  parseFeedXml,
  stripHtmlToPlainText,
} from "./extractor.mjs";
import { fetchWithRetry } from "./http.mjs";
import {
  isDiscoveryOnlyUrl,
  isDomainAllowed,
  normalizeCandidateUrl,
} from "./url-and-domain.mjs";

const SOURCE_ID_PATTERN = /^[a-z0-9][a-z0-9-]{1,63}$/;
const DEFAULT_L2_EXPECTED_DOMAIN = "mp.weixin.qq.com";

export function getLocalDateString(nowIso = new Date().toISOString(), timeZone = process.env.TZ || "Asia/Shanghai") {
  const dt = new Date(nowIso);
  const safeDate = Number.isNaN(dt.getTime()) ? new Date() : dt;
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(safeDate);
  } catch {
    return safeDate.toISOString().slice(0, 10);
  }
}

/**
 * ST03: Fail-closed integer cap parser. Non-numeric or negative values fail closed to 0.
 */
export function parseStrictDailyCap(rawValue, defaultCap = 5) {
  if (rawValue === undefined || rawValue === null || String(rawValue).trim() === "") {
    return defaultCap;
  }
  const num = Number(rawValue);
  if (!Number.isFinite(num) || !Number.isInteger(num) || num < 0) {
    return 0; // Fail closed on malformed cap
  }
  return num;
}

export function sanitizeSourceId(rawId, fallback = "l2-we-mp-rss") {
  const str = String(rawId ?? "").trim();
  if (SOURCE_ID_PATTERN.test(str)) return str;
  const cleaned = str
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  return SOURCE_ID_PATTERN.test(cleaned) ? cleaned : fallback;
}

export async function fetchWeMpRssBridge(ctx) {
  const rawEnv = ctx.env?.WE_MP_RSS_FEEDS_JSON ?? process.env.WE_MP_RSS_FEEDS_JSON;
  if (!rawEnv) {
    return { items: [], sourceResults: [] };
  }
  let feeds = [];
  try {
    feeds = JSON.parse(rawEnv);
  } catch {
    return {
      items: [],
      sourceResults: [
        {
          source_id: "l2-we-mp-rss",
          status: "degraded",
          items_count: 0,
          error_message: "Invalid WE_MP_RSS_FEEDS_JSON format",
        },
      ],
    };
  }

  const allItems = [];
  const sourceResults = [];

  for (const feedCfg of Array.isArray(feeds) ? feeds : []) {
    const rawId = feedCfg.source_id || "l2-we-mp-rss";
    if (!SOURCE_ID_PATTERN.test(String(rawId))) {
      sourceResults.push({
        source_id: sanitizeSourceId(rawId, "l2-we-mp-rss"),
        status: "degraded",
        items_count: 0,
        error_message: `Invalid Layer 2 source_id "${rawId}" skipped`,
      });
      continue;
    }
    const sourceId = rawId;
    const feedUrl = feedCfg.url;
    if (!feedUrl) continue;
    // R2-SP05: Enforce Layer 2 item domain allowlist (defaults to mp.weixin.qq.com)
    const expectedItemDomain = feedCfg.expected_domain || DEFAULT_L2_EXPECTED_DOMAIN;
    try {
      const res = await fetchWithRetry(feedUrl, {
        fetchImpl: ctx.fetchImpl,
        timeoutMs: ctx.timeoutMs,
        retries: 1,
        backoffBaseMs: ctx.backoffBaseMs,
      });
      if (res.status === 401 || res.status === 403 || !res.ok) {
        sourceResults.push({
          source_id: sourceId,
          status: "degraded",
          items_count: 0,
          http_status: res.status,
          error_message: `we-mp-rss bridge degraded (HTTP ${res.status})`,
        });
        continue;
      }
      const xml = decodeResponseBuffer(res.buffer, res.contentType);
      const parsed = await parseFeedXml(xml, feedUrl);
      const collected = [];
      let domainRejected = 0;
      for (const entry of parsed.items.slice(0, ctx.maxItemsPerSource ?? 8)) {
        const normalizedUrl = normalizeCandidateUrl(entry.link, feedUrl);
        if (!normalizedUrl || isDiscoveryOnlyUrl(normalizedUrl)) continue;
        if (!isDomainAllowed(normalizedUrl, expectedItemDomain)) {
          domainRejected += 1;
          continue;
        }
        const pub = normalizePublishedAt(entry.published_at, ctx.nowIso);
        collected.push({
          guid: entry.guid || normalizedUrl,
          source_id: sourceId,
          region: "cn",
          layer: "L2_WECHAT_BRIDGE",
          source_url: normalizedUrl,
          title: entry.title,
          published_at: pub.value,
          published_date_inferred: pub.inferred,
          raw_text: stripHtmlToPlainText(entry.content) || entry.title,
        });
      }
      allItems.push(...collected);
      sourceResults.push({
        source_id: sourceId,
        status: domainRejected > 0 && collected.length === 0 ? "degraded" : "ok",
        items_count: collected.length,
        http_status: res.status,
        ...(domainRejected > 0
          ? {
              error_message: `${domainRejected} Layer 2 item(s) rejected outside expected_domain (${expectedItemDomain})`,
            }
          : {}),
      });
    } catch (err) {
      sourceResults.push({
        source_id: sourceId,
        status: "degraded",
        items_count: 0,
        error_message: `we-mp-rss unreachable: ${String(err?.message ?? err).slice(0, 200)}`,
      });
    }
  }

  return { items: allItems, sourceResults };
}

export async function fetchLayer3ManualAndMonid(ctx) {
  const inboxPath =
    ctx.manualInboxPath ?? path.join(ctx.repoRoot ?? process.cwd(), ".local", "manual-inbox.yaml");
  if (!existsSync(inboxPath)) {
    return { items: [], sourceResults: [] };
  }

  let inbox;
  try {
    inbox = loadYaml(readFileSync(inboxPath, "utf8"));
  } catch (err) {
    return {
      items: [],
      sourceResults: [
        {
          source_id: "l3-manual-inbox",
          status: "degraded",
          items_count: 0,
          error_message: `Failed to parse manual-inbox.yaml: ${String(err?.message ?? err).slice(0, 180)}`,
        },
      ],
    };
  }

  const entries = Array.isArray(inbox?.items) ? inbox.items : [];
  const targetRegion = ctx.region;
  const envBag = ctx.env ?? process.env;
  const monidToken = envBag.MONID_API_KEY ?? "";
  const monidEndpoint = envBag.MONID_API_ENDPOINT ?? "";
  // ST03: Strict finite non-negative integer cap (invalid value fails closed to 0)
  const dailyCap = parseStrictDailyCap(envBag.MONID_DAILY_MAX_CALLS, 5);
  // ST05: Local timezone date key
  const dateKey = getLocalDateString(ctx.nowIso, envBag.TZ || "Asia/Shanghai");
  const budgetFile = ctx.cacheDir
    ? path.join(ctx.cacheDir, `.monid-budget-${dateKey}.json`)
    : null;
  const budgetObj = loadJsonSafe(budgetFile, { calls: 0 });
  const rawCalls = Number(budgetObj?.calls);
  let monidCallsToday =
    Number.isFinite(rawCalls) && Number.isInteger(rawCalls) && rawCalls >= 0
      ? rawCalls
      : dailyCap; // Fail closed if budget file is corrupted

  const items = [];
  let degradedCount = 0;

  for (const row of entries) {
    if (targetRegion && row.region && row.region !== targetRegion) continue;
    const fetchUrl = normalizeCandidateUrl(row.url, undefined, { preserveHttp: true });
    const canonicalUrl = normalizeCandidateUrl(row.url);
    if (!fetchUrl || !canonicalUrl || isDiscoveryOnlyUrl(fetchUrl)) continue;

    let extractedTitle = stripHtmlToPlainText(row.title || "");
    let rawText = "";
    let htmlDate = null;
    let layer = "L3_MANUAL_INBOX";

    if (row.fallback !== "monid") {
      try {
        const res = await fetchWithRetry(fetchUrl, {
          fetchImpl: ctx.fetchImpl,
          timeoutMs: ctx.timeoutMs,
          retries: 1,
          backoffBaseMs: ctx.backoffBaseMs,
        });
        if (res.ok) {
          const html = decodeResponseBuffer(res.buffer, res.contentType);
          const extracted = extractArticleFromHtml(html, canonicalUrl);
          htmlDate = extractPublishedDateFromHtml(html);
          extractedTitle = extractedTitle || extracted.title;
          rawText = extracted.textContent;
        }
      } catch {
        // Degrade to on-demand fallback if configured
      }
    }

    if (!rawText && (row.fallback === "monid" || row.allow_monid_fallback)) {
      if (!monidToken || !monidEndpoint || dailyCap <= 0 || monidCallsToday >= dailyCap) {
        degradedCount += 1;
        continue;
      }
      monidCallsToday += 1;
      saveJsonSafe(budgetFile, { date: dateKey, calls: monidCallsToday, cap: dailyCap });
      try {
        const reqHeaders = { "Content-Type": "application/json" };
        reqHeaders.Authorization = ["Bearer", monidToken].join(" ");
        const monidRes = await fetchWithRetry(monidEndpoint, {
          fetchImpl: ctx.fetchImpl,
          method: "POST",
          timeoutMs: ctx.timeoutMs,
          retries: 0,
          headers: reqHeaders,
          body: JSON.stringify({ url: fetchUrl }),
        });
        if (monidRes.ok) {
          const parsed = JSON.parse(decodeResponseBuffer(monidRes.buffer, monidRes.contentType));
          extractedTitle = extractedTitle || stripHtmlToPlainText(parsed.title || "");
          rawText = stripHtmlToPlainText(parsed.text || parsed.markdown || "");
          layer = "L3_ON_DEMAND";
        } else {
          degradedCount += 1;
          continue;
        }
      } catch {
        degradedCount += 1;
        continue;
      }
    }

    if (!rawText) {
      degradedCount += 1;
      continue;
    }

    const pub = normalizePublishedAt(row.published_at || htmlDate, ctx.nowIso);
    items.push({
      guid: canonicalUrl,
      source_id: layer === "L3_ON_DEMAND" ? "l3-monid-fallback" : "l3-manual-inbox",
      region: row.region || targetRegion || "cn",
      layer,
      source_url: canonicalUrl,
      title: extractedTitle || "人工投喂线索",
      published_at: pub.value,
      published_date_inferred: pub.inferred,
      raw_text: rawText,
    });
  }

  return {
    items,
    sourceResults: [
      {
        source_id: "l3-manual-inbox",
        status: degradedCount > 0 && items.length === 0 ? "degraded" : "ok",
        items_count: items.length,
        ...(degradedCount > 0
          ? { error_message: `${degradedCount} inbox item(s) degraded or capped` }
          : {}),
      },
    ],
  };
}
