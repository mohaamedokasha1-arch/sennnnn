/**
 * ============================================================================
 *  طبقة البيانات العامة (للصفحات العامة)
 * ============================================================================
 *  تدمج البيانات المستوردة من Markdown مع التعديلات التي أُجريت عبر لوحة التحكم.
 *
 *  - مع تخزين دائم: تقرأ تعديلات الإدارة (Redis على Vercel / JSON محليًا).
 *  - دون تخزين، أو عند خطأ فيه: تعرض ملفات content/*.md المنشورة بلا كتابة.
 *  - جميع دوال جلب الأعمال async وتعيد مصفوفات/قيمًا آمنة للصفحات العامة.
 * ============================================================================
 */
import { getAll, getStorageStatus } from './db.mjs';
import { GENRES, CONTENT_TYPE, SERIES_STATUS, genreLabel, countryLabel, languageLabel } from './i18n.mjs';
import siteConfig from '../site.config.mjs';
import * as markdown from './content.mjs';

function safeContent(fn, fallback) {
  try { return fn(); } catch (err) { console.error('Akasha Markdown content unavailable:', err); return fallback; }
}

// بناء خريطة الأشخاص مرة واحدة (تُحدّث كل ثانيتين مع كاش البيانات)
function peopleMap() {
  const m = new Map();
  for (const p of safeContent(markdown.getPeople, [])) m.set(p.id, p);
  return m;
}

// =========== تطبيع البيانات للشكل الذي يتوقعه الواجهة الحالية ===========

