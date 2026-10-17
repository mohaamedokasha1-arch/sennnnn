/**
 * ============================================================================
 *  طبقة البيانات — أكاشا سينما
 * ============================================================================
 *  قاعدة بيانات ملفات JSON خفيفة (بدون تبعيات خارجية) تدعم:
 *   - الاستيراد التلقائي من ملفات Markdown في content/ عند أول تشغيل.
 *   - عمليات CRUD كاملة للأفلام والمسلسلات (بالمواسم والحلقات).
 *   - التصنيفات وإعدادات الموقع والمستخدمين وسجل التدقيق.
 *   - قفل بسيط لمنع تعارض الكتابة المتزامنة.
 *   - حفظ ذري (write to temp + rename) لمنع تلف البيانات.
 *
 *  لماذا JSON وليس SQLite؟
 *  - لا يتطلب ترجمة وحدات native في بيئة Vercel.
 *  - يمكن تبديله بسهولة لاحقًا إلى Turso / Vercel Postgres / KV عبر تعديل هذا الملف فقط.
 *  - في بيئة Vercel، سيحتاج المستخدم لتركيب حل تخزين دائم (مثل Vercel Blob/KV) أو
 *    استخدام وضع التزامن مع Git (نقترح ذلك في تقرير النشر).
 * ============================================================================
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, '.data');
const DB_FILE = path.join(DATA_DIR, 'akasha-db.json');
const LOCK_FILE = path.join(DATA_DIR, '.lock');
const LOCK_TIMEOUT_MS = 5000;

// ============================================================================
//  قفل بسيط للكتابة (لا يمنع كل سباقات التسابق في بيئة serverless، ولكنه كافٍ
//  لبيئة تطوير واحدة؛ في serverless نستبدلها بمعاملات قاعدة بيانات حقيقية).
// ============================================================================
function acquireLock() {
  const start = Date.now();
  while (fs.existsSync(LOCK_FILE)) {
    const age = Date.now() - Number(fs.readFileSync(LOCK_FILE, 'utf8') || '0');
    if (age > LOCK_TIMEOUT_MS) {
      try { fs.unlinkSync(LOCK_FILE); } catch {}
      break;
    }
    if (Date.now() - start > LOCK_TIMEOUT_MS) {
      throw new Error('لم نتمكن من الحصول على قفل الكتابة خلال 5 ثوانٍ.');
    }
    // انتظار قصير
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 30);
  }
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(LOCK_FILE, String(Date.now()));
}

function releaseLock() {
  try { fs.unlinkSync(LOCK_FILE); } catch {}
}

// ============================================================================
//  القراءة والكتابة الذرية
// ============================================================================
function defaultDb() {
  return {
    _version: 1,
    _importedAt: null,
    movies: [],
    series: [],
    categories: [], // تصنيفات مخصصة (بالإضافة إلى الأنواع الثابتة)
    siteSettings: null,
    users: [],
    sessions: [],
    auditLog: [],
    // episodes & seasons مخزنة داخل series
  };
}

function readDb() {
  if (!fs.existsSync(DB_FILE)) return defaultDb();
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    // دمج أي حقول جديدة نضيفها لاحقًا
    return { ...defaultDb(), ...parsed };
  } catch (err) {
    console.error('❌ تعذر قراءة قاعدة البيانات:', err.message);
    // نسخة احتياطية
    const backup = DB_FILE + '.corrupt.' + Date.now() + '.bak';
    try { fs.copyFileSync(DB_FILE, backup); } catch {}
    return defaultDb();
  }
}

function writeDb(db) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2), 'utf8');
  fs.renameSync(tmp, DB_FILE); // ذرّية على أنظمة الملفات POSIX
}

function mutate(fn) {
  acquireLock();
  try {
    const db = readDb();
    const result = fn(db);
    writeDb(db);
    return result;
  } finally {
    releaseLock();
  }
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

// ============================================================================
//  الاستيراد من Markdown
// ============================================================================
function importFromMarkdown() {
  // نستورد من lib/content.mjs في وضع build-time.
  // نستخدم dynamic import لتجنّب مشاكل التبعيات.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  // نستورد الدوال مباشرة:
  // نجعل هذا الاستيراد اختياريًا حتى لا يفشل لو لم يتم إنشاء lib بعد.
  let loadRaw;
  try {
    // تحويل الملف إلى ديناميك لأنه ESM
    import('node:url');
  } catch {}
  // قراءة مباشرة من markdown باستخدام gray-matter
  const matter = require('gray-matter');
  const contentDir = path.join(ROOT, 'content');

  const readMarkdownFiles = (subDir) => {
    const dir = path.join(contentDir, subDir);
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir)
      .filter((f) => f.endsWith('.md'))
      .map((f) => {
        const slug = f.replace(/\.md$/, '');
        const raw = fs.readFileSync(path.join(dir, f), 'utf8');
        try {
          const { data, content: body } = matter(raw);
          return { slug, data, body };
        } catch (err) {
          console.error(`  ⚠️ خطأ في قراءة ${subDir}/${f}:`, err.message);
          return null;
        }
      })
      .filter(Boolean);
  };

  const movies = [];
  const series = [];

  for (const { slug, data, body } of readMarkdownFiles('movies')) {
    movies.push({
      id: uid('movie'),
      slug,
      kind: 'movie',
      title: data.title || slug,
      titleOriginal: data.titleOriginal || '',
      synopsis: data.synopsis || '',
      synopsisEn: data.synopsisEn || '',
      body: body || '',
      notesEn: data.notesEn || '',
      year: Number(data.year) || null,
      releaseDate: data.releaseDate || null,
      genres: Array.isArray(data.genres) ? data.genres : [],
      country: data.country || '',
      language: data.language || '',
      runtime: Number(data.runtime) || null,
      ageRating: data.ageRating || '',
      poster: data.poster || '',
      posterAlt: data.posterAlt || '',
      posterAltEn: data.posterAltEn || '',
      posterTemporary: !!data.posterTemporary,
      posterDesign: !!data.posterDesign,
      backdrop: data.backdrop || '',
      directors: Array.isArray(data.directors) ? data.directors : [],
      cast: Array.isArray(data.cast) ? data.cast : [],
      trailer: data.trailer || null,
      watch: Array.isArray(data.watch) ? data.watch : [],
      embedUrl: data.embedUrl || '', // رابط التضمين (إضافة للوحة التحكم)
      embeds: Array.isArray(data.embeds) ? data.embeds : [],
      featured: !!data.featured,
      draft: data.draft !== false,
      archived: !!data.archived,
      homepage: data.homepage !== false,
      seoTitle: data.seoTitle || data.title || '',
      seoTitleEn: data.seoTitleEn || '',
      seoDescription: data.seoDescription || '',
      seoDescriptionEn: data.seoDescriptionEn || '',
      canonical: data.canonical || '',
      heading: data.heading || data.title || '',
      headingEn: data.headingEn || '',
      addedAt: data.addedAt || nowIso().slice(0, 10),
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
        id: uid('season'),
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
      id: uid('series'),
      slug,
      kind: 'series',
      title: data.title || slug,
      titleOriginal: data.titleOriginal || '',
      synopsis: data.synopsis || '',
      synopsisEn: data.synopsisEn || '',
      body: body || '',
      year: Number(data.year) || null,
      releaseDate: data.releaseDate || null,
      genres: Array.isArray(data.genres) ? data.genres : [],
      country: data.country || '',
      language: data.language || '',
      runtime: Number(data.runtime) || null,
      ageRating: data.ageRating || '',
      status: data.status || 'ongoing',
      poster: data.poster || '',
      posterAlt: data.posterAlt || '',
      posterAltEn: data.posterAltEn || '',
      posterTemporary: !!data.posterTemporary,
      posterDesign: !!data.posterDesign,
      backdrop: data.backdrop || '',
      directors: Array.isArray(data.directors) ? data.directors : [],
      cast: Array.isArray(data.cast) ? data.cast : [],
      trailer: data.trailer || null,
      watch: Array.isArray(data.watch) ? data.watch : [],
      embedUrl: data.embedUrl || '',
      embeds: Array.isArray(data.embeds) ? data.embeds : [],
      featured: !!data.featured,
      draft: data.draft !== false,
      archived: !!data.archived,
      homepage: data.homepage !== false,
      seoTitle: data.seoTitle || data.title || '',
      seoTitleEn: data.seoTitleEn || '',
      seoDescription: data.seoDescription || '',
      seoDescriptionEn: data.seoDescriptionEn || '',
      canonical: data.canonical || '',
      heading: data.heading || data.title || '',
      headingEn: data.headingEn || '',
      addedAt: data.addedAt || nowIso().slice(0, 10),
      updatedAt: nowIso(),
      order: data.order || 0,
      seasons,
      source: 'markdown',
    });
  }

  return { movies, series };
}

function ensureImported() {
  const db = readDb();
  if (db._importedAt) return db;
  console.log('📥 استيراد المحتوى من ملفات Markdown لأول مرة...');
  const { movies, series } = importFromMarkdown();
  db.movies = movies;
  db.series = series;
  db._importedAt = nowIso();
  writeDb(db);
  console.log(`✅ تم استيراد ${movies.length} فيلم و ${series.length} مسلسل.`);
  return db;
}

// ============================================================================
//  التهيئة العامة
// ============================================================================
export function initDb() {
  return ensureImported();
}

// ============================================================================
//  واجهة القراءة العامة
// ============================================================================
export function getAll() {
  ensureImported();
  const db = readDb();
  return db;
}

// ============================================================================
//  الأفلام
// ============================================================================
export function listMovies({ draft = null, search = '', sort = 'newest', page = 1, perPage = 50, genre = '', featured = null, missingEmbed = false, missingPoster = false } = {}) {
  const db = getAll();
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

export function getMovieBySlug(slug, includeDraft = true) {
  const db = getAll();
  const m = db.movies.find((x) => x.slug === slug);
  if (!m) return null;
  if (!includeDraft && m.draft) return null;
  return m;
}

export function getMovieById(id) {
  const db = getAll();
  return db.movies.find((m) => m.id === id) || null;
}

function validateMovie(input, existing = null) {
  const errors = {};
  // في التعديل: ندمج القيم الحالية مع الجديدة حتى لا نُجبر إرسال كل الحقول.
  const merged = existing ? { ...existing, ...input } : input;
  const title = String(merged.title || '').trim();
  if (!title) errors.title = 'العنوان العربي مطلوب.';
  const titleOriginal = String(merged.titleOriginal || '').trim();
  let slug = String(merged.slug || '').trim();
  if (!slug) slug = slugify(title || titleOriginal);
  if (!slug) errors.slug = 'لا يمكن توليد slug من العنوان.';
  else if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]?$/.test(slug) && slug.length < 2) errors.slug = 'slug غير صالح.';
  const db = getAll();
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

export function createMovie(input, actor = {}) {
  const { errors, slug, year, runtime } = validateMovie(input);
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
  mutate((db) => {
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
  });
  return { ok: true, movie };
}

export function updateMovie(id, input, actor = {}) {
  const existing = getMovieById(id);
  if (!existing) return { ok: false, errors: { _: 'الفيلم غير موجود.' } };
  const { errors, slug, year, runtime } = validateMovie(input, existing);
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
  mutate((db) => {
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

export function deleteMovie(id, actor = {}) {
  const existing = getMovieById(id);
  if (!existing) return { ok: false, error: 'الفيلم غير موجود.' };
  mutate((db) => {
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

export function duplicateMovie(id, actor = {}) {
  const existing = getMovieById(id);
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
  mutate((db) => {
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
export function listSeries({ draft = null, search = '', sort = 'newest', page = 1, perPage = 50, genre = '', featured = null, missingEmbed = false, missingPoster = false } = {}) {
  const db = getAll();
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

export function getSeriesBySlug(slug, includeDraft = true) {
  const db = getAll();
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

export function getSeriesById(id) {
  const db = getAll();
  return db.series.find((s) => s.id === id) || null;
}

function validateSeries(input, existing = null) {
  const errors = {};
  const merged = existing ? { ...existing, ...input } : input;
  const title = String(merged.title || '').trim();
  if (!title) errors.title = 'العنوان العربي مطلوب.';
  let slug = String(merged.slug || '').trim();
  if (!slug) slug = slugify(title || String(merged.titleOriginal || ''));
  if (!slug) errors.slug = 'لا يمكن توليد slug من العنوان.';
  const db = getAll();
  const dup = db.series.find((s) => s.slug === slug && s.id !== existing?.id);
  if (dup) errors.slug = 'slug مستخدم بالفعل.';
  const yearRaw = merged.year;
  const year = yearRaw !== null && yearRaw !== undefined && yearRaw !== '' ? Number(yearRaw) : null;
  if (yearRaw !== null && yearRaw !== undefined && yearRaw !== '' && (isNaN(year) || year < 1900 || year > 2100)) errors.year = 'سنة غير صالحة.';
  return { errors, slug, year };
}

export function createSeries(input, actor = {}) {
  const { errors, slug, year } = validateSeries(input);
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
  mutate((db) => {
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
  });
  return { ok: true, series };
}

export function updateSeries(id, input, actor = {}) {
  const existing = getSeriesById(id);
  if (!existing) return { ok: false, errors: { _: 'المسلسل غير موجود.' } };
  const { errors, slug, year } = validateSeries(input, existing);
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
  mutate((db) => {
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

export function deleteSeries(id, actor = {}) {
  const existing = getSeriesById(id);
  if (!existing) return { ok: false, error: 'المسلسل غير موجود.' };
  mutate((db) => {
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
export function addSeason(seriesId, input, actor = {}) {
  const existing = getSeriesById(seriesId);
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
  mutate((db) => {
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

export function updateSeason(seriesId, seasonId, input, actor = {}) {
  let updated;
  mutate((db) => {
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

export function deleteSeason(seriesId, seasonId, actor = {}) {
  mutate((db) => {
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
export function addEpisode(seriesId, seasonId, input, actor = {}) {
  let ep;
  mutate((db) => {
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

export function updateEpisode(seriesId, seasonId, episodeId, input, actor = {}) {
  let updated;
  mutate((db) => {
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

export function deleteEpisode(seriesId, seasonId, episodeId, actor = {}) {
  mutate((db) => {
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

export function reorderEpisodes(seriesId, seasonId, orderedIds, actor = {}) {
  mutate((db) => {
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
export function getStats() {
  const db = getAll();
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

export function getAuditLog({ limit = 50 } = {}) {
  const db = getAll();
  return db.auditLog.slice().sort((a, b) => (b.at || '').localeCompare(a.at || '')).slice(0, limit);
}

// ============================================================================
//  إعدادات الموقع
// ============================================================================
export function getSiteSettings() {
  const db = getAll();
  return db.siteSettings || {};
}

export function updateSiteSettings(input, actor = {}) {
  mutate((db) => {
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
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const bcrypt = require('bcryptjs');
  return bcrypt.hashSync(plain, 10);
}

function verifyPassword(plain, hash) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const bcrypt = require('bcryptjs');
  try { return bcrypt.compareSync(plain, hash); } catch { return false; }
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

export function setupInitialAdmin({ username, password, name }) {
  const db = getAll();
  if (db.users.length > 0) {
    return { ok: false, error: 'سبق وأن أُنشئ مدير. لا يمكن استخدام الإعداد الأولي مجددًا.' };
  }
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
  mutate((db) => {
    db.users.push(user);
    db.auditLog.push({
      id: uid('log'),
      actorId: user.id,
      actorName: user.name,
      action: 'admin.setup',
      target: 'self',
      at: nowIso(),
    });
  });
  return { ok: true, user: { id: user.id, username: user.username, name: user.name } };
}

export function hasAdmin() {
  const db = getAll();
  return db.users.some((u) => u.role === 'admin');
}

export function login({ username, password }) {
  const db = getAll();
  const u = username ? db.users.find((x) => x.username === String(username).trim().toLowerCase()) : null;
  if (!u || !verifyPassword(String(password || ''), u.passwordHash)) {
    return { ok: false, error: 'بيانات الدخول غير صحيحة.' };
  }
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();
  mutate((db) => {
    // حذف الجلسات القديمة للمستخدم
    db.sessions = db.sessions.filter((s) => s.userId !== u.id);
    db.sessions.push({
      id: uid('sess'),
      token,
      userId: u.id,
      createdAt: nowIso(),
      expiresAt,
    });
  });
  return {
    ok: true,
    token,
    expiresAt,
    user: { id: u.id, username: u.username, name: u.name, role: u.role },
  };
}

export function logout(token) {
  if (!token) return { ok: true };
  mutate((db) => {
    db.sessions = db.sessions.filter((s) => s.token !== token);
  });
  return { ok: true };
}

export function getSession(token) {
  if (!token) return null;
  const db = getAll();
  const sess = db.sessions.find((s) => s.token === token);
  if (!sess) return null;
  if (new Date(sess.expiresAt).getTime() < Date.now()) {
    mutate((db) => {
      db.sessions = db.sessions.filter((s) => s.token !== token);
    });
    return null;
  }
  const user = db.users.find((u) => u.id === sess.userId);
  if (!user) return null;
  return {
    token,
    user: { id: user.id, username: user.username, name: user.name, role: user.role },
    expiresAt: sess.expiresAt,
  };
}

export function changePassword(userId, currentPassword, newPassword) {
  const db = getAll();
  const u = db.users.find((x) => x.id === userId);
  if (!u) return { ok: false, error: 'المستخدم غير موجود.' };
  if (!verifyPassword(String(currentPassword || ''), u.passwordHash)) {
    return { ok: false, error: 'كلمة المرور الحالية غير صحيحة.' };
  }
  if (!newPassword || newPassword.length < 8) {
    return { ok: false, error: 'كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل.' };
  }
  mutate((db) => {
    const user = db.users.find((x) => x.id === userId);
    if (user) user.passwordHash = hashPassword(newPassword);
    // إنهاء كل الجلسات بعد تغيير كلمة المرور
    db.sessions = db.sessions.filter((s) => s.userId !== userId);
    db.auditLog.push({
      id: uid('log'),
      actorId: userId,
      actorName: u.name,
      action: 'admin.password-change',
      target: 'self',
      at: nowIso(),
    });
  });
  return { ok: true };
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
