import { fileURLToPath } from "node:url";
import { runRegionalCollector } from "../shared/collector-runner.mjs";

export async function runCnCollector(options = {}) {
  return runRegionalCollector({
    region: "cn",
    perSourceDelayMs: options.perSourceDelayMs ?? 200,
    ...options,
  });
}

const isCli =
  process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isCli) {
  const dateArgIdx = process.argv.indexOf("--date");
  const date = dateArgIdx >= 0 ? process.argv[dateArgIdx + 1] : undefined;
  runCnCollector({ ...(date ? { date } : {}) })
    .then(({ candidates, meta }) => {
      console.log(
        `[collect:cn] status=${meta.status} sources=${meta.sources_succeeded}/${meta.sources_attempted} items=${candidates.length} pruned=${meta.cache_pruned_count}`,
      );
      if (meta.status === "failed") {
        process.exitCode = 1;
      }
    })
    .catch((err) => {
      console.error(`[collect:cn] FAILED: ${err.message}`);
      process.exitCode = 1;
    });
}
