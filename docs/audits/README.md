# 复核与审计归档

存放协调者复核报告和独立审计意见，格式见 [复核与审计报告模板](../templates/REVIEW_REPORT.md)。

- 文件名：`<任务号>-claude-review.md`、`<任务号>-gpt-audit.md`。
- GPT 网页版的意见由 Human 贴回，Claude **原文归档**，不改写、不合并；开头保留“来源”行。
- 两份意见不一致时各自保留，分歧点写入 PR，由 Human 决定（AGENTS.md 6.3）。
- 审计意见只构成证据，不自动产生权限。

| 任务 | 文件 | 类型 | 结论 |
|---|---|---|---|
| LD-GOV-01 | [LD-GOV-01-gpt-audit.md](LD-GOV-01-gpt-audit.md) | 独立审计（GPT 网页版，2026-11-05，基准 `a87e7fe`） | 需修改 |
| LD-GOV-01 | [LD-GOV-01-claude-response.md](LD-GOV-01-claude-response.md) | Owner 整改回应（Claude） | 待增量复审 |
