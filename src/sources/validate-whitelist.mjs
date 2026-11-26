import { readFileSync } from "node:fs";
import { load as loadYaml } from "js-yaml";

export const VALID_SOURCE_TYPES = Object.freeze([
  "legislation_regulator",
  "court_judiciary",
  "academic_paper",
  "official_tech_blog",
  "authoritative_media",
]);

export const VALID_CATEGORIES = Object.freeze([
  "监管与合规",
  "模型与技术",
  "实务与工具",
  "判例与学术",
  "行业与资本",
]);

export const VALID_FETCH_MODES = Object.freeze([
  "rss",
  "atom",
  "static_html",
  "json_api",
  "discovery_api",
]);

export const VALID_TIERS = Object.freeze(["T1", "T2", "T3"]);
export const VALID_STATUSES = Object.freeze(["active", "degraded", "paused"]);

const ALLOWED_ROOT_KEYS = new Set([
  "schema_version",
  "region",
  "updated_at",
  "description",
  "sources",
]);

const ALLOWED_SOURCE_KEYS = new Set([
  "source_id",
  "region",
  "name",
  "source_type",
  "language",
  "jurisdiction",
  "default_categories",
  "fetch_mode",
  "entry_url",
  "expected_domain",
  "authority_tier",
  "high_risk_default",
  "discovery_only",
  "compliance_redline",
  "status",
  "verified_at",
  "verification_note",
]);

export function validateWhitelistConfig(config, expectedRegion) {
  const errors = [];
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    return { valid: false, errors: ["Root config must be a YAML mapping"] };
  }

  for (const key of Object.keys(config)) {
    if (!ALLOWED_ROOT_KEYS.has(key)) {
      errors.push(`Unknown root key: "${key}"`);
    }
  }

  if (config.schema_version !== "1.0") {
    errors.push(`schema_version must be "1.0", got "${config.schema_version}"`);
  }
  if (config.region !== expectedRegion) {
    errors.push(`region must be "${expectedRegion}", got "${config.region}"`);
  }
  if (!Array.isArray(config.sources) || config.sources.length === 0) {
    errors.push("sources must be a non-empty array");
    return { valid: false, errors };
  }

  const seenIds = new Set();
  const seenUrls = new Set();

  for (const [idx, src] of config.sources.entries()) {
    const label = src?.source_id || `sources[${idx}]`;
    if (!src || typeof src !== "object" || Array.isArray(src)) {
      errors.push(`${label}: entry must be an object`);
      continue;
    }

    for (const key of Object.keys(src)) {
      if (!ALLOWED_SOURCE_KEYS.has(key)) {
        errors.push(`${label}: unknown key "${key}"`);
      }
    }

    if (typeof src.source_id !== "string" || !/^[a-z0-9][a-z0-9-]{1,63}$/.test(src.source_id)) {
      errors.push(`${label}: invalid source_id`);
    } else if (seenIds.has(src.source_id)) {
      errors.push(`${label}: duplicate source_id`);
    } else {
      seenIds.add(src.source_id);
    }

    if (src.region !== expectedRegion) {
      errors.push(`${label}: region "${src.region}" != "${expectedRegion}"`);
    }
    if (!VALID_SOURCE_TYPES.includes(src.source_type)) {
      errors.push(`${label}: invalid source_type "${src.source_type}"`);
    }
    if (!VALID_FETCH_MODES.includes(src.fetch_mode)) {
      errors.push(`${label}: invalid fetch_mode "${src.fetch_mode}"`);
    }
    if (!VALID_TIERS.includes(src.authority_tier)) {
      errors.push(`${label}: invalid authority_tier "${src.authority_tier}"`);
    }
    if (!VALID_STATUSES.includes(src.status)) {
      errors.push(`${label}: invalid status "${src.status}"`);
    }
    if (typeof src.high_risk_default !== "boolean") {
      errors.push(`${label}: high_risk_default must be boolean`);
    }
    if (src.authority_tier === "T1" && src.high_risk_default !== true) {
      errors.push(`${label}: T1 source must set high_risk_default: true`);
    }
    if (typeof src.discovery_only !== "boolean") {
      errors.push(`${label}: discovery_only must be boolean`);
    }
    if (src.fetch_mode === "discovery_api" && src.discovery_only !== true) {
      errors.push(`${label}: fetch_mode "discovery_api" requires discovery_only: true`);
    }
    if (src.discovery_only === true) {
      if (
        typeof src.compliance_redline !== "string" ||
        !src.compliance_redline.includes("links.original")
      ) {
        errors.push(`${label}: discovery_only source requires compliance_redline mentioning links.original`);
      }
    }

    if (!Array.isArray(src.default_categories) || src.default_categories.length === 0) {
      errors.push(`${label}: default_categories must be non-empty array`);
    } else {
      for (const cat of src.default_categories) {
        if (!VALID_CATEGORIES.includes(cat)) {
          errors.push(`${label}: invalid category "${cat}"`);
        }
      }
    }

    if (typeof src.entry_url !== "string") {
      errors.push(`${label}: missing entry_url`);
    } else {
      if (seenUrls.has(src.entry_url)) {
        errors.push(`${label}: duplicate entry_url "${src.entry_url}"`);
      } else {
        seenUrls.add(src.entry_url);
      }
      try {
        const parsed = new URL(src.entry_url);
        if (parsed.protocol !== "https:") {
          errors.push(`${label}: entry_url must use https:`);
        }
        if (parsed.hostname !== src.expected_domain) {
          errors.push(
            `${label}: hostname "${parsed.hostname}" != expected_domain "${src.expected_domain}"`,
          );
        }
      } catch {
        errors.push(`${label}: invalid entry_url "${src.entry_url}"`);
      }
    }

    if (typeof src.verified_at !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(src.verified_at)) {
      errors.push(`${label}: invalid verified_at "${src.verified_at}"`);
    }
    if (typeof src.verification_note !== "string" || src.verification_note.length < 8) {
      errors.push(`${label}: verification_note must be at least 8 chars`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function loadAndValidateWhitelist(filePath, expectedRegion) {
  const config = loadYaml(readFileSync(filePath, "utf8"));
  const result = validateWhitelistConfig(config, expectedRegion);
  return { config, ...result };
}
