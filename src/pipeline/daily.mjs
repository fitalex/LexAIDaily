import { fileURLToPath } from "node:url";
import { runCnCollector } from "../collectors/cn/index.mjs";
import { runGlobalCollector } from "../collectors/global/index.mjs";
import { runCuratePipeline } from "./merge-and-curate/index.mjs";

export async function runDailyPipeline(options = {}) {
  const date = options.date || new Date().toISOString().slice(0, 10);
  const results = { cn: null, global: null, errors: [] };

  try {
    results.cn = await runCnCollector({ ...options, date });
  } catch (err) {
    results.errors.push({ stage: "collect:cn", message: String(err?.message ?? err) });
  }

  try {
    results.global = await runGlobalCollector({ ...options, date });
  } catch (err) {
    results.errors.push({ stage: "collect:global", message: String(err?.message ?? err) });
  }

  const curated = await runCuratePipeline({ ...options, date });
  return {
    date,
    cn: results.cn,
    global: results.global,
    curated,
    errors: results.errors,
  };
}

const isCli =
  process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isCli) {
  const dateArgIdx = process.argv.indexOf("--date");
  const date = dateArgIdx >= 0 ? process.argv[dateArgIdx + 1] : undefined;
  const offline = process.argv.includes("--offline");
  runDailyPipeline({ ...(date ? { date } : {}), offline })
    .then(({ date: d, curated, errors }) => {
      console.log(
        `[daily] date=${d} curated_items=${curated.bundle?.items.length ?? 0} topics=${curated.topicPool.topics.length} stage_errors=${errors.length}`,
      );
    })
    .catch((err) => {
      console.error(`[daily] FAILED: ${err.message}`);
      process.exitCode = 1;
    });
}
