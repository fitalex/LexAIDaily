# LD-GOV-03｜重组多 Agent 协作架构与治理文档（V2.0）

- 任务类型：Governance
- 级别：B（理由：修改治理规范 `AGENTS.md`、调整协作参与方与独立审计机制）
- 授权来源：Human Maintainer，2026-11-22 会话原话：“授权 LD-GOV-03，全部按推荐方案，本次（以及 PR #16）豁免审计”
- 任务 Owner：Gemini｜复核者：Human Maintainer（Owner 为 Gemini，不得自审）
- 独立审计：依据 `AGENTS.md` 6.1(a)(d) 本应触发；**Human 于 2026-11-22 在会话中明确书面豁免**（同步豁免 PR #16 字体许可增量复审），理由与记录见 STATUS 决策 D-026；本豁免仅针对本任务与 PR #16，不改变 6.1 一般规则
- Final Approver：Human Maintainer
- 基准：`main`（Commit SHA：`f8c9ce61fa9f90f9ddd092189f58769ec8494912`）｜分支：`gemini/ld-gov-03-collab-reorg`｜PR：见 STATUS
- 所属 Gate：Gate 1（治理调整）｜对应验收标准：不改冻结基线，保障 Gate 1 后续协作顺畅
- 依赖：LD-GOV-02（已完成）｜被依赖：后续 Gate 1 复核、LD-G1-04 及 Gate 2 协作

## 一、背景与目标

原协作架构中的总协调者（Claude）已交接给 Gemini，ChatGPT 网页版退出协作架构，Codex 长期暂停且 DeepSeek Harness 与 Antigravity 已按 D-011～D-015 承接实际分工。本任务将上述变更正式落盘为 `AGENTS.md` V2.0 及配套文档，消除文档与实际协作脱节的问题。

## 二、范围

- **输入**：`AGENTS.md`（V1.0）、`CLAUDE.md`、`docs/COORDINATOR_PLAYBOOK.md`、`docs/coordination/STATUS.md`、`docs/daily-specs/README.md`、Human 2026-11-22 拍板意见
- **输出**：
  - `AGENTS.md`（升级至 V2.0）
  - `GEMINI.md`（新增总协调者入口）
  - `CLAUDE.md`（改为迁移指向说明）
  - `docs/COORDINATOR_PLAYBOOK.md`（同步为 Gemini 协调者手册）
  - `docs/daily-specs/LD-GOV-03.md`（本任务书）
  - `docs/daily-specs/README.md`（补登任务书索引并同步 Owner）
  - `docs/coordination/STATUS.md`（登记 LD-GOV-03、并入原 PR #21 的 D-020～D-022 与 D-024，以及新增决策 D-025、D-026）
- **可改文件**：上述 7 个文件
- **不可改文件**：`README.md`、`ROADMAP.md`、任何 `design/` 与代码文件、历史已归档审计文件（`docs/audits/`）
- **非范围**：不修改产品定位、编辑原则、Gate 路线图或冻结基线；不触碰 PR #16/#19 的业务内容（原 Draft PR #21 中的 `STATUS.md` 决策记录 D-020～D-022、D-024 按 Human 2026-11-22 指示并入本 PR，PR #21 关闭）

## 三、冻结边界

不得修改 `README.md` 与 `ROADMAP.md` 中的产品定位、双端形态、编辑原则、Gate 路线图及验收标准；不得添加或声明仓库许可证；不得自行合并 PR。

## 四、DoD

| 序号 | 验收标准 | 对应 Gate 验收条目 | 证明方式 |
|---|---|---|---|
| D01 | `AGENTS.md` 升级至 V2.0：Claude 替换为 Gemini，ChatGPT 网页版与 Codex 移出主表，DeepSeek 与 Antigravity 实际分工转正，独立审计改为架构内交叉审计，6.6 标记废止，分支前缀新增 `gemini/` | 治理一致性 | `AGENTS.md` diff |
| D02 | 新增 `GEMINI.md`，`CLAUDE.md` 改为迁移说明；`docs/COORDINATOR_PLAYBOOK.md` 同步去除过时角色与操作员流程 | 治理一致性 | 对应文件 diff |
| D03 | `docs/coordination/STATUS.md` 与 `docs/daily-specs/README.md` 补登 `LD-GOV-03`、并入原 PR #21 的 D-020～D-022 与已确认的 D-024，以及新增决策 D-025、D-026 | 状态源一致 | 对应文件 diff |
| D04 | 全文无指向不存在文件的断链，未改动任何冻结基线文件 | 冻结基线保护 | `git diff --stat` 核对 |

## 五、验证与证据要求

- 必须运行：`git status`、`git diff --stat`、检查新增与修改文件链接指向。
- 如实记录命令、结果与未执行项；仓库未配置文档 CI 时写明“CI 未触发”。

## 六、交接与回传

- 完成后推送分支 `gemini/ld-gov-03-collab-reorg` 并提交 PR，使用 `.github/PULL_REQUEST_TEMPLATE.md`。

## 七、升级条件

如在修订中发现涉及冻结基线文字调整或与 PR #21 冲突需合并裁决，停止并交 Human 决定。

## 八、Human 工作清单

- [ ] **工作目标**：审阅 `LD-GOV-03` PR 的全部 diff，确认决策 D-025（协作架构重组）与 D-026（豁免 LD-GOV-03 与 PR #16 审计），决定是否合并入 `main`。
  - **工作链接**：本任务对应的 GitHub PR（推送分支 `gemini/ld-gov-03-collab-reorg` 后生成）
  - **执行步骤**：1. 打开 PR 的 Files changed 检查 7 个文档的改动；2. 在 PR 评论中回复“确认 D-025、D-026，同意合并”；3. 执行合并。
- AI 不得代签、代批的边界：Gemini 不会自行合并本 PR，也不会代为签字确认决策记录。
