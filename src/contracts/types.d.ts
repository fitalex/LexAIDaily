export type Region = "cn" | "global";

export type OfficialCategory =
  | "监管与合规"
  | "模型与技术"
  | "实务与工具"
  | "判例与学术"
  | "行业与资本";

export type FactTier = "confirmed_fact" | "official_data" | "market_opinion";

export type EffectiveStatus =
  | "draft"
  | "proposed"
  | "enacted"
  | "in_force"
  | "amended"
  | "superseded"
  | "repealed"
  | "guidance"
  | "not_applicable";

export type ReviewStatus = "pending_review" | "approved" | "rejected";

export interface EvidenceQuote {
  text: string;
  locator?: string;
}

export interface DetailAnalysis {
  key_points: string[];
  evidence_quotes: EvidenceQuote[];
  legal_commentary: string;
  ai_draft: boolean;
}

export interface CandidateItem {
  id: string;
  region: Region;
  source_id: string;
  discovered_via?: string;
  source_name: string;
  source_domain?: string;
  source_url: string;
  published_at: string;
  collected_at: string;
  category: OfficialCategory;
  title: string;
  summary: string;
  practice_impact_brief: string;
  practice_impact_is_ai_draft: boolean;
  fact_tier: FactTier;
  fact_tier_note?: string;
  unverified: boolean;
  unverified_reason?: string;
  needs_human_check: boolean;
  high_risk_legal: boolean;
  effective_status?: EffectiveStatus;
  superseded_by?: string;
  headline: boolean;
  review_status: ReviewStatus;
  detail_analysis: DetailAnalysis;
}

export interface CollectSourceResult {
  source_id: string;
  status: "ok" | "error" | "skipped" | "degraded";
  items_count: number;
  http_status?: number;
  error_message?: string;
}

export interface CollectMeta {
  schema_version: "1.0";
  run_id: string;
  region: Region;
  started_at: string;
  finished_at: string;
  status: "success" | "partial" | "failed";
  sources_attempted: number;
  sources_succeeded: number;
  sources_failed: number;
  items_fetched: number;
  items_deduped: number;
  cache_ttl_days: 7;
  cache_pruned_count: number;
  source_results: CollectSourceResult[];
}

export type TopicTriggerReason =
  | "multi_source_cross_report"
  | "high_risk_legal_tag"
  | "heat_or_controversy_threshold"
  | "long_regulation_split";

export interface WechatTopicEntry {
  topic_id: string;
  title: string;
  category: OfficialCategory;
  trigger_reasons: TopicTriggerReason[];
  cross_source_count?: number;
  candidate_ids: string[];
  primary_source_urls: string[];
  angle_brief?: string;
  high_risk_legal: boolean;
  status: "queued" | "selected" | "published" | "archived";
  created_at: string;
}

export interface WechatTopicPool {
  schema_version: "1.0";
  updated_at: string;
  topics: WechatTopicEntry[];
}

export interface DailyBundleMeta {
  site: string;
  column: string;
  issue: string;
  date: string;
  date_line: string;
  internal: boolean;
  internal_note?: string;
  digest: string;
  disclaimer: string;
  web_detail_url?: string;
  generated_at: string;
}

export interface DailyBundle {
  schema_version: "1.0";
  meta: DailyBundleMeta;
  items: CandidateItem[];
}

export interface ValidationIssue {
  instancePath: string;
  keyword: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  schemaName:
    | "candidate-item"
    | "collect-meta"
    | "wechat-topic-pool"
    | "daily-bundle";
  errors: ValidationIssue[];
}

export declare const FORBIDDEN_FULLTEXT_KEYS: readonly string[];

export declare function validateCandidateItem(data: unknown): ValidationResult;
export declare function validateCollectMeta(data: unknown): ValidationResult;
export declare function validateWechatTopicPool(
  data: unknown,
): ValidationResult;
export declare function validateDailyBundle(data: unknown): ValidationResult;
export declare function validateBySchemaName(
  schemaName: ValidationResult["schemaName"],
  data: unknown,
): ValidationResult;
export declare function checkNoTrackedRawCache(repoRoot?: string): {
  valid: boolean;
  trackedFiles: string[];
  errors: string[];
};
