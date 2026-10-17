import { setupInitialAdmin, hasAdmin, login } from '@/lib/db.mjs';
import { setSessionCookie } from '@/lib/auth.mjs';
import { apiError, fail, ok } from '@/lib/api-helpers.mjs';

export async function POST(req) {
  try {
    if (await hasAdmin()) return fail('سبق إعداد النظام.', 403);
    let body;
    try { body = await req.json(); } catch { return fail('طلب غير صالح.', 400); }
    const username = String(body?.username || '').trim();
    const password = String(body?.password || '');
    const name = String(body?.name || '').trim() || 'Administrator';
    if (!username || !password) return fail('اسم المستخدم وكلمة المرور مطلوبان.', 400);
    if (password.length < 8) return fail('كلمة المرور يجب أن تكون 8 أحرف على الأقل.', 400);
    const res = await setupInitialAdmin({ username, password, name });
    if (!res.ok) return fail(res.error, 403);
    const loginRes = await login({ username, password });
    if (!loginRes.ok) return fail('تم الإنشاء ولكن تعذّر تسجيل الدخول؛ حاول تسجيل الدخول يدويًا.', 503);
    await setSessionCookie(loginRes.token, loginRes.expiresAt);
    return ok({ user: loginRes.user });
  } catch (err) {
    return apiError(err);
  }
}
