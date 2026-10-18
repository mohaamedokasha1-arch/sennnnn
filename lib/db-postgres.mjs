/**
 * ============================================================================
 *  محرّك تخزين PostgreSQL — أكاشا سينما
 * ============================================================================
 *  يدعم Neon وVercel Postgres وأي PostgreSQL متاح برابط اتصال واحد.
 *
 *  - قبول مرن لروابط الاتصال: postgres:// و postgresql:// (مع أو بدون
 *    sslmode)، ومعالجتها بدل رفضها بخطأ "يلزم عنوان HTTPS" الخاطئ.
 *  - تشفير تلقائي: يُضاف sslmode=require إلى الرابط تلقائيًا لأي مضيف بعيد
 *    لا يحدّد وضع SSL صراحة، بدلالات libpq الحقيقية (تشفير دون التحقق من
 *    هوية الشهادة) حتى لا تفشل شهادات Neon/Vercel Postgres الوسيطة.
 *  - مزامنة السكيما تلقائيًا عند أول استخدام (CREATE TABLE IF NOT EXISTS
 *    مع جدول تتبّع ترقيات) — لا حاجة لأي خطوة migration يدوية.
 *  - كتابة ذرّية بأسلوب Compare-And-Swap (قفل استشاري + SELECT … FOR UPDATE)
 *    بنفس دلالات طبقة Redis، فلا يُنشئ طلبان متزامنان مديرين اثنين أبدًا.
 *  - أمان: لا تُطبع بيانات الاعتماد أو الرابط الكامل في السجلات أبدًا.
 * ============================================================================
 */
import crypto from 'node:crypto';

// ============================================================================
//  أخطاء التخزين (تُعاد تصديرها من db.mjs للتوافق مع بقية الوحدات)
// ============================================================================
export class StorageUnavailableError extends Error {
  constructor(message = 'تعذر الوصول إلى قاعدة البيانات. حاول مجددًا لاحقًا.') {
    super(message);
    this.name = 'StorageUnavailableError';
    this.statusCode = 503;
  }
}

/** أخطاء PG الشائعة → رسائل عربية مفيدة دون كشف أي أسرار. */
function pgErrorToMessage(err) {
  const code = err?.code || '';
  const message = String(err?.message || '');
  const unreachable = ['ENOTFOUND', 'EAI_AGAIN', 'ETIMEDOUT', 'ECONNREFUSED', 'ECONNRESET', '57P01'].includes(code) ||
    /connection (terminated|ended|timed?\s*out)|could not connect|getaddrinfo|network/i.test(message);
  if (unreachable) {
    return 'تعذر الاتصال بخادم قاعدة البيانات. تحقّق من رابط الاتصال (DATABASE_URL) ومن أن الخدمة تعمل، ثم أعد المحاولة.';
  }
  if (code === '28P01') return 'بيانات اعتماد PostgreSQL غير صحيحة (اسم المستخدم/كلمة المرور). راجع رابط الاتصال في Vercel.';
  if (code === '3D000') return 'قاعدة البيانات المذكورة في رابط الاتصال غير موجودة. تحقّق من اسم القاعدة في DATABASE_URL.';
  if (code === '28000') return 'رُفض الاتصال بقاعدة البيانات (صلاحيات غير كافية أو قاعدة مقفلة).';
  if (code === '53300') return 'وصل الاتصال إلى الحد الأقصى للخطة. استخدم رابط التجمع (pooled) أو أعد المحاولة بعد قليل.';
  return undefined; // الرسالة العامة الآمنة
}

function wrapPgError(err) {
  // Never log the connection string or credentials — only the driver error itself.
  console.error('Akasha Postgres storage error:', err?.code || '', String(err?.message || err).slice(0, 300));
  return new StorageUnavailableError(pgErrorToMessage(err));
}

// ============================================================================
//  اكتشاف رابط الاتصال + التحقق المرن + التطبيع
// ============================================================================
/** أسماء المتغيرات المدعومة بالأولوية (يكفي ضبط أحدها في Vercel). */
export const POSTGRES_URL_ENV_VARS = [
  'AKASHA_DATABASE_URL',   // صريح خاص بالمشروع (الأعلى أولوية)
  'DATABASE_URL',          // المعيار الشائع (Neon وغيره)
  'POSTGRES_URL',          // تكامل Vercel Postgres القديم (المجمّع)
  'POSTGRESQL_URL',
  'NEON_DATABASE_URL',
  'POSTGRES_URL_UNPOOLED', // Vercel Postgres (غير المجمّع)
  'POSTGRES_URL_NON_POOLING',
  'POSTGRES_PRISMA_URL',
  'POSTGRES_PRISMA_URL_UNPOOLED',
  'DATABASE_URL_UNPOOLED',
];

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);

/**
 * التطبيع والتحقق المرن من رابط PostgreSQL.
 * يعيد { url, sslmode, host, local } عند النجاح أو { error } برسالة إرشادية.
 */
