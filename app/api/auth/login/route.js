import { NextResponse } from 'next/server';
import { login } from '@/lib/db.mjs';
import { setSessionCookie } from '@/lib/auth.mjs';

// حد بسيط لمحاولات تسجيل الدخول (في الذاكرة)
const attempts = new Map();
const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 8;

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 }); }
  const username = String(body?.username || '').trim().toLowerCase();
  const password = String(body?.password || '');
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const key = `${ip}:${username}`;
  const now = Date.now();
  const recent = (attempts.get(key) || []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_ATTEMPTS) {
    return NextResponse.json({ error: 'محاولات كثيرة جدًا. حاول مجددًا بعد دقيقة.' }, { status: 429 });
  }
  recent.push(now);
  attempts.set(key, recent);
  const res = login({ username, password });
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 401 });
  attempts.delete(key);
  await setSessionCookie(res.token, res.expiresAt);
  return NextResponse.json({ ok: true, user: res.user });
}
