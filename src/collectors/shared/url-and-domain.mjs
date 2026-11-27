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
 * R2-SP05: Resolves relative URLs against baseUrl and normalizes tracking params/fragments.
 * - Pass `{ preserveHttp: true }` when fetching so http-only sites are not forced to https.
 * - Default (`preserveHttp: false`) yields canonical `https://` URLs required by frozen CandidateItem schema.
 */
export function normalizeCandidateUrl(rawUrl, baseUrl = undefined, { preserveHttp = false } = {}) {
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
  if (!preserveHttp && resolved.protocol === "http:") {
    resolved.protocol = "https:";
  }
  try {
    return normalizeUrl(resolved.toString(), {
      defaultProtocol: preserveHttp ? "http" : "https",
      forceHttps: !preserveHttp,
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
