'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  async function handleLogout() {
    if (loading) return;
    setLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    router.push('/admin/login');
    router.refresh();
  }
  return (
    <button type="button" onClick={handleLogout} className="btn btn-ghost btn-sm" disabled={loading} style={{ width: '100%' }}>
      {loading ? 'جاري…' : 'تسجيل الخروج'}
    </button>
  );
}
