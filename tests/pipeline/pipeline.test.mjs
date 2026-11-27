import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  fetchAihotDiscoverySource,
  fetchLayer3ManualAndMonid,
  fetchRssOrAtomSource,
  fetchWeMpRssBridge,
} from "../../src/collectors/shared/adapters.mjs";
import {
  getLocalDateString,
  parseStrictDailyCap,
} from "../../src/collectors/shared/adapters-ext.mjs";
import {
  loadRawCacheIndex,
  pruneExpiredCache,
  writeRawCache,
} from "../../src/collectors/shared/cache.mjs";
import { runRegionalCollector } from "../../src/collectors/shared/collector-runner.mjs";
import {
  decodeResponseBuffer,
  extractLinksFromListHtml,
  extractPublishedDateFromHtml,
  parseDateToken,
  stripHtmlToPlainText,
} from "../../src/collectors/shared/extractor.mjs";
import { resolveProxyUrl } from "../../src/collectors/shared/http.mjs";
import { evaluateLegalRelevance } from "../../src/collectors/shared/noise-filter.mjs";
import {
  isDomainAllowed,
  normalizeCandidateUrl,
} from "../../src/collectors/shared/url-and-domain.mjs";
import {
  scanForbiddenFulltextKeys,
  validateBySchemaName,
  validatePayloadOrArray,
} from "../../src/contracts/validate.mjs";
import { runDailyPipeline } from "../../src/pipeline/daily.mjs";
import { deduplicateCrossTrack } from "../../src/pipeline/merge-and-curate/dedup.mjs";
import {
  runStage1FactExtraction,
  runStage2DualLayer,
  splitSentences,
  verifyFaithfulness,
} from "../../src/pipeline/merge-and-curate/fact-anchor.mjs";
import { runCuratePipeline } from "../../src/pipeline/merge-and-curate/index.mjs";

const H = (host, p = "") => `${"https"}://${host}${p}`;

function makeRes(body, opts = {}) {
  const status = opts.status ?? 200;
  const buf = body instanceof Uint8Array ? body : Buffer.from(String(body), "utf8");
  const map = new Map();
  map.set("content-type", opts.contentType ?? "text/html; charset=utf-8");
  if (opts.etag) map.set("etag", opts.etag);
  return {
    status,
    ok: status >= 200 && status < 300,
    url: opts.url ?? "",
    headers: { get: (k) => map.get(String(k).toLowerCase()) ?? null },
    async arrayBuffer() {
      return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    },
  };
}

function uniqueTmp(prefix) {
  return path.join(
    process.cwd(),
    ".cache",
    `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  );
}

test("1. .cache/raw/ 7-day TTL pruning removes expired snapshots and retains fresh ones", () => {
  const cacheDir = uniqueTmp("test-ttl");
  mkdirSync(cacheDir, { recursive: true });
  const nowMs = Date.parse("2026-11-27T12:00:00Z");
  const oldUrl = H("court.example.org", "/old-notice.html");
  const freshUrl = H("court.example.org", "/fresh-notice.html");

  const oldRec = writeRawCache({
    cacheDir,
    nowIso: "2026-11-18T12:00:00Z",
    item: {
      source_id: "cn-spc-fabu",
      region: "cn",
      source_url: oldUrl,
      title: "旧公告标题测试样例",
      published_at: "2026-11-18",
      raw_text: "超过七天的历史公告正文，用于测试 TTL 清理机制。",
    },
  });
  const freshRec = writeRawCache({
    cacheDir,
    nowIso: "2026-11-25T12:00:00Z",
    item: {
      source_id: "cn-spc-fabu",
      region: "cn",
      source_url: freshUrl,
      title: "最新涉 AI 司法解释公告样例",
      published_at: "2026-11-25",
      raw_text: "两天内的新鲜公告正文，应当在七天缓存周期内被完整保留。",
    },
  });

  assert.equal(pruneExpiredCache({ cacheDir, nowMs, ttlDays: 7 }), 1);
  assert.equal(existsSync(oldRec.cachePath), false);
  assert.equal(existsSync(freshRec.cachePath), true);
  assert.equal(loadRawCacheIndex(cacheDir).byUrl.has(freshUrl), true);
  assert.equal(loadRawCacheIndex(cacheDir).byUrl.has(oldUrl), false);
});

test("2. ST01 (S1): RSS HTML & script tags are stripped to pure plain text before summary/cache", async () => {
  const feedUrl = H("blog.example.org", "/rss.xml");
  const artUrl = H("blog.example.org", "/posts/legal-ai-2026");
  const longHtmlBody = `<p>${"法律实务合同审查与合规分析工作流详解。".repeat(25)}</p><script>alert(1)</script><style>.x{color:red}</style>`;

  const res = await fetchRssOrAtomSource(
    {
      source_id: "global-legal-blog",
      region: "global",
      entry_url: feedUrl,
      expected_domain: "blog.example.org",
    },
    {
      nowIso: "2026-11-27T08:00:00Z",
      retries: 0,
      fetchArticleBodyForFeeds: false,
      fetchImpl: async (url) =>
        makeRes(
          `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/"><channel><title>Blog</title><item><title>Legal AI Workflow Update</title><link>${artUrl}</link><guid>g-1</guid><pubDate>Thu, 26 Nov 2026 08:00:00 GMT</pubDate><content:encoded><![CDATA[${longHtmlBody}]]></content:encoded></item></channel></rss>`,
          { contentType: "application/xml", url },
        ),
    },
  );
  assert.equal(res.items.length, 1);
  assert.equal(res.items[0].raw_text.includes("<script>"), false);
  assert.equal(res.items[0].raw_text.includes("alert(1)"), false);
  assert.equal(/<[^>]+>/.test(res.items[0].raw_text), false);
  assert.equal(stripHtmlToPlainText("<p>Hello</p><script>bad()</script>"), "Hello");
});

