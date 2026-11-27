import { describe, it } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  VALID_CATEGORIES,
  VALID_SOURCE_TYPES,
  checkPayloadParsability,
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

describe("LD-G2-02 Dual-Track Whitelist YAML Validation (v1.2 Practical Radar)", () => {
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

  it("enforces compliance sentinel ratio strictly within 15%–25% per track and preserves PR #47 fixture IDs", () => {
    const isSentinel = (s) =>
      s.source_type === "legislation_regulator" ||
      s.source_type === "court_judiciary";

    const cnRatio =
      cnRes.config.sources.filter(isSentinel).length / cnRes.config.sources.length;
    const globalRatio =
      globalRes.config.sources.filter(isSentinel).length /
      globalRes.config.sources.length;

    assert.ok(
      cnRatio >= 0.15 && cnRatio <= 0.25,
      `CN sentinel ratio out of [15%, 25%]: ${(cnRatio * 100).toFixed(1)}%`,
    );
    assert.ok(
      globalRatio >= 0.15 && globalRatio <= 0.25,
      `Global sentinel ratio out of [15%, 25%]: ${(globalRatio * 100).toFixed(1)}%`,
    );

    const globalIds = new Set(globalRes.config.sources.map((s) => s.source_id));
    for (const requiredId of [
      "uk-ico-news",
      "arxiv-cs-ai-rss",
      "thomson-reuters-institute",
    ]) {
      assert.ok(
        globalIds.has(requiredId),
        `Missing PR #47 fixture source_id: ${requiredId}`,
      );
    }

    // Confirm blocked R4 sources are removed and replaced by verified RSS/academic entries
    assert.equal(globalIds.has("global-clio-ai-blog"), false);
    assert.equal(globalIds.has("legal-it-insider"), false);
    assert.equal(globalIds.has("openai-news-rss"), true);
    assert.equal(globalIds.has("stanford-hai-news"), true);

    const cl = globalRes.config.sources.find(
      (s) => s.source_id === "us-courtlistener",
    );
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
    const clIdx = badT2Court.sources.findIndex(
      (s) => s.source_id === "us-courtlistener",
    );
    badT2Court.sources[clIdx].high_risk_default = false;
    assert.equal(validateWhitelistConfig(badT2Court, "global").valid, false);

    const badDiscovery = structuredClone(cnRes.config);
    const aihotIdx = badDiscovery.sources.findIndex(
      (s) => s.source_id === "aihot-news-discovery",
    );
    delete badDiscovery.sources[aihotIdx].compliance_redline;
    assert.equal(validateWhitelistConfig(badDiscovery, "cn").valid, false);
  });

  it("checkPayloadParsability rejects Cloudflare 403, Bot Verification, SPA shells, empty feeds, and accepts valid payloads", () => {
    // Reject Cloudflare 403 (R4-ST01 regression guard)
    const cf = checkPayloadParsability(
      { fetch_mode: "static_html" },
      { status: 403, body: "<html><title>Just a moment...</title></html>" },
    );
    assert.equal(cf.ok, false);

    // Reject Bot Verification 200 (R4-ST02 regression guard)
    const bot = checkPayloadParsability(
      { fetch_mode: "static_html" },
      { status: 200, body: "<html><body><h1>Bot Verification</h1></body></html>" },
    );
    assert.equal(bot.ok, false);

    // Reject SPA shell (R2 regression guard)
    const spa = checkPayloadParsability(
      { fetch_mode: "static_html" },
      { status: 200, body: '<html><body><div id="app"></div><script src="/app.js"></script></body></html>' },
    );
    assert.equal(spa.ok, false);

    // Accept valid static_html
    const validHtml = checkPayloadParsability(
      { fetch_mode: "static_html" },
      {
        status: 200,
        body:
          "<html><body>" +
          Array.from({ length: 6 }, (_, i) => `<a href="/p/${i}">Post ${i}</a>`).join("") +
          "x".repeat(1600) +
          "</body></html>",
      },
    );
    assert.equal(validHtml.ok, true);

    // Accept valid RSS & Atom; reject empty RSS
    assert.equal(
      checkPayloadParsability(
        { fetch_mode: "rss" },
        { status: 200, body: "<rss><channel><item><title>A</title></item></channel></rss>" },
      ).ok,
      true,
    );
    assert.equal(
      checkPayloadParsability(
        { fetch_mode: "rss" },
        { status: 200, body: "<rss><channel></channel></rss>" },
      ).ok,
      false,
    );
    assert.equal(
      checkPayloadParsability(
        { fetch_mode: "atom" },
        { status: 200, body: "<feed><entry><title>Case</title></entry></feed>" },
      ).ok,
      true,
    );

    // Accept valid AIHOT discovery_api; reject missing links.original
    assert.equal(
      checkPayloadParsability(
        { fetch_mode: "discovery_api" },
        {
          status: 200,
          body: JSON.stringify({
            items: [{ title: "Test", links: { original: "https://example.com/1" } }],
          }),
        },
      ).ok,
      true,
    );
    assert.equal(
      checkPayloadParsability(
        { fetch_mode: "discovery_api" },
        { status: 200, body: JSON.stringify({ items: [{ title: "NoLink" }] }) },
      ).ok,
      false,
    );
  });
});
