import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

export const CACHE_TTL_DAYS = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function getDefaultCacheDir(repoRoot = process.cwd()) {
  return path.join(repoRoot, ".cache", "raw");
}

export function sha256Text(text) {
  return createHash("sha256").update(String(text ?? ""), "utf8").digest("hex");
}

export function ensureCacheDir(cacheDir) {
  if (!existsSync(cacheDir)) {
    mkdirSync(cacheDir, { recursive: true });
  }
}

/**
 * Prunes raw cache snapshots older than ttlDays (ADR-0002: 7-day TTL).
 */
export function pruneExpiredCache({
  cacheDir,
  nowMs = Date.now(),
  ttlDays = CACHE_TTL_DAYS,
} = {}) {
  if (!cacheDir || !existsSync(cacheDir)) {
    return 0;
  }
  const cutoffMs = nowMs - ttlDays * MS_PER_DAY;
  let pruned = 0;

  for (const entry of readdirSync(cacheDir)) {
    if (!entry.endsWith(".json") || entry.startsWith(".")) {
      continue;
    }
    const fullPath = path.join(cacheDir, entry);
    let recordTimeMs = null;
    try {
      const parsed = JSON.parse(readFileSync(fullPath, "utf8"));
      if (parsed && typeof parsed.cached_at === "string") {
        const parsedMs = Date.parse(parsed.cached_at);
        if (!Number.isNaN(parsedMs)) {
          recordTimeMs = parsedMs;
        }
      }
    } catch {
      // Fallback to file mtime if JSON is unreadable
    }
    if (recordTimeMs === null) {
      try {
        recordTimeMs = statSync(fullPath).mtimeMs;
      } catch {
        continue;
      }
    }
    if (recordTimeMs < cutoffMs) {
      unlinkSync(fullPath);
      pruned += 1;
    }
  }
  return pruned;
}

/**
 * Persists full article plain text exclusively into local .cache/raw/ (never public data/).
 */
export function writeRawCache({ cacheDir, item, nowIso = new Date().toISOString() }) {
  ensureCacheDir(cacheDir);
  const rawText = String(item.raw_text ?? "").trim();
  const sha256 = sha256Text(rawText);
  const record = {
    sha256,
    guid: item.guid ?? null,
    source_id: item.source_id,
    region: item.region,
    layer: item.layer ?? "L1_PUBLIC",
    discovered_via: item.discovered_via ?? null,
    source_url: item.source_url,
    title: item.title,
    published_at: item.published_at,
    cached_at: nowIso,
    heat_score: item.heat_score ?? null,
    raw_text: rawText,
  };
  const cachePath = path.join(cacheDir, `${sha256}.json`);
  writeFileSync(cachePath, `${JSON.stringify(record, null, 2)}\n`, "utf8");
  return { sha256, cachePath, record };
}

export function readRawCache({ cacheDir, sha256 }) {
  const cachePath = path.join(cacheDir, `${sha256}.json`);
  if (!existsSync(cachePath)) {
    return null;
  }
  return JSON.parse(readFileSync(cachePath, "utf8"));
}

/**
 * Loads all raw cache records indexed by normalized source_url and sha256
 * so `curate` can re-run completely offline without re-fetching.
 */
export function loadRawCacheIndex(cacheDir) {
  const byUrl = new Map();
  const bySha = new Map();
  if (!cacheDir || !existsSync(cacheDir)) {
    return { byUrl, bySha };
  }
  for (const entry of readdirSync(cacheDir)) {
    if (!entry.endsWith(".json") || entry.startsWith(".")) {
      continue;
    }
    const fullPath = path.join(cacheDir, entry);
    try {
      const record = JSON.parse(readFileSync(fullPath, "utf8"));
      if (record && typeof record.sha256 === "string") {
        bySha.set(record.sha256, record);
      }
      if (record && typeof record.source_url === "string") {
        byUrl.set(record.source_url, record);
      }
    } catch {
      // Skip malformed cache entries
    }
  }
  return { byUrl, bySha };
}
