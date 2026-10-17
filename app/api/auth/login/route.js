import { login } from '@/lib/db.mjs';
import { setSessionCookie } from '@/lib/auth.mjs';
import { apiError, fail, ok } from '@/lib/api-helpers.mjs';

// Basic per-instance limit. For distributed protection use an external rate limiter.
const attempts = new Map();
const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 8;

export async function POST(req) {
  try {
    let body;
    try { body = await req.json(); } catch { return fail('طلب غير صالح.', 400); }
    const username = String(body?.username || '').trim().toLowerCase();
    const password = String(body?.password || '');
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const key = `${ip}:${username}`;
    const now = Date.now();
    const recent = (attempts.get(key) || []).filter((t) => now - t < WINDOW_MS);
    if (recent.length >= MAX_ATTEMPTS) return fail('محاولات كثيرة جدًا. حاول مجددًا بعد دقيقة.', 429);
    recent.push(now);
    attempts.set(key, recent);
    const res = await login({ username, password });
    if (!res.ok) return fail(res.error, 401);
    attempts.delete(key);
    await setSessionCookie(res.token, res.expiresAt);
    return ok({ user: res.user });
  } catch (err) {
    return apiError(err);
  }
}
