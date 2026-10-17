import { cookies } from 'next/headers';
import { getSession, hasAdmin, getStorageStatus } from '@/lib/db.mjs';
import AdminUnavailable from '@/components/AdminUnavailable.jsx';

export const dynamic = 'force-dynamic';

const COOKIE_NAME = 'akasha_session';

export default async function AdminLayout({ children }) {
  const storage = getStorageStatus();
  if (!storage.available) return <AdminUnavailable message={storage.message} />;

  let session;
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    session = token ? await getSession(token) : null;
    // Also check connectivity on the setup/login pages, before rendering a form.
    if (!session) await hasAdmin();
  } catch (err) {
    console.error('Admin layout could not read storage:', err);
    return <AdminUnavailable message={err.statusCode === 503 ? err.message : undefined} />;
  }

  if (!session) {
    return <div className="login-wrap"><div className="login-card">{children}</div></div>;
  }

  const { default: SidebarNav } = await import('./SidebarNav.jsx');
  return (
    <div className="admin-layout">
      <SidebarNav user={session.user} />
      <main className="admin-main">{children}</main>
    </div>
  );
}
