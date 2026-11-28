# 复核与审计报告｜LD-G2-05（R2 增量复审）

- 类型：独立审计（R2 增量复审）
- 出具者：DeepSeek Harness｜日期：2026-11-28
- 审计对象：[PR #65](https://github.com/fitalex/LexAIDaily/pull/65)（分支 `gemini/ld-g2-05-dual-export`）｜关联 Issue：[#43](https://github.com/fitalex/LexAIDaily/issues/43)（Parent [#38](https://github.com/fitalex/LexAIDaily/issues/38)）｜基准 `origin/main@e4f6b81f2866eb6083970bce4b5e0de2bb3af260`；R1 已审 HEAD `a44bc3a49bae80ddbe981ae992c8db2b3912fd3e`；**R2 待审 HEAD `11660b38d338138ba42f5182affeb36a4abde66e`**
- 检查范围：在干净克隆 `/tmp/lexai-g2-05-audit`（detached HEAD `11660b3`，`git status` 干净）中检查 `a44bc3a..11660b3` 全部 7 个变更文件；执行 `npm ci`；按用户指定顺序先 `TZ=Asia/Shanghai npm test` 再 `npm run validate:contracts`；两次 `npm run export:dual -- --in-dir data/bundles --out-dir /tmp/... --approved-only`；逐字节核对 3 期 WeChat/Web 与 `editions-index.json` 哈希；对 24 条样本做 Schema/白名单/文章级 URL/长度/哨兵核验；执行 ST01、S3-1 针对性探针；检查依赖与 Gate 1 冻结文件。
- 未检查项：未调用真实 LLM（无密钥、无付费外部服务）；未在微信公众号后台粘贴预览或做手机端视觉验收；未部署 Web；24 条链接中 1 条（KWM）对自动抓取返回 403，未用人工浏览器逐篇打开；未重审零改动的 Gate 1 业务代码（仅核对文件哈希）。
- 结论：**`ACCEPT`（通过）**。R1 的 ST01、SP01、S3-1、S3-2 均已关闭；40/40 测试通过，`validate:contracts` 在测试后仍为 `filesChecked: 3`、`valid: true`；双层导出两次完全一致且与仓库 manifest 100% 匹配（`editions-index.json` = `c8e6f9aa…c8ecde`）；无新增依赖、无冻结基线改动。R1 的 ST04（`key_points` 文档口径漂移）与 SP02（`.example` 占位详情 URL）仍为 S3 观察项，未在本轮变更中处理，但不构成 S1/S2 阻断。

---

## 一、R1 闭环核查

| R1 编号 | 级别 | R2 状态 | 独立核验证据 |
|---|---|---|---|
| ST01 | S2 | **关闭** | `src/export/dual-export.mjs` 已删除 `skipWhitelistCheck`/`verifyWhitelist` 与 `--skip-whitelist-check` 分支；CLI 实测 `--skip-whitelist-check` → `exit 1`、`未知参数：--skip-whitelist-check`、不创建输出目录。`exportDualLayer` 在读取 bundle 前检查 `whitelistIds.size === 0`，空 `repoRoot` 实测抛出 `白名单文件缺失或为空，拒绝导出（fail-closed）`，不创建输出目录；`validateBundleOrThrow` 也不再以 `size > 0` 为条件。测试新增 `parseCliArgs` 未知参数断言与空 `repoRoot` 断言。 |
| SP01 | S2 | **关闭** | 24/24 条 `source_url` 为文章级路径（路径段 ≥2；无 `/blog`、`/news`、`/feed`、`/updates`、`/law-reviews` 等栏目根路径；无 RSS/搜索页）；`#39 Schema` 24/24 通过；`source_id` 24/24 命中 26 个白名单 ID。23 条页面可抓取，页面标题与条目标题对应；KWM 1 条返回 403（反爬），但 URL slug 与条目标题“开源许可新趋势”对应。R2 测试还加入 `DISALLOWED_SECTION_PATHS` 阻断栏目路径。 |
| S3-1（R1 ST02） | S3 | **关闭** | 全 pending 样本 + `--approved-only`：exit 1、`无可导出条目`，`outDir` 本身未创建，`wechat/`、`web/` 均不存在。代码在 `mkdirSync` 之前调用 `selectPublishableItems` 预检，测试覆盖该断言。 |
| S3-2（R1 ST03） | S3 | **关闭** | `tests/prompts/prompts.test.mjs` R3 用例已显式传 `topicPoolDir: path.join(baseDir, "topic-pool")`；按指定顺序先 `TZ=Asia/Shanghai npm test` 后 `npm run validate:contracts`：40/40 通过，`git status` 为空，`data/topic-pool/` 不存在，validate 输出 `filesChecked: 3`、`valid: true`。 |
| 双层导出确定性 | — | **通过** | 两次 export 的 manifest 与仓库 `data/exports/ld-g2-05/manifest.json` 深比较均为 `true`；3 期 WeChat/Web 共 6 个哈希全部命中；`editions-index.json` 哈希 `c8e6f9aa192ce80ab01c786756e61b36e3a422ccd65f98c3eef27d4145c8ecde` 与 manifest 完全一致。 |
| 依赖 / 冻结基线 | — | **通过** | `npm ci` 仍为 71 packages；`git diff e4f6b81..11660b3 -- package-lock.json THIRD_PARTY_NOTICES.md` 为空；`package.json` 仅 scripts 变更（新增 `export:dual`、`test:export`，`test` 纳入 `tests/export`），dependencies 段未变；`scripts/wechat-prototype/build.mjs`、`design/prototype/index.html`、`README.md`、`ROADMAP.md`、`AGENTS.md`、两份 ADR 的 git blob 与基准完全相同。 |

---

## 二、R2 证据

### 2.1 锚点

```text
PR #65 state=OPEN
headRefOid = 11660b38d338138ba42f5182affeb36a4abde66e
baseRefOid = e4f6b81f2866eb6083970bce4b5e0de2bb3af260
git rev-parse HEAD → 11660b38d338138ba42f5182affeb36a4abde66e
git status --porcelain → 空
```

CI：`gh pr checks 65` 返回 `no checks reported on the 'gemini/ld-g2-05-dual-export' branch`，即 **CI 未触发**，未写成通过。

### 2.2 干净环境与顺序验证

```text
$ npm ci
added 71 packages in 957ms

$ TZ=Asia/Shanghai npm test
# tests 40
# pass 40
# fail 0
# cancelled 0
# skipped 0
# todo 0

$ git status --porcelain        # 紧接测试后
（空）
$ data/topic-pool/              # 不存在

$ npm run validate:contracts    # 紧接测试后
{"valid":true,"trackedFiles":[],"filesChecked":3,"errors":[]}
```

### 2.3 双层导出哈希

```text
[export:dual] exported=3 editions | webIndexSha256=c8e6f9aa192c | manifest=/tmp/lexai-g2-05-r2-check1/manifest.json
[export:dual] exported=3 editions | webIndexSha256=c8e6f9aa192c | manifest=/tmp/lexai-g2-05-r2-check2/manifest.json
```

| 日期 | 公众号 HTML SHA-256（实测 = manifest） | Web JSON SHA-256（实测 = manifest） |
|---|---|---|
| 2026-11-24 | `c9d88f19b8355291ec1008cf72b0db4da263291d51d0f3a233bac9a48ce3538b` | `4b7d41ec5516ae4434f1cdf40183a30acc17ff90fdf4d473c50f6b9f6a55d5a1` |
| 2026-11-25 | `ff136ccb1ac6ff4b59e93adb44d8dd8f42baeb86a0147589f932de7286843ec2` | `0d9bc842b158366a70b51e714ca5541ced622b9b3154f4ed4c9c765d7c8f1ba2` |
| 2026-11-26 | `ef133b1fa64cb386f40933eb9d13950b86d9e65a0ecf47db09fcd6abdeede0b1` | `8f3c2fca1cc0bd45965a7056e427688d741137d897619b6acacab67cbfcf5862` |
| editions-index | — | `c8e6f9aa192ce80ab01c786756e61b36e3a422ccd65f98c3eef27d4145c8ecde` |

两次运行 manifest 深比较 `true`；仓库 manifest 与运行 manifest 深比较 `true`；6 个 edition 哈希失败数 0。

### 2.4 24 条样本红线

| 指标 | 结果 |
|---|---|
| 条目数 | 24（3 期 × 8） |
| `#39 Schema` | 24/24 |
| 白名单 `source_id` | 24/24（白名单 26 个） |
| 文章级一手 URL | 24/24（路径段 ≥2，无栏目/Feed/首页/RSS/搜索页） |
| 域名/协议 | 24/24 `https://`；`aihot.news` 0 |
| `[invalid URL]` | 0 |
| 禁用全文字段 | 0 |
| `summary ≤160` | 0 超标（最长 108） |
| `key_points` 1–3 / 合计 ≤600 | 24/24（均为 1 段，合计 182–234） |
| `evidence_quotes` 1–3 / 单段 ≤150 | 24/24 |
| `legal_commentary` 200–400 | 24/24 |
| 高风险哨兵占比 | 各期 2/8 = 25.0%，在 15%–25% 内 |
| 双轨/五分类 | 每期 `cn`+`global`、五大分类齐全 |
| 链接连通性 | 23 条 HTTP 200；1 条 HTTP 403（KWM，反爬；非 404） |

公众号 HTML 复检：

```text
a_href=0  a_any=0  table=0  style=0  script=0  class=0  background-color:#D5C5AE=37
```

D-029 复检：`recent_keys=["2026-11-26","2026-11-25","2026-11-24"]`；`weekly_archive_keys=["2026-W48"]`；W48 归档 6 条，低价值条目 0。

### 2.5 ST01 / S3-1 定向探针

| 探针 | 实测结果 |
|---|---|
| `--skip-whitelist-check` | exit 1；`未知参数：--skip-whitelist-check`；不创建 outDir |
| 空 `repoRoot` / 缺失白名单 | `exportDualLayer` 抛出 `白名单文件缺失或为空，拒绝导出（fail-closed）`；不创建 outDir |
| 全 pending + `--approved-only` | exit 1；`无可导出条目`；outDir 未创建，无 `wechat/`、`web/` |
| 源码残留引用 | `src/` 无 `skip-whitelist`/`skipWhitelist`/`verifyWhitelist`；仅测试中保留“传入该参数应被拒绝”的断言 |

### 2.6 依赖与冻结基线

```text
npm ci → added 71 packages
npm ls --depth=0 → 8 个既有依赖
git diff e4f6b81..HEAD -- package-lock.json THIRD_PARTY_NOTICES.md → 空（exit 0）
package.json 变更仅 scripts：export:dual、test:export、test 包含 tests/export
Gate 1 冻结文件 git blob 与基准全部 SAME：
  scripts/wechat-prototype/build.mjs
  design/prototype/index.html
  README.md / ROADMAP.md / AGENTS.md
  docs/adr/0002-fact-tier-and-no-fulltext.md
  docs/adr/0003-dual-track-regional-collection.md
```

---

## 三、残留观察项（非阻断）

| 编号 | 级别 | 状态 | 说明 |
|---|---|---|---|
| ST04（R1） | S3 | 未在 R2 处理 | `ADR-0002:12` 与 `docs/contracts/gate2-data-contract-v1.md:31` 仍写 `key_points` 3–5 条/每条 8–140；Schema/SOP 为 1–3 段/合计 ≤600。R2 未改这些文档，样本按 Schema/SOP 口径通过。建议另立文档任务消除漂移，或由 Human 书面确认口径。 |
| SP02（R1） | S3 | 未在 R2 处理 | 3 期 `meta.web_detail_url` 仍为 `https://lexaidaily.example/d/<date>`，导出 Web JSON 与公众号 HTML 带该占位地址；样本 `internal: true`，不对外发布。公开导出前应替换为真实详情页域名，或明确标注“占位不可点击”。 |

以上两项均为 R1 已记录的 S3，不构成本轮 ACCEPT 的阻断条件；但应在后续文档/发布任务中关闭。

---

## 四、建议结论

- **单行汇总**：R1 的 2 项 S2（ST01、SP01）与 2 项 S3（ST02/S3-1、ST03/S3-2）全部关闭；无新增 S1/S2；残留 ST04、SP02 两项 S3 观察。
- **结论**：`ACCEPT`（通过）。R2 变更准确关闭了 R1 阻断项，测试、契约校验、双层导出确定性、文章级链接与冻结边界均通过；剩余 S3 不影响本轮通过，建议后续文档/发布任务处理。
- 本意见只构成证据，不自动产生权限；合并与最终决定属于 Human Maintainer。本次审计未修改仓库代码、未 push、未合并。

---

## 附录：本次审计报告

- 报告文件：`/tmp/lexai-g2-05-dsh-audit-r2.md`
- 报告 Git blob SHA：归档时以 `git hash-object` 计算，最终值见本次审计回复（AGENTS.md 6.2 通知）。
