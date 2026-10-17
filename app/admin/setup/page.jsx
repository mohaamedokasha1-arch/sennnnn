import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getSession, hasAdmin } from '@/lib/db.mjs';
import LoginForm from '../LoginForm.jsx';

export const dynamic = 'force-dynamic';

export default async function SetupPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('akasha_session')?.value;
  const session = token ? getSession(token) : null;
  if (session) redirect('/admin');
  const needsSetup = !hasAdmin();
  if (!needsSetup) redirect('/admin/login');
  return (
    <>
      <h1>إعداد المدير الأول</h1>
      <p>لم يتم إنشاء حساب مدير بعد. أنشئ الحساب الأول لتفعيل لوحة التحكم.</p>
      <LoginForm mode="setup" />
    </>
  );
}
