#!/usr/bin/env node
/**
 * ============================================================================
 *  تدقيق التصدير الثابت — يعمل تلقائيًا بعد `next build`
 * ============================================================================
 *  الفكرة: لا نكتفي بنجاح البناء، بل نفتح مخرجات out/ كما ستُخدَم من Vercel ونتأكد أن:
 *   1. كل صفحة تفاصيل مسلسل تعرض <img> بمسار البوستر الخاص بها (أو البديل النصي الموسوم).
 *   2. ملف الصورة موجود فعلًا داخل التصدير (لا رابط صورة مكسور على النطاق المنشور).
 *   3. قائمة المسلسلات والصفحة الرئيسية تعرضان البوسترات نفسها (لا بطاقة فارغة).
 *   4. فهرس البحث يحمل مسار الصورة نفسها لكل مسلسل (نتائج البحث لا تُعرض بلا بوستر).
 *   5. الأغلفة التصميمية تحمل نص التوضيح «غلاف تصميمي أصلي» في الصفحة.
 *   6. لا يوجد أي مرجع /posters/ في أي صفحة من التصدير pointing to ملف غير موجود.
 * ============================================================================
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { getSeries } from '../lib/content.mjs';

const OUT = path.resolve('out');
assert.ok(fs.existsSync(OUT), 'لا يوجد مجلد out/ — شغّل npm run build قبل هذا التدقيق.');

const readExport = (relativePath) => fs.readFileSync(path.join(OUT, relativePath), 'utf8');
const existsExport = (relativePath) => fs.existsSync(path.join(OUT, relativePath));
const walk = (dir, out = []) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
};

const series = getSeries();
assert.ok(series.length > 0, 'No published series were found for the export audit.');

const DESIGN_NOTE = 'غلاف تصميمي';
const TEMP_NOTE = 'صورة مؤقتة';

let imagedCount = 0;
let designCount = 0;
let temporaryCount = 0;

for (const work of series) {
  const dir = path.join('series', work.slug);
  assert.ok(existsExport(path.join(dir, 'index.html')), `${work.slug}: صفحة التفاصيل غير موجودة في التصدير.`);
  const detail = readExport(path.join(dir, 'index.html'));
  assert.ok(detail.includes(work.title), `${work.slug}: عنوان المسلسل مفقود من صفحة التفاصيل المنشورة.`);

  if (work.posterTemporary) {
    temporaryCount++;
    assert.match(detail, /poster-fallback-status/, `${work.slug}: البديل النصي بدون تنبيه ظاهر.`);
    assert.ok(detail.includes(TEMP_NOTE), `${work.slug}: نص «${TEMP_NOTE}» غير موجود في صفحة التفاصيل.`);
    continue;
  }

  imagedCount++;
  const srcAttr = `src="${work.poster}"`;
  assert.ok(detail.includes(srcAttr), `${work.slug}: صفحة التفاصيل لا تعرض صورة البوستر (${work.poster}).`);
  assert.ok(existsExport(work.poster.replace(/^\/+/, '')), `${work.slug}: ملف البوستر غير موجود في التصدير: out${work.poster}`);

  const posterFile = path.join(OUT, work.poster.replace(/^\/+/, ''));
  const size = fs.statSync(posterFile).size;
  assert.ok(size > 5 * 1024, `${work.slug}: ملف البوستر أصغر من أن يكون صورة (${size}B).`);
  assert.ok(size <= 200 * 1024, `${work.slug}: ملف البوستر ${(size / 1024) | 0}KB يتجاوز حد 200KB.`);

  if (work.posterAlt) {
    assert.ok(detail.includes(work.posterAlt), `${work.slug}: نص alt التوضيحي لا يظهر في صفحة التفاصيل.`);
  }
  if (work.posterDesign) {
    designCount++;
    assert.match(detail, /poster-design-note/, `${work.slug}: صفحة التفاصيل بلا ملاحظة الغلاف التصميمي.`);
    assert.ok(detail.includes(DESIGN_NOTE), `${work.slug}: وسم «${DESIGN_NOTE}» غير موجود في صفحة التفاصيل.`);
  }
}

/* ---- صفحات القوائم ---- */
const home = readExport('index.html');
const seriesIndex = readExport(path.join('series', 'index.html'));
const posterRef = (file) => `src="${file}"`;
// القائمة تعرض أول 24 بطاقة في HTML وتُبقّي الباقي في بيانات الصفحة (يُعرض في المتصفح عند التمرير)
const posterPayload = (file) => `\\"poster\\":\\"${file}\\",\\"hasPoster\\":true`;

for (const work of series) {
  if (work.posterTemporary) continue;
  const shown = seriesIndex.includes(posterRef(work.poster)) || seriesIndex.includes(posterPayload(work.poster));
  assert.ok(shown, `${work.slug}: قائمة /series/ لا تحمل صورة البوستر (${work.poster}) لا في HTML ولا في بيانات الصفحة.`);
}
const listingPosters = (seriesIndex.match(/src="\/posters\//g) ?? []).length;
assert.ok(listingPosters >= 24, `قائمة المسلسلات تعرض ${listingPosters} صورة فقط في HTML (المتوقع ≥ 24).`);
const homePosters = (home.match(/src="\/posters\//g) ?? []).length;
assert.ok(homePosters >= 20, `الصفحة الرئيسية تعرض ${homePosters} صورة بوستر فقط (المتوقع ≥ 20).`);

/* ---- فهرس البحث ---- */
const searchIndex = JSON.parse(readExport('search-index.json'));
for (const work of series) {
  const indexed = searchIndex.works.find((item) => item.id === `series:${work.slug}`);
  assert.ok(indexed, `${work.slug}: مفقود من فهرس البحث المنشور.`);
  if (work.posterTemporary) {
    assert.equal(indexed.poster, null, `${work.slug}: صورة غير موثقة تسرّبت إلى فهرس البحث.`);
  } else {
    assert.equal(indexed.poster, work.poster, `${work.slug}: فهرس البحث لا يشير إلى ملف البوستر الصحيح.`);
  }
}

/* ---- لا يوجد أي رابط صورة مكسور في أي صفحة من التصدير ---- */
const broken = [];
const htmlFiles = walk(OUT);
for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  const refs = new Set([...html.matchAll(/src="(\/posters\/[^"]+)"/g)].map((m) => m[1]));
  for (const ref of refs) {
    if (!existsExport(ref.replace(/^\//, ''))) broken.push(`${path.relative(OUT, file)} → ${ref}`);
  }
}
assert.deepEqual(broken, [], `روابط صور مكسورة في التصدير:\n${broken.join('\n')}`);

console.log(
  `✅ تدقيق التصدير: ${series.length} صفحة تفاصيل (${imagedCount} بصورة بوستر فعلية، ${designCount} غلافًا تصميميًا موسومًا، ${temporaryCount} بديلًا نصيًا) ` +
    `+ الرئيسية + قائمة المسلسلات + فهرس البحث + فحص ${htmlFiles.length} صفحة ضد الروابط المكسورة.`
);
