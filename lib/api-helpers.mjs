/**
 * مساعدات لطرق الـAPI: فك JSON + التحقق من صلاحيات المدير + ردود موحدة.
 */
import { NextResponse } from 'next/server';
import { requireAdmin } from './auth.mjs';
import { invalidateCache } from './public-data.mjs';

export async function parseBody(req) {
  try { return await req.json(); } catch { return {}; }
}

export function ok(data = {}) {
  invalidateCache();
  return NextResponse.json({ ok: true, ...data });
}

export function fail(error, status = 400, extra = {}) {
  return NextResponse.json({ error, ...extra }, { status });
}

export function withAdmin(handler) {
  return async (req, ctx) => {
    try {
      const session = await requireAdmin();
      if (!session) return fail('غير مصرح.', 401);
      return await handler(req, ctx, session);
    } catch (err) {
      if (err.statusCode) return fail(err.message, err.statusCode);
      console.error('API error:', err);
      return fail('خطأ داخلي في الخادم.', 500);
    }
  };
}
