#!/usr/bin/env node
/**
 * ============================================================================
 *  توليد أغطية تصميمية أصلية لكل مسلسل + تركيبها في المحتوى
 * ============================================================================
 *  لماذا؟ كانت ملفات المسلسلات تشير إلى صور تجريدية مولّدة لا تمتّ للأعمال بصلة،
 *  ثم أُفرغت حقول البوستر فاختفت الصورة تمامًا من البطاقات. هذا السكربت يعيد
 *  لكل مسلسل غلافًا مرئيًا مميزًا له:
 *    - مبني بأداة المشروع lib/make-poster.py (تصميم أصلي بالكامل، بدون أي صورة من الإنترنت).
 *    - يحمل اسم العمل وسنته ولغة العمل، وعبارة توضّح أنه ليس البوستر الرسمي.
 *    - نمطه ولوحته اللونية مشتقة من نوع العمل، والزخرفة مشتقة من بصمة المعرّف
 *      فلا يتطابق غلاف مسلسلَين.
 *  ثم يحدّث في ملف المحتوى: poster / posterDesign / posterAlt / posterAltEn.
 *
 * الاستخدام:
 *   PYTHON=/path/python(with-pillow) node tools/series-covers-install.mjs [--dry-run] [--only=slug,slug]
 *   node tools/series-covers-install.mjs --verify      # فحص النتائج فقط دون توليد
 * ============================================================================
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import matter from 'gray-matter';
import { dims } from './img-dims.mjs';

const ROOT = process.cwd();
const SERIES_DIR = path.join(ROOT, 'content', 'series');
const POSTERS_DIR = path.join(ROOT, 'public', 'posters');
const MANIFEST = path.join(ROOT, 'tools', 'poster-hunt', 'series-covers.json');
const PYTHON = process.env.PYTHON || 'python3';

const NON_LATIN_SRC = '\\u0600-\\u06FF\\u3040-\\u30FF\\u3400-\\u4DBF\\u4E00-\\u9FFF\\u3000-\\u303F\\uF900-\\uFAFF\\uAC00-\\uD7AF\\u0590-\\u05FF\\u0900-\\u097F';
const NON_LATIN = new RegExp(`[${NON_LATIN_SRC}]`);
const isLatin = (s) => !!s && !NON_LATIN.test(s) && /[A-Za-zÀ-ÖØ-öø-ÿ]/.test(s);

const LANG_LABEL = {
  en: 'ENGLISH', tr: 'TURKISH', ko: 'KOREAN', ar: 'ARABIC', es: 'SPANISH', ja: 'JAPANESE',
  hi: 'HINDI', de: 'GERMAN', fr: 'FRENCH', it: 'ITALIAN', da: 'DANISH', he: 'HEBREW', zh: 'CHINESE',
};

/**
 * نوع العمل يحدد اللوحات الممكنة (أنماط الزخارف فقط، لتبقى البطاقات عائلة بصرية واحدة)،
 * وبصمة المعرّف تختار واحدة منها — فيتنوّع الشكل من مسلسل لآخر دون فوضى.
 */
const GENRE_PALETTES = [
  ['horror', ['crimson', 'noir']],
  ['thriller', ['crimson', 'noir', 'ink']],
  ['crime', ['noir', 'crimson']],
  ['mystery', ['noir', 'ink']],
  ['sci-fi', ['teal', 'ink']],
  ['fantasy', ['teal', 'sand', 'ink']],
  ['adventure', ['teal', 'sand']],
  ['animation', ['teal', 'rose']],
  ['action', ['noir', 'crimson', 'teal']],
  ['romance', ['rose', 'sand', 'teal']],
  ['family', ['teal', 'sand']],
  ['documentary', ['ink', 'sand']],
  ['social', ['ink', 'sand']],
  ['comedy', ['ink', 'sand', 'rose']],
  ['black-comedy', ['noir', 'ink']],
  ['satire', ['ink', 'noir']],
  ['drama', null], // تُحسم من لغة العمل
];

const DRAMA_BY_LANG = {
  ar: ['sand', 'crimson', 'noir'],
  fa: ['sand', 'crimson', 'noir'],
  tr: ['sand', 'noir', 'crimson'],
  ko: ['ink', 'teal', 'rose'],
  ja: ['ink', 'teal', 'noir'],
  hi: ['sand', 'ink', 'teal'],
};