export function normalizePostgresUrl(raw) {
  let s = String(raw ?? '').trim();
  // Vercel UI pastes sometimes keep surrounding quotes.
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }
  if (!s) return { error: 'رابط قاعدة البيانات فارغ. الصق رابط اتصال كاملًا يبدأ بـ postgres:// أو postgresql://.' };
  if (!/^postgres(ql)?:\/\//i.test(s)) {
    return { error: 'رابط قاعدة البيانات يجب أن يبدأ بـ postgres:// أو postgresql:// (مثال: postgresql://user:pass@host/db?sslmode=require).' };
  }
  let u;
  try { u = new URL(s); } catch { return { error: 'تعذّر تحليل رابط قاعدة البيانات. تأكد من نسخه كاملًا من لوحة المزوّد.' }; }
  if (!u.hostname) return { error: 'رابط قاعدة البيانات لا يحتوي مضيفًا (host). انسخ رابط الاتصال الكامل من المزوّد.' };

  const host = u.hostname.toLowerCase();
  const local = LOCAL_HOSTS.has(host) || host.endsWith('.localhost') || host.endsWith('.local');

  // تحديد وضع SSL: صريح من الرابط أولًا، وإلا فالافتراضي الآمن.
  let sslmode = (u.searchParams.get('sslmode') || '').toLowerCase();
  const hasSslParam = u.searchParams.has('ssl');
  const sslParam = (u.searchParams.get('ssl') || '').toLowerCase();
  if (!sslmode && hasSslParam) {
    // البارامتر القديم ssl=true/false (شائع في Supabase وغيره).
    if (['true', '1', 'require', ''].includes(sslParam)) sslmode = 'require';
    else if (['false', '0', 'disable'].includes(sslParam)) sslmode = 'disable';
  }
  if (!sslmode) sslmode = local ? 'disable' : 'require'; // بعيد ⟵ تشفير إلزامي تلقائي

  // نكتب sslmode في الرابط نفسه ليكون مرئيًا وقابلًا للتدقيق، ونمرره للتعريف.
  u.searchParams.set('sslmode', sslmode);
  return { url: u.toString(), sslmode, host: u.hostname, local };
}

/**
 * يستخرج رابط PostgreSQL من البيئة.
 * يعيد null إن لم يوجد، أو { error, source } إن وُجد لكنه غير صالح،
 * أو { url, sslmode, host, local, source } بعد التطبيع.
 *
 * "الفحص الذكي المرن": إذا لُصق رابط postgres:// في متغيرات Upstash/KV
 * (سبب رسالة "يلزم عنوان HTTPS" الخاطئة سابقًا) نستخدمه هنا كمخزن
 * PostgreSQL بدل رفضه — UPSTASH_REDIS_REST_TOKEN ليس مطلوبًا لهذا الوضع.
 */
