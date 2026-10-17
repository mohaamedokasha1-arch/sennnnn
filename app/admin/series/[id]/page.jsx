import { redirect, notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth.mjs';
import { getSeriesById } from '@/lib/db.mjs';
import { GENRES } from '@/lib/i18n.mjs';
import SeriesEditor from './SeriesEditor.jsx';

export const dynamic = 'force-dynamic';

export default async function EditSeriesPage({ params }) {
  const session = await requireAdmin();
  if (!session) redirect('/admin/login');
  const { id } = await params;
  const series = getSeriesById(id);
  if (!series) notFound();
  return (
    <SeriesEditor
      series={series}
      genres={Object.entries(GENRES).map(([k, v]) => ({ key: k, ar: v.ar, en: v.en }))}
    />
  );
}
