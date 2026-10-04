/**
 * ============================================================================
 *  طبقة المحتوى — قراءة ملفات content/** وقت البناء + التحقق + الفهارس
 * ============================================================================
 *  - لا يوجد أي API أو قاعدة بيانات: كل شيء يُقرأ من ملفات Markdown داخل المشروع.
 *  - أي خطأ في البيانات يوقف البناء برسالة عربية واضحة (انظر lib/validate.mjs).
 *  - الدوال هنا تُستخدم داخل مكونات الصفحات (تعمل في وقت البناء فقط).
 * ============================================================================
 */
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import {
  GENRES,
  CONTENT_TYPE,
  SERIES_STATUS,
  LANGUAGE_LABELS,
  COUNTRY_LABELS,
  genreLabel,
  countryLabel,
  languageLabel,
  personRoleLabel,
} from './i18n.mjs';
import siteConfig from '../site.config.mjs';

const ROOT = process.cwd();
const CONTENT_DIR = path.join(ROOT, 'content');
const PUBLIC_DIR = path.join(ROOT, 'public');

const TRAILER_PROVIDERS = ['youtube', 'vimeo'];

/* ============================== أدوات مساعدة ============================== */

const isFilled = (v) =>
  v !== undefined && v !== null && !(typeof v === 'string' && v.trim() === '') && !(Array.isArray(v) && v.length === 0);

function asArray(v) {
  if (!isFilled(v)) return [];
  return Array.isArray(v) ? v.filter(isFilled) : [v];
}

function toISODate(v) {
  if (!v) return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v).trim();
}

function readMarkdown(file) {
  const { data, content } = matter(fs.readFileSync(file, 'utf8'));
  return { data, body: content.trim() };
}

function listMarkdownFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .sort()
    .map((f) => path.join(dir, f));
}

function slugOf(file) {
  return path.basename(file).replace(/\.md$/, '');
}

