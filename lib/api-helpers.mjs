/** Unified JSON responses, admin authorization, and recoverable storage errors. */
import { NextResponse } from 'next/server';
import { requireAdmin } from './auth.mjs';
import { getStorageStatus, StorageUnavailableError } from './db.mjs';
import { invalidateCache } from './public-data.mjs';

export async function parseBody(req) {
  try { return await req.json(); } catch { return {}; }
}

export function ok(data = {}) {
  return NextResponse.json({ ok: true, ...data });
}

export function fail(error, status = 400, extra = {}) {
  return NextResponse.json({ error, ...extra }, { status });
}

export function apiError(err) {
  if (err instanceof StorageUnavailableError || err?.statusCode === 503) {
    // Expected when Vercel has no durable store; keep logs useful without a stack per request.
    console.warn('Admin storage unavailable:', err.message);
    return fail(err.message, 503, { code: 'STORAGE_UNAVAILABLE' });
  }
  console.error('API error:', err);
  return fail('حدث خطأ مؤقت في الخادم. حاول مجددًا لاحقًا.', 500);
}

export function withAdmin(handler) {
  return async (req, ctx) => {
    try {
      const storage = getStorageStatus();
      if (!storage.available) throw new StorageUnavailableError(storage.message);
      const session = await requireAdmin();
      if (!session) return fail('غير مصرح.', 401);
      const response = await handler(req, ctx, session);
      if (req.method !== 'GET' && response.ok) invalidateCache();
      return response;
    } catch (err) {
      return apiError(err);
    }
  };
}
