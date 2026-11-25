# LexAIDaily AI 自动配图统一规范（v3.0｜复古报刊半调网点档案拼贴）

- **状态**：已确认（Human Maintainer，2026-11-24；替代 v2.0 清透日光厚涂油画规范）
- **适用范围**：Gate 1 静态原型基准图库（`LD-G1-02C` / PR #26 返工）、Gate 2 每日自动配图流水线、公众号头图衍生裁切
- **关联决策**：`D-014`（AI 生图合规与溯源登记）、`D-027`（Miranda 复古报刊视觉路线）、`D-030`（暖调加颗粒欧式新闻纸基色 `#D5C5AE`）
- **视觉参考**：暖调加颗粒欧式新闻纸 `#D5C5AE` / 印刷墨黑 `#1D1D1B` / 朱红微标 `#C03F13`（参考 [Niccolò Miranda — Paper Portfolio](https://www.niccolomiranda.com/) 复古纪实报刊美学）

## 一、核心风格 DNA（硬性锁定）

为与 `#D5C5AE` 暖调加颗粒欧式复古新闻纸、`1px #1D1D1B` 直角黑线及 `#C03F13` 朱红微标形成高度统一的铅印报刊语境，全站配图统一锁定为**复古报刊半调网点档案拼贴（Vintage European Newspaper Archival Halftone Print & Editorial Photo-Collage）**：

1. **三色印刷克制体系（炭黑暖棕网点 + 暖调新闻纸 + 单点朱红）**
   - 主影像采用高对比**炭黑/暖棕双色调（charcoal-sepia duotone `#1D1D1B`）**，呈现细腻真实的**报纸半调网点（newspaper halftone dot screen）**与轻微暗房胶片颗粒，直接印制在 `#D5C5AE` 暖调新闻纸基色上。
   - **唯一彩色点睛**：仅允许使用一处克制的**朱红（`#C03F13`）**作为编辑部套色印记（几何圆印、水平定位细线、丝带书签、双线档案框或雷达准星），严禁引入其他高饱和彩色、霓虹光效或厚涂粉彩。
2. **构图多样化（打破单一“左空右物”格局）**
   - 保持 `21:9` 超宽画幅不变，但**严禁所有卡片千篇一律采用“左侧留白 + 右侧单物”**。
   - 围绕五大官方分类定义 **5 套差异化报刊构图原型**（满幅对称建筑、错位双格剪报拼贴、满幅俯拍桌面静物、左重右轻对角景深、宽幅水平剪报条），在三栏网格中形成满幅/留白、俯拍/仰拍、拼贴/景深的错落节奏。
3. **实体隐喻优先（严禁赛博与廉价科技元素）**
   - 将抽象的法律与 AI 议题转译为真实、可触摸的物理场景与静物（古典建筑石柱、玻璃棱镜与光学镜头、卷宗笔记本与钢笔、法典与天平、金融区建筑剪影），**严禁出现电脑屏幕、手机、发光电路、代码瀑布、机器人或全息投影**。
4. **零文字、零人脸纯净画面**
   - 画面内**严禁出现任何文字、字母、数字、印章字迹、真实机构 Logo、人物肖像或水印**，确保与卡片下方的中文新闻标题和朱红微标不产生视觉冲突。

## 二、五大官方分类构图原型与「标题 → 隐喻」映射表

自动化配图节点遵循**「分类定构图原型，标题定主体隐喻」**原则——分类名称严格沿用 `ROADMAP.md` 五大官方分类，不得改名或缩写：

| 官方分类 | `category_slug` | 锁死构图原型 (`{COMPOSITION_LAYOUT}`) | 朱红点睛元素 (`{VERMILION_ACCENT}`) | 标题主题 → 实体隐喻示例 (`{SUBJECT_METAPHOR}`) |
| :--- | :--- | :--- | :--- | :--- |
| **监管与合规** | `regulation` | 满幅低角度对称建筑摄影（`Full-bleed symmetrical low-angle architectural shot`） | 右偏实心几何圆印（`a single clean vermilion-red #C03F13 solid geometric circle stamp overlapping off-center`） | 立法/监管新规 → 古典法院石柱廊与日光阴影；数据跨境/执法 → 宏大石质拱门与精密黄铜刻度尺 |
| **模型与技术** | `models` | 错位双格剪报拼贴（`Asymmetric split-frame diptych photo-collage with two overlapping halftone clippings on #D5C5AE newsprint`） | 贯穿画面的水平细线与定位圆点（`a delicate vermilion-red #C03F13 thin horizontal registration hairline and tiny graphic dot`） | 多模态/推理评测 → 左侧玻璃三棱镜折射光束 + 右侧黄铜光学镜头；RAG/检索架构 → 左侧索引抽屉卡片 + 右侧放大镜特写 |
| **实务与工具** | `practice` | 满幅俯拍桌面几何（`Full-bleed overhead top-down flat-lay desk study with diagonal Venetian-blind shadows`） | 斜切书页的朱红丝带书签（`a single vermilion-red #C03F13 silk bookmark ribbon cutting diagonally across the page`） | 合同审查/办公插件 → 摊开空白笔记本、钢笔、索引卡与金属长尾夹；案管/取证工具 → 整齐排列的卷宗夹与黄铜标尺 |
| **判例与学术** | `cases` | 左重右轻对角景深摄影（`Left-weighted diagonal depth-of-field photograph with sharp foreground on the left receding into soft halftone bokeh on the right`） | 右下角双线矩形档案印框（`a subtle vermilion-red #C03F13 stamped double-line rectangular archive tab mark near the lower-right`） | 司法裁判/前沿学术 → 左侧精装判例卷宗与黄铜天平 + 右侧日光法学图书馆书架；证据规则 → 左侧老式放大镜与案卷 + 右侧档案柜景深 |
| **行业与资本** | `industry` | 宽幅水平裁切剪报条 + 暖纸留白（`Dramatic panoramic horizontal newspaper clipping band with clean cut edges and open warm #D5C5AE newsprint margins`） | 居中朱红同心圆准星与纵轴（`a crisp minimalist vermilion-red #C03F13 geometric concentric ring and thin vertical axis line evoking a precision radar`） | 行业报告/律所商业模式 → 金融区现代石材与玻璃建筑群剪影；产业资助/并购趋势 → 城市天际线或拱形交易所大厅剪影 |

## 三、标准化 AI 自动配图 Prompt 模板（v3.0 固定底座）

Gate 1 基准图库与 Gate 2 每日自动配图流水线统一使用下方英文底座，仅动态替换花括号内的 3 个字段：

```text
Ultra-wide 21:9 vintage European newspaper archival halftone print photography and editorial collage. {COMPOSITION_LAYOUT}, depicting {SUBJECT_METAPHOR}. Rendered in crisp charcoal-sepia duotone ink (#1D1D1B) with authentic fine newspaper halftone dot screen and subtle film grain printed on warm grainy vintage newsprint paper (#D5C5AE). Accented solely by {VERMILION_ACCENT}. High-craft museum-grade broadsheet editorial aesthetic, zero bright pastel colors, zero oil paint, zero modern neon or sci-fi elements. Strictly no text, no letters, no numbers, no human faces, no logos, no watermark, no outer border frame.
```

### Gate 2 每日自动配图流水线衔接规则（供 Gate 2 实现，Gate 1 不写代码）

1. **触发时机（Human-in-the-Loop 降本红线）**：不在“全网采集”阶段生图，而是在运营者**人工勾选完当日 5–8 条最终入选快讯后**再批量触发，控制单日成本与耗时。
2. **LLM 标题转译步骤**：先由文本模型读取每条入选快讯的 `title`、`category` 与 `summary`，查上表锁定 `{COMPOSITION_LAYOUT}` 与 `{VERMILION_ACCENT}`，仅动态生成 **15–28 个英文词**的 `{SUBJECT_METAPHOR}`（必须为具体可触摸的物理静物/建筑光影，禁止科技陈词滥调）。
3. **自动后处理与兜底**：生图后自动裁切/校验 `21:9`、压缩为 WebP（≤ 120 KB）、写入当日元数据与 `ASSETS.md` 溯源记录；若单条生图失败或触发审核拦截，自动回退至对应分类的 `baseline-{category_slug}-v3.webp` 基准图，保证日更零中断。

## 四、工程参数与 D-014 合规验收清单

### 1. 前端与图片工程规格
- **生成比例**：固定 `21:9`（推荐分辨率 `1584 × 672`），与前端卡片画框 `aspect-ratio: 16 / 7` 像素级吻合。
- **前端样式**：图片容器 `1px solid #1D1D1B` 直角黑框（`border-radius: 0`），无阴影、无毛玻璃；`object-fit: cover`。
- **格式与体积**：统一压缩为 WebP（备选 JPG），单张体积 **≤ 120 KB**。
- **文件命名**：
  - Gate 1 基准图库：`design/assets/illustrations/baseline-{category_slug}-v3.webp`（同步保留或清理旧 v2 并在 `index.html` 中指向 v3）。
  - Gate 2 每日自动配图：`YYYY-MM-DD-{category_slug}-{item_id}.webp`。

### 2. D-014 合规红线与归档要求
- **必登台账**：每张入库插画必须在 `design/ASSETS.md` 中完整登记：文件路径、所属分类、生成工具与模型版本、完整英文 Prompt、生成日期、授权状态（AI 生成原创）。
- **页面标识**：在详情弹窗保留「插画由 AI 生成」说明，不伪装为人类摄影或版权图库作品。
- **零侵权底线**：严禁生成真实人物肖像，严禁仿冒真实法院徽标、政府机关印章、律所或科技公司 Logo。

## 五、视觉验收核对项（PR #26 返工审图必查）

- [ ] 5 张基准图均严格呈现 `#D5C5AE` 暖调新闻纸 + `#1D1D1B` 炭黑暖棕半调网点 + 单点 `#C03F13` 朱红印刷质感。
- [ ] 5 张基准图分别落地 5 种差异化构图（满幅对称建筑、错位双格拼贴、满幅俯拍桌面、左实右虚景深、宽幅剪报条），放入三栏网格不显单调。
- [ ] 画面实体隐喻贴合各自官方分类，无电脑屏幕、代码、机器人、霓虹电路等违和科技元素。
- [ ] 全图零文字、零数字、零水印、零人物肖像、零真实机构 Logo、无多余画框边框。
- [ ] 单张 WebP 体积 ≤ 120 KB，完整登记于 `design/ASSETS.md`。