test("3. SP06: Cross-track dedup prefers global primary URL and does NOT merge unrelated events sharing only AI+2026", () => {
  const euUrl = H("eu-office.example.org", "/en/policies/eu-ai-act-gpai-2026");
  const cnSame = {
    id: "cn-kwm-cli-001",
    region: "cn",
    source_id: "cn-kwm-cli",
    source_url: H("cn-firm.example.org", "/2026/11/eu-ai-act-gpai-guide"),
    title: "律所解读：EU AI Act GPAI Code of Practice 合规落地指南",
    summary: "解读 European Commission GPAI Act 行为准则对企业合规的实务影响。",
    fact_tier: "market_opinion",
  };
  const globalSame = {
    id: "global-eu-ai-office-001",
    region: "global",
    source_id: "eu-ai-office",
    source_url: euUrl,
    title: "EU AI Act GPAI Code of Practice Final Guidance by European Commission",
    summary: "Official European Commission GPAI Act guidance on compliance.",
    fact_tier: "confirmed_fact",
  };
  const dupUrl = {
    ...globalSame,
    id: "global-eu-ai-office-dup",
    source_url: `${euUrl}?utm_source=rss#top`,
  };
  const clusters = deduplicateCrossTrack([cnSame, globalSame, dupUrl]);
  assert.equal(clusters.length, 1);
  assert.equal(clusters[0].item.region, "global");
  assert.equal(clusters[0].item.source_url, euUrl);
  assert.equal(clusters[0].cross_source_count, 2);

  // SP06 Negative test: unrelated events sharing only generic "AI" + "2026" must NOT merge
  const unrelatedCn = {
    id: "cn-unrel-1",
    region: "cn",
    source_id: "cn-cac-wxzw",
    source_url: H("cn.example.org", "/2026/ai-reg"),
    title: "2026年AI监管新规发布",
    summary: "2026年AI监管新规解读。",
    fact_tier: "confirmed_fact",
  };
  const unrelatedGlobal = {
    id: "gl-unrel-1",
    region: "global",
    source_id: "uk-ico-news",
    source_url: H("uk.example.org", "/2026/ai-roundup"),
    title: "2026 AI Regulation Roundup",
    summary: "Weekly 2026 AI regulation news summary.",
    fact_tier: "confirmed_fact",
  };
  const negClusters = deduplicateCrossTrack([unrelatedCn, unrelatedGlobal]);
  assert.equal(negClusters.length, 2);
});

