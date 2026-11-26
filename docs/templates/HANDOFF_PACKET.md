# 交接包｜<任务号>｜<标题>

> 用法：用于 Gemini 总协调者跨会话接力，或向 DeepSeek Harness / Antigravity 移交上下文。**零重复原则**：已在仓库、GitHub Issue、PR 或 ADR 中落盘的内容，只写路径、编号或链接，不复制粘贴全文；严禁包含密钥、凭据或读者私域数据。

## 1. 目标与接收方

- **接收角色**：<DeepSeek Harness / Antigravity / 下一轮 Gemini 总协调者>
- **交接目标**：<一两句话说明下一阶段要完成什么，边界在哪里>

## 2. 当前状态与锚点

- **仓库与分支**：`fitalex/LexAIDaily`｜分支：`<branch>`｜最新 commit：`<sha>`
- **关联任务与单据**：任务号 `<LD-xxx>`｜Issue `#<号>`｜PR `#<号>`
- **核心参考路径**：<只列文件路径或 URL，如 `docs/coordination/STATUS.md`、`GLOSSARY.md`>

## 3. 已锁定决策与不可重开边界

- <列出本轮已拍板的决策或 `D-NNN` 编号，避免下游重复讨论>
- **非范围**：<明确本次不做的事>

## 4. 待决阻塞项（如有）

- <写明等待 Human 拍板或外部验证的事项，无则写“无”>

## 5. 下一步可执行动作

1. <具体第一步，含需先读取的文件或 Issue>
2. <具体第二步，含验收或回传要求>

## 6. 建议调用的技能（供支持 Skills 的 Agent 参考）

- <如 `to-spec`、`to-tickets`、`code-review`、`grill-with-docs`；若接收方无技能系统则略过>
