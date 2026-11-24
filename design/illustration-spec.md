# LexAIDaily AI 自动配图统一规范（v2.0｜清透日光厚涂油画）

- **状态**：已确认（Human Maintainer，2026-11-23）
- **适用范围**：Gate 1 静态原型（`LD-G1-02C`）、Gate 2 每日自动配图流水线、公众号头图衍生裁切
- **关联决策**：`D-014`（AI 生图合规与溯源登记）、`D-027`（Miranda 报刊视觉路线与 Design-in-Code 迭代）
- **视觉参考**：复古新闻纸基色 `#C8C0B6` / 印刷墨黑 `#1D1D1B` / 朱红微标 `#C03F13`（参考 [Niccolò Miranda — Paper Portfolio](https://www.niccolomiranda.com/)）

## 一、核心风格 DNA（硬性锁定）

为了在 `#C8C0B6` 复古报刊纸底色上实现画廊级阅读质感，同时彻底避开科技媒体常见的赛博霓虹、全息网格与低质 3D 渲染感，全站配图统一锁定为**当代印象派清透日光厚涂油画（Clean Sunlit Impasto Palette-Knife Oil Painting）**：

1. **100% 满涂不透明颜料（严禁裸露生麻布）**
   - 必须使用厚重如黄油般的刮刀油画颜料（thick buttery palette-knife strokes）完整覆盖整张画面，保留清晰的刀锋堆叠与笔触起伏。
   - 仅允许在厚颜料下方隐约透出细腻画布织纹，**严禁出现未上色的灰褐色生麻布或粗糙亚麻留白**（避免画面发灰、发脏、显未完成）。
2. **清透粉彩阴影 + 强方向性斜射日光（严禁灰褐浑浊色）**
   - 阴影必须是干净的**有彩色粉彩阴影**（矢车菊蓝、淡玫瑰粉、青石蓝灰、浅鼠尾草青、薰衣草紫），**严禁泥褐色（muddy browns）、脏米灰（dusty beige）或沉重深色老木头**。
   - **日光本身是画面主角**：一道锐利而温润的斜射晨光或午后斜阳（奶油黄、乳白、暖杏金、金蜜色）切过干净墙面或桌面，形成通透明快的冷暖对比。
3. **极简构图与呼吸留白**
   - 采用超宽 `21:9` 构图，**画面左侧 55%–60% 保持平静、干净的纯色满涂留白区**（墙面、石板或柔光树影）。
   - 视觉焦点集中于右侧日光光斑内，**仅放置 1 个核心隐喻主物（最多加 1 个辅助小物）**，杜绝杂物堆砌与繁复古董摆件。
4. **零文字纯净画面**
   - 画面内**严禁出现任何文字、字母、数字、印章字迹、水印或签名**，确保与卡片下方的中文新闻标题、朱红微标不发生视觉冲突。

## 二、五大官方分类色谱与「标题 → 静物隐喻」映射表

自动化配图节点必须严格遵守**「分类锁死色系，标题决定静物」**原则——分类名称严格沿用 `ROADMAP.md` 五大官方分类，不得改名或缩写：

| 官方分类 | 英文 `category_slug` | 锁死阴影底色 (`{SHADOW_HUE}`) | 锁死日光焦点色 (`{SUNLIGHT_HUE}`) | 标题主题 → 极简实体隐喻映射（限 1–2 件日常可触摸物体） |
| :--- | :--- | :--- | :--- | :--- |
| **监管与合规** | `regulation` | 矢车菊浅蓝 (`clean bright cornflower periwinkle-blue`) | 奶油黄晨光 + 赤陶橘 (`radiant butter-yellow morning light and burnt-tangerine`) | 立法/新规/白皮书 → 象牙白精装法典与赤陶火漆印章；执法/处罚 → 极简黄铜砝码或戒尺；跨境数据合规 → 白瓷盘与黄铜罗盘 |
| **模型与技术** | `models` | 雨后青石蓝灰 (`crisp cool blue-grey wet slate`) | 晴空天蓝 + 暖桃云光 (`cerulean sky and warm peach-cream cloud reflection`) | 新模型/多模态突破 → 透明玻璃三棱镜与折射光斑；开源/轻量化 → 雨后晴空水洼与单枚鲜绿叶；推理/检索升级 → 玻璃镇纸或极简放大镜 |
| **实务与工具** | `practice` | 淡玫瑰粉墙面 (`clean pastel blush-rose plaster`) | 乳白奶油窗光 (`luminous butter-cream morning light`) | 合同审查/文书工具 → 摊开的米白笔记本与钢笔；知识库/检索 → 叠放的米色索引卡片与丝带书签；工作流提效 → 白窗微扬纱帘与清茶杯 |
| **判例与学术** | `cases` | 浅鼠尾草青绿 (`luminous pastel sage-celadon`) | 暖杏金斜阳 (`warm golden-apricot afternoon sunlight`) | 经典判例/司法裁判 → 摊开的厚米白判例卷宗与极简黄铜天平；学术论文/实证报告 → 摊开的精装书卷与极简金属书签 |
| **行业与资本** | `industry` | 薰衣草紫 (`velvety dusty-lavender violet`) | 金蜜斜阳 (`glowing golden-honey afternoon sunlight`) | 融资/并购/估值 → 极简黄铜沙漏或暖橘陶罐（配窗外鲜绿枝叶）；律所战略/行业趋势 → 黄铜罗盘或窗外日光下的建筑剪影 |

## 三、标准化 AI 自动配图 Prompt 模板（v2.0 固定底座）

所有单条资讯自动配图时，固定使用下方英文底座，仅动态替换花括号内的 4 个字段：

```text
Fully painted opaque impasto oil painting with thick buttery palette-knife strokes and subtle fine canvas weave beneath rich luminous paint, zero raw or unpainted canvas. Minimalist serene scene inspired by sunlit contemporary impressionism: {CLEAN_SURFACE_AND_LIGHT_BEAM}, with {SINGLE_MINIMAL_OBJECT}. Clean, airy, fresh color harmony with pure chromatic pastel shadows ({SHADOW_HUE}) and glowing sunlit highlights ({SUNLIGHT_HUE}), zero muddy browns, zero dusty beige, zero dark cluttered corners, zero heavy dark wood or antiques. Ultra-wide 21:9 composition with 55% calm breathing negative space on the left. Strictly no text, no letters, no numbers, no watermark, no signature, no human faces, no logos.
```

### LLM 标题转译静物隐喻规则（供 Gate 2 自动流水线调用）

在调用生图模型前，先由文本模型读取当日快讯的 `title`、`category` 与 `summary`，按以下规则生成 `{CLEAN_SURFACE_AND_LIGHT_BEAM}` 与 `{SINGLE_MINIMAL_OBJECT}`：

1. **具象转译原则**：将抽象的法律或 AI 概念转译为安静、可触摸的日常物理静物（纸、书、玻璃、黄铜、陶瓷、植物、窗光、水洼），**严禁直接出现电脑屏幕、手机、代码、芯片、机器人、机械手、发光电路或全息投影**。
2. **数量上限**：`{SINGLE_MINIMAL_OBJECT}` 控制在 **12–22 个英文词**，最多 1 个主物 + 1 个辅助小物，且明确位于右侧阳光光斑内。
3. **色系锁定**：`{SHADOW_HUE}` 与 `{SUNLIGHT_HUE}` 必须直接查上表硬编码填入，不允许模型自由发挥偏色。

## 四、工程参数与 D-014 合规验收清单

### 1. 前端与图片工程规格
- **生成比例**：固定 `21:9`（推荐分辨率 `1584 × 672`），与前端卡片画框 `aspect-ratio: 16 / 7` 像素级吻合，零拉伸变形。
- **前端样式**：图片容器采用 `1px solid #1D1D1B` 直角黑框（`border-radius: 0`），无弥散投影、无毛玻璃遮罩；图片设置 `width: 100%; height: 100%; object-fit: cover; object-position: center;`。
- **格式与体积**：上线前统一压缩为 WebP（备选 JPG），单张体积 **≤ 120 KB**。
- **文件命名**：`YYYY-MM-DD-{category_slug}-{item_id}.webp`（Gate 1 基准图库命名为 `baseline-{category_slug}-v2.webp`）。

### 2. D-014 合规红线与归档要求
- **必登台账**：每张入库插画必须在 `design/ASSETS.md` 中完整登记：文件路径、所属分类、生成工具与模型版本、完整英文 Prompt、生成日期、授权状态（AI 生成原创）。
- **页面标识**：在详情跳板页（或页面页脚/图注区）保留「插画由 AI 生成」说明，不伪装为人类摄影或手绘版权作品。
- **零侵权底线**：严禁生成真实人物肖像（法官、律师、高管、学者），严禁仿冒真实法院徽标、政府机关印章、律所或科技公司 Logo。

## 五、视觉验收核对项（审图必查）

- [ ] 画面 100% 满涂油画颜料，无未上色的灰褐生麻布外露。
- [ ] 阴影色调清透干净，无发灰、发脏的泥褐色或沉重暗角。
- [ ] 左侧约 55%–60% 为平静呼吸留白区，视觉重心落在右侧自然光斑内。
- [ ] 画面中的 1–2 件静物隐喻与该条资讯分类及标题语义贴合，无科技/赛博违和元素。
- [ ] 全图零文字、零数字、零水印、零人物肖像、零真实机构 Logo。
- [ ] 嵌入 `#C8C0B6` 复古纸面与 `1px #1D1D1B` 黑色直角边框后，与中文标题及朱红微标和谐统一。
