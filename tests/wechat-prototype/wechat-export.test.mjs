import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const REPO_ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const BUILD_SCRIPT = resolve(REPO_ROOT, 'scripts/wechat-prototype/build.mjs');
const SAMPLE_JSON_PATH = resolve(REPO_ROOT, 'design/wechat/samples/ld-g1-04-2026-11-24.json');
const SAMPLE_HTML_PATH = resolve(REPO_ROOT, 'design/wechat/samples/ld-g1-04-2026-11-24.html');

const CATEGORY_META = [
  { name: '监管与合规', sec: 'SEC. 01', en: 'REGULATION', slug: 'regulation' },
  { name: '模型与技术', sec: 'SEC. 02', en: 'MODELS & TECH', slug: 'models' },
  { name: '实务与工具', sec: 'SEC. 03', en: 'PRACTICE & TOOLS', slug: 'practice' },
  { name: '判例与学术', sec: 'SEC. 04', en: 'CASES & ACADEMIA', slug: 'cases' },
  { name: '行业与资本', sec: 'SEC. 05', en: 'INDUSTRY & CAPITAL', slug: 'industry' },
];

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function decodeHtmlEntities(str) {
  return str
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function stripTags(html) {
  return decodeHtmlEntities(html.replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

function sha256Hex(content) {
  return createHash('sha256').update(content).digest('hex');
}

function parseSections(html) {
  const tokenRe = /<\/?section\b([^>]*)>/gi;
  const stack = [];
  const roots = [];

  for (const match of html.matchAll(tokenRe)) {
    const tag = match[0];
    const attrs = match[1] || '';
    const isClose = tag.startsWith('</');

    if (!isClose) {
      const styleMatch = attrs.match(/\bstyle\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
      const node = {
        start: match.index,
        openEnd: match.index + tag.length,
        end: -1,
        attrs,
        style: styleMatch ? (styleMatch[1] ?? styleMatch[2] ?? '') : '',
        children: [],
        outerHtml: '',
        innerHtml: '',
      };
      if (stack.length > 0) {
        stack[stack.length - 1].children.push(node);
      } else {
        roots.push(node);
      }
      stack.push(node);
    } else {
      assert.ok(stack.length > 0, 'HTML <section> 标签闭合不平衡：存在多余 </section>');
      const node = stack.pop();
      node.end = match.index + tag.length;
      node.outerHtml = html.slice(node.start, node.end);
      node.innerHtml = html.slice(node.openEnd, match.index);
    }
  }

  assert.equal(stack.length, 0, 'HTML <section> 标签未完整闭合');
  return roots;
}

const [sampleRaw, sampleHtml] = await Promise.all([
  readFile(SAMPLE_JSON_PATH, 'utf8'),
  readFile(SAMPLE_HTML_PATH, 'utf8'),
]);
const sample = JSON.parse(sampleRaw);
const sectionRoots = parseSections(sampleHtml);

test('D01：成品 HTML 零禁用标签/样式，且主区块均保留 #D5C5AE 暖报纸底色', () => {
  const forbiddenPatterns = [
    ['<style>', /<style[\s>]|<\/style>/i],
    ['class=', /\sclass\s*=/i],
    ['<script>', /<script[\s>]|<\/script>/i],
    ['<link>', /<link[\s>]/i],
    ['@font-face', /@font-face/i],
    ['<table>', /<table[\s>]|<\/table>|<tr[\s>]|<td[\s>]/i],
    ['backdrop-filter', /backdrop-filter/i],
    ['box-shadow', /box-shadow/i],
    ['border-radius', /border-radius/i],
    ['旧浅纸底色 #EBE2D4', /#EBE2D4/i],
  ];

  for (const [label, pattern] of forbiddenPatterns) {
    assert.equal(pattern.test(sampleHtml), false, `成品 HTML 不应包含禁用内容：${label}`);
  }

  const htmlTagMatch = sampleHtml.match(/<html\b[^>]*\bstyle\s*=\s*"([^"]*)"/i);
  const bodyTagMatch = sampleHtml.match(/<body\b[^>]*\bstyle\s*=\s*"([^"]*)"/i);
  assert.ok(htmlTagMatch && /background-color:\s*#D5C5AE/i.test(htmlTagMatch[1]), '<html> 须保留 #D5C5AE 底色');
  assert.ok(bodyTagMatch && /background-color:\s*#D5C5AE/i.test(bodyTagMatch[1]), '<body> 须保留 #D5C5AE 底色');

  assert.equal(sectionRoots.length, 1, '正文应有且仅有一个根 <section>');
  const rootSection = sectionRoots[0];
  assert.match(rootSection.style, /background-color:\s*#D5C5AE/i, '根 <section> 须保留 #D5C5AE 底色');
  assert.equal(rootSection.children.length, 13, '根 <section> 下应有 13 个主区块（报眉/报头/双线/综述/5 章/尾声/底注）');

  rootSection.children.forEach((block, idx) => {
    assert.match(
      block.style,
      /background-color:\s*#D5C5AE/i,
      `第 ${idx + 1} 个主区块 <section> 未保留 #D5C5AE 暖报纸底色`,
    );
    assert.match(
      block.style,
      /margin:\s*0\b/i,
      `第 ${idx + 1} 个主区块 <section> 应保持 margin: 0（零间距缝隙）`,
    );
  });

  const chapterSections = rootSection.children.filter((block) => /SEC\.\s*0[1-5]/.test(block.innerHtml));
  assert.equal(chapterSections.length, 5, '应包含 5 个分类章节主区块');
  for (const chapter of chapterSections) {
    assert.ok(chapter.children.length >= 3, '每个章节至少含章节头、插画包装与 1 条资讯');
    assert.match(chapter.children[0].style, /background-color:\s*#D5C5AE/i, '章节头须保留 #D5C5AE');
    assert.match(chapter.children[1].style, /background-color:\s*#D5C5AE/i, '章节插画外层包装须保留 #D5C5AE');
    for (const itemSection of chapter.children.slice(2)) {
      assert.match(itemSection.style, /background-color:\s*#D5C5AE/i, '每条资讯外层卡片 <section> 须保留 #D5C5AE');
    }
  }
});

test('D02：今日综述内嵌 14 条目录、14 条字段与 AI 初稿/AI 生成插画标识完整', () => {
  assert.equal(sample.items.length, 14, '样本 JSON 应包含 14 条资讯');

  const rootSection = sectionRoots[0];
  const digestWrap = rootSection.children.find((block) => block.innerHtml.includes('今日综述'));
  assert.ok(digestWrap, '必须存在「今日综述」区块');
  assert.match(digestWrap.innerHtml, /今日综述<span[^>]*>AI 初稿<\/span>/, '「今日综述」须带「AI 初稿」标识');
  assert.ok(
    digestWrap.innerHtml.includes(escapeHtml(sample.meta.digest)),
    '「今日综述」须包含样本 meta.digest 原文',
  );
  assert.ok(digestWrap.innerHtml.includes('本期目录 · CONTENTS'), '「今日综述」内应嵌入「本期目录 · CONTENTS」');

  const tocSection = digestWrap.children[0]?.children[0];
  assert.ok(tocSection && tocSection.innerHtml.includes('本期目录 · CONTENTS'), '目录须内嵌在今日综述卡片内');
  const tocPlainText = stripTags(tocSection.innerHtml);
  let lastTocPos = -1;
  for (const item of sample.items) {
    const entry = `${item.num} ${item.title}`;
    const pos = tocPlainText.indexOf(entry, lastTocPos + 1);
    assert.ok(pos > lastTocPos, `今日综述目录缺少或乱序条目：${entry}`);
    lastTocPos = pos;
  }

  const chapterSections = rootSection.children.filter((block) => /SEC\.\s*0[1-5]/.test(block.innerHtml));
  assert.equal(chapterSections.length, CATEGORY_META.length, '章节数量须等于 5 大官方分类');

  const imgTags = [...sampleHtml.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
  assert.equal(imgTags.length, 5, '成品 HTML 应恰好包含 5 张章节 v3.0 插画 <img>');

  const observedItems = [];
  for (let i = 0; i < CATEGORY_META.length; i += 1) {
    const cat = CATEGORY_META[i];
    const chapter = chapterSections[i];
    const expectedCatItems = sample.items.filter((it) => it.category === cat.name);

    assert.ok(chapter.innerHtml.includes(cat.sec), `第 ${i + 1} 章缺少编号 ${cat.sec}`);
    assert.ok(chapter.innerHtml.includes(cat.name), `第 ${i + 1} 章缺少分类名称 ${cat.name}`);
    assert.ok(chapter.innerHtml.includes(escapeHtml(cat.en)), `第 ${i + 1} 章缺少英文分类 ${cat.en}`);

    const expectedImgSrc = `../../assets/illustrations/baseline-${cat.slug}-v3.webp`;
    const artWrap = chapter.children[1];
    assert.ok(artWrap.innerHtml.includes(`src="${expectedImgSrc}"`), `章节 ${cat.name} 缺少 v3.0 插画 ${expectedImgSrc}`);
    assert.ok(artWrap.innerHtml.includes('插画由 AI 生成'), `章节 ${cat.name} 缺少「插画由 AI 生成」图注`);

    const itemSections = chapter.children.slice(2);
    assert.equal(itemSections.length, expectedCatItems.length, `章节 ${cat.name} 资讯条数不符`);

    for (let j = 0; j < expectedCatItems.length; j += 1) {
      const item = expectedCatItems[j];
      const itemSec = itemSections[j];
      const itemHtml = itemSec.innerHtml;

      assert.ok(
        itemHtml.includes(`NO.${escapeHtml(item.num)} · ${escapeHtml(item.category)}`),
        `第 ${item.num} 条缺少编号或分类标签`,
      );
      assert.ok(itemHtml.includes(escapeHtml(item.title)), `第 ${item.num} 条缺少标题`);
      assert.ok(itemHtml.includes(escapeHtml(item.summary)), `第 ${item.num} 条缺少摘要`);
      assert.ok(itemHtml.includes(escapeHtml(item.sourceName)), `第 ${item.num} 条缺少信源名称`);
      assert.ok(itemHtml.includes(escapeHtml(item.sourceDate)), `第 ${item.num} 条缺少信源日期`);
      assert.ok(itemHtml.includes(escapeHtml(item.sourceDomain)), `第 ${item.num} 条缺少来源域名`);
      if (item.factLevel) {
        assert.ok(itemHtml.includes(escapeHtml(item.factLevel)), `第 ${item.num} 条缺少事实层级`);
      }

      assert.equal(itemSec.children.length, 1, `第 ${item.num} 条应含 1 个实务影响内嵌 <section>`);
      const impactHtml = itemSec.children[0].innerHtml;
      assert.match(impactHtml, /实务影响<span[^>]*>· AI 初稿<\/span>/, `第 ${item.num} 条缺少「实务影响 · AI 初稿」标识`);
      assert.ok(impactHtml.includes(escapeHtml(item.impactBrief)), `第 ${item.num} 条缺少 1 句实务影响内容`);
      assert.equal(
        item.impactBrief.split(/[。！？]/).filter(Boolean).length,
        1,
        `第 ${item.num} 条实务影响应控制在 1 句内`,
      );

      observedItems.push(item.num);
    }
  }

  assert.equal(observedItems.length, 14, '应完整渲染全部 14 条资讯');
  const aiDraftCount = (sampleHtml.match(/AI 初稿/g) || []).length;
  assert.ok(aiDraftCount >= 15, `「AI 初稿」标识总数应至少 15 处（1 综述 + 14 条），实际 ${aiDraftCount}`);
  const aiArtCount = (sampleHtml.match(/插画由 AI 生成/g) || []).length;
  assert.equal(aiArtCount, 5, `「插画由 AI 生成」图注应为 5 处，实际 ${aiArtCount}`);
});

test('D03：公众号正文不含任何 <a href> 外链，且样本 JSON 14 条 sourceUrl 均为合法 https:// 链接', () => {
  assert.equal(/<a[\s>]/i.test(sampleHtml), false, '公众号正文不得包含 <a> 标签');
  assert.equal(/\bhref\s*=/i.test(sampleHtml), false, '公众号正文不得包含 href= 属性');

  assert.ok(sampleHtml.includes('查看今日完整版与一手信源'), '文末须保留完整版阅读引导标题');
  assert.ok(sampleHtml.includes('点击左下角「阅读原文」直达'), '文末须保留「阅读原文」入口引导');

  const webUrl = new URL(sample.meta.webDetailUrl);
  assert.equal(webUrl.protocol, 'https:', 'meta.webDetailUrl 须为 https:// 地址');
  assert.ok(sampleHtml.includes(sample.meta.webDetailUrl), '文末脚注须展示 Web 详情页占位纯文本地址');

  assert.equal(sample.items.length, 14, '样本 JSON 须含 14 条资讯');
  for (const item of sample.items) {
    assert.equal(typeof item.sourceUrl, 'string', `第 ${item.num} 条缺少 sourceUrl`);
    assert.ok(item.sourceUrl.startsWith('https://'), `第 ${item.num} 条 sourceUrl 必须以 https:// 开头`);
    const parsed = new URL(item.sourceUrl);
    assert.equal(parsed.protocol, 'https:', `第 ${item.num} 条 sourceUrl 协议必须为 https:`);
    assert.equal(
      parsed.hostname,
      item.sourceDomain,
      `第 ${item.num} 条 sourceUrl 域名 (${parsed.hostname}) 与 sourceDomain (${item.sourceDomain}) 不一致`,
    );
    assert.equal(
      sampleHtml.includes(item.sourceUrl),
      false,
      `第 ${item.num} 条原始 sourceUrl 不应直接渲染进公众号正文`,
    );
  }
});

test('D04：同一输入调用 build.mjs 构建两次，输出 sha256 与仓库样稿完全一致', async () => {
  const workDir = await mkdtemp(join(tmpdir(), 'lexai-wechat-xtest-'));
  const outA = join(workDir, 'a.html');
  const outB = join(workDir, 'b.html');

  try {
    const resA = await execFileAsync(process.execPath, [
      BUILD_SCRIPT,
      '--in',
      SAMPLE_JSON_PATH,
      '--out',
      outA,
    ]);
    const resB = await execFileAsync(process.execPath, [
      BUILD_SCRIPT,
      '--in',
      SAMPLE_JSON_PATH,
      '--out',
      outB,
    ]);

    assert.match(resA.stdout, /5 个分类章节｜14 条资讯/, '首次构建输出摘要异常');
    assert.match(resB.stdout, /5 个分类章节｜14 条资讯/, '二次构建输出摘要异常');

    const [bufA, bufB, bufRepo] = await Promise.all([
      readFile(outA),
      readFile(outB),
      readFile(SAMPLE_HTML_PATH),
    ]);

    const hashA = sha256Hex(bufA);
    const hashB = sha256Hex(bufB);
    const hashRepo = sha256Hex(bufRepo);

    assert.equal(hashA, hashB, `两次构建 sha256 不一致：${hashA} vs ${hashB}`);
    assert.equal(hashA, hashRepo, `构建结果与仓库样稿 sha256 不一致：${hashA} vs ${hashRepo}`);
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
});
