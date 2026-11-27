import { fileURLToPath } from "node:url";
import { runCnCollector } from "../collectors/cn/index.mjs";
import { runGlobalCollector } from "../collectors/global/index.mjs";
import { getLocalDateString } from "../collectors/shared/adapters-ext.mjs";
import { runCuratePipeline } from "./merge-and-curate/index.mjs";

export async function runDailyPipeline(options = {}) {
  const nowIso = options.nowIso || new Date().toISOString();
  const date = options.date || getLocalDateString(nowIso, options.env?.TZ || process.env.TZ || "Asia/Shanghai");
  const results = { cn: null, global: null, errors: [] };

  try {
    results.cn = await runCnCollector({ ...options, date, nowIso });
  } catch (err) {
    results.errors.push({ stage: "collect:cn", message: String(err?.message ?? err) });
  }

  try {
    results.global = await runGlobalCollector({ ...options, date, nowIso });
  } catch (err) {
    results.errors.push({ stage: "collect:global", message: String(err?.message ?? err) });
  }

  const curated = await runCuratePipeline({ ...options, date, nowIso });
  const cnFailed = !results.cn || results.cn.meta?.status === "failed";
  const globalFailed = !results.global || results.global.meta?.status === "failed";
  const itemCount = curated.bundle?.items.length ?? 0;
  const overallFailed = (cnFailed && globalFailed) || (results.errors.length >= 2 && itemCount === 0);

  return {
    date,
    cn: results.cn,
    global: results.global,
    curated,
    errors: results.errors,
    status: overallFailed ? "failed" : results.errors.length > 0 || cnFailed || globalFailed ? "partial" : "success",
  };
}

const isCli =
  process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isCli) {
  const dateArgIdx = process.argv.indexOf("--date");
  const date = dateArgIdx >= 0 ? process.argv[dateArgIdx + 1] : undefined;
  const offline = process.argv.includes("--offline");
  runDailyPipeline({ ...(date ? { date } : {}), offline })
    .then(({ date: d, curated, errors, status }) => {
      const itemCount = curated.bundle?.items.length ?? 0;
      console.log(
        `[daily] date=${d} status=${status} curated_items=${itemCount} topics=${curated.topicPool.topics.length} stage_errors=${errors.length}`,
      );
      if (status === "failed") {
        process.exitCode = 1;
      }
    })
    .catch((err) => {
      console.error(`[daily] FAILED: ${err.message}`);
      process.exitCode = 1;
    });
}
