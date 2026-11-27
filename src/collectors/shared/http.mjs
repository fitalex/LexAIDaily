import http from "node:http";
import https from "node:https";
import tls from "node:tls";
import zlib from "node:zlib";

const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 LexAIDailyBot/1.0";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isNoProxyMatch(hostname, noProxyStr) {
  if (!noProxyStr) return false;
  const host = String(hostname ?? "").toLowerCase();
  const entries = String(noProxyStr)
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  for (const entry of entries) {
    if (entry === "*") return true;
    const clean = entry.replace(/^\./, "");
    if (host === clean || host.endsWith(`.${clean}`)) return true;
  }
  return false;
}

/**
 * R2-ST02: Pure Node.js built-in proxy resolver (zero undeclared dependencies).
 * Returns the proxy URL string for the target URL if HTTP_PROXY / HTTPS_PROXY applies, else null.
 */
export function resolveProxyUrl(targetUrl, env = process.env) {
  let parsed;
  try {
    parsed = new URL(targetUrl);
  } catch {
    return null;
  }
  const noProxy = env?.NO_PROXY || env?.no_proxy || "";
  if (isNoProxyMatch(parsed.hostname, noProxy)) {
    return null;
  }
  const rawProxy =
    parsed.protocol === "https:"
      ? env?.HTTPS_PROXY || env?.https_proxy || env?.HTTP_PROXY || env?.http_proxy || ""
      : env?.HTTP_PROXY || env?.http_proxy || "";
  return rawProxy.trim() || null;
}

function decompressBuffer(rawBuf, contentEncoding = "") {
  const enc = String(contentEncoding ?? "").toLowerCase().trim();
  try {
    if (enc === "gzip" || enc === "x-gzip") {
      return new Uint8Array(zlib.gunzipSync(rawBuf));
    }
    if (enc === "deflate") {
      return new Uint8Array(zlib.inflateSync(rawBuf));
    }
    if (enc === "br") {
      return new Uint8Array(zlib.brotliDecompressSync(rawBuf));
    }
  } catch {
    // Fall back to raw bytes if server sent uncompressed payload with encoding header
  }
  return new Uint8Array(rawBuf);
}

function requestViaHttpProxy(targetUrl, proxyUrl, { method, headers, body, timeoutMs }) {
  return new Promise((resolve, reject) => {
    const target = new URL(targetUrl);
    const proxy = new URL(proxyUrl);
    const proxyAuth =
      proxy.username || proxy.password
        ? `Basic ${Buffer.from(`${decodeURIComponent(proxy.username)}:${decodeURIComponent(proxy.password)}`).toString("base64")}`
        : null;

    const finalizeResponse = (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const rawBuf = Buffer.concat(chunks);
        const status = res.statusCode ?? 0;
        const encoding = res.headers["content-encoding"] || "";
        const buffer = status === 304 ? new Uint8Array() : decompressBuffer(rawBuf, encoding);
        resolve({
          status,
          ok: status >= 200 && status < 300,
          notModified: status === 304,
          etag: res.headers.etag ?? null,
          contentType: res.headers["content-type"] ?? "",
          finalUrl: targetUrl,
          buffer,
        });
      });
      res.on("error", reject);
    };

    if (target.protocol === "http:") {
      const reqHeaders = { ...headers, Host: target.host };
      if (proxyAuth) reqHeaders["Proxy-Authorization"] = proxyAuth;
      const req = http.request(
        {
          host: proxy.hostname,
          port: Number(proxy.port) || 80,
          method,
          path: target.toString(),
          headers: reqHeaders,
          timeout: timeoutMs,
        },
        finalizeResponse,
      );
      req.on("timeout", () => req.destroy(new Error(`Proxy request timeout for ${targetUrl}`)));
      req.on("error", reject);
      if (body) req.write(body);
      req.end();
      return;
    }

    // HTTPS target via HTTP CONNECT tunnel
    const connectHeaders = { Host: `${target.hostname}:${target.port || 443}` };
    if (proxyAuth) connectHeaders["Proxy-Authorization"] = proxyAuth;
    const connectReq = http.request({
      host: proxy.hostname,
      port: Number(proxy.port) || 80,
      method: "CONNECT",
      path: `${target.hostname}:${target.port || 443}`,
      headers: connectHeaders,
      timeout: timeoutMs,
    });
    connectReq.on("timeout", () =>
      connectReq.destroy(new Error(`Proxy CONNECT timeout for ${targetUrl}`)),
    );
    connectReq.on("error", reject);
    connectReq.on("connect", (connectRes, socket) => {
      if (connectRes.statusCode !== 200) {
        socket.destroy();
        reject(new Error(`Proxy CONNECT failed with HTTP ${connectRes.statusCode}`));
        return;
      }
      const tlsSocket = tls.connect({ socket, servername: target.hostname });
      const httpsReq = https.request(
        {
          hostname: target.hostname,
          port: Number(target.port) || 443,
          path: `${target.pathname}${target.search}`,
          method,
          headers: { ...headers, Host: target.host },
          createConnection: () => tlsSocket,
          timeout: timeoutMs,
        },
        finalizeResponse,
      );
      httpsReq.on("timeout", () =>
        httpsReq.destroy(new Error(`Proxy HTTPS timeout for ${targetUrl}`)),
      );
      httpsReq.on("error", reject);
      if (body) httpsReq.write(body);
      httpsReq.end();
    });
    connectReq.end();
  });
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
    useEnvProxy = false,
    env = process.env,
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

  const proxyUrl =
    useEnvProxy && fetchImpl === globalThis.fetch ? resolveProxyUrl(url, env) : null;

  let lastError = null;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      let result;
      if (proxyUrl) {
        result = await requestViaHttpProxy(url, proxyUrl, {
          method,
          headers: mergedHeaders,
          body,
          timeoutMs,
        });
      } else {
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

        const arrayBuffer = await response.arrayBuffer();
        result = {
          status: response.status,
          ok: response.ok,
          notModified: false,
          etag: response.headers?.get?.("etag") ?? null,
          contentType: response.headers?.get?.("content-type") ?? "",
          finalUrl: response.url || url,
          buffer: new Uint8Array(arrayBuffer),
        };
      }

      if (result.notModified) {
        return {
          ...result,
          etag: result.etag ?? etag ?? null,
        };
      }

      if (result.status >= 500 || result.status === 429) {
        lastError = new Error(`HTTP ${result.status} for ${url}`);
        if (attempt < retries) {
          await sleep(backoffBaseMs * 2 ** attempt);
          continue;
        }
      }

      return result;
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        await sleep(backoffBaseMs * 2 ** attempt);
      }
    }
  }
  throw lastError ?? new Error(`Failed to fetch ${url}`);
}
