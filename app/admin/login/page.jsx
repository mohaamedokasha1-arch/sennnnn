import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getSession, hasAdmin, getStorageStatus } from '@/lib/db.mjs';
import { adminPageError } from '@/lib/admin-page.mjs';
import AdminUnavailable from '@/components/AdminUnavailable.jsx';
import LoginForm from '../LoginForm.jsx';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const storage = getStorageStatus();
  if (!storage.available) return <AdminUnavailable message={storage.message} />;
  let session, needsSetup;
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('akasha_session')?.value;
    session = token ? await getSession(token) : null;
    needsSetup = !(await hasAdmin());
  } catch (err) {
    return <AdminUnavailable message={adminPageError(err)} />;
  }
  if (session) redirect('/admin');
  if (needsSetup) redirect('/admin/setup');
  return (
    <>
      <h1>تسجيل الدخول</h1>
      <p>أدخل بيانات المدير للوصول إلى لوحة التحكم.</p>
      <LoginForm mode="login" />
    </>
  );
}