/** أول فقرة نصية من متن Markdown (تُستخدم كبديل للقصة/الوصف عند غياب حقل صريح) */
export function firstParagraph(markdown = '') {
  const blocks = markdown
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);
  const para = blocks.find((b) => !b.startsWith('#') && !b.startsWith('- ') && !b.startsWith('>') && !b.startsWith('|'));
  if (!para) return '';
  return para
    .replace(/[*_`>#]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(text, n = 160) {
  if (!text) return '';
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= n) return clean;
  return clean.slice(0, n - 1).replace(/\s+\S*$/, '') + '…';
}

export const excerpt = (text, n = 160) => truncate(text, n);

/** هل ملف البوستر موجود فعليًا في public/ ؟ */
function posterExists(posterPath) {
  if (!posterPath) return false;
  if (/^https?:\/\//i.test(posterPath)) return false; // روابط خارجية ممنوعة (حماية قانونية)
  return fs.existsSync(path.join(PUBLIC_DIR, posterPath.replace(/^\//, '')));
}

/* ============================== القراءة الخام ============================== */

/**
 * يقرأ كل المحتوى كما هو، ويجمع الأخطاء والتحذيرات دون أن يتوقف.
 * يستخدمه سكربت التحقق (npm run validate) والصفحات (عبر load()).
 */
export function loadRaw() {
  const errors = [];
  const warnings = [];
  const seenIds = new Map(); // id -> file (لمنع التكرار)

  const pushId = (id, file, label) => {
    if (seenIds.has(id)) {
      errors.push(`${label}: المعرّف «${id}» مكرر — مستخدم أيضًا في ${seenIds.get(id)}.`);
    } else {
      seenIds.set(id, file);
    }
  };

  /* ------------------------------- الأعمال ------------------------------- */
  function readWork(kind, file) {
    const rel = path.relative(ROOT, file);
    const { data: d, body } = readMarkdown(file);
    const slug = slugOf(file);
    const id = String(d.id ?? slug);
    pushId(id, rel, `${CONTENT_TYPE[kind].ar} «${slug}»`);

    if (!isFilled(d.title)) errors.push(`${rel}: الحقل الإلزامي «title» (الاسم بالعربية) مفقود.`);
    if (!isFilled(d.synopsis) && !firstParagraph(body))
      errors.push(`${rel}: الحقل الإلزامي «synopsis» (القصة) مفقود ولا توجد فقرة في المتن يمكن استخدامها.`);
    if (!isFilled(d.year)) errors.push(`${rel}: الحقل الإلزامي «year» (سنة الإصدار) مفقود.`);
    else if (!Number.isInteger(Number(d.year)) || Number(d.year) < 1900 || Number(d.year) > 2100)
      errors.push(`${rel}: «year» يجب أن يكون سنة صحيحة بين 1900 و2100.`);
    if (!isFilled(d.genres)) errors.push(`${rel}: الحقل الإلزامي «genres» (الأنواع) مفقود.`);
    if (!isFilled(d.addedAt)) errors.push(`${rel}: الحقل الإلزامي «addedAt» (تاريخ الإضافة) مفقود.`);

    const genres = asArray(d.genres);
    genres.forEach((g) => {
      if (!GENRES[g]) errors.push(`${rel}: النوع «${g}» غير معروف. الأنواع المسموحة: ${Object.keys(GENRES).join(', ')}.`);
    });

    // البوستر: إلزامي قدر الإمكان، لكن البديل يُولَّد تلقائيًا إن غاب
    const poster = isFilled(d.poster) ? String(d.poster) : null;
    if (poster) {
      if (/^https?:\/\//i.test(poster)) {
        errors.push(
          `${rel}: لا يُسمح بربط صورة من نطاق خارجي (${poster}). ضع الصورة داخل public/posters/ واكتب المسار المحلي فقط (حماية من استخدام صور محمية بحقوق).`
        );
      } else if (!posterExists(poster)) {
        errors.push(`${rel}: ملف البوستر غير موجود: public${poster}. تحقق من الاسم والامتداد.`);
      }
    } else {
      warnings.push(`${rel}: لا يوجد بوستر — سيُعرض بديل تصميمي تلقائيًا.`);
    }

    // التريلر: YouTube/Vimeo أو رابط تضمين مباشر
    let trailer = null;
    if (isFilled(d.trailer)) {
      if (isFilled(d.trailer.url)) {
        const embedUrl = String(d.trailer.url).trim();
        if (!/^https:\/\//i.test(embedUrl)) {
          errors.push(`${rel}: رابط التريلر يجب أن يبدأ بـ https://.`);
        } else {
          trailer = {
            provider: 'embed',
            url: embedUrl,
            id: d.trailer.id ? String(d.trailer.id) : null,
            title: d.trailer.title || null,
            subtitled: d.trailer.subtitled === true,
          };
        }
      } else {
        const provider = String(d.trailer.provider ?? '').toLowerCase();
        const vid = d.trailer.id ? String(d.trailer.id) : '';
        if (!TRAILER_PROVIDERS.includes(provider)) {
          errors.push(`${rel}: مزوّد التريلر «${d.trailer.provider}» غير مدعوم. المسموح: ${TRAILER_PROVIDERS.join(', ')}.`);
        } else if (!/^[\w-]{6,20}$/.test(vid)) {
          errors.push(`${rel}: معرّف التريلر «${vid}» غير صالح.`);
        } else {
          trailer = { provider, id: vid, title: d.trailer.title || null, subtitled: d.trailer.subtitled === true };
        }
      }
    }

    // روابط المشاهدة الرسمية: يجب أن تكون https وعلى نطاق معتمد في site.config.mjs
    const watch = [];
    asArray(d.watch).forEach((w, i) => {
      const url = String(w?.url ?? '');
      if (!/^https:\/\//i.test(url)) {
        errors.push(`${rel}: رابط المشاهدة رقم ${i + 1} يجب أن يبدأ بـ https:// (رابط رسمي فقط).`);
        return;
      }
      let host = '';
      try {
        host = new URL(url).hostname.replace(/^www\./, '');
      } catch {
        errors.push(`${rel}: رابط المشاهدة رقم ${i + 1} غير صالح.`);
        return;
      }
      const platform = siteConfig.watchPlatforms.find((p) => p.domains.some((dom) => host === dom || host.endsWith('.' + dom)));
      if (!platform) {
        errors.push(
          `${rel}: نطاق «${host}» غير مُدرج في قائمة المنصات الرسمية المسموحة (site.config.mjs ← watchPlatforms). أضِفه هناك بشكل واعٍ فقط إن كانت المنصة رسمية.`
        );
        return;
      }
      watch.push({ label: w.label || platform.label, platform: platform.key, url });
    });

    // مسلسل: مواسم وحالة
    let seasons = [];
    let seriesStatus = null;
    if (kind === 'series') {
      if (isFilled(d.status)) {
        if (!SERIES_STATUS[d.status]) {
          errors.push(`${rel}: حالة المسلسل «${d.status}» غير معروفة. المسموح: ${Object.keys(SERIES_STATUS).join(', ')}.`);
        } else seriesStatus = d.status;
      }
      seasons = asArray(d.seasons).map((s, i) => {
        const number = Number(s?.number ?? i + 1);
        const episodes = Number(s?.episodes);
        if (!Number.isInteger(episodes) || episodes < 1)
          errors.push(`${rel}: عدد حلقات الموسم ${number} غير صالح (يجب رقم صحيح ≥ 1).`);
        return { number, episodes: Number.isFinite(episodes) ? episodes : null, year: s?.year ? Number(s.year) : null };
      });
    }

    if (isFilled(d.popularity) && typeof d.popularity !== 'number') {
      errors.push(`${rel}: «popularity» يجب أن يكون رقمًا موثّقًا يدويًا أو يُترك فارغًا.`);
    }

    const customUrl = isFilled(d.customUrl) ? String(d.customUrl).trim() : null;
    return {
      kind,
      slug,
      id,
      file: rel,
      url: customUrl || `${CONTENT_TYPE[kind].urlBase}/${slug}/`,
      title: String(d.title ?? slug),
      titleOriginal: isFilled(d.titleOriginal) ? String(d.titleOriginal) : null,
      year: Number(d.year) || null,
      releaseDateEG: toISODate(d.releaseDateEG),
      genres,
      ageRating: isFilled(d.ageRating) ? String(d.ageRating) : null,
      ageRatingVerified: d.ageRatingVerified === true,
      ageRatingNote: isFilled(d.ageRatingNote) ? String(d.ageRatingNote) : null,
      ageRatingNoteEn: isFilled(d.ageRatingNoteEn) ? String(d.ageRatingNoteEn) : null,
      runtime: Number.isFinite(Number(d.runtime)) && d.runtime ? Number(d.runtime) : null,
      country: isFilled(d.country) ? String(d.country) : null,
      language: isFilled(d.language) ? String(d.language) : null,
      isSubtitled: d.isSubtitled === true,
      subtitles: isFilled(d.subtitles) ? String(d.subtitles) : null,
      subtitlesEn: isFilled(d.subtitlesEn) ? String(d.subtitlesEn) : null,
      synopsis: isFilled(d.synopsis) ? String(d.synopsis).trim() : firstParagraph(body),
      synopsisEn: isFilled(d.synopsisEn) ? String(d.synopsisEn).trim() : null,
      seoTitle: isFilled(d.seoTitle) ? String(d.seoTitle) : null,
      seoTitleSubtitled: isFilled(d.seoTitleSubtitled) ? String(d.seoTitleSubtitled) : null,
      seoTitleEn: isFilled(d.seoTitleEn) ? String(d.seoTitleEn) : null,
      heading: isFilled(d.heading) ? String(d.heading) : null,
      headingSubtitled: isFilled(d.headingSubtitled) ? String(d.headingSubtitled) : null,
      headingEn: isFilled(d.headingEn) ? String(d.headingEn) : null,
      seoDescription: isFilled(d.seoDescription) ? String(d.seoDescription) : null,
      seoDescriptionEn: isFilled(d.seoDescriptionEn) ? String(d.seoDescriptionEn) : null,
      poster,
      posterAlt: isFilled(d.posterAlt) ? String(d.posterAlt) : null,
      posterAltEn: isFilled(d.posterAltEn) ? String(d.posterAltEn) : null,
      hasPoster: posterExists(poster),
      trailer,
      watch,
      cast: asArray(d.cast).map(String),
      directors: asArray(d.directors).map(String),
      writers: asArray(d.writers).map(String),
      featured: d.featured === true,
      demo: d.demo === true,
      popularity: typeof d.popularity === 'number' ? d.popularity : null,
      addedAt: toISODate(d.addedAt),
      draft: d.draft === true,
      seriesStatus,
      seasons,
      notes: body,
      notesEn: isFilled(d.notesEn) ? String(d.notesEn).trim() : null,
      credits: [
        ...new Set([
          ...asArray(d.directors).map(String),
          ...asArray(d.writers).map(String),
          ...asArray(d.cast).map(String),
        ]),
      ],
    };
  }

  const movies = listMarkdownFiles(path.join(CONTENT_DIR, 'movies')).map((f) => readWork('movie', f));
  const series = listMarkdownFiles(path.join(CONTENT_DIR, 'series')).map((f) => readWork('series', f));
  const allWorks = [...movies, ...series];
  const workById = new Map(allWorks.map((w) => [`${w.kind}:${w.slug}`, w]));

  /* ------------------------------- الأشخاص ------------------------------- */
  const people = listMarkdownFiles(path.join(CONTENT_DIR, 'people')).map((file) => {
    const rel = path.relative(ROOT, file);
    const { data: d, body } = readMarkdown(file);
    const id = String(d.id ?? slugOf(file));
    pushId(`person:${id}`, rel, 'شخص');
    if (!isFilled(d.title)) errors.push(`${rel}: الحقل الإلزامي «title» (اسم الشخص) مفقود.`);
    const roles = asArray(d.roles);
    if (!roles.length) errors.push(`${rel}: الحقل الإلزامي «roles» مفقود (director / actor / writer).`);
    roles.forEach((r) => {
      if (!['director', 'actor', 'writer'].includes(r)) errors.push(`${rel}: الدور «${r}» غير معروف.`);
    });
    if (!isFilled(d.bio) && !firstParagraph(body))
      warnings.push(`${rel}: لا توجد نبذة — ستُخفى فقرة «نبذة» في صفحة الشخص.`);
    return {
      id,
      slug: id,
      url: `/people/${id}/`,
      file: rel,
      name: String(d.title ?? id),
      nameOriginal: isFilled(d.nameOriginal) ? String(d.nameOriginal) : null,
      roles,
      roleLabel: personRoleLabel(roles),
      born: d.born ? String(d.born) : null,
      country: isFilled(d.country) ? String(d.country) : null,
      photo: isFilled(d.photo) ? String(d.photo) : null,
      hasPhoto: posterExists(isFilled(d.photo) ? String(d.photo) : null),
      bio: isFilled(d.bio) ? String(d.bio).trim() : firstParagraph(body),
      bioEn: isFilled(d.bioEn) ? String(d.bioEn).trim() : null,
      demo: d.demo === true,
      works: [],
    };
  });
  const peopleById = new Map(people.map((p) => [p.id, p]));

  /* ------------------------------ المراجعات ------------------------------ */
  const reviews = listMarkdownFiles(path.join(CONTENT_DIR, 'reviews')).map((file) => {
    const rel = path.relative(ROOT, file);
    const { data: d, body } = readMarkdown(file);
    const slug = slugOf(file);
    pushId(`review:${slug}`, rel, 'مراجعة');
    if (!isFilled(d.title)) errors.push(`${rel}: الحقل الإلزامي «title» مفقود.`);
    if (!isFilled(d.work)) errors.push(`${rel}: الحقل الإلزامي «work» مفقود (مثال: movie:some-slug).`);
    if (!isFilled(d.date)) errors.push(`${rel}: الحقل الإلزامي «date» مفقود.`);
    if (!body) errors.push(`${rel}: متن المراجعة فارغ — اكتب المراجعة داخل الملف بعد ترويسة البيانات.`);

    let work = null;
    if (isFilled(d.work)) {
      const ref = String(d.work);
      work = workById.get(ref) ?? null;
      if (!work) errors.push(`${rel}: العمل المشار إليه «${ref}» غير موجود. تحقق من النوع (movie:/series:) والمعرّف.`);
      else if (work.draft) warnings.push(`${rel}: العمل المرتبط «${ref}» مسودة غير منشورة.`);
    }

    let rating = null;
    if (isFilled(d.rating)) {
      const r = Number(d.rating);
      if (!Number.isFinite(r) || r < 0 || r > 10) errors.push(`${rel}: «rating» يجب أن يكون رقمًا بين 0 و10.`);
      else rating = r;
    }

    return {
      slug,
      url: `/reviews/${slug}/`,
      file: rel,
      title: String(d.title ?? slug),
      workRef: isFilled(d.work) ? String(d.work) : null,
      work,
      rating,
      author: isFilled(d.author) ? String(d.author) : 'فريق التحرير',
      date: toISODate(d.date),
      updatedAt: toISODate(d.updatedAt),
      verdict: isFilled(d.verdict) ? String(d.verdict) : null,
      demo: d.demo === true,
      draft: d.draft === true,
      excerpt: isFilled(d.excerpt) ? String(d.excerpt) : truncate(firstParagraph(body), 180),
      body,
    };
  });

  /* ------------------------------ الترشيحات ------------------------------ */
  const lists = listMarkdownFiles(path.join(CONTENT_DIR, 'lists')).map((file) => {
    const rel = path.relative(ROOT, file);
    const { data: d, body } = readMarkdown(file);
    const slug = slugOf(file);
    pushId(`list:${slug}`, rel, 'قائمة');
    if (!isFilled(d.title)) errors.push(`${rel}: الحقل الإلزامي «title» مفقود.`);
    if (!isFilled(d.items)) errors.push(`${rel}: الحقل الإلزامي «items» مفقود (قائمة مراجع مثل movie:slug).`);

    const items = asArray(d.items).map((ref) => {
      const work = workById.get(String(ref));
      if (!work) errors.push(`${rel}: العمل «${ref}» في القائمة غير موجود.`);
      return { ref: String(ref), work };
    });

    return {
      slug,
      url: `/lists/${slug}/`,
      file: rel,
      title: String(d.title ?? slug),
      description: isFilled(d.description) ? String(d.description) : truncate(firstParagraph(body), 200),
      author: isFilled(d.author) ? String(d.author) : 'فريق التحرير',
      date: toISODate(d.date),
      demo: d.demo === true,
      draft: d.draft === true,
      items: items.filter((i) => i.work),
      intro: body,
    };
  });

  /* ------------------------ التحقق من الروابط الداخلية ------------------------ */
  allWorks.forEach((w) => {
    w.directors.forEach((id) => {
      if (!peopleById.has(id)) errors.push(`${w.file}: المخرج «${id}» غير موجود في content/people/.`);
    });
    w.writers.forEach((id) => {
      if (!peopleById.has(id)) errors.push(`${w.file}: المؤلف «${id}» غير موجود في content/people/.`);
    });
    w.cast.forEach((id) => {
      if (!peopleById.has(id)) errors.push(`${w.file}: الممثل «${id}» غير موجود في content/people/.`);
    });
  });

  // إسناد أسماء المخرجين والمؤلفين والممثلين لكل عمل (تُستخدم في العرض وفي Schema.org)
  allWorks.forEach((w) => {
    w.directorPeople = w.directors.map((id) => peopleById.get(id)).filter(Boolean);
    w.writerPeople = w.writers.map((id) => peopleById.get(id)).filter(Boolean);
    w.castPeople = w.cast.map((id) => peopleById.get(id)).filter(Boolean);
    w.directorNames = w.directorPeople.map((p) => p.name);
    w.writerNames = w.writerPeople.map((p) => p.name);
    w.castNames = w.castPeople.map((p) => p.name);
  });

  // ربط أعمال الأشخاص
  people.forEach((p) => {
    p.works = allWorks
      .filter((w) => !w.draft && (w.directors.includes(p.id) || w.writers.includes(p.id) || w.cast.includes(p.id)))
      .sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
    if (!p.works.length) warnings.push(`${p.file}: لا توجد أعمال منشورة مرتبطة بهذا الشخص — ستُعرض الصفحة مع رسالة واضحة.`);
  });

  return { movies, series, people, reviews, lists, errors, warnings };
}

