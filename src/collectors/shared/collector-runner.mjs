import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { validateBySchemaName } from "../../contracts/validate.mjs";
import { loadAndValidateWhitelist } from "../../sources/validate-whitelist.mjs";
import {
  fetchAihotDiscoverySource,
  fetchLayer3ManualAndMonid,
  fetchRssOrAtomSource,
  fetchStaticHtmlSource,
  fetchWeMpRssBridge,
} from "./adapters.mjs";
import {
  CACHE_TTL_DAYS,
  getDefaultCacheDir,
  pruneExpiredCache,
  sha256Text,
  writeRawCache,
} from "./cache.mjs";
import { extractDomain } from "./url-and-domain.mjs";

function clampString(str, minLen, maxLen, padSuffix = "。") {
  let out = String(str ?? "").replace(/\s+/g, " ").trim();
  if (out.length > maxLen) {
    out = out.slice(0, maxLen).trim();
  }
  while (out.length < minLen) {
    out = `${out}${padSuffix}`;
  }
  return out;
}

function buildInitialSummary(title, rawText) {
  const cleanText = String(rawText ?? "").replace(/\s+/g, " ").trim();
  const candidate = cleanText.length >= 24 ? cleanText.slice(0, 156) : `${title}：${cleanText}`;
  return clampString(candidate, 20, 160, "，详见一手原始信源。");
}

function buildInitialPracticeImpact(category) {
  const map = {
    "监管与合规": "法律团队需核对新规适用范围与生效节点，更新内部 AI 合规清单。",
    "模型与技术": "法务与律所可评估该底座在长文档审阅与检索中的实务提效价值。",
    "实务与工具": "可参考该工具工作流优化合同审查、法律研究或知识库搭建流程。",
    "判例与学术": "诉讼与合规律师应关注裁判尺度及实证结论对办案策略的提示。",
    "行业与资本": "关注头部法律科技产品演进与律所采购趋势，辅助工具选型决策。",
  };
  return clampString(map[category] || map["实务与工具"], 10, 60);
}

function mapAuthorityToFactTier(source) {
  if (!source) return "market_opinion";
  if (source.authority_tier === "T1") return "confirmed_fact";
  if (source.authority_tier === "T2") return "official_data";
  return "market_opinion";
}

function makeCandidateId(region, sourceId, url) {
  const hash = sha256Text(url).slice(0, 10);
  const safeSource = String(sourceId ?? "src")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .slice(0, 32);
  return `${region}-${safeSource}-${hash}`;
}

