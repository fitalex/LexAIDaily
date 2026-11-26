import { describe, it } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  VALID_CATEGORIES,
  VALID_SOURCE_TYPES,
  loadAndValidateWhitelist,
  validateWhitelistConfig,
} from "../../src/sources/validate-whitelist.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "../..");

const CN_PATH = path.join(REPO_ROOT, "data/sources/whitelist-cn.yaml");
const GLOBAL_PATH = path.join(REPO_ROOT, "data/sources/whitelist-global.yaml");

const cnRes = loadAndValidateWhitelist(CN_PATH, "cn");
const globalRes = loadAndValidateWhitelist(GLOBAL_PATH, "global");

describe("LD-G2-02 Dual-Track Whitelist YAML Validation (v1.1 Practical Radar)", () => {
  it("validates whitelist-cn.yaml (12 sources) and whitelist-global.yaml (14 sources) with zero errors", () => {
    assert.equal(cnRes.valid, true, JSON.stringify(cnRes.errors, null, 2));
    assert.equal(cnRes.config.sources.length, 12);

    assert.equal(globalRes.valid, true, JSON.stringify(globalRes.errors, null, 2));
    assert.equal(globalRes.config.sources.length, 14);
  });

  it("enforces cross-file unique source_id and covers all 5 categories & 7 source types", () => {
    const allSources = [...cnRes.config.sources, ...globalRes.config.sources];
    const ids = new Set(allSources.map((s) => s.source_id));
    assert.equal(ids.size, allSources.length);

    const coveredCategories = new Set();
    const coveredTypes = new Set();
    for (const src of allSources) {
      coveredTypes.add(src.source_type);
      for (const cat of src.default_categories) {
        coveredCategories.add(cat);
      }
    }

    assert.deepEqual(coveredCategories, new Set(VALID_CATEGORIES));
    assert.deepEqual(coveredTypes, new Set(VALID_SOURCE_TYPES));
  });

  it("enforces practical-efficiency focus: compliance sentinels <= 25% per track and preserves PR #47 fixture IDs", () => {
    const isSentinel = (s) =>
      s.source_type === "legislation_regulator" ||
      s.source_type === "court_judiciary";

    const cnSentinels = cnRes.config.sources.filter(isSentinel);
    const globalSentinels = globalRes.config.sources.filter(isSentinel);

    assert.ok(
      cnSentinels.length >= 1 && cnSentinels.length / cnRes.config.sources.length <= 0.25,
      `CN sentinels ratio out of range: ${cnSentinels.length}/${cnRes.config.sources.length}`,
    );
    assert.ok(
      globalSentinels.length >= 1 &&
        globalSentinels.length / globalRes.config.sources.length <= 0.25,
      `Global sentinels ratio out of range: ${globalSentinels.length}/${globalRes.config.sources.length}`,
    );

    // Ensure PR #47 fixture source_ids remain intact
    const globalIds = new Set(globalRes.config.sources.map((s) => s.source_id));
    for (const requiredId of [
      "uk-ico-news",
      "arxiv-cs-ai-rss",
      "thomson-reuters-institute",
    ]) {
      assert.ok(globalIds.has(requiredId), `Missing PR #47 fixture source_id: ${requiredId}`);
    }

    // Ensure anonymous CourtListener Atom feed remains T2 + high_risk_default: true
    const cl = globalRes.config.sources.find((s) => s.source_id === "us-courtlistener");
    assert.ok(cl);
    assert.equal(cl.fetch_mode, "atom");
    assert.equal(cl.authority_tier, "T2");
    assert.equal(cl.high_risk_default, true);
  });

  it("marks aihot.news/api/v1 as discovery_only with links.original & Gate 3/4 written-permission redline", () => {
    const aihot = cnRes.config.sources.find(
      (s) => s.expected_domain === "aihot.news",
    );
    assert.ok(aihot);
    assert.equal(aihot.discovery_only, true);
    assert.equal(aihot.fetch_mode, "discovery_api");
    assert.ok(aihot.entry_url.startsWith("https://aihot.news/api/v1"));
    assert.ok(aihot.compliance_redline.includes("links.original"));
    assert.ok(aihot.compliance_redline.includes("书面许可"));
  });

  it("rejects unknown typo keys, duplicate entry_url, T1/T2-court high_risk_default=false, and discovery_api without redline", () => {
    const withTypo = structuredClone(cnRes.config);
    withTypo.sources[0].high_risk_defualt = true;
    assert.equal(validateWhitelistConfig(withTypo, "cn").valid, false);

    const dupUrl = structuredClone(cnRes.config);
    dupUrl.sources[1].entry_url = dupUrl.sources[0].entry_url;
    assert.equal(validateWhitelistConfig(dupUrl, "cn").valid, false);

    const badT1 = structuredClone(cnRes.config);
    badT1.sources[0].high_risk_default = false;
    assert.equal(validateWhitelistConfig(badT1, "cn").valid, false);

    const badT2Court = structuredClone(globalRes.config);
    const clIdx = badT2Court.sources.findIndex((s) => s.source_id === "us-courtlistener");
    badT2Court.sources[clIdx].high_risk_default = false;
    assert.equal(validateWhitelistConfig(badT2Court, "global").valid, false);

    const badDiscovery = structuredClone(cnRes.config);
    const aihotIdx = badDiscovery.sources.findIndex(
      (s) => s.source_id === "aihot-news-discovery",
    );
    delete badDiscovery.sources[aihotIdx].compliance_redline;
    assert.equal(validateWhitelistConfig(badDiscovery, "cn").valid, false);
  });
});
