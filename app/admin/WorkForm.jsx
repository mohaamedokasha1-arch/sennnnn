'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function WorkForm({ kind = 'movie', work = null, genres = [] }) {
  const isNew = !work;
  const router = useRouter();
  const [form, setForm] = useState(() => work ? { ...work } : {
    title: '',
    titleOriginal: '',
    slug: '',
    synopsis: '',
    synopsisEn: '',
    body: '',
    year: new Date().getFullYear(),
    releaseDate: '',
    genres: [],
    country: '',
    language: 'ar',
    runtime: '',
    ageRating: '',
    poster: '',
    posterAlt: '',
    backdrop: '',
    embedUrl: '',
    embeds: [],
    trailer: null,
    watch: [],
    featured: false,
    draft: true,
    archived: false,
    homepage: true,
    seoTitle: '',
    seoDescription: '',
    seoTitleEn: '',
    seoDescriptionEn: '',
    canonical: '',
    heading: '',
    headingEn: '',
    order: 0,
    // series fields
    status: 'ongoing',
    directors: [],
    cast: [],
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [newSource, setNewSource] = useState({ url: '', label: '' });

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function autoSlug() {
    if (form.slug) return;
    const base = form.titleOriginal || form.title;
    if (!base) return;
    const slug = String(base)
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s-]/gu, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 120);
    update('slug', slug);
  }

  function toggleGenre(key) {
    setForm((f) => ({
      ...f,
      genres: f.genres.includes(key) ? f.genres.filter((g) => g !== key) : [...f.genres, key],
    }));
  }

  function addSource() {
    if (!newSource.url) return;
    setForm((f) => ({ ...f, embeds: [...(f.embeds || []), { ...newSource }] }));
    setNewSource({ url: '', label: '' });
  }

  function removeSource(idx) {
    setForm((f) => ({ ...f, embeds: (f.embeds || []).filter((_, i) => i !== idx) }));
  }

  async function save(extra = {}, e) {
    if (e) e.preventDefault();
    setSaving(true); setErrors({}); setMessage('');
    const payload = { ...form, ...extra };
    // تنظيف الحقول
    if (payload.directors && typeof payload.directors === 'string') payload.directors = payload.directors.split(',').map(s => s.trim()).filter(Boolean);
    if (payload.cast && typeof payload.cast === 'string') payload.cast = payload.cast.split(',').map(s => s.trim()).filter(Boolean);
    if (payload.runtime === '') payload.runtime = null;
    if (payload.year === '' || payload.year === null) payload.year = null;
    try {
      const url = isNew ? `/api/admin/${kind}s` : `/api/admin/${kind}s/${work.id}`;
      const method = isNew ? 'POST' : 'PATCH';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrors(data.errors || { _: data.error || 'فشل الحفظ.' });
        if (data.error && !data.errors) setMessage(data.error);
      } else {
        const saved = data[kind];
        setMessage('تم الحفظ بنجاح.');
        if (isNew) router.push(`/admin/${kind}s/${saved.id}`);
        else router.refresh();
      }
    } catch (err) {
      setMessage('تعذّر الحفظ. تحقق من الاتصال.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!work) return;
    if (!confirm('هل أنت متأكد من حذف هذا العنصر نهائيًا؟')) return;
    const res = await fetch(`/api/admin/${kind}s/${work.id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!data.ok) { setMessage(data.error || 'فشل الحذف.'); return; }
    router.push(`/admin/${kind}s`);
    router.refresh();
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <Link href={`/admin/${kind}s`} className="btn btn-ghost btn-sm">← رجوع</Link>
        <h1 style={{ margin: 0 }}>{isNew ? (kind === 'movie' ? 'إضافة فيلم' : 'إضافة مسلسل') : form.title}</h1>
        {work ? (
          <Link href={`/${kind}s/${form.slug}/`} target="_blank" className="btn btn-ghost btn-sm">عرض الصفحة ↗</Link>
        ) : null}
      </div>

      {message ? <div className={`alert ${message.startsWith('تم') ? 'alert-success' : 'alert-error'}`}>{message}</div> : null}
      {errors._ ? <div className="alert alert-error">{errors._}</div> : null}

      <form onSubmit={(e) => save({}, e)}>
        <h2 style={{ fontSize: '1rem', margin: '20px 0 10px', color: 'var(--text-soft)' }}>البيانات الأساسية</h2>
        <div className="form-grid">
          <Field label="العنوان العربي *" error={errors.title}>
            <input value={form.title} onChange={(e) => update('title', e.target.value)} onBlur={autoSlug} />
          </Field>
          <Field label="العنوان الأصلي">
            <input value={form.titleOriginal} onChange={(e) => update('titleOriginal', e.target.value)} onBlur={autoSlug} dir="ltr" />
          </Field>
          <Field label="الـ slug *" error={errors.slug} hint="سيُستخدم في الرابط: /movies/<slug>/">
            <input value={form.slug} onChange={(e) => update('slug', e.target.value)} dir="ltr" />
          </Field>
          <Field label="السنة" error={errors.year}>
            <input type="number" value={form.year ?? ''} onChange={(e) => update('year', e.target.value)} />
          </Field>
          <Field label="تاريخ العرض">
            <input type="date" value={form.releaseDate || ''} onChange={(e) => update('releaseDate', e.target.value)} dir="ltr" />
          </Field>
          <Field label={kind === 'series' ? 'مدة الحلقة (دقيقة)' : 'مدة العرض (دقيقة)'} error={errors.runtime}>
            <input type="number" value={form.runtime ?? ''} onChange={(e) => update('runtime', e.target.value)} />
          </Field>
          <Field label="الدولة">
            <input value={form.country} onChange={(e) => update('country', e.target.value)} placeholder="US, EG, GB…" dir="ltr" />
          </Field>
          <Field label="اللغة">
            <input value={form.language} onChange={(e) => update('language', e.target.value)} placeholder="ar, en…" dir="ltr" />
          </Field>
          <Field label="التصنيف العمري">
            <input value={form.ageRating} onChange={(e) => update('ageRating', e.target.value)} placeholder="13+, 16+, 18+" dir="ltr" />
          </Field>
          <Field label="ترتيب العرض">
            <input type="number" value={form.order ?? 0} onChange={(e) => update('order', e.target.value)} />
          </Field>
        </div>

        {kind === 'series' ? (
          <Field label="حالة المسلسل">
            <select value={form.status || 'ongoing'} onChange={(e) => update('status', e.target.value)}>
              <option value="ongoing">مستمر</option>
              <option value="ended">منتهٍ</option>
              <option value="limited">محدود</option>
              <option value="upcoming">قادم</option>
              <option value="cancelled">مُلغى</option>
            </select>
          </Field>
        ) : null}

        <h2 style={{ fontSize: '1rem', margin: '24px 0 10px', color: 'var(--text-soft)' }}>القصة والوصف</h2>
        <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
          <Field label="ملخّص القصة (عربي)">
            <textarea value={form.synopsis} onChange={(e) => update('synopsis', e.target.value)} rows={4} />
          </Field>
          <Field label="ملخّص القصة (إنجليزي)">
            <textarea value={form.synopsisEn} onChange={(e) => update('synopsisEn', e.target.value)} rows={3} dir="ltr" />
          </Field>
          <Field label="محتوى إضافي (Markdown)">
            <textarea value={form.body} onChange={(e) => update('body', e.target.value)} rows={4} />
          </Field>
        </div>

        <h2 style={{ fontSize: '1rem', margin: '24px 0 10px', color: 'var(--text-soft)' }}>التصنيفات</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {genres.map((g) => {
            const on = form.genres.includes(g.key);
            return (
              <button
                type="button"
                key={g.key}
                onClick={() => toggleGenre(g.key)}
                className={`btn btn-sm ${on ? 'btn-accent' : 'btn-ghost'}`}
              >
                {g.ar}
              </button>
            );
          })}
        </div>

        <h2 style={{ fontSize: '1rem', margin: '24px 0 10px', color: 'var(--text-soft)' }}>الصور</h2>
        <div className="form-grid">
          <Field label="رابط البوستر (poster)" hint="ضع المسار داخل /public/ مثال /posters/filename.jpg">
            <input value={form.poster} onChange={(e) => update('poster', e.target.value)} dir="ltr" placeholder="/posters/…" />
            {form.poster ? <img src={form.poster} alt="" style={{ maxWidth: 100, marginTop: 8, borderRadius: 6 }} /> : null}
          </Field>
          <Field label="البديل النصي للبوستر">
            <input value={form.posterAlt} onChange={(e) => update('posterAlt', e.target.value)} />
          </Field>
          <Field label="صورة الخلفية (backdrop)">
            <input value={form.backdrop} onChange={(e) => update('backdrop', e.target.value)} dir="ltr" />
          </Field>
        </div>

        <h2 style={{ fontSize: '1rem', margin: '24px 0 10px', color: 'var(--text-soft)' }}>رابط التضمين / المشاهدة</h2>
        <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
          <Field label="رابط التضمين (Embed URL)" error={errors.embedUrl} hint="الرابط الرئيسي الذي سيُعرض داخل iframe في صفحة العمل. يجب أن يكون من نطاق مسموح (youtube, vimeo, …)">
            <input value={form.embedUrl} onChange={(e) => update('embedUrl', e.target.value)} dir="ltr" placeholder="https://www.youtube-nocookie.com/embed/…" />
          </Field>
          <div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-soft)', marginBottom: 8 }}>مصادر بديلة (اختياري)</div>
            {(form.embeds || []).map((src, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                <input readOnly value={src.label || 'مصدر'} style={{ maxWidth: 120, padding: '8px 10px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)' }} />
                <input readOnly value={src.url} style={{ flex: 1, padding: '8px 10px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', direction: 'ltr' }} />
                <button type="button" className="btn btn-danger btn-sm" onClick={() => removeSource(i)}>×</button>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <input placeholder="الاسم" value={newSource.label} onChange={(e) => setNewSource({ ...newSource, label: e.target.value })} style={{ maxWidth: 120 }} />
              <input placeholder="https://…" dir="ltr" value={newSource.url} onChange={(e) => setNewSource({ ...newSource, url: e.target.value })} style={{ flex: 1 }} />
              <button type="button" className="btn btn-ghost btn-sm" onClick={addSource}>إضافة</button>
            </div>
          </div>
        </div>

        <h2 style={{ fontSize: '1rem', margin: '24px 0 10px', color: 'var(--text-soft)' }}>بيانات SEO</h2>
        <div className="form-grid">
          <Field label="عنوان SEO">
            <input value={form.seoTitle} onChange={(e) => update('seoTitle', e.target.value)} />
          </Field>
          <Field label="وصف SEO">
            <input value={form.seoDescription} onChange={(e) => update('seoDescription', e.target.value)} />
          </Field>
          <Field label="Canonical URL">
            <input value={form.canonical} onChange={(e) => update('canonical', e.target.value)} dir="ltr" />
          </Field>
          <Field label="Heading (عنوان الصفحة)">
            <input value={form.heading} onChange={(e) => update('heading', e.target.value)} />
          </Field>
        </div>

        <h2 style={{ fontSize: '1rem', margin: '24px 0 10px', color: 'var(--text-soft)' }}>الحالة والعرض</h2>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 20 }}>
          <label className="form-field checkbox">
            <input type="checkbox" checked={!!form.draft} onChange={(e) => update('draft', e.target.checked)} />
            <span>مسودة (غير منشورة)</span>
          </label>
          <label className="form-field checkbox">
            <input type="checkbox" checked={!!form.featured} onChange={(e) => update('featured', e.target.checked)} />
            <span>مميز (يظهر في قسم المميز)</span>
          </label>
          <label className="form-field checkbox">
            <input type="checkbox" checked={!!form.archived} onChange={(e) => update('archived', e.target.checked)} />
            <span>مؤرشف</span>
          </label>
          <label className="form-field checkbox">
            <input type="checkbox" checked={form.homepage !== false} onChange={(e) => update('homepage', e.target.checked)} />
            <span>يظهر في الصفحة الرئيسية</span>
          </label>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'جاري الحفظ…' : 'حفظ'}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => save({ draft: true })} disabled={saving}>
            حفظ كمسودة
          </button>
          {!isNew && !form.draft ? (
            <button type="button" className="btn btn-ghost" onClick={() => save({ draft: false })} disabled={saving}>
              نشر
            </button>
          ) : null}
          <Link href={`/admin/${kind}s`} className="btn btn-ghost">إلغاء</Link>
          {!isNew ? (
            <button type="button" className="btn btn-danger" onClick={handleDelete} style={{ marginInlineStart: 'auto' }}>
              حذف نهائي
            </button>
          ) : null}
        </div>
      </form>
    </div>
  );
}

function Field({ label, error, hint, children }) {
  return (
    <div className="form-field">
      <label>{label}</label>
      {children}
      {hint ? <div className="muted small" style={{ marginTop: 4 }}>{hint}</div> : null}
      {error ? <div className="err">{error}</div> : null}
    </div>
  );
}
