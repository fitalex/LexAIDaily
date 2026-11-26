import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv from "ajv";
import addFormats from "ajv-formats";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_REPO_ROOT = path.resolve(__dirname, "../..");
const SCHEMAS_DIR = path.join(DEFAULT_REPO_ROOT, "schemas");

export const FORBIDDEN_FULLTEXT_KEYS = Object.freeze([
  "raw_text",
  "full_text",
  "html_content",
  "body_html",
  "raw_html",
  "full_content",
  "article_body",
]);

const NORMALIZED_FORBIDDEN_KEYS = new Set(
  FORBIDDEN_FULLTEXT_KEYS.map((k) => k.toLowerCase().replace(/[_-]/g, "")),
);

export const DISCOVERY_ONLY_DOMAINS = Object.freeze(["aihot.news"]);

const SCHEMA_FILES = Object.freeze({
  "candidate-item": "candidate-item.schema.json",
  "collect-meta": "collect-meta.schema.json",
  "wechat-topic-pool": "wechat-topic-pool.schema.json",
  "daily-bundle": "daily-bundle.schema.json",
});

function createAjv() {
  const ajv = new Ajv({
    allErrors: true,
    strict: true,
    strictRequired: false,
    allowUnionTypes: false,
  });
  addFormats(ajv);

  for (const filename of Object.values(SCHEMA_FILES)) {
    const schemaPath = path.join(SCHEMAS_DIR, filename);
    const schema = JSON.parse(readFileSync(schemaPath, "utf8"));
    ajv.addSchema(schema);
  }
  return ajv;
}

const ajvInstance = createAjv();

const validators = Object.freeze({
  "candidate-item": ajvInstance.getSchema(
    "https://lexaidaily.local/schemas/candidate-item.schema.json",
  ),
  "collect-meta": ajvInstance.getSchema(
    "https://lexaidaily.local/schemas/collect-meta.schema.json",
  ),
  "wechat-topic-pool": ajvInstance.getSchema(
    "https://lexaidaily.local/schemas/wechat-topic-pool.schema.json",
  ),
  "daily-bundle": ajvInstance.getSchema(
    "https://lexaidaily.local/schemas/daily-bundle.schema.json",
  ),
});

function isDiscoveryOnlyHost(hostname) {
  const lower = hostname.toLowerCase();
  return DISCOVERY_ONLY_DOMAINS.some(
    (domain) => lower === domain || lower.endsWith(`.${domain}`),
  );
}

export function scanForbiddenFulltextKeys(value, currentPath = "$", hits = []) {
  if (Array.isArray(value)) {
    value.forEach((item, idx) => {
      scanForbiddenFulltextKeys(item, `${currentPath}[${idx}]`, hits);
    });
    return hits;
  }
  if (value !== null && typeof value === "object") {
    for (const [key, val] of Object.entries(value)) {
      const nextPath = `${currentPath}.${key}`;
      const normalized = key.toLowerCase().replace(/[_-]/g, "");
      if (NORMALIZED_FORBIDDEN_KEYS.has(normalized)) {
        hits.push({ path: nextPath, key });
      }
      scanForbiddenFulltextKeys(val, nextPath, hits);
    }
  }
  return hits;
}

function checkDiscoverySourceUrls(value, currentPath = "$", errors = []) {
  if (Array.isArray(value)) {
    value.forEach((item, idx) => {
      checkDiscoverySourceUrls(item, `${currentPath}[${idx}]`, errors);
    });
    return errors;
  }
  if (value !== null && typeof value === "object") {
    if (typeof value.source_url === "string") {
      try {
        const parsed = new URL(value.source_url);
        if (isDiscoveryOnlyHost(parsed.hostname)) {
          errors.push({
            instancePath: `${currentPath}.source_url`,
            keyword: "discoverySourceUrlForbidden",
            message: `source_url host "${parsed.hostname}" is a discovery_only source and cannot be used as primary source_url (ADR-0003)`,
          });
        }
      } catch {
        // Invalid URI syntax is handled by ajv-formats
      }
    }
    if (Array.isArray(value.primary_source_urls)) {
      value.primary_source_urls.forEach((url, idx) => {
        if (typeof url !== "string") return;
        try {
          const parsed = new URL(url);
          if (isDiscoveryOnlyHost(parsed.hostname)) {
            errors.push({
              instancePath: `${currentPath}.primary_source_urls[${idx}]`,
              keyword: "discoverySourceUrlForbidden",
              message: `primary_source_urls host "${parsed.hostname}" is a discovery_only source (ADR-0003)`,
            });
          }
        } catch {
          // Invalid URI syntax is handled by ajv-formats
        }
      });
    }
    for (const [key, val] of Object.entries(value)) {
      if (val && typeof val === "object") {
        checkDiscoverySourceUrls(val, `${currentPath}.${key}`, errors);
      }
    }
  }
  return errors;
}

