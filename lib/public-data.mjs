/**
 * ============================================================================
 *  طبقة البيانات العامة (للصفحات العامة)
 * ============================================================================
 *  تدمج البيانات المستوردة من Markdown مع التعديلات التي أُجريت عبر لوحة التحكم.
 *
 *  - الاستيراد الأولي: من ملفات content/*.md إلى .data/akasha-db.json
 *  - التعديلات اللاحقة: عبر API لوحة التحكم تُحفظ في قاعدة البيانات.
 *  - هذه الطبقة تُعيد البيانات في شكل متوافق تمامًا مع توقعات المكوّنات
 *    الحالية (WorkCard, WorkDetail, FilterBar, …).
 *
 *  نحافظ على نفس أسماء الدوال المستخدمة في الصفحات (getMovies, getWork…)
 *  مع تبديل الاستدعاءات في الصفحات لاحقًا من content.mjs إلى هذا الملف.
 * ============================================================================
 */
import { initDb, getAll } from './db.mjs';
import { GENRES, CONTENT_TYPE, SERIES_STATUS, genreLabel, countryLabel, languageLabel } from './i18n.mjs';
import siteConfig from '../site.config.mjs';
import { getPeople as _getPeopleList } from './content.mjs';

// تهيئة القاعدة (استيراد أولي من markdown إن لزم)
initDb();

// بناء خريطة الأشخاص مرة واحدة (تُحدّث كل ثانيتين مع كاش البيانات)
function peopleMap() {
  const m = new Map();
  for (const p of _getPeopleList()) m.set(p.id, p);
  return m;
}

// =========== تطبيع البيانات للشكل الذي يتوقعه الواجهة الحالية ===========

