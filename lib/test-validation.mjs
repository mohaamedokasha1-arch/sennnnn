/**
 * ============================================================================
 *  اختبارات الحالات الحدّية لمنظومة التحقق — npm run test:content
 * ============================================================================
 *  تُنشئ ملفات محتوى مؤقتة (خاطئة عمدًا) داخل content/ ثم تتأكد أن التحقق
 *  يكتشف كل خطأ، ثم تحذفها. تضمن أن الموقع لا يمكن نشره ببيانات ناقصة أو مكررة
 *  أو بروابط غير مسموحة، وأن العمل المسودة لا يظهر للزوار.
 * ============================================================================
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const CONTENT = path.join(ROOT, 'content');
const TMP = {
  dup1: path.join(CONTENT, 'movies', '__test-dup-1.md'),
  dup2: path.join(CONTENT, 'movies', '__test-dup-2.md'),
  bad: path.join(CONTENT, 'movies', '__test-bad.md'),
  draft: path.join(CONTENT, 'movies', '__test-draft.md'),
  noPoster: path.join(CONTENT, 'movies', '__test-noposter.md'),
  unofficialTrailer: path.join(CONTENT, 'movies', '__test-bad-trailer.md'),
  officialTrailer: path.join(CONTENT, 'movies', '__test-yt-trailer.md'),
  missingDesignFlag: path.join(CONTENT, 'movies', '__test-design-flag.md'),
  badReview: path.join(CONTENT, 'reviews', '__test-review.md'),
};

const base = (extra) => `---
title: "عمل اختباري"
year: 2024
genres: [drama]
synopsis: "قصة اختبارية قصيرة لأغراض التحقق فقط."
addedAt: 2026-01-01
${extra}
---
`;

const cases = [
  {
    name: 'معرّف مكرر بين ملفين',
    files: {
      [TMP.dup1]: base('id: dup-100'),
      [TMP.dup2]: base('id: dup-100'),
    },
    expect: /مكرر/,
  },
  {
    name: 'حقل إلزامي ناقص (year) + نوع غير معروف + بوستر خارجي + رابط مشاهدة غير معتمد + مزوّد تريلر غير مدعوم',
    files: {
      [TMP.bad]: `---
title: "عمل ناقص"
genres: [unknown-genre]
synopsis: "قصة."
addedAt: 2026-01-01
poster: "https://example.com/poster.jpg"
trailer:
  provider: dailymotion
  id: abc12345
watch:
  - label: موقع مشبوه
    url: https://random-movies.example.net/watch/1
---
`,
    },
    expect: [/«year»/, /غير معروف/, /نطاق خارجي/, /غير مُدرج/, /مزوّد التريلر/],
  },
  {
    name: 'رابط تريلر على نطاق غير رسمي (موقع مشاهدة/تحميل) يُرفض',
    files: {
      [TMP.unofficialTrailer]: base(`runtime: 95
trailer:
  url: "https://a.qfilm.tv/watch.php?vid=9a89dad5a"`),
    },
    expect: [/نطاق التريلر/, /غير مسموح/],
  },
  {
    name: 'رابط تريلر يوتيوب رسمي يُقبل ويُطبَّع إلى مزوّد + معرّف (تضمين محترم للخصوصية)',
    files: {
      [TMP.officialTrailer]: base(`runtime: 95
trailer:
  url: "https://www.youtube.com/watch?v=qORTe1wW3Wg"
  title: "Official Trailer"`),
    },
    expectClean: true,
    after: (raw) => {
      const w = raw.movies.find((m) => m.slug === '__test-yt-trailer');
      return w?.trailer?.provider === 'youtube' && w?.trailer?.id === 'qORTe1wW3Wg' && !w?.trailer?.url;
    },
  },
  {
    name: 'غلاف تصميمي بنص alt يعلن أنه تصميم بلا «posterDesign: true» يُرفض',
    files: {
      [TMP.missingDesignFlag]: base(`runtime: 95
poster: "/posters/frozen-3.jpg"
posterAlt: "بوستر تصميمي أصلي لفيلم اختباري — ليس البوستر الرسمي"`),
    },
    expect: [/posterDesign/],
  },
  {
    name: 'عمل مشابه مع مدخلات صحيحة تمامًا (يجب ألا يعطي أخطاء)',
    files: {
      [TMP.noPoster]: base('runtime: 95'),
    },
    expect: [],
    expectClean: true,
  },
  {
    name: 'مراجعة مرتبطة بعمل غير موجود',
    files: {
      [TMP.badReview]: `---
title: "مراجعة اختبارية"
work: movie:does-not-exist
date: 2026-01-01
---
محتوى المراجعة.
`,
    },
    expect: /غير موجود/,
  },
];

function write(file, body) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, body, 'utf8');
}

function cleanup() {
  Object.values(TMP).forEach((f) => {
    if (fs.existsSync(f)) fs.unlinkSync(f);
  });
}

const results = [];
try {
  for (const c of cases) {
    cleanup();
    Object.entries(c.files).forEach(([file, body]) => write(file, body));

    // نعيد تحميل الوحدة لقراءة الملفات المؤقتة (بلا تخزين مؤقت)
    const mod = await import(`./content.mjs?t=${Date.now()}-${Math.random()}`);
    const { errors } = mod.loadRaw();
    const joined = errors.join('\n');
    const patterns = Array.isArray(c.expect) ? c.expect : [c.expect];

    if (c.expectClean) {
      const clean = errors.length === 0;
      // بعض الحالات تحتاج فحصًا إضافيًا بعد التحقق (مثل تطبيع رابط التريلر)
      const extraOk = c.after ? c.after(mod.loadRaw()) === true : true;
      results.push({
        name: c.name,
        ok: clean && extraOk,
        detail: clean && extraOk ? 'بلا أخطاء ✓' : `${joined}${extraOk ? '' : '\\nلم يتحقق الشرط الإضافي (تطبيع بيانات التريلر).'}`,
      });
    } else if (patterns.length === 0) {
      results.push({ name: c.name, ok: false, detail: 'لم تُحدَّد أنماط متوقعة' });
    } else {
      const missing = patterns.filter((p) => !p.test(joined));
      results.push({
        name: c.name,
        ok: missing.length === 0,
        detail: missing.length === 0 ? 'كل الأخطاء المتوقعة رُصدت ✓' : `لم تُرصد: ${missing.map(String).join(' , ')}\n${joined}`,
      });
    }
  }

  // اختبار المسودة: يجب ألا تظهر في القوائم المنشورة
  cleanup();
  write(TMP.draft, base('draft: true'));
  const mod = await import(`./content.mjs?t=${Date.now()}-draft`);
  const raw = mod.loadRaw();
  const draftVisible = raw.movies.some((m) => m.slug === '__test-draft' && !m.draft);
  const draftCountedInPublished = mod.getMovies().some((m) => m.slug === '__test-draft');
  results.push({
    name: 'العمل الموسوم draft:true لا يظهر للزوار ولا في القوائم',
    ok: !draftVisible && !draftCountedInPublished,
    detail: !draftVisible && !draftCountedInPublished ? 'مخفي فعلًا ✓' : 'ظاهر للزوار ✗',
  });
} finally {
  cleanup();
}

// تقرير
console.log('\n🧪  اختبارات الحالات الحدّية — سينمانا\n');
let failed = 0;
results.forEach((r, i) => {
  console.log(`${r.ok ? '✅' : '❌'} ${i + 1}. ${r.name}`);
  console.log(`     ${r.detail.replace(/\n/g, '\n     ')}`);
  if (!r.ok) failed += 1;
});
console.log(`\n${failed === 0 ? 'كل الاختبارات نجحت.' : `فشل ${failed} اختبارًا.`}\n`);
process.exit(failed === 0 ? 0 : 1);