/* ============================ الواجهة الموثوقة ============================ */

let CACHE = null;

/**
 * التحميل الموثوق: يوقف البناء (يرفع خطأ) إذا وُجدت أي مشكلة في البيانات.
 * بهذا لا يمكن نشر موقع بمحتوى ناقص أو مكرر أو بروابط غير مسموحة.
 */
export function load() {
  if (CACHE) return CACHE;
  const raw = loadRaw();
  if (raw.errors.length) {
    const msg = [
      '',
      '⛔ توقف البناء: توجد أخطاء في ملفات المحتوى (content/) — أصلحها ثم أعد المحاولة:',
      ...raw.errors.map((e, i) => `   ${i + 1}) ${e}`),
      '',
      '💡 لتشغيل التحقق وحده: npm run validate',
      '',
    ].join('\n');
    throw new Error(msg);
  }
  CACHE = raw;
  return raw;
}

export function warnings() {
  return loadRaw().warnings;
}

/* ------------------------------ المُخرجات ------------------------------ */

export const getMovies = () => load().movies.filter((w) => !w.draft).sort(byNewestAdded);
export const getSeries = () => load().series.filter((w) => !w.draft).sort(byNewestAdded);
export const getWorks = (kind = 'all') =>
  (kind === 'movie' ? getMovies() : kind === 'series' ? getSeries() : [...getMovies(), ...getSeries()]).sort(byNewestAdded);

