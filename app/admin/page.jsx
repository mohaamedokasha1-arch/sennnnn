import Link from 'next/link';
import { getStats, getAuditLog } from '@/lib/db.mjs';
import { adminPageSession, adminPageError } from '@/lib/admin-page.mjs';
import AdminUnavailable from '@/components/AdminUnavailable.jsx';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const { session, error } = await adminPageSession();
  if (error) return <AdminUnavailable message={error} />;
  if (!session) redirect('/admin/login');
  // التحقق من إعادة التوجيه
  void session;

  let stats, log;
  try {
    [stats, log] = await Promise.all([getStats(), getAuditLog({ limit: 15 })]);
  } catch (err) {
    return <AdminUnavailable message={adminPageError(err)} />;
  }

  return (
    <div>
      <h1>نظرة عامة</h1>

      <div className="admin-grid">
        <StatCard n={stats.totalMovies} l="إجمالي الأفلام" href="/admin/movies" />
        <StatCard n={stats.totalSeries} l="إجمالي المسلسلات" href="/admin/series" />
        <StatCard n={stats.totalSeasons} l="المواسم" />
        <StatCard n={stats.totalEpisodes} l="الحلقات" />
        <StatCard n={stats.publishedMovies} l="أفلام منشورة" />
        <StatCard n={stats.publishedSeries} l="مسلسلات منشورة" />
        <StatCard n={stats.draftMovies + stats.draftSeries} l="مسودات" tone="draft" />
        <StatCard n={stats.featured} l="مميزة" tone="accent" />
        <StatCard n={stats.missingPoster} l="بلا بوستر" tone="warn" />
        <StatCard n={stats.missingEmbed} l="بلا رابط تضمين" tone="warn" />
        <StatCard n={stats.archived} l="مؤرشفة" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <section className="panel" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 18 }}>
          <h2 style={{ margin: '0 0 14px', fontSize: '1.05rem' }}>المضافة مؤخرًا</h2>
          <table className="admin-table">
            <thead>
              <tr><th>العمل</th><th>النوع</th><th>التاريخ</th></tr>
            </thead>
            <tbody>
              {stats.added.slice(0, 7).map((w) => (
                <tr key={w.id}>
                  <td>
                    <Link href={w.kind === 'movie' ? `/admin/movies/${w.id}` : `/admin/series/${w.id}`} style={{ color: 'var(--text)', textDecoration: 'none' }}>
                      {w.title}
                    </Link>
                  </td>
                  <td className="muted small">{w.kind === 'movie' ? 'فيلم' : 'مسلسل'}</td>
                  <td className="muted small">{w.addedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="panel" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 18 }}>
          <h2 style={{ margin: '0 0 14px', fontSize: '1.05rem' }}>آخر التعديلات</h2>
          <table className="admin-table">
            <thead>
              <tr><th>الإجراء</th><th>العنصر</th><th>الوقت</th></tr>
            </thead>
            <tbody>
              {log.length === 0 ? (
                <tr><td colSpan={3} className="muted small">لا توجد نشاطات بعد.</td></tr>
              ) : log.map((l) => (
                <tr key={l.id}>
                  <td className="muted small" dir="ltr">{l.action}</td>
                  <td className="small" style={{ fontFamily: 'monospace', fontSize: 12 }}>{l.target}</td>
                  <td className="muted small" dir="ltr">{new Date(l.at).toLocaleString('ar-EG')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}

function StatCard({ n, l, href, tone }) {
  const cls = tone === 'draft' ? 'badge-draft' : tone === 'warn' ? 'badge-danger' : tone === 'accent' ? 'badge-accent' : '';
  return (
    <div className="stat-card">
      <div className="n">{n}</div>
      <div className="l">{l}{cls ? <span className={`badge ${cls}`} style={{ marginInlineStart: 8 }}></span> : null}</div>
      {href ? <Link href={href} className="small" style={{ color: 'var(--accent)', textDecoration: 'none', display: 'inline-block', marginTop: 8 }}>فتح ←</Link> : null}
    </div>
  );
}
