import { sha256Text } from "../../collectors/shared/cache.mjs";

const HEAT_THRESHOLD = 80;

function clamp(str, minLen, maxLen) {
  let out = String(str ?? "").replace(/\s+/g, " ").trim();
  if (out.length > maxLen) out = out.slice(0, maxLen).trim();
  while (out.length < minLen) out = `${out}（待深研）`;
  return out;
}

export function buildWechatTopicPool({
  curatedClusters,
  nowIso = new Date().toISOString(),
}) {
  const topics = [];

  for (const entry of curatedClusters) {
    const { item, cross_source_count, merged_candidate_ids, primary_source_urls, heat_score, is_long_regulation } =
      entry;
    const reasons = [];
    if (cross_source_count >= 2) reasons.push("multi_source_cross_report");
    if (item.high_risk_legal) reasons.push("high_risk_legal_tag");
    if (typeof heat_score === "number" && heat_score >= HEAT_THRESHOLD) {
      reasons.push("heat_or_controversy_threshold");
    }
    if (is_long_regulation) reasons.push("long_regulation_split");

    if (reasons.length === 0) continue;

    const topicId = `topic-${nowIso.slice(0, 10).replace(/-/g, "")}-${sha256Text(item.source_url).slice(0, 8)}`;
    topics.push({
      topic_id: topicId,
      title: clamp(item.title, 6, 120),
      category: item.category,
      trigger_reasons: reasons,
      cross_source_count: Math.max(1, cross_source_count),
      candidate_ids: merged_candidate_ids,
      primary_source_urls,
      angle_brief: clamp(
        `围绕「${item.title}」拆解法律实务落地步骤与合规风险边界（触发：${reasons.join(", ")}）。`,
        10,
        200,
      ),
      high_risk_legal: Boolean(item.high_risk_legal),
      status: "queued",
      created_at: nowIso,
    });
  }

  return {
    schema_version: "1.0",
    updated_at: nowIso,
    topics,
  };
}

export function renderTopicPoolMarkdown(pool) {
  const lines = [
    `# LexAIDaily 公众号深度选题池`,
    "",
    `- 更新时间：\`${pool.updated_at}\``,
    `- 入池选题数：${pool.topics.length}`,
    "",
  ];
  if (pool.topics.length === 0) {
    lines.push("当日无触发深度选题池阈值的候选条目。");
    return `${lines.join("\n")}\n`;
  }
  for (const t of pool.topics) {
    lines.push(`## ${t.title}`);
    lines.push(`- **Topic ID**：\`${t.topic_id}\`｜**栏目**：${t.category}｜**状态**：\`${t.status}\``);
    lines.push(`- **触发规则**：${t.trigger_reasons.join("、")}（跨源数：${t.cross_source_count}）`);
    lines.push(`- **高风险法律**：${t.high_risk_legal ? "是" : "否"}`);
    lines.push(`- **切入角度**：${t.angle_brief}`);
    lines.push(`- **一手原链**：${t.primary_source_urls.join(" , ")}`);
    lines.push("");
  }
  return `${lines.join("\n")}\n`;
}
