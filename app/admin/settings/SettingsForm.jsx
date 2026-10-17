'use client';

import { useState, useEffect } from 'react';

export default function SettingsForm() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/admin/settings')
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok || !data.ok) throw new Error(data.error || 'تعذّر تحميل الإعدادات.');
        if (active) setSettings(data.settings || {});
      })
      .catch((err) => { if (active) { setLoadError(true); setMessage(err.message || 'تعذّر الاتصال بالخادم.'); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function save(e) {
    e.preventDefault();
    setSaving(true); setMessage('');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      setMessage(res.ok && data.ok ? 'تم الحفظ بنجاح.' : (data.error || 'فشل الحفظ.'));
    } catch {
      setMessage('تعذّر الاتصال بالخادم. لم تُحفظ التغييرات.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="empty-state">جاري التحميل…</div>;

  function update(field, value) { setSettings((s) => ({ ...s, [field]: value })); }

  return (
    <div>
      <h1>إعدادات الموقع</h1>
      <p className="muted" style={{ marginBottom: 20 }}>
        هذه الإعدادات تُحفظ في قاعدة البيانات وتتجاوز القيم الافتراضية عند تفعيلها.
      </p>
      {message ? <div className={`alert ${message.startsWith('تم') ? 'alert-success' : 'alert-error'}`}>{message}</div> : null}

      <form onSubmit={save}>
        <h2 style={{ fontSize: '1rem', margin: '20px 0 10px', color: 'var(--text-soft)' }}>الهوية</h2>
        <div className="form-grid">
          <div className="form-field">
            <label>اسم الموقع (عربي)</label>
            <input value={settings.siteName || ''} onChange={(e) => update('siteName', e.target.value)} />
          </div>
          <div className="form-field">
            <label>اسم الموقع (إنجليزي)</label>
            <input value={settings.siteNameLatin || ''} onChange={(e) => update('siteNameLatin', e.target.value)} dir="ltr" />
          </div>
          <div className="form-field">
            <label>الشعار (عربي)</label>
            <input value={settings.slogan || ''} onChange={(e) => update('slogan', e.target.value)} />
          </div>
          <div className="form-field">
            <label>الشعار (إنجليزي)</label>
            <input value={settings.sloganEn || ''} onChange={(e) => update('sloganEn', e.target.value)} />
          </div>
          <div className="form-field">
            <label>بريد التواصل</label>
            <input value={settings.contactEmail || ''} onChange={(e) => update('contactEmail', e.target.value)} dir="ltr" />
          </div>
        </div>

        <h2 style={{ fontSize: '1rem', margin: '24px 0 10px', color: 'var(--text-soft)' }}>الصفحة الرئيسية</h2>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <label className="form-field checkbox">
            <input type="checkbox" checked={settings.showFeatured !== false} onChange={(e) => update('showFeatured', e.target.checked)} />
            <span>إظهار قسم الأفلام المميزة</span>
          </label>
          <label className="form-field checkbox">
            <input type="checkbox" checked={settings.showLatest !== false} onChange={(e) => update('showLatest', e.target.checked)} />
            <span>إظهار قسم أحدث الإضافات</span>
          </label>
          <label className="form-field checkbox">
            <input type="checkbox" checked={!!settings.showTrailers} onChange={(e) => update('showTrailers', e.target.checked)} />
            <span>إظهار قسم التريلرات</span>
          </label>
        </div>

        <h2 style={{ fontSize: '1rem', margin: '24px 0 10px', color: 'var(--text-soft)' }}>رسالة إعلانية (اختياري)</h2>
        <div className="form-field">
          <label>نص الإعلان أعلى الصفحة</label>
          <textarea value={settings.announcement || ''} onChange={(e) => update('announcement', e.target.value)} rows={2} placeholder="سيظهر أعلى الصفحة في كل الصفحات." />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving || loadError}>
            {saving ? 'جاري الحفظ…' : 'حفظ الإعدادات'}
          </button>
        </div>
      </form>
    </div>
  );
}
