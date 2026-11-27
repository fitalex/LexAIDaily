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
  parseFeedXml,
} from "./extractor.mjs";
import { fetchWithRetry } from "./http.mjs";
import {
  isDiscoveryOnlyUrl,
  normalizeCandidateUrl,
} from "./url-and-domain.mjs";

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
    const sourceId = feedCfg.source_id || "l2-we-mp-rss";
    const feedUrl = feedCfg.url;
    if (!feedUrl) continue;
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
      for (const entry of parsed.items.slice(0, ctx.maxItemsPerSource ?? 8)) {
        const normalizedUrl = normalizeCandidateUrl(entry.link, feedUrl);
        if (!normalizedUrl || isDiscoveryOnlyUrl(normalizedUrl)) continue;
        collected.push({
          guid: entry.guid || normalizedUrl,
          source_id: sourceId,
          region: "cn",
          layer: "L2_WECHAT_BRIDGE",
          source_url: normalizedUrl,
          title: entry.title,
          published_at: normalizePublishedAt(entry.published_at, ctx.nowIso),
          raw_text: entry.content || entry.title,
        });
      }
      allItems.push(...collected);
      sourceResults.push({
        source_id: sourceId,
        status: "ok",
        items_count: collected.length,
        http_status: res.status,
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
  const dailyCap = Number(envBag.MONID_DAILY_MAX_CALLS ?? 5);
  const dateKey = (ctx.nowIso || new Date().toISOString()).slice(0, 10);
  const budgetFile = ctx.cacheDir
    ? path.join(ctx.cacheDir, `.monid-budget-${dateKey}.json`)
    : null;
  let monidCallsToday = Number(loadJsonSafe(budgetFile, { calls: 0 }).calls ?? 0);

  const items = [];
  let degradedCount = 0;

  for (const row of entries) {
    if (targetRegion && row.region && row.region !== targetRegion) continue;
    const normalizedUrl = normalizeCandidateUrl(row.url);
    if (!normalizedUrl || isDiscoveryOnlyUrl(normalizedUrl)) continue;

    let extractedTitle = row.title || "";
    let rawText = "";
    let layer = "L3_MANUAL_INBOX";

    if (row.fallback !== "monid") {
      try {
        const res = await fetchWithRetry(normalizedUrl, {
          fetchImpl: ctx.fetchImpl,
          timeoutMs: ctx.timeoutMs,
          retries: 1,
          backoffBaseMs: ctx.backoffBaseMs,
        });
        if (res.ok) {
          const html = decodeResponseBuffer(res.buffer, res.contentType);
          const extracted = extractArticleFromHtml(html, normalizedUrl);
          extractedTitle = extractedTitle || extracted.title;
          rawText = extracted.textContent;
        }
      } catch {
        // Degrade to on-demand fallback if configured
      }
    }

    if (!rawText && (row.fallback === "monid" || row.allow_monid_fallback)) {
      if (!monidToken || !monidEndpoint || monidCallsToday >= dailyCap) {
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
          body: JSON.stringify({ url: normalizedUrl }),
        });
        if (monidRes.ok) {
          const parsed = JSON.parse(decodeResponseBuffer(monidRes.buffer, monidRes.contentType));
          extractedTitle = extractedTitle || parsed.title || "";
          rawText = String(parsed.text || parsed.markdown || "").trim();
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

    items.push({
      guid: normalizedUrl,
      source_id: layer === "L3_ON_DEMAND" ? "l3-monid-fallback" : "l3-manual-inbox",
      region: row.region || targetRegion || "cn",
      layer,
      source_url: normalizedUrl,
      title: extractedTitle || "人工投喂线索",
      published_at: normalizePublishedAt(row.published_at, ctx.nowIso),
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
