import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getSession, hasAdmin } from '@/lib/db.mjs';
import LoginForm from '../LoginForm.jsx';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('akasha_session')?.value;
  const session = token ? getSession(token) : null;
  if (session) redirect('/admin');
  const needsSetup = !hasAdmin();
  if (needsSetup) redirect('/admin/setup');
  return (
    <>
      <h1>تسجيل الدخول</h1>
      <p>أدخل بيانات المدير للوصول إلى لوحة التحكم.</p>
      <LoginForm mode="login" />
    </>
  );
}
