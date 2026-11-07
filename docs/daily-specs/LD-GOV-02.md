# LD-GOV-02｜修订 AGENTS.md 过时表述

- 任务类型：Governance
- 级别：B（理由：修改治理文档）
- 授权来源：Human Maintainer，2026-11-07 会话：“你直接修正 AGENTS.md 的过时表述吧”
- 任务 Owner：Claude｜复核者：待定（Owner 为 Claude，不得自审）
- 独立审计：是：依据 AGENTS.md 6.1(a)(d)；**尚未安排**，须由 Human 指定审计者或书面豁免
- Final Approver：Human Maintainer
- 基准：`main`（`3ea52c0`）｜分支：`claude/ld-gov-02-agents-status`｜PR：见 STATUS
- 所属 Gate：Gate 0（治理）｜依赖：LD-GOV-01（已完成）

## 范围

只改事实性过时表述，不改规则的实质：
1. 文首“V1.0 草案”“DRAFT，未生效”改为已生效，记入 merge commit `3ea52c0` 与 Human 豁免记录。
2. Claude 已有 GitHub 读写权限（Human 2026-11-07 安装 Claude GitHub App）：改第 1、2、4、6.6、7 节相应句子；GPT 网页版仓库操作员改为按需，6.6 对其提交时仍适用。

不改：授权分级、审计规则（6.1、6.2、6.5）、A/B 判定、角色权限边界、不合并和不代签的约束。

## 需 Human 注意

- 操作员由“必经环节”改为“按需”，是对 D-003 前提的事实更新，不是新增权限。Claude 仍不合并、不授权 B 级。
- 6.2 中“由操作员原样提交”审计文件的表述未改，如要允许 Claude 提交审计归档，需另行决定。
- `docs/COORDINATOR_PLAYBOOK.md` 里也有同样的过时表述，本任务未改，以免一次改动过大。

## Human 工作清单

- [ ] **工作目标**：指定本 PR 的审计者或书面豁免，然后决定是否合并。
  - **执行步骤**：1. 在 PR 评论写“指定 xx 审计”或“豁免 LD-GOV-02 审计”；2. 看 Files changed 的 AGENTS.md diff；3. 评论里写合并决定。
- AI 不得代批、代豁免、合并。
