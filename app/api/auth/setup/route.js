import { NextResponse } from 'next/server';
import { setupInitialAdmin, hasAdmin, login } from '@/lib/db.mjs';
import { setSessionCookie } from '@/lib/auth.mjs';

export async function POST(req) {
  if (hasAdmin()) {
    return NextResponse.json({ error: 'سبق إعداد النظام.' }, { status: 403 });
  }
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 }); }
  const username = String(body?.username || '').trim();
  const password = String(body?.password || '');
  const name = String(body?.name || '').trim() || 'Administrator';
  if (!username || !password) return NextResponse.json({ error: 'اسم المستخدم وكلمة المرور مطلوبان.' }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل.' }, { status: 400 });
  const res = setupInitialAdmin({ username, password, name });
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });
  const loginRes = login({ username, password });
  if (!loginRes.ok) return NextResponse.json({ error: 'تم الإنشاء ولكن تعذّر تسجيل الدخول.' }, { status: 500 });
  await setSessionCookie(loginRes.token, loginRes.expiresAt);
  return NextResponse.json({ ok: true, user: loginRes.user });
}
