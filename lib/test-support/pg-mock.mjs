/**
 * محاكي حزمة pg للاختبارات فقط — مغلفّ حول PGlite (PostgreSQL فعلي في WASM).
 *
 * - Pool.connect() يحاكي جلسة Pool حقيقية: BEGIN عند الاستحواذ وCOMMIT عند
 *   release، مع قفل تسلسلي صارم (mutex) يحاكي تعدد العملاء دون تداخل
 *   المعاملات على اتصال PGlite الوحيد — فتبقى دلالات CAS قابلة للاختبار.
 * - pool.query() يمثل استعلامًا مباشرًا خارج أي معاملة.
 * - __setOutage/__reset/__rawQuery أدوات اختبار فقط.
 */
import { PGlite } from '@electric-sql/pglite';

let shared = new PGlite();
let outage = false;
let tail = Promise.resolve();

/** Mutex: resolves with the release function once the caller owns the queue. */
function acquireLock() {
  const previous = tail;
  let releaseLock;
  tail = new Promise((resolve) => { releaseLock = resolve; });
  return previous.then(() => releaseLock);
}

function normalizeResult(res) {
  return { rows: res?.rows ?? [], rowCount: res?.rowCount ?? res?.affectedRows ?? 0, command: res?.command };
}

function assertNoOutage() {
  if (outage) {
    const err = new Error('simulated outage');
    err.code = 'ETIMEDOUT';
    throw err;
  }
}

export class Pool {
  constructor(options = {}) {
    this.options = options;
  }

  async connect() {
    const releaseLock = await acquireLock();
    try {
      assertNoOutage();
      await shared.query('BEGIN');
    } catch (err) {
      releaseLock();
      throw err;
    }
    let released = false;
    let txEnded = false;
    return {
      query: async (text, params) => {
        const res = await shared.query(text, params);
        if (/^\s*(COMMIT|ROLLBACK)\b/i.test(text)) txEnded = true;
        return normalizeResult(res);
      },
      release: async () => {
        if (released) return;
        released = true;
        try {
          if (!txEnded) await shared.query('COMMIT');
        } catch { /* commit-after-end is harmless; mirror pg tolerance */ }
        releaseLock();
      },
    };
  }

  async query(text, params) {
    const releaseLock = await acquireLock();
    try {
      assertNoOutage();
      const res = await shared.query(text, params);
      return normalizeResult(res);
    } finally {
      releaseLock();
    }
  }

  async end() { /* nothing to close; PGlite lives for the whole test run */ }

  on() { /* engine registers an idle-error listener; keep it a no-op */ }
}

export const Client = Pool;
export default { Pool, Client };

// ============================ أدوات اختبار فقط ============================
export function __setOutage(value) { outage = value; }

export function __reset() {
  shared = new PGlite();
  outage = false;
  tail = Promise.resolve();
}

export async function __rawQuery(text, params) {
  const releaseLock = await acquireLock();
  try {
    const res = await shared.query(text, params);
    return normalizeResult(res);
  } finally {
    releaseLock();
  }
}