function crc32(str) {
  let c = ~0;
  for (let i = 0; i < str.length; i++) {
    c ^= str.charCodeAt(i);
    for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
  }
  return (~c >>> 0) || 1;
}

function pickStyle(slug, genres, language) {
  let options = null;
  for (const [genre, list] of GENRE_PALETTES) {
    if (!genres.includes(genre)) continue;
    options = list ?? (DRAMA_BY_LANG[language] ?? ['sand', 'noir', 'ink']);
    break;
  }
  if (!options) options = DRAMA_BY_LANG[language] ?? ['sand', 'noir', 'ink'];
  return options[crc32(`${slug}:style`) % options.length];
}

function prettifySlug(slug) {
  const small = new Set(['of', 'the', 'a', 'an', 'and', 'for', 'in', 'on', 'to']);
  return slug
    .split('-')
    .map((w, i) => (i > 0 && small.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ');
}

/** الاسم المطبوع على الغلاف: الحرف اللاتيني من العنوان الأصلي (بدون الشرح بين قوسين). */
function printedTitle(data, slug) {
  const raw = String(data.titleOriginal || '').trim();
  const m = raw.match(/^(.*?)\s*\((.*)\)\s*$/);
  const clean = (s) =>
    s
      // نحذف المقاطع غير اللاتينية (كورية/يابانية/عبرية/هندية…) ثم نرمّم المسافات
      .replace(new RegExp(`[${NON_LATIN_SRC}]+`, 'g'), ' ')
      .replace(/\s*[,–:]\s*$/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  const outsideRaw = m ? m[1] : raw;
  const outside = clean(outsideRaw);
  const inside = clean(m ? m[2] : '');
  // لو كان الجزء الخارجي مختلطًا (مثال: «SKY 캐슬») فالأسم الكامل داخل القوسين أوضح
  const mixedOutside = NON_LATIN.test(outsideRaw);
  if (!mixedOutside && isLatin(outside)) return outside;
  if (isLatin(inside)) return inside;
  if (isLatin(outside)) return outside;
  if (isLatin(data.title)) return String(data.title).trim();
  return prettifySlug(slug);
}

function arPosterAlt(data, printed) {
  const name = String(data.title || printed).trim();
  return `غلاف تصميمي أصلي من إنتاج سينمانا لمسلسل «${name}»${data.year ? ` (${data.year})` : ''} — ليس البوستر الرسمي للعمل`;
}

function enPosterAlt(printed, year) {
  return `Original design cover created for Cinemana for ${printed}${year ? ` (${year})` : ''} — not the official poster`;
}

function patchFrontMatter(md, { poster, ar, en }) {
  const lines = md.split('\n');
  if (lines[0].trimEnd() !== '---') throw new Error('front matter غير موجودة');
  const end = lines.findIndex((l, i) => i > 0 && l.trimEnd() === '---');
  if (end < 1) throw new Error('front matter غير صحيحة');
  const body = lines.slice(end + 1);
  let head = lines.slice(1, end);

  head = head.filter((l) => !/^\s*posterTemporary\s*:/.test(l) && !/^\s*posterDesign\s*:/.test(l));
  const idx = head.findIndex((l) => /^\s*poster\s*:/.test(l));
  const posterLine = `poster: "${poster}"`;
  const designLine = 'posterDesign: true   # غلاف تصميمي أصلي من إنتاج الموقع — ليس بوسترًا رسميًا';
  if (idx >= 0) head.splice(idx, 1, posterLine, designLine);
  else head.push(posterLine, designLine);

  const altIdx = head.findIndex((l) => /^\s*posterAlt\s*:/.test(l));
  const altEnIdx = head.findIndex((l) => /^\s*posterAltEn\s*:/.test(l));
  if (altIdx >= 0) head[altIdx] = `posterAlt: "${ar}"`;
  else head.splice(head.length, 0, `posterAlt: "${ar}"`);
  const newAltEn = `posterAltEn: "${en}"`;
  const altPos = head.findIndex((l) => /^\s*posterAlt\s*:/.test(l));
  if (altEnIdx >= 0) head[altEnIdx] = newAltEn;
  else head.splice(altPos + 1, 0, newAltEn);

  return ['---', ...head, '---', ...body].join('\n');
}

const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const verifyOnly = args.has('--verify');
const onlyArg = process.argv.find((a) => a.startsWith('--only='));
const only = onlyArg ? new Set(onlyArg.slice('--only='.length).split(',')) : null;

const files = fs
  .readdirSync(SERIES_DIR)
  .filter((f) => f.endsWith('.md'))
  .sort()
  .map((f) => path.join(SERIES_DIR, f));

const manifest = [];
let patched = 0;
for (const file of files) {
  const slug = path.basename(file, '.md');
  if (only && !only.has(slug)) continue;
  const { data } = matter(fs.readFileSync(file, 'utf8'));
  if (data.draft) continue;

  const printed = printedTitle(data, slug);
  if (NON_LATIN.test(printed)) console.error(`! ${slug}: الاسم المطبوع يحتوي حروفًا غير لاتينية: «${printed}»`);
  const style = pickStyle(slug, Array.isArray(data.genres) ? data.genres : [], data.language);
  // السنة تُطبع منفصلة في الأسفل؛ لا نكررها داخل الـkicker
  const kicker = ['TV SERIES', LANG_LABEL[data.language] || String(data.language || '').toUpperCase()].filter(Boolean).join(' · ');
  const target = path.join(POSTERS_DIR, `${slug}.jpg`);
  const rel = path.posix.join('/posters', `${slug}.jpg`);
  const ar = arPosterAlt(data, printed);
  const en = enPosterAlt(printed, data.year);

  if (!verifyOnly) {
    if (dryRun) {
      console.log(`· ${slug} → style=${style} title="${printed}" kicker=${kicker}`);
    } else {
      execFileSync(
        PYTHON,
        [
          path.join(ROOT, 'lib', 'make-poster.py'),
          slug,
          '--style', style,
          '--out', POSTERS_DIR,
          '--title', printed,
          '--year', String(data.year ?? ''),
          '--kicker', kicker,
        ],
        { stdio: ['ignore', 'pipe', 'inherit'] }
      );
      fs.writeFileSync(file, patchFrontMatter(fs.readFileSync(file, 'utf8'), { poster: rel, ar, en }));
      patched++;
    }
  }

  const d = fs.existsSync(target) ? dims(target) : null;
  if (!d) console.error(`✖ ${slug}: ملف الغلاف غير موجود/غير قابل للقراءة: ${target}`);
  else if (d.w !== 600 || d.h !== 900) console.error(`✖ ${slug}: الأبعاد ليست 600×900 بل ${d.w}×${d.h}`);
  else if (d.bytes > 200 * 1024) console.error(`✖ ${slug}: حجم الملف ${(d.bytes / 1024) | 0}KB يتجاوز 200KB`);

  manifest.push({
    slug,
    title: data.title,
    printed,
    year: data.year ?? null,
    language: data.language ?? null,
    genres: data.genres ?? [],
    style,
    file: rel,
    width: d?.w ?? null,
    height: d?.h ?? null,
    bytes: d?.bytes ?? null,
  });
}

manifest.sort((a, b) => (a.slug < b.slug ? -1 : 1));
if (!dryRun) {
  fs.mkdirSync(path.dirname(MANIFEST), { recursive: true });
  fs.writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
}

const bad = manifest.filter((m) => m.width !== 600 || m.height !== 900 || (m.bytes ?? 0) > 200 * 1024);
const byStyle = manifest.reduce((acc, m) => ({ ...acc, [m.style]: (acc[m.style] ?? 0) + 1 }), {});
console.log(`\n${verifyOnly ? 'تحقّق' : 'توليد'}: ${manifest.length} مسلسل  |  ملفات معدّلة: ${patched}  |  مشكلات: ${bad.length}`);
console.log(`التوزيع على الأنماط: ${Object.entries(byStyle).map(([k, v]) => `${k}=${v}`).join(' · ')}`);
console.log(`المانيفست: ${path.relative(ROOT, MANIFEST)}`);
if (bad.length) {
  for (const m of bad) console.log(`  ! ${m.slug}: ${m.width}×${m.height} ${((m.bytes ?? 0) / 1024) | 0}KB`);
  process.exit(1);
}