export function validateSourceIdAgainstWhitelist(data, allowedSourceIds) {
  const allowed = new Set(allowedSourceIds);
  const errors = [];
  const items = Array.isArray(data?.items)
    ? data.items
    : data && typeof data === "object" && "source_id" in data
      ? [data]
      : [];

  items.forEach((item, idx) => {
    if (typeof item?.source_id === "string" && !allowed.has(item.source_id)) {
      errors.push({
        instancePath: Array.isArray(data?.items)
          ? `/items/${idx}/source_id`
          : "/source_id",
        keyword: "unknownWhitelistSourceId",
        message: `source_id "${item.source_id}" is not registered in whitelist`,
      });
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateBySchemaName(schemaName, data) {
  const validateFn = validators[schemaName];
  if (!validateFn) {
    throw new Error(
      `Unknown schema "${schemaName}". Expected one of: ${Object.keys(SCHEMA_FILES).join(", ")}`,
    );
  }

  const forbiddenHits = scanForbiddenFulltextKeys(data);
  const discoveryErrors = checkDiscoverySourceUrls(data);
  const schemaOk = Boolean(validateFn(data));
  const errors = [];

  for (const hit of forbiddenHits) {
    errors.push({
      instancePath: hit.path,
      keyword: "forbiddenFulltextKey",
      message: `forbidden fulltext field "${hit.key}" is prohibited in public data (ADR-0002)`,
    });
  }

  errors.push(...discoveryErrors);

  if (!schemaOk && Array.isArray(validateFn.errors)) {
    for (const err of validateFn.errors) {
      errors.push({
        instancePath: err.instancePath || "$",
        keyword: err.keyword,
        message: err.message || "schema validation failed",
      });
    }
  }

  return {
    valid: errors.length === 0,
    schemaName,
    errors,
  };
}

export const validateCandidateItem = (data) =>
  validateBySchemaName("candidate-item", data);

export const validateCollectMeta = (data) =>
  validateBySchemaName("collect-meta", data);

export const validateWechatTopicPool = (data) =>
  validateBySchemaName("wechat-topic-pool", data);

export const validateDailyBundle = (data) =>
  validateBySchemaName("daily-bundle", data);

export function checkNoTrackedRawCache(repoRoot = DEFAULT_REPO_ROOT) {
  const errors = [];
  const gitignorePath = path.join(repoRoot, ".gitignore");
  if (!existsSync(gitignorePath)) {
    errors.push(".gitignore not found");
  } else {
    const lines = readFileSync(gitignorePath, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"));
    const ignoresCache =
      lines.includes(".cache/raw/") ||
      lines.includes(".cache/raw") ||
      lines.includes(".cache/") ||
      lines.includes(".cache");
    if (!ignoresCache) {
      errors.push(".gitignore must explicitly ignore .cache/raw/ (ADR-0002)");
    }
  }

  let trackedFiles = [];
  try {
    const stdout = execFileSync("git", ["ls-files", ".cache"], {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    trackedFiles = stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (trackedFiles.length > 0) {
      errors.push(
        `Tracked files found under .cache/: ${trackedFiles.join(", ")}`,
      );
    }
  } catch (err) {
    errors.push(`git ls-files check failed: ${err.message}`);
  }

  return {
    valid: errors.length === 0,
    trackedFiles,
    errors,
  };
}

function runCli() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error(
      "Usage:\n  node src/contracts/validate.mjs <schemaName> <jsonFile>\n  node src/contracts/validate.mjs --check-cache",
    );
    process.exit(2);
  }

  if (args[0] === "--check-cache") {
    const res = checkNoTrackedRawCache(DEFAULT_REPO_ROOT);
    console.log(JSON.stringify(res, null, 2));
    process.exit(res.valid ? 0 : 1);
  }

  const [schemaName, filePath] = args;
  if (!filePath) {
    console.error("Missing <jsonFile> argument.");
    process.exit(2);
  }

  const absPath = path.resolve(process.cwd(), filePath);
  const payload = JSON.parse(readFileSync(absPath, "utf8"));
  const result = validateBySchemaName(schemaName, payload);
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.valid ? 0 : 1);
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  runCli();
}
