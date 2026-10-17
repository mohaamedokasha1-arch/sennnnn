import { redirect } from 'next/navigation';
import Link from 'next/link';
import { adminPageSession } from '@/lib/admin-page.mjs';
import AdminUnavailable from '@/components/AdminUnavailable.jsx';
import MoviesClientPage from './MoviesClientPage.jsx';

export const dynamic = 'force-dynamic';

export default async function AdminMoviesPage() {
  const { session, error } = await adminPageSession();
  if (error) return <AdminUnavailable message={error} />;
  if (!session) redirect('/admin/login');
  return <MoviesClientPage />;
}
