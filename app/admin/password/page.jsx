import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth.mjs';
import PasswordForm from './PasswordForm.jsx';

export const dynamic = 'force-dynamic';

export default async function PasswordPage() {
  const session = await requireAdmin();
  if (!session) redirect('/admin/login');
  return <PasswordForm />;
}
