# 图像生成与设计素材登记表（ASSETS.md）

> **依据**：任务书 LD-G1-02C DoD D03、AGENTS.md 10.10、决策记录 D-014、D-027、D-030 及 `design/illustration-spec.md`（v3.0｜复古报刊半调网点档案拼贴）。
> **要求**：使用 AI 图像生成时，每个素材须登记文件路径、所属分类、生成工具、完整英文 Prompt、生成日期、授权状态（AI 生成原创）；严格核验无真实人物肖像、无仿冒真实机构标识、零文字、三色印刷克制体系（`#D5C5AE` 暖调新闻纸 + `#1D1D1B` 炭黑暖棕半调网点 + 单点 `#C03F13` 朱红）、五类构图多样化与单张 WebP ≤ 120 KB。

---

## 一、LD-G1-02C v3.0 复古报刊半调网点档案拼贴基准插画台账（D-014）

本批素材为 PR #26 返工交付，已彻底清理旧 `v2.0` 清透日光厚涂油画占位图（`baseline-*-v2.webp`），并由 **Antigravity (Gemini 3.8 Flash)** 依据 `design/illustration-spec.md`（v3.0 复古报刊半调网点档案拼贴规范）第二节五类构图原型矩阵与第三节标准化 Prompt 模板，调用内置 **Image Generator（Nano Banana）** 生图子智能体生成原图后，经由居中 `21:9` 裁切重采样至 `1584 × 672` 并以 `cwebp`（`-m 6 -pass 10 -af`）压缩为 WebP 格式（`design/prototype/index.html` 已同步切换指向 `-v3.webp`）。

### 1. 基准插画概览表

| 序号 | 官方分类 | 分类 Slug | 构图原型 | 相对路径 | 分辨率 | 比例 | 格式 | 体积 | 授权状态 |
|:---:|:---|:---|:---|:---|:---:|:---:|:---:|:---:|:---|
| 1 | 监管与合规 | `regulation` | 满幅低角度对称建筑 + 朱红圆印 | `design/assets/illustrations/baseline-regulation-v3.webp` | 1584 × 672 | 21:9 | WebP | 110.04 KiB (112,676 B) | AI 生成原创 |
| 2 | 模型与技术 | `models` | 错位双格剪报拼贴 + 朱红细线圆点 | `design/assets/illustrations/baseline-models-v3.webp` | 1584 × 672 | 21:9 | WebP | 109.44 KiB (112,062 B) | AI 生成原创 |
| 3 | 实务与工具 | `practice` | 满幅俯拍桌面几何 + 朱红丝带 | `design/assets/illustrations/baseline-practice-v3.webp` | 1584 × 672 | 21:9 | WebP | 105.94 KiB (108,480 B) | AI 生成原创 |
| 4 | 判例与学术 | `cases` | 左重右轻对角景深 + 朱红双线档案框 | `design/assets/illustrations/baseline-cases-v3.webp` | 1584 × 672 | 21:9 | WebP | 113.41 KiB (116,132 B) | AI 生成原创 |
| 5 | 行业与资本 | `industry` | 宽幅水平剪报条 + 朱红同心圆准星 | `design/assets/illustrations/baseline-industry-v3.webp` | 1584 × 672 | 21:9 | WebP | 109.48 KiB (112,112 B) | AI 生成原创 |

> **体积合规核验**：5 张基准插画体积均在 `108,480 B` ～ `116,132 B`（`105.94 KiB` ～ `113.41 KiB` / `108.48 KB` ～ `116.13 KB`）之间，在十进制与二进制口径下均**严格满足单张 ≤ 120 KB 的红线要求**。

---

### 2. 逐张详细档案

#### (1) 监管与合规（`baseline-regulation-v3.webp`）
- **文件路径**：`design/assets/illustrations/baseline-regulation-v3.webp`
- **所属分类**：监管与合规（`regulation`）
- **分辨率与比例**：1584 × 672（21:9 超宽构图）
- **文件大小**：110.04 KiB（112,676 bytes）
- **生成与后处理工具**：Antigravity 内置生图子智能体（Image Generator / Nano Banana）+ Pillow `21:9` 居中裁切 + `cwebp`（`-q 30 -m 6 -pass 10 -af`）
- **生成日期**：2026-11-25
- **授权状态**：AI 生成原创（根据 D-014 授权，标注「AI 生成」）
- **v3.0 模板字段**：
  - `{COMPOSITION_LAYOUT}`：`Full-bleed symmetrical low-angle architectural shot`
  - `{SUBJECT_METAPHOR}`：`grand neoclassical courthouse stone colonnade with fluted marble pillars and sharp sunlit geometric shadows converging symmetrically overhead`
  - `{VERMILION_ACCENT}`：`a single clean vermilion-red #C03F13 solid geometric circle stamp overlapping off-center`
