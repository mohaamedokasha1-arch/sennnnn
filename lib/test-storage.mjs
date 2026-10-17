#!/usr/bin/env node
/** No external services: exercises local, read-only, corrupt and mocked Redis modes. */
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { buildIndex } from './search.mjs';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'akasha-storage-test-'));
const originalEnv = Object.fromEntries(['AKASHA_DATA_DIR', 'AKASHA_READ_ONLY', 'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN', 'KV_REST_API_URL', 'KV_REST_API_TOKEN', 'VERCEL'].map((k) => [k, process.env[k]]));
const originalFetch = globalThis.fetch;
process.env.AKASHA_DATA_DIR = dir;
delete process.env.AKASHA_READ_ONLY;
delete process.env.UPSTASH_REDIS_REST_URL;
delete process.env.UPSTASH_REDIS_REST_TOKEN;
delete process.env.KV_REST_API_URL;
delete process.env.KV_REST_API_TOKEN;
delete process.env.VERCEL;

try {
  const db = await import('./db.mjs');
  const catalog = await import('./public-data.mjs');
  const file = path.join(dir, 'akasha-db.json');

  assert.equal(db.getStorageStatus().mode, 'file');
  assert.equal((await db.getAll()).movies.length, 67);
  assert.equal((await catalog.getMovies()).length, 67);
  assert.equal(fs.existsSync(file), false, 'GET requests must never write a database file');

  // Parallel first-run requests may not create two administrators.
  const setup = await Promise.all([
    db.setupInitialAdmin({ username: 'first', password: 'secure-pass-1' }),
    db.setupInitialAdmin({ username: 'second', password: 'secure-pass-2' }),
  ]);
  assert.deepEqual(setup.map((r) => r.ok).sort(), [false, true]);
  assert.equal((await db.getAll()).users.length, 1);
  const account = setup.find((r) => r.ok).user;
  const password = account.username === 'first' ? 'secure-pass-1' : 'secure-pass-2';
  assert.equal((await db.login({ username: account.username, password: 'wrong' })).ok, false);
  const session = await db.login({ username: account.username, password });
  assert.equal(session.ok, true);
  assert.equal((await db.getSession(session.token)).user.username, account.username);

  const created = await db.createMovie({ title: 'فيلم اختبار', slug: 'storage-test-film', genres: ['drama'], year: 2026, draft: false });
  assert.equal(created.ok, true);
  assert.equal((await db.createMovie({ title: 'مكرر', slug: 'storage-test-film' })).ok, false);
  catalog.invalidateCache();
  assert.equal((await catalog.getWork('movie', 'storage-test-film')).title, 'فيلم اختبار');
  assert.ok(buildIndex(await catalog.getWorks()).works.some((w) => w.url === '/movies/storage-test-film/'));
  assert.equal((await db.deleteMovie(created.movie.id)).ok, true);
  catalog.invalidateCache();
  assert.equal(await catalog.getWork('movie', 'storage-test-film'), null);

  const corrupted = '{"users":null,"movies":[]}';
  fs.writeFileSync(file, corrupted);
  const originalError = console.error;
  console.error = () => {};
  try {
    await assert.rejects(db.hasAdmin(), (err) => err.statusCode === 503);
    catalog.invalidateCache();
    assert.equal((await catalog.getMovies()).length, 67, 'Markdown must survive a corrupt DB');
    assert.equal(fs.readFileSync(file, 'utf8'), corrupted, 'never overwrite a corrupt admin store');

    process.env.AKASHA_READ_ONLY = '1';
    assert.equal(db.getStorageStatus().available, false);
    await assert.rejects(db.getAll(), (err) => err.statusCode === 503);
    catalog.invalidateCache();
    assert.equal((await catalog.getWork('series', 'game-of-thrones')).titleOriginal, 'Game of Thrones');
    assert.equal(fs.readFileSync(file, 'utf8'), corrupted);
    delete process.env.AKASHA_READ_ONLY;
  } finally { console.error = originalError; }

  // A Vercel-compatible Redis REST mock. It checks the SHA1 compare-and-set
  // protocol and forces real concurrent setup requests to retry after a conflict.
  process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example.test';
  process.env.UPSTASH_REDIS_REST_TOKEN = 'only-for-this-mock';
  process.env.VERCEL = '1';
  const redis = new Map();
  globalThis.fetch = async (url, options) => {
    assert.equal(url, process.env.UPSTASH_REDIS_REST_URL);
    assert.equal(options.headers.Authorization, 'Bearer only-for-this-mock');
    const parts = JSON.parse(options.body);
    const [command] = parts;
    let result;
    if (command === 'GET') result = redis.get(parts[1]) ?? null;
    else if (command === 'EVAL') {
      assert.match(parts[1], /redis\.sha1hex/);
      const [, , , key, expected, next] = parts;
      const previous = redis.get(key);
      const hash = previous === undefined ? '' : crypto.createHash('sha1').update(previous).digest('hex');
      result = hash === expected ? 1 : 0;
      if (result) redis.set(key, next);
    } else assert.fail(`Unexpected Redis command ${command}`);
    return new Response(JSON.stringify({ result }), { headers: { 'Content-Type': 'application/json' } });
  };

  assert.equal(db.getStorageStatus().mode, 'redis');
  assert.equal((await db.getAll()).series.length, 100);
  const remoteSetup = await Promise.all([
    db.setupInitialAdmin({ username: 'cloud1', password: 'secure-cloud-1' }),
    db.setupInitialAdmin({ username: 'cloud2', password: 'secure-cloud-2' }),
  ]);
  assert.deepEqual(remoteSetup.map((r) => r.ok).sort(), [false, true]);
  assert.equal((await db.getAll()).users.length, 1);
  const cloudUser = remoteSetup.find((r) => r.ok).user;
  const cloudPassword = cloudUser.username === 'cloud1' ? 'secure-cloud-1' : 'secure-cloud-2';
  const cloudSession = await db.login({ username: cloudUser.username, password: cloudPassword });
  assert.equal((await db.getSession(cloudSession.token)).user.username, cloudUser.username);

  const cloudMovie = await db.createMovie({ title: 'فيلم سحابي', slug: 'cloud-test-film', genres: ['drama'], draft: false });
  assert.equal(cloudMovie.ok, true);
  catalog.invalidateCache();
  assert.equal((await catalog.getWork('movie', 'cloud-test-film')).slug, 'cloud-test-film');
  assert.ok(buildIndex(await catalog.getWorks()).works.some((w) => w.url === '/movies/cloud-test-film/'));
  assert.equal((await db.listMovies()).total, 68);

  // Simulate an outage: published Markdown remains available, but the admin
  // storage fails closed (not an empty store that would reopen setup).
  globalThis.fetch = async () => { throw new Error('temporary outage'); };
  console.error = () => {};
  try {
    await assert.rejects(db.hasAdmin(), (err) => err.statusCode === 503);
    catalog.invalidateCache();
    assert.equal((await catalog.getMovies()).length, 67);
    assert.equal((await catalog.publicDataStatus()).unavailable, true);
    assert.equal(await catalog.getWork('movie', 'cloud-test-film'), null);
  } finally { console.error = originalError; }

  console.log('✅ Storage: local read-only reads, first admin race, CRUD/search, corrupt DB, Vercel fallback, Redis CAS/outage.');
} finally {
  globalThis.fetch = originalFetch;
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  fs.rmSync(dir, { recursive: true, force: true });
}
