#!/usr/bin/env node
/**
 * LexAIDaily 微信公众号排版原型构建脚本（LD-G1-03）
 *
 * 作用：读取 design/wechat/template.html 与一份样本 JSON，用 juice（MIT，固定版本）
 * 把模板 CSS 内联到每个标签的 style 属性，生成可粘贴进公众号后台的成品 HTML。
 *
 * 用法：
 *   node scripts/wechat-prototype/build.mjs --in <样本 JSON> --out <成品 HTML>
 *   node scripts/wechat-prototype/build.mjs --in <样本 JSON> --out <成品 HTML> --template <模板 HTML>
 *
 * 约束（任务书第四节 D02）：
 *   - 成品 HTML 不得含 <style>、<script>、class=、<link>、@font-face；
 *   - 全部样式内联；不加载外部字体或外链 CSS。
 * 脚本在写盘前会自行断言；断言失败即退出，不产出半成品。
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import juice from 'juice';

const REPO_ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const DEFAULT_TEMPLATE = resolve(REPO_ROOT, 'design/wechat/template.html');
const CATEGORIES = ['监管与合规', '模型与技术', '实务与工具', '判例与学术', '行业与资本'];
const ITEM_START = '<!-- ITEM_TEMPLATE_START -->';
const ITEM_END = '<!-- ITEM_TEMPLATE_END -->';

function usage() {
  return [
    '用法：node scripts/wechat-prototype/build.mjs --in <样本 JSON> --out <成品 HTML> [--template <模板 HTML>]',
    '',
    '  --in        样本 JSON 路径（必填）',
    '  --out       成品 HTML 输出路径（必填）',
    '  --template  模板 HTML 路径（可选，默认 design/wechat/template.html）',
    '  --help      显示本说明',
  ].join('\n');
}

function parseArgs(argv) {
  const args = { in: null, out: null, template: DEFAULT_TEMPLATE, help: false };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--help' || token === '-h') {
      args.help = true;
      continue;
    }
    const eq = token.indexOf('=');
    const key = eq === -1 ? token : token.slice(0, eq);
    const valueFromEq = eq === -1 ? null : token.slice(eq + 1);
    if (key === '--in' || key === '--out' || key === '--template') {
      const value = valueFromEq === null ? argv[(i += 1)] : valueFromEq;
      if (!value || value.startsWith('--')) {
        throw new Error(`参数 ${key} 缺少取值。\n\n${usage()}`);
      }
      args[key.slice(2)] = value;
      continue;
    }
    throw new Error(`未知参数：${token}\n\n${usage()}`);
  }
  return args;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function requireString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`样本 JSON 缺少必填字符串字段：${field}`);
  }
  return value.trim();
}

function validateSample(data, sourcePath) {
  if (!data || typeof data !== 'object') throw new Error(`${sourcePath} 不是合法的 JSON 对象`);
  const meta = data.meta;
  if (!meta || typeof meta !== 'object') throw new Error('样本 JSON 缺少 meta 对象');
  for (const field of ['site', 'column', 'dateLine', 'date', 'webDetailUrl', 'disclaimer']) {
    requireString(meta[field], `meta.${field}`);
  }
  if (!Array.isArray(data.items) || data.items.length === 0) {
    throw new Error('样本 JSON 的 items 必须是非空数组');
  }
  data.items.forEach((item, index) => {
    const at = `items[${index}]`;
    if (!item || typeof item !== 'object') throw new Error(`${at} 不是对象`);
    const num = requireString(item.num, `${at}.num`);
    if (!/^\d{2}$/.test(num)) throw new Error(`${at}.num 必须是两位数字，例如 "01"`);
    if (!CATEGORIES.includes(item.category)) {
      throw new Error(`${at}.category 必须是五类官方标签之一：${CATEGORIES.join('、')}`);
    }
    for (const field of ['title', 'summary', 'impactBrief', 'sourceName', 'sourceDate']) {
      requireString(item[field], `${at}.${field}`);
    }
    if (!item.sourceDomain && !item.sourceUrl) {
      throw new Error(`${at} 需要 sourceDomain（来源域名）或 sourceUrl（留档用）`);
    }
    if (item.sourceDomain !== undefined) {
      requireString(item.sourceDomain, `${at}.sourceDomain`);
    }
    for (const field of ['headline', 'unverified']) {
      if (item[field] !== undefined && typeof item[field] !== 'boolean') {
        throw new Error(`${at}.${field} 必须是布尔值`);
      }
    }
  });
  return data;
}

function renderCategoryIndex(items) {
  const counts = new Map(CATEGORIES.map((name) => [name, 0]));
  for (const item of items) counts.set(item.category, counts.get(item.category) + 1);
  return CATEGORIES.map(
    (name) => `<span class="wx-cat">${escapeHtml(name)} ${counts.get(name)}</span>`,
  ).join('');
}

function sourceDomainOf(item) {
  if (item.sourceDomain) return item.sourceDomain;
  try {
    return new URL(item.sourceUrl).hostname;
  } catch {
    return '';
  }
}

function renderItem(item, template) {
  const headlineBadge = item.headline
    ? '<span class="wx-tag wx-tag-headline">头条</span>'
    : '';
  const unverifiedBadge = item.unverified
    ? '<span class="wx-tag wx-tag-unverified">未核实</span>'
    : '';
  const replacements = {
    ITEM_NUM: escapeHtml(item.num),
    ITEM_CATEGORY: escapeHtml(item.category),
    ITEM_FACT_LEVEL: escapeHtml(item.factLevel || ''),
    ITEM_HEADLINE_BADGE: headlineBadge,
    ITEM_UNVERIFIED_BADGE: unverifiedBadge,
    ITEM_TITLE: escapeHtml(item.title),
    ITEM_SUMMARY: escapeHtml(item.summary),
    ITEM_IMPACT: escapeHtml(item.impactBrief),
    ITEM_SOURCE: escapeHtml(item.sourceName),
    ITEM_SOURCE_DATE: escapeHtml(item.sourceDate),
    ITEM_SOURCE_DOMAIN: escapeHtml(sourceDomainOf(item)),
    ITEM_READMORE: `第 ${escapeHtml(item.num)} 条 · 完整实务锚点与一手信源`,
  };
  let html = template;
  for (const [key, value] of Object.entries(replacements)) {
    html = html.split(`{{${key}}}`).join(value);
  }
  return html;
}

function renderDocument(template, sample) {
  const start = template.indexOf(ITEM_START);
  const end = template.indexOf(ITEM_END);
  if (start === -1 || end === -1 || end < start) {
    throw new Error(`模板缺少 ${ITEM_START} / ${ITEM_END} 标记`);
  }
  const itemTemplate = template.slice(start + ITEM_START.length, end).trim();
  const itemsHtml = sample.items.map((item) => renderItem(item, itemTemplate)).join('\n');

  const meta = sample.meta;
  const digestBlock = meta.digest
    ? [
        '<section class="wx-digest">',
        '  <p class="wx-digest-head">今日综述<span class="wx-draft">AI 初稿</span></p>',
        `  <p class="wx-digest-text">${escapeHtml(meta.digest)}</p>`,
        '</section>',
      ].join('\n')
    : '';
  const internalBanner = meta.internal
    ? `<p class="wx-banner">${escapeHtml(meta.internalNote || '内部样稿 · 不对外发布')}</p>`
    : '';

  const globals = {
    DOC_TITLE: escapeHtml(
      `${meta.site}｜${meta.column}｜${meta.date}${meta.internal ? '（内部样稿）' : ''}`,
    ),
    INTERNAL_BANNER: internalBanner,
    SITE: escapeHtml(meta.site),
    COLUMN: escapeHtml(meta.column),
    DATE_LINE: escapeHtml(meta.dateLine),
    CATEGORY_INDEX: renderCategoryIndex(sample.items),
    DIGEST_BLOCK: digestBlock,
    TOTAL: String(sample.items.length),
    WEB_URL: escapeHtml(meta.webDetailUrl),
    READ_ORIGINAL_NOTE: escapeHtml(meta.readOriginalNote || ''),
    DISCLAIMER: escapeHtml(meta.disclaimer),
    FOOTER_LINE: escapeHtml(`${meta.site} · ${meta.column} · ${meta.date}`),
  };

  let html = template.slice(0, start) + itemsHtml + template.slice(end + ITEM_END.length);
  for (const [key, value] of Object.entries(globals)) {
    html = html.split(`{{${key}}}`).join(value);
  }
  const leftovers = html.match(/\{\{[A-Z0-9_]+\}\}/g);
  if (leftovers) {
    throw new Error(`模板存在未替换的占位符：${[...new Set(leftovers)].join('、')}`);
  }
  return html;
}

function inlineStyles(html) {
  return juice(html, {
    applyStyleTags: true,
    removeStyleTags: true,
    preserveMediaQueries: false,
    preserveFontFaces: false,
    applyWidthAttributes: false,
    applyHeightAttributes: false,
    applyAttributesTableElements: false,
    applyLinkTags: false,
    removeLinkTags: true,
    inlinePseudoElements: false,
    preserveImportant: true,
    xmlMode: false,
  });
}

function postProcess(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<link\b[^>]*>/gi, '')
    .replace(/\sclass\s*=\s*("[^"]*"|'[^']*')/gi, '')
    .replace(/\n{3,}/g, '\n\n');
}

function assertOutput(html, itemCount, hasDigest) {
  const forbidden = [
    ['<style>', /<style[\s>]/i],
    ['<script>', /<script[\s>]/i],
    ['class=', /\sclass\s*=/i],
    ['<link>', /<link[\s>]/i],
    ['@font-face', /@font-face/i],
    ['backdrop-filter', /backdrop-filter/i],
    ['box-shadow', /box-shadow/i],
    ['border-radius', /border-radius/i],
  ];
  for (const [label, pattern] of forbidden) {
    if (pattern.test(html)) throw new Error(`成品 HTML 含禁止内容：${label}`);
  }
  if (!/background-color:\s*#D5C5AE/i.test(html)) {
    throw new Error('成品 HTML 未保留新闻纸底色 #D5C5AE');
  }
  const impactHeads = html.match(/>实务影响</g) || [];
  if (impactHeads.length !== itemCount) {
    throw new Error(`“实务影响”区块数量不符：期望 ${itemCount} 处，实际 ${impactHeads.length} 处`);
  }
  const draftMarks = html.match(/AI 初稿/g) || [];
  const minimumDraftMarks = itemCount + (hasDigest ? 1 : 0); // 每条资讯 1 处 + 今日综述 1 处（如有）
  if (draftMarks.length < minimumDraftMarks) {
    throw new Error(`“AI 初稿”标识不足：期望至少 ${minimumDraftMarks} 处，实际 ${draftMarks.length} 处`);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  if (!args.in || !args.out) {
    throw new Error(`--in 与 --out 均为必填。\n\n${usage()}`);
  }
  const inPath = resolve(process.cwd(), args.in);
  const outPath = resolve(process.cwd(), args.out);
  const templatePath = resolve(process.cwd(), args.template);

  const [template, raw] = await Promise.all([
    readFile(templatePath, 'utf8'),
    readFile(inPath, 'utf8'),
  ]);
  let sample;
  try {
    sample = JSON.parse(raw);
  } catch (error) {
    throw new Error(`${inPath} 不是合法 JSON：${error.message}`);
  }
  validateSample(sample, inPath);

  const rendered = renderDocument(template, sample);
  const inlined = postProcess(inlineStyles(rendered));
  assertOutput(inlined, sample.items.length, Boolean(sample.meta.digest));

  await mkdir(dirname(outPath), { recursive: true });
  const bytes = Buffer.byteLength(inlined, 'utf8');
  await writeFile(outPath, `${inlined.trimEnd()}\n`, 'utf8');
  process.stdout.write(
    `已生成 ${args.out}｜${sample.items.length} 条资讯｜${bytes} bytes｜模板 ${args.template}\n`,
  );
}

main().catch((error) => {
  process.stderr.write(`build.mjs 失败：${error.message}\n`);
  process.exitCode = 1;
});