export function getWork(kind, slug) {
  const w = load()[kind === 'movie' ? 'movies' : 'series'].find((x) => x.slug === slug);
  return w && !w.draft ? w : null;
}
export const getWorkByRef = (ref) => load()[`${String(ref).startsWith('series:') ? 'series' : 'movies'}`].find((w) => `${w.kind}:${w.slug}` === String(ref)) ?? null;

export const getPeople = () => load().people;
export const getPerson = (id) => load().people.find((p) => p.id === id) ?? null;
export const getReviews = () => load().reviews.filter((r) => !r.draft && r.work).sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
export const getReview = (slug) => getReviews().find((r) => r.slug === slug) ?? null;
export const getReviewForWork = (work) => getReviews().find((r) => r.workRef === `${work.kind}:${work.slug}`) ?? null;
export const getLists = () => load().lists.filter((l) => !l.draft && l.items.length).sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));

function byNewestAdded(a, b) {
  const d = (b.addedAt ?? '').localeCompare(a.addedAt ?? '');
  return d !== 0 ? d : (b.year ?? 0) - (a.year ?? 0);
}

/* ------------------------------ أقسام الرئيسية ------------------------------ */

export const latestAdditions = (n = 8) => getWorks('all').slice(0, n);
export const featuredMovies = () => getMovies().filter((w) => w.featured);
export const worksWithTrailer = (n = 3) => getWorks('all').filter((w) => w.trailer).slice(0, n);

