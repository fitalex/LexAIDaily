import { fileURLToPath } from "node:url";
import { runRegionalCollector } from "../shared/collector-runner.mjs";

export async function runGlobalCollector(options = {}) {
  return runRegionalCollector({
    region: "global",
    perSourceDelayMs: options.perSourceDelayMs ?? 150,
    ...options,
  });
}

const isCli =
  process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isCli) {
  const dateArgIdx = process.argv.indexOf("--date");
  const date = dateArgIdx >= 0 ? process.argv[dateArgIdx + 1] : undefined;
  runGlobalCollector({ ...(date ? { date } : {}) })
    .then(({ candidates, meta }) => {
      console.log(
        `[collect:global] status=${meta.status} sources=${meta.sources_succeeded}/${meta.sources_attempted} items=${candidates.length} pruned=${meta.cache_pruned_count}`,
      );
    })
    .catch((err) => {
      console.error(`[collect:global] FAILED: ${err.message}`);
      process.exitCode = 1;
    });
}
