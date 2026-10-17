import { redirect, notFound } from 'next/navigation';
import { adminPageSession, adminPageError } from '@/lib/admin-page.mjs';
import AdminUnavailable from '@/components/AdminUnavailable.jsx';
import { getSeriesById } from '@/lib/db.mjs';
import { GENRES } from '@/lib/i18n.mjs';
import SeriesEditor from './SeriesEditor.jsx';

export const dynamic = 'force-dynamic';

export default async function EditSeriesPage({ params }) {
  const { session, error } = await adminPageSession();
  if (error) return <AdminUnavailable message={error} />;
  if (!session) redirect('/admin/login');
  const { id } = await params;
  let series;
  try { series = await getSeriesById(id); }
  catch (err) { return <AdminUnavailable message={adminPageError(err)} />; }
  if (!series) notFound();
  return (
    <SeriesEditor
      series={series}
      genres={Object.entries(GENRES).map(([k, v]) => ({ key: k, ar: v.ar, en: v.en }))}
    />
  );
}
