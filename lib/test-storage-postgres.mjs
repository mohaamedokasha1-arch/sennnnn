#!/usr/bin/env node
/**
 * اختبارات محرّك تخزين PostgreSQL (Neon / Vercel Postgres) بدون أي خدمة خارجية:
 * تعترض 'pg' بمحاكي PGlite (PostgreSQL فعلي) فتُنفَّذ تعليمات SQL الحقيقية.
 * يغطي: تطبيع روابط الاتصال وإضافة sslmode=require، الفحص المرن لرابط
 * postgres:// داخل متغيرات Upstash/KV، مزامنة السكيما التلقائية، سباق إنشاء
 * المدير الأول عبر CAS، CRUD كامل، فشل الاتصال المغلق (fail-closed)،
 * والوثوق بأن القراءات لا تكتب شيئًا.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { register } from 'node:module';

// يجب تسجيل الخطافات قبل استيراد طبقة التخزين (استيراد pg مؤجّل داخلها).
register('./test-support/pg-mock-hooks.mjs', import.meta.url);

const TRACKED_ENV = [
  'AKASHA_DATABASE_URL', 'DATABASE_URL', 'POSTGRES_URL', 'POSTGRESQL_URL', 'NEON_DATABASE_URL',
  'POSTGRES_URL_UNPOOLED', 'POSTGRES_URL_NON_POOLING', 'POSTGRES_PRISMA_URL',
  'POSTGRES_PRISMA_URL_UNPOOLED', 'DATABASE_URL_UNPOOLED', 'AKASHA_STORAGE_MODE',
  'AKASHA_DATA_DIR', 'AKASHA_READ_ONLY', 'AKASHA_PG_KEY', 'AKASHA_REDIS_KEY',
  'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN', 'KV_REST_API_URL', 'KV_REST_API_TOKEN', 'VERCEL',
];
const originalEnv = Object.fromEntries(TRACKED_ENV.map((k) => [k, process.env[k]]));
for (const key of TRACKED_ENV) delete process.env[key];

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'akasha-pg-test-'));
process.env.AKASHA_DATA_DIR = dir; // للتأكد أن وضع PostgreSQL لا يلمس القرص إطلاقًا
process.env.VERCEL = '1'; // وضع الإنتاج: لا تخزين ملفي، يجب أن يعمل PostgreSQL

try {
  const mock = await import('./test-support/pg-mock.mjs');
  const engine = await import('./db-postgres.mjs');
  const db = await import('./db.mjs');
  const catalog = await import('./public-data.mjs');
  const { normalizePostgresUrl } = engine;

  // ==========================================================================
  // 1) تطبيع روابط الاتصال: قبول postgres:// و postgresql:// وSSL تلقائي
  // ==========================================================================
  const neon = normalizePostgresUrl('postgres://user:pass@ep-cool-123.eu-central-1.aws.neon.tech/neondb');
  assert.equal(neon.sslmode, 'require');
  assert.match(neon.url, /sslmode=require/);
  assert.equal(neon.url.startsWith('postgres://user:pass@ep-cool-123'), true);

  const quoted = normalizePostgresUrl('"postgresql://user:pass@db.remote.example.com/prod"');
  assert.equal(quoted.sslmode, 'require');
  assert.match(quoted.url, /sslmode=require/);

  const local = normalizePostgresUrl('postgresql://postgres:postgres@localhost:5432/akasha');
  assert.equal(local.sslmode, 'disable'); // محلي: لا نفرض TLS (يمكن فرضه صراحة)
  assert.equal(normalizePostgresUrl('postgres://u:p@localhost/db?sslmode=require').sslmode, 'require');

  assert.equal(normalizePostgresUrl('postgres://u:p@h/db?sslmode=verify-full').sslmode, 'verify-full');
  assert.equal(normalizePostgresUrl('postgres://u:p@h/db?ssl=true').sslmode, 'require');
  assert.equal(normalizePostgresUrl('postgres://u:p@h/db?ssl=false').sslmode, 'disable');

  assert.ok(normalizePostgresUrl('mysql://user:pass@host/db').error, 'non-postgres scheme must be rejected with guidance');
  assert.ok(normalizePostgresUrl('postgres://').error, 'host-less URL must be rejected');
  assert.ok(normalizePostgresUrl('  ').error, 'empty URL must be rejected');
  const badScheme = normalizePostgresUrl('mysql://user:pass@host/db');
  assert.match(badScheme.error, /postgres:\/\//, 'error message must guide toward postgres:// URLs');

  // ==========================================================================
  // 2) الفحص الذكي المرن: رابط postgres:// في متغيرات Upstash/KV يُعالَج
  //    ولا يُرفض بخطأ "يلزم عنوان HTTPS" الخاطئ.
  // ==========================================================================
  process.env.UPSTASH_REDIS_REST_URL = 'postgresql://user:pass@ep-cool-456.ap-southeast-1.aws.neon.tech/neondb';
  let status = db.getStorageStatus();
  assert.equal(status.available, true);
  assert.equal(status.mode, 'postgres');

  process.env.KV_REST_API_URL = 'postgres://user:pass@ep-cool-786.ap-southeast-1.aws.neon.tech/neondb';
  delete process.env.UPSTASH_REDIS_REST_URL;
  status = db.getStorageStatus();
  assert.equal(status.mode, 'postgres');

  // رابط Upstash HTTPS سليم (+ رمز) يحتفظ بأولويته حفاظًا على النشرات القائمة.
  process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example.test';
  process.env.UPSTASH_REDIS_REST_TOKEN = 'token';
  status = db.getStorageStatus();
  assert.equal(status.mode, 'redis');
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  delete process.env.KV_REST_API_URL;

  // رابط غير صالح في DATABASE_URL ⟵ رسالة إرشادية عن postgres:// وليست HTTPS.
  process.env.DATABASE_URL = 'mysql://user:pass@host/db';
  status = db.getStorageStatus();
  assert.equal(status.available, false);
  assert.match(status.message, /postgres:\/\//);
  delete process.env.DATABASE_URL;

  // AKASHA_STORAGE_MODE=postgres دون رابط ⟵ رسالة إعداد واضحة.
  process.env.AKASHA_STORAGE_MODE = 'postgres';
  status = db.getStorageStatus();
  assert.equal(status.available, false);
  assert.match(status.message, /DATABASE_URL/);
  delete process.env.AKASHA_STORAGE_MODE;

  // ==========================================================================
  // 3) التكامل: سكيما تلقائية + بذر + سباق المدير الأول + CRUD + CAS
  // ==========================================================================
  process.env.DATABASE_URL = 'postgres://akasha:secret@ep-cool-123.eu-central-1.aws.neon.tech/neondb';
  status = db.getStorageStatus();
  assert.equal(status.available, true);
  assert.equal(status.mode, 'postgres');
  assert.match(engine.postgresConfig().url, /sslmode=require/);

  const seeded = await db.getAll(); // يزامن السكيما تلقائيًا ثم يقرأ البذرة
  assert.equal(seeded.movies.length, 67);
  assert.equal(seeded.series.length, 100);

  const tables = await mock.__rawQuery(
    `SELECT to_regclass('akasha_storage') AS s, to_regclass('akasha_schema_migrations') AS m`,
  );
  assert.notEqual(tables.rows[0].s, null, 'akasha_storage must be created automatically');
  assert.notEqual(tables.rows[0].m, null, 'akasha_schema_migrations must be created automatically');
  const migrations = await mock.__rawQuery('SELECT version FROM akasha_schema_migrations');
  assert.equal(migrations.rows.length, 1);
  assert.equal(migrations.rows[0].version, 1);

  // القراءات لا تكتب مستندًا ولا تلمس القرص (نفس ثابت وضع الملف).
  const beforeRows = await mock.__rawQuery('SELECT count(*)::int AS n FROM akasha_storage');
  assert.equal(beforeRows.rows[0].n, 0, 'reads must never create the document row');
  assert.equal(fs.readdirSync(dir).length, 0, 'postgres mode must never touch the local disk');

  // سباق الإعداد الأول: طلبان متزامنان ⟵ مدير واحد فقط (CAS + قفل استشاري).
  const setup = await Promise.all([
    db.setupInitialAdmin({ username: 'pgfirst', password: 'secure-pass-1' }),
    db.setupInitialAdmin({ username: 'pgsecond', password: 'secure-pass-2' }),
  ]);
  assert.deepEqual(setup.map((r) => r.ok).sort(), [false, true]);
  assert.equal((await db.getAll()).users.length, 1);
  const account = setup.find((r) => r.ok).user;
  const password = account.username === 'pgfirst' ? 'secure-pass-1' : 'secure-pass-2';

  assert.equal((await db.login({ username: account.username, password: 'wrong' })).ok, false);
  const session = await db.login({ username: account.username, password });
  assert.equal(session.ok, true);
  assert.equal((await db.getSession(session.token)).user.username, account.username);

  const created = await db.createMovie({ title: 'فيلم سحابي', slug: 'pg-test-film', genres: ['drama'], year: 2026, draft: false });
  assert.equal(created.ok, true);
  assert.equal((await db.createMovie({ title: 'مكرر', slug: 'pg-test-film' })).ok, false);
  catalog.invalidateCache();
  assert.equal((await catalog.getWork('movie', 'pg-test-film')).title, 'فيلم سحابي');
  assert.equal((await db.listMovies()).total, 68);
  assert.equal((await db.deleteMovie(created.movie.id)).ok, true);
  catalog.invalidateCache();
  assert.equal(await catalog.getWork('movie', 'pg-test-film'), null);

  // CAS مباشرة: بصمة قديمة ⟵ رفض دون تغيير المستند (تعارض يعاد محاولته أعلى).
  const stale = await engine.postgresSetCas('akasha:db:v1', 'deadbeef'.repeat(5), '{"users":[]}');
  assert.equal(stale, false);
  assert.equal((await db.getAll()).users.length, 1, 'stale CAS must never corrupt or reset the store');

  // ==========================================================================
  // 4) فشل مغلق (fail-closed): انقطاع ⟵ 503 وMarkdown يبقى، دون إعادة تهيئة
  // ==========================================================================
  mock.__setOutage(true);
  const originalError = console.error;
  console.error = () => {};
  try {
    await assert.rejects(db.hasAdmin(), (err) => err.statusCode === 503);
    catalog.invalidateCache();
    assert.equal((await catalog.getMovies()).length, 67, 'Markdown fallback must survive a Postgres outage');
    assert.equal((await catalog.publicDataStatus()).unavailable, true);
    mock.__setOutage(false);
    assert.equal((await db.getAll()).users.length, 1, 'recovery must keep the committed admin');
  } finally {
    console.error = originalError;
  }

  // مستند تالف ⟵ رفض مغلق بدل إعادة فتح صفحة الإعداد فوق بيانات موجودة.
  await mock.__rawQuery(
    `UPDATE akasha_storage SET value = '{"users":null,"movies":[]}'::jsonb WHERE key = 'akasha:db:v1'`,
  );
  console.error = () => {};
  try {
    await assert.rejects(db.hasAdmin(), (err) => err.statusCode === 503);
  } finally {
    console.error = originalError;
  }

  console.log('✅ Postgres storage: URL normalization + auto SSL, smart postgres:// fallback, auto schema sync, CAS admin race, CRUD, fail-closed outage.');
} finally {
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  fs.rmSync(dir, { recursive: true, force: true });
}
