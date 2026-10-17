import { redirect, notFound } from 'next/navigation';
import { adminPageSession, adminPageError } from '@/lib/admin-page.mjs';
import AdminUnavailable from '@/components/AdminUnavailable.jsx';
import { getMovieById } from '@/lib/db.mjs';
import { GENRES } from '@/lib/i18n.mjs';
import WorkForm from '../../WorkForm.jsx';

export const dynamic = 'force-dynamic';

export default async function EditMoviePage({ params }) {
  const { session, error } = await adminPageSession();
  if (error) return <AdminUnavailable message={error} />;
  if (!session) redirect('/admin/login');
  const { id } = await params;
  let movie;
  try { movie = await getMovieById(id); }
  catch (err) { return <AdminUnavailable message={adminPageError(err)} />; }
  if (!movie) notFound();
  return <WorkForm kind="movie" work={movie} genres={Object.entries(GENRES).map(([k, v]) => ({ key: k, ar: v.ar, en: v.en }))} />;
}
