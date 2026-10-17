import { redirect } from 'next/navigation';
import { adminPageSession } from '@/lib/admin-page.mjs';
import AdminUnavailable from '@/components/AdminUnavailable.jsx';
import SettingsForm from './SettingsForm.jsx';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const { session, error } = await adminPageSession();
  if (error) return <AdminUnavailable message={error} />;
  if (!session) redirect('/admin/login');
  return <SettingsForm />;
}
