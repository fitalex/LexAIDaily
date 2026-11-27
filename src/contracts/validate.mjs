import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
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

/**
 * R2-ST05: Validates either a single object or an array of objects (e.g. cn.json / global.json) against a schema.
 */
export function validatePayloadOrArray(schemaName, payload) {
  if (schemaName === "candidate-item" && Array.isArray(payload)) {
    const errors = [];
    payload.forEach((item, idx) => {
      const res = validateBySchemaName(schemaName, item);
      if (!res.valid) {
        for (const err of res.errors) {
          errors.push({
            ...err,
            instancePath: `[${idx}]${err.instancePath === "$" ? "" : err.instancePath}`,
          });
        }
      }
    });
    return {
      valid: errors.length === 0,
      schemaName,
      count: payload.length,
      errors,
    };
  }
  return validateBySchemaName(schemaName, payload);
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

function listJsonFilesRecursive(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      out.push(...listJsonFilesRecursive(full));
    } else if (entry.endsWith(".json")) {
      out.push(full);
    }
  }
  return out;
}

/**
 * R2-ST05: Validates .cache isolation plus all existing public outputs under data/candidates, data/bundles, data/topic-pool.
 */
export function validateAllPublicOutputs(repoRoot = DEFAULT_REPO_ROOT) {
  const cacheCheck = checkNoTrackedRawCache(repoRoot);
  const filesChecked = [];
  const fileErrors = [];

  const targets = [
    { dir: path.join(repoRoot, "data", "candidates"), inferSchema: (f) => (f.endsWith("-meta.json") ? "collect-meta" : "candidate-item") },
    { dir: path.join(repoRoot, "data", "bundles"), inferSchema: () => "daily-bundle" },
    { dir: path.join(repoRoot, "data", "topic-pool"), inferSchema: () => "wechat-topic-pool" },
  ];

  for (const { dir, inferSchema } of targets) {
    for (const filePath of listJsonFilesRecursive(dir)) {
      const schemaName = inferSchema(path.basename(filePath));
      const rel = path.relative(repoRoot, filePath);
      try {
        const payload = JSON.parse(readFileSync(filePath, "utf8"));
        const res = validatePayloadOrArray(schemaName, payload);
        filesChecked.push({ file: rel, schemaName, valid: res.valid });
        if (!res.valid) {
          fileErrors.push({ file: rel, schemaName, errors: res.errors });
        }
      } catch (err) {
        filesChecked.push({ file: rel, schemaName, valid: false });
        fileErrors.push({ file: rel, schemaName, errors: [{ message: String(err?.message ?? err) }] });
      }
    }
  }

  return {
    valid: cacheCheck.valid && fileErrors.length === 0,
    trackedFiles: cacheCheck.trackedFiles,
    filesChecked: filesChecked.length,
    errors: [...cacheCheck.errors, ...fileErrors],
  };
}

function runCli() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error(
      "Usage:\n  node src/contracts/validate.mjs <schemaName> <jsonFile>\n  node src/contracts/validate.mjs --batch <schemaName> <jsonFile>\n  node src/contracts/validate.mjs --all [repoRoot]\n  node src/contracts/validate.mjs --check-cache",
    );
    process.exit(2);
  }

  if (args[0] === "--check-cache") {
    const res = checkNoTrackedRawCache(DEFAULT_REPO_ROOT);
    console.log(JSON.stringify(res, null, 2));
    process.exit(res.valid ? 0 : 1);
  }

  if (args[0] === "--all") {
    const rootDir = args[1] ? path.resolve(process.cwd(), args[1]) : DEFAULT_REPO_ROOT;
    const res = validateAllPublicOutputs(rootDir);
    console.log(JSON.stringify(res, null, 2));
    process.exit(res.valid ? 0 : 1);
  }

  const isBatch = args[0] === "--batch";
  const schemaName = isBatch ? args[1] : args[0];
  const filePath = isBatch ? args[2] : args[1];
  if (!schemaName || !filePath) {
    console.error("Missing <schemaName> or <jsonFile> argument.");
    process.exit(2);
  }

  const absPath = path.resolve(process.cwd(), filePath);
  const payload = JSON.parse(readFileSync(absPath, "utf8"));
  const result = validatePayloadOrArray(schemaName, payload);
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.valid ? 0 : 1);
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  runCli();
}
