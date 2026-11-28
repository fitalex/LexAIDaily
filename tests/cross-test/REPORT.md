# LD-G2-06｜Gate 2 管线与双端导出独立交叉测试报告

- **任务编号**：`LD-G2-06`（A 级｜Parent [#38](https://github.com/fitalex/LexAIDaily/issues/38)｜Issue [#44](https://github.com/fitalex/LexAIDaily/issues/44)｜Owner：Antigravity）
- **复核 / 验收**：Gemini 复核；Human Maintainer 审批合并
- **基准与工作分支**：基准 `origin/main` @ `fc57d46940783b4b77c816a99aede05df1af239e`（含 `LD-G2-01` 至 `LD-G2-05` 及 DSH 独立审计归档）｜测试分支：`ag/ld-g2-06-cross-test-docs`
- **被测对象**：
  - 3 期双轨试运行样本：[2026-11-24.json](../../data/bundles/2026-11-24.json)、[2026-11-25.json](../../data/bundles/2026-11-25.json)、[2026-11-26.json](../../data/bundles/2026-11-26.json)（共 24 条）
  - 采集与公共汇流管线（`LD-G2-03`）：[collector-runner.mjs](../../src/collectors/shared/collector-runner.mjs)、[adapters-l1.mjs](../../src/collectors/shared/adapters-l1.mjs)、[daily.mjs](../../src/pipeline/daily.mjs)、[merge-and-curate/index.mjs](../../src/pipeline/merge-and-curate/index.mjs)、[dedup.mjs](../../src/pipeline/merge-and-curate/dedup.mjs)、[topic-pool.mjs](../../src/pipeline/merge-and-curate/topic-pool.mjs)
  - 双端一键导出 CLI（`LD-G2-05`）：[dual-export.mjs](../../src/export/dual-export.mjs) 及配套清单 [manifest.json](../../data/exports/ld-g2-05/manifest.json)、V16 Web 原型 [index.html](../../design/prototype/index.html)
- **交叉测试套件**：[gate2-cross-test.test.mjs](gate2-cross-test.test.mjs)（入口 [index.js](index.js)，仅使用 Node 内置 `node:test` + 既有 `ajv`/`ajv-formats`/`js-yaml`，零新增依赖、零修改被测代码）
- **运行环境**：macOS / Node.js `v22.22.3` / `TZ=Asia/Shanghai`
- **总体结论**：**通过（7/7 用例全通过，0 失败、0 跳过；与既有 40/40 基线测试及 `validate:contracts` 全通过；0 项 S1/S2 缺陷，余 5 项 S3 非阻断观察）**。

---

## 一、已运行命令与真实输出

### 1. 独立交叉测试（`npm run test:cross` 与 `node --test tests/cross-test/`）

```text
$ TZ=Asia/Shanghai npm run test:cross

> lexaidaily-wechat-prototype@0.0.0 test:cross
> node --test tests/cross-test/*.test.mjs

▶ LD-G2-06 Cross-Test Suite 1: 3-Day Dual-Track Trial Bundles (Testing Seam 1)
  ✔ validates all 3 bundles (24 items) independently with Ajv/ajv-formats, whitelist alignment, article-level HTTPS URLs, Option B key_points, fact_tier, sentinel ratio & zero fulltext (40.845666ms)
✔ LD-G2-06 Cross-Test Suite 1: 3-Day Dual-Track Trial Bundles (Testing Seam 1) (41.343042ms)
▶ LD-G2-06 Cross-Test Suite 2: Collection & Public Merge Pipeline (LD-G2-03)
  ✔ deduplicates duplicate URL, duplicate GUID, and cross-track same-event items while preferring global primary URL (4.111541ms)
  ✔ supports degraded execution when one track is missing or corrupted, and runs partial daily pipeline when one collector fails (25.780916ms)
  ✔ routes high-heat (>=80), high-risk, multi-source & long-regulation items into wechat-topic-pool and filters low-heat routine items (0.321791ms)
  ✔ enforces aihot.news discovery-only trace-back to links.original without copying AIHOT summary and honors 7-day cache TTL (16.637167ms)
✔ LD-G2-06 Cross-Test Suite 2: Collection & Public Merge Pipeline (LD-G2-03) (47.215208ms)
▶ LD-G2-06 Cross-Test Suite 3: Dual-Layer Export CLI (LD-G2-05, Testing Seam 2)
  ✔ produces deterministic CLI outputs matching data/exports/ld-g2-05/manifest.json and D-030 WeChat / V16 Web compatibility (1063.312667ms)
  ✔ enforces --approved-only filtering and fail-closed CLI/API guardrails for pending-only, unregistered whitelist, empty repoRoot, and bypass flags (661.982792ms)
✔ LD-G2-06 Cross-Test Suite 3: Dual-Layer Export CLI (LD-G2-05, Testing Seam 2) (1725.595166ms)
ℹ tests 7
ℹ suites 3
ℹ pass 7
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 2157.924833
```

目录入口复跑 `node --test tests/cross-test/` 同样 **7/7 通过（0 fail）**。

### 2. 交付前全量基线、契约与链接校验

```text
$ npm ci
added 71 packages in 849ms

$ TZ=Asia/Shanghai npm test
ℹ tests 40
ℹ suites 2
ℹ pass 40
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

$ npm run validate:contracts
{
  "valid": true,
  "trackedFiles": [],
  "filesChecked": 3,
  "errors": []
}
```

相对链接校验脚本实测：[docs/gate2-index.md](../../docs/gate2-index.md) **89 条相对链接 0 断链**（43 个 Gate 2 跟踪文件 **0 遗漏**），本报告 **28 条相对链接 0 断链**。

### 3. 双端一键导出 CLI 两次确定性构建与 SHA-256 核对

分别向两个 `os.tmpdir()` 临时目录执行两次 CLI：
`node src/export/dual-export.mjs --in-dir data/bundles --out-dir <tmp1|tmp2> --approved-only`

```text
[export:dual] exported=3 editions | webIndexSha256=c8e6f9aa192c | manifest=/var/folders/8v/2nwg5vc938jdcqqjgk72bkw00000gn/T/lexai-xrep1-fOjtLT/manifest.json
[export:dual] exported=3 editions | webIndexSha256=c8e6f9aa192c | manifest=/var/folders/8v/2nwg5vc938jdcqqjgk72bkw00000gn/T/lexai-xrep2-ECIimQ/manifest.json
```

| 产物 | Run 1 = Run 2 | 与 `data/exports/ld-g2-05/manifest.json` 一致 | 实测 SHA-256 |
|---|---|---|---|
| `wechat/2026-11-24.html` | **一致** | **一致** | `c9d88f19b8355291ec1008cf72b0db4da263291d51d0f3a233bac9a48ce3538b` |
| `wechat/2026-11-25.html` | **一致** | **一致** | `ff136ccb1ac6ff4b59e93adb44d8dd8f42baeb86a0147589f932de7286843ec2` |
| `wechat/2026-11-26.html` | **一致** | **一致** | `ef133b1fa64cb386f40933eb9d13950b86d9e65a0ecf47db09fcd6abdeede0b1` |
| `web/2026-11-24.json` | **一致** | **一致** | `4b7d41ec5516ae4434f1cdf40183a30acc17ff90fdf4d473c50f6b9f6a55d5a1` |
| `web/2026-11-25.json` | **一致** | **一致** | `0d9bc842b158366a70b51e714ca5541ced622b9b3154f4ed4c9c765d7c8f1ba2` |
| `web/2026-11-26.json` | **一致** | **一致** | `8f3c2fca1cc0bd45965a7056e427688d741137d897619b6acacab67cbfcf5862` |
| `web/editions-index.json` | **一致** | **一致** | `c8e6f9aa192ce80ab01c786756e61b36e3a422ccd65f98c3eef27d4145c8ecde` |

---

## 二、测试接缝 1 & 2 独立核验清单

| 核验维度 | 覆盖范围 | 实测结果与指标 |
|---|---|---|
| **3 期试运行样本契约与内容红线**（Suite 1） | `2026-11-24`（CN 1 / Global 7）、`2026-11-25`（CN 3 / Global 5）、`2026-11-26`（CN 3 / Global 5），共 **24 条** | 独立 `Ajv` 校验 **24/24 通过**；白名单 `source_id` 与分域 **24/24 对齐**（26 源）；文章级一手 `https://` URL **24/24**（零栏目/Feed/首页、零 `aihot.news`、零 `example.com`）；`summary` **76–125 字**（全在 20–160）；`key_points` 均为 1 段 **194–254 字**（符合 Option B 1–3 段且合计 ≤600，零元标注残留）；`evidence_quotes` **28–134 字**；`legal_commentary` **200–258 字**；`fact_tier` / `unverified` / `effective_status` 全合规；高风险哨兵每期 **2/8 = 25.0%**（总 **6/24 = 25.0%**，在 15%–25% 内）；每期五维分类与双轨齐全；**0 禁用全文字段**；`.cache/` 零跟踪。 |
| **采集与公共汇流管线**（Suite 2） | `LD-G2-03` 去重、降级、选题池与 AIHOT 红线 | 重复归一化 URL（含 `utm_*`/`fbclid`/#fragment）、重复 GUID 与跨轨同事件（无论 CN 在前或 Global 在前）均稳定归并并优先保留 `global` 一手原链，同时保留「AI+2026」负例不误并；缺失 `whitelist-cn.yaml` 时 `runDailyPipeline` 降级返回 `partial` 且产出合法 `DailyBundle`，`global.json` 损坏时 `runCuratePipeline` 正常降级；高热度（`heat_score >= 80`）、高风险法律、多源交叉报道与超长法规均正确进入 `wechat-topic-pool` 并通过独立 `Ajv` 校验，低热度单源短讯被过滤；`aihot.news` 仅取 `links.original` 回溯外域正文，自指链接拦截、非法律噪音过滤、严禁抄录 AIHOT 摘要哨兵串，且 7 天 TTL 清理与 `.cache/raw/` 隔离生效。 |
| **双端一键导出 CLI 与防绕过门禁**（Suite 3） | `LD-G2-05` 确定性、D-030、V16 兼容、Fail-Closed | 两次 CLI 构建 7 个哈希全部一致；3 期公众号 HTML **零 `<table>`/`<a href>`/`<style>`/`<script>`/`class=`/`<link>`/`@font-face`/`backdrop-filter`/`box-shadow`/`border-radius`**，全区块保留 `#D5C5AE` 与 `margin: 0`，含 `今日综述` / `本期目录 · CONTENTS` / 5 处 `插画由 AI 生成` / 8 处 `实务影响` / `阅读原文`，且无 `legal_commentary` 泄露；Web JSON 与 `editions-index.json` 完整包含 V16 原型所需全部字段（`recent_keys` 3 日降序 + `2026-W48` 精选 6 条）及 Gate 2 `detail_analysis` 与 `sourceUrl`；混合状态 `--approved-only` 仅导出 `approved` 条目；全 `pending` + `--approved-only`、未注册 `source_id`、空 `repoRoot`、`--skip-whitelist-check` 与含禁用全文字段 JSON 均 **fail-closed 退出且零空目录残留**。 |

---

## 三、按严重程度排序的发现（S1 / S2 / S3）

> 按任务硬红线，本交叉测试**未修改任何被测业务代码、契约、文档基线或样本数据**；所有发现客观记录上报。

### S1（阻断性缺陷）
- 无（0 项）。

### S2（重要缺陷）
- 无（0 项）。

### S3（轻微观察与跨文件同步提示，不阻断）
1. **跨文档口径漂移（沿用 `LD-G2-05` R1/R2 ST04）**：[candidate-item.schema.json](../../schemas/candidate-item.schema.json)、[stage2-dual-layer.md](../../prompts/stage2-dual-layer.md)、[output-spec.md](../../prompts/output-spec.md) 与 [HUMAN_REVIEW_SOP.md](../../docs/sop/HUMAN_REVIEW_SOP.md) 均已按 `LD-G2-04` Option B 锁定为 `key_points` **1–3 段、各段合计 ≤600 字**；但 [0002-fact-tier-and-no-fulltext.md](../../docs/adr/0002-fact-tier-and-no-fulltext.md)（第 12 行）与 [gate2-data-contract-v1.md](../../docs/contracts/gate2-data-contract-v1.md)（第 31 行）仍保留早期“3–5 条（8–140 字）”表述。另 [types.d.ts](../../src/contracts/types.d.ts) 第 62 行仍将 `CandidateItem.detail_analysis` 标为必填，未体现 Stage 1 `pending_review` 允许缺省（`LD-G2-01` R2-ST01）。
2. **`trial-20261126-05` 主机名 `www.` 前缀差异与占位详情链接**：[2026-11-26.json](../../data/bundles/2026-11-26.json) 第 5 条（`cn-junhe-reviews`）的 `source_url` 主机名为 `junhe.com`，`source_domain` 记为 `www.junhe.com`（两者归属同一主域 `junhe.com`）；3 期样本 `meta.web_detail_url` 均使用 `https://lexaidaily.example/d/<date>` 占位地址（样本已标 `internal: true`，Gate 3 公开导出前须替换为正式域名）。
3. **公众号内联模板固定渲染「· AI 初稿」角标**：3 期试运行样本中每期第 01 条头条均已人工解除初稿状态（`practice_impact_is_ai_draft: false`、`detail_analysis.ai_draft: false`），但 Gate 1 模板 [template.html](../../design/wechat/template.html) 第 515 行固定输出 `实务影响 · AI 初稿`（不随 `practice_impact_is_ai_draft` 隐藏）。该行为属于保守多标，不违反“未终审必须标注”红线；Gate 3 若需精简头条角标可再扩展模板参数。
4. **Web V16 静态原型尚未接入动态 `editions-index.json`**：`dual-export.mjs` 产出的 Web 数据包字段与 [index.html](../../design/prototype/index.html)（V16）卡片及弹窗完全兼容，但 V16 当前仍内置 2026-11-22 静态占位数组且弹窗外链仅拼接 `https://${item.sourceDomain}`（Gate 3 前端工程化接入 `editions-index.json` 与 `item.sourceUrl` 即可打通）。
5. **治理看板与审计草稿待收口**：[STATUS.md](../../docs/coordination/STATUS.md) 当前仍停留在 2026-11-26（Gate 1 收口态），[docs/audits/README.md](../../docs/audits/README.md) 中 `LD-G2-03-dsh-audit-r1.md` 仍记为“待补原稿”，可交协调者在 `LD-G2-07`（Issue [#45](https://github.com/fitalex/LexAIDaily/issues/45)）统一刷新。

---

## 四、未检查项与外部验收边界

1. **真实 LLM API 在线调用**：未传入真实 `DEEPSEEK_API_KEY` / `OPENAI_API_KEY`，未调用付费外部推理服务；管线交叉测试基于离线确定性路径与可控桩函数完成。
2. **实时公网源抓取**：本交叉测试未向 26 个外部白名单站点发起真实 HTTP 请求；公网可达性参考 `LD-G2-02` R6（`npm run smoke:sources` 25/26 & 26/26）与 `LD-G2-05` R2（24 条链接 23 条 HTTP 200 + 1 条 KWM 403 反爬）实测档案。
3. **微信后台粘贴与手机端真机渲染 / 浏览器 DOM 实跑**：未登录微信公众号后台粘贴 3 期导出 HTML，亦未在无头浏览器中挂载 `editions-index.json` 运行 V16 DOM 交互测试。
4. **CI 状态**：**CI 未触发**（仓库当前未配置 `.github/workflows/`）。

---

## 五、交付边界声明

- 本 PR 仅包含 `tests/cross-test/`（测试脚本与本报告）、[docs/gate2-index.md](../../docs/gate2-index.md) 及 [package.json](../../package.json) `scripts.test:cross`；`src/`、`schemas/`、`prompts/`、`data/`、`scripts/`、`design/`、`docs/adr/`、`package-lock.json`、`THIRD_PARTY_NOTICES.md`、`README.md`、`ROADMAP.md`、`AGENTS.md`、`GLOSSARY.md` 均 **100% 零改动**。
- 本 PR **不自行合并**，合并与 Gate 验收决定权归 Human Maintainer。
