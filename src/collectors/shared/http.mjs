const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 LexAIDailyBot/1.0";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchWithRetry(
  url,
  {
    fetchImpl = globalThis.fetch,
    timeoutMs = 15000,
    retries = 2,
    backoffBaseMs = 300,
    etag = undefined,
    headers = {},
    method = "GET",
    body = undefined,
  } = {},
) {
  const mergedHeaders = {
    "User-Agent": DEFAULT_USER_AGENT,
    Accept: "text/html,application/xhtml+xml,application/xml,application/json;q=0.9,*/*;q=0.8",
    "Accept-Encoding": "gzip, deflate",
    ...headers,
  };
  if (etag) {
    mergedHeaders["If-None-Match"] = etag;
  }

  let lastError = null;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      let response;
      try {
        response = await fetchImpl(url, {
          method,
          headers: mergedHeaders,
          body,
          signal: controller.signal,
          redirect: "follow",
        });
      } finally {
        clearTimeout(timer);
      }

      if (response.status === 304) {
        return {
          status: 304,
          ok: true,
          notModified: true,
          etag: response.headers?.get?.("etag") ?? etag ?? null,
          contentType: response.headers?.get?.("content-type") ?? "",
          finalUrl: response.url || url,
          buffer: new Uint8Array(),
        };
      }

      if (response.status >= 500 || response.status === 429) {
        lastError = new Error(`HTTP ${response.status} for ${url}`);
        if (attempt < retries) {
          await sleep(backoffBaseMs * 2 ** attempt);
          continue;
        }
      }

      const arrayBuffer = await response.arrayBuffer();
      return {
        status: response.status,
        ok: response.ok,
        notModified: false,
        etag: response.headers?.get?.("etag") ?? null,
        contentType: response.headers?.get?.("content-type") ?? "",
        finalUrl: response.url || url,
        buffer: new Uint8Array(arrayBuffer),
      };
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        await sleep(backoffBaseMs * 2 ** attempt);
      }
    }
  }
  throw lastError ?? new Error(`Failed to fetch ${url}`);
}