function normalizeWork(w) {
  if (!w) return null;
  const people = peopleMap();
  const directors = Array.isArray(w.directors) ? w.directors : [];
  const writers = Array.isArray(w.writers) ? w.writers : [];
  const cast = Array.isArray(w.cast) ? w.cast : [];
  const directorPeople = directors.map((id) => people.get(id)).filter(Boolean);
  const writerPeople = writers.map((id) => people.get(id)).filter(Boolean);
  const castPeople = cast.map((id) => people.get(id)).filter(Boolean);
  const directorNames = directorPeople.map((p) => p.name);
  const writerNames = writerPeople.map((p) => p.name);
  const castNames = castPeople.map((p) => p.name);
  const genres = Array.isArray(w.genres) ? w.genres.filter((g) => GENRES[g]) : [];
  const hasPoster = !!w.poster;
  const published = !w.draft && !w.archived;

  // تسوية شكل المواسم ليطابق ما تتوقعه المكوّنات الحالية (number, episodes(count), year)
  let seasons = w.kind === 'series' ? (w.seasons || []).map((sn, idx) => {
    const epList = (Array.isArray(sn.episodes) ? sn.episodes.filter((e) => !e.draft) : []).sort((a, b) => (a.order || a.number) - (b.order || b.number));
    const episodesCount = epList.length > 0
      ? epList.length
      : (Number(sn.episodesCount) || Number(sn.episodes) || 0);
    return {
      id: sn.id || `season-${idx}`,
      number: Number(sn.number) || (idx + 1),
      title: sn.title || `الموسم ${Number(sn.number) || (idx + 1)}`,
      titleOriginal: sn.titleOriginal || '',
      year: sn.year || null,
      episodes: episodesCount,
      episodesList: epList, // قائمة الحلقات الكاملة (للمشغّل)
      draft: !!sn.draft,
      order: Number(sn.order) || (idx + 1),
    };
  }).sort((a, b) => (a.order || a.number) - (b.order || b.number)) : undefined;

  const seasonCount = w.kind === 'series' ? (seasons?.length || 0) : 0;
  const episodeCount = w.kind === 'series'
    ? (seasons || []).reduce((n, s) => n + (s.episodes || 0), 0)
    : 0;

  // تحويل trailer إما object أو null
  let trailer = w.trailer || null;

  // حقل watch
  const watch = Array.isArray(w.watch) ? w.watch : [];

  // روابط التضمين (embed)
  const hasEmbed = !!w.embedUrl || (Array.isArray(w.embeds) && w.embeds.length > 0);
  const embed = w.embedUrl
    ? { url: w.embedUrl, label: 'المصدر الافتراضي', isDefault: true }
    : (Array.isArray(w.embeds) && w.embeds.length ? { ...w.embeds[0], isDefault: true } : null);
  const embeds = [];
  if (w.embedUrl) embeds.push({ url: w.embedUrl, label: 'المصدر الافتراضي', isDefault: true });
  if (Array.isArray(w.embeds)) for (const e of w.embeds) if (e && e.url) embeds.push({ ...e, isDefault: false });

  // رابط العمل (canonical)
  const url = w.kind === 'movie' ? `/movies/${w.slug}/` : `/series/${w.slug}/`;
  const enUrl = `/en${url}`;

  return {
    // أساسيات
    id: w.id || w.slug,
    slug: w.slug,
    kind: w.kind,
    title: w.title || w.slug,
    titleOriginal: w.titleOriginal || '',
    type: w.kind === 'movie' ? CONTENT_TYPE.movie : CONTENT_TYPE.series,

    // الوصف والقصة
    synopsis: w.synopsis || '',
    synopsisEn: w.synopsisEn || '',
    body: w.body || '',
    notesEn: w.notesEn || '',

    // بيانات الفيلم/المسلسل
    year: w.year || null,
    releaseDate: w.releaseDate || null,
    genres,
    country: w.country || '',
    language: w.language || '',
    runtime: w.runtime || null,
    ageRating: w.ageRating || '',
    seriesStatus: w.status || null,
    seasonCount,
    episodeCount,
    seasons: w.kind === 'series' ? seasons : undefined,

    // الصور
    poster: w.poster || '',
    hasPoster,
    posterAlt: w.posterAlt || '',
    posterAltEn: w.posterAltEn || '',
    posterTemporary: !!w.posterTemporary,
    posterDesign: !!w.posterDesign,
    backdrop: w.backdrop || '',

    // الأشخاص
    directors,
    writers,
    cast,
    directorPeople,
    writerPeople,
    castPeople,
    directorNames,
    writerNames,
    castNames,

    // الوسائط
    trailer,
    trailerHas: !!trailer,
    watch,
    hasEmbed,
    embed,
    embeds,
    embedUrl: w.embedUrl || '',

    // الحالة
    featured: !!w.featured,
    draft: !!w.draft,
    archived: !!w.archived,
    published,

    // SEO
    seoTitle: w.seoTitle || w.title || '',
    seoTitleEn: w.seoTitleEn || '',
    seoDescription: w.seoDescription || '',
    seoDescriptionEn: w.seoDescriptionEn || '',
    heading: w.heading || w.title || '',
    headingEn: w.headingEn || '',
    url,
    canonical: w.canonical || url,
    hasEn: !!w.synopsisEn,

    // تواريخ
    addedAt: w.addedAt || '',
    updatedAt: w.updatedAt || '',

    // حقول إضافية تتوقعها المكوّنات (قيم افتراضية آمنة)
    isSubtitled: !!w.isSubtitled,
    headingSubtitled: w.headingSubtitled || '',
    seoTitleSubtitled: w.seoTitleSubtitled || '',
    subtitles: w.subtitles || null,
    releaseDateEG: w.releaseDateEG || null,
    popularity: typeof w.popularity === 'number' ? w.popularity : null,
    writers: Array.isArray(w.writers) ? w.writers : [],

    // ترتيب
    order: w.order || 0,
  };
}

// =========== واجهة القراءة العامة (مطابقة لـ lib/content.mjs) ===========

function byNewestAdded(a, b) {
  const d = (b.addedAt || '').localeCompare(a.addedAt || '');
  return d !== 0 ? d : (b.year || 0) - (a.year || 0);
}

let _cached = null;
let _cachedAt = 0;
const CACHE_TTL_MS = 2000; // نكسر الكاش كل ثانيتين حتى تعرض الصفحات التعديلات فورًا

function load() {
  const now = Date.now();
  if (_cached && now - _cachedAt < CACHE_TTL_MS) return _cached;
  const db = getAll();
  const movies = db.movies.map(normalizeWork).filter(Boolean);
  const series = db.series.map(normalizeWork).filter(Boolean);
  _cached = { movies, series, _db: db };
  _cachedAt = now;
  return _cached;
}

/** إبطال الكاش يدويًا (يُستدعى بعد أي تعديل من الـAPI في نفس العملية) */
export function invalidateCache() {
  _cached = null;
  _cachedAt = 0;
}

export const getMovies = () => load().movies.filter((w) => !w.draft).sort(byNewestAdded);
export const getSeries = () => load().series.filter((w) => !w.draft).sort(byNewestAdded);
export const getWorks = (kind = 'all') => {
  if (kind === 'movie') return getMovies();
  if (kind === 'series') return getSeries();
  return [...getMovies(), ...getSeries()].sort(byNewestAdded);
};

export function getWork(kind, slug) {
  const list = kind === 'movie' ? load().movies : load().series;
  const w = list.find((x) => x.slug === slug);
  return w && !w.draft ? w : null;
}

