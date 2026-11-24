# 图像生成与设计素材登记表（ASSETS.md）

> **依据**：任务书 LD-G1-02C DoD D03、AGENTS.md 10.10、决策记录 D-014、D-027 及 `design/illustration-spec.md`（v2.0）。
> **要求**：使用 AI 图像生成时，每个素材须登记文件路径、所属分类、生成工具与模型版本、完整英文 Prompt、生成日期、授权状态（AI 生成原创）；严格核验无真实人物肖像、无仿冒真实机构标识、零文字、100% 满涂厚涂油画、单张 WebP ≤ 120 KB。

---

## 一、LD-G1-02C v2.0 清透日光厚涂油画基准插画台账（D-014）

本批素材由 **Antigravity (Gemini 3.8 Flash)** 依据 `design/illustration-spec.md`（v2.0 清透日光厚涂油画自动配图规范）第三节标准化 Prompt 模板与第二节官方五大分类锁死色谱，通过内置 **Nano Banana (`gemini-nano-banana-2.1`)** 图像生成引擎生成，经由垂直居中裁切至 `21:9`（`1584 × 672`）并压缩为 WebP 格式。

### 1. 基准插画概览表

| 序号 | 官方分类 | 分类 Slug | 相对路径 | 分辨率 | 比例 | 格式 | 体积 | 授权状态 |
|:---:|:---|:---|:---|:---:|:---:|:---:|:---:|:---|
| 1 | 监管与合规 | `regulation` | `design/assets/illustrations/baseline-regulation-v2.webp` | 1584 × 672 | 21:9 | WebP | 105.81 KB | AI 生成原创 |
| 2 | 模型与技术 | `models` | `design/assets/illustrations/baseline-models-v2.webp` | 1584 × 672 | 21:9 | WebP | 116.29 KB | AI 生成原创 |
| 3 | 实务与工具 | `practice` | `design/assets/illustrations/baseline-practice-v2.webp` | 1584 × 672 | 21:9 | WebP | 112.36 KB | AI 生成原创 |
| 4 | 判例与学术 | `cases` | `design/assets/illustrations/baseline-cases-v2.webp` | 1584 × 672 | 21:9 | WebP | 93.97 KB | AI 生成原创 |
| 5 | 行业与资本 | `industry` | `design/assets/illustrations/baseline-industry-v2.webp` | 1584 × 672 | 21:9 | WebP | 115.96 KB | AI 生成原创 |

> **体积合规核验**：5 张基准插画体积均在 93.97 KB ～ 116.29 KB 之间，**严格满足单张 ≤ 120 KB 的红线要求**。

---

### 2. 逐张详细档案

#### (1) 监管与合规（`baseline-regulation-v2.webp`）
- **文件路径**：`design/assets/illustrations/baseline-regulation-v2.webp`
- **所属分类**：监管与合规（`regulation`）
- **分辨率与比例**：1584 × 672（21:9 超宽构图）
- **文件大小**：105.81 KB
- **生成工具与模型版本**：Antigravity 内置生图子智能体（Image Generator）/ Nano Banana (`gemini-nano-banana-2.1`)
- **生成日期**：2026-11-24
- **授权状态**：AI 生成原创（根据 D-014 授权，标注「AI 生成」）
- **色谱与隐喻参数**：
  - `{SHADOW_HUE}`：`clean bright cornflower periwinkle-blue`（矢车菊浅蓝）
  - `{SUNLIGHT_HUE}`：`radiant butter-yellow morning light and burnt-tangerine`（奶油黄晨光 + 赤陶橘）
  - `{CLEAN_SURFACE_AND_LIGHT_BEAM}`：`a clean pale limestone surface bathed in a crisp diagonal morning light beam`
  - `{SINGLE_MINIMAL_OBJECT}`：`an ivory-white cloth-bound legal ledger and a smooth terracotta wax seal resting in the sunlight on the right`
- **完整英文 Prompt**：
  ```text
  Fully painted opaque impasto oil painting with thick buttery palette-knife strokes and subtle fine canvas weave beneath rich luminous paint, zero raw or unpainted canvas. Minimalist serene scene inspired by sunlit contemporary impressionism: a clean pale limestone surface bathed in a crisp diagonal morning light beam, with an ivory-white cloth-bound legal ledger and a smooth terracotta wax seal resting in the sunlight on the right. Clean, airy, fresh color harmony with pure chromatic pastel shadows (clean bright cornflower periwinkle-blue) and glowing sunlit highlights (radiant butter-yellow morning light and burnt-tangerine), zero muddy browns, zero dusty beige, zero dark cluttered corners, zero heavy dark wood or antiques. Ultra-wide 21:9 composition with 55% calm breathing negative space on the left. Strictly no text, no letters, no numbers, no watermark, no signature, no human faces, no logos.
  ```

