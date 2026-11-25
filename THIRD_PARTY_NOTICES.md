# 第三方材料与开源许可登记表（THIRD_PARTY_NOTICES）

> **依据**：决策记录 D-008（第三方代码与素材的复用策略：合规拷贝优先，其余参考）。
> **规则**：宽松开源许可（MIT、Apache-2.0、BSD、ISC、CC0、SIL OFL）；只取最小必要部分；保留版权与许可证声明；逐项登记；未登记的拷贝视为违规。本登记表只记录第三方许可，不构成本仓库整体许可证声明（AGENTS.md 10.7）。本文件由 LD-G1-02 初始化创建，后续任务在其后追加。

---

## 一、实际采用项（当前设计与原型实际使用）

| 序号 | 组件 / 字体 / 平台 | 来源仓库 | 基准 Commit SHA / 版本 | 原始文件 / 许可证据链接 | 许可证 | 实际采用与核实说明 |
|---|---|---|---|---|---|---|
| 01 | 标题楷体：霞鹜文楷 (LXGW WenKai TC) | [lxgw/LxgwWenKaiTC](https://github.com/lxgw/LxgwWenKaiTC) | `v1.330` | Penpot 内置 (Google Fonts `LXGW WenKai TC`)；许可证据：[Google Fonts OFL.txt](https://github.com/google/fonts/blob/main/ofl/lxgwwenkaitc/OFL.txt) | SIL OFL-1.1 | 卡片标题与详情页标题专用中文字体；通过 Penpot 内置 Google 字体库直接选用，未在仓库入库字体文件。来源仓库修正为 `lxgw/LxgwWenKaiTC`，无保留字体名（Reserved Font Name）。Penpot 实际加载的字体文件版本与哈希未核实。 |
| 02 | 站名衬线：思源宋体 (Noto Serif SC) | [notofonts/noto-cjk](https://github.com/notofonts/noto-cjk) | `v2.002`；上游 commit `985fa52c81c1d6692ccdd82bc3656e8fb932fd89`（对照 Google Fonts METADATA.pb 核实） | Penpot 内置 (Google Fonts `Noto Serif SC`)；许可证据：[Google Fonts OFL.txt](https://github.com/google/fonts/blob/main/ofl/notoserifsc/OFL.txt)、[METADATA.pb](https://github.com/google/fonts/blob/main/ofl/notoserifsc/METADATA.pb) | SIL OFL-1.1 | 站名字体专用宋体/衬线字；通过 Penpot 内置 Google 字体库直接选用，未在仓库入库字体文件。无保留字体名（Reserved Font Name）。Penpot 实际加载的字体文件版本与哈希未核实。 |
| 03 | 摘要与标识无衬线：思源黑体 (Noto Sans SC) | [notofonts/noto-cjk](https://github.com/notofonts/noto-cjk) | `v2.004`；上游 commit `523d033d6cb47f4a80c58a35753646f5c3608a78`（对照 Google Fonts METADATA.pb 核实） | Penpot 内置 (Google Fonts `Noto Sans SC`)；许可证据：[Google Fonts OFL.txt](https://github.com/google/fonts/blob/main/ofl/notosanssc/OFL.txt)、[METADATA.pb](https://github.com/google/fonts/blob/main/ofl/notosanssc/METADATA.pb) | SIL OFL-1.1 | 摘要、来源行、日期、导航与状态标识专用无衬线字体；通过 Penpot 内置 Google 字体库直接选用，未在仓库入库字体文件。声明 Reserved Font Name `Source`（仅约束修改后字体软件的命名，不影响原版字体的正常嵌入、展示与使用）。Penpot 实际加载的字体文件版本与哈希未核实。 |
| 04 | 设计协作工具平台：Penpot | [penpot/penpot](https://github.com/penpot/penpot) | `v2.19.0` (SaaS / Open Source) | Penpot Design App & MCP Plugin | MPL-2.0 | 仅使用 Penpot 云端平台及 MCP 插件作为原型产出载体（D-013），未拷贝其服务端或前端源代码。 |
| 11 | 样式内联库：juice | [Automattic/juice](https://github.com/Automattic/juice) | `v12.2.6`；上游 commit `4400c58906440f1041ba444404e5f4d7a2ab09b4`（npm registry `gitHead`，2026-11-25 读取） | npm 包 `juice@12.2.6`（安装路径 `node_modules/juice`，不入库）；许可证据：[LICENSE.md](https://github.com/Automattic/juice/blob/4400c58906440f1041ba444404e5f4d7a2ab09b4/LICENSE.md) | MIT | LD-G1-03 唯一直接依赖（D-009 授权），仅用于把 `design/wechat/template.html` 的 CSS 内联到标签；以 npm 依赖方式安装使用，未拷贝、未改动其源码。安装方式 `npm install --ignore-scripts`，版本固定于 `package.json` 与 `package-lock.json`（`package-lock.json` 的 resolved 均为 `registry.npmjs.org`）。安装 43 个包，其中 38 个可见包经逐一读取 `package.json` 核对许可证：MIT（24）、BSD-2-Clause（8）、MIT-0（3）、ISC（2）、BSD-3-Clause（1），均为宽松许可；完整版本与完整性哈希见 `package-lock.json`。`npm audit --registry=https://registry.npmjs.org` 结果：0 vulnerabilities。 |

---

## 二、历史参考项（当前设计未采用 / 概念参考）

| 序号 | 组件 / 令牌 / 字体 / 库 | 来源仓库 | 基准 Commit SHA / 版本 | 原始文件 / 许可证文件路径 | 许可证 | 历史参考与状态说明 |
|---|---|---|---|---|---|---|
| 05 | 色彩与间距设计令牌标度体系（Tailwind CSS） | [tailwindlabs/tailwindcss](https://github.com/tailwindlabs/tailwindcss) | `v3.4.14` (`788a8d0`) | `src/corePluginList.js`, `stubs/config.full.js` | MIT | **历史参考项（未采用）**：`tokens.json` 的 `dark` 色组仍保留作为未来暗黑模式预留令牌，但当前浅色水墨设计中未启用。 |
| 06 | 组件层级结构与无障碍状态定义（Radix UI） | [radix-ui/primitives](https://github.com/radix-ui/primitives) | `main` (`2024-10-15`, `c7c29be`) | `packages/react/tabs/`, `packages/react/badge/` | MIT | **历史参考项（未采用）**：参考其无障碍交互边界概念，未拷贝代码实现。 |
| 07 | 暗调高对比度排版组件规范（shadcn/ui） | [shadcn-ui/ui](https://github.com/shadcn-ui/ui) | `main` (`2024-11-01`, `e5f419d`) | `apps/www/registry/default/ui/card.tsx` | MIT | **历史参考项（未采用）**：早期暗调卡片参考，当前水墨实色卡片未拷贝代码或样式。 |
| 08 | 界面西文字体：Inter | [rsms/inter](https://github.com/rsms/inter) | `v4.0` | `InterVariable.ttf` | SIL OFL-1.1 | **历史参考项（未采用）**：当前设计与原型未采用，全站西文字符直接使用思源黑体与思源宋体内置西文字形。 |
| 09 | 等宽代码与数据字体：JetBrains Mono | [JetBrains/JetBrainsMono](https://github.com/JetBrains/JetBrainsMono) | `v2.304` | `fonts/ttf/JetBrainsMono-Regular.ttf` | SIL OFL-1.1 | **历史参考项（未采用）**：当前设计与原型未采用。 |
| 10 | WebGL/WebGPU 特效交互组件库：Canvas UI | [DavidHDev/canvas-ui](https://github.com/DavidHDev/canvas-ui) | `a0be3b7` | 全库；许可证：[LICENSE.md](https://github.com/DavidHDev/canvas-ui/blob/main/LICENSE.md) | MIT + Commons Clause | **历史参考项（概念参考）**：**仅参考设计概念，不属于代码依赖**。版权人：David Haz（Copyright (c) 2026 David Haz）。Gate 1 仅参考交互概念并预留静态效果槽位，未安装、未拷贝任何代码。**Gate 3 须 Human 确认三件事**：(1) 是否引入代码；(2) 是否接受 Commons Clause 对组件本身销售、再许可与再分发的限制；(3) 是否符合网站与未来商业化产品的分发方式。 |

---

## 三、第三方许可证全文归档

### 1. SIL Open Font License 1.1（实际采用字体）

#### (1) 霞鹜文楷 TC (LXGW WenKai TC)
- **上游许可证文件**：[LXGW WenKai TC OFL.txt](https://github.com/google/fonts/blob/main/ofl/lxgwwenkaitc/OFL.txt)
- **上游版权声明原文**：
  ```text
  Copyright 2024 The LXGW WenKai Project Authors (https://github.com/lxgw/LxgwWenkaiTC)
  ```
- **保留字体名 (Reserved Font Name)**：无声明。

#### (2) 思源宋体 (Noto Serif SC)
- **上游许可证与元数据文件**：[Noto Serif SC OFL.txt](https://github.com/google/fonts/blob/main/ofl/notoserifsc/OFL.txt) / [Google Fonts METADATA.pb](https://github.com/google/fonts/blob/main/ofl/notoserifsc/METADATA.pb)
- **上游版权声明原文**：
  ```text
  (c) 2017-2024 Adobe (http://www.adobe.com/).
  Copyright 2012 Google Inc. All Rights Reserved.
  ```
- **保留字体名 (Reserved Font Name)**：无声明。

#### (3) 思源黑体 (Noto Sans SC)
- **上游许可证与元数据文件**：[Noto Sans SC OFL.txt](https://github.com/google/fonts/blob/main/ofl/notosanssc/OFL.txt) / [Google Fonts METADATA.pb](https://github.com/google/fonts/blob/main/ofl/notosanssc/METADATA.pb)
- **上游版权声明原文**：
  ```text
  Copyright 2014-2021 Adobe (http://www.adobe.com/), with Reserved Font Name 'Source'
  ```
- **保留字体名 (Reserved Font Name)**：声明了 `Source`（主要约束修改后字体软件的命名，不影响原版字体的正常嵌入、展示与使用）。

#### (4) SIL OFL 1.1 授权条款全文

```text
SIL OPEN FONT LICENSE Version 1.1 - 26 February 2007

PREAMBLE
The goals of the Open Font License (OFL) are to stimulate worldwide
development of collaborative font projects, to support the font creation
efforts of academic and linguistic communities, and to provide a free and
open framework in which fonts may be shared and improved in partnership
with others.

The OFL allows the licensed fonts to be used, studied, modified and
redistributed freely as long as they are not sold by themselves. The
fonts, including any derivative works, can be bundled, embedded, 
redistributed and/or sold with any software provided that any reserved
names are not used by derivative works. The fonts and derivatives,
however, cannot be released under any other type of license. The
requirement for fonts to remain under this license does not apply
to any document created using the fonts or their derivatives.

DEFINITIONS
"Font Software" refers to the set of files released by the Copyright
Holder(s) under this license and clearly marked as such. This may include
source files, build scripts and documentation.

"Reserved Font Name" refers to any name specified as such after the
copyright statement(s).

"Original Version" refers to the collection of Font Software components as
distributed by the Copyright Holder(s).

"Modified Version" refers to any derivative made by adding to, deleting,
or substituting -- in part or in whole -- any of the components of the
Original Version, by changing formats or by porting the Font Software to a
new environment.

"Author" refers to any designer, engineer, programmer, technical
writer or other person who contributed to the Font Software.

PERMISSION & CONDITIONS
Permission is hereby granted, free of charge, to any person obtaining
a copy of the Font Software, to use, study, copy, merge, embed, modify,
redistribute, and sell modified and unmodified copies of the Font Software,
subject to the following conditions:

1) Neither the Font Software nor any of its individual components,
in Original or Modified Versions, may be sold by itself.

2) Original or Modified Versions of the Font Software may be bundled,
redistributed and/or sold with any software, provided that each copy
contains the above copyright notice and this license. These can be
included either as stand-alone text files, human-readable headers or
in the appropriate machine-readable metadata fields within text or
binary files as long as those fields can be easily viewed by the user.

3) No Modified Version of the Font Software may use the Reserved Font
Name(s) unless prominent written permission is granted by the corresponding
Copyright Holder. This restriction only applies to the primary font name as
presented to the users.

4) The name(s) of the Copyright Holder(s) or the Author(s) of the Font
Software shall not be used to promote, endorse or advertise any
Modified Version, except to acknowledge the contribution(s) of the
Copyright Holder(s) and the Author(s) or with their explicit written
permission.

5) The Font Software, modified or unmodified, in part or in whole,
must be distributed entirely under this license, and must not be
distributed under any other license. The requirement for fonts to
remain under this license does not apply to any document created
using the Font Software.

TERMINATION
This license becomes null and void if any of the above conditions are
not met.

DISCLAIMER
THE FONT SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT
OF COPYRIGHT, PATENT, TRADEMARK, OR OTHER RIGHT. IN NO EVENT SHALL THE
COPYRIGHT HOLDER BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
INCLUDING ANY GENERAL, SPECIAL, INDIRECT, INCIDENTAL, OR CONSEQUENTIAL
DAMAGES, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF THE USE OR INABILITY TO USE THE FONT SOFTWARE OR FROM
OTHER DEALINGS IN THE FONT SOFTWARE.
```

---

### 2. MIT + Commons Clause License Condition v1.0 (Canvas UI - 概念参考)

- **来源仓库**：[DavidHDev/canvas-ui](https://github.com/DavidHDev/canvas-ui)
- **基准 Commit**：`a0be3b7`
- **版权人**：David Haz（`Copyright (c) 2026 David Haz`）
- **许可证文件链接**：[LICENSE.md](https://github.com/DavidHDev/canvas-ui/blob/main/LICENSE.md)
- **状态说明**：仅参考设计概念，不属于代码依赖。Gate 1 仅参考交互概念并预留静态效果槽位，未安装、未拷贝任何代码。**Gate 3 须 Human 确认三件事**：(1) 是否引入代码；(2) 是否接受 Commons Clause 对组件本身销售、再许可与再分发的限制；(3) 是否符合网站与未来商业化产品的分发方式。

```text
# MIT + Commons Clause License Condition v1.0

Copyright (c) 2026 David Haz

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, and distribute the Software as part of
an application, website, or product, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

## Commons Clause Restriction

You may use this Software, including for any commercial purpose, so long as
you do not sell, sublicense, or redistribute the components themselves -
whether alone, in a bundle, or as a ported version.

## No Warranty

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

### 3. MIT License (Tailwind CSS, Radix UI, shadcn/ui - 历史参考项)

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

---

### 4. MIT License (juice 12.2.6 - 实际采用依赖)

> 仅作为 npm 依赖安装使用（LD-G1-03），未拷贝其源码进仓库；许可证全文随 npm 包分发，此处留档。来源：[Automattic/juice LICENSE.md](https://github.com/Automattic/juice/blob/4400c58906440f1041ba444404e5f4d7a2ab09b4/LICENSE.md)。

```text
MIT License

Copyright (c) 2021 Automattic

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
