来源：GPT 网页版｜LD-G1-02B 字体许可短审计｜基准：分支最新文件已读取，完整 commit SHA 未核实｜日期：2026-11-15

# LD-G1-02B｜字体 OFL 许可与第三方素材记录独立审计

## 一、检查范围

已读取 `ag/ld-g1-02-design-system` 分支以下四份文件：

1. `THIRD_PARTY_NOTICES.md`
2. `design/design-system.md`
3. `design/ASSETS.md`
4. `design/tokens/tokens.json`

基准说明： GitHub 分支当前可读取，但本次未能取得该分支 HEAD 的完整 commit SHA。因此不能将 `1719eae` 或其他提交号冒充本次审计基准。以下结论针对实际读取到的分支文件内容。

审计重点包括字体许可、上游来源、版本及版权登记、第三方参考项目的实际使用状态，以及 Canvas UI 的后续使用条件。

## 二、审计发现

### S1｜阻断

目前未发现足以直接判定 Gate 1 阻断的字体许可问题。

但这不代表字体登记已经全部通过核验。

### S2｜重要

S2-01｜霞鹜文楷的上游仓库登记不准确

- Penpot 使用的字体名称：`LXGW WenKai TC`。
- 第三方登记的来源仓库：`lxgw/LxgwWenKai`。
- Google Fonts 对应字体家族为 `LXGW WenKai TC`，其上游项目应对应 `lxgw/LxgwWenKaiTC`。
- 因此，当前登记的仓库名称与实际选用的字体变体不完全对应。
- Google Fonts 的历史记录可以确认 TC 字体在 2024 年进入字体库，版本为 v1.330。

  [image](https://www.google.com/s2/favicons?domain=https://github.com\&sz=32)

  GitHub+2



审计意见： 建议将来源仓库修正为 `lxgw/LxgwWenKaiTC`，并以 Google Fonts 对应的字体元数据及 OFL 文件作为许可证据。

S2-02｜三套字体的 OFL 许可成立，但登记的版权信息不准确

已直接核对上游许可证文件：

| 字体             | OFL 1.1 | 上游版权信息                               | 版本核验           |
| -------------- | ------- | ------------------------------------ | -------------- |
| LXGW WenKai TC | 已核实     | 2024 The LXGW WenKai Project Authors | v1.330 历史版本已核实 |
| Noto Serif SC  | 已核实     | 2017–2024 Adobe                      | v2.002 已核实     |
| Noto Sans SC   | 已核实     | 2014–2021 Adobe                      | v2.004 已核实     |

官方证据：

- [LXGW WenKai TC OFL](https://github.com/google/fonts/blob/main/ofl/lxgwwenkaitc/OFL.txt?utm_source=chatgpt.com)
- [Noto Serif SC OFL](https://github.com/google/fonts/blob/main/ofl/notoserifsc/OFL.txt?utm_source=chatgpt.com)
- [Noto Sans SC OFL](https://github.com/google/fonts/blob/main/ofl/notosanssc/OFL.txt?utm_source=chatgpt.com)
- [SIL 官方 OFL 1.1](https://openfontlicense.org/?utm_source=chatgpt.com)

其中有一项需要特别注意：

Noto Sans SC 声明了 Reserved Font Name：`Source`。

另外两套字体在本次核对的 OFL 文件中未发现 Reserved Font Name 声明。

[image](https://www.google.com/s2/favicons?domain=https://github.com\&sz=32)

GitHub+3



当前 `THIRD_PARTY_NOTICES.md` 将五套字体的版权合并写成：

- Inter：2016–2024 The Inter Project Authors
- JetBrains Mono：2020–2024 JetBrains s.r.o.
- LXGW：2021–2024 LXGW
- Noto：2014–2024 Adobe Systems Incorporated and Google Inc.

这不是三套实际使用字体各自的准确版权声明。

建议： 分别登记每套字体的原始版权声明，不要使用合并版权声明代替上游文件。

S2-03｜OFL 1.1 允许当前设计使用场景

OFL 1.1 明确允许：

- 商业及非商业使用。
- 字体嵌入网站及软件。
- 使用字体制作图片、文档及其他设计作品。
- 在符合条件时再分发原版或修改版字体。

因此，当前 Penpot 原型、网站排版、公众号图片及截图展示，均属于许可允许的常见使用场景。

需要区分两种情况：

1. 仅使用字体制作内容： 输出的截图、图片及普通文档不需要因此采用 OFL。
2. 随网站或软件分发字体文件： 应保留版权声明和完整 OFL 许可证。修改字体时还必须遵守 Reserved Font Name 等条件。

Noto Sans SC 的 Reserved Font Name `Source` 主要影响修改后的字体软件命名，不意味着项目不能正常使用 Noto Sans SC。

[image](https://www.google.com/s2/favicons?domain=https://openfontlicense.org\&sz=32)

openfontlicense.org+2



S2-04｜第三方登记表存在旧版设计遗留

当前设计系统已经采用：

- 雾霭蓝灰与晨光亚麻背景。
- 暖白实色卡片。
- 深海军蓝单一强调色。
- 三套中文字体。

但登记表仍将 Tailwind、Radix、shadcn、Inter、JetBrains Mono 列为当前设计取用项。

核对结果：

| 登记项            | 当前证据                  | 建议             |
| -------------- | --------------------- | -------------- |
| Tailwind       | 暗调色值仍保留在 `dark` 预留令牌中 | 标注历史参考，暗调令牌未启用 |
| Radix          | 未发现明确的实际取用证据          | 标注未采用          |
| shadcn         | 未发现明确的实际取用证据          | 标注未采用          |
| Inter          | 当前字体令牌未使用             | 删除或标注未采用       |
| JetBrains Mono | 当前字体令牌未使用             | 删除或标注未采用       |

特别说明：`tokens.json` 仍保留 `dark` 色彩组，不能直接宣称 Tailwind 相关色值已经全部删除。

建议： 将登记表改成实际采用项与历史参考项两类。没有实际取用的项目，不应继续描述为当前设计的依赖或组成部分。

### S2-05｜Canvas UI 的许可记录需要补充

项目登记：

- 仓库：[DavidHDev/canvas-ui](https://github.com/DavidHDev/canvas-ui?utm_source=chatgpt.com)
- 基准：`a0be3b7`
- 许可：MIT + Commons Clause
- 当前状态：仅参考概念，没有拷贝代码。

我核对了该基准提交的 `LICENSE.md`。

许可明确允许将软件用于商业应用、网站或产品，但禁止出售、再许可或重新分发组件本身，包括打包或移植后的组件。

[image](https://www.google.com/s2/favicons?domain=https://github.com\&sz=32)

GitHub+1



当前登记表只摘录了 Commons Clause，没有完整记录 MIT 授权条款及版权声明。

建议：

1. 明确标注仅参考设计概念，不属于代码依赖。
2. 补充完整许可证名称、版权人和许可证文件链接。
3. 保留当前基准 commit，避免将未来版本的许可变化误认为当前许可。

Gate 3 必须由 Human 确认：

- 是否正式引入 Canvas UI 代码。
- 是否接受 Commons Clause 对组件本身销售、再许可及重新分发的限制。
- 是否符合网站及未来商业化产品的分发方式。

当前仅参考设计概念，不需要因为登记该项目而提前引入代码或依赖。

### S3｜建议

S3-01｜Noto 字体的来源仓库与基准提交可以进一步精确

Google Fonts 元数据显示：

- Noto Serif SC：上游 `notofonts/noto-cjk`，来源 commit `985fa52c81c1d6692ccdd82bc3656e8fb932fd89`。
- Noto Sans SC：上游 `notofonts/noto-cjk`，来源 commit `523d033d6cb47f4a80c58a35753646f5c3608a78`。

两个版本号分别与 v2.002、v2.004 对应。

[image](https://www.google.com/s2/favicons?domain=https://github.com\&sz=32)

GitHub+3



建议登记完整 commit SHA，而不是只保留版本号。

S3-02｜ASSETS.md 的文字记录基本自洽，但存在商标核验缺口

已核对的文字材料：

- 未使用外部 AI 生图，与 Penpot 原生矢量绘制的说明一致。
- 雷达图形、渐变背景及水墨色斑均描述为自主绘制或 CSS 实现。
- 未使用真实人物肖像的声明，与列出的素材清单没有明显冲突。

但社媒矩阵包含 GitHub、微信、小红书、抖音四个平台的标识。

这些属于真实平台品牌标识。虽然采用自主绘制的矢量路径，但不能仅凭自主绘制认定不存在商标使用问题。

建议补充一句：

> 社媒图标为自主绘制的品牌识别符号，正式发布前核对各平台品牌使用规范，不暗示官方合作关系。

本项未检查实际图片，不能确认视觉呈现是否符合上述声明。

## 三、未检查项

1. Penpot 实际加载字体的文件版本、哈希及具体来源，未核实。
2. 未检查八张设计画板的实际图像内容。
3. 未检查公众号发布平台的字体回退效果。
4. 未执行 Gate 3 的字体文件打包、Web 嵌入及分发测试。
5. 未对 Canvas UI 未来商业分发模式作法律判断。

## 四、建议结论

审计结论：需修改。

没有发现三套字体使用 SIL OFL 1.1 的许可基础存在明显问题。当前主要缺陷是第三方登记表不够准确，以及历史设计参考项没有清理。

建议 Human 要求 Antigravity 只做以下四项修改：

- 修正 LXGW WenKai TC 上游仓库名称及三套字体的版权声明。
- 补充 Noto 字体上游 commit SHA，并说明 Penpot 实际加载版本尚未核实。
- 清理或标注 Tailwind、Radix、shadcn、Inter、JetBrains Mono 的历史参考状态。
- 补充 Canvas UI 完整许可记录，并完善社媒品牌标识说明。

Gate 1 建议： 上述登记修正完成后，可以进入本项审计的复核验收。

Gate 3 保留事项： Canvas UI 是否引入、字体文件是否随网站分发，均由 Human 后续明确决定。

审计基准更正： 经 GitHub 分支引用解析，`ag/ld-g1-02-design-system` 当前 HEAD 为：

`1719eae0c72a1f61c8fd337433d40718faf9bdfc`

[查看基准提交](https://github.com/fitalex/LexAIDaily/commit/1719eae0c72a1f61c8fd337433d40718faf9bdfc?utm_source=chatgpt.com)

本报告仅提供独立审计证据，不代替 Human 的许可确认或法律判断。

状态：⏳ 审计已交付，待修改复核