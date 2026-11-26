# 复核与审计报告｜LD-G2-01（R2 增量复审）

- 类型：独立审计（R2 增量复审，`AGENTS.md` 6.1(d)(e)、6.2）
- 出具者：DeepSeek Harness｜日期：2026-11-26
- 审计对象：[PR #47](https://github.com/fitalex/LexAIDaily/pull/47)（`gemini/ld-g2-01-data-contract`）｜关联 Issue：[#39](https://github.com/fitalex/LexAIDaily/issues/39)｜基准 commit：`21d24da`（`main`）｜被审 head：`5c42d60392201d17e3b4b28749c089b7be07395c`
- R1 报告：[LD-G2-01-dsh-audit-r1.md](https://github.com/fitalex/LexAIDaily/blob/06158c11769d0ea84cf0caaa4a56c9fd4f841d00/docs/audits/LD-G2-01-dsh-audit-r1.md)（blob `1b9cbe3722bd8d5b3adf44dd58ca93e41ee6f5a2`，结论“需修改”）
- 检查范围：`4f93119..5c42d60` 全部 7 个变更文件（+386/−193）；四套 Schema、契约文档、`validate.mjs` / `types.d.ts`、12 项测试、LD-G1-04 夹具、`THIRD_PARTY_NOTICES.md` 对 `main` 的增量。本地复跑 `npm ci`、`node --test`、两条 CLI、`npm audit --registry=https://registry.npmjs.org`，并对 R1 的 S1/S2 逐项做正反例探针；把夹具 `source_id` 与 #48 实际 YAML 白名单交叉核验；检查 ajv/ajv-formats 的 license 链接可达性。
- 未检查项：未判定资讯事实真伪、法律结论或信源可信度（属 Human 与内容线）；未实现或运行采集器；未执行 #47+#48 的实际 rebase/合并（PR 正文已写明步骤，合并属 Owner/Human 操作）；未核验 Gate 3 Web/公众号消费端；未在 Windows 或 Node 22.12 最低版本复跑（本机 Node v22.22.3）；未改动或更正历史 `LD-G1-04` 样本文件中的 ILSD 链接。

## 一、DoD 逐项核对

| 序号 | 标准（Issue #39） | 结果 | 证据 |
|---|---|---|---|
| D01 | 四套 JSON Schema 与契约说明文档入库，完整覆盖预览层与 `detail_analysis` 详情层字段 | 达成 | 四套 schema + 契约文档 v1.0；文档新增三阶段生命周期、`cn.json`/`global.json` 为 `candidate-item[]`、`expected_domain` 作用域与 `$ref` 注册说明 |
| D02 | `ajv` 校验入口通过 `node:test` 正例与非法边界 | 达成 | `node --test`：12 pass / 0 fail；新增非法日期、AIHOT 主机、AI 初稿/头条、`high_risk_legal`、7 个禁用键（含嵌套/驼峰/大写）、非 HTTPS、`.cache/` 守卫等用例 |
| D03 | 用 Gate 1 `LD-G1-04` 映射样例跑通校验并记录真实命令输出 | 达成 | CLI `daily-bundle` 返回 `valid:true`；夹具 5 条、3 个唯一 `source_id` 全部存在于 #48 实际 YAML；ILSD 404 链接已移除，改用 arXiv 论文；5 条均为 `pending_review` |
| D04 | 经 DeepSeek Harness 独立审计通过，锁版本并登记 `THIRD_PARTY_NOTICES.md` | 达成 | 本轮 R2 结论“通过”；`npm ci` 安装 49 包；`npm audit --registry=…` 为 0 vulnerabilities；notices 对 `main` 零删行，ajv/ajv-formats 链接 pin 至 `v8.20.0` / `v3.0.1`（均 HTTP 200） |

## 二、R1 整改进度（逐项）

| R1 编号 | R1 级别 | R2 状态 | 证据 |
|---|---|---|---|
| ST01 | S1 | **已修复** | `git diff 21d24da..5c42d60 -- THIRD_PARTY_NOTICES.md` 的删除行为 0；shadcn MIT 全文恢复为 `...sublicense, and/or sell copies...`；未再夹带 Canvas UI 表述 |
| ST02 | S2 | **已修复** | 探针：`pending_review + headline=true`、`practice_impact_is_ai_draft=false`、`detail_analysis.ai_draft=false` 均被拒；`const` 错误定位到对应字段 |
| ST03 | S2 | **已修复** | `2026-99-99`、`2026-02-31`、`2026-13`、`2026-00` 被拒；`2026-11-24`、`2026-11`、`2026-11-24T08:00:00Z` 通过 |
| ST04 | S2 | **已修复** | `discovered_via=aihot-news-discovery + source_url=https://aihot.news/...` 被 `discoverySourceUrlForbidden` 拒收；`sub.aihot.news` 亦被拒；`aihot.news.evil.com` 不误伤 |
| ST05 | S2 | **已修复（当前数据）** | 夹具 3 个唯一 ID（`uk-ico-news`、`arxiv-cs-ai-rss`、`thomson-reuters-institute`）全部存在于 #48 实际 YAML；机制残留见 R2-ST02 |
| ST06 | S3 | **已修复** | force-add `.cache/other.txt` 后 `--check-cache` 返回 `valid:false` 并列出文件；已从 `git ls-files .cache` 覆盖整个缓存目录 |
| ST07 | S3 | **已修复** | `rawText`、`RAW-TEXT`、嵌套 `rawText` 均报 `forbiddenFulltextKey`；归一化大小写与 `_`/`-` 生效 |
| ST08 | S3 | **部分** | 文档已改为 `key_points` 8–140，与 schema 一致；分类/状态/长度仍多处重复，见 R2-ST05 |
| ST09 | S3 | **已修复** | `http://` 被拒；`source_url` 与 `web_detail_url` 均为 `^https://` |
| ST10 | S3 | **已修复** | 契约文档写明 `daily-bundle` 的 `$ref` 需先注册 `candidate-item`，或直接调用 `validate.mjs` |
| ST11 | S3 | **部分** | 测试从 12 项扩展出大量断言；仍缺 `.cache` 负例、实际 YAML 白名单加载等用例，见 R2-ST04 |
| ST12 | S3 | **已修复** | 夹具 5 条均 `pending_review`，不再用 `approved` 表达测试通过 |
| ST13 | S3 | **部分** | 引文定位已标注“合成测试样例，非原始正文逐字稿”；字段语义仍是摘要改写，见 R2-ST03 |
| ST14 | S3 | **已修复** | PR 正文补齐 DoD 表、CI 未触发声明、红线自查；合并步骤写明 |
| ST15 | S3 | **已修复（流程）** | PR 正文明确“先合 #47 → #48 rebase → 保留三项依赖 → `npm install` 重生成 lock → 重编号 notices”；实际冲突仍需按步骤执行 |
| ST16 | S3 | **已修复** | notices 明确记录 `npm audit --registry=https://registry.npmjs.org`，本机复跑为 0 vulnerabilities |
| ST17 | S3 | **已修复** | ajv/ajv-formats 许可链接 pin 至 `v8.20.0` / `v3.0.1`，实测 HTTP 200；ajv 49 包许可分布与 notices 一致 |
| SP01 | S2 | **已修复** | Stage 1 `pending_review` 可缺 `detail_analysis`；`approved` 与 `daily-bundle` 缺 detail 被拒；契约文档三阶段生命周期与机器化规则一致 |
| SP02 | S2 | **已修复** | `high_risk_legal:true` 且无 `effective_status` 被拒；提供 `effective_status` 后通过；与 #48 标准 T1 要求对齐 |
| SP03 | S2 | **已修复（夹具）** | ILSD 404 PDF 已从夹具移除，改用 Gate 1 第 12 条 arXiv 论文；历史样本文件的更正仍待 Human 单独决定 |
| SP04 | S3 | **已修复** | 7 个禁用键逐一测试，含嵌套与 camelCase/大写变体 |
| SP05 | S3 | **已修复** | 契约文档 `key_points` 改为 8–140，与 schema 一致 |
| SP06 | S3 | **部分** | 文档改称“1–3 条”/“句数由 Stage 2 校验”，schema 仍不约束句数；属可接受的阶段分工，见 R2-SP02 |
| SP07 | S3 | **已修复** | 文档明确 `cn.json` / `global.json` 为 `candidate-item[]` |
| SP08 | S3 | **已修复** | 文档写清 `expected_domain` 只约束抓取入口，`source_url` 指向文章原链（含 arXiv feed/article 异域示例） |
| SP09 | S3 | **已修复** | PR 正文含 DoD 表、ROADMAP 映射与 CI 声明 |

## 三、双轴发现（R2 新增/残留）

### 3.1 Standards 轴（仓库规范违背 & Fowler 代码坏味道基线）

| 编号 | 级别 | 类型 | 位置 | 问题与依据 | 建议 |
|---|---|---|---|---|---|
| R2-ST01 | S3 建议 | 规范违背（类型与运行时漂移） | `src/contracts/types.d.ts:62` | Schema 已允许 Stage 1 `pending_review` 缺省 `detail_analysis`，但 TS 接口仍为必填 `detail_analysis: DetailAnalysis`；TS 消费者无法表达合法 Stage 1 对象。 | 改为 `detail_analysis?: DetailAnalysis`；对 `approved`/`daily-bundle` 用类型守卫或独立类型表达必填。 |
| R2-ST02 | S3 建议 | 规范违背（测试未读实际白名单） | `tests/contracts/validate.test.mjs:27,47` | `KNOWN_WHITELIST_IDS` 是 4 个硬编码 ID 的子集，不是 `data/sources/*.yaml`；#48 若改名/删除源，本测试仍通过。当前夹具 3 个 ID 已与 #48 实际 YAML 对齐（R2 实测）。 | 测试直接加载 #48 两份 YAML，构造 allowed set 后再调用 `validateSourceIdAgainstWhitelist()`。 |
| R2-ST03 | S3 建议 | 规范违背（引文字段语义） | 夹具各 `evidence_quotes.locator` | 已标注“合成测试样例，非原始正文逐字稿”，比 R1 更诚实；但 `evidence_quotes` 的字段语义仍是逐字原文短引文，夹具用摘要改写会让下游误学。 | 改用真实原文短句（可加 synthetic 标记），或把夹具放到 `tests/fixtures/README` 说明“不得复用为内容生产示例”。 |
| R2-ST04 | S3 建议 | 规范违背（负例测试缺口） | `tests/contracts/validate.test.mjs` | `.cache` 守卫已修好，但测试只跑正例；force-add `.cache/other.txt` 的负例未固化为回归。 | 增加临时 Git 索引/独立夹具的负例，或至少在测试注释中记录手工验证命令。 |
| R2-ST05 | S3 建议 | 坏味道（重复字面量） | schemas、`types.d.ts`、tests、契约文档 | 五维分类、审查状态、事实层级、长度限值仍多处手工重复；本次已出现一次文档漂移，靠人工同步。 | 共享常量或由 schema 生成 types；至少加一致性测试。 |
| R2-ST06 | S3 建议 | 规范违背（并行合并） | `package.json`、`package-lock.json`、`THIRD_PARTY_NOTICES.md` | 两 PR 仍改同一文件；PR 正文已给出正确的 rebase/lock/重编号步骤，但本轮未实际执行，合并时仍会产生冲突。 | 合并时严格按 PR 正文步骤执行，并复跑两套测试；不要把“步骤已写明”当成“合并已验证”。 |

### 3.2 Spec 轴（原 Issue/任务书遗漏、偏差与范围蔓延）

| 编号 | 级别 | 类型 | 位置 | 问题与原需求引用 | 建议 |
|---|---|---|---|---|---|
| R2-SP01 | S3 建议 | 偏差（历史样本） | `docs/samples/LD-G1-04-sample-set.md` 第 10 条 | 历史样本中的 ILSD PDF 仍为 404；本 PR 已把夹具替换为 arXiv 第 12 条并提示 Human，未越界改历史文件。 | 由 Human 决定是否更正历史样本；本 PR 不阻断。 |
| R2-SP02 | S3 建议 | 偏差（“句”未建模） | 契约文档 §2.2/§2.3；schema | “1 句”/“1–3 句”已改为“1–3 条”并把句数交给 Stage 2；schema 仍不约束句数。属合理的阶段分工，但需在 Stage 2 任务书落实。 | 在 Gate 2 Stage 2 提示词/校验任务中加句数回归；当前文档已说明。 |

## 四、证据与红线核验

- **命令与 commit 对应**：是。所有命令在 `pr47r2` worktree 的 `5c42d60` 上执行；`npm ci` 安装 49 个包；`node --test tests/contracts/*.test.mjs` 为 12 pass / 0 fail；CLI `daily-bundle` 与 `--check-cache` 均 `valid:true`。
- **R1 关键约束探针**：`pending_review + ai_draft=false` / `practice_impact_is_ai_draft=false` / `headline=true` 均被拒；`approved` 缺 detail、`high_risk_legal` 缺 effective_status、`aihot.news` source_url、`http://`、`2026-02-31`、`2026-99-99` 均被拒；Stage 1 pending 缺 detail 通过；`daily-bundle` 缺 detail 被拒。
- **白名单交叉核验**：夹具 3 个唯一 `source_id` 全部存在于 #48 实际 `whitelist-cn.yaml` / `whitelist-global.yaml`；`validateSourceIdAgainstWhitelist` 对未知 ID 返回 false。
- **`.cache` 守卫**：force-add `.cache/other.txt` 后 `--check-cache` 返回 `valid:false`，`trackedFiles` 列出该文件。
- **许可与依赖**：notices 对 `main` 零删行；shadcn MIT 原文恢复；ajv/ajv-formats 链接 `v8.20.0` / `v3.0.1` 均 200；49 包许可分布与 notices 一致；`npm audit --registry=https://registry.npmjs.org` 为 0 vulnerabilities。
- **CI**：`gh pr checks 47` 为 `no checks reported`；仓库无 `.github/workflows`；PR 正文已明确写“CI 未触发（仓库无 workflow）”，不再隐瞒。
- **冻结基线 / 密钥 / AI 初稿**：未改 `README.md`、`ROADMAP.md`；未发现密钥或读者数据；夹具 AI 初稿标记与 `pending_review` 一致；未发现新的范围外改动。

## 五、建议结论

- **单行汇总**：Standards 轴 6 项（全部 S3，最重：`R2-ST01` 类型漂移）｜Spec 轴 2 项（全部 S3，最重：`R2-SP01` 历史样本链接）。
- **结论**：**通过**。R1 的 S1（ST01）与全部 S2（ST02–ST05、SP01–SP03）均已修复并有可复跑证据；R2 仅剩 8 项 S3 建议，不阻断合并。合并前应按 PR 正文执行 #47→#48 的 rebase/lock/重编号步骤。

本意见只构成证据，不自动产生权限；合并与最终决定属于 Human Maintainer。

## 六、Human 决策清单

- **工作目标**：决定是否接受 R2 “通过”结论并合并 PR #47；确认 R2 的 S3 建议是否作为后续清理项。
- **工作链接**：[PR #47](https://github.com/fitalex/LexAIDaily/pull/47)、[Issue #39](https://github.com/fitalex/LexAIDaily/issues/39)、[Spec #38](https://github.com/fitalex/LexAIDaily/issues/38)；R2 归档 permalink/blob SHA 见 PR #47 通知评论。
- **执行步骤**：
  1. [ ] 阅读 R2 报告与 PR #47 整改回应，确认 S1/S2 已闭环。
  2. [ ] 决定是否要求先处理 R2 的 8 项 S3（类型漂移、白名单测试硬编码、夹具引文语义等），或登记为后续清理。
  3. [ ] 合并 #47 前确认 #48 的 rebase/lock/notices 重编号步骤已写入合并计划。
  4. [ ] 核对 R2 归档文件与 PR 评论原文、blob SHA 一致后，再决定合并。
- **边界**：AI 不得代签、代批、自动合并；本报告与 PR 评论只构成证据，不构成 Human 批准。
