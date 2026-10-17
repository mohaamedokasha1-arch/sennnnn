import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth.mjs';
import SettingsForm from './SettingsForm.jsx';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const session = await requireAdmin();
  if (!session) redirect('/admin/login');
  return <SettingsForm />;
}
