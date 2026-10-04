/**
 * ============================================================================
 *  تدقيق بوسترات المسلسلات — npm run test:posters
 * ============================================================================
 *  القواعد التي لا تقبل التساهل:
 *   1. كل مسلسل منشور يجب أن يعرض صورة فعلًا (ملف محلي موجود) أو بديلًا نصيًا موسومًا.
 *   2. لا يُسمح إطلاقًا بمسار صورة خارجي، ولا بمسار داخلي بلا ملف (بوستر مكسور).
 *   3. الأغلفة التصميمية من إنتاج الموقع (posterDesign) يجب أن تُعرّف نفسها في alt
 *      صراحةً: «تصميم أصلي» + «ليس البوستر الرسمي».
 *   4. لا صورة مكررة بين مسلسلَين، والمقاس 600×900 والحجم ≤ 200KB.
 *  ملاحظة: نستخدم أدوات المشروع فقط (gray-matter عبر lib/content.mjs + قراءة ترويسة الصورة)
 *  حتى يعمل الفحص في أي بيئة دون اعتماديات إضافية.
 * ============================================================================
 */
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { loadRaw } from './content.mjs';
import { dims } from '../tools/img-dims.mjs';

const ROOT = process.cwd();
const { series, errors } = loadRaw();
const published = series.filter((work) => !work.draft);

assert.deepEqual(errors, [], `Content validation errors:\n${errors.join('\n')}`);
assert.ok(published.length > 0, 'There must be published series to audit.');

const temporary = [];
const design = [];
const official = [];
const digests = new Map();

for (const work of published) {
  assert.ok(work.title, `${work.file}: missing series title.`);

  if (work.posterTemporary) {
    temporary.push(work);
    assert.equal(work.poster, null, `${work.file}: temporary artwork must not be exposed as a poster URL.`);
    assert.equal(work.hasPoster, false, `${work.file}: temporary artwork must use the title placeholder.`);
    assert.match(work.posterAlt ?? '', /مؤقت|temporary/i, `${work.file}: temporary status must be documented in alt text.`);
    assert.match(work.posterAlt ?? '', /ليس|ليست|not/i, `${work.file}: must explicitly say that it is not official artwork.`);
    continue;
  }

  assert.ok(work.hasPoster, `${work.file}: a published series must show a poster that resolves to a local file.`);
  assert.ok(work.poster?.startsWith('/posters/'), `${work.file}: poster must be a local /posters/ path (external links are not allowed).`);

  const file = path.join(ROOT, 'public', work.poster.replace(/^\/+/, ''));
  assert.ok(fs.existsSync(file), `${work.file}: ملف البوستر غير موجود في public/: ${work.poster}`);
  const d = dims(file);
  assert.ok(d, `${work.file}: ${work.poster} not readable as JPEG/PNG/WebP.`);
  assert.equal(d.w, 600, `${work.file}: poster width must be 600 (got ${d.w}).`);
  assert.equal(d.h, 900, `${work.file}: poster height must be 900 (got ${d.h}).`);
  assert.ok(d.bytes <= 200 * 1024, `${work.file}: poster is ${Math.round(d.bytes / 1024)}KB — keep it under 200KB.`);

  const sha = crypto.createHash('sha1').update(fs.readFileSync(file)).digest('hex');
  assert.ok(!digests.has(sha), `${work.file}: poster is byte-identical to ${digests.get(sha)} — كل مسلسل يحتاج صورته الخاصة.`);
  digests.set(sha, work.file);

  if (work.posterDesign) {
    design.push(work);
    assert.match(work.posterAlt ?? '', /تصميم|design/i, `${work.file}: alt must say the cover is original site design artwork.`);
    assert.match(work.posterAlt ?? '', /ليس|ليست|غير رسمي|not the official/i, `${work.file}: alt must state it is not the official poster.`);
  } else {
    official.push(work);
    assert.ok(!work.posterAlt || !/صورة مؤقتة/.test(work.posterAlt), `${work.file}: an official poster must not be labelled temporary.`);
  }
}

const withImage = design.length + official.length;
console.log('\n🧪  تدقيق بوسترات المسلسلات');
console.log(`✅ فُحصت ${published.length} سجلات منشورة.`);
console.log(`✅ ${withImage} مسلسلًا يعرض صورة بوستر محلية (${design.length} غلاف تصميمي أصلي موسوم، ${official.length} بوستر رسمي موثّق).`);
console.log(`✅ ${temporary.length} مسلسلات تستخدم البديل النصي المؤقت.`);
console.log('✅ لا مسارات خارجية، ولا ملفات مفقودة، ولا صور مكررة، ولا أغلفة بلا وسم توضيحي.\n');
