'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

export default function SeriesClientPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [data, setData] = useState({ data: [], total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState(params.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(params.get('draft') || '');
  const [featuredFilter, setFeaturedFilter] = useState(params.get('featured') || '');
  const [sort, setSort] = useState(params.get('sort') || 'newest');
  const page = Number(params.get('page')) || 1;

  const load = useCallback(async () => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (search) qs.set('search', search);
    if (statusFilter) qs.set('draft', statusFilter);
    if (featuredFilter) qs.set('featured', featuredFilter);
    if (sort) qs.set('sort', sort);
    qs.set('page', String(page));
    qs.set('perPage', '20');
    try {
      const res = await fetch(`/api/admin/series?${qs.toString()}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok || !json.ok || !Array.isArray(json.data)) throw new Error(json.error || 'تعذّر تحميل المسلسلات.');
      setData(json);
      setError('');
    } catch (err) {
      setData({ data: [], total: 0, page: 1, pages: 1 });
      setError(err.message || 'تعذّر الاتصال بالخادم.');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, featuredFilter, sort, page]);

  useEffect(() => { load(); }, [load]);

  function go(p) {
    const qs = new URLSearchParams();
    if (search) qs.set('search', search);
    if (statusFilter) qs.set('draft', statusFilter);
    if (featuredFilter) qs.set('featured', featuredFilter);
    if (sort) qs.set('sort', sort);
    qs.set('page', String(p));
    router.push(`/admin/series?${qs.toString()}`);
  }

  async function requestAction(url, options) {
    try {
      const res = await fetch(url, options);
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || 'فشلت العملية.');
      return json;
    } catch (err) {
      alert(err.message || 'تعذّر الاتصال بالخادم.');
      return null;
    }
  }

  async function del(id, title) {
    if (!confirm(`هل أنت متأكد من حذف «${title}» وكل مواسمه وحلقاته؟`)) return;
    if (await requestAction(`/api/admin/series/${id}`, { method: 'DELETE' })) load();
  }

  async function toggle(id, field, value) {
    if (await requestAction(`/api/admin/series/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    })) load();
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>المسلسلات ({data.total})</h1>
        <Link href="/admin/series/new" className="btn btn-primary">+ إضافة مسلسل</Link>
      </div>

      {error ? <div className="alert alert-error" role="alert">{error}</div> : null}

      <div className="filters-bar">
        <div className="form-field">
          <label>بحث</label>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث بالعنوان أو الـslug…" />
        </div>
        <div className="form-field">
          <label>الحالة</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">الكل</option>
            <option value="false">منشورة</option>
            <option value="true">مسودات</option>
          </select>
        </div>
        <div className="form-field">
          <label>مميزة</label>
          <select value={featuredFilter} onChange={(e) => setFeaturedFilter(e.target.value)}>
            <option value="">الكل</option>
            <option value="true">نعم</option>
            <option value="false">لا</option>
          </select>
        </div>
        <div className="form-field">
          <label>الترتيب</label>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="newest">الأحدث إضافة</option>
            <option value="updated">آخر تحديث</option>
            <option value="title">العنوان</option>
            <option value="year">السنة</option>
          </select>
        </div>
        <div className="form-field">
          <label>&nbsp;</label>
          <button type="button" className="btn btn-primary" onClick={load}>بحث</button>
        </div>
      </div>

      {loading ? (
        <div className="empty-state">جاري التحميل…</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 56 }}></th>
                <th>العنوان</th>
                <th>السنة</th>
                <th>المواسم</th>
                <th>الحلقات</th>
                <th>الحالة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {data.data.length === 0 ? (
                <tr><td colSpan={7} className="empty-state">لا توجد مسلسلات.</td></tr>
              ) : data.data.map((s) => {
                const eps = (s.seasons || []).reduce((n, sn) => n + ((sn.episodes || []).length), 0);
                return (
                  <tr key={s.id}>
                    <td>{s.poster ? <img className="poster-thumb" src={s.poster} alt="" /> : <div className="poster-thumb" />}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{s.title}</div>
                      {s.titleOriginal ? <div className="muted small">{s.titleOriginal}</div> : null}
                      <div className="muted small" style={{ fontFamily: 'monospace' }}>{s.slug}</div>
                    </td>
                    <td>{s.year || '—'}</td>
                    <td>{(s.seasons || []).length}</td>
                    <td>{eps}</td>
                    <td>
                      {s.draft ? <span className="badge badge-draft">مسودة</span> : <span className="badge badge-success">منشور</span>}
                      {s.featured ? <span className="badge badge-accent" style={{ marginInlineStart: 4 }}>مميز</span> : null}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <Link href={`/admin/series/${s.id}`} className="btn btn-ghost btn-sm">تعديل / المواسم</Link>
                        <Link href={`/series/${s.slug}/`} target="_blank" className="btn btn-ghost btn-sm">عرض</Link>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => toggle(s.id, 'featured', !s.featured)}>{s.featured ? 'إلغاء التمييز' : 'تمييز'}</button>
                        <button type="button" className="btn btn-danger btn-sm" onClick={() => del(s.id, s.title)}>حذف</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {data.pages > 1 ? (
        <div className="pagination-row">
          <button disabled={data.page <= 1} onClick={() => go(data.page - 1)} className="btn btn-ghost btn-sm">السابق</button>
          {Array.from({ length: data.pages }, (_, i) => i + 1).slice(Math.max(0, data.page - 4), data.page + 3).map((p) => (
            p === data.page
              ? <span key={p} className="current">{p}</span>
              : <button key={p} onClick={() => go(p)} className="btn btn-ghost btn-sm">{p}</button>
          ))}
          <button disabled={data.page >= data.pages} onClick={() => go(data.page + 1)} className="btn btn-ghost btn-sm">التالي</button>
        </div>
      ) : null}
    </div>
  );
}
