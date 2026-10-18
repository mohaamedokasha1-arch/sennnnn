/**
 * ============================================================================
 *  طبقة البيانات — أكاشا سينما
 * ============================================================================
 *  التخزين الإداري: ملف JSON محلي على قرص دائم في التطوير، أو PostgreSQL
 *  (Neon / Vercel Postgres — بمزامنة سكيما تلقائية وكتابة ذرّية)، أو Upstash
 *  Redis REST على Vercel. لا تُكتب بيانات أثناء القراءة في الوضع المحلي،
 *  ولا تُخزّن كلمة مرور المدير على قرص Serverless مؤقت. التعديلات ذرّية بقفل
 *  ملف محلي أو مقارنة وكتابة (CAS) داخل PostgreSQL/Redis. عند غياب المخزن،
 *  تُعيد طبقة العرض العامة المحتوى المنشور من Markdown؛ أما إنشاء المدير
 *  والتعديلات فتُوقف بأمان وتظهر رسالة إعداد بدل انهيار الصفحات.
 * ============================================================================
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import matter from 'gray-matter';
import bcrypt from 'bcryptjs';
import {
  StorageUnavailableError,
  postgresConfig,
  ensurePostgresSchema,
  postgresGet,
  postgresSetCas,
} from './db-postgres.mjs';

// الطبقة العامة للوحدات الأخرى تبقى كما هي (تُصدَّر من هنا للتوافق).
export { StorageUnavailableError, ensurePostgresSchema };

const ROOT = process.cwd();
// Local development only. Vercel functions have no persistent, writable filesystem.
const DATA_DIR = path.resolve(process.env.AKASHA_DATA_DIR || path.join(ROOT, '.data'));
const DB_FILE = path.join(DATA_DIR, 'akasha-db.json');
const LOCK_FILE = path.join(DATA_DIR, '.lock');
const LOCK_TIMEOUT_MS = 5000;
const LOCK_STALE_MS = 30_000;
const REDIS_KEY = process.env.AKASHA_REDIS_KEY || 'akasha:db:v1';
const PG_KEY = process.env.AKASHA_PG_KEY || REDIS_KEY; // مفتاح مستند الإدارة داخل PostgreSQL

function redisConfig() {
  // Vercel Marketplace Upstash and legacy Vercel KV use different variable names.
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    return { url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN };
  }
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    return { url: process.env.KV_REST_API_URL, token: process.env.KV_REST_API_TOKEN };
  }
  return null;
}

function isValidRedisRestUrl(url) {
  try {
    return new URL(url).protocol === 'https:';
  } catch {
    return false;
  }
}

/** True when the URL pasted into a Redis variable is actually a Postgres URL. */
function looksLikePostgresUrl(url) {
  return /^postgres(ql)?:\/\//i.test(String(url || '').trim().replace(/^["']|["']$/g, ''));
}

/**
 * Never use the ephemeral /tmp or a build-time .data snapshot for admin credentials.
 *
 * أولويات اختيار المخزن (الوضع التلقائي):
 *   1. Upstash/KV Redis سليم (https + رمز) — حفاظًا على النشرات القائمة.
 *   2. PostgreSQL (Neon / Vercel Postgres) عبر DATABASE_URL وأشباهها،
 *      بما في ذلك رابط postgres:// الملصوق داخل متغيرات Upstash/KV
 *      (الفحص المرن) بدل رفضه برسالة "يلزم عنوان HTTPS" الخاطئة.
 *   3. ملف محلي للتطوير على قرص دائم.
 * يمكن فرز مخزن بعينه عبر AKASHA_STORAGE_MODE=postgres|redis.
 */
export function getStorageStatus() {
  const forced = String(process.env.AKASHA_STORAGE_MODE || '').trim().toLowerCase();
  const pg = postgresConfig();
  const remote = redisConfig();

  if (forced === 'postgres' || forced === 'postgresql' || forced === 'pg') {
    if (pg && !pg.error) return { available: true, mode: 'postgres' };
    return {
      available: false,
      mode: 'unavailable',
      message: pg?.error || 'AKASHA_STORAGE_MODE=postgres لكن لم يُضبط رابط PostgreSQL صالح. اضبط DATABASE_URL في Vercel (رابط يبدأ بـ postgres:// أو postgresql://) ثم أعد النشر.',
    };
  }
  if (forced === 'redis' || forced === 'upstash') {
    if (remote && isValidRedisRestUrl(remote.url)) return { available: true, mode: 'redis' };
    return {
      available: false,
      mode: 'unavailable',
      message: 'AKASHA_STORAGE_MODE=redis لكن رابط Upstash REST (https://…) ورمز الوصول غير مضبوطين معًا في Vercel.',
    };
  }

  // 1) مخزن Redis سابق سليم يحتفظ بأولويته (استمرارية بيانات الإدارة).
  if (remote && isValidRedisRestUrl(remote.url) && !looksLikePostgresUrl(remote.url)) {
    return { available: true, mode: 'redis' };
  }

  // 2) PostgreSQL — بما في ذلك رابط postgres:// داخل متغيرات Upstash/KV.
  if (pg) {
    if (pg.error) return { available: false, mode: 'unavailable', message: pg.error };
    return { available: true, mode: 'postgres' };
  }

  if (remote) {
    // وُضع رابط ورمز معًا لكن الرابط ليس https صالحًا ولا postgres.
    return {
      available: false,
      mode: 'unavailable',
      message: 'رابط قاعدة البيانات غير صالح. المتوقع: عنوان https لتخزين Upstash Redis REST، أو رابط postgres:// / postgresql:// لقاعدة Neon / Vercel Postgres.',
    };
  }
  if (process.env.VERCEL === '1' || process.env.AKASHA_READ_ONLY === '1') {
    return {
      available: false,
      mode: 'unavailable',
      message: 'لوحة التحكم تحتاج تخزينًا دائمًا. اضبط DATABASE_URL (Neon / Vercel Postgres) أو UPSTASH_REDIS_REST_URL وUPSTASH_REDIS_REST_TOKEN في Vercel ثم أعد النشر. يظل تصفح الأفلام متاحًا من ملفات المحتوى.',
    };
  }
  if (process.env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REDIS_REST_TOKEN ||
      process.env.KV_REST_API_URL || process.env.KV_REST_API_TOKEN) {
    return { available: false, mode: 'unavailable', message: 'إعداد التخزين غير مكتمل: يلزم رابط Redis REST ورمز الوصول معًا، أو رابط postgres:// كامل في DATABASE_URL.' };
  }
  return { available: true, mode: 'file' }; // development / self-hosted Node with persistent disk
}

function requireStorage() {
  const status = getStorageStatus();
  if (!status.available) throw new StorageUnavailableError(status.message);
  return status.mode;
}

async function redisCommand(parts) {
  const { url, token } = redisConfig();
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(parts),
      cache: 'no-store',
      signal: AbortSignal.timeout(6000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    if (payload.error || !Object.hasOwn(payload, 'result')) throw new Error('Redis command failed');
    return payload.result;
  } catch (err) {
    // Don't expose credentials, URLs, or database content to the visitor.
    console.error('Akasha storage request failed:', err);
    throw new StorageUnavailableError();
  }
}

function defaultDb() {
  return {
    _version: 1,
    _importedAt: null,
    movies: [],
    series: [],
    categories: [],
    siteSettings: null,
    users: [],
    sessions: [],
    auditLog: [],
  };
}

