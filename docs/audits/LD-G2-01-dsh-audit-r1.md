# 复核与审计报告｜LD-G2-01

- 类型：独立审计（架构内交叉独立审计，`AGENTS.md` 6.1(d)(e)、6.2）
- 出具者：DeepSeek Harness｜日期：2026-11-26
- 审计对象：[PR #47](https://github.com/fitalex/LexAIDaily/pull/47)（`gemini/ld-g2-01-data-contract`）｜关联 Issue：[#39](https://github.com/fitalex/LexAIDaily/issues/39)｜基准 commit：`21d24da`（`main`）｜被审 head：`4f93119f3df2d599099fd7f01f67341dc49c578a`
- 检查范围：PR 全部 13 个文件（+1489/−5）；四套 JSON Schema、契约文档、`ajv` 校验入口与 CLI、`types.d.ts`、12 项 `node:test`、LD-G1-04 映射夹具、`.gitignore`、`package.json` / `package-lock.json`、`THIRD_PARTY_NOTICES.md`。本地复跑 `npm ci`、`node --test tests/contracts/*.test.mjs`、两条 CLI 命令、`npm audit`，并做边界/越权探针与 #47+#48 顺序合并试验；对照 Issue #39、Spec #38、`GLOSSARY.md`、`ADR-0002` / `ADR-0003`、`ROADMAP.md` Gate 2、PR 模板与 `AGENTS.md`。
- 未检查项：未判定资讯事实真伪、法律结论或信源可信度（属 Human 与内容线）；未实现或运行采集管线（本 PR 不含）；未验证 Gate 3 Web/公众号消费端；未逐份阅读 49 个锁文件依赖的 LICENSE 原文（仅核 `package.json` 的 `license` 字段、锁文件与 `npm audit`）；未在 Windows 或 Node 22.12 最低版本复跑（本机 Node v22.22.3）；Clio 链接返回 403 反爬，未能核验正文；`www.ilsd.uscourts.gov` 的 PDF 已 404（见 SP03）；仓库无 GitHub Actions workflow，无法核验 CI。

## 一、DoD 逐项核对

| 序号 | 标准（Issue #39） | 结果 | 证据 |
|---|---|---|---|
| D01 | 四套 JSON Schema 与契约说明文档入库，完整覆盖预览层与 `detail_analysis` 详情层字段 | 达成 | 4 个 schema + `docs/contracts/gate2-data-contract-v1.md` 均在；程序检查全部 `type: object` 均有 `additionalProperties: false`；保留项见 SP01、SP02 |
| D02 | `ajv` + `ajv-formats` 校验入口通过 `node:test` 正例与非法边界（超 160 字、短引文超限、含原文全文字段、缺一手 URL、缺事实层级均拒收） | 达成 | `node --test`：12 pass / 0 fail；CLI：`{"valid":true}`；边界探针通过；未覆盖项见 ST11、SP04 |
| D03 | 用 Gate 1 `docs/samples/LD-G1-04-sample-set.md` 映射样例跑通校验并记录真实命令输出 | 达成 | `node src/contracts/validate.mjs daily-bundle tests/contracts/fixtures/ld-g1-04-mapped-bundle.json` 返回 `valid:true`；夹具溯源问题见 ST05、ST12、ST13、SP03 |
| D04 | 经 DeepSeek Harness 独立审计通过，锁版本并登记 `THIRD_PARTY_NOTICES.md` | 未达成 | 锁版本与登记已完成，但本轮审计为“需修改”；阻断项 ST01，重要项 ST02–ST05 等 |

> 对应 `ROADMAP.md` Gate 2 交付成果 1 & 4、验收标准 1 & 3：本 PR 只交付契约与校验接缝，验收标准 1（候选条目 100% 一手链接）与 3（SOP 一键生成）仍需采集管线与 SOP 实现，无法在本 PR 单独判定。

## 二、双轴发现（分轴报告，不跨轴合并重排）

### 2.1 Standards 轴（仓库规范违背 & Fowler 代码坏味道基线）

| 编号 | 级别 | 类型 | 位置 | 问题与依据 | 建议 |
|---|---|---|---|---|---|
| ST01 | S1 阻断 | 规范违背（第三方许可 / 越界修改） | `THIRD_PARTY_NOTICES.md:208`（PR head） | 第 3 节 MIT 许可证（Tailwind CSS / Radix UI / shadcn/ui）全文被替换为 Canvas UI 的受限表述：删掉 `sublicense, and/or sell`，改成 `as part of an application, website, or product` 并附加条件。基准 `21d24da` 的原文为 `...sublicense, and/or sell copies...`。该改动与 LD-G2-01 无关，PR #48 同一位置也有同一改动，属任务范围外的第三方许可事实错误，违反 `AGENTS.md` 6.1(c) 与 10.7。 | 从 `21d24da` 恢复被改的三行原文；#47 与 #48 各自修复；复核 diff 不再包含该 hunk。 |
| ST02 | S2 重要 | 规范违背（6.1(e) / `AGENTS.md` 10.8 / D-019） | `schemas/candidate-item.schema.json:103,153,212`；测试 | 实测 `review_status: "pending_review"` 时，`practice_impact_is_ai_draft: false`、`detail_analysis.ai_draft: false`、`headline: true` 三者均可通过校验。D-019 规定头条只能由 Human 终审勾选，10.8 规定 Human 确认前必须标“AI 初稿”；契约只写描述、未机器化。 | 用 JSON Schema `if/then`：`pending_review` → 两个 AI 标记必须为 `true`、`headline` 必须为 `false`；`approved` 时按人工流程置位；补回归测试。 |
| ST03 | S2 重要 | 规范违背（日期真实性） | `schemas/candidate-item.schema.json:66` | `published_at` 只用正则，实测 `2026-99-99`、`2026-02-31` 均通过；发布日期是“无法核实日期须标 `unverified`”与一手溯源的核心字段。 | 改用 `format: date` / `date-time`（或自定义日历校验）；保留“年-月”兼容时单独定义并测试非法日期。 |
| ST04 | S2 重要 | 规范违背（AIHOT 合规红线） | `schemas/candidate-item.schema.json:60`；`src/contracts/validate.mjs:70` | 实测 `discovered_via: "aihot-news-discovery"` + `source_url: "https://aihot.news/items/..."` 可通过校验。这直接违反“仅取 `links.original` 回溯一手原链、绝不搬运或再分发 AIHOT 摘要”的书面红线；契约未把该约束机器化。 | 在校验入口拒绝 `source_url` 主机为 `aihot.news`（或任何 discovery 源域）；要求 `discovered_via` 存在时 `source_url` 为外域一手链接；补测试。 |
| ST05 | S2 重要 | 规范违背（白名单引用完整性） | `tests/contracts/fixtures/ld-g1-04-mapped-bundle.json:57,131,168`；`validate.mjs` | 夹具 5 条中 3 条的 `source_id` 不在 #48 白名单：`arxiv-cs-ai`（白名单为 `arxiv-cs-ai-rss`）、`clio-press`、`us-ilsd-court`。`source_id` 未与 YAML 做任何引用校验，`source_url` 也可指向任意主机；“白名单信源唯一标识”的语义未被守住。 | 对齐 `source_id`；增加跨文件测试（candidate 的 `source_id` ∈ 白名单）；在契约中写清 `source_url` 与 `expected_domain` 的作用域（见 SP08）。 |
| ST06 | S3 建议 | 规范违背（原始缓存守卫范围） | `src/contracts/validate.mjs:146-186` | 实测 `git add -f .cache/raw/leak.txt` 会被正确拒绝；但 `git add -f .cache/other.txt` 仍返回 `valid:true`，因为守卫只跑 `git ls-files .cache/raw`。`AGENTS.md` 8.2 的红线是“原文全文不入库”，不只 `raw/` 子目录。 | 改为 `git ls-files .cache`（或同时检查 `.cache` 全部路径）；补“raw 外仍被追踪”的测试。 |
| ST07 | S3 建议 | 坏味道（脆弱的禁用键扫描） | `validate.mjs:13-21,70-86` | 禁用键仅 7 个 snake_case、大小写敏感；当前靠每个对象 `additionalProperties: false` 兜底。若未来为元数据放宽属性，扫描即失效；`rawText` 只会报 `additionalProperties`，不会报 `forbiddenFulltextKey`。 | 归一化键名（小写/去分隔符）或正则匹配；在文档中写明“扫描是兜底，schema 收紧才是主防线”；补 camelCase/大写测试。 |
| ST08 | S3 建议 | 坏味道（重复字面量 / 散弹式修改） | schemas、`src/contracts/types.d.ts`、tests、契约文档 | 五维分类、事实层级、审查状态、长度限值在 4 处手工重复；已出现文档 `key_points` “10–140 字”与 schema `minLength: 8` 的漂移。 | 单一事实源（共享常量或由 schema 生成 types），至少加“文档 vs schema”一致性测试；修正文档。 |
| ST09 | S3 建议 | 规范违背（协议不一致） | `schemas/candidate-item.schema.json:60` vs #48 白名单 | 契约允许 `http://`，白名单标准要求全部 `https://`；一手链接的协议策略不一致。 | 统一为 `https`（必要时列明例外），并在校验与测试中体现。 |
| ST10 | S3 建议 | 坏味道（伪域名 `$id` 耦合） | `schemas/daily-bundle.schema.json` 的 `$ref` | `$ref` 指向 `https://lexaidaily.local/schemas/candidate-item.schema.json`；外部消费者单独加载 `daily-bundle` 无法解析，只有先注册全部 schema 的 `validate.mjs` 才可用。 | 在契约中写明 resolver/注册顺序；或改用相对 `$ref` 并随包提供；补“standalone 加载”测试。 |
| ST11 | S3 建议 | 规范违背（测试证据不足） | `tests/contracts/validate.test.mjs` | 缺：`key_points` 6 条/2 条、缺 `detail_analysis`、缺 `ai_draft`/`practice_impact_is_ai_draft`、非法日期、AIHOT 主机、`source_id` 白名单等用例；正例未覆盖 160/60/150/200/400 的精确边界。 | 每条 S1/S2 约束至少一个正反例；补齐边界与跨字段用例。 |
| ST12 | S3 建议 | 规范违背（夹具语义） | `tests/contracts/fixtures/ld-g1-04-mapped-bundle.json:37,74,111,148,186` | 5 条均 `review_status: "approved"`，而样本集声明“内部评审、不对外发布、AI 初稿未经 Human 确认”；夹具易被误读为已获人工批准。 | 改为 `pending_review`，或加 `synthetic: true` 并注明“approved 仅用于测试状态枚举”。 |
| ST13 | S3 建议 | 规范违背（引文逐字性） | 夹具各 `evidence_quotes.locator` | `locator` 自述“LD-G1-04 样本 #NN 核验摘要”，引文是摘要改写而非逐字原文；与字段语义“逐字合规原文短引文”不符。作为唯一验收夹具，会误导下游实现。 | 换成真实原文短句（可标 synthetic），或明确写“非逐字示例，不得复用”。 |
| ST14 | S3 建议 | 规范违背（PR 模板 / CI） | PR #47 body | 缺 DoD 逐项表、CI 链接或“CI 未触发（原因）”、红线自查；`gh pr checks 47` 显示 `no checks reported`，仓库无 `.github/workflows`，PR 未记录“未触发”。 | 按 `.github/PULL_REQUEST_TEMPLATE.md` 补全；明确写“CI 未触发（仓库无 workflow）”。 |
| ST15 | S3 建议 | 规范违背（并行合并证据） | `package.json`、`package-lock.json`、`THIRD_PARTY_NOTICES.md` | 与 #48 同时改 `package.json` 的 description/scripts、lock、notices 行 12–13 与 `### 5.`。实测先合 #47 再合 #48 产生 3 个冲突；按“两份依赖都保留”合并后 `npm ci` 报 `Missing: js-yaml@5.5.0 / argparse@3.0.4`。PR body 的“先合其一后另一 PR 仅需做增量合并即可”不足以指导操作。 | 定合并顺序；后合者 rebase 后执行 `npm install` 重生成 lock；notices 重新编号；在 PR 写明步骤与验证命令。 |
| ST16 | S3 建议 | 规范违背（证据可复现） | `THIRD_PARTY_NOTICES.md` 表格序号 12（`ajv` 行） | 本机默认镜像执行 `npm audit` 返回 `NOT_IMPLEMENTED`；只有 `npm audit --registry=https://registry.npmjs.org` 才得到 `found 0 vulnerabilities`。PR 与 notices 未记录 registry，命令不可按原文复现。 | 记录完整命令与 registry；或固定 npmjs registry。 |
| ST17 | S3 建议 | 规范违背（许可证据未 pin） | `THIRD_PARTY_NOTICES.md` 表格序号 12–13 | 许可证据链接指向 `master`，不是 `v8.20.0`/`v3.0.1` 的 tag 或 commit；B 级依赖登记应可复现。 | 指到对应 tag/commit；补读取日期。 |

### 2.2 Spec 轴（原 Issue/任务书遗漏、偏差与范围蔓延）

| 编号 | 级别 | 类型 | 位置 | 问题与原需求引用 | 建议 |
|---|---|---|---|---|---|
| SP01 | S2 重要 | 偏差（生命周期未定义） | `schemas/candidate-item.schema.json:161`；契约文档 §1 | Issue #39 定义 candidate-item 为“支持双轨采集输出与汇流”的候选条目；但 `detail_analysis` 是必填，采集 Stage 1/Stage 2 之前的 payload 无合法形态，契约未写“何时填充、是否允许缺省”，与 ADR-0002 两阶段流程不一致。 | 允许 `detail_analysis` 在采集阶段缺省（配合 `review_status`/阶段字段），或拆出 `collected-item` schema；在契约写明生命周期。 |
| SP02 | S2 重要 | 遗漏（跨 PR 标准） | `schemas/candidate-item.schema.json:132`；#48 标准 §2 | #48 的准入标准要求 T1 信源“必核发布机构、日期、版本号与 `effective_status`”，本契约把 `effective_status` 设为可选；实测 `high_risk_legal: true` 且无 `effective_status` 可通过。 | 加 `if/then`：`high_risk_legal: true` 时要求 `effective_status`（或 `effective_status_checked`）；或由白名单 tier 注入后校验。 |
| SP03 | S2 重要 | 偏差（一手链接可验证性） | `tests/contracts/fixtures/ld-g1-04-mapped-bundle.json:131-134` | `https://www.ilsd.uscourts.gov/sites/ilsd/files/Rosenstengel.pdf` 在本机 2026-11-26 实测 404；夹具仍标 `unverified: false`、`fact_tier: "official_data"`、`review_status: "approved"`。与 `AGENTS.md` 10.9、8.2“链接可访问不等于信息准确”及 LD-G1-04 样本集“全部已实际打开”的声明冲突。 | 更新为现行官方链接，或标 `unverified: true` / `needs_human_check: true`；把 LD-G1-04 该条链接的更正建议单列给 Human（不改本 PR 之外的历史文件）。 |
| SP04 | S3 建议 | 遗漏（验收覆盖） | `tests/contracts/validate.test.mjs` | Issue #39 验收要求“含原文全文字段”拒收；测试只覆盖 `raw_text` / `full_text` / `body_html` 3 个键，其余 4 个（`html_content`、`raw_html`、`full_content`、`article_body`）未测。 | 参数化覆盖全部 7 个键，并覆盖嵌套位置。 |
| SP05 | S3 建议 | 偏差（文档 vs schema） | 契约文档 §2.2 vs `schemas/candidate-item.schema.json:171-180` | 文档写 `key_points` 每条 10–140 字，schema 为 `minLength: 8`；同一契约两处不一致。 | 统一为 10–140，或改文档为 8–140 并说明理由。 |
| SP06 | S3 建议 | 偏差（“句”未建模） | `schemas/candidate-item.schema.json:97,182` | `practice_impact_brief` 要求“1 句”、`evidence_quotes` 要求“1–3 句”，但 schema 只约束数组元素数与字数；单个元素含多句仍通过。 | 明确按“条/段”表述，或把句数校验放到 Stage 2 并写入契约。 |
| SP07 | S3 建议 | 遗漏（分区文件契约） | ADR-0003；四套 schema | ADR-0003 规定采集器输出 `cn.json` / `global.json`，四套 schema 没有对应分区文件/数组的契约；只有单条 `candidate-item` 与 `daily-bundle`。 | 增加分区文件 schema，或在契约中明确 `cn.json`/`global.json` 为 `candidate-item[]`。 |
| SP08 | S3 建议 | 偏差（作用域未写清） | `schemas/candidate-item.schema.json:60`；#48 `expected_domain` | `source_url` 允许任意主机；#48 对白名单入口做 `expected_domain` 主机校验。arXiv 的 feed 在 `rss.arxiv.org`、文章在 `arxiv.org`，AIHOT 原链又在外部域，说明两者作用域未写清。 | 在契约中明确：`expected_domain` 只约束白名单抓取入口；`source_url` 只做一手性/协议校验（并配合 ST04 的 discovery 域拒绝）。 |
| SP09 | S3 建议 | 遗漏（DoD 映射） | PR #47 body | 未按 Issue #39 的 4 条 AC 给出逐项状态，也未映射 Gate 2 交付成果 1 & 4 / 验收标准 1 & 3。 | 补 DoD 表与 ROADMAP 映射。 |

## 三、证据与红线核验

- **命令与 commit 对应**：是。所有命令在 `pr47` worktree 的 `4f93119` 上执行；`npm ci` 安装 49 个包；`node --test tests/contracts/*.test.mjs` 为 12 pass / 0 fail；两条 CLI 均返回 `valid: true`。
- **依赖与许可证据**：`package-lock.json` 49 个锁文件包，`license` 分布实测为 MIT 30、BSD-2-Clause 12、MIT-0 3、ISC 2、BSD-3-Clause 2，与 notices 表格序号 12 一致；`npm audit --registry=https://registry.npmjs.org` 为 `found 0 vulnerabilities`（默认镜像不可用，见 ST16）。**但** shadcn 许可全文被改写（ST01），故 D04 不通过。
- **边界/越权探针**：`published_at=2026-99-99`、`published_at=2026-02-31`、`pending_review + ai_draft=false`、`pending_review + practice_impact_is_ai_draft=false`、`pending_review + headline=true`、`discovered_via=aihot-news-discovery + source_url=aihot.news`、`source_id=not-in-whitelist`、`high_risk_legal=true` 且无 `effective_status`、`source_url=http://...` 均返回 `valid: true`；`key_points` 6 条、`evidence_quotes` 4 条、`summary` 161 字、`evidence_quotes` 151 字、`legal_commentary` 199/401 字均被拒收。
- **来源链接抽查**：夹具 5 条中，ICO 200、arXiv 200、Thomson Reuters 200、Clio 403（反爬，无法核验正文）、ILSD PDF 404（SP03）。未把 Clio 403 当作链接失效。
- **CI**：`gh pr checks 47` 为 `no checks reported`；仓库无 `.github/workflows`；PR 未写“CI 未触发”。按 `AGENTS.md` 10.5，不得写成通过。
- **冻结基线 / 密钥 / AI 初稿**：未改 `README.md`、`ROADMAP.md`；未发现密钥或读者数据；夹具文本含“【AI 初稿】”，但契约未机器化 AI 标记与头条规则（ST02）。`headline` 在夹具中均为 `false`，符合 D-019 的示例方向。
- **合并试验**：#47 + #48 顺序合并产生 `THIRD_PARTY_NOTICES.md`、`package-lock.json`、`package.json` 三处冲突；两份依赖都保留时 `npm ci` 失败（ST15）。

## 四、建议结论

- **单行汇总**：Standards 轴 17 项（最重：`ST01 S1` 第三方许可全文被改写）｜Spec 轴 9 项（最重：`SP01`/`SP02`/`SP03` S2）。
- **结论**：**需修改**。核心 schema 与 12 项测试可复跑通过，但 S1 许可事实错误必须先恢复原文；AI 初稿/头条、发布日期、AIHOT 红线、白名单引用完整性等 S2 约束未机器化，尚不足以作为 Gate 2 正式契约合并。

本意见只构成证据，不自动产生权限；合并与最终决定属于 Human Maintainer。

## 五、Human 决策清单

- **工作目标**：决定是否接受本审计意见，是否要求原 Owner（Gemini）在 PR #47 修复 S1/S2 后再合并；并决定 ILSD 链接与 LD-G1-04 样本更正的处理方式。
- **工作链接**：[PR #47](https://github.com/fitalex/LexAIDaily/pull/47)、[Issue #39](https://github.com/fitalex/LexAIDaily/issues/39)、[Spec #38](https://github.com/fitalex/LexAIDaily/issues/38)；本报告归档 PR 的 permalink 与 blob SHA 见 PR #47 通知评论。
- **执行步骤**：
  1. [ ] 阅读本报告，确认 S1（ST01）是否作为合并前必须修复项。
  2. [ ] 在 PR #47 评论中要求原 Owner 修复 ST01–ST05 与 SP01–SP03；其余 S3 可一并处理或登记后续。
  3. [ ] 修复后要求 DeepSeek Harness 增量复审（新文件 `LD-G2-01-dsh-audit-r2.md`，不改本文件）。
  4. [ ] 核对归档文件与 PR 评论原文、blob SHA 一致后，再决定合并或退回。
  5. [ ] 单独决定 ILSD 404 链接与 LD-G1-04 样本集的更正（本 PR 之外的历史文件）。
- **边界**：AI 不得代签、代批、自动合并；本报告与 PR 评论只构成证据，不构成 Human 批准。
