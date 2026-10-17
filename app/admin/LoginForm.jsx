'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginForm({ mode }) {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password) { setError('املأ الحقول المطلوبة.'); return; }
    if (password.length < 8) { setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل.'); return; }
    setLoading(true);
    try {
      const url = mode === 'setup' ? '/api/auth/setup' : '/api/auth/login';
      const payload = mode === 'setup' ? { username, password, name } : { username, password };
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) { setError(data.error || 'فشل تسجيل الدخول.'); return; }
      router.push('/admin');
      router.refresh();
    } catch (err) {
      setError('تعذّر الاتصال بالخادم.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {mode === 'setup' ? (
        <div className="form-field">
          <label>الاسم</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="مدير الموقع" autoFocus />
        </div>
      ) : null}
      <div className="form-field">
        <label>اسم المستخدم</label>
        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="admin" autoFocus dir="ltr" autoComplete="username" />
      </div>
      <div className="form-field">
        <label>كلمة المرور</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" dir="ltr" autoComplete={mode === 'setup' ? 'new-password' : 'current-password'} />
        <div className="muted small" style={{ marginTop: 4 }}>8 أحرف على الأقل.</div>
      </div>
      {error ? <div className="alert alert-error">{error}</div> : null}
      <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
        {loading ? 'جاري…' : mode === 'setup' ? 'إنشاء الحساب والدخول' : 'تسجيل الدخول'}
      </button>
    </form>
  );
}
