import { redirect } from 'next/navigation';
import Link from 'next/link';
import { requireAdmin } from '@/lib/auth.mjs';
import { listMovies } from '@/lib/db.mjs';
import MoviesClientPage from './MoviesClientPage.jsx';

export const dynamic = 'force-dynamic';

export default async function AdminMoviesPage({ searchParams }) {
  const session = await requireAdmin();
  if (!session) redirect('/admin/login');
  return <MoviesClientPage />;
}