function normalizeWork(w) {
  if (!w || typeof w !== 'object' || typeof w.slug !== 'string' || !w.slug || !['movie', 'series'].includes(w.kind)) return null;
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
  const hasPoster = Boolean(w.poster && !w.posterTemporary);
  const published = !w.draft && !w.archived;

  // تسوية شكل المواسم ليطابق ما تتوقعه المكوّنات الحالية (number, episodes(count), year)
  let seasons = w.kind === 'series' ? (Array.isArray(w.seasons) ? w.seasons.filter((sn) => sn && typeof sn === 'object') : []).map((sn, idx) => {
    const epList = (Array.isArray(sn.episodes) ? sn.episodes.filter((e) => e && typeof e === 'object' && !e.draft) : []).sort((a, b) => (a.order || a.number) - (b.order || b.number));
    const episodesCount = epList.length > 0
      ? epList.length
      : (Number(sn.episodesCount) || (typeof sn.episodes === 'number' ? sn.episodes : 0));
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
  const defaultUrl = w.kind === 'movie' ? `/movies/${w.slug}/` : `/series/${w.slug}/`;
  const url = w.kind === 'movie' && w.customUrl === `/movie/${w.slug}/` ? w.customUrl : defaultUrl;

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
    notes: w.body || '',
    notesEn: w.notesEn || '',

    // بيانات الفيلم/المسلسل
    year: w.year || null,
    releaseDate: w.releaseDate || null,
    genres,
    country: w.country || '',
    language: w.language || '',
    runtime: w.runtime || null,
    runtimeConfirmed: !!w.runtimeConfirmed,
    ageRating: w.ageRating || '',
    ageRatingNote: w.ageRatingNote || '',
    ageRatingNoteEn: w.ageRatingNoteEn || '',
    seriesStatus: w.status || null,
    seasonCount,
    episodeCount,
    seasons: w.kind === 'series' ? seasons : undefined,

    // الصور
    poster: hasPoster ? w.poster : '',
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
    subtitlesEn: w.subtitlesEn || null,
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

let _cached = null; // Promise shared by simultaneous RSC and metadata requests
let _cachedAt = 0;
const CACHE_TTL_MS = 2000;

function markdownCatalog(unavailable = false) {
  const movies = safeContent(markdown.getMovies, []);
  const series = safeContent(markdown.getSeries, []);
  return { movies, series, unavailable: unavailable || (movies.length === 0 && series.length === 0) };
}

async function load() {
  const now = Date.now();
  if (_cached && now - _cachedAt < CACHE_TTL_MS) return _cached;
  // Do not touch the file-backed DB on Vercel without a persistent store.
  // Markdown is a complete, safe, read-only source for the public catalog.
  _cached = (async () => {
    if (!getStorageStatus().available) return markdownCatalog();
    try {
      const db = await getAll();
      return {
        movies: db.movies.map(normalizeWork).filter(Boolean),
        series: db.series.map(normalizeWork).filter(Boolean),
      };
    } catch (err) {
      console.error('Akasha catalog: using committed Markdown after storage error:', err);
      return markdownCatalog(true);
    }
  })();
  _cachedAt = now;
  return _cached;
}

/** Called after a successful admin mutation in this instance. Other instances expire in 2s. */
export function invalidateCache() {
  _cached = null;
  _cachedAt = 0;
}

export const getMovies = async () => (await load()).movies.filter((w) => !w.draft && !w.archived).sort(byNewestAdded);
export const getSeries = async () => (await load()).series.filter((w) => !w.draft && !w.archived).sort(byNewestAdded);
export async function getWorks(kind = 'all') {
  if (kind === 'movie') return getMovies();
  if (kind === 'series') return getSeries();
  return [...await getMovies(), ...await getSeries()].sort(byNewestAdded);
}

export async function publicDataStatus() {
  return { unavailable: (await load()).unavailable === true };
}

export async function getWork(kind, slug) {
  const data = await load();
  const list = kind === 'movie' ? data.movies : data.series;
  const w = list.find((x) => x.slug === slug);
  return w && !w.draft && !w.archived ? w : null;
}

export async function getWorkDraft(kind, slug) {
  const data = await load();
  const list = kind === 'movie' ? data.movies : data.series;
  return list.find((x) => x.slug === slug) || null;
}

export async function getWorkByRef(ref) {
  if (!ref) return null;
  const isSeries = String(ref).startsWith('series:');
  const slug = String(ref).replace(/^(movie|series):/, '');
  return getWork(isSeries ? 'series' : 'movie', slug);
}

/*
 * الأشخاص والمراجعات والقوائم — نعيدها من lib/content.mjs (المصدر الأصلي)
 * لأن لوحة التحكم لا تديرها في هذه المرحلة.
 */
export const getPeople = () => safeContent(markdown.getPeople, []);
export const getPerson = (id) => safeContent(() => markdown.getPerson(id), null);
export const getReviews = () => safeContent(markdown.getReviews, []);
export const getReview = (slug) => safeContent(() => markdown.getReview(slug), null);
export const getReviewForWork = (work) => safeContent(() => markdown.getReviewForWork(work), null);
export const getLists = () => safeContent(markdown.getLists, []);
export const { firstParagraph, excerpt } = markdown;

export async function worksInGenre(key, kind = 'all') {
  const pool = await getWorks(kind);
  return pool.filter((w) => w.genres.includes(key));
}

export async function genresWithContent() {
  const works = await getWorks();
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

export async function similarWorks(work, n = 6) {
  const pool = (await getWorks()).filter((w) => !(w.kind === work.kind && w.slug === work.slug));
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
  const sameKind = (await getWorks(work.kind)).filter((w) => w.slug !== work.slug);
  return [...new Set([...scored.map((x) => x.work), ...sameKind])].slice(0, n);
}

export async function facets(kind = 'all') {
  const works = await getWorks(kind);
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

export async function popularWorks(n = 6) {
  if (!siteConfig.features.popularSection) return [];
  const works = (await getWorks()).filter((w) => typeof w.popularity === 'number').sort((a, b) => b.popularity - a.popularity);
  return works.length >= 3 ? works.slice(0, n) : [];
}

export const latestAdditions = async (n = 8) => (await getWorks()).slice(0, n);
export const featuredMovies = async () => (await getMovies()).filter((w) => w.featured);
export const featuredSeries = async () => (await getSeries()).filter((w) => w.featured);
export async function worksWithTrailer(n = 3) {
  return (await getWorks()).filter((w) => w.trailer).slice(0, n);
}

export async function siteStats() {
  const [movies, series] = await Promise.all([getMovies(), getSeries()]);
  const seasons = series.reduce((n, w) => n + (w.seasons || []).filter((s) => !s.draft).length, 0);
  const episodes = series.reduce((n, w) => n + (w.seasons || []).filter((s) => !s.draft).reduce((sum, s) => sum + (Number(s.episodes) || 0), 0), 0);
  const works = [...movies, ...series];
  return {
    movies: movies.length,
    series: series.length,
    works: works.length,
    seasons,
    episodes,
    people: getPeople().length,
    reviews: getReviews().length,
    lists: getLists().length,
    trailers: works.filter((w) => w.trailer).length,
    watchLinks: works.reduce((n, w) => n + (w.watch?.length || 0), 0),
  };
}