/** «الأكثر مشاهدة»: لا يظهر إلا ببيانات حقيقية موثّقة يدويًا + تفعيل الميزة */
export function popularWorks(n = 6) {
  if (!siteConfig.features.popularSection) return [];
  const ranked = getWorks('all').filter((w) => typeof w.popularity === 'number').sort((a, b) => b.popularity - a.popularity);
  return ranked.length >= 3 ? ranked.slice(0, n) : [];
}

/* ------------------------------ الفلاتر ------------------------------ */

export function facets(kind = 'all') {
  const works = getWorks(kind);
  const count = (arr) => arr.reduce((m, k) => ((m[k] = (m[k] ?? 0) + 1), m), {});

  const genreCounts = count(works.flatMap((w) => w.genres));
  const genres = Object.entries(genreCounts)
    .map(([key, n]) => ({ key, label: genreLabel(key), count: n }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'ar'));

  const years = [...new Set(works.map((w) => w.year).filter(Boolean))].sort((a, b) => b - a);

  const languages = Object.entries(count(works.map((w) => w.language).filter(Boolean)))
    .map(([code, n]) => ({ code, label: languageLabel(code), count: n }))
    .sort((a, b) => b.count - a.count);

  const countries = Object.entries(count(works.map((w) => w.country).filter(Boolean)))
    .map(([code, n]) => ({ code, label: countryLabel(code), count: n }))
    .sort((a, b) => b.count - a.count);

  const statuses = Object.entries(count(works.map((w) => w.seriesStatus).filter(Boolean))).map(([key, n]) => ({
    key,
    label: SERIES_STATUS[key],
    count: n,
  }));

  return { genres, years, languages, countries, statuses, total: works.length };
}

