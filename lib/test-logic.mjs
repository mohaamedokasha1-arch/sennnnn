/**
 * ============================================================================
 *  اختبارات منطق البحث والفلاتر والترتيب والاقتراحات — npm run test:logic
 * ============================================================================
 *  تُشغَّل في Node بلا متصفح، وتغطي المنطق المشترك الفعلي المستخدم في الواجهة
 *  (lib/filter.mjs و lib/search.mjs و lib/content.mjs ⇐ similarWorks).
 * ============================================================================
 */
import { filterWorks, sortWorks, paginate, computeResults } from './filter.mjs';
import { buildIndex, runSearch } from './search.mjs';
import { normalizeAr, matchRegex } from './highlight.mjs';
import { similarWorks, getWork, getMovies, genresWithContent, popularWorks } from './content.mjs';

let pass = 0;
let fail = 0;
const t = (name, cond, extra = '') => {
  if (cond) {
    pass += 1;
    console.log(`✅ ${name}`);
  } else {
    fail += 1;
    console.log(`❌ ${name}${extra ? `\n     ${extra}` : ''}`);
  }
};

const items = [
  { kind: 'movie', slug: 'a', title: 'باء', year: 2020, genres: ['drama', 'romance'], language: 'ar', country: 'EG', addedAt: '2026-01-01', seriesStatus: null },
  { kind: 'movie', slug: 'b', title: 'ألف', year: 2024, genres: ['horror'], language: 'en', country: 'US', addedAt: '2026-05-01', seriesStatus: null },
  { kind: 'series', slug: 'c', title: 'جيم', year: 2022, genres: ['drama'], language: 'ar', country: 'SA', addedAt: '2026-03-01', seriesStatus: 'ongoing' },
  { kind: 'movie', slug: 'd', title: 'دال', year: 2022, genres: [], language: 'ar', country: 'EG', addedAt: '2026-02-01', seriesStatus: null },
];

console.log('\n🧪  اختبارات المنطق — سينمانا\n');

/* ------------------------------ الفلترة ------------------------------ */
t('فلتر النوع يعمل', filterWorks(items, { genre: 'drama' }).length === 2);
t('فلتر النوع مع عمل بلا تصنيفات لا ينهار', filterWorks(items, { genre: 'comedy' }).length === 0);
t('فلتر السنة يعمل (سنة = 2022 → عنصران)', filterWorks(items, { year: '2022' }).length === 2);
t('فلتر اللغة يعمل', filterWorks(items, { language: 'en' }).length === 1);
t('فلتر البلد يعمل', filterWorks(items, { country: 'EG' }).length === 2);
t('فلتر حالة المسلسل يعمل', filterWorks(items, { status: 'ongoing' }).length === 1);
t('دمج الفلاتر يعمل (دراما + ar)', filterWorks(items, { genre: 'drama', language: 'ar' }).length === 2);
t('فلتر فارغ يعيد الكل', filterWorks(items, {}).length === 4);

/* ------------------------------ الترتيب ------------------------------ */
t('ترتيب أبجدي عربي صحيح (ألف قبل باء)', sortWorks(items, 'title')[0].title === 'ألف');
t('ترتيب الأحدث إضافة أولًا', sortWorks(items, 'newest')[0].slug === 'b');
t('ترتيب الأحدث إصدارًا أولًا', sortWorks(items, 'yearDesc')[0].year === 2024);
t('ترتيب الأقدم إصدارًا أولًا', sortWorks(items, 'yearAsc')[0].year === 2020);
t('الترتيب لا يعدّل المصفوفة الأصلية', items[0].slug === 'a');

/* ------------------------------ الترقيم ------------------------------ */
const paged = paginate(Array.from({ length: 50 }, (_, i) => i), 1, 24);
t('الترقيم: صفحة أولى = 24 عنصرًا', paged.slice.length === 24 && paged.slice[0] === 0);
t('الترقيم: عدد الصفحات صحيح (50/24 → 3)', paged.totalPages === 3);
t('الترقيم: تخطٍّ صحيح في الصفحة الثانية', paginate(Array.from({ length: 50 }, (_, i) => i), 2, 24).slice[0] === 24);
t('الترقيم: طلب صفحة أكبر من المتاح يعود للأخيرة', paginate([1, 2, 3], 99, 24).current === 1);
t('لا يتم تحميل كل البيانات في صفحة واحدة', computeResults(items, {}, 'newest', 1, 2).slice.length === 2);

