import normalizeUrl from "normalize-url";
import { DISCOVERY_ONLY_DOMAINS } from "../../contracts/validate.mjs";

const TRACKING_QUERY_PATTERNS = [
  /^utm_\w+/i,
  /^spm$/i,
  /^from$/i,
  /^isappinstalled$/i,
  /^fbclid$/i,
  /^gclid$/i,
  /^ref$/i,
];

export function isDiscoveryOnlyHost(hostname) {
  const lower = String(hostname ?? "").toLowerCase();
  return DISCOVERY_ONLY_DOMAINS.some(
    (domain) => lower === domain || lower.endsWith(`.${domain}`),
  );
}

export function isDiscoveryOnlyUrl(urlString) {
  try {
    const parsed = new URL(urlString);
    return isDiscoveryOnlyHost(parsed.hostname);
  } catch {
    return false;
  }
}

/**
 * Resolves relative URLs against baseUrl, normalizes tracking params/fragments,
 * and ensures an HTTPS canonical URL suitable for CandidateItem.source_url.
 */
export function normalizeCandidateUrl(rawUrl, baseUrl = undefined) {
  if (!rawUrl || typeof rawUrl !== "string") {
    return null;
  }
  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed.startsWith("javascript:") || trimmed.startsWith("mailto:")) {
    return null;
  }
  let resolved;
  try {
    resolved = baseUrl ? new URL(trimmed, baseUrl) : new URL(trimmed);
  } catch {
    return null;
  }
  if (resolved.protocol !== "http:" && resolved.protocol !== "https:") {
    return null;
  }
  if (resolved.protocol === "http:") {
    resolved.protocol = "https:";
  }
  try {
    return normalizeUrl(resolved.toString(), {
      defaultProtocol: "https",
      forceHttps: true,
      stripHash: true,
      stripWWW: false,
      removeTrailingSlash: true,
      sortQueryParameters: true,
      removeQueryParameters: TRACKING_QUERY_PATTERNS,
    });
  } catch {
    return resolved.toString();
  }
}

/**
 * Anti-hijacking domain check against whitelist expected_domain.
 */
export function isDomainAllowed(urlString, expectedDomain) {
  if (!urlString || !expectedDomain) {
    return false;
  }
  try {
    const host = new URL(urlString).hostname.toLowerCase();
    const expected = expectedDomain.toLowerCase().trim();
    return host === expected || host.endsWith(`.${expected}`);
  } catch {
    return false;
  }
}

export function extractDomain(urlString) {
  try {
    return new URL(urlString).hostname.toLowerCase();
  } catch {
    return "";
  }
}
