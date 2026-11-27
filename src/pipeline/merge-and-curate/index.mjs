import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  getDefaultCacheDir,
  loadRawCacheIndex,
} from "../../collectors/shared/cache.mjs";
import { validateBySchemaName } from "../../contracts/validate.mjs";
import { deduplicateCrossTrack } from "./dedup.mjs";
import { runStage1FactExtraction, runStage2DualLayer } from "./fact-anchor.mjs";
import { buildWechatTopicPool, renderTopicPoolMarkdown } from "./topic-pool.mjs";

function readJsonIfExists(filePath) {
  if (!existsSync(filePath)) return null;
  return JSON.parse(readFileSync(filePath, "utf8"));
}

export async function runCuratePipeline({
  repoRoot = process.cwd(),
  date = new Date().toISOString().slice(0, 10),
  nowIso = new Date().toISOString(),
  candidatesDir = path.join(repoRoot, "data", "candidates", date),
  cacheDir = getDefaultCacheDir(repoRoot),
  bundlesDir = path.join(repoRoot, "data", "bundles"),
  topicPoolDir = path.join(repoRoot, "data", "topic-pool"),
  offline = false,
  env = process.env,
  fetchImpl = globalThis.fetch,
  writeOutput = true,
} = {}) {
  const cnItems = readJsonIfExists(path.join(candidatesDir, "cn.json"));
  const globalItems = readJsonIfExists(path.join(candidatesDir, "global.json"));
  const cnMeta = readJsonIfExists(path.join(candidatesDir, "cn-meta.json"));
  const globalMeta = readJsonIfExists(path.join(candidatesDir, "global-meta.json"));

  const missingTracks = [];
  if (!Array.isArray(cnItems)) missingTracks.push("cn");
  if (!Array.isArray(globalItems)) missingTracks.push("global");

  const failedSources = [];
  for (const meta of [cnMeta, globalMeta]) {
    if (meta && Array.isArray(meta.source_results)) {
      for (const r of meta.source_results) {
        if (r.status === "error" || r.status === "degraded") {
          failedSources.push(`${r.source_id}(${r.status})`);
        }
      }
    }
  }

  const combined = [
    ...(Array.isArray(globalItems) ? globalItems : []),
    ...(Array.isArray(cnItems) ? cnItems : []),
  ];

  const dedupedClusters = deduplicateCrossTrack(combined);
  const { byUrl } = loadRawCacheIndex(cacheDir);
  const curatedClusters = [];

  for (const cluster of dedupedClusters) {
    const cacheRec = byUrl.get(cluster.item.source_url);
    const rawText = cacheRec?.raw_text || `${cluster.item.title}\n${cluster.item.summary}`;
    const stage1 = runStage1FactExtraction({ candidate: cluster.item, rawText });
    const { item, faithfulness } = await runStage2DualLayer({
      candidate: cluster.item,
      stage1,
      rawText,
      offline,
      env,
      fetchImpl,
    });

    const itemCheck = validateBySchemaName("candidate-item", item);
    if (!itemCheck.valid) {
      throw new Error(`Curated item schema invalid (${item.id}): ${itemCheck.errors.join("; ")}`);
    }

    curatedClusters.push({
      ...cluster,
      item,
      faithfulness,
      heat_score: cacheRec?.heat_score ?? null,
      is_long_regulation: stage1.is_long_regulation,
    });
  }

  const topicPool = buildWechatTopicPool({ curatedClusters, nowIso });
  const topicCheck = validateBySchemaName("wechat-topic-pool", topicPool);
  if (!topicCheck.valid) {
    throw new Error(`WechatTopicPool schema invalid: ${topicCheck.errors.join("; ")}`);
  }

  const degradedNote =
    missingTracks.length > 0 || failedSources.length > 0
      ? `（降级提示：缺失轨=${missingTracks.join(",") || "无"}；异常源=${failedSources.slice(0, 5).join(",") || "无"}）`
      : "";

  const digestRaw = `LexAIDaily ${date} 法律 AI 实务雷达：共汇流 ${curatedClusters.length} 条一手候选，${topicPool.topics.length} 条入深度选题池。${degradedNote}`;
  const digest = digestRaw.slice(0, 240);

  let bundle = null;
  if (curatedClusters.length > 0) {
    bundle = {
      schema_version: "1.0",
      meta: {
        site: "LexAIDaily",
        column: "法律 AI 每日实务雷达",
        issue: `Issue-${date}`,
        date,
        date_line: `${date} · 双轨汇流 AI 初稿`,
        internal: true,
        internal_note: "Gate 2 自动汇流初稿，未经人工终审不得对外发布",
        digest: digest.length >= 20 ? digest : `${digest} 仅供内部审校参考。`,
        disclaimer:
          "本简报摘要与实务评述均为 AI 初稿，仅作法律从业者信息参考，不构成正式法律意见；请以一手原始出处为准。",
        generated_at: nowIso,
      },
      items: curatedClusters.map((c) => c.item),
    };

    const bundleCheck = validateBySchemaName("daily-bundle", bundle);
    if (!bundleCheck.valid) {
      throw new Error(`DailyBundle schema invalid: ${bundleCheck.errors.join("; ")}`);
    }
  }

  if (writeOutput) {
    if (bundle) {
      if (!existsSync(bundlesDir)) mkdirSync(bundlesDir, { recursive: true });
      writeFileSync(
        path.join(bundlesDir, `${date}.json`),
        `${JSON.stringify(bundle, null, 2)}\n`,
        "utf8",
      );
    }
    if (!existsSync(topicPoolDir)) mkdirSync(topicPoolDir, { recursive: true });
    writeFileSync(
      path.join(topicPoolDir, `${date}.json`),
      `${JSON.stringify(topicPool, null, 2)}\n`,
      "utf8",
    );
    writeFileSync(
      path.join(topicPoolDir, `${date}.md`),
      renderTopicPoolMarkdown(topicPool),
      "utf8",
    );
  }

  return {
    bundle,
    topicPool,
    curatedClusters,
    degraded: {
      missingTracks,
      failedSources,
    },
  };
}

const isCli =
  process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isCli) {
  const dateArgIdx = process.argv.indexOf("--date");
  const date = dateArgIdx >= 0 ? process.argv[dateArgIdx + 1] : undefined;
  const offline = process.argv.includes("--offline");
  runCuratePipeline({ ...(date ? { date } : {}), offline })
    .then(({ bundle, topicPool, degraded }) => {
      console.log(
        `[curate] items=${bundle?.items.length ?? 0} topics=${topicPool.topics.length} missingTracks=${degraded.missingTracks.join(",") || "none"}`,
      );
    })
    .catch((err) => {
      console.error(`[curate] FAILED: ${err.message}`);
      process.exitCode = 1;
    });
}
