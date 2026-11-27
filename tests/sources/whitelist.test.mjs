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
import { probeSource } from "../../scripts/sources/smoke-check.mjs";

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

  it("checkPayloadParsability rejects CF/Bot interstitials & SPA shells, while accepting real pages with passive CF scripts (R5-ST02)", () => {
    // Reject Cloudflare 403 & 200 interstitials
    const cf403 = checkPayloadParsability(
      { fetch_mode: "static_html" },
      { status: 403, body: "<html><title>Just a moment...</title></html>" },
    );
    assert.equal(cf403.ok, false);

    const cf200Interstitial = checkPayloadParsability(
      { fetch_mode: "static_html" },
      {
        status: 200,
        body:
          "<html><head><title>Just a moment...</title></head><body><script src=\"/cdn-cgi/challenge-platform/main.js\"></script>" +
          " ".repeat(2000) +
          "</body></html>",
      },
    );
    assert.equal(cf200Interstitial.ok, false);

    // Accept real full page containing passive Cloudflare challenge-platform script (R5-ST02)
    const realPageWithPassiveCf = checkPayloadParsability(
      { fetch_mode: "static_html" },
      {
        status: 200,
        body:
          "<html><head><title>China Law Insight</title></head><body>" +
          Array.from({ length: 20 }, (_, i) => `<a href="/post/${i}">Article ${i}</a>`).join("") +
          "<script src=\"/cdn-cgi/challenge-platform/scripts/jsd/main.js\"></script>" +
          "x".repeat(2000) +
          "</body></html>",
      },
    );
    assert.equal(realPageWithPassiveCf.ok, true, JSON.stringify(realPageWithPassiveCf.errors));

    // Reject Bot Verification 200 (R4-ST02)
    const bot = checkPayloadParsability(
      { fetch_mode: "static_html" },
      { status: 200, body: "<html><body><h1>Bot Verification</h1></body></html>" },
    );
    assert.equal(bot.ok, false);

    // Reject SPA shell (R2)
    const spa = checkPayloadParsability(
      { fetch_mode: "static_html" },
      { status: 200, body: '<html><body><div id="app"></div><script src="/app.js"></script></body></html>' },
    );
    assert.equal(spa.ok, false);

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

  it("probeSource retries transient network failures and stops immediately on non-transient 403 (R5-ST03 & R5-ST04)", async () => {
    const validBody =
      "<html><head><title>Court News</title></head><body>" +
      Array.from({ length: 12 }, (_, i) => `<a href="/n/${i}">News ${i}</a>`).join("") +
      "x".repeat(2000) +
      "</body></html>";

    // Transient network error on attempt 1, succeeds on attempt 2
    let calls = 0;
    const flakyFetch = async () => {
      calls += 1;
      if (calls === 1) {
        throw new TypeError("fetch failed");
      }
      return {
        status: 200,
        headers: new Headers({ "content-type": "text/html" }),
        text: async () => validBody,
      };
    };

    const recovered = await probeSource(
      { source_id: "cn-spc-fabu", fetch_mode: "static_html", entry_url: "https://www.court.gov.cn/fabu.html" },
      { fetchImpl: flakyFetch, maxRetries: 2, backoffMs: 0 },
    );
    assert.equal(recovered.ok, true);
    assert.equal(recovered.attempts, 2);

    // Non-transient 403 stops immediately on attempt 1 without wasting retries
    let hardFailCalls = 0;
    const forbiddenFetch = async () => {
      hardFailCalls += 1;
      return {
        status: 403,
        headers: new Headers({ "content-type": "text/html" }),
        text: async () => "<html><title>Just a moment...</title></html>",
      };
    };
    const blocked = await probeSource(
      { source_id: "blocked-site", fetch_mode: "static_html", entry_url: "https://example.com/" },
      { fetchImpl: forbiddenFetch, maxRetries: 2, backoffMs: 0 },
    );
    assert.equal(blocked.ok, false);
    assert.equal(blocked.attempts, 1);
    assert.equal(hardFailCalls, 1);
  });
});