/** تصنيفات تحتوي محتوى فعليًا فقط (لصفحة التصنيفات) */
export function genresWithContent() {
  const works = getWorks('all');
  return Object.keys(GENRES)
    .map((key) => {
      const inGenre = works.filter((w) => w.genres.includes(key));
      return {
        key,
        label: genreLabel(key),
        url: `/genres/${key}/`,
        count: inGenre.length,
        movies: inGenre.filter((w) => w.kind === 'movie').length,
        series: inGenre.filter((w) => w.kind === 'series').length,
        sample: inGenre.slice(0, 4),
      };
    })
    .filter((g) => g.count > 0)
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'ar'));
}

export function worksInGenre(key, kind = 'all') {
  return getWorks(kind).filter((w) => w.genres.includes(key));
}

/* ------------------------------ الاقتراحات ------------------------------ */

/** أعمال مشابهة: تقاطع التصنيفات + نفس النوع الفني، وكل شيء من بيانات الموقع فقط */
export function similarWorks(work, n = 6) {
  const pool = getWorks('all').filter((w) => !(w.kind === work.kind && w.slug === work.slug));
  const scored = pool
    .map((w) => {
      const overlap = w.genres.filter((g) => work.genres.includes(g)).length;
      const sameKind = w.kind === work.kind ? 0.5 : 0;
      const sameDecade = w.year && work.year && Math.abs(w.year - work.year) <= 5 ? 0.25 : 0;
      return { work: w, score: overlap + sameKind + sameDecade, overlap };
    })
    .filter((x) => x.overlap > 0)
    .sort((a, b) => b.score - a.score || (b.work.year ?? 0) - (a.work.year ?? 0));

  if (scored.length >= 3) return scored.slice(0, n).map((x) => x.work);

  // بديل واضح عند عدم كفاية التقاطع: أحدث أعمال من نفس النوع الفني
  const sameKind = getWorks(work.kind).filter((w) => w.slug !== work.slug);
  const merged = [...new Set([...scored.map((x) => x.work), ...sameKind])];
  return merged.slice(0, n);
}

/* ------------------------------ الإحصاءات ------------------------------ */

export function siteStats() {
  const { movies, series, people, reviews, lists } = load();
  const published = [...movies, ...series].filter((w) => !w.draft);
  return {
    movies: movies.filter((w) => !w.draft).length,
    series: series.filter((w) => !w.draft).length,
    works: published.length,
    people: people.length,
    reviews: reviews.filter((r) => !r.draft).length,
    lists: lists.filter((l) => !l.draft).length,
    trailers: published.filter((w) => w.trailer).length,
    watchLinks: published.reduce((n, w) => n + w.watch.length, 0),
    demoWorks: published.filter((w) => w.demo).length,
    hasDemo: published.some((w) => w.demo) || reviews.some((r) => r.demo),
  };
}
