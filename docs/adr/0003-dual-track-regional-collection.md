# ADR-0003：中国大陆与大陆以外双轨分域独立采集 + 统一契约汇流架构

- **状态**：已确认（2026-11-26，Human Maintainer 拍板分域归属）
- **背景**：中国大陆政务/司法官网大多无标准 RSS 且存在网络出口与编码差异，而大陆以外立法/法院/顶会与博客多提供规范 RSS/Atom 或公开 API；单管线混抓容易相互拖累且难以按区域独立调度。
- **决策**：将白名单拆分为 `whitelist-cn.yaml` 与 `whitelist-global.yaml`，采集器按地域完全解耦——**DeepSeek Harness** 负责中国大陆采集器（`src/collectors/cn/`，`npm run collect:cn`）与下游公共汇流/跨轨去重/选题池层，**Antigravity** 负责大陆以外采集器（`src/collectors/global/`，`npm run collect:global`，任务书明示放宽 `AGENTS.md` 编码边界至该目录）。双轨各自输出同构分区文件（`cn.json` / `global.json`，均须通过 `LD-G2-01` Schema 校验且严禁落盘原文全文），由公共汇流层做跨轨去重（同事件优先保留海外一手原链）并供 Gate 3 分别独立定时部署（大陆线走本机 `launchd` 或国内轻量节点，海外线走 GitHub Actions Cron）。
- **理由**：以轻微的分区文件编排成本，换取双轨零文件冲突并行开发、单轨故障隔离、天然交叉测试闭环以及 Gate 3 跨网络环境自动化调度的平滑演进。
