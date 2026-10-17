'use client';

import { useState } from 'react';
import Link from 'next/link';
import WorkForm from '../../WorkForm.jsx';

async function adminRequest(url, options) {
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || 'فشلت العملية.');
    return data;
  } catch (err) {
    alert(err.message || 'تعذّر الاتصال بالخادم.');
    return null;
  }
}

export default function SeriesEditor({ series, genres }) {
  const [tab, setTab] = useState('info');
  const [seasons, setSeasons] = useState(series.seasons || []);
  const [seasonForm, setSeasonForm] = useState({ number: (series.seasons?.length || 0) + 1, title: '', year: '' });
  const [refreshKey, setRefreshKey] = useState(0);

  async function addSeason(e) {
    e.preventDefault();
    const data = await adminRequest(`/api/admin/series/${series.id}/seasons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(seasonForm),
    });
    if (!data) return;
    setSeasons([...seasons, data.season]);
    setSeasonForm({ number: (seasons.length + 1) + 1, title: '', year: '' });
    setRefreshKey((k) => k + 1);
  }

  async function deleteSeason(seasonId) {
    if (!confirm('حذف الموسم وكل حلقاته؟')) return;
    const data = await adminRequest(`/api/admin/series/${series.id}/seasons/${seasonId}`, { method: 'DELETE' });
    if (!data) return;
    setSeasons(seasons.filter((s) => s.id !== seasonId));
    setRefreshKey((k) => k + 1);
  }

  // نمرر نسخة محدّثة من series إلى WorkForm حتى يقرأ البيانات الجديدة بعد حفظ.
  const updated = { ...series, seasons };

  return (
    <div key={refreshKey}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <Link href="/admin/series" className="btn btn-ghost btn-sm">← رجوع</Link>
        <Link href={`/series/${series.slug}/`} target="_blank" className="btn btn-ghost btn-sm">عرض الصفحة ↗</Link>
      </div>

      <div className="tabs">
        <button type="button" className={tab === 'info' ? 'active' : ''} onClick={() => setTab('info')}>بيانات المسلسل</button>
        <button type="button" className={tab === 'seasons' ? 'active' : ''} onClick={() => setTab('seasons')}>المواسم والحلقات ({seasons.length})</button>
      </div>

      {tab === 'info' ? (
        <WorkForm kind="series" work={updated} genres={genres} />
      ) : (
        <div>
          <h2 style={{ margin: '0 0 16px' }}>المواسم والحلقات</h2>

          <form onSubmit={addSeason} style={{ display: 'flex', gap: 10, alignItems: 'end', marginBottom: 20, padding: 14, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12 }}>
            <div className="form-field" style={{ marginBottom: 0, maxWidth: 100 }}>
              <label>رقم الموسم</label>
              <input type="number" value={seasonForm.number} onChange={(e) => setSeasonForm({ ...seasonForm, number: Number(e.target.value) })} required dir="ltr" />
            </div>
            <div className="form-field" style={{ marginBottom: 0, flex: 1 }}>
              <label>العنوان</label>
              <input value={seasonForm.title} onChange={(e) => setSeasonForm({ ...seasonForm, title: e.target.value })} placeholder="اختياري" />
            </div>
            <div className="form-field" style={{ marginBottom: 0, maxWidth: 120 }}>
              <label>السنة</label>
              <input type="number" value={seasonForm.year} onChange={(e) => setSeasonForm({ ...seasonForm, year: Number(e.target.value) })} dir="ltr" />
            </div>
            <button type="submit" className="btn btn-primary">+ إضافة موسم</button>
          </form>

          {seasons.length === 0 ? (
            <div className="empty-state">لا توجد مواسم بعد. أضف موسمًا للبدء.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {seasons
                .slice()
                .sort((a, b) => (a.order || a.number) - (b.order || b.number))
                .map((s) => (
                  <SeasonBlock
                    key={s.id}
                    seriesId={series.id}
                    season={s}
                    onDelete={() => deleteSeason(s.id)}
                    onChange={() => setRefreshKey((k) => k + 1)}
                  />
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SeasonBlock({ seriesId, season, onDelete, onChange }) {
  const [expanded, setExpanded] = useState(false);
  const [episodes, setEpisodes] = useState(season.episodes || []);
  const [epForm, setEpForm] = useState({
    number: (season.episodes?.length || 0) + 1,
    title: '',
    titleOriginal: '',
    description: '',
    thumbnail: '',
    runtime: '',
    airDate: '',
    embedUrl: '',
  });

  async function addEpisode(e) {
    e.preventDefault();
    const data = await adminRequest(`/api/admin/series/${seriesId}/seasons/${season.id}/episodes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(epForm),
    });
    if (!data) return;
    setEpisodes([...episodes, data.episode]);
    setEpForm({
      number: episodes.length + 2,
      title: '',
      titleOriginal: '',
      description: '',
      thumbnail: '',
      runtime: '',
      airDate: '',
      embedUrl: '',
    });
    onChange();
  }

  async function updateEpisode(epId, field, value) {
    const ep = episodes.find((e) => e.id === epId);
    if (!ep) return;
    const updated = { ...ep, [field]: value };
    setEpisodes(episodes.map((e) => e.id === epId ? updated : e));
  }

  async function saveEpisode(epId) {
    const ep = episodes.find((e) => e.id === epId);
    if (!ep) return;
    const data = await adminRequest(`/api/admin/series/${seriesId}/seasons/${season.id}/episodes/${epId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ep),
    });
    if (!data) return;
    alert('تم حفظ الحلقة.');
  }

  async function deleteEpisode(epId) {
    if (!confirm('حذف هذه الحلقة؟')) return;
    const data = await adminRequest(`/api/admin/series/${seriesId}/seasons/${season.id}/episodes/${epId}`, { method: 'DELETE' });
    if (!data) return;
    setEpisodes(episodes.filter((e) => e.id !== epId));
    onChange();
  }

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 18 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.05rem' }}>
            الموسم {season.number} {season.title ? `— ${season.title}` : ''}
          </h3>
          <div className="muted small" style={{ marginTop: 4 }}>{episodes.length} حلقة{season.year ? ` · ${season.year}` : ''}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setExpanded(!expanded)}>
            {expanded ? 'إخفاء' : 'إدارة الحلقات'}
          </button>
          <button type="button" className="btn btn-danger btn-sm" onClick={onDelete}>حذف الموسم</button>
        </div>
      </div>

      {expanded ? (
        <div style={{ marginTop: 14 }}>
          <form onSubmit={addEpisode} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10, padding: 12, background: 'var(--surface-2)', borderRadius: 10, marginBottom: 14 }}>
            <input type="number" placeholder="رقم الحلقة" value={epForm.number} onChange={(e) => setEpForm({ ...epForm, number: Number(e.target.value) })} required dir="ltr" />
            <input placeholder="العنوان عربي" value={epForm.title} onChange={(e) => setEpForm({ ...epForm, title: e.target.value })} />
            <input placeholder="العنوان أصلي" dir="ltr" value={epForm.titleOriginal} onChange={(e) => setEpForm({ ...epForm, titleOriginal: e.target.value })} />
            <input placeholder="رابط التضمين" dir="ltr" value={epForm.embedUrl} onChange={(e) => setEpForm({ ...epForm, embedUrl: e.target.value })} />
            <input type="number" placeholder="المدة (دقيقة)" dir="ltr" value={epForm.runtime} onChange={(e) => setEpForm({ ...epForm, runtime: Number(e.target.value) })} />
            <input type="date" placeholder="تاريخ العرض" dir="ltr" value={epForm.airDate} onChange={(e) => setEpForm({ ...epForm, airDate: e.target.value })} />
            <button type="submit" className="btn btn-primary btn-sm">+ إضافة حلقة</button>
          </form>

          {episodes.length === 0 ? (
            <div className="empty-state">لا توجد حلقات في هذا الموسم.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {episodes.slice().sort((a, b) => (a.order || a.number) - (b.order || b.number)).map((ep) => (
                <div key={ep.id} style={{ padding: 12, border: '1px solid var(--border)', borderRadius: 10, display: 'grid', gridTemplateColumns: '60px 1fr', gap: 10 }}>
                  <div style={{ fontWeight: 700, textAlign: 'center', alignSelf: 'center' }}>
                    #{ep.number}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <input value={ep.title} onChange={(e) => updateEpisode(ep.id, 'title', e.target.value)} placeholder="عنوان الحلقة" />
                    <input value={ep.titleOriginal} onChange={(e) => updateEpisode(ep.id, 'titleOriginal', e.target.value)} placeholder="Original title" dir="ltr" />
                    <input value={ep.embedUrl} onChange={(e) => updateEpisode(ep.id, 'embedUrl', e.target.value)} placeholder="رابط التضمين" dir="ltr" style={{ gridColumn: '1 / -1' }} />
                    <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 6 }}>
                      <button type="button" className="btn btn-accent btn-sm" onClick={() => saveEpisode(ep.id)}>حفظ الحلقة</button>
                      {ep.embedUrl ? <span className="badge badge-success" style={{ alignSelf: 'center' }}>بمصدر</span> : <span className="badge badge-danger" style={{ alignSelf: 'center' }}>بدون مصدر</span>}
                      <button type="button" className="btn btn-danger btn-sm" style={{ marginInlineStart: 'auto' }} onClick={() => deleteEpisode(ep.id)}>حذف</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