- **完整英文 Prompt**：
  ```text
  Ultra-wide 21:9 vintage European newspaper archival halftone print photography and editorial collage. Full-bleed symmetrical low-angle architectural shot, depicting grand neoclassical courthouse stone colonnade with fluted marble pillars and sharp sunlit geometric shadows converging symmetrically overhead. Rendered in crisp charcoal-sepia duotone ink (#1D1D1B) with authentic fine newspaper halftone dot screen and subtle film grain printed on warm grainy vintage newsprint paper (#D5C5AE). Accented solely by a single clean vermilion-red #C03F13 solid geometric circle stamp overlapping off-center. High-craft museum-grade broadsheet editorial aesthetic, zero bright pastel colors, zero oil paint, zero modern neon or sci-fi elements. Strictly no text, no letters, no numbers, no human faces, no logos, no watermark, no outer border frame.
  ```

---

#### (2) 模型与技术（`baseline-models-v3.webp`）
- **文件路径**：`design/assets/illustrations/baseline-models-v3.webp`
- **所属分类**：模型与技术（`models`）
- **分辨率与比例**：1584 × 672（21:9 超宽构图）
- **文件大小**：109.44 KiB（112,062 bytes）
- **生成与后处理工具**：Antigravity 内置生图子智能体（Image Generator / Nano Banana）+ Pillow `21:9` 居中裁切 + `cwebp`（`-q 26 -m 6 -pass 10 -af`）
- **生成日期**：2026-11-25
- **授权状态**：AI 生成原创（根据 D-014 授权，标注「AI 生成」）
- **v3.0 模板字段**：
  - `{COMPOSITION_LAYOUT}`：`Asymmetric split-frame diptych photo-collage with two overlapping halftone clippings on #D5C5AE newsprint`
  - `{SUBJECT_METAPHOR}`：`a faceted crystal optical glass prism refracting light beams on the left panel paired with a precision vintage brass camera lens barrel on the right`
  - `{VERMILION_ACCENT}`：`a delicate vermilion-red #C03F13 thin horizontal registration hairline and tiny graphic dot`
- **完整英文 Prompt**：
  ```text
  Ultra-wide 21:9 vintage European newspaper archival halftone print photography and editorial collage. Asymmetric split-frame diptych photo-collage with two overlapping halftone clippings on #D5C5AE newsprint, depicting a faceted crystal optical glass prism refracting light beams on the left panel paired with a precision vintage brass camera lens barrel on the right. Rendered in crisp charcoal-sepia duotone ink (#1D1D1B) with authentic fine newspaper halftone dot screen and subtle film grain printed on warm grainy vintage newsprint paper (#D5C5AE). Accented solely by a delicate vermilion-red #C03F13 thin horizontal registration hairline and tiny graphic dot. High-craft museum-grade broadsheet editorial aesthetic, zero bright pastel colors, zero oil paint, zero modern neon or sci-fi elements. Strictly no text, no letters, no numbers, no human faces, no logos, no watermark, no outer border frame.
  ```

---

#### (3) 实务与工具（`baseline-practice-v3.webp`）
- **文件路径**：`design/assets/illustrations/baseline-practice-v3.webp`
- **所属分类**：实务与工具（`practice`）
- **分辨率与比例**：1584 × 672（21:9 超宽构图）
- **文件大小**：105.94 KiB（108,480 bytes）
- **生成与后处理工具**：Antigravity 内置生图子智能体（Image Generator / Nano Banana）+ Pillow `21:9` 居中裁切 + `cwebp`（`-q 22 -m 6 -pass 10 -af`）
- **生成日期**：2026-11-25
- **授权状态**：AI 生成原创（根据 D-014 授权，标注「AI 生成」）
- **v3.0 模板字段**：
  - `{COMPOSITION_LAYOUT}`：`Full-bleed overhead top-down flat-lay desk study with diagonal Venetian-blind shadows`
  - `{SUBJECT_METAPHOR}`：`an open blank unprinted paper notebook, a classic fountain pen, blank archival index cards, and steel binder clips arranged neatly on a desk`
  - `{VERMILION_ACCENT}`：`a single vermilion-red #C03F13 silk bookmark ribbon cutting diagonally across the page`
