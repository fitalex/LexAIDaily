# 复核与审计报告｜LD-G2-03（R4 增量复核）

- **类型**：独立审计（R4 增量复核）
- **出具者**：DeepSeek Harness｜**日期**：2026-11-27
- **审计对象**：[PR #58](https://github.com/fitalex/LexAIDaily/pull/58)｜**Issue**：[#41](https://github.com/fitalex/LexAIDaily/issues/41)
- **基准**：`origin/main@3f8fd49b30e87b0abf13368cd722dbf17208f152`
- **R3 已审 HEAD**：`82f4d2fda937d50a9623c054d8c07c26ec1fe526`
- **R4 待审 HEAD**：`cc5c5426040ac50b7a93889a8330a0e1b18a4be4`
- **结论**：**需修改（CHANGES_REQUESTED）**
- **归档草稿**：[docs/audits/LD-G2-03-dsh-audit-r4.md](docs/audits/LD-G2-03-dsh-audit-r4.md)（未 commit/push），Git blob SHA：`0217d3ee5d32e4aad1773abfe86ac4b3b90ad611`

## 一、R3 发现逐项关闭核验

| R3 编号 | R4 状态 | 核验证据 |
|---|---|---|
| **R3-ST01**（S1，8 个直接依赖 LICENSE 逐字/零删行） | **部分关闭，仍是 S1** | `git diff --numstat 3f8fd49...HEAD -- THIRD_PARTY_NOTICES.md` = `218 0`，零删行达成；juice/ajv/ajv-formats 已变为 `true`；但 **js-yaml 仍为 `false`**（仅换行位置不同），8/8 未达成（见 R4-ST01）。 |
| R3-ST02（S3，代理 302 跟随） | **已关闭** | 本地 HTTP 代理 302 -> `status:200, ok:true`，`finalUrl: http://target.example/final`；测试 9 通过。 |
| R3-SP01（S2，去重状态污染） | **已关闭** | `extractEntityTokens(...)` 连续 3 次 -> `[4,4,4]`；`deduplicateCrossTrack([pureCn,pureEn])` 连续 3 次 -> `[1,1,1]`，winner 为 `global`。 |
| R3-SP02（S3，无日期/带偏移日期） | **已关闭** | `TZ=Asia/Shanghai` 下 fallback `2026-11-27`；`+08:00` 日期 -> `2026-11-20`；naive -> `2026-11-20`。 |

**小结**：R3 的 1×S1 + 1×S2 + 2×S3 中 **3 项完全关闭**；R3-ST01 仅剩 js-yaml 一处逐字差异，故 R4 剩余 **1×S1**。

## 二、DoD 逐项核对

| 序号 | 标准 | 结果 | 证据 |
|---|---|---|---|
| D01 | 四个入口可独立运行，产出 100% 通过 #39 Schema | 部分达成 | 32/32 测试与模块级 E2E 通过；未跑真实公网 CLI。 |
| D02 | 离线单测覆盖 TTL、去重、AIHOT、忠实度、零全文 | 达成 | 32/32；新增去重重复调用、代理 302、日期边界回归。 |
| D03 | 依赖锁版本、notices、无密钥 | 部分达成 | lock 全 npmjs、`npm ci`/`npm audit` 通过、src 零 undici、notices 218/0；但 js-yaml 许可块非逐字（R4-ST01）。 |
| D04 | `.cache/raw/` 7 天 TTL；`.gitignore`；零追踪 | 达成 | TTL 测试；`validate:contracts --all` `trackedFiles:[]`。 |
| D05 | AIHOT 严格 discovery_only、gzip、ETag/304 | 达成 | score/304/旧缓存/L2 域名均已通过；live gzip/304 已在 R2 核验。 |
| D06 | Layer 2 只读降级；Layer 3 硬熔断 | 达成 | 401/403 degraded、非法 source_id 跳过、abc 熔断 0 调用。 |
| D07 | Stage 2 标注、忠实度、长法规入池 | 达成 | 标注/忠实度/长法规通过；日期边界已补。 |
| D08 | 命令/CI 对应 commit，未执行如实 | 达成（本地）/CI 未触发 | 本地命令在 `cc5c542`；`gh pr checks 58` 无检查项。 |

## 三、剩余问题清单

### 3.1 Standards 轴

| 编号 | 级别 | 位置 | 问题与依据 | 建议 |
|---|---|---|---|---|
| **R4-ST01** | **S1 阻断** | `THIRD_PARTY_NOTICES.md:308-309`；`node_modules/js-yaml/LICENSE:12-13` | 8 个直接依赖中 7 个已逐字 `true`；`js-yaml` 仍为 `false`。差异仅为换行位置：通知为 `...shall be included in all` + `copies or...`，安装包为 `...shall be included in` + `all copies or...`。字符内容相同，但本轮硬门禁是“8/8 LICENSE 全文逐字匹配均为 true”，故仍不通过。 | 将 `THIRD_PARTY_NOTICES.md` 第 308–309 行改为安装包原样：`...shall be included in` 后换行，下一行 `all copies or substantial portions of the Software.`；重跑 8 个 `readFileSync(...).includes(exact)` 全部 `true`。 |

### 3.2 Spec 轴

无剩余 S2/S3。R3-ST02/SP01/SP02 均已关闭；代理 302、去重重复调用、Asia/Shanghai 日期边界均通过。

## 四、实测命令与证据

在干净 worktree `/tmp/lexai-audit/r4`（`HEAD cc5c542`，`origin/main 3f8fd49`）执行：

| 命令 / 场景 | 结果 |
|---|---|
| `npm ci` | `added 71 packages in 654ms`；仅 `whatwg-encoding@3.1.1` deprecated。 |
| `TZ=Asia/Shanghai npm test` | `# tests 32`、`# pass 32`、`# fail 0`、`duration_ms 401.3`。 |
| `npm run validate:contracts` | `{"valid":true,"trackedFiles":[],"filesChecked":0,"errors":[]}`，exit 0。 |
| `npm audit --registry=https://registry.npmjs.org` | `found 0 vulnerabilities`，exit 0。 |
| `git diff --numstat 3f8fd49...HEAD -- THIRD_PARTY_NOTICES.md` | `218	0`（严格零删行）。 |
| 8 个直接依赖 LICENSE 逐字检查 | juice/ajv/ajv-formats/readability/linkedom/normalize-url/rss-parser = `true`；**js-yaml = `false`**。 |
| `grep -c registry.npmmirror.com package-lock.json` | `0`；71 个 `resolved` 全部 `registry.npmjs.org`。 |
| `grep -rn undici src/` | `0`；`package.json` 无 `undici`；`package-lock` 中仅为 juice→cheerio 传递依赖。 |
| `gh pr checks 58` | `no checks reported on the 'gemini/ld-g2-03-dual-collect-pipeline' branch`；无 `.github/workflows`。 |
| 对抗性：去重 | tokens `[4,4,4]`；dedup `[1,1,1]`；winner `global`。 |
| 对抗性：日期 | fallback `2026-11-27`；offset `2026-11-20`；naive `2026-11-20`。 |
| 对抗性：代理 302 | 本地代理 302 -> `status:200, ok:true`，`finalUrl: http://target.example/final`。 |
| 对抗性：无关“AI+2026” | 2 cluster（不误合并）。 |
| `git diff --check 3f8fd49...HEAD` | 无输出，exit 0。 |
| 密钥/冻结基线 | src/tests 无实际 key；README/ROADMAP/AGENTS/GLOSSARY/schemas/whitelists/adr 未改。 |

### 红线核验

- **命令与 commit 对应**：本地命令在 `cc5c542`；CI 未触发，未写成通过。
- **许可**：71 包均宽松许可；8 个直接依赖中 7 个逐字匹配，js-yaml 仅换行差异（R4-ST01）；零删行 218/0。
- **供应链**：src 零 undici；package.json 无 undici；lock 全 npmjs；`npm ci`/`npm audit` 通过。
- **缓存/密钥**：`.cache/raw` 仅本地；无 `.env`/`.local`/key 入库；`validate:contracts` 零追踪。
- **AI 初稿标注**：E2E 夹具 `practice_impact_is_ai_draft:true`、`detail_analysis.ai_draft:true`、`headline:false`；无变更。
- **AIHOT 条款**：公开规则 v1.1 仍要求对外商业产品/收费/公开镜像事先书面授权；白名单 `compliance_redline` 已记录 Gate 3/4 前置；本 PR 未新增授权证据，对外发布前需 Human 确认。
- **冻结基线**：`README.md`、`ROADMAP.md`、`AGENTS.md`、`GLOSSARY.md`、`schemas/`、`data/sources/`、`docs/adr/` 未被本 PR 修改。

## 五、建议结论

- **单行汇总**：R3 的 4 项中 3 项完全关闭；R4 剩余 **1×S1、0×S2、0×S3**。
- **结论**：**需修改（CHANGES_REQUESTED）**。
- **理由**：功能与边界整改（去重确定性、代理 302、日期时区、32/32、零删行、src 零 undici）均已通过；唯一阻塞为 **R4-ST01**：8 个直接依赖 LICENSE 逐字匹配要求中 `js-yaml` 仍为 `false`，差在换行位置。按本轮硬门禁必须 8/8 true，故不能通过。
- **修复后建议**：仅需修正 js-yaml 块换行并复跑 8/8 逐字检查；其余 R3 项无需重做。
- **状态**：未修改代码、未合并 PR、未 push；本报告只构成证据，不自动产生合并权限。

本意见只构成证据，不自动产生权限；合并与最终决定属于 Human Maintainer。
