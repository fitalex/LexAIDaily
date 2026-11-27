import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";
import Parser from "rss-parser";
import { isDomainAllowed, normalizeCandidateUrl } from "./url-and-domain.mjs";

const rssParser = new Parser({
  customFields: {
    item: ["id", "updated", "summary"],
  },
});

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

export function stripHtmlToPlainText(input) {
  const raw = String(input ?? "");
  if (!raw) return "";
  if (!/[<>]/.test(raw)) {
    return normalizeWhitespace(raw);
  }
  const { document } = parseHTML(`<!DOCTYPE html><html><body>${raw}</body></html>`);
  for (const el of document.querySelectorAll("script, style, noscript, iframe, object, embed, svg")) {
    el.remove();
  }
  const text = document.body?.textContent ?? "";
  return normalizeWhitespace(text.replace(/<[^>]*>/g, " "));
}

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

function parseDateToken(raw) {
  const str = String(raw ?? "").trim();
  if (!str) return null;
  if (/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(str)) {
    return str;
  }
  if (/^\d{4}-(0[1-9]|1[0-2])$/.test(str)) {
    return str;
  }
  const parsed = new Date(str);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString();
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
    const normalized = normalizeCandidateUrl(href, baseUrl);
    if (!normalized) {
      continue;
    }
    if (normalized === normalizeCandidateUrl(baseUrl)) {
      continue;
    }
    if (expectedDomain && !isDomainAllowed(normalized, expectedDomain)) {
      continue;
    }
    if (seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    results.push({ url: normalized, title });
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
    const normalizedLink = normalizeCandidateUrl(rawLink, baseUrl);
    const rawContent =
      entry["content:encoded"] || entry.content || entry.contentSnippet || entry.summary || "";
    return {
      guid: entry.guid || entry.id || normalizedLink || "",
      title: stripHtmlToPlainText(entry.title || ""),
      link: normalizedLink,
      published_at: entry.isoDate || entry.pubDate || entry.updated || null,
      content: stripHtmlToPlainText(rawContent),
    };
  });
  return {
    title: stripHtmlToPlainText(feed.title || ""),
    items: items.filter((item) => Boolean(item.link) && item.title.length >= 4),
  };
}