- **完整英文 Prompt**：
  ```text
  Ultra-wide 21:9 vintage European newspaper archival halftone print photography and editorial collage. Full-bleed overhead top-down flat-lay desk study with diagonal Venetian-blind shadows, depicting an open blank unprinted paper notebook, a classic fountain pen, blank archival index cards, and steel binder clips arranged neatly on a desk. Rendered in crisp charcoal-sepia duotone ink (#1D1D1B) with authentic fine newspaper halftone dot screen and subtle film grain printed on warm grainy vintage newsprint paper (#D5C5AE). Accented solely by a single vermilion-red #C03F13 silk bookmark ribbon cutting diagonally across the page. High-craft museum-grade broadsheet editorial aesthetic, zero bright pastel colors, zero oil paint, zero modern neon or sci-fi elements. Strictly no text, no letters, no numbers, no human faces, no logos, no watermark, no outer border frame.
  ```

---

#### (4) 判例与学术（`baseline-cases-v3.webp`）
- **文件路径**：`design/assets/illustrations/baseline-cases-v3.webp`
- **所属分类**：判例与学术（`cases`）
- **分辨率与比例**：1584 × 672（21:9 超宽构图）
- **文件大小**：113.41 KiB（116,132 bytes）
- **生成与后处理工具**：Antigravity 内置生图子智能体（Image Generator / Nano Banana）+ 同相位网点（`9×9` 周期）将右下角朱红双线框无痕上移至 `21:9` 安全区内 + Pillow `21:9` 居中裁切 + `cwebp`（`-q 22 -m 6 -pass 10 -af`）
- **生成日期**：2026-11-25
- **授权状态**：AI 生成原创（根据 D-014 授权，标注「AI 生成」）
- **v3.0 模板字段**：
  - `{COMPOSITION_LAYOUT}`：`Left-weighted diagonal depth-of-field photograph with sharp foreground on the left receding into soft halftone bokeh on the right`
  - `{SUBJECT_METAPHOR}`：`a thick blank cloth-bound case folio with unmarked pages and a minimalist brass balance scale in sharp focus, receding into sunlit library bookshelves`
  - `{VERMILION_ACCENT}`：`a subtle vermilion-red #C03F13 stamped double-line rectangular archive tab mark near the lower-right`
- **完整英文 Prompt**：
  ```text
  Ultra-wide 21:9 vintage European newspaper archival halftone print photography and editorial collage. Left-weighted diagonal depth-of-field photograph with sharp foreground on the left receding into soft halftone bokeh on the right, depicting a thick blank cloth-bound case folio with unmarked pages and a minimalist brass balance scale in sharp focus, receding into sunlit library bookshelves. Rendered in crisp charcoal-sepia duotone ink (#1D1D1B) with authentic fine newspaper halftone dot screen and subtle film grain printed on warm grainy vintage newsprint paper (#D5C5AE). Accented solely by a subtle vermilion-red #C03F13 stamped double-line rectangular archive tab mark near the lower-right. High-craft museum-grade broadsheet editorial aesthetic, zero bright pastel colors, zero oil paint, zero modern neon or sci-fi elements. Strictly no text, no letters, no numbers, no human faces, no logos, no watermark, no outer border frame.
  ```

---

#### (5) 行业与资本（`baseline-industry-v3.webp`）
- **文件路径**：`design/assets/illustrations/baseline-industry-v3.webp`
- **所属分类**：行业与资本（`industry`）
- **分辨率与比例**：1584 × 672（21:9 超宽构图）
- **文件大小**：109.48 KiB（112,112 bytes）
- **生成与后处理工具**：Antigravity 内置生图子智能体（Image Generator / Nano Banana）+ Pillow `21:9` 居中裁切 + `cwebp`（`-q 54 -m 6 -pass 10 -af`）
- **生成日期**：2026-11-25
- **授权状态**：AI 生成原创（根据 D-014 授权，标注「AI 生成」）
- **v3.0 模板字段**：
  - `{COMPOSITION_LAYOUT}`：`Dramatic panoramic horizontal newspaper clipping band with clean cut edges and open warm #D5C5AE newsprint margins`
  - `{SUBJECT_METAPHOR}`：`a sleek financial district skyline silhouette of modern stone and glass architectural towers rising against stark sunlit broadsheet contrast`
  - `{VERMILION_ACCENT}`：`a crisp minimalist vermilion-red #C03F13 geometric concentric ring and thin vertical axis line evoking a precision radar`
