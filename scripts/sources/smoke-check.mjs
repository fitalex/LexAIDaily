import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  checkPayloadParsability,
  loadAndValidateWhitelist,
} from "../../src/sources/validate-whitelist.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "../..");

const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function probeSource(
  src,
  {
    fetchImpl = fetch,
    timeoutMs = 25000,
    maxRetries = 2,
    backoffMs = 1000,
  } = {},
) {
  let lastResult = null;
  const totalAttempts = maxRetries + 1;

  for (let attempt = 1; attempt <= totalAttempts; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetchImpl(src.entry_url, {
        headers: {
          "User-Agent": BROWSER_UA,
          Accept:
            src.fetch_mode === "rss" || src.fetch_mode === "atom"
              ? "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8"
              : src.fetch_mode === "discovery_api" || src.fetch_mode === "json_api"
                ? "application/json, */*;q=0.8"
                : "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        redirect: "follow",
        signal: controller.signal,
      });
      const body = await res.text();
      const contentType = res.headers?.get?.("content-type") || "";
      const verdict = checkPayloadParsability(src, {
        status: res.status,
        contentType,
        body,
      });
      lastResult = {
        source_id: src.source_id,
        status: res.status,
        attempts: attempt,
        ...verdict,
      };
      // Stop immediately on success or non-transient 4xx (except 429)
      if (verdict.ok || (res.status >= 400 && res.status < 500 && res.status !== 429)) {
        return lastResult;
      }
    } catch (err) {
      lastResult = {
        source_id: src.source_id,
        status: 0,
        attempts: attempt,
        ok: false,
        errors: [err instanceof Error ? err.message : String(err)],
        metrics: {},
      };
    } finally {
      clearTimeout(timer);
    }

    if (attempt < totalAttempts && backoffMs > 0) {
      await sleep(backoffMs * attempt);
    }
  }

  return lastResult;
}

async function main() {
  const cn = loadAndValidateWhitelist(
    path.join(REPO_ROOT, "data/sources/whitelist-cn.yaml"),
    "cn",
  );
  const global = loadAndValidateWhitelist(
    path.join(REPO_ROOT, "data/sources/whitelist-global.yaml"),
    "global",
  );
  if (!cn.valid || !global.valid) {
    console.error("Whitelist schema validation failed:", {
      cn: cn.errors,
      global: global.errors,
    });
    process.exit(1);
  }

  const activeSources = [
    ...cn.config.sources,
    ...global.config.sources,
  ].filter((s) => s.status === "active");

  const results = [];
  for (const src of activeSources) {
    const r = await probeSource(src);
    results.push(r);
    const mark = r.ok ? "PASS" : "FAIL";
    console.log(
      `[${mark}] ${r.source_id} (${src.fetch_mode}) status=${r.status} attempts=${r.attempts} metrics=${JSON.stringify(r.metrics)}${r.errors.length ? " errors=" + JSON.stringify(r.errors) : ""}`,
    );
  }

  const failed = results.filter((r) => !r.ok);
  console.log(
    `\nSummary: ${results.length - failed.length}/${results.length} passed, ${failed.length} failed.`,
  );
  if (failed.length > 0) {
    process.exit(1);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main();
}