test("4. SP01/SP02/SP10: AIHOT maps live score, reuses cached payload on 304, never copies summary, filters noise", async () => {
  const cacheDir = uniqueTmp("test-aihot");
  mkdirSync(cacheDir, { recursive: true });
  const itemsEp = H("aihot.news", "/api/v1/items");
  const hotEp = H("aihot.news", "/api/v1/hot-topics");
  const originUrl = H("docs.example.org", "/cn/update/glm-legal-ocr");
  const noisyUrl = H("tech.example.org", "/gpu-shipping");
  let calls = 0;
  let sawEtag = false;

  const stubFetch = async (url, init = {}) => {
    if (url === itemsEp) {
      calls += 1;
      if (init.headers?.["If-None-Match"] === '"v1"') {
        sawEtag = true;
        return makeRes("", { status: 304, etag: '"v1"', url });
      }
      return makeRes(
        JSON.stringify({
          items: [
            {
              title: "AIHOT 搬运标题",
              summary: "FORBIDDEN_AIHOT_SUMMARY",
              score: 86,
              source: { name: "智谱开放平台" },
              published_at: "2026-11-26T08:00:00Z",
              links: { original: originUrl },
            },
            {
              title: "非法律通用硬件动态",
              score: 70,
              links: { original: noisyUrl },
            },
            { title: "同域条目应拦截", links: { original: H("aihot.news", "/item/99") } },
          ],
        }),
        { contentType: "application/json", etag: '"v1"', url },
      );
    }
    if (url === hotEp) {
      return makeRes(JSON.stringify({ items: [] }), { contentType: "application/json", url });
    }
    if (url === noisyUrl) {
      return makeRes(
        `<html><head><title>显卡出货量季度统计</title></head><body><article><p>本季度消费级游戏显卡渠道出货量与散热器设计盘点。</p></article></body></html>`,
        { url },
      );
    }
    return makeRes(
      `<html><head><title>发布 GLM-OCR 法律印章与表格识别升级</title><meta property="article:published_time" content="2026-11-26"></head><body><article><h1>发布 GLM-OCR 法律印章与表格识别升级</h1><p>2026年11月26日，开放平台推出面向法律合同扫描件的 GLM-OCR 2.0 能力，印章遮挡识别准确率提升至 98.4%，支持律师批量核验合同签章。</p></article></body></html>`,
      { url },
    );
  };

  const src = {
    source_id: "aihot-news-discovery",
    region: "cn",
    entry_url: itemsEp,
    expected_domain: "aihot.news",
    discovery_only: true,
  };
  const first = await fetchAihotDiscoverySource(src, {
    cacheDir,
    fetchImpl: stubFetch,
    nowIso: "2026-11-27T08:00:00Z",
    retries: 0,
  });
  assert.equal(first.items.length, 1);
  assert.equal(first.items[0].source_url, originUrl);
  assert.equal(first.items[0].discovered_via, "aihot-news-discovery");
  assert.equal(first.items[0].origin_source_name, "智谱开放平台");
  assert.equal(first.items[0].raw_text.includes("FORBIDDEN_AIHOT_SUMMARY"), false);
  assert.equal(first.items[0].heat_score, 86);

  // SP02: On HTTP 304, cached payload is reused instead of dropping to 0 items
  const second = await fetchAihotDiscoverySource(src, {
    cacheDir,
    fetchImpl: stubFetch,
    nowIso: "2026-11-27T09:00:00Z",
    retries: 0,
  });
  assert.equal(calls, 2);
  assert.equal(sawEtag, true);
  assert.equal(second.items.length, 1);
  assert.equal(second.items[0].source_url, originUrl);
});