---

#### (2) 模型与技术（`baseline-models-v2.webp`）
- **文件路径**：`design/assets/illustrations/baseline-models-v2.webp`
- **所属分类**：模型与技术（`models`）
- **分辨率与比例**：1584 × 672（21:9 超宽构图）
- **文件大小**：116.29 KB
- **生成工具与模型版本**：Antigravity 内置生图子智能体（Image Generator）/ Nano Banana (`gemini-nano-banana-2.1`)
- **生成日期**：2026-11-24
- **授权状态**：AI 生成原创（根据 D-014 授权，标注「AI 生成」）
- **色谱与隐喻参数**：
  - `{SHADOW_HUE}`：`crisp cool blue-grey wet slate`（雨后青石蓝灰）
  - `{SUNLIGHT_HUE}`：`cerulean sky and warm peach-cream cloud reflection`（晴空天蓝 + 暖桃云光）
  - `{CLEAN_SURFACE_AND_LIGHT_BEAM}`：`a clean wet slate surface reflecting cool open sky with a bright diagonal beam of morning sunlight`
  - `{SINGLE_MINIMAL_OBJECT}`：`a transparent optical glass prism casting pure refracted spectral highlights on the right`
- **完整英文 Prompt**：
  ```text
  Fully painted opaque impasto oil painting with thick buttery palette-knife strokes and subtle fine canvas weave beneath rich luminous paint, zero raw or unpainted canvas. Minimalist serene scene inspired by sunlit contemporary impressionism: a clean wet slate surface reflecting cool open sky with a bright diagonal beam of morning sunlight, with a transparent optical glass prism casting pure refracted spectral highlights on the right. Clean, airy, fresh color harmony with pure chromatic pastel shadows (crisp cool blue-grey wet slate) and glowing sunlit highlights (cerulean sky and warm peach-cream cloud reflection), zero muddy browns, zero dusty beige, zero dark cluttered corners, zero heavy dark wood or antiques. Ultra-wide 21:9 composition with 55% calm breathing negative space on the left. Strictly no text, no letters, no numbers, no watermark, no signature, no human faces, no logos.
  ```

---

#### (3) 实务与工具（`baseline-practice-v2.webp`）
- **文件路径**：`design/assets/illustrations/baseline-practice-v2.webp`
- **所属分类**：实务与工具（`practice`）
- **分辨率与比例**：1584 × 672（21:9 超宽构图）
- **文件大小**：112.36 KB
- **生成工具与模型版本**：Antigravity 内置生图子智能体（Image Generator）/ Nano Banana (`gemini-nano-banana-2.1`)
- **生成日期**：2026-11-24
- **授权状态**：AI 生成原创（根据 D-014 授权，标注「AI 生成」）
- **色谱与隐喻参数**：
  - `{SHADOW_HUE}`：`clean pastel blush-rose plaster`（淡玫瑰粉墙面）
  - `{SUNLIGHT_HUE}`：`luminous butter-cream morning light`（乳白奶油窗光）
  - `{CLEAN_SURFACE_AND_LIGHT_BEAM}`：`a clean pastel plaster table bathed in a warm angle of window sunlight`
  - `{SINGLE_MINIMAL_OBJECT}`：`an open blank off-white linen notebook and a minimalist brass fountain pen on the right`
- **完整英文 Prompt**：
  ```text
  Fully painted opaque impasto oil painting with thick buttery palette-knife strokes and subtle fine canvas weave beneath rich luminous paint, zero raw or unpainted canvas. Minimalist serene scene inspired by sunlit contemporary impressionism: a clean pastel plaster table bathed in a warm angle of window sunlight, with an open blank off-white linen notebook and a minimalist brass fountain pen on the right. Clean, airy, fresh color harmony with pure chromatic pastel shadows (clean pastel blush-rose plaster) and glowing sunlit highlights (luminous butter-cream morning light), zero muddy browns, zero dusty beige, zero dark cluttered corners, zero heavy dark wood or antiques. Ultra-wide 21:9 composition with 55% calm breathing negative space on the left. Strictly no text, no letters, no numbers, no watermark, no signature, no human faces, no logos.
  ```

---

#### (4) 判例与学术（`baseline-cases-v2.webp`）
- **文件路径**：`design/assets/illustrations/baseline-cases-v2.webp`
- **所属分类**：判例与学术（`cases`）
- **分辨率与比例**：1584 × 672（21:9 超宽构图）
- **文件大小**：93.97 KB
- **生成工具与模型版本**：Antigravity 内置生图子智能体（Image Generator）/ Nano Banana (`gemini-nano-banana-2.1`)
- **生成日期**：2026-11-24
- **授权状态**：AI 生成原创（根据 D-014 授权，标注「AI 生成」）
- **色谱与隐喻参数**：
  - `{SHADOW_HUE}`：`luminous pastel sage-celadon`（浅鼠尾草青绿）
  - `{SUNLIGHT_HUE}`：`warm golden-apricot afternoon sunlight`（暖杏金斜阳）
  - `{CLEAN_SURFACE_AND_LIGHT_BEAM}`：`a clean pale stone desk illuminated by a broad diagonal golden afternoon sunbeam`
  - `{SINGLE_MINIMAL_OBJECT}`：`an open thick parchment jurisprudence folio and a small minimalist brass balance scale on the right`
