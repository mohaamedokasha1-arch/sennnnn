import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getSession, hasAdmin, getStorageStatus, initDb } from '@/lib/db.mjs';
import { adminPageError } from '@/lib/admin-page.mjs';
import AdminUnavailable from '@/components/AdminUnavailable.jsx';
import LoginForm from '../LoginForm.jsx';

export const dynamic = 'force-dynamic';

const STORAGE_LABELS = {
  postgres: 'PostgreSQL (Neon / Vercel Postgres)',
  redis: 'Upstash Redis REST',
  file: 'ملف محلي (.data)',
};

export default async function SetupPage() {
  const storage = getStorageStatus();
  if (!storage.available) return <AdminUnavailable message={storage.message} />;

  // مزامنة السكيما/التهيئة تلقائيًا قبل عرض النموذج:
  // في وضع PostgreSQL يُنشئ الجداول إن لم توجد (CREATE TABLE IF NOT EXISTS)،
  // وفي بقية الأوضاع مجرد تحقق من الاتصال دون أي كتابة.
  let schemaReady = false;
  let session, needsSetup;
  try {
    await initDb();
    schemaReady = true;
    const cookieStore = await cookies();
    const token = cookieStore.get('akasha_session')?.value;
    session = token ? await getSession(token) : null;
    needsSetup = !(await hasAdmin());
  } catch (err) {
    return <AdminUnavailable message={adminPageError(err)} />;
  }
  if (session) redirect('/admin');
  if (!needsSetup) redirect('/admin/login');
  return (
    <>
      <h1>إعداد المدير الأول</h1>
      <p>لم يتم إنشاء حساب مدير بعد. أنشئ الحساب الأول لتفعيل لوحة التحكم.</p>
      <p className="muted small" data-storage-mode={storage.mode}>
        التخزين: {STORAGE_LABELS[storage.mode] || storage.mode}
        {schemaReady ? ' — تم الاتصال ومزامنة السكيما تلقائيًا ✓' : ''}
      </p>
      <LoginForm mode="setup" />
    </>
  );
}
