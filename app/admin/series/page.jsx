import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth.mjs';
import SeriesClientPage from './SeriesClientPage.jsx';

export const dynamic = 'force-dynamic';

export default async function AdminSeriesPage() {
  const session = await requireAdmin();
  if (!session) redirect('/admin/login');
  return <SeriesClientPage />;
}
