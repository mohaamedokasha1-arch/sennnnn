import { redirect, notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth.mjs';
import { getMovieById } from '@/lib/db.mjs';
import { GENRES } from '@/lib/i18n.mjs';
import WorkForm from '../../WorkForm.jsx';

export const dynamic = 'force-dynamic';

export default async function EditMoviePage({ params }) {
  const session = await requireAdmin();
  if (!session) redirect('/admin/login');
  const { id } = await params;
  const movie = getMovieById(id);
  if (!movie) notFound();
  return <WorkForm kind="movie" work={movie} genres={Object.entries(GENRES).map(([k, v]) => ({ key: k, ar: v.ar, en: v.en }))} />;
}
