# ADR-0003：中国大陆与大陆以外双轨分域采集 + Gemini 统一编码 / DeepSeek 独立审计 / Hydrogen 自动化运行

- **状态**：已确认（2026-11-26，Human Maintainer 最终拍板）
- **背景**：中国大陆政务/司法官网大多无标准 RSS 且存在网络出口与编码差异，而大陆以外立法/法院/顶会与博客多提供规范 RSS/Atom 或公开 API；同时 Human 希望 Gate 2 采集与内容管线代码风格高度统一，后续运营期只需单一自动化入口运行。
- **决策**：
  1. **代码与配置仍按地域双轨解耦**：白名单拆为 `whitelist-cn.yaml` 与 `whitelist-global.yaml`（可接入 `aihot.news/api/v1` 作为辅助线索发现源，但严格仅提取 `links.original` 回溯一手源，绝不搬运或再分发其摘要），采集器拆为 `src/collectors/cn/`（`npm run collect:cn`）与 `src/collectors/global/`（`npm run collect:global`），各自输出同构分区文件（`cn.json` / `global.json`）与 `*-meta.json`，再经公共汇流层做跨轨去重（同事件优先保留海外一手原链）并暴露统一总入口 `npm run daily`。
  2. **开发与审计分工（依 Human 指示）**：Gate 2 全部采集、契约、汇流与导出代码由 **Gemini** 统一编写（遵循 `AGENTS.md` 6.1(d)），关键模块（契约、白名单、双轨采集与汇流、提示词与 SOP）交 **DeepSeek Harness** 执行架构内独立审计；**Antigravity** 承担 #44 独立交叉测试与文档索引。
  3. **运营期自动化运行（Gate 3 衔接）**：后续运营期统一通过 **DeepSeek 云端 API + Antigravity Hydrogen** 触发 `npm run daily`（或按需分轨调度 `collect:cn` / `collect:global`），实现单入口自动化采编。
- **理由**：统一由 Gemini 编写消除跨 Agent 接口摩擦与风格分裂，由 DeepSeek Harness 独立审计守住质量与合规底线，同时保留代码内双轨故障隔离与单入口 Hydrogen 自动化体验。
