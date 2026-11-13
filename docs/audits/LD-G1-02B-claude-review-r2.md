# PR #16 第二轮复核（LD-G1-02B）

- 审计对象：PR #16，head `987280f`（上一轮 `35b1a9a`）
- 上一轮：[LD-G1-02B-claude-review.md](LD-G1-02B-claude-review.md)
- 本轮提交范围：8 个文件。`design-system.md` 与 `tokens.json` 只改品牌字标；截图只更新 01–04、09，新增 `brand-header-clean.png`
- 检查方法：对 head 做 diff；逐像素比较截图；`grep` 文档与令牌；读 01、03 截图与新增字标特写
- 未检查：Penpot 源文件、字体渲染
- 建议结论：**CHANGES_REQUESTED**（上一轮 15 项全部未修复；本轮新增 1 项 S2、3 项 S3）

## 一、上一轮发现的复查结果

| 编号 | 复查结果 | 证据 |
|---|---|---|
| S1-1 对比度不实 | 未修 | `design-system.md` 仍写 4.6:1、8.2:1、13.5:1、15.6:1；`tokens.json` 的 `inkMuted` 仍为 `#8C8373` |
| S1-2 画板 02/06 无筛选 | 未修 | 01 与 02 差异区仍是 (294,962)–(548,1040)；05 与 06 仍是 (22,896)–(130,936) |
| S2-1 回退滑块白底白字 | 未修 | `tokens.json` 第 19、26 行均为 `#FFFFFF` |
| S2-2 玻璃下文字透出 | 未修 | 截图 01 底部可见卡片文字 |
| S2-3 日期与计数矛盾 | 未修 | 截图 01 仍选中“11月11日（5）”，混排 11-09、11-10 卡片 |
| S2-4 无来源数字与最高级 | 未修 | 截图 01 仍有“汇聚 38 家监管机构”“独家深度”“8大实务场景” |
| S2-5 移动端字号 | 未修 | 05–08 本轮未更新 |
| S2-6 令牌格式与体系 | 未修，且更差 | 68 处 `value`，0 处 `$value`；字号由 6 档增至 8 档 |
| S2-7 徽标混用 | 未修 | 截图 03：“监管与合规”与“AI 初稿”仍是海军蓝实底 |
| S2-8 卡片底部留白 | 未修 | 截图 01：三张卡片仍有约 100px 空白 |
| S3-1 详情页行宽与空白 | 未修 | 截图 03 |
| S3-2 间距不统一 | 未检查 | 04 本轮仅换字标 |
| S3-3 命名漂移 | 未修 | 文档仍称“宣纸墨色” |
| S3-4 冗余截图 | 未修 | `g1-02/` 九张旧图仍在；`stage1/03-style-sheet.png` 与上一版 `09-style-sheet.png` 字节完全相同 |
| S3-5 D09 未标未完成 | 未修 | `penpot.md` 未改 |

[合理推断：Antigravity 本轮执行的是 Human 的品牌字标指令，尚未读到上一轮整改指令。]

## 二、本轮新增发现

| 编号 | 级别 | 发现 | 修复 |
|---|---|---|---|
| N1 | S2 | 数据不一致：`design-system.md` 写站名宽 204px，PR 评论写 207px；评论称“全量画板同步”，但移动端 05–08 未更新，移动站名仍是 20px 且无令牌 | 宽度以 Penpot 实测为准，三处统一；移动站名补令牌 |
| N2 | S3 | 站名 35.5px 大于头条标题 30px，品牌压过内容；slogan 20.5px 加 2.2px 字距是为凑宽度。两个字号都不在字阶内，同屏字号增至 8 档 | 见下文建议 |
| N3 | S3 | 新增 `brand-header-clean.png` 不在交付清单（九张） | 删除，或登记到 `penpot.md` |
| N4 | S3 | 文档写“依据用户决策”，未附原话或链接（AGENTS.md 2：决策须附 Human 原话） | 在 PR 评论补 Human 原话链接 |

字标建议：Human 要求站名与 slogan 等宽并对齐社媒矩阵，这个版式可以保留。请这样落地：
1. 站名降到 32px，slogan 用 18px，字距按 206px 宽度反算 [需 Penpot 实测]；
2. 在令牌里新增 `brand.lockup`（宽度 206px、字号、字距、间距 14px），并写明“按宽度反算，字体渲染变化时重算”；
3. 如果 Human 坚持 35.5px / 20.5px，则作为品牌例外写入令牌，文档注明“不计入同屏五档”。

## 三、整改清单（按顺序执行）

1. **令牌**：用 [LD-G1-02B-tokens-v2.1-proposal.json](LD-G1-02B-tokens-v2.1-proposal.json) 替换 `tokens.json`，再加入 `brand.lockup`。
2. **文档数值**：用下面的脚本重算全部对比度，回填 `design-system.md` 2.3、2.5，并附脚本。
3. **次要文字色**：全部画板 `#8C8373` 改 `#6B6354`；画板上直接放在雾霭蓝灰底上的文字（如“更多”“11月10日”）改用 `#14284B` 或 `#1F1B16`。
4. **画板 02、06**：只放“监管与合规”条目，至少 3 条，含 1 条无一手信源的降级提示。
5. **玻璃**：原型不透明度 82%，条下加 48px 渐隐；回退滑块改 `#14284B` + 白字。
6. **内容**：删除无来源数字与“独家”“全国首个”；大盘只放当日条目并标“示例”，条数与计数一致。
7. **移动端**：摘要不小于 14.5px，来源行不小于 12.5px，导出 `font-size` 清单。
8. **徽标**：头条＝海军蓝实底；未核实＝海军蓝描边；AI 初稿＝灰描边；分类＝纯文字。
9. **卡片与详情页**：链接固定在摘要下 16px；正文栏宽 680px；删除“查验人”。
10. **清理**：删除 `g1-02/` 与 `stage1/03-style-sheet.png`；`penpot.md` 写明 D09 待 LD-G1-04。

## 四、第三轮复核将执行的检查

```bash
# 1. 对比度重算（每项应 ≥4.5:1，大字 ≥3:1）
python3 -I - <<'PY'
def L(h):
    h=h.lstrip('#');r=[int(h[i:i+2],16)/255 for i in (0,2,4)]
    f=lambda c:c/12.92 if c<=.03928 else ((c+.055)/1.055)**2.4
    r=[f(c) for c in r];return .2126*r[0]+.7152*r[1]+.0722*r[2]
def C(a,b):
    x,y=sorted([L(a),L(b)],reverse=True);return round((x+.05)/(y+.05),2)
print(C("#6B6354","#FFFDF8"),C("#FFFFFF","#14284B"),C("#14284B","#A0BCCE"))
PY
# 2. 令牌格式
python3 -m json.tool design/tokens/tokens.json >/dev/null && grep -c '"\$value"' design/tokens/tokens.json
# 3. 残留数字与最高级措辞
grep -rIn -E "38 家|独家|全国首个|8大实务" design/
# 4. 筛选画板确有内容（01 与 02 的差异区域应远大于分类条）
python3 -I -c "from PIL import Image,ImageChops as C;a=Image.open('design/screenshots/g1-02b/01-desktop-dashboard.png').convert('RGB');b=Image.open('design/screenshots/g1-02b/02-desktop-category-filter.png').convert('RGB');print(C.difference(a,b).getbbox())"
```