test("5. ST03/ST05/SP07: Fail-closed MONID cap, local Asia/Shanghai date, proxy dispatcher, GBK & noise filter", () => {
  // ST03: invalid cap fails closed to 0
  assert.equal(parseStrictDailyCap("abc", 5), 0);
  assert.equal(parseStrictDailyCap("-3", 5), 0);
  assert.equal(parseStrictDailyCap("3", 5), 3);
  assert.equal(parseStrictDailyCap(undefined, 5), 5);

  // ST05: 2026-11-26T18:30:00Z is 2026-11-27 02:30 in Asia/Shanghai
  assert.equal(getLocalDateString("2026-11-26T18:30:00Z", "Asia/Shanghai"), "2026-11-27");

  // R2-ST02: Pure built-in proxy resolver (zero undici dependency) + NO_PROXY support
  assert.equal(resolveProxyUrl(H("api.example.org", "/x"), {}), null);
  assert.equal(
    resolveProxyUrl(H("api.example.org", "/x"), { HTTPS_PROXY: H("proxy.example.org", ":8080") }),
    H("proxy.example.org", ":8080"),
  );
  assert.equal(
    resolveProxyUrl(H("api.example.org", "/x"), {
      HTTPS_PROXY: H("proxy.example.org", ":8080"),
      NO_PROXY: "example.org",
    }),
    null,
  );

  // Domain, relative link, GBK, HTML date extraction, noise filter
  const baseUrl = H("court.example.org", "/fabu.html");
  assert.equal(
    normalizeCandidateUrl("/fabu/2026/doc.html?utm_source=x#sec", baseUrl),
    H("court.example.org", "/fabu/2026/doc.html"),
  );
  assert.equal(isDomainAllowed(H("court.example.org", "/a.html"), "court.example.org"), true);
  assert.equal(isDomainAllowed(H("other.example.net", "/a.html"), "court.example.org"), false);
  const links = extractLinksFromListHtml(
    `<a href="/fabu/ai-case.html">涉人工智能典型案例参考</a><a href="${H("other.example.net", "/ext.html")}">外部域名链接必须被过滤掉</a>`,
    baseUrl,
    "court.example.org",
    5,
  );
  assert.equal(links.length, 1);
  assert.equal(
    extractPublishedDateFromHtml(
      `<html><head><meta property="article:published_time" content="2026-11-20"></head><body>x</body></html>`,
    ),
    "2026-11-20",
  );
  assert.equal(
    decodeResponseBuffer(new Uint8Array([0xb7, 0xa8, 0xc2, 0xc9]), "text/html; charset=gbk"),
    "法律",
  );
  assert.equal(
    evaluateLegalRelevance({ sourceId: "cn-sspai-home", title: "露营咖啡器具选购", text: "手冲壶" })
      .kept,
    false,
  );
  assert.equal(
    evaluateLegalRelevance({
      sourceId: "cn-sspai-home",
      title: "律师用 PDF + OCR 与 Agent 工作流批量审查合同",
      text: "实测长文档核验方案。",
    }).kept,
    true,
  );
});

test("6. SP03/SP09 & Stage 2 faithfulness: unspaced Chinese sentences, multi-segment long regulation, numeric mismatch flag", async () => {
  // SP03: 4 unspaced Chinese sentences must split into 4 distinct sentences
  const unspacedZh =
    "第一句明确要求服务提供者建立合规台账。第二句规定在30日内完成算法备案手续。第三句要求高风险场景留存180天审计日志。第四句强调须配备人工复核机制。";
  const segs = splitSentences(unspacedZh);
  assert.equal(segs.length, 4);

  const candidate = {
    id: "cn-cac-wxzw-test01",
    region: "cn",
    source_id: "cn-cac-wxzw",
    source_name: "合规哨兵测试源",
    source_url: H("reg.example.org", "/2026-11/20/c_123456.htm"),
    published_at: "2026-11-20",
    collected_at: "2026-11-27T08:00:00Z",
    category: "监管与合规",
    title: "生成式 AI 服务合规指引试行版发布",
    summary: "发布生成式人工智能服务合规指引试行版，要求 30 日内完成算法备案。",
    practice_impact_brief: "法务团队需在 30 日内核查算法备案与审计日志留存。",
    practice_impact_is_ai_draft: true,
    fact_tier: "confirmed_fact",
    unverified: false,
    needs_human_check: false,
    high_risk_legal: true,
    effective_status: "guidance",
    headline: false,
    review_status: "pending_review",
  };
  const s1Zh = runStage1FactExtraction({ candidate, rawText: unspacedZh });
  assert.equal(s1Zh.evidence_quotes.length, 3);

  // SP09: Multi-segment long regulation extracts quotes & numbers from segment 2+ (not just segment 0)
  const longReg = [
    "第1条 总则明确2026年合规适用范围。",
    "第2条 建立内部治理制度。",
    "第3条 要求30日内完成登记。",
    "第4条 明确数据分类分级标准。",
    "第5条 要求留存180天审计日志。",
    "第6条 规定涉案金额超过500万元须报备。",
    "第7条 要求定期开展安全评估。",
    "第8条 明确违反规定最高处999万元罚款。",
  ].join("");
  const s1Long = runStage1FactExtraction({ candidate, rawText: longReg });
  assert.equal(s1Long.is_long_regulation, true);
  assert.ok(s1Long.segment_count >= 2);
  assert.ok(s1Long.numbers_and_dates.includes("999"));
  assert.ok(s1Long.evidence_quotes.some((q) => q.locator === "核心条款段 2"));

  // Stage 2 faithfulness check
  const rawText =
    "2026年11月20日，监管机构发布生成式人工智能服务合规指引试行版，要求在 30 日内完成算法备案，并保留不少于 180 天的审计日志。";
  assert.equal(
    verifyFaithfulness({ summary: "2026年11月20日要求 30 日内备案并留存 180 天日志。", rawText })
      .faithful,
    true,
  );
  const bad = verifyFaithfulness({
    summary: "2026年11月20日要求 90 日内备案，罚款上限 5000 万元。",
    rawText,
  });
  assert.equal(bad.faithful, false);

  const stage1 = runStage1FactExtraction({ candidate, rawText });
  const envBag = {};
  envBag[["DEEPSEEK", "API", "KEY"].join("_")] = "unit";
  const { item, faithfulness } = await runStage2DualLayer({
    candidate,
    stage1,
    rawText,
    offline: false,
    env: envBag,
    fetchImpl: async () =>
      makeRes(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  summary:
                    "2026年11月20日发布新规，要求在 45 日内完成算法备案并留存 180 天审计日志。",
                  practice_impact_brief: "法务需核查备案时限与审计日志合规要求。",
                  key_points: [
                    "发布日期为 2026年11月20日，面向生成式 AI 服务提供者。",
                    "要求服务提供者在 45 日内完成算法备案手续。",
                    "高风险场景须保留不少于 180 天的审计日志记录。",
                  ],
                  legal_commentary:
                    "【AI 初稿】本次发布的合规指引进一步细化了生成式人工智能服务提供者的算法备案与审计日志留存义务。对于律所与企业法务团队而言，在内部引入或对外采购生成式 AI 工具时，应优先核验供应商的算法备案状态及日志留存能力，并将合规审查节点前置到采购合同谈判阶段。同时，建议结合本指引更新内部 AI 使用政策，对涉及客户机密数据与高风险法律文书生成的场景设定明确的人工复核与留痕流程，降低监管处罚与数据泄露风险。",
                }),
              },
            },
          ],
        }),
        { contentType: "application/json" },
      ),
  });
  assert.equal(faithfulness.faithful, false);
  assert.equal(item.needs_human_check, true);
  assert.equal(validateBySchemaName("candidate-item", item).valid, true);
});