- **完整英文 Prompt**：
  ```text
  Ultra-wide 21:9 vintage European newspaper archival halftone print photography and editorial collage. Dramatic panoramic horizontal newspaper clipping band with clean cut edges and open warm #D5C5AE newsprint margins, depicting a sleek financial district skyline silhouette of modern stone and glass architectural towers rising against stark sunlit broadsheet contrast. Rendered in crisp charcoal-sepia duotone ink (#1D1D1B) with authentic fine newspaper halftone dot screen and subtle film grain printed on warm grainy vintage newsprint paper (#D5C5AE). Accented solely by a crisp minimalist vermilion-red #C03F13 geometric concentric ring and thin vertical axis line evoking a precision radar. High-craft museum-grade broadsheet editorial aesthetic, zero bright pastel colors, zero oil paint, zero modern neon or sci-fi elements. Strictly no text, no letters, no numbers, no human faces, no logos, no watermark, no outer border frame.
  ```

---

### 3. 视觉验收清单逐条核对（`design/illustration-spec.md` v3.0 第五节）

- [x] **三色印刷克制体系**：5 张基准图均严格呈现 `#D5C5AE` 暖调新闻纸 + `#1D1D1B` 炭黑暖棕半调网点 + 单点 `#C03F13` 朱红印刷质感，彻底摒弃 v2.0 粉彩厚涂油画风格。
- [x] **五类构图多样化**：分别落地满幅对称古典建筑（`regulation`）、错位双格剪报拼贴（`models`）、满幅俯拍桌面静物（`practice`）、左实右虚对角景深（`cases`）、宽幅水平剪报条（`industry`），在三栏网格中节奏错落。
- [x] **实体隐喻合规**：画面实体隐喻贴合各自官方分类（石柱廊、光学棱镜与镜头、空白笔记本与钢笔、卷宗与天平、金融区建筑剪影），无电脑屏幕、代码、机器人、霓虹电路等违和科技元素。
- [x] **全图零文字与零侵权要素**：全图零文字、零数字、零水印、零人物肖像、零真实机构 Logo、无多余画框边框。
- [x] **工程体积与台账登记**：5 张图均为 `1584 × 672`（21:9）WebP，单张体积 `105.94 KiB` ～ `113.41 KiB`（≤ 120 KB），已完整登记于本表，并在 `design/prototype/index.html` 同步指向 `-v3.webp`。

---

## 二、历史设计素材（LD-G1-02B 归档留存）

### 矢量图形使用清单

1. **社媒矩阵无边框图标（Social Media Matrix Icons）**：
   - 包含 GitHub、微信、小红书、抖音 4 款平台矢量符号。
   - 实现方式：纯矢量路径绘制，无外部位图依赖。
   - 合规说明：社媒图标为自主绘制的品牌识别符号，不暗示官方合作关系。
2. **前沿研报雷达示意组件（Research Report Radar Graphic）**：
   - 实现方式：纯矢量圆环、十字准星与雷达脉冲点阵组合。
3. **背景氛围渐变与水墨晕染（Atmospheric Gradient & Ink Wash）**：
   - 实现方式：纯 CSS 级矢量线性渐变（`#A0BCCE` 到 `#EAE1D3` 对角渐变）与弱不透明度（≤ 12%）水墨柔和色斑，无外挂图片素材。

### 合规与风控核查确认

1. **零肖像与商标侵权风险**：全案无任何真实人物肖像，无任何仿冒或未经授权的真实商业/监管机构标识。
2. **零凭据泄露风险**：所有素材生成均在本地会话内完成，无外部 API 密钥引入仓库。
3. **零外部费用产生**：调用环境内置生图子智能体，未产生超出授权的付费账单，严格遵守 B 级授权与预算边界。
