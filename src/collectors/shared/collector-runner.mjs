import { existsSync, mkdirSync, renameSync, writeFileSync } from "node:fs";
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
import { getLocalDateString } from "./adapters-ext.mjs";
import {
  CACHE_TTL_DAYS,
  getDefaultCacheDir,
  pruneExpiredCache,
  sha256Text,
  writeRawCache,
} from "./cache.mjs";
import { stripHtmlToPlainText } from "./extractor.mjs";
import { extractDomain } from "./url-and-domain.mjs";

const OFFICIAL_HIGH_RISK_DOMAINS = Object.freeze([
  "court.gov.cn",
  "cac.gov.cn",
  "gov.cn",
  "ec.europa.eu",
  "ico.org.uk",
  "courtlistener.com",
  "eur-lex.europa.eu",
  "congress.gov",
]);

function writeJsonAtomic(filePath, data) {
  const dir = path.dirname(filePath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const tmpPath = `${filePath}.tmp-${process.pid}-${Date.now()}`;
  writeFileSync(tmpPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  renameSync(tmpPath, filePath);
}

function clampString(str, minLen, maxLen, padSuffix = "。") {
  let out = stripHtmlToPlainText(str).replace(/\s+/g, " ").trim();
  if (out.length > maxLen) {
    out = out.slice(0, maxLen).trim();
  }
  while (out.length < minLen) {
    out = `${out}${padSuffix}`;
  }
  return out;
}

function buildInitialSummary(title, rawText) {
  const cleanText = stripHtmlToPlainText(rawText).replace(/\s+/g, " ").trim();
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

function isOfficialHighRiskDomain(domain) {
  const lower = String(domain ?? "").toLowerCase();
  return OFFICIAL_HIGH_RISK_DOMAINS.some((d) => lower === d || lower.endsWith(`.${d}`));
}

function resolveFactTierAndRisk({ srcMeta, raw, domain }) {
  if (raw.discovered_via) {
    const officialOrigin = isOfficialHighRiskDomain(domain);
    return {
      fact_tier: officialOrigin ? "confirmed_fact" : "market_opinion",
      unverified: true,
      high_risk_legal: officialOrigin,
      source_name: clampString(raw.origin_source_name || domain || raw.source_id, 2, 120, ""),
    };
  }

  const sType = srcMeta?.source_type;
  let factTier = "market_opinion";
  let unverified = true;

  if (sType === "legislation_regulator" || sType === "court_judiciary") {
    factTier = srcMeta.authority_tier === "T1" ? "confirmed_fact" : "official_data";
    unverified = false;
  } else if (sType === "official_tech_blog" || sType === "academic_paper") {
    factTier = "official_data";
    unverified = false;
  } else {
    factTier = "market_opinion";
    unverified = true;
  }

  return {
    fact_tier: factTier,
    unverified,
    high_risk_legal: Boolean(srcMeta?.high_risk_default),
    source_name: clampString(srcMeta?.name || domain || raw.source_id, 2, 120, ""),
  };
}

function inferEffectiveStatus({ srcMeta, title = "", rawText = "" }) {
  if (srcMeta?.source_type === "court_judiciary") {
    return { status: "not_applicable", uncertain: false };
  }
  const sample = `${title}\n${rawText.slice(0, 600)}`.toLowerCase();
  if (/征求意见|草案|draft|proposed/.test(sample)) return { status: "draft", uncertain: false };
  if (/废止|repealed/.test(sample)) return { status: "repealed", uncertain: false };
  if (/修订|amended/.test(sample)) return { status: "amended", uncertain: false };
  if (/生效|施行|in force|enacted/.test(sample)) return { status: "in_force", uncertain: false };
  if (/指引|指南|指导意见|guidance|code of practice/.test(sample)) {
    return { status: "guidance", uncertain: false };
  }
  return { status: "not_applicable", uncertain: true };
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
  nowIso = new Date().toISOString(),
  env = process.env,
  date = getLocalDateString(nowIso, env?.TZ || "Asia/Shanghai"),
  cacheDir = getDefaultCacheDir(repoRoot),
  outputDir = path.join(repoRoot, "data", "candidates", date),
  whitelistPath = path.join(repoRoot, "data", "sources", `whitelist-${region}.yaml`),
  manualInboxPath = path.join(repoRoot, ".local", "manual-inbox.yaml"),
  fetchImpl = globalThis.fetch,
  timeoutMs = 15000,
  retries = 2,
  backoffBaseMs = 300,
  perSourceDelayMs = 0,
  maxItemsPerSource = 8,
  maxAihotTrace = 6,
  fetchArticleBodyForFeeds = true,
  useEnvProxy = region === "global",
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
    useEnvProxy,
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
  const rejectedItems = [];
  let dedupedCount = 0;

  for (const raw of rawCollected) {
    if (seenUrls.has(raw.source_url)) {
      dedupedCount += 1;
      continue;
    }
    seenUrls.add(raw.source_url);

    const cleanRawText = stripHtmlToPlainText(raw.raw_text);
    writeRawCache({ cacheDir, item: { ...raw, raw_text: cleanRawText }, nowIso });

    const srcMeta = sourceById.get(raw.source_id);
    const domain = extractDomain(raw.source_url);
    const category = srcMeta?.default_categories?.[0] || "实务与工具";
    const resolved = resolveFactTierAndRisk({ srcMeta, raw, domain });
    const eff = resolved.high_risk_legal
      ? inferEffectiveStatus({ srcMeta, title: raw.title, rawText: cleanRawText })
      : { status: undefined, uncertain: false };

    const needsHumanCheck = Boolean(raw.published_date_inferred || eff.uncertain);

    const candidate = {
      id: makeCandidateId(region, raw.source_id, raw.source_url),
      region,
      source_id: raw.source_id,
      ...(raw.discovered_via ? { discovered_via: raw.discovered_via } : {}),
      source_name: resolved.source_name,
      source_domain: domain,
      source_url: raw.source_url,
      published_at: raw.published_at,
      collected_at: nowIso,
      category,
      title: clampString(raw.title, 6, 120, "（待核）"),
      summary: buildInitialSummary(raw.title, cleanRawText),
      practice_impact_brief: buildInitialPracticeImpact(category),
      practice_impact_is_ai_draft: true,
      fact_tier: resolved.fact_tier,
      unverified: Boolean(resolved.unverified || raw.published_date_inferred),
      needs_human_check: needsHumanCheck,
      high_risk_legal: resolved.high_risk_legal,
      ...(resolved.high_risk_legal ? { effective_status: eff.status } : {}),
      headline: false,
      review_status: "pending_review",
    };

    const check = validateBySchemaName("candidate-item", candidate);
    if (!check.valid) {
      rejectedItems.push({
        id: candidate.id,
        source_id: candidate.source_id,
        errors: JSON.stringify(check.errors),
      });
      const sr = sourceResults.find((r) => r.source_id === candidate.source_id);
      if (sr) {
        sr.status = "degraded";
        sr.error_message = `Item schema rejected (${candidate.id}): ${JSON.stringify(check.errors).slice(0, 220)}`;
      }
      continue;
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
    throw new Error(`CollectMeta schema validation failed: ${JSON.stringify(metaCheck.errors)}`);
  }

  if (writeOutput) {
    writeJsonAtomic(path.join(outputDir, `${region}.json`), candidates);
    writeJsonAtomic(path.join(outputDir, `${region}-meta.json`), meta);
  }

  return { candidates, meta, rejectedItems };
}
