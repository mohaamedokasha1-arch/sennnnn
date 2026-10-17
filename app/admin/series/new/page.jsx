import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth.mjs';
import { GENRES } from '@/lib/i18n.mjs';
import WorkForm from '../../WorkForm.jsx';

export const dynamic = 'force-dynamic';

export default async function NewSeriesPage() {
  const session = await requireAdmin();
  if (!session) redirect('/admin/login');
  return <WorkForm kind="series" genres={Object.entries(GENRES).map(([k, v]) => ({ key: k, ar: v.ar, en: v.en }))} />;
}
