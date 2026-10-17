import { redirect } from 'next/navigation';
import { adminPageSession } from '@/lib/admin-page.mjs';
import AdminUnavailable from '@/components/AdminUnavailable.jsx';
import { GENRES } from '@/lib/i18n.mjs';
import WorkForm from '../../WorkForm.jsx';

export const dynamic = 'force-dynamic';

export default async function NewMoviePage() {
  const { session, error } = await adminPageSession();
  if (error) return <AdminUnavailable message={error} />;
  if (!session) redirect('/admin/login');
  return <WorkForm kind="movie" genres={Object.entries(GENRES).map(([k, v]) => ({ key: k, ar: v.ar, en: v.en }))} />;
}