export function postgresConfig(env = process.env) {
  for (const name of POSTGRES_URL_ENV_VARS) {
    const raw = env[name];
    if (!raw || !String(raw).trim()) continue;
    const norm = normalizePostgresUrl(raw);
    if (norm.error) return { error: `${name}: ${norm.error}`, source: name };
    return { ...norm, source: name };
  }
  // Fallback: a postgres:// URL pasted into the Redis variables is handled, not rejected.
  for (const name of ['UPSTASH_REDIS_REST_URL', 'KV_REST_API_URL']) {
    const raw = env[name];
    if (!raw) continue;
    const trimmed = String(raw).trim().replace(/^["']|["']$/g, '');
    if (!/^postgres(ql)?:\/\//i.test(trimmed)) continue;
    const norm = normalizePostgresUrl(trimmed);
    if (norm.error) return { error: `${name}: ${norm.error}`, source: name };
    return { ...norm, source: name };
  }
  return null;
}

// ============================================================================
//  خيار SSL — بدلالات libpq الحقيقية
// ============================================================================
/**
 * pg 8.11+ يفسّر sslmode=require من الرابط وكأنه verify-full (يتحقق من
 * الشهادة ويقد يرفض شهادات Neon/Vercel الوسيطة). نمرر ssl صراحةً:
 *   require/prefer/allow ⟵ تشفير دون تحقق هوية (نفس معنى require في libpq)
 *   verify-ca/verify-full ⟵ تشفير + تحقق كامل من الشهادة
 *   disable ⟵ بلا تشفير (تطوير محلي فقط)
 */
function pgSslOption(sslmode) {
  if (sslmode === 'disable') return false;
  if (sslmode === 'verify-ca' || sslmode === 'verify-full') return { rejectUnauthorized: true };
  return { rejectUnauthorized: false };
}

// ============================================================================
//  التجمع (Pool) — إنشاء مؤجّل + إعادة استخدام عبر الطلبات
// ============================================================================
let pgState = null; // { url, pool, schemaPromise }

function resetPgState() {
  const previous = pgState;
  pgState = null;
  if (previous?.pool) {
    previous.pool.end().catch(() => {}); // never block or throw on cleanup
  }
}

async function getPgPool() {
  const cfg = postgresConfig();
  if (!cfg || cfg.error) {
    throw new StorageUnavailableError('رابط PostgreSQL غير مضبوط أو غير صالح. اضبط DATABASE_URL ثم أعد المحاولة.');
  }
  if (pgState && pgState.url !== cfg.url) resetPgState(); // env changed (tests / redeploy)
  if (pgState) return pgState.pool;

  let pgModule;
  try {
    pgModule = await import('pg');
  } catch (err) {
    console.error('Akasha: pg driver failed to load:', err?.code || String(err?.message || err).slice(0, 200));
    throw new StorageUnavailableError('تعريف PostgreSQL (pg) غير مثبّت. شغّل npm install ثم أعد النشر.');
  }
  const Pool = pgModule.Pool ?? pgModule.default?.Pool;
  const pool = new Pool({
    connectionString: cfg.url,
    ssl: pgSslOption(cfg.sslmode),
    max: 5,                      // serverless-friendly: small per-instance cap
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 8_000,
    query_timeout: 12_000,
    allowExitOnIdle: true,       // lets serverless instances suspend cleanly
  });
  pool.on('error', (err) => console.error('Akasha Postgres idle client error:', err?.code || ''));
  pgState = { url: cfg.url, pool, schemaPromise: null };
  return pool;
}

/** للاختبارات: إسقاط أي تجمع/ذاكرة مُهيّأة مسبقًا (لا يُستخدم في الإنتاج). */
export function __resetPostgresEngine() {
  resetPgState();
}

// ============================================================================
//  مزامنة السكيما تلقائيًا (Migration/Setup)
// ============================================================================
const SCHEMA_MIGRATION_V1 = 'document store v1: akasha_storage(key, value jsonb)';

export async function ensurePostgresSchema() {
  await getPgPool();
  const state = pgState;
  if (!state) return; // reset mid-flight (env change); the next call re-syncs
  if (!state.schemaPromise) {
    state.schemaPromise = (async () => {
      const pool = state.pool;
      await pool.query(`CREATE TABLE IF NOT EXISTS akasha_storage (
        key        TEXT PRIMARY KEY,
        value      JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`);
      await pool.query(`CREATE TABLE IF NOT EXISTS akasha_schema_migrations (
        version     INTEGER PRIMARY KEY,
        description TEXT NOT NULL,
        applied_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      )`);
      await pool.query(
        `INSERT INTO akasha_schema_migrations (version, description)
         VALUES (1, $1) ON CONFLICT (version) DO NOTHING`,
        [SCHEMA_MIGRATION_V1],
      );
    })().catch((err) => {
      state.schemaPromise = null; // retry on the next request
      throw wrapPgError(err);
    });
  }
  return state.schemaPromise;
}

// ============================================================================
//  قراءة/كتابة المستند بأسلوب Compare-And-Swap (مطابق لدلالات طبقة Redis)
// ============================================================================

/** يقرأ نص المستند (JSONB→text القياسي) أو null إن لم يوجد. */
export async function postgresGet(key) {
  try {
    const pool = await getPgPool();
    await ensurePostgresSchema();
    const { rows } = await pool.query(
      'SELECT value::text AS value FROM akasha_storage WHERE key = $1',
      [key],
    );
    return rows.length ? rows[0].value : null;
  } catch (err) {
    if (err instanceof StorageUnavailableError) throw err;
    throw wrapPgError(err);
  }
}

/**
 * كتابة ذرّية مشروطة: تنجح فقط إذا ظل sha1 للمستند الحالي مساويًا expectedSha1
 * ('' عندما لا يوجد صف بعد). المعاملة كاملة: قفل استشاري للمفتاح + FOR UPDATE
 * لتسلسل المنافسين عبر كل مثيلات السيرفرلس، والعودة بـ false عند التعارض
 * ليعيد المنطق الأعلى المحاولة بمستند محدّث.
 */
export async function postgresSetCas(key, expectedSha1, nextJson) {
  let client;
  try {
    const pool = await getPgPool();
    await ensurePostgresSchema();
    client = await pool.connect();
    await client.query('BEGIN');
    // Serialize read-modify-write across all connections and instances.
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [key]);
    const { rows } = await client.query(
      'SELECT value::text AS value FROM akasha_storage WHERE key = $1 FOR UPDATE',
      [key],
    );
    const current = rows.length ? rows[0].value : null;
    const currentSha = current === null ? '' : crypto.createHash('sha1').update(current).digest('hex');
    if (currentSha !== expectedSha1) {
      await client.query('ROLLBACK');
      return false;
    }
    await client.query(
      `INSERT INTO akasha_storage (key, value, updated_at)
       VALUES ($1, $2::jsonb, now())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
      [key, nextJson],
    );
    await client.query('COMMIT');
    return true;
  } catch (err) {
    if (client) { try { await client.query('ROLLBACK'); } catch {} }
    if (err instanceof StorageUnavailableError) throw err;
    throw wrapPgError(err);
  } finally {
    if (client) client.release();
  }
}
