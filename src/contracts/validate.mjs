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

/**
 * Recursively scan any payload to guarantee no forbidden fulltext keys appear
 * anywhere in public data outputs (ADR-0002 copyright redline).
 * @param {unknown} value
 * @param {string} currentPath
 * @param {Array<{path: string, key: string}>} hits
 */
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
      if (FORBIDDEN_FULLTEXT_KEYS.includes(key)) {
        hits.push({ path: nextPath, key });
      }
      scanForbiddenFulltextKeys(val, nextPath, hits);
    }
  }
  return hits;
}

/**
 * Validate a payload against one of the 4 registered Gate 2 schemas.
 * @param {"candidate-item" | "collect-meta" | "wechat-topic-pool" | "daily-bundle"} schemaName
 * @param {unknown} data
 */
export function validateBySchemaName(schemaName, data) {
  const validateFn = validators[schemaName];
  if (!validateFn) {
    throw new Error(
      `Unknown schema "${schemaName}". Expected one of: ${Object.keys(SCHEMA_FILES).join(", ")}`,
    );
  }

  const forbiddenHits = scanForbiddenFulltextKeys(data);
  const schemaOk = Boolean(validateFn(data));
  const errors = [];

  for (const hit of forbiddenHits) {
    errors.push({
      instancePath: hit.path,
      keyword: "forbiddenFulltextKey",
      message: `forbidden fulltext field "${hit.key}" is prohibited in public data (ADR-0002)`,
    });
  }

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

/**
 * Verify ADR-0002 raw cache isolation:
 * 1) `.gitignore` explicitly ignores `.cache/raw/` (or `.cache/`)
 * 2) `git ls-files .cache/raw` returns zero tracked files
 * @param {string} repoRoot
 */
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
    const stdout = execFileSync("git", ["ls-files", ".cache/raw"], {
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
        `Tracked files found under .cache/raw/: ${trackedFiles.join(", ")}`,
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
