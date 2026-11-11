# 第三方材料与开源许可登记表（THIRD_PARTY_NOTICES）

> **依据**：决策记录 D-008（第三方代码与素材的复用策略：合规拷贝优先，其余参考）。
> **规则**：宽松开源许可（MIT、Apache-2.0、BSD、ISC、CC0、SIL OFL）；只取最小必要部分；保留版权与许可证声明；逐项登记；未登记的拷贝视为违规。本登记表只记录第三方许可，不构成本仓库整体许可证声明（AGENTS.md 10.7）。本文件由 LD-G1-02 初始化创建，后续任务在其后追加。

---

## 一、设计系统、令牌与排版组件参考与取用清单

| 序号 | 组件 / 令牌 / 素材 | 来源仓库 | 基准 Commit SHA / 版本 | 原始文件路径 | 许可证 | 取用与改动说明 |
|---|---|---|---|---|---|---|
| 01 | 色彩与间距设计令牌标度体系（Color & Spacing Scales） | [tailwindlabs/tailwindcss](https://github.com/tailwindlabs/tailwindcss) | `v3.4.14` (`788a8d0`) | `src/corePluginList.js`, `stubs/config.full.js` | MIT | 最小必要参考取用 Slate/Zinc 灰阶色阶（`#090D16`, `#0F172A`, `#1E293B`, `#334155`, `#94A3B8`, `#F8FAFC`）及 4px 基数间距阶梯；改写为 LexAIDaily 精密雷达暗调设计令牌并输出至 `design/tokens/tokens.json`。 |
| 02 | 组件层级结构与无障碍状态定义（Component Hierarchy & State Tokens） | [radix-ui/primitives](https://github.com/radix-ui/primitives) | `main` (`2024-10-15`, `c7c29be`) | `packages/react/tabs/`, `packages/react/badge/` | MIT | 参考其 Tabs、Badge、Tooltip 的无障碍状态层级与交互边界，用于设计系统卡片状态位与筛选交互流规范，未拷贝代码实现。 |
| 03 | 暗调高对比度排版组件规范（Dark Mode High-Contrast Patterns） | [shadcn-ui/ui](https://github.com/shadcn-ui/ui) | `main` (`2024-11-01`, `e5f419d`) | `apps/www/registry/default/ui/card.tsx` | MIT | 参考其 Card 组件的微妙边框（Subtle Border: 1px `#1E293B`）与内容分区网格设计，适配至法律资讯“四要素+五类标签”排版卡片。 |
| 04 | 界面西文字体：Inter | [rsms/inter](https://github.com/rsms/inter) | `v4.0` | `InterVariable.ttf` | SIL OFL-1.1 | 原型与设计规范指定界面默认无衬线西文字体（支持 400, 600, 700 字符重），商业友好开源授权。 |
| 05 | 等宽代码与数据字体：JetBrains Mono | [JetBrains/JetBrainsMono](https://github.com/JetBrains/JetBrainsMono) | `v2.304` | `fonts/ttf/JetBrainsMono-Regular.ttf` | SIL OFL-1.1 | 原型中信源 URL 域名、时间戳及编号的专用等宽显示字体。 |
| 06 | 设计协作工具平台：Penpot | [penpot/penpot](https://github.com/penpot/penpot) | `v2.19.0` (SaaS / Open Source) | Penpot Design App & MCP Plugin | MPL-2.0 | 仅使用 Penpot 云端平台及 MCP 插件作为原型产出载体（D-013），未拷贝其服务端或前端源代码。 |
| 07 | WebGL/WebGPU 特效交互组件库：Canvas UI | [DavidHDev/canvas-ui](https://github.com/DavidHDev/canvas-ui) | `a0be3b7` | 全库 | MIT + Commons Clause | Gate 1 仅参考交互概念并预留静态效果槽位，未安装、未拷贝任何代码；Gate 3 使用代码待 Human 确认 D-018。 |
| 08 | 标题楷体：霞鹜文楷 (LXGW WenKai) | [lxgw/LxgwWenKai](https://github.com/lxgw/LxgwWenKai) | `v1.330` | Penpot 内置 (Google Fonts `LXGW WenKai TC`) | SIL OFL-1.1 | 卡片标题与详情页标题专用中文字体；通过 Penpot 内置 Google 字体库直接选用，未在仓库入库字体文件。 |
| 09 | 站名衬线：思源宋体 (Noto Serif SC) | [googlefonts/noto-cjk](https://github.com/googlefonts/noto-cjk) | `v2.002` | Penpot 内置 (Google Fonts `Noto Serif SC`) | SIL OFL-1.1 | 站名字体专用宋体/衬线字；通过 Penpot 内置 Google 字体库直接选用，未在仓库入库字体文件。 |
| 10 | 摘要与标识无衬线：思源黑体 (Noto Sans SC) | [googlefonts/noto-cjk](https://github.com/googlefonts/noto-cjk) | `v2.004` | Penpot 内置 (Google Fonts `Noto Sans SC`) | SIL OFL-1.1 | 摘要、来源行、日期、导航与状态标识专用无衬线字体；通过 Penpot 内置 Google 字体库直接选用，未在仓库入库字体文件。 |

---

## 二、第三方许可证全文归档

### 1. MIT License (Tailwind CSS, Radix UI, shadcn/ui)

```text
MIT License

Copyright (c) Tailwind Labs, Inc.
Copyright (c) 2022 WorkOS
Copyright (c) 2023 shadcn

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### 2. SIL Open Font License 1.1 (Inter, JetBrains Mono)

```text
SIL OPEN FONT LICENSE Version 1.1 - 26 February 2007

Copyright (c) 2016-2024 The Inter Project Authors
Copyright (c) 2020-2024 JetBrains s.r.o.

Permission is hereby granted, free of charge, to any person obtaining
a copy of the Font Software, to use, study, copy, merge, embed, modify,
redistribute, and sell modified and unmodified copies of the Font Software,
subject to the conditions stated in the OFL license.
```

### 3. MIT License with Commons Clause (DavidHDev/canvas-ui)

```text
The Commons Clause License Condition v1.0
Without limiting other conditions in the License, the grant of rights under the
License will not include, and the License does not grant, the right to Sell the
Software (including supplying the Software, in whole or in part, to others for a fee).

（注：Gate 1 仅参考交互概念并预留静态效果槽位，未安装、未拷贝任何代码；Gate 3 使用代码待 Human 确认 D-018）
```
