import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getLocalDateString } from "../../collectors/shared/adapters-ext.mjs";
import {
  getDefaultCacheDir,
  loadRawCacheIndex,
} from "../../collectors/shared/cache.mjs";
import { validateBySchemaName } from "../../contracts/validate.mjs";
import { deduplicateCrossTrack } from "./dedup.mjs";
import { runStage1WithLlm, runStage2DualLayer } from "./fact-anchor.mjs";
import { buildWechatTopicPool, renderTopicPoolMarkdown } from "./topic-pool.mjs";

function readJsonSafe(filePath) {
  if (!existsSync(filePath)) return { data: null, corrupted: false };
  try {
    return { data: JSON.parse(readFileSync(filePath, "utf8")), corrupted: false };
  } catch {
    return { data: null, corrupted: true };
  }
}

function writeFileAtomic(filePath, content) {
  const dir = path.dirname(filePath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const tmpPath = `${filePath}.tmp-${process.pid}-${Date.now()}`;
  writeFileSync(tmpPath, content, "utf8");
  renameSync(tmpPath, filePath);
}

export function renderReviewNotesMarkdown({ date, nowIso, curatedClusters, degraded }) {
  const lines = [
    `# LexAIDaily 人工审校诊断简报（${date}）`,
    "",
    `- 生成时间：\`${nowIso}\``,
    `- 汇流条目数：${curatedClusters.length}｜LLM 降级：${degraded.llmFallbackCount} 条｜Schema 校验重试：${degraded.llmRetryCount} 次｜缓存缺失：${degraded.cacheMissingIds.length} 条`,
    "",
    "| 条目 ID | 标题 | Stage1 模式 | Stage2 模板/重试/降级 | 数字/日期忠实度 | 需人工复核 |",
    "|---|---|---|---|---|---|",
  ];

  for (const c of curatedClusters) {
    const titleShort = String(c.item.title).replace(/\|/g, "｜").slice(0, 32);
    const s1Mode = `${c.stage1Meta?.mode || "deterministic"}${c.stage1Meta?.usedFallback ? "(fallback)" : ""}`;
    const s2Info = `v${c.promptMeta?.version || "1.0.0"} / retry=${c.promptMeta?.retryCount ?? 0} / fb=${Boolean(c.promptMeta?.usedFallback)}`;
    const faithInfo = c.faithfulness?.faithful
      ? "通过"
      : `告警：未命中 [${(c.faithfulness?.missingTokens ?? []).join(", ")}]`;
    const checkFlag = c.item.needs_human_check ? "**是**" : "否";
    lines.push(`| \`${c.item.id}\` | ${titleShort} | ${s1Mode} | ${s2Info} | ${faithInfo} | ${checkFlag} |`);
  }

  lines.push("");
  return `${lines.join("\n")}\n`;
}

export async function runCuratePipeline({
  repoRoot = process.cwd(),
  nowIso = new Date().toISOString(),
  env = process.env,
  date = getLocalDateString(nowIso, env?.TZ || "Asia/Shanghai"),
  candidatesDir = path.join(repoRoot, "data", "candidates", date),
  cacheDir = getDefaultCacheDir(repoRoot),
  bundlesDir = path.join(repoRoot, "data", "bundles"),
  topicPoolDir = path.join(repoRoot, "data", "topic-pool"),
  offline = false,
  fetchImpl = globalThis.fetch,
  writeOutput = true,
} = {}) {
  const cnRead = readJsonSafe(path.join(candidatesDir, "cn.json"));
  const glRead = readJsonSafe(path.join(candidatesDir, "global.json"));
  const cnMeta = readJsonSafe(path.join(candidatesDir, "cn-meta.json")).data;
  const globalMeta = readJsonSafe(path.join(candidatesDir, "global-meta.json")).data;

  const missingTracks = [];
  if (!Array.isArray(cnRead.data)) {
    missingTracks.push(cnRead.corrupted ? "cn(corrupted)" : "cn");
  }
  if (!Array.isArray(glRead.data)) {
    missingTracks.push(glRead.corrupted ? "global(corrupted)" : "global");
  }

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
    ...(Array.isArray(glRead.data) ? glRead.data : []),
    ...(Array.isArray(cnRead.data) ? cnRead.data : []),
  ];

  const dedupedClusters = deduplicateCrossTrack(combined);
  const { byUrl } = loadRawCacheIndex(cacheDir);
  const curatedClusters = [];
  const cacheMissingIds = [];
  let llmFallbackCount = 0;
  let llmRetryCount = 0;

  for (const cluster of dedupedClusters) {
    const cacheRec = byUrl.get(cluster.item.source_url);
    const cacheMissing = !cacheRec || !cacheRec.raw_text;
    if (cacheMissing) {
      cacheMissingIds.push(cluster.item.id);
    }
    const rawText = cacheRec?.raw_text || `${cluster.item.title}\n${cluster.item.summary}`;
    const { stage1, stage1Meta } = await runStage1WithLlm({
      candidate: cluster.item,
      rawText,
      offline,
      env,
      fetchImpl,
    });
    const { item, faithfulness, promptMeta } = await runStage2DualLayer({
      candidate: cluster.item,
      stage1,
      rawText,
      offline,
      env,
      fetchImpl,
    });

    if (stage1Meta.usedFallback || promptMeta.usedFallback) {
      llmFallbackCount += 1;
    }
    llmRetryCount += promptMeta.retryCount;

    if (cacheMissing) {
      item.needs_human_check = true;
    }

    const itemCheck = validateBySchemaName("candidate-item", item);
    if (!itemCheck.valid) {
      throw new Error(
        `Curated item schema invalid (${item.id}): ${JSON.stringify(itemCheck.errors)}`,
      );
    }

    curatedClusters.push({
      ...cluster,
      item,
      faithfulness,
      stage1Meta,
      promptMeta,
      cache_missing: cacheMissing,
      heat_score: cacheRec?.heat_score ?? null,
      is_long_regulation: stage1.is_long_regulation,
    });
  }

  const topicPool = buildWechatTopicPool({ curatedClusters, nowIso });
  const topicCheck = validateBySchemaName("wechat-topic-pool", topicPool);
  if (!topicCheck.valid) {
    throw new Error(`WechatTopicPool schema invalid: ${JSON.stringify(topicCheck.errors)}`);
  }

  const degradedParts = [];
  if (missingTracks.length > 0) degradedParts.push(`缺失轨=${missingTracks.join(",")}`);
  if (failedSources.length > 0) degradedParts.push(`异常源=${failedSources.slice(0, 5).join(",")}`);
  if (cacheMissingIds.length > 0) degradedParts.push(`缓存缺失=${cacheMissingIds.length}条`);
  if (llmFallbackCount > 0) degradedParts.push(`LLM降级=${llmFallbackCount}条`);
  if (llmRetryCount > 0) degradedParts.push(`校验重试=${llmRetryCount}次`);
  const degradedNote = degradedParts.length > 0 ? `（降级提示：${degradedParts.join("；")}）` : "";

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
      throw new Error(`DailyBundle schema invalid: ${JSON.stringify(bundleCheck.errors)}`);
    }
  }

  const degraded = {
    missingTracks,
    failedSources,
    cacheMissingIds,
    llmFallbackCount,
    llmRetryCount,
  };

  const reviewNotesMd = renderReviewNotesMarkdown({
    date,
    nowIso,
    curatedClusters,
    degraded,
  });

  if (writeOutput) {
    if (bundle) {
      writeFileAtomic(
        path.join(bundlesDir, `${date}.json`),
        `${JSON.stringify(bundle, null, 2)}\n`,
      );
      writeFileAtomic(
        path.join(bundlesDir, `${date}-review.md`),
        reviewNotesMd,
      );
    }
    writeFileAtomic(
      path.join(topicPoolDir, `${date}.json`),
      `${JSON.stringify(topicPool, null, 2)}\n`,
    );
    writeFileAtomic(
      path.join(topicPoolDir, `${date}.md`),
      renderTopicPoolMarkdown(topicPool),
    );
  }

  return {
    bundle,
    topicPool,
    curatedClusters,
    reviewNotesMd,
    degraded,
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
        `[curate] items=${bundle?.items.length ?? 0} topics=${topicPool.topics.length} missingTracks=${degraded.missingTracks.join(",") || "none"} cacheMissing=${degraded.cacheMissingIds.length} llmFallback=${degraded.llmFallbackCount} llmRetry=${degraded.llmRetryCount}`,
      );
    })
    .catch((err) => {
      console.error(`[curate] FAILED: ${err.message}`);
      process.exitCode = 1;
    });
}
