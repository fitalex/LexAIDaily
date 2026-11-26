import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { load as loadYaml } from "js-yaml";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "../..");

const CN_PATH = path.join(REPO_ROOT, "data/sources/whitelist-cn.yaml");
const GLOBAL_PATH = path.join(REPO_ROOT, "data/sources/whitelist-global.yaml");

const VALID_SOURCE_TYPES = new Set([
  "legislation_regulator",
  "court_judiciary",
  "academic_paper",
  "official_tech_blog",
  "authoritative_media",
]);

const VALID_CATEGORIES = new Set([
  "监管与合规",
  "模型与技术",
  "实务与工具",
  "判例与学术",
  "行业与资本",
]);

const VALID_FETCH_MODES = new Set([
  "rss",
  "atom",
  "static_html",
  "json_api",
  "discovery_api",
]);

const VALID_TIERS = new Set(["T1", "T2", "T3"]);
const VALID_STATUSES = new Set(["active", "degraded", "paused"]);

const cnConfig = loadYaml(readFileSync(CN_PATH, "utf8"));
const globalConfig = loadYaml(readFileSync(GLOBAL_PATH, "utf8"));

describe("LD-G2-02 Dual-Track Whitelist YAML Validation", () => {
  it("parses both whitelist-cn.yaml and whitelist-global.yaml with valid region headers", () => {
    assert.equal(cnConfig.schema_version, "1.0");
    assert.equal(cnConfig.region, "cn");
    assert.ok(Array.isArray(cnConfig.sources) && cnConfig.sources.length >= 8);

    assert.equal(globalConfig.schema_version, "1.0");
    assert.equal(globalConfig.region, "global");
    assert.ok(
      Array.isArray(globalConfig.sources) && globalConfig.sources.length >= 10,
    );
  });

  it("enforces unique source_id, strict region isolation, valid URLs, and expected_domain matching", () => {
    const seenIds = new Set();

    for (const [expectedRegion, config] of [
      ["cn", cnConfig],
      ["global", globalConfig],
    ]) {
      for (const src of config.sources) {
        assert.match(
          src.source_id,
          /^[a-z0-9][a-z0-9-]{1,63}$/,
          `Invalid source_id: ${src.source_id}`,
        );
        assert.equal(
          seenIds.has(src.source_id),
          false,
          `Duplicate source_id: ${src.source_id}`,
        );
        seenIds.add(src.source_id);

        assert.equal(
          src.region,
          expectedRegion,
          `Region mismatch for ${src.source_id}`,
        );
        assert.ok(
          VALID_SOURCE_TYPES.has(src.source_type),
          `Invalid source_type for ${src.source_id}: ${src.source_type}`,
        );
        assert.ok(
          VALID_FETCH_MODES.has(src.fetch_mode),
          `Invalid fetch_mode for ${src.source_id}: ${src.fetch_mode}`,
        );
        assert.ok(
          VALID_TIERS.has(src.authority_tier),
          `Invalid authority_tier for ${src.source_id}: ${src.authority_tier}`,
        );
        assert.ok(
          VALID_STATUSES.has(src.status),
          `Invalid status for ${src.source_id}: ${src.status}`,
        );
        assert.equal(typeof src.high_risk_default, "boolean");
        assert.equal(typeof src.discovery_only, "boolean");
        assert.ok(
          Array.isArray(src.default_categories) &&
            src.default_categories.length >= 1,
        );
        for (const cat of src.default_categories) {
          assert.ok(
            VALID_CATEGORIES.has(cat),
            `Invalid category for ${src.source_id}: ${cat}`,
          );
        }

        const parsedUrl = new URL(src.entry_url);
        assert.equal(
          parsedUrl.protocol,
          "https:",
          `Non-HTTPS entry_url for ${src.source_id}`,
        );
        assert.equal(
          parsedUrl.hostname,
          src.expected_domain,
          `Hostname ${parsedUrl.hostname} != expected_domain ${src.expected_domain} for ${src.source_id}`,
        );
        assert.match(src.verified_at, /^\d{4}-\d{2}-\d{2}$/);
        assert.ok(
          typeof src.verification_note === "string" &&
            src.verification_note.length >= 8,
        );
      }
    }
  });

  it("covers all 5 official content categories and all 5 authoritative source types across dual tracks", () => {
    const allSources = [...cnConfig.sources, ...globalConfig.sources];
    const coveredCategories = new Set();
    const coveredTypes = new Set();

    for (const src of allSources) {
      coveredTypes.add(src.source_type);
      for (const cat of src.default_categories) {
        coveredCategories.add(cat);
      }
    }

    assert.deepEqual(coveredCategories, VALID_CATEGORIES);
    assert.deepEqual(coveredTypes, VALID_SOURCE_TYPES);
  });

  it("marks aihot.news/api/v1 as discovery_only with explicit compliance redline", () => {
    const aihot = cnConfig.sources.find(
      (s) => s.expected_domain === "aihot.news",
    );
    assert.ok(aihot, "aihot.news discovery source must exist in whitelist-cn.yaml");
    assert.equal(aihot.discovery_only, true);
    assert.equal(aihot.fetch_mode, "discovery_api");
    assert.ok(aihot.entry_url.startsWith("https://aihot.news/api/v1"));
    assert.ok(
      typeof aihot.compliance_redline === "string" &&
        aihot.compliance_redline.includes("links.original"),
      "aihot compliance_redline must explicitly mandate links.original traceback",
    );
  });
});