function parseDb(raw) {
  try {
    const parsed = JSON.parse(raw);
    // A corrupt users array must never reopen first-run admin registration.
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) || !Array.isArray(parsed.users)) {
      throw new Error('Invalid database root/users');
    }
    const db = { ...defaultDb(), ...parsed };
    if (!['movies', 'series', 'users', 'sessions', 'auditLog', 'categories'].every((key) =>
      Array.isArray(db[key]) && db[key].every((row) => row && typeof row === 'object' && !Array.isArray(row)))) {
      throw new Error('Invalid database structure');
    }
    return db;
  } catch (err) {
    console.error('Akasha database is invalid:', err);
    throw new StorageUnavailableError('بيانات التخزين غير صالحة. أعد النسخة الاحتياطية؛ لن نعيد تهيئة حساب المدير تلقائيًا.');
  }
}

let seedCache;
function seedDb() {
  if (!seedCache) {
    const { movies, series } = importFromMarkdown();
    seedCache = { ...defaultDb(), movies, series, _importedAt: new Date().toISOString() };
  }
  // Mutations and callers must not modify the cached Markdown seed.
  return structuredClone(seedCache);
}

function readFileSnapshot() {
  try {
    return fs.existsSync(DB_FILE) ? fs.readFileSync(DB_FILE, 'utf8') : null;
  } catch (err) {
    console.error('Akasha local database read failed:', err);
    throw new StorageUnavailableError();
  }
}

function acquireLock() {
  try { fs.mkdirSync(DATA_DIR, { recursive: true }); }
  catch (err) { console.error('Akasha local storage is not writable:', err); throw new StorageUnavailableError(); }
  const start = Date.now();
  for (;;) {
    try {
      const fd = fs.openSync(LOCK_FILE, 'wx'); // atomic across processes
      fs.closeSync(fd);
      return;
    } catch (err) {
      if (err.code !== 'EEXIST') {
        console.error('Akasha storage lock failed:', err);
        throw new StorageUnavailableError();
      }
      try {
        if (Date.now() - fs.statSync(LOCK_FILE).mtimeMs > LOCK_STALE_MS) fs.unlinkSync(LOCK_FILE);
      } catch {} // another writer may have released the lock
      if (Date.now() - start > LOCK_TIMEOUT_MS) throw new StorageUnavailableError('قاعدة البيانات مشغولة. حاول مجددًا.');
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 30);
    }
  }
}

function writeFileSnapshot(db) {
  const tmp = `${DB_FILE}.${process.pid}.${crypto.randomBytes(4).toString('hex')}.tmp`;
  try {
    fs.writeFileSync(tmp, JSON.stringify(db), { encoding: 'utf8', flag: 'wx' });
    fs.renameSync(tmp, DB_FILE);
  } catch (err) {
    console.error('Akasha local database write failed:', err);
    throw new StorageUnavailableError();
  } finally {
    try { fs.unlinkSync(tmp); } catch {}
  }
}

/** A local lock, a Redis Lua compare-and-swap, or a Postgres transactional CAS guards every mutation. */
async function mutate(fn) {
  const mode = requireStorage();
  if (mode === 'file') {
    acquireLock();
    try {
      const raw = readFileSnapshot();
      const db = raw === null ? seedDb() : parseDb(raw);
      const result = fn(db);
      if (result?.ok === false) return result;
      writeFileSnapshot(db);
      return result;
    } finally {
      try { fs.unlinkSync(LOCK_FILE); } catch {}
    }
  }

  if (mode === 'postgres') {
    // Postgres (Neon / Vercel Postgres): same CAS retry semantics as Redis.
    for (let attempt = 0; attempt < 5; attempt++) {
      const before = await postgresGet(PG_KEY);
      const db = before === null ? seedDb() : parseDb(before);
      const result = fn(db); // retry the validation as well as the mutation on conflicts
      if (result?.ok === false) return result;
      const expected = before === null ? '' : crypto.createHash('sha1').update(before).digest('hex');
      const written = await postgresSetCas(PG_KEY, expected, JSON.stringify(db));
      if (written === true) return result;
    }
    throw new StorageUnavailableError('حدث تعارض أثناء حفظ البيانات. أعد المحاولة.');
  }

  // Compare a SHA1 of the old value instead of sending the whole old DB twice
  // in every REST request. Redis evaluates the comparison and SET atomically.
  const script = `local prev = redis.call('GET', KEYS[1])
    if (prev == false and ARGV[1] == '') or (prev ~= false and redis.sha1hex(prev) == ARGV[1]) then
      redis.call('SET', KEYS[1], ARGV[2]); return 1
    end
    return 0`;
  for (let attempt = 0; attempt < 5; attempt++) {
    const before = await redisCommand(['GET', REDIS_KEY]);
    const db = before === null ? seedDb() : parseDb(before);
    const result = fn(db); // retry the validation as well as the mutation on conflicts
    if (result?.ok === false) return result;
    const expected = before === null ? '' : crypto.createHash('sha1').update(before).digest('hex');
    const written = await redisCommand(['EVAL', script, 1, REDIS_KEY, expected, JSON.stringify(db)]);
    if (Number(written) === 1) return result;
  }
  throw new StorageUnavailableError('حدث تعارض أثناء حفظ البيانات. أعد المحاولة.');
}

