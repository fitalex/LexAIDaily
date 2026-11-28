import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";
import Parser from "rss-parser";
import { isDomainAllowed, normalizeCandidateUrl } from "./url-and-domain.mjs";

const rssParser = new Parser({
  customFields: {
    item: ["id", "updated", "summary"],
  },
});

const HTML_TAG_RE = /<\/?[a-zA-Z][a-zA-Z0-9-]*(?:\s[^<>]*)?\/?>|<!DOCTYPE\b|<!--/i;
const HTML_ENTITY_RE = /&(?:lt|gt|amp|quot|apos|nbsp|#\d+|#x[0-9a-f]+);/i;

export function decodeResponseBuffer(buffer, contentType = "") {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const ctLower = String(contentType ?? "").toLowerCase();

  let charset = "";
  const ctMatch = ctLower.match(/charset\s*=\s*["']?([a-z0-9_-]+)/i);
  if (ctMatch) {
    charset = ctMatch[1].toLowerCase();
  }

  if (!charset) {
    const asciiHead = new TextDecoder("latin1").decode(bytes.subarray(0, 4096));
    const metaMatch = asciiHead.match(/charset\s*=\s*["']?([a-z0-9_-]+)/i);
    if (metaMatch) {
      charset = metaMatch[1].toLowerCase();
    }
  }

  if (charset === "gbk" || charset === "gb2312" || charset === "gb18030") {
    return new TextDecoder("gb18030", { fatal: false }).decode(bytes);
  }
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}

function normalizeWhitespace(text) {
  return String(text ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function decodeBasicEntities(str) {
  return str
    .replace(/&nbsp;/gi, " ")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&amp;/gi, "&");
}

/**
 * ST01 (S1) + R2-ST03 + G2-04-R2: Strips actual HTML markup (including entity-encoded
 * payloads such as `&lt;script&gt;`) and dangerous elements into clean plain text while
 * preserving plain-text comparison operators like "3 < 5 且 7 > 2" and "条款 <100万元> 适用".
 */
export function stripHtmlToPlainText(input) {
  const raw = String(input ?? "");
  if (!raw) return "";
  let current = raw;
  for (let pass = 0; pass < 2; pass += 1) {
    if (!HTML_ENTITY_RE.test(current)) break;
    current = decodeBasicEntities(current);
  }
  if (!HTML_TAG_RE.test(current)) {
    return normalizeWhitespace(current);
  }
  const { document } = parseHTML(`<!DOCTYPE html><html><body>${current}</body></html>`);
  for (const el of document.querySelectorAll("script, style, noscript, iframe, object, embed, svg")) {
    el.remove();
  }
  const text = document.body?.textContent ?? "";
  return normalizeWhitespace(text.replace(HTML_TAG_RE, " "));
}

export function formatCalendarDateInTz(isoOrDate, timeZone = process.env.TZ || "Asia/Shanghai") {
  const dt = isoOrDate instanceof Date ? isoOrDate : new Date(isoOrDate);
  const safeDate = Number.isNaN(dt.getTime()) ? new Date() : dt;
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(safeDate);
  } catch {
    return safeDate.toISOString().slice(0, 10);
  }
}

/**
 * R2-SP01 + R3-SP02: Parses date tokens into target-timezone calendar date YYYY-MM-DD (or YYYY-MM)
 * without shifting timezone-naive or offset-bearing datetimes backward by one day.
 */
export function parseDateToken(raw, timeZone = process.env.TZ || "Asia/Shanghai") {
  const str = String(raw ?? "").trim();
  if (!str) return null;
  if (/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(str)) {
    return str;
  }
  if (/^\d{4}-(0[1-9]|1[0-2])$/.test(str)) {
    return str;
  }
  // Timezone-naive ISO datetime: preserve the literal calendar date YYYY-MM-DD
  const naiveMatch = str.match(
    /^(\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01]))[T\s]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/,
  );
  if (naiveMatch) {
    return naiveMatch[1];
  }
  const parsed = new Date(str);
  if (!Number.isNaN(parsed.getTime())) {
    return formatCalendarDateInTz(parsed, timeZone);
  }
  return null;
}

/**
 * SP05: Extracts real publication date (YYYY-MM-DD or ISO-8601) from HTML meta/time tags or visible header text.
 * Returns null if no verifiable publication date is found.
 */
export function extractPublishedDateFromHtml(html) {
  const { document } = parseHTML(String(html ?? ""));
  const metaSelectors = [
    'meta[property="article:published_time"]',
    'meta[name="publishdate"]',
    'meta[name="PubDate"]',
    'meta[name="pubdate"]',
    'meta[name="date"]',
    'meta[name="DC.date.issued"]',
    'meta[itemprop="datePublished"]',
  ];

  for (const sel of metaSelectors) {
    const val = document.querySelector(sel)?.getAttribute("content")?.trim();
    if (val) {
      const normalized = parseDateToken(val);
      if (normalized) return normalized;
    }
  }

  const timeEl = document.querySelector("time[datetime]");
  if (timeEl) {
    const normalized = parseDateToken(timeEl.getAttribute("datetime"));
    if (normalized) return normalized;
  }

  const headText = normalizeWhitespace(document.body?.textContent ?? "").slice(0, 1200);
  const zhMatch = headText.match(/(20\d{2})\s*年\s*(0?[1-9]|1[0-2])\s*月\s*(0?[1-9]|[12]\d|3[01])\s*日/);
  if (zhMatch) {
    const [, y, m, d] = zhMatch;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  const isoMatch = headText.match(/\b(20\d{2})[-/.](0[1-9]|1[0-2])[-/.](0[1-9]|[12]\d|3[01])\b/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return `${y}-${m}-${d}`;
  }
  return null;
}

export function extractArticleFromHtml(html, url = "https://example.com/") {
  const { document } = parseHTML(String(html ?? ""));
  for (const el of document.querySelectorAll("script, style, noscript, iframe")) {
    el.remove();
  }
  if (!document.baseURI && url) {
    try {
      const baseEl = document.createElement("base");
      baseEl.setAttribute("href", url);
      document.head?.appendChild(baseEl);
    } catch {
      // Ignore if head unavailable
    }
  }

  const docTitle = stripHtmlToPlainText(document.title ?? "");
  let parsed = null;
  try {
    const reader = new Readability(document);
    parsed = reader.parse();
  } catch {
    parsed = null;
  }

  if (parsed && stripHtmlToPlainText(parsed.textContent).length >= 40) {
    return {
      title: stripHtmlToPlainText(parsed.title || docTitle),
      textContent: stripHtmlToPlainText(parsed.textContent),
      excerpt: stripHtmlToPlainText(parsed.excerpt || ""),
      byline: stripHtmlToPlainText(parsed.byline || ""),
    };
  }

  const mainNode =
    document.querySelector("article") ||
    document.querySelector("main") ||
    document.querySelector(".content, #content, .TRS_Editor") ||
    document.body;

  const fallbackText = stripHtmlToPlainText(mainNode?.textContent ?? "");
  return {
    title: docTitle || "Untitled",
    textContent: fallbackText,
    excerpt: fallbackText.slice(0, 160),
    byline: "",
  };
}

export function extractLinksFromListHtml(html, baseUrl, expectedDomain, maxLinks = 8) {
  const { document } = parseHTML(String(html ?? ""));
  const anchors = Array.from(document.querySelectorAll("a[href]"));
  const seen = new Set();
  const results = [];

  for (const a of anchors) {
    const href = a.getAttribute("href");
    const title = stripHtmlToPlainText(a.textContent);
    if (!href || title.length < 6) {
      continue;
    }
    const fetchUrl = normalizeCandidateUrl(href, baseUrl, { preserveHttp: true });
    const canonicalUrl = normalizeCandidateUrl(href, baseUrl);
    if (!fetchUrl || !canonicalUrl) {
      continue;
    }
    if (canonicalUrl === normalizeCandidateUrl(baseUrl)) {
      continue;
    }
    if (expectedDomain && !isDomainAllowed(fetchUrl, expectedDomain)) {
      continue;
    }
    if (seen.has(canonicalUrl)) {
      continue;
    }
    seen.add(canonicalUrl);
    results.push({ url: fetchUrl, canonicalUrl, title });
    if (results.length >= maxLinks) {
      break;
    }
  }
  return results;
}

export async function parseFeedXml(xmlString, baseUrl = undefined) {
  const feed = await rssParser.parseString(String(xmlString ?? ""));
  const items = (feed.items ?? []).map((entry) => {
    const rawLink = entry.link || entry.guid || "";
    const fetchLink = normalizeCandidateUrl(rawLink, baseUrl, { preserveHttp: true });
    const rawContent =
      entry["content:encoded"] || entry.content || entry.contentSnippet || entry.summary || "";
    return {
      guid: entry.guid || entry.id || fetchLink || "",
      title: stripHtmlToPlainText(entry.title || ""),
      link: fetchLink,
      published_at: entry.isoDate || entry.pubDate || entry.updated || null,
      content: stripHtmlToPlainText(rawContent),
    };
  });
  return {
    title: stripHtmlToPlainText(feed.title || ""),
    items: items.filter((item) => Boolean(item.link) && item.title.length >= 4),
  };
}
