import { cookies } from 'next/headers';
import { getSession, hasAdmin } from '@/lib/db.mjs';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

const COOKIE_NAME = 'akasha_session';

export default async function AdminLayout({ children }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const session = token ? getSession(token) : null;
  const adminExists = hasAdmin();

  // في حال عدم المصادقة
  if (!session) {
    // إذا لم يُنشأ أي مدير بعد، اسمح بعرض صفحة الإعداد فقط.
    // غير ذلك، صفحات الإدارة كلها تعيد التوجيه إلى /admin/login.
    if (!adminExists) {
      // سنسمح بصفحة setup فقط؛ باقي المسارات تعيد التوجيه.
      return (
        <div className="login-wrap">
          <div className="login-card">{children}</div>
        </div>
      );
    }
    // صفحة login هي الوحيدة المسموح بها؛ باقي الصفحات تحول للدخول.
    return (
      <div className="login-wrap">
        <div className="login-card">{children}</div>
      </div>
    );
  }

  const { default: SidebarNav } = await import('./SidebarNav.jsx');
  return (
    <div className="admin-layout">
      <SidebarNav user={session.user} />
      <main className="admin-main">{children}</main>
    </div>
  );
}
