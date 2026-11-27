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

export function extractArticleFromHtml(html, url = "https://example.com/") {
  const { document } = parseHTML(String(html ?? ""));
  if (!document.baseURI && url) {
    try {
      const baseEl = document.createElement("base");
      baseEl.setAttribute("href", url);
      document.head?.appendChild(baseEl);
    } catch {
      // Ignore if head unavailable
    }
  }

  const docTitle = normalizeWhitespace(document.title ?? "");
  let parsed = null;
  try {
    const reader = new Readability(document);
    parsed = reader.parse();
  } catch {
    parsed = null;
  }

  if (parsed && normalizeWhitespace(parsed.textContent).length >= 40) {
    return {
      title: normalizeWhitespace(parsed.title || docTitle),
      textContent: normalizeWhitespace(parsed.textContent),
      excerpt: normalizeWhitespace(parsed.excerpt || ""),
      byline: normalizeWhitespace(parsed.byline || ""),
    };
  }

  const mainNode =
    document.querySelector("article") ||
    document.querySelector("main") ||
    document.querySelector(".content, #content, .TRS_Editor") ||
    document.body;

  const fallbackText = normalizeWhitespace(mainNode?.textContent ?? "");
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
    const title = normalizeWhitespace(a.textContent);
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
    return {
      guid: entry.guid || entry.id || normalizedLink || "",
      title: normalizeWhitespace(entry.title || ""),
      link: normalizedLink,
      published_at:
        entry.isoDate || entry.pubDate || entry.updated || new Date().toISOString(),
      content: normalizeWhitespace(
        entry["content:encoded"] || entry.content || entry.contentSnippet || entry.summary || "",
      ),
    };
  });
  return {
    title: normalizeWhitespace(feed.title || ""),
    items: items.filter((item) => Boolean(item.link) && item.title.length >= 4),
  };
}