- **完整英文 Prompt**：
  ```text
  Fully painted opaque impasto oil painting with thick buttery palette-knife strokes and subtle fine canvas weave beneath rich luminous paint, zero raw or unpainted canvas. Minimalist serene scene inspired by sunlit contemporary impressionism: a clean pale stone desk illuminated by a broad diagonal golden afternoon sunbeam, with an open thick parchment jurisprudence folio and a small minimalist brass balance scale on the right. Clean, airy, fresh color harmony with pure chromatic pastel shadows (luminous pastel sage-celadon) and glowing sunlit highlights (warm golden-apricot afternoon sunlight), zero muddy browns, zero dusty beige, zero dark cluttered corners, zero heavy dark wood or antiques. Ultra-wide 21:9 composition with 55% calm breathing negative space on the left. Strictly no text, no letters, no numbers, no watermark, no signature, no human faces, no logos.
  ```

---

#### (5) 行业与资本（`baseline-industry-v2.webp`）
- **文件路径**：`design/assets/illustrations/baseline-industry-v2.webp`
- **所属分类**：行业与资本（`industry`）
- **分辨率与比例**：1584 × 672（21:9 超宽构图）
- **文件大小**：115.96 KB
- **生成工具与模型版本**：Antigravity 内置生图子智能体（Image Generator）/ Nano Banana (`gemini-nano-banana-2.1`)
- **生成日期**：2026-11-24
- **授权状态**：AI 生成原创（根据 D-014 授权，标注「AI 生成」）
- **色谱与隐喻参数**：
  - `{SHADOW_HUE}`：`velvety dusty-lavender violet`（薰衣草紫）
  - `{SUNLIGHT_HUE}`：`glowing golden-honey afternoon sunlight`（金蜜斜阳）
  - `{CLEAN_SURFACE_AND_LIGHT_BEAM}`：`a quiet architectural stone sill illuminated by a deep diagonal golden-honey light shaft`
  - `{SINGLE_MINIMAL_OBJECT}`：`a minimalist brass hourglass with trickle of golden sand and a warm terracotta vessel on the right`
- **完整英文 Prompt**：
  ```text
  Fully painted opaque impasto oil painting with thick buttery palette-knife strokes and subtle fine canvas weave beneath rich luminous paint, zero raw or unpainted canvas. Minimalist serene scene inspired by sunlit contemporary impressionism: a quiet architectural stone sill illuminated by a deep diagonal golden-honey light shaft, with a minimalist brass hourglass with trickle of golden sand and a warm terracotta vessel on the right. Clean, airy, fresh color harmony with pure chromatic pastel shadows (velvety dusty-lavender violet) and glowing sunlit highlights (glowing golden-honey afternoon sunlight), zero muddy browns, zero dusty beige, zero dark cluttered corners, zero heavy dark wood or antiques. Ultra-wide 21:9 composition with 55% calm breathing negative space on the left. Strictly no text, no letters, no numbers, no watermark, no signature, no human faces, no logos.
  ```

---

### 3. 视觉验收清单逐条核对（design/illustration-spec.md 第五节）

- [x] **100% 满涂油画颜料**：全画面采用刮刀厚涂油画质感完整覆盖，无任何未上色的灰褐粗糙生麻布外露。
- [x] **清透彩色阴影**：阴影严格呈现矢车菊蓝、青石蓝灰、淡玫瑰粉、鼠尾草绿与薰衣草紫，无泥褐、脏米灰或浑浊死黑暗角。
- [x] **呼吸留白构图**：左侧 55%–60% 保持纯净光影留白，视觉焦点锁定在右侧斜射日光光斑内。
- [x] **贴合分类的极简静物**：仅含 1–2 件日常可触摸静物（法典与印章、光学棱镜、米白笔记本与钢笔、判例卷宗与天平、黄铜沙漏与陶罐），彻底杜绝芯片、发光电路、全息投影与机器人等违和科技元素。
- [x] **全图零文字与侵权要素**：全图零文字、零字母、零数字、零水印签名、零真实人物肖像、零仿冒机构 Logo。
- [x] **报刊纸面协调性**：与 `#C8C0B6` 报刊纸底、`1px #1D1D1B` 黑色直角边框、`#C03F13` 朱红微标及中文标题浑然一体。

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