// ============================================================================
//  مُعرِّفات
// ============================================================================
function uid(prefix = 'id') {
  return `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
}

function slugify(text) {
  if (!text) return '';
  return String(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120);
}

function nowIso() {
  return new Date().toISOString();
}

function isoDate(value) {
  return value instanceof Date ? value.toISOString().slice(0, 10) : (value || null);
}

// ============================================================================
//  الاستيراد من Markdown
// ============================================================================
function importFromMarkdown() {
  const contentDir = path.join(ROOT, 'content');
  const readMarkdownFiles = (subDir) => {
    const dir = path.join(contentDir, subDir);
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir)
      .filter((f) => f.endsWith('.md'))
      .map((f) => {
        const slug = f.replace(/\.md$/, '');
        try {
          const { data, content: body } = matter(fs.readFileSync(path.join(dir, f), 'utf8'));
          return { slug, data, body };
        } catch (err) {
          console.error(`⚠️ تعذر قراءة ${subDir}/${f}:`, err);
          return null;
        }
      })
      .filter(Boolean);
  };

  const movies = [];
  const series = [];

  for (const { slug, data, body } of readMarkdownFiles('movies')) {
    movies.push({
      id: `movie_${slug}`,
      slug,
      kind: 'movie',
      title: data.title || slug,
      titleOriginal: data.titleOriginal || '',
      synopsis: data.synopsis || '',
      synopsisEn: data.synopsisEn || '',
      body: body || '',
      customUrl: data.customUrl || '',
      notesEn: data.notesEn || '',
      year: Number(data.year) || null,
      releaseDate: isoDate(data.releaseDate),
      releaseDateEG: isoDate(data.releaseDateEG),
      genres: Array.isArray(data.genres) ? data.genres : [],
      country: data.country || '',
      language: data.language || '',
      runtime: Number(data.runtime) || null,
      runtimeConfirmed: !!data.runtime,
      ageRating: data.ageRating || '',
      ageRatingNote: data.ageRatingNote || '',
      ageRatingNoteEn: data.ageRatingNoteEn || '',
      isSubtitled: !!data.isSubtitled,
      subtitles: data.subtitles || '',
      subtitlesEn: data.subtitlesEn || '',
      poster: data.poster || '',
      posterAlt: data.posterAlt || '',
      posterAltEn: data.posterAltEn || '',
      posterTemporary: !!data.posterTemporary,
      posterDesign: !!data.posterDesign,
      backdrop: data.backdrop || '',
      directors: Array.isArray(data.directors) ? data.directors : [],
      writers: Array.isArray(data.writers) ? data.writers : [],
      cast: Array.isArray(data.cast) ? data.cast : [],
      trailer: data.trailer || null,
      watch: Array.isArray(data.watch) ? data.watch : [],
      embedUrl: data.embedUrl || '', // رابط التضمين (إضافة للوحة التحكم)
      embeds: Array.isArray(data.embeds) ? data.embeds : [],
      featured: !!data.featured,
      popularity: typeof data.popularity === 'number' ? data.popularity : null,
      draft: data.draft !== false,
      archived: !!data.archived,
      homepage: data.homepage !== false,
      seoTitle: data.seoTitle || data.title || '',
      seoTitleSubtitled: data.seoTitleSubtitled || '',
      seoTitleEn: data.seoTitleEn || '',
      seoDescription: data.seoDescription || '',
      seoDescriptionEn: data.seoDescriptionEn || '',
      canonical: data.canonical || '',
      heading: data.heading || data.title || '',
      headingSubtitled: data.headingSubtitled || '',
      headingEn: data.headingEn || '',
      addedAt: isoDate(data.addedAt) || nowIso().slice(0, 10),
      updatedAt: nowIso(),
      order: data.order || 0,
      source: 'markdown', // وسم: أتى من markdown عند الاستيراد
    });
  }

  for (const { slug, data, body } of readMarkdownFiles('series')) {
    const seasonsRaw = Array.isArray(data.seasons) ? data.seasons : [];
    // ملاحظة: المواسم القادمة من Markdown تُخزَّن فقط كملخّص (عدد الحلقات + السنة)
    // بدون إنشاء كائنات حلقات فردية، لأن ملفات markdown لا تحتوي تفاصيل الحلقات.
    // عندما يضيف المدير حلقات من لوحة التحكم تُنشأ كائناتها فعلًا وتظهر في المشغّل.
    const seasons = seasonsRaw.map((s, idx) => {
      const seasonNumber = Number(s.number) ?? (idx + 1);
      const episodeCount = Number(s.episodes) || 0;
      return {
        id: `season_${slug}_${idx + 1}`,
        number: seasonNumber,
        title: s.title || `الموسم ${seasonNumber}`,
        titleOriginal: s.titleOriginal || `Season ${seasonNumber}`,
        year: Number(s.year) || null,
        episodes: [], // لا نُنشئ حلقات وهمية
        episodesCount: episodeCount, // نحتفظ بالعدد للعرض
        draft: false,
        order: idx + 1,
        source: 'markdown-summary',
      };
    });

    series.push({
      id: `series_${slug}`,
      slug,
      kind: 'series',
      title: data.title || slug,
      titleOriginal: data.titleOriginal || '',
      synopsis: data.synopsis || '',
      synopsisEn: data.synopsisEn || '',
      body: body || '',
      customUrl: data.customUrl || '',
      year: Number(data.year) || null,
      releaseDate: isoDate(data.releaseDate),
      releaseDateEG: isoDate(data.releaseDateEG),
      genres: Array.isArray(data.genres) ? data.genres : [],
      country: data.country || '',
      language: data.language || '',
      runtime: Number(data.runtime) || null,
      runtimeConfirmed: !!data.runtime,
      ageRating: data.ageRating || '',
      ageRatingNote: data.ageRatingNote || '',
      ageRatingNoteEn: data.ageRatingNoteEn || '',
      isSubtitled: !!data.isSubtitled,
      subtitles: data.subtitles || '',
      subtitlesEn: data.subtitlesEn || '',
      status: data.status || 'ongoing',
      poster: data.poster || '',
      posterAlt: data.posterAlt || '',
      posterAltEn: data.posterAltEn || '',
      posterTemporary: !!data.posterTemporary,
      posterDesign: !!data.posterDesign,
      backdrop: data.backdrop || '',
      directors: Array.isArray(data.directors) ? data.directors : [],
      writers: Array.isArray(data.writers) ? data.writers : [],
      cast: Array.isArray(data.cast) ? data.cast : [],
      trailer: data.trailer || null,
      watch: Array.isArray(data.watch) ? data.watch : [],
      embedUrl: data.embedUrl || '',
      embeds: Array.isArray(data.embeds) ? data.embeds : [],
      featured: !!data.featured,
      popularity: typeof data.popularity === 'number' ? data.popularity : null,
      draft: data.draft !== false,
      archived: !!data.archived,
      homepage: data.homepage !== false,
      seoTitle: data.seoTitle || data.title || '',
      seoTitleSubtitled: data.seoTitleSubtitled || '',
      seoTitleEn: data.seoTitleEn || '',
      seoDescription: data.seoDescription || '',
      seoDescriptionEn: data.seoDescriptionEn || '',
      canonical: data.canonical || '',
      heading: data.heading || data.title || '',
      headingSubtitled: data.headingSubtitled || '',
      headingEn: data.headingEn || '',
      addedAt: isoDate(data.addedAt) || nowIso().slice(0, 10),
      updatedAt: nowIso(),
      order: data.order || 0,
      seasons,
      source: 'markdown',
    });
  }

  return { movies, series };
}

// Read-only operations never create .data/ or perform filesystem writes.
// This matters on Vercel, and also keeps first-run requests safe under concurrency.
// في وضع PostgreSQL تُزامَن السكيما تلقائيًا هنا (CREATE TABLE IF NOT EXISTS
// مرة واحدة لكل عملية تشغيل) فلا حاجة لأي خطوة migration يدوية.
export async function initDb() {
  return getAll();
}

export async function getAll() {
  const mode = requireStorage();
  let raw;
  if (mode === 'redis') raw = await redisCommand(['GET', REDIS_KEY]);
  else if (mode === 'postgres') raw = await postgresGet(PG_KEY); // يشمل مزامنة السكيما
  else raw = readFileSnapshot();
  return raw === null ? seedDb() : parseDb(raw);
}

// ============================================================================
//  الأفلام
// ============================================================================
export async function listMovies({ draft = null, search = '', sort = 'newest', page = 1, perPage = 50, genre = '', featured = null, missingEmbed = false, missingPoster = false } = {}) {
  const db = await getAll();
  let items = [...db.movies];
  if (draft === true) items = items.filter((m) => m.draft);
  else if (draft === false) items = items.filter((m) => !m.draft);
  if (featured === true) items = items.filter((m) => m.featured);
  else if (featured === false) items = items.filter((m) => !m.featured);
  if (genre) items = items.filter((m) => m.genres.includes(genre));
  if (missingEmbed) items = items.filter((m) => !m.embedUrl && (!m.embeds || m.embeds.length === 0));
  if (missingPoster) items = items.filter((m) => !m.poster);
  if (search) {
    const q = String(search).toLowerCase();
    items = items.filter((m) =>
      (m.title || '').toLowerCase().includes(q) ||
      (m.titleOriginal || '').toLowerCase().includes(q) ||
      (m.slug || '').toLowerCase().includes(q)
    );
  }
  if (sort === 'title') items.sort((a, b) => (a.title || '').localeCompare(b.title || '', 'ar'));
  else if (sort === 'year') items.sort((a, b) => (b.year || 0) - (a.year || 0));
  else if (sort === 'updated') items.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
  else items.sort((a, b) => (b.addedAt || '').localeCompare(a.addedAt || ''));
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / perPage));
  const p = Math.max(1, Math.min(page, pages));
  const data = items.slice((p - 1) * perPage, p * perPage);
  return { data, total, page: p, pages, perPage };
}

export async function getMovieBySlug(slug, includeDraft = true) {
  const db = await getAll();
  const m = db.movies.find((x) => x.slug === slug);
  if (!m) return null;
  if (!includeDraft && m.draft) return null;
  return m;
}

export async function getMovieById(id) {
  const db = await getAll();
  return db.movies.find((m) => m.id === id) || null;
}

async function validateMovie(input, existing = null) {
  const errors = {};
  // في التعديل: ندمج القيم الحالية مع الجديدة حتى لا نُجبر إرسال كل الحقول.
  const merged = existing ? { ...existing, ...input } : input;
  const title = String(merged.title || '').trim();
  if (!title) errors.title = 'العنوان العربي مطلوب.';
  const titleOriginal = String(merged.titleOriginal || '').trim();
  let slug = String(merged.slug || '').trim();
  if (!slug) slug = slugify(title || titleOriginal);
  if (!slug) errors.slug = 'لا يمكن توليد slug من العنوان.';
  else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 120) errors.slug = 'slug غير صالح.';
  const db = await getAll();
  const dup = db.movies.find((m) => m.slug === slug && m.id !== existing?.id);
  if (dup) errors.slug = 'slug مستخدم بالفعل.';
  const yearRaw = merged.year;
  const year = yearRaw !== null && yearRaw !== undefined && yearRaw !== '' ? Number(yearRaw) : null;
  if (yearRaw !== null && yearRaw !== undefined && yearRaw !== '' && (isNaN(year) || year < 1900 || year > 2100)) errors.year = 'سنة غير صالحة.';
  const runtimeRaw = merged.runtime;
  const runtime = runtimeRaw !== null && runtimeRaw !== undefined && runtimeRaw !== '' ? Number(runtimeRaw) : null;
  if (runtimeRaw !== null && runtimeRaw !== undefined && runtimeRaw !== '' && (isNaN(runtime) || runtime < 1 || runtime > 1000)) errors.runtime = 'مدة غير صالحة.';
  const embedUrl = String(merged.embedUrl || '').trim();
  if (embedUrl && !isSafeEmbedUrl(embedUrl)) errors.embedUrl = 'رابط التضمين غير صالح أو من نطاق غير مسموح.';
  return { errors, slug, year, runtime };
}

export async function createMovie(input, actor = {}) {
  const { errors, slug, year, runtime } = await validateMovie(input);
  if (Object.keys(errors).length) return { ok: false, errors };
  const title = String(input.title || '').trim();
  const titleOriginal = String(input.titleOriginal || '').trim();
  const movie = {
    id: uid('movie'),
    slug,
    kind: 'movie',
    title: String(input.title || '').trim(),
    titleOriginal: String(input.titleOriginal || '').trim(),
    synopsis: String(input.synopsis || '').trim(),
    synopsisEn: String(input.synopsisEn || '').trim(),
    body: String(input.body || '').trim(),
    notesEn: String(input.notesEn || '').trim(),
    year,
    releaseDate: String(input.releaseDate || '').trim() || null,
    genres: Array.isArray(input.genres) ? input.genres.filter(Boolean) : [],
    country: String(input.country || '').trim(),
    language: String(input.language || '').trim(),
    runtime,
    ageRating: String(input.ageRating || '').trim(),
    poster: String(input.poster || '').trim(),
    posterAlt: String(input.posterAlt || '').trim(),
    posterAltEn: String(input.posterAltEn || '').trim(),
    posterTemporary: !!input.posterTemporary,
    posterDesign: !!input.posterDesign,
    backdrop: String(input.backdrop || '').trim(),
    directors: Array.isArray(input.directors) ? input.directors.filter(Boolean) : [],
    cast: Array.isArray(input.cast) ? input.cast.filter(Boolean) : [],
    trailer: input.trailer || null,
    watch: Array.isArray(input.watch) ? input.watch.filter((w) => w && w.url) : [],
    embedUrl: String(input.embedUrl || '').trim(),
    embeds: Array.isArray(input.embeds) ? input.embeds.filter((e) => e && e.url) : [],
    featured: !!input.featured,
    draft: input.draft !== false,
    archived: !!input.archived,
    homepage: input.homepage !== false,
    seoTitle: String(input.seoTitle || '').trim() || title,
    seoTitleEn: String(input.seoTitleEn || '').trim(),
    seoDescription: String(input.seoDescription || '').trim(),
    seoDescriptionEn: String(input.seoDescriptionEn || '').trim(),
    canonical: String(input.canonical || '').trim(),
    heading: String(input.heading || '').trim() || title,
    headingEn: String(input.headingEn || '').trim(),
    addedAt: nowIso().slice(0, 10),
    updatedAt: nowIso(),
    order: Number(input.order) || 0,
    source: 'admin',
  };
  return mutate((db) => {
    if (db.movies.some((m) => m.slug === movie.slug)) return { ok: false, errors: { slug: 'slug مستخدم بالفعل.' } };
    db.movies.push(movie);
    db.auditLog.push({
      id: uid('log'),
      actorId: actor.id || null,
      actorName: actor.name || 'system',
      action: 'movie.create',
      target: `movie:${movie.slug}`,
      targetId: movie.id,
      at: nowIso(),
    });
    // حفظ آخر 500 سجل فقط
    if (db.auditLog.length > 500) db.auditLog = db.auditLog.slice(-500);
    return { ok: true, movie };
  });
}

export async function updateMovie(id, input, actor = {}) {
  const existing = await getMovieById(id);
  if (!existing) return { ok: false, errors: { _: 'الفيلم غير موجود.' } };
  const { errors, slug, year, runtime } = await validateMovie(input, existing);
  if (Object.keys(errors).length) return { ok: false, errors };
  const updated = {
    ...existing,
    slug,
    title: String(input.title || existing.title).trim(),
    titleOriginal: String(input.titleOriginal ?? existing.titleOriginal).trim(),
    synopsis: String(input.synopsis ?? existing.synopsis).trim(),
    synopsisEn: String(input.synopsisEn ?? existing.synopsisEn).trim(),
    body: String(input.body ?? existing.body).trim(),
    notesEn: String(input.notesEn ?? existing.notesEn).trim(),
    year,
    releaseDate: String(input.releaseDate ?? existing.releaseDate ?? '').trim() || null,
    genres: Array.isArray(input.genres) ? input.genres.filter(Boolean) : existing.genres,
    country: String(input.country ?? existing.country).trim(),
    language: String(input.language ?? existing.language).trim(),
    runtime,
    ageRating: String(input.ageRating ?? existing.ageRating).trim(),
    poster: String(input.poster ?? existing.poster).trim(),
    posterAlt: String(input.posterAlt ?? existing.posterAlt).trim(),
    posterAltEn: String(input.posterAltEn ?? existing.posterAltEn).trim(),
    posterTemporary: !!input.posterTemporary,
    posterDesign: !!input.posterDesign,
    backdrop: String(input.backdrop ?? existing.backdrop).trim(),
    directors: Array.isArray(input.directors) ? input.directors.filter(Boolean) : existing.directors,
    cast: Array.isArray(input.cast) ? input.cast.filter(Boolean) : existing.cast,
    trailer: input.trailer !== undefined ? (input.trailer || null) : existing.trailer,
    watch: Array.isArray(input.watch) ? input.watch.filter((w) => w && w.url) : existing.watch,
    embedUrl: String(input.embedUrl ?? existing.embedUrl).trim(),
    embeds: Array.isArray(input.embeds) ? input.embeds.filter((e) => e && e.url) : existing.embeds,
    featured: input.featured !== undefined ? !!input.featured : existing.featured,
    draft: input.draft !== undefined ? !!input.draft : existing.draft,
    archived: input.archived !== undefined ? !!input.archived : existing.archived,
    homepage: input.homepage !== undefined ? !!input.homepage : existing.homepage,
    seoTitle: String(input.seoTitle ?? existing.seoTitle).trim() || String(input.title || existing.title).trim(),
    seoTitleEn: String(input.seoTitleEn ?? existing.seoTitleEn).trim(),
    seoDescription: String(input.seoDescription ?? existing.seoDescription).trim(),
    seoDescriptionEn: String(input.seoDescriptionEn ?? existing.seoDescriptionEn).trim(),
    canonical: String(input.canonical ?? existing.canonical).trim(),
    heading: String(input.heading ?? existing.heading).trim() || String(input.title || existing.title).trim(),
    headingEn: String(input.headingEn ?? existing.headingEn).trim(),
    order: input.order !== undefined ? Number(input.order) || 0 : existing.order,
    updatedAt: nowIso(),
  };
  await mutate((db) => {
    const idx = db.movies.findIndex((m) => m.id === id);
    if (idx >= 0) {
      db.movies[idx] = updated;
      db.auditLog.push({
        id: uid('log'),
        actorId: actor.id || null,
        actorName: actor.name || 'system',
        action: 'movie.update',
        target: `movie:${updated.slug}`,
        targetId: updated.id,
        at: nowIso(),
      });
      if (db.auditLog.length > 500) db.auditLog = db.auditLog.slice(-500);
    }
  });
  return { ok: true, movie: updated };
}

export async function deleteMovie(id, actor = {}) {
  const existing = await getMovieById(id);
  if (!existing) return { ok: false, error: 'الفيلم غير موجود.' };
  await mutate((db) => {
    db.movies = db.movies.filter((m) => m.id !== id);
    db.auditLog.push({
      id: uid('log'),
      actorId: actor.id || null,
      actorName: actor.name || 'system',
      action: 'movie.delete',
      target: `movie:${existing.slug}`,
      targetId: existing.id,
      at: nowIso(),
    });
    if (db.auditLog.length > 500) db.auditLog = db.auditLog.slice(-500);
  });
  return { ok: true };
}

export async function duplicateMovie(id, actor = {}) {
  const existing = await getMovieById(id);
  if (!existing) return { ok: false, error: 'الفيلم غير موجود.' };
  const newSlug = `${existing.slug}-copy-${Date.now().toString(36)}`;
  const copy = {
    ...existing,
    id: uid('movie'),
    slug: newSlug,
    title: `${existing.title} (نسخة)`,
    draft: true,
    featured: false,
    archived: false,
    addedAt: nowIso().slice(0, 10),
    updatedAt: nowIso(),
    source: 'admin',
  };
  await mutate((db) => {
    db.movies.push(copy);
    db.auditLog.push({
      id: uid('log'),
      actorId: actor.id || null,
      actorName: actor.name || 'system',
      action: 'movie.duplicate',
      target: `movie:${copy.slug}`,
      targetId: copy.id,
      at: nowIso(),
    });
  });
  return { ok: true, movie: copy };
}

// ============================================================================
//  المسلسلات والمواسم والحلقات
// ============================================================================
export async function listSeries({ draft = null, search = '', sort = 'newest', page = 1, perPage = 50, genre = '', featured = null, missingEmbed = false, missingPoster = false } = {}) {
  const db = await getAll();
  let items = [...db.series];
  if (draft === true) items = items.filter((s) => s.draft);
  else if (draft === false) items = items.filter((s) => !s.draft);
  if (featured === true) items = items.filter((s) => s.featured);
  else if (featured === false) items = items.filter((s) => !s.featured);
  if (genre) items = items.filter((s) => s.genres.includes(genre));
  if (missingPoster) items = items.filter((s) => !s.poster);
  if (missingEmbed) {
    items = items.filter((s) => {
      if (!s.seasons || !s.seasons.length) return true;
      return s.seasons.some((sn) => (sn.episodes || []).some((ep) => !ep.embedUrl));
    });
  }
  if (search) {
    const q = String(search).toLowerCase();
    items = items.filter((s) =>
      (s.title || '').toLowerCase().includes(q) ||
      (s.titleOriginal || '').toLowerCase().includes(q) ||
      (s.slug || '').toLowerCase().includes(q)
    );
  }
  if (sort === 'title') items.sort((a, b) => (a.title || '').localeCompare(b.title || '', 'ar'));
  else if (sort === 'year') items.sort((a, b) => (b.year || 0) - (a.year || 0));
  else if (sort === 'updated') items.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
  else items.sort((a, b) => (b.addedAt || '').localeCompare(a.addedAt || ''));
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / perPage));
  const p = Math.max(1, Math.min(page, pages));
  const data = items.slice((p - 1) * perPage, p * perPage);
  return { data, total, page: p, pages, perPage };
}

export async function getSeriesBySlug(slug, includeDraft = true) {
  const db = await getAll();
  const s = db.series.find((x) => x.slug === slug);
  if (!s) return null;
  if (!includeDraft && s.draft) return null;
  // ضمان ترتيب المواسم والحلقات
  const series = { ...s };
  series.seasons = (series.seasons || []).map((sn) => ({
    ...sn,
    episodes: (sn.episodes || []).slice().sort((a, b) => (a.order || a.number) - (b.order || b.number)),
  })).sort((a, b) => (a.order || a.number) - (b.order || b.number));
  return series;
}

export async function getSeriesById(id) {
  const db = await getAll();
  return db.series.find((s) => s.id === id) || null;
}

async function validateSeries(input, existing = null) {
  const errors = {};
  const merged = existing ? { ...existing, ...input } : input;
  const title = String(merged.title || '').trim();
  if (!title) errors.title = 'العنوان العربي مطلوب.';
  let slug = String(merged.slug || '').trim();
  if (!slug) slug = slugify(title || String(merged.titleOriginal || ''));
  if (!slug) errors.slug = 'لا يمكن توليد slug من العنوان.';
  else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 120) errors.slug = 'slug غير صالح.';
  const db = await getAll();
  const dup = db.series.find((s) => s.slug === slug && s.id !== existing?.id);
  if (dup) errors.slug = 'slug مستخدم بالفعل.';
  const yearRaw = merged.year;
  const year = yearRaw !== null && yearRaw !== undefined && yearRaw !== '' ? Number(yearRaw) : null;
  if (yearRaw !== null && yearRaw !== undefined && yearRaw !== '' && (isNaN(year) || year < 1900 || year > 2100)) errors.year = 'سنة غير صالحة.';
  return { errors, slug, year };
}

export async function createSeries(input, actor = {}) {
  const { errors, slug, year } = await validateSeries(input);
  if (Object.keys(errors).length) return { ok: false, errors };
  const series = {
    id: uid('series'),
    slug,
    kind: 'series',
    title: String(input.title || '').trim(),
    titleOriginal: String(input.titleOriginal || '').trim(),
    synopsis: String(input.synopsis || '').trim(),
    synopsisEn: String(input.synopsisEn || '').trim(),
    body: String(input.body || '').trim(),
    year,
    releaseDate: String(input.releaseDate || '').trim() || null,
    genres: Array.isArray(input.genres) ? input.genres.filter(Boolean) : [],
    country: String(input.country || '').trim(),
    language: String(input.language || '').trim(),
    runtime: input.runtime ? Number(input.runtime) : null,
    ageRating: String(input.ageRating || '').trim(),
    status: String(input.status || 'ongoing').trim(),
    poster: String(input.poster || '').trim(),
    posterAlt: String(input.posterAlt || '').trim(),
    posterAltEn: String(input.posterAltEn || '').trim(),
    posterTemporary: !!input.posterTemporary,
    posterDesign: !!input.posterDesign,
    backdrop: String(input.backdrop || '').trim(),
    directors: Array.isArray(input.directors) ? input.directors.filter(Boolean) : [],
    cast: Array.isArray(input.cast) ? input.cast.filter(Boolean) : [],
    trailer: input.trailer || null,
    watch: Array.isArray(input.watch) ? input.watch.filter((w) => w && w.url) : [],
    featured: !!input.featured,
    draft: input.draft !== false,
    archived: !!input.archived,
    homepage: input.homepage !== false,
    seoTitle: String(input.seoTitle || '').trim() || String(input.title || '').trim(),
    seoTitleEn: String(input.seoTitleEn || '').trim(),
    seoDescription: String(input.seoDescription || '').trim(),
    seoDescriptionEn: String(input.seoDescriptionEn || '').trim(),
    canonical: String(input.canonical || '').trim(),
    heading: String(input.heading || '').trim() || String(input.title || '').trim(),
    headingEn: String(input.headingEn || '').trim(),
    addedAt: nowIso().slice(0, 10),
    updatedAt: nowIso(),
    order: Number(input.order) || 0,
    seasons: [],
    source: 'admin',
  };
  return mutate((db) => {
    if (db.series.some((s) => s.slug === series.slug)) return { ok: false, errors: { slug: 'slug مستخدم بالفعل.' } };
    db.series.push(series);
    db.auditLog.push({
      id: uid('log'),
      actorId: actor.id || null,
      actorName: actor.name || 'system',
      action: 'series.create',
      target: `series:${series.slug}`,
      targetId: series.id,
      at: nowIso(),
    });
    if (db.auditLog.length > 500) db.auditLog = db.auditLog.slice(-500);
    return { ok: true, series };
  });
}

export async function updateSeries(id, input, actor = {}) {
  const existing = await getSeriesById(id);
  if (!existing) return { ok: false, errors: { _: 'المسلسل غير موجود.' } };
  const { errors, slug, year } = await validateSeries(input, existing);
  if (Object.keys(errors).length) return { ok: false, errors };
  const updated = {
    ...existing,
    slug,
    title: String(input.title || existing.title).trim(),
    titleOriginal: String(input.titleOriginal ?? existing.titleOriginal).trim(),
    synopsis: String(input.synopsis ?? existing.synopsis).trim(),
    synopsisEn: String(input.synopsisEn ?? existing.synopsisEn).trim(),
    body: String(input.body ?? existing.body).trim(),
    year,
    releaseDate: String(input.releaseDate ?? existing.releaseDate ?? '').trim() || null,
    genres: Array.isArray(input.genres) ? input.genres.filter(Boolean) : existing.genres,
    country: String(input.country ?? existing.country).trim(),
    language: String(input.language ?? existing.language).trim(),
    runtime: input.runtime !== undefined ? (input.runtime ? Number(input.runtime) : null) : existing.runtime,
    ageRating: String(input.ageRating ?? existing.ageRating).trim(),
    status: String((input.status ?? existing.status) || 'ongoing').trim(),
    poster: String(input.poster ?? existing.poster).trim(),
    posterAlt: String(input.posterAlt ?? existing.posterAlt).trim(),
    posterAltEn: String(input.posterAltEn ?? existing.posterAltEn).trim(),
    posterTemporary: !!input.posterTemporary,
    posterDesign: !!input.posterDesign,
    backdrop: String(input.backdrop ?? existing.backdrop).trim(),
    directors: Array.isArray(input.directors) ? input.directors.filter(Boolean) : existing.directors,
    cast: Array.isArray(input.cast) ? input.cast.filter(Boolean) : existing.cast,
    trailer: input.trailer !== undefined ? (input.trailer || null) : existing.trailer,
    watch: Array.isArray(input.watch) ? input.watch.filter((w) => w && w.url) : existing.watch,
    featured: input.featured !== undefined ? !!input.featured : existing.featured,
    draft: input.draft !== undefined ? !!input.draft : existing.draft,
    archived: input.archived !== undefined ? !!input.archived : existing.archived,
    homepage: input.homepage !== undefined ? !!input.homepage : existing.homepage,
    seoTitle: String(input.seoTitle ?? existing.seoTitle).trim() || String(input.title || existing.title).trim(),
    seoTitleEn: String(input.seoTitleEn ?? existing.seoTitleEn).trim(),
    seoDescription: String(input.seoDescription ?? existing.seoDescription).trim(),
    seoDescriptionEn: String(input.seoDescriptionEn ?? existing.seoDescriptionEn).trim(),
    canonical: String(input.canonical ?? existing.canonical).trim(),
    heading: String(input.heading ?? existing.heading).trim() || String(input.title || existing.title).trim(),
    headingEn: String(input.headingEn ?? existing.headingEn).trim(),
    order: input.order !== undefined ? Number(input.order) || 0 : existing.order,
    updatedAt: nowIso(),
  };
  await mutate((db) => {
    const idx = db.series.findIndex((s) => s.id === id);
    if (idx >= 0) {
      // الحفاظ على المواسم (نعدّلها عبر دوال منفصلة)
      updated.seasons = existing.seasons || [];
      db.series[idx] = updated;
      db.auditLog.push({
        id: uid('log'),
        actorId: actor.id || null,
        actorName: actor.name || 'system',
        action: 'series.update',
        target: `series:${updated.slug}`,
        targetId: updated.id,
        at: nowIso(),
      });
      if (db.auditLog.length > 500) db.auditLog = db.auditLog.slice(-500);
    }
  });
  return { ok: true, series: updated };
}

export async function deleteSeries(id, actor = {}) {
  const existing = await getSeriesById(id);
  if (!existing) return { ok: false, error: 'المسلسل غير موجود.' };
  await mutate((db) => {
    db.series = db.series.filter((s) => s.id !== id);
    db.auditLog.push({
      id: uid('log'),
      actorId: actor.id || null,
      actorName: actor.name || 'system',
      action: 'series.delete',
      target: `series:${existing.slug}`,
      targetId: existing.id,
      at: nowIso(),
    });
    if (db.auditLog.length > 500) db.auditLog = db.auditLog.slice(-500);
  });
  return { ok: true };
}

// ---- المواسم ----
export async function addSeason(seriesId, input, actor = {}) {
  const existing = await getSeriesById(seriesId);
  if (!existing) return { ok: false, error: 'المسلسل غير موجود.' };
  const number = Number(input.number) || ((existing.seasons?.length || 0) + 1);
  const season = {
    id: uid('season'),
    number,
    title: String(input.title || `الموسم ${number}`).trim(),
    titleOriginal: String(input.titleOriginal || `Season ${number}`).trim(),
    year: input.year ? Number(input.year) : null,
    episodes: [],
    draft: !!input.draft,
    order: Number(input.order) || number,
  };
  let added;
  await mutate((db) => {
    const s = db.series.find((x) => x.id === seriesId);
    if (!s.seasons) s.seasons = [];
    s.seasons.push(season);
    s.updatedAt = nowIso();
    added = season;
    db.auditLog.push({
      id: uid('log'),
      actorId: actor.id || null,
      actorName: actor.name || 'system',
      action: 'season.create',
      target: `series:${s.slug}/season:${number}`,
      targetId: season.id,
      at: nowIso(),
    });
  });
  return { ok: true, season: added };
}

export async function updateSeason(seriesId, seasonId, input, actor = {}) {
  let updated;
  await mutate((db) => {
    const s = db.series.find((x) => x.id === seriesId);
    if (!s || !s.seasons) throw new Error('المسلسل غير موجود.');
    const sn = s.seasons.find((x) => x.id === seasonId);
    if (!sn) throw new Error('الموسم غير موجود.');
    Object.assign(sn, {
      number: input.number !== undefined ? Number(input.number) : sn.number,
      title: String(input.title ?? sn.title).trim(),
      titleOriginal: String(input.titleOriginal ?? sn.titleOriginal).trim(),
      year: input.year !== undefined ? (input.year ? Number(input.year) : null) : sn.year,
      draft: input.draft !== undefined ? !!input.draft : sn.draft,
      order: input.order !== undefined ? Number(input.order) || sn.number : sn.order,
    });
    s.updatedAt = nowIso();
    updated = sn;
    db.auditLog.push({
      id: uid('log'),
      actorId: actor.id || null,
      actorName: actor.name || 'system',
      action: 'season.update',
      target: `series:${s.slug}/season:${sn.number}`,
      targetId: sn.id,
      at: nowIso(),
    });
  });
  return { ok: true, season: updated };
}

export async function deleteSeason(seriesId, seasonId, actor = {}) {
  await mutate((db) => {
    const s = db.series.find((x) => x.id === seriesId);
    if (!s || !s.seasons) return;
    const sn = s.seasons.find((x) => x.id === seasonId);
    if (!sn) return;
    s.seasons = s.seasons.filter((x) => x.id !== seasonId);
    s.updatedAt = nowIso();
    db.auditLog.push({
      id: uid('log'),
      actorId: actor.id || null,
      actorName: actor.name || 'system',
      action: 'season.delete',
      target: `series:${s.slug}/season:${sn.number}`,
      targetId: seasonId,
      at: nowIso(),
    });
  });
  return { ok: true };
}

// ---- الحلقات ----
export async function addEpisode(seriesId, seasonId, input, actor = {}) {
  let ep;
  await mutate((db) => {
    const s = db.series.find((x) => x.id === seriesId);
    if (!s || !s.seasons) throw new Error('المسلسل غير موجود.');
    const sn = s.seasons.find((x) => x.id === seasonId);
    if (!sn) throw new Error('الموسم غير موجود.');
    if (!sn.episodes) sn.episodes = [];
    const nextNumber = sn.episodes.length > 0 ? Math.max(...sn.episodes.map((e) => e.number)) + 1 : 1;
    const number = Number(input.number) || nextNumber;
    const embedUrl = String(input.embedUrl || '').trim();
    if (embedUrl && !isSafeEmbedUrl(embedUrl)) throw new Error('رابط التضمين غير صالح.');
    ep = {
      id: uid('ep'),
      number,
      title: String(input.title || `حلقة ${number}`).trim(),
      titleOriginal: String(input.titleOriginal || `Episode ${number}`).trim(),
      description: String(input.description || '').trim(),
      thumbnail: String(input.thumbnail || '').trim(),
      runtime: input.runtime ? Number(input.runtime) : null,
      airDate: String(input.airDate || '').trim() || null,
      embedUrl,
      embeds: Array.isArray(input.embeds) ? input.embeds.filter((e) => e && e.url) : [],
      draft: !!input.draft,
      order: Number(input.order) || number,
    };
    sn.episodes.push(ep);
    s.updatedAt = nowIso();
    db.auditLog.push({
      id: uid('log'),
      actorId: actor.id || null,
      actorName: actor.name || 'system',
      action: 'episode.create',
      target: `series:${s.slug}/s${sn.number}/e${number}`,
      targetId: ep.id,
      at: nowIso(),
    });
  });
  return { ok: true, episode: ep };
}

export async function updateEpisode(seriesId, seasonId, episodeId, input, actor = {}) {
  let updated;
  await mutate((db) => {
    const s = db.series.find((x) => x.id === seriesId);
    if (!s || !s.seasons) throw new Error('المسلسل غير موجود.');
    const sn = s.seasons.find((x) => x.id === seasonId);
    if (!sn || !sn.episodes) throw new Error('الموسم غير موجود.');
    const ep = sn.episodes.find((x) => x.id === episodeId);
    if (!ep) throw new Error('الحلقة غير موجودة.');
    const embedUrl = input.embedUrl !== undefined ? String(input.embedUrl || '').trim() : ep.embedUrl;
    if (embedUrl && !isSafeEmbedUrl(embedUrl)) throw new Error('رابط التضمين غير صالح.');
    Object.assign(ep, {
      number: input.number !== undefined ? Number(input.number) : ep.number,
      title: String(input.title ?? ep.title).trim(),
      titleOriginal: String(input.titleOriginal ?? ep.titleOriginal).trim(),
      description: String(input.description ?? ep.description).trim(),
      thumbnail: String(input.thumbnail ?? ep.thumbnail).trim(),
      runtime: input.runtime !== undefined ? (input.runtime ? Number(input.runtime) : null) : ep.runtime,
      airDate: input.airDate !== undefined ? (String(input.airDate || '').trim() || null) : ep.airDate,
      embedUrl,
      embeds: Array.isArray(input.embeds) ? input.embeds.filter((e) => e && e.url) : ep.embeds,
      draft: input.draft !== undefined ? !!input.draft : ep.draft,
      order: input.order !== undefined ? Number(input.order) || ep.number : ep.order,
    });
    s.updatedAt = nowIso();
    updated = ep;
    db.auditLog.push({
      id: uid('log'),
      actorId: actor.id || null,
      actorName: actor.name || 'system',
      action: 'episode.update',
      target: `series:${s.slug}/s${sn.number}/e${ep.number}`,
      targetId: ep.id,
      at: nowIso(),
    });
  });
  return { ok: true, episode: updated };
}

export async function deleteEpisode(seriesId, seasonId, episodeId, actor = {}) {
  await mutate((db) => {
    const s = db.series.find((x) => x.id === seriesId);
    if (!s || !s.seasons) return;
    const sn = s.seasons.find((x) => x.id === seasonId);
    if (!sn || !sn.episodes) return;
    const ep = sn.episodes.find((x) => x.id === episodeId);
    if (!ep) return;
    sn.episodes = sn.episodes.filter((x) => x.id !== episodeId);
    s.updatedAt = nowIso();
    db.auditLog.push({
      id: uid('log'),
      actorId: actor.id || null,
      actorName: actor.name || 'system',
      action: 'episode.delete',
      target: `series:${s.slug}/s${sn.number}/e${ep.number}`,
      targetId: episodeId,
      at: nowIso(),
    });
  });
  return { ok: true };
}

export async function reorderEpisodes(seriesId, seasonId, orderedIds, actor = {}) {
  await mutate((db) => {
    const s = db.series.find((x) => x.id === seriesId);
    if (!s || !s.seasons) return;
    const sn = s.seasons.find((x) => x.id === seasonId);
    if (!sn || !sn.episodes) return;
    orderedIds.forEach((id, idx) => {
      const ep = sn.episodes.find((e) => e.id === id);
      if (ep) ep.order = idx + 1;
    });
    s.updatedAt = nowIso();
    db.auditLog.push({
      id: uid('log'),
      actorId: actor.id || null,
      actorName: actor.name || 'system',
      action: 'episodes.reorder',
      target: `series:${s.slug}/s${sn.number}`,
      at: nowIso(),
    });
  });
  return { ok: true };
}

// ============================================================================
//  الإحصائيات
// ============================================================================
export async function getStats() {
  const db = await getAll();
  const movies = db.movies;
  const series = db.series;
  let seasons = 0;
  let episodesManaged = 0; // الحلقات المُدارة فعليًا عبر لوحة التحكم (التي لها سجلات)
  let episodesMissingEmbed = 0;
  let placeholders = 0; // الحلقات المعلن عنها في markdown بدون تفاصيل
  for (const s of series) {
    for (const sn of s.seasons || []) {
      seasons++;
      const epList = Array.isArray(sn.episodes) ? sn.episodes : [];
      const declaredCount = Number(sn.episodesCount) || 0;
      for (const ep of epList) {
        episodesManaged++;
        if (!ep.embedUrl && (!ep.embeds || ep.embeds.length === 0)) episodesMissingEmbed++;
      }
      if (declaredCount > epList.length) placeholders += declaredCount - epList.length;
    }
  }
  const publishedMovies = movies.filter((m) => !m.draft && !m.archived).length;
  const publishedSeries = series.filter((s) => !s.draft && !s.archived).length;
  const draftMovies = movies.filter((m) => m.draft).length;
  const draftSeries = series.filter((s) => s.draft).length;
  const missingPoster = [...movies, ...series].filter((w) => !w.draft && !w.poster).length;
  const moviesMissingEmbed = movies.filter((m) => !m.draft && !m.embedUrl && (!m.embeds || m.embeds.length === 0)).length;
  const allWorks = [...movies, ...series];
  const recent = allWorks
    .slice()
    .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
    .slice(0, 8)
    .map((w) => ({
      id: w.id,
      title: w.title,
      slug: w.slug,
      kind: w.kind,
      updatedAt: w.updatedAt,
      poster: w.poster,
      draft: w.draft,
    }));
  const added = allWorks
    .slice()
    .sort((a, b) => (b.addedAt || '').localeCompare(a.addedAt || ''))
    .slice(0, 8)
    .map((w) => ({ id: w.id, title: w.title, slug: w.slug, kind: w.kind, addedAt: w.addedAt, poster: w.poster }));
  return {
    totalMovies: movies.length,
    totalSeries: series.length,
    totalSeasons: seasons,
    totalEpisodesManaged: episodesManaged,
    totalEpisodesPlaceholder: placeholders,
    totalEpisodes: episodesManaged + placeholders,
    publishedMovies,
    publishedSeries,
    draftMovies,
    draftSeries,
    missingPoster,
    moviesMissingEmbed,
    episodesMissingEmbed,
    missingEmbed: moviesMissingEmbed + episodesMissingEmbed,
    featured: allWorks.filter((w) => w.featured && !w.draft).length,
    archived: allWorks.filter((w) => w.archived).length,
    recent,
    added,
  };
}

export async function getAuditLog({ limit = 50 } = {}) {
  const db = await getAll();
  return db.auditLog.slice().sort((a, b) => (b.at || '').localeCompare(a.at || '')).slice(0, limit);
}

// ============================================================================
//  إعدادات الموقع
// ============================================================================
export async function getSiteSettings() {
  const db = await getAll();
  return db.siteSettings || {};
}

export async function updateSiteSettings(input, actor = {}) {
  await mutate((db) => {
    db.siteSettings = { ...(db.siteSettings || {}), ...input, updatedAt: nowIso() };
    db.auditLog.push({
      id: uid('log'),
      actorId: actor.id || null,
      actorName: actor.name || 'system',
      action: 'settings.update',
      target: 'site',
      at: nowIso(),
    });
  });
  return { ok: true };
}

// ============================================================================
//  المصادقة
// ============================================================================
const SESSION_DURATION_MS = 1000 * 60 * 60 * 12; // 12 ساعة

function hashPassword(plain) {
  return bcrypt.hashSync(plain, 10);
}

function verifyPassword(plain, hash) {
  try { return bcrypt.compareSync(plain, hash); } catch { return false; }
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

export async function setupInitialAdmin({ username, password, name }) {
  if (!username || !password) return { ok: false, error: 'اسم المستخدم وكلمة المرور مطلوبان.' };
  if (password.length < 8) return { ok: false, error: 'يجب أن تكون كلمة المرور 8 أحرف على الأقل.' };
  const user = {
    id: uid('user'),
    username: String(username).trim().toLowerCase(),
    name: String(name || 'Administrator').trim(),
    passwordHash: hashPassword(password),
    role: 'admin',
    createdAt: nowIso(),
  };
  return mutate((db) => {
    // This check must be INSIDE the lock/CAS; two concurrent setup requests
    // must never create two administrators.
    if (db.users.length) return { ok: false, error: 'سبق وأن أُنشئ مدير. لا يمكن استخدام الإعداد الأولي مجددًا.' };
    db.users.push(user);
    db.auditLog.push({
      id: uid('log'),
      actorId: user.id,
      actorName: user.name,
      action: 'admin.setup',
      target: 'self',
      at: nowIso(),
    });
    return { ok: true, user: { id: user.id, username: user.username, name: user.name } };
  });
}

export async function hasAdmin() {
  const db = await getAll();
  return db.users.some((u) => u.role === 'admin');
}

export async function login({ username, password }) {
  const db = await getAll();
  const u = username ? db.users.find((x) => x.username === String(username).trim().toLowerCase()) : null;
  if (!u || !verifyPassword(String(password || ''), u.passwordHash)) {
    return { ok: false, error: 'بيانات الدخول غير صحيحة.' };
  }
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();
  return mutate((db) => {
    const current = db.users.find((x) => x.id === u.id);
    if (!current || current.passwordHash !== u.passwordHash) return { ok: false, error: 'بيانات الدخول غير صحيحة.' };
    db.sessions = db.sessions.filter((s) => s.userId !== u.id);
    db.sessions.push({ id: uid('sess'), token, userId: u.id, createdAt: nowIso(), expiresAt });
    return {
      ok: true,
      token,
      expiresAt,
      user: { id: u.id, username: u.username, name: u.name, role: u.role },
    };
  });
}

export async function logout(token) {
  if (!token) return { ok: true };
  await mutate((db) => {
    db.sessions = db.sessions.filter((s) => s.token !== token);
  });
  return { ok: true };
}

export async function getSession(token) {
  if (!token) return null;
  const db = await getAll();
  const sess = db.sessions.find((s) => s.token === token);
  if (!sess) return null;
  if (!Number.isFinite(new Date(sess.expiresAt).getTime()) || new Date(sess.expiresAt).getTime() < Date.now()) return null;
  const user = db.users.find((u) => u.id === sess.userId);
  if (!user) return null;
  return {
    token,
    user: { id: user.id, username: user.username, name: user.name, role: user.role },
    expiresAt: sess.expiresAt,
  };
}

export async function changePassword(userId, currentPassword, newPassword) {
  const db = await getAll();
  const u = db.users.find((x) => x.id === userId);
  if (!u) return { ok: false, error: 'المستخدم غير موجود.' };
  if (!verifyPassword(String(currentPassword || ''), u.passwordHash)) {
    return { ok: false, error: 'كلمة المرور الحالية غير صحيحة.' };
  }
  if (!newPassword || newPassword.length < 8) {
    return { ok: false, error: 'كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل.' };
  }
  const newHash = hashPassword(newPassword);
  return mutate((db) => {
    const user = db.users.find((x) => x.id === userId);
    if (!user || user.passwordHash !== u.passwordHash) return { ok: false, error: 'انتهت صلاحية الجلسة. سجّل الدخول مجددًا.' };
    user.passwordHash = newHash;
    db.sessions = db.sessions.filter((s) => s.userId !== userId);
    db.auditLog.push({
      id: uid('log'),
      actorId: userId,
      actorName: u.name,
      action: 'admin.password-change',
      target: 'self',
      at: nowIso(),
    });
    return { ok: true };
  });
}

// ============================================================================
//  التحقق من رابط التضمين
// ============================================================================
/**
 * القائمة الآمنة لنطاقات التضمين.
 * نبني على النطاقات المسموح بها للتريلر في site.config.mjs، ونوسّعها
 * لتشمل نطاقات التضمين الشائعة الرسمية التي يمكن التحقق منها.
 *
 * ملاحظة أمنية مهمة: لن نسمح ببروتوكولات خطرة (javascript:، data:، vbscript:).
 * كما لن نجلب عناوين عشوائية من الخادم (منع SSRF).
 */
const ALLOWED_EMBED_HOSTS = [
  'youtube.com', 'www.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com', 'youtu.be',
  'player.vimeo.com', 'vimeo.com', 'www.vimeo.com',
  'www.google.com',
  'drive.google.com',
  'ok.ru', 'www.ok.ru',
  'vk.com', 'www.vk.com', 'vkvideo.ru', 'www.vkvideo.ru',
  'player.vkvideo.ru',
  'www.dailymotion.com', 'dailymotion.com', 'geo.dailymotion.com',
  'streamable.com',
  'player.vimeo.com',
  'www.imdb.com', 'imdb.com',
];

export function isSafeEmbedUrl(url) {
  if (!url || typeof url !== 'string') return false;
  let u;
  try { u = new URL(String(url).trim()); } catch { return false; }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return false;
  // رفض أي مخططات خطرة صراحة
  if (/^(javascript|data|vbscript|file|ftp):/i.test(u.protocol)) return false;
  const host = u.hostname.toLowerCase();
  return ALLOWED_EMBED_HOSTS.includes(host);
}

export const EMBED_ALLOWED_HOSTS = ALLOWED_EMBED_HOSTS;