/* --------------------------- البحث الداخلي --------------------------- */
const index = buildIndex();
t('الفهرس يحتوي كل الأعمال المنشورة', index.works.length === getMovies().length + 4, `works=${index.works.length}`);
t('بحث جزئي عربي: «البكرة» يجد العمل', runSearch('البكرة', index).works.some((w) => w.title.includes('البكرة')));
t('تطبيع التاء المربوطة: «الحكايه» = «الحكاية»', normalizeAr('الحكايه') === normalizeAr('الحكاية'));
t('تطبيع الهمزات والتشكيل: «أَحْمَد» = «احمد»', normalizeAr('أَحْمَد') === normalizeAr('احمد'));
t('تعبير المطابقة العربي يبني regex صالحًا', matchRegex('الأخيرة') instanceof RegExp);
t('بحث بالاسم الأصلي الإنجليزي يعمل', runSearch('Signal', index).works.some((w) => w.titleOriginal?.includes('Signal')));
t('تطبيع الهمزات: «الاخيره» يجد «الأخيرة»', runSearch('الاخيره', index).works.some((w) => w.title.includes('البكرة')));
t('بحث بلا نتائج يعيد صفرًا بلا انهيار', runSearch('زززززز', index).total === 0);
t('بحث فارغ يعيد لا شيء (بلا أخطاء)', runSearch('', index).total === 0);
const twoToken = runSearch('البكرة الأخيرة', index);
t('بحث بكلمتين يعمل (AND)', twoToken.works.length >= 1);
t('النتائج تحمل مسارًا داخليًا صالحًا', runSearch('البكرة', index).works.every((w) => w.url.startsWith('/')));

/* --------------------------- الأعمال المشابهة --------------------------- */
const work = getWork('movie', 'the-last-reel');
const similar = similarWorks(work, 6);
t('الأعمال المشابهة لا تشمل العمل نفسه', !similar.some((w) => w.slug === work.slug && w.kind === work.kind));
t('الأعمال المشابهة كلها من بيانات الموقع', similar.every((w) => w.kind === 'movie' || w.kind === 'series'));
t('الأعمال المشابهة تشارك تصنيفًا واحدًا على الأقل', similar.slice(0, 3).every((w) => w.genres.some((g) => work.genres.includes(g))));

/* ------------------------- التصنيفات والحالات ------------------------- */
t('لا تصنيفات فارغة في قائمة التصنيفات', genresWithContent().every((g) => g.count > 0));
t('قسم «الأكثر مشاهدة» مخفي بدون بيانات حقيقية (features.popularSection=false)', popularWorks().length === 0);

/* ------------------------ اختبارات فيلم Digger 2026 ------------------------ */
const digger = getWork('movie', 'digger-2026');
t('فيلم Digger 2026 موجود ومنشور ببيانات صحيحة', Boolean(digger && digger.title === 'الحفار' && digger.titleOriginal === 'Digger' && digger.year === 2026));
t('فيلم Digger 2026 يحتوي تاريخ العرض في مصر (2026-10-01)', digger?.releaseDateEG === '2026-10-01');
t('فيلم Digger 2026 يضم المخرج والمؤلفين وأبطال العمل', digger?.directorPeople.length === 1 && digger?.writerPeople.length === 3 && digger?.castPeople.length === 6);
t('بحث «Digger» و«الحفار» و«توم كروز» يعثر على الفيلم',
  runSearch('Digger', index).works.some((w) => w.id === 'movie:digger-2026') &&
  runSearch('الحفار', index).works.some((w) => w.id === 'movie:digger-2026') &&
  runSearch('توم كروز', index).works.some((w) => w.id === 'movie:digger-2026') &&
  runSearch('Tom Cruise', index).works.some((w) => w.id === 'movie:digger-2026')
);
t('الأعمال المشابهة لفيلم Digger 2026 تعمل من بيانات الموقع', similarWorks(digger, 6).length >= 3);
t('التريلر المضمّن والعنوان لفيلم Digger 2026 يعملان بشكل سليم', digger?.trailer?.url === 'https://a.qfilm.tv/watch.php?vid=9a89dad5a' && digger?.url === '/movie/digger-2026/');

console.log(`\n${fail === 0 ? `كل الاختبارات نجحت (${pass}).` : `فشل ${fail} من ${pass + fail}.`}\n`);
process.exit(fail === 0 ? 0 : 1);
