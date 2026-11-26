# ADR-0001：Gate 2 采集与导出统一采用 Node.js / TypeScript 单一技术栈

- **状态**：已确认（2026-11-26，Gate 2 第 1 轮设计对齐 Q1）
- **背景**：Gate 1 已验收的公众号内联排版脚本（`scripts/wechat-prototype/build.mjs`、`juice@12.2.6`）与交叉测试（`node:test`）均基于 Node.js，而开源新闻抓取生态多以 Python 为主。
- **决策**：Gate 2 正式数据契约校验、RSS/静态页采集、去重初筛、提示词调用与双端导出全程统一采用 **Node.js / TypeScript** 技术栈，不引入 Python 双栈。
- **理由**：主动放弃 Python `trafilatura` 等重型生态，换取与 Gate 1 导出器和 Gate 3 Web 前端零跨语言胶水层，降低多 Agent 联调与 CI 维护成本；后续若遇极端动态反爬源，再在独立适配器层评估扩展。