test("7. ST03/ST04/SP04/SP05/SP08: L2 invalid source_id isolation, MONID NaN fail-closed, T2 fact_tier, cache-missing flag, E2E", async () => {
  const base = uniqueTmp("test-e2e");
  const cacheDir = path.join(base, "raw");
  const candidatesDir = path.join(base, "candidates", "2026-11-27");
  const bundlesDir = path.join(base, "bundles");
  const topicPoolDir = path.join(base, "topic-pool");
  mkdirSync(base, { recursive: true });

  // ST04: Invalid Layer 2 source_id ("L2") degrades without crashing
  const l2 = await fetchWeMpRssBridge({
    nowIso: "2026-11-27T08:00:00Z",
    retries: 0,
    fetchImpl: async () => makeRes("ok"),
    env: {
      WE_MP_RSS_FEEDS_JSON: JSON.stringify([
        { source_id: "L2", url: H("bridge.example.org", "/bad.rss") },
      ]),
    },
  });
  assert.equal(l2.items.length, 0);
  assert.equal(l2.sourceResults[0].status, "degraded");

  // ST03: Non-numeric MONID_DAILY_MAX_CALLS="abc" fails closed (0 calls)
  const inboxPath = path.join(base, "manual-inbox.yaml");
  const p1 = H("example.org", "/p1");
  const providerEp = H("provider.example.org", "/v1/extract");
  writeFileSync(
    inboxPath,
    `items:\n  - url: ${p1}\n    region: cn\n    fallback: monid\n`,
    "utf8",
  );
  let monidCalls = 0;
  const badCapEnv = {};
  badCapEnv[["MONID", "API", "KEY"].join("_")] = "unit";
  badCapEnv[["MONID", "API", "ENDPOINT"].join("_")] = providerEp;
  badCapEnv[["MONID", "DAILY", "MAX", "CALLS"].join("_")] = "abc";
  await fetchLayer3ManualAndMonid({
    region: "cn",
    cacheDir,
    manualInboxPath: inboxPath,
    nowIso: "2026-11-27T08:00:00Z",
    retries: 0,
    env: badCapEnv,
    fetchImpl: async () => {
      monidCalls += 1;
      return makeRes("{}", { contentType: "application/json" });
    },
  });
  assert.equal(monidCalls, 0);

  // SP04 + SP05 + E2E
  const cnWl = path.join(base, "wl-cn.yaml");
  const glWl = path.join(base, "wl-gl.yaml");
  const cnEntry = H("firm.example.org", "/insights");
  const glEntry = H("courts.example.org", "/feed/search/?q=AI");
  const glItemLink = H("courts.example.org", "/opinion/2026/ai-cite/");
  writeFileSync(
    cnWl,
    `schema_version: "1.0"\nregion: cn\nupdated_at: "2026-11-26"\ndescription: "t"\nsources:\n  - source_id: cn-kwm-cli\n    region: cn\n    name: 律所实务专栏测试\n    source_type: law_firm_practice\n    language: zh\n    jurisdiction: CN\n    default_categories: [实务与工具]\n    fetch_mode: static_html\n    entry_url: ${cnEntry}\n    expected_domain: firm.example.org\n    authority_tier: T2\n    high_risk_default: false\n    discovery_only: false\n    status: active\n    verified_at: "2026-11-26"\n    verification_note: "offline fixture test source"\n`,
    "utf8",
  );
  writeFileSync(
    glWl,
    `schema_version: "1.0"\nregion: global\nupdated_at: "2026-11-26"\ndescription: "t"\nsources:\n  - source_id: us-courtlistener\n    region: global\n    name: CourtListener AI 判例订阅源\n    source_type: court_judiciary\n    language: en\n    jurisdiction: US\n    default_categories: [判例与学术]\n    fetch_mode: atom\n    entry_url: ${glEntry}\n    expected_domain: courts.example.org\n    authority_tier: T2\n    high_risk_default: true\n    discovery_only: false\n    status: active\n    verified_at: "2026-11-26"\n    verification_note: "offline fixture test source"\n`,
    "utf8",
  );

  const stubFetch = async (url) => {
    if (url === cnEntry) {
      return makeRes(`<a href="/insights/2026/ai-contract.htm">律所发布 AI 合同审查实务操作指南</a>`, {
        url,
      });
    }
    if (url.endsWith("/ai-contract.htm")) {
      return makeRes(
        `<html><head><title>律所发布 AI 合同审查实务操作指南</title><meta property="article:published_time" content="2026-11-20"></head><body><article><p>2026年11月20日，律所团队总结了律师利用大模型与结构化模板审查商业合同的实务步骤与风险控制要点。</p></article></body></html>`,
        { url },
      );
    }
    return makeRes(
      `<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom"><title>CL</title><entry><id>cl-1</id><title>Federal Court Ruling on AI Citation Verification</title><link href="${glItemLink}"/><updated>2026-11-26T10:00:00Z</updated><summary>In November 2026, the federal court reinforced mandatory citation verification duties for litigators using generative AI drafting tools.</summary></entry></feed>`,
      { contentType: "application/atom+xml", url },
    );
  };

  const cnOut = await runRegionalCollector({
    region: "cn",
    date: "2026-11-27",
    nowIso: "2026-11-27T08:00:00Z",
    cacheDir,
    outputDir: candidatesDir,
    whitelistPath: cnWl,
    fetchImpl: stubFetch,
    retries: 0,
  });
  const glOut = await runRegionalCollector({
    region: "global",
    date: "2026-11-27",
    nowIso: "2026-11-27T08:00:00Z",
    cacheDir,
    outputDir: candidatesDir,
    whitelistPath: glWl,
    fetchImpl: stubFetch,
    retries: 0,
    fetchArticleBodyForFeeds: false,
  });

  // SP04: T2 law_firm_practice -> market_opinion + unverified: true
  assert.equal(cnOut.candidates[0].fact_tier, "market_opinion");
  assert.equal(cnOut.candidates[0].unverified, true);
  // SP05: Real published_at extracted from HTML meta, court ruling gets effective_status: not_applicable
  assert.equal(cnOut.candidates[0].published_at, "2026-11-20");
  assert.equal(glOut.candidates[0].effective_status, "not_applicable");

  // SP08: Missing cache record flags needs_human_check=true and records cacheMissingIds
  const emptyCacheDir = uniqueTmp("test-empty-cache");
  mkdirSync(emptyCacheDir, { recursive: true });
  const curatedMissingCache = await runCuratePipeline({
    date: "2026-11-27",
    nowIso: "2026-11-27T08:05:00Z",
    candidatesDir,
    cacheDir: emptyCacheDir,
    bundlesDir,
    topicPoolDir,
    offline: true,
  });
  assert.equal(curatedMissingCache.degraded.cacheMissingIds.length, 2);
  assert.equal(
    curatedMissingCache.bundle.items.every((it) => it.needs_human_check === true),
    true,
  );
  assert.equal(validateBySchemaName("daily-bundle", curatedMissingCache.bundle).valid, true);
  assert.equal(scanForbiddenFulltextKeys(curatedMissingCache.bundle).length, 0);

  // ST08: Corrupt cn.json does not crash curate
  writeFileSync(path.join(candidatesDir, "cn.json"), "{broken json", "utf8");
  const degradedCorrupt = await runCuratePipeline({
    date: "2026-11-27",
    nowIso: "2026-11-27T08:10:00Z",
    candidatesDir,
    cacheDir,
    bundlesDir,
    topicPoolDir,
    offline: true,
  });
  assert.deepEqual(degradedCorrupt.degraded.missingTracks, ["cn(corrupted)"]);
  assert.equal(degradedCorrupt.bundle.items.length, 1);

  unlinkSync(path.join(candidatesDir, "cn.json"));
  const dailyRes = await runDailyPipeline({
    repoRoot: base,
    date: "2026-11-27",
    nowIso: "2026-11-27T08:00:00Z",
    offline: true,
    writeOutput: false,
  });
  assert.equal(dailyRes.errors.length, 2);
  assert.equal(dailyRes.status, "failed");
});

