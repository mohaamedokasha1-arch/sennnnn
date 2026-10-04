import assert from 'node:assert/strict';
import { loadRaw } from './content.mjs';

const { series, errors } = loadRaw();
const publishedSeries = series.filter((work) => !work.draft);

assert.deepEqual(errors, [], `Content validation errors:\n${errors.join('\n')}`);
assert.ok(publishedSeries.length > 0, 'There must be published series to audit.');

const temporary = [];
const verified = [];
for (const work of publishedSeries) {
  assert.ok(work.title, `${work.file}: missing series title.`);

  if (work.posterTemporary) {
    temporary.push(work);
    assert.equal(work.poster, null, `${work.file}: temporary artwork must not be exposed as a poster URL.`);
    assert.equal(work.hasPoster, false, `${work.file}: temporary artwork must use the title placeholder.`);
    assert.match(work.posterAlt ?? '', /مؤقت|temporary/i, `${work.file}: temporary status must be documented in alt text.`);
    assert.match(work.posterAlt ?? '', /ليس|ليست|not/i, `${work.file}: must explicitly say that it is not official artwork.`);
  } else {
    verified.push(work);
    assert.ok(work.hasPoster, `${work.file}: a non-temporary poster must resolve to a local file.`);
    assert.ok(work.poster?.startsWith('/posters/'), `${work.file}: poster must use a local /posters/ path.`);
  }
}

console.log('\n🧪  تدقيق بوسترات المسلسلات');
console.log(`✅ فُحصت ${publishedSeries.length} سجلات منشورة.`);
console.log(`✅ ${temporary.length} صورة مؤقتة تحمل اسم المسلسل وموسومة بوضوح.`);
console.log(`✅ ${verified.length} بوسترًا محليًا موثوقًا ومتاحًا للاستخدام.`);
console.log('✅ لا توجد سجلات بمسار بوستر مكسور أو صورة غير موثقة معروضة كأنها رسمية.\n');