// للاستخدام من لوحة التحكم (تُرى المسودات أيضًا)
export function getWorkDraft(kind, slug) {
  const list = kind === 'movie' ? load().movies : load().series;
  return list.find((x) => x.slug === slug) || null;
}

export function getWorkByRef(ref) {
  if (!ref) return null;
  const isSeries = String(ref).startsWith('series:');
  const slug = String(ref).replace(/^(movie|series):/, '');
  return getWork(isSeries ? 'series' : 'movie', slug);
}

/*
 * الأشخاص والمراجعات والقوائم — نعيدها من lib/content.mjs (المصدر الأصلي)
 * لأن لوحة التحكم لا تديرها في هذه المرحلة.
 */
import { getPeople as _getPeople, getPerson as _getPerson, getReviews as _getReviews, getReview as _getReview, getReviewForWork as _getReviewForWork, getLists as _getLists, similarWorks as _similarWorks, firstParagraph, excerpt, genresWithContent as _genresWithContent, worksInGenre as _worksInGenre, facets as _facets, popularWorks as _popularWorks } from './content.mjs';

export const getPeople = _getPeople;
export const getPerson = _getPerson;
export const getReviews = _getReviews;
export const getReview = _getReview;
export const getReviewForWork = _getReviewForWork;
export const getLists = _getLists;
export { firstParagraph, excerpt };

export function worksInGenre(key, kind = 'all') {
  const pool = kind === 'movie' ? getMovies() : kind === 'series' ? getSeries() : [...getMovies(), ...getSeries()];
  return pool.filter((w) => w.genres.includes(key));
}

export function genresWithContent() {
  const works = [...getMovies(), ...getSeries()];
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

export function similarWorks(work, n = 6) {
  const pool = [...getMovies(), ...getSeries()].filter((w) => !(w.kind === work.kind && w.slug === work.slug));
  const scored = pool
    .map((w) => {
      const overlap = w.genres.filter((g) => work.genres.includes(g)).length;
      const sameKind = w.kind === work.kind ? 0.5 : 0;
      const sameDecade = w.year && work.year && Math.abs(w.year - work.year) <= 5 ? 0.25 : 0;
      return { work: w, score: overlap + sameKind + sameDecade, overlap };
    })
    .filter((x) => x.overlap > 0)
    .sort((a, b) => b.score - a.score || (b.work.year || 0) - (a.work.year || 0));
  if (scored.length >= 3) return scored.slice(0, n).map((x) => x.work);
  const sameKind = (work.kind === 'movie' ? getMovies() : getSeries()).filter((w) => w.slug !== work.slug);
  return [...new Set([...scored.map((x) => x.work), ...sameKind])].slice(0, n);
}

export function facets(kind = 'all') {
  const works = kind === 'movie' ? getMovies() : kind === 'series' ? getSeries() : [...getMovies(), ...getSeries()];
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
  return { genres, years, languages, countries, total: works.length };
}

export function popularWorks(n = 6) {
  if (!siteConfig.features.popularSection) return [];
  const works = [...getMovies(), ...getSeries()].filter((w) => typeof w.popularity === 'number').sort((a, b) => b.popularity - a.popularity);
  return works.length >= 3 ? works.slice(0, n) : [];
}

export const latestAdditions = (n = 8) => [...getMovies(), ...getSeries()].sort(byNewestAdded).slice(0, n);
export const featuredMovies = () => getMovies().filter((w) => w.featured);
export const featuredSeries = () => getSeries().filter((w) => w.featured);
export function worksWithTrailer(n = 3) {
  return [...getMovies(), ...getSeries()].filter((w) => w.trailer).slice(0, n);
}

export function siteStats() {
  const movies = getMovies();
  const allSeries = getAll().series; // جميع المسلسلات (بما فيها المسودات) لحساب الحلقات
  let episodes = 0;
  let seasons = 0;
  for (const s of allSeries) {
    for (const sn of s.seasons || []) {
      if (sn.draft) continue;
      seasons++;
      for (const ep of sn.episodes || []) if (!ep.draft) episodes++;
    }
  }
  return {
    movies: movies.length,
    series: getSeries().length,
    works: movies.length + getSeries().length,
    seasons,
    episodes,
    people: _getPeople().length,
    reviews: _getReviews().length,
    lists: _getLists().length,
    trailers: [...movies, ...getSeries()].filter((w) => w.trailer).length,
    watchLinks: [...movies, ...getSeries()].reduce((n, w) => n + (w.watch?.length || 0), 0),
  };
}