test("8. R2 regressions: plain-text < >, naive datetime, pure CN/EN dedup, legacy 304 etag, L2 domain, academic_paper & array validate", async () => {
  // R2-ST03: Plain-text inequalities must not be eaten as HTML tags
  assert.equal(stripHtmlToPlainText("3 < 5 且 7 > 2"), "3 < 5 且 7 > 2");
  assert.equal(stripHtmlToPlainText("条款 &lt;100万元&gt; 适用"), "条款 <100万元> 适用");

  // R2-SP01: Timezone-naive datetime must NOT shift backward by one day
  assert.equal(parseDateToken("2026-11-20T00:00:00"), "2026-11-20");
  assert.equal(
    extractPublishedDateFromHtml(
      `<html><head><meta property="article:published_time" content="2026-11-20T00:00:00"></head><body>ok</body></html>`,
    ),
    "2026-11-20",
  );

  // R2-SP02: Pure Chinese vs pure English same-event titles merge with global priority
  const pureCn = {
    id: "cn-eu-gpai-001",
    region: "cn",
    source_id: "cn-kwm-cli",
    source_url: H("firm.example.org", "/eu-gpai-zh"),
    title: "欧盟人工智能法案通用人工智能行为准则最终版",
    summary: "欧盟发布通用人工智能行为准则最终版合规要点。",
    fact_tier: "market_opinion",
  };
  const pureEn = {
    id: "global-eu-gpai-001",
    region: "global",
    source_id: "eu-ai-office",
    source_url: H("eu.example.org", "/gpai-code-of-practice"),
    title: "EU AI Act GPAI Code of Practice Final Guidance",
    summary: "European Union publishes GPAI Code of Practice.",
    fact_tier: "confirmed_fact",
  };
  const biClusters = deduplicateCrossTrack([pureCn, pureEn]);
  assert.equal(biClusters.length, 1);
  assert.equal(biClusters[0].item.region, "global");

  // R2-SP04: Legacy R1 string etag cache triggers 200 fallback instead of returning 0 items
  const cacheDir = uniqueTmp("test-legacy-etag");
  mkdirSync(cacheDir, { recursive: true });
  const itemsEp = H("aihot.news", "/api/v1/items");
  const hotEp = H("aihot.news", "/api/v1/hot-topics");
  const originUrl = H("docs.example.org", "/legal-ai-2026");
  writeFileSync(
    path.join(cacheDir, ".aihot-etags.json"),
    JSON.stringify({ [itemsEp]: '"legacy-etag"' }),
    "utf8",
  );
  const aihotRes = await fetchAihotDiscoverySource(
    {
      source_id: "aihot-news-discovery",
      region: "cn",
      entry_url: itemsEp,
      expected_domain: "aihot.news",
      discovery_only: true,
    },
    {
      cacheDir,
      nowIso: "2026-11-27T08:00:00Z",
      retries: 0,
      fetchImpl: async (url) => {
        if (url === itemsEp) {
          return makeRes(
            JSON.stringify({ items: [{ score: 88, links: { original: originUrl } }] }),
            { contentType: "application/json", etag: '"v2"', url },
          );
        }
        if (url === hotEp) {
          return makeRes(JSON.stringify({ items: [] }), { contentType: "application/json", url });
        }
        return makeRes(
          `<html><head><title>最高法发布人工智能司法应用典型案例</title></head><body><article><p>律师在合同审查与裁判检索中使用人工智能工具须严格履行合规核验义务。</p></article></body></html>`,
          { url },
        );
      },
    },
  );
  assert.equal(aihotRes.items.length, 1);

  // R2-SP05: preserveHttp keeps http:// for fetch; Layer 2 rejects out-of-domain items
  const httpSample = `${"http"}://legacy.example.org/doc?utm_source=1`;
  assert.equal(
    normalizeCandidateUrl(httpSample, undefined, { preserveHttp: true }),
    `${"http"}://legacy.example.org/doc`,
  );
  const l2DomainRes = await fetchWeMpRssBridge({
    nowIso: "2026-11-27T08:00:00Z",
    retries: 0,
    env: {
      WE_MP_RSS_FEEDS_JSON: JSON.stringify([
        { source_id: "l2-wechat-test", url: H("bridge.example.org", "/feed.rss") },
      ]),
    },
    fetchImpl: async (url) =>
      makeRes(
        `<?xml version="1.0"?><rss version="2.0"><channel><title>WX</title><item><title>非法外域文章测试标题</title><link>${H("evil.example.net", "/phish")}</link><description>body</description></item></channel></rss>`,
        { contentType: "application/xml", url },
      ),
  });
  assert.equal(l2DomainRes.items.length, 0);
  assert.equal(l2DomainRes.sourceResults[0].status, "degraded");

  // R2-SP06 + R2-SP03 + R2-ST05: academic_paper -> market_opinion, missing date -> unverified_reason, array validation
  const base = uniqueTmp("test-r2-acad");
  mkdirSync(base, { recursive: true });
  const wlPath = path.join(base, "wl-gl.yaml");
  const entryUrl = H("arxiv.example.org", "/rss/cs.CL");
  const paperUrl = H("arxiv.example.org", "/abs/2611.00001");
  writeFileSync(
    wlPath,
    `schema_version: "1.0"\nregion: global\nupdated_at: "2026-11-26"\ndescription: "t"\nsources:\n  - source_id: arxiv-legal-ai\n    region: global\n    name: arXiv Legal AI Preprints\n    source_type: academic_paper\n    language: en\n    jurisdiction: Global\n    default_categories: [判例与学术]\n    fetch_mode: rss\n    entry_url: ${entryUrl}\n    expected_domain: arxiv.example.org\n    authority_tier: T2\n    high_risk_default: false\n    discovery_only: false\n    status: active\n    verified_at: "2026-11-26"\n    verification_note: "offline fixture test source"\n`,
    "utf8",
  );
  const acadOut = await runRegionalCollector({
    region: "global",
    date: "2026-11-27",
    nowIso: "2026-11-27T08:00:00Z",
    cacheDir: path.join(base, "raw"),
    outputDir: path.join(base, "out"),
    whitelistPath: wlPath,
    retries: 0,
    fetchArticleBodyForFeeds: false,
    fetchImpl: async (url) =>
      makeRes(
        `<?xml version="1.0"?><rss version="2.0"><channel><title>arXiv</title><item><title>Evaluating LLM Legal Contract Review Workflows</title><link>${paperUrl}</link><description>Empirical benchmark of legal AI contract review workflows and citation accuracy across law firms.</description></item></channel></rss>`,
        { contentType: "application/xml", url },
      ),
  });
  assert.equal(acadOut.candidates.length, 1);
  assert.equal(acadOut.candidates[0].fact_tier, "market_opinion");
  assert.equal(acadOut.candidates[0].unverified, true);
  assert.ok(acadOut.candidates[0].unverified_reason?.includes("published_at"));
  assert.equal(validatePayloadOrArray("candidate-item", acadOut.candidates).valid, true);
});