export async function runRegionalCollector({
  region,
  repoRoot = process.cwd(),
  date = new Date().toISOString().slice(0, 10),
  nowIso = new Date().toISOString(),
  cacheDir = getDefaultCacheDir(repoRoot),
  outputDir = path.join(repoRoot, "data", "candidates", date),
  whitelistPath = path.join(repoRoot, "data", "sources", `whitelist-${region}.yaml`),
  manualInboxPath = path.join(repoRoot, ".local", "manual-inbox.yaml"),
  fetchImpl = globalThis.fetch,
  env = process.env,
  timeoutMs = 15000,
  retries = 2,
  backoffBaseMs = 300,
  perSourceDelayMs = 0,
  maxItemsPerSource = 8,
  maxAihotTrace = 6,
  fetchArticleBodyForFeeds = true,
  writeOutput = true,
} = {}) {
  if (region !== "cn" && region !== "global") {
    throw new Error(`Invalid region: ${region}`);
  }

  const startedAt = nowIso;
  const prunedCount = pruneExpiredCache({
    cacheDir,
    nowMs: Date.parse(nowIso) || Date.now(),
    ttlDays: CACHE_TTL_DAYS,
  });

  const { config, valid, errors } = loadAndValidateWhitelist(whitelistPath, region);
  if (!valid) {
    throw new Error(`Invalid whitelist (${whitelistPath}): ${errors.join("; ")}`);
  }

  const ctx = {
    region,
    repoRoot,
    cacheDir,
    manualInboxPath,
    fetchImpl,
    env,
    nowIso,
    timeoutMs,
    retries,
    backoffBaseMs,
    perSourceDelayMs,
    maxItemsPerSource,
    maxAihotTrace,
    fetchArticleBodyForFeeds,
  };

  const sourceResults = [];
  const rawCollected = [];
  const sourceById = new Map(config.sources.map((s) => [s.source_id, s]));

  for (const source of config.sources) {
    if (source.status !== "active") {
      sourceResults.push({
        source_id: source.source_id,
        status: "skipped",
        items_count: 0,
      });
      continue;
    }

    try {
      let res;
      if (source.fetch_mode === "rss" || source.fetch_mode === "atom") {
        res = await fetchRssOrAtomSource(source, ctx);
      } else if (source.fetch_mode === "discovery_api") {
        res = await fetchAihotDiscoverySource(source, ctx);
      } else {
        res = await fetchStaticHtmlSource(source, ctx);
      }
      rawCollected.push(...res.items);
      sourceResults.push({
        source_id: source.source_id,
        status: res.status,
        items_count: res.items.length,
        ...(typeof res.http_status === "number" ? { http_status: res.http_status } : {}),
        ...(res.error_message ? { error_message: res.error_message.slice(0, 300) } : {}),
      });
    } catch (err) {
      sourceResults.push({
        source_id: source.source_id,
        status: "error",
        items_count: 0,
        error_message: String(err?.message ?? err).slice(0, 300),
      });
    }
  }

  if (region === "cn") {
    const l2 = await fetchWeMpRssBridge(ctx);
    rawCollected.push(...l2.items);
    sourceResults.push(...l2.sourceResults);
  }

  const l3 = await fetchLayer3ManualAndMonid(ctx);
  rawCollected.push(...l3.items);
  sourceResults.push(...l3.sourceResults);

  const seenUrls = new Set();
  const candidates = [];
  let dedupedCount = 0;

  for (const raw of rawCollected) {
    if (seenUrls.has(raw.source_url)) {
      dedupedCount += 1;
      continue;
    }
    seenUrls.add(raw.source_url);

    writeRawCache({ cacheDir, item: raw, nowIso });

    const srcMeta = sourceById.get(raw.source_id);
    const category = srcMeta?.default_categories?.[0] || "实务与工具";
    const highRisk = Boolean(srcMeta?.high_risk_default);

    const candidate = {
      id: makeCandidateId(region, raw.source_id, raw.source_url),
      region,
      source_id: raw.source_id,
      ...(raw.discovered_via ? { discovered_via: raw.discovered_via } : {}),
      source_name: clampString(srcMeta?.name || raw.source_id, 2, 120, ""),
      source_domain: extractDomain(raw.source_url),
      source_url: raw.source_url,
      published_at: raw.published_at,
      collected_at: nowIso,
      category,
      title: clampString(raw.title, 6, 120, "（待核）"),
      summary: buildInitialSummary(raw.title, raw.raw_text),
      practice_impact_brief: buildInitialPracticeImpact(category),
      practice_impact_is_ai_draft: true,
      fact_tier: mapAuthorityToFactTier(srcMeta),
      unverified: srcMeta ? srcMeta.authority_tier === "T3" : true,
      needs_human_check: false,
      high_risk_legal: highRisk,
      ...(highRisk ? { effective_status: "guidance" } : {}),
      headline: false,
      review_status: "pending_review",
    };

    const check = validateBySchemaName("candidate-item", candidate);
    if (!check.valid) {
      throw new Error(
        `CandidateItem schema validation failed for ${candidate.id}: ${check.errors.join("; ")}`,
      );
    }
    candidates.push(candidate);
  }

  const finishedAt = new Date().toISOString();
  const attempted = sourceResults.filter((r) => r.status !== "skipped").length;
  const succeeded = sourceResults.filter((r) => r.status === "ok").length;
  const failed = sourceResults.filter((r) => r.status === "error" || r.status === "degraded").length;
  const runStatus =
    attempted === 0
      ? "success"
      : succeeded === attempted
        ? "success"
        : succeeded > 0
          ? "partial"
          : "failed";

  const meta = {
    schema_version: "1.0",
    run_id: `collect-${region}-${date.replace(/-/g, "")}-${sha256Text(startedAt).slice(0, 6)}`,
    region,
    started_at: startedAt,
    finished_at: finishedAt,
    status: runStatus,
    sources_attempted: attempted,
    sources_succeeded: succeeded,
    sources_failed: failed,
    items_fetched: rawCollected.length,
    items_deduped: dedupedCount,
    cache_ttl_days: CACHE_TTL_DAYS,
    cache_pruned_count: prunedCount,
    source_results: sourceResults,
  };

  const metaCheck = validateBySchemaName("collect-meta", meta);
  if (!metaCheck.valid) {
    throw new Error(`CollectMeta schema validation failed: ${metaCheck.errors.join("; ")}`);
  }

  if (writeOutput) {
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }
    writeFileSync(
      path.join(outputDir, `${region}.json`),
      `${JSON.stringify(candidates, null, 2)}\n`,
      "utf8",
    );
    writeFileSync(
      path.join(outputDir, `${region}-meta.json`),
      `${JSON.stringify(meta, null, 2)}\n`,
      "utf8",
    );
  }

  return { candidates, meta };
}
