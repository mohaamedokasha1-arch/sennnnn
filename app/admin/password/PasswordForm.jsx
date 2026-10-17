'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PasswordForm() {
  const router = useRouter();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError(''); setMessage('');
    if (next.length < 8) { setError('كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل.'); return; }
    if (next !== confirm) { setError('كلمتا المرور غير متطابقتين.'); return; }
    setLoading(true);
    const res = await fetch('/api/admin/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: current, newPassword: next }),
    });
    const data = await res.json();
    setLoading(false);
    if (!data.ok) { setError(data.error || 'فشل التغيير.'); return; }
    setMessage('تم تغيير كلمة المرور بنجاح. سيتم تسجيل خروجك.');
    setTimeout(() => router.push('/admin/login'), 1200);
  }

  return (
    <div style={{ maxWidth: 520 }}>
      <h1>تغيير كلمة المرور</h1>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="form-field">
          <label>كلمة المرور الحالية</label>
          <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" dir="ltr" />
        </div>
        <div className="form-field">
          <label>كلمة المرور الجديدة (8+ أحرف)</label>
          <input type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" dir="ltr" />
        </div>
        <div className="form-field">
          <label>تأكيد الجديدة</label>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" dir="ltr" />
        </div>
        {error ? <div className="alert alert-error">{error}</div> : null}
        {message ? <div className="alert alert-success">{message}</div> : null}
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'جاري…' : 'تغيير كلمة المرور'}
        </button>
      </form>
    </div>
  );
}
