'use client';

import { useState } from 'react';

/**
 * مشغّل التضمين — يعرض iframe للرابط المُخزَّن من لوحة التحكم.
 *
 * ضوابط أمنية:
 *  - sandbox محدود (بدون allow-same-origin/allow-top-navigation إلا عند الحاجة).
 *  - allow يقيّد الصلاحيات (no fullscreen اختياري هنا، مُعطَّل افتراضيًا).
 *  - referrerPolicy=no-referrer لمنع تسريب معلومات الزائر.
 *  - loading=lazy.
 *  - لا نضيف allow-scripts مع allow-same-origin (يمنع تشغيل سكربت بصلاحيات الصفحة).
 */
export default function EmbedPlayer({ url, title, sources = [], onSelectSource }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const list = (url && (!sources || sources.length === 0))
    ? [{ url, label: 'المصدر الافتراضي' }]
    : (sources || []);

  if (!list || list.length === 0) return null;
  const current = list[activeIdx] || list[0];
  if (!current || !current.url) return null;

  return (
    <section className="panel" id="player-section" aria-labelledby="player-title">
      <h2 className="panel-title" id="player-title" style={{ marginBottom: 8 }}>
        المشاهدة
        {list.length > 1 ? <span className="muted small" style={{ marginInlineStart: 8 }}>· {current.label}</span> : null}
      </h2>
      {list.length > 1 ? (
        <div className="player-source-list" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {list.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => { setActiveIdx(i); if (onSelectSource) onSelectSource(i); }}
              className={`btn ${i === activeIdx ? 'btn-accent' : 'btn-ghost'}`}
              style={{ fontSize: 12, padding: '4px 10px' }}
            >
              {s.label || `سيرفر ${i + 1}`}
            </button>
          ))}
        </div>
      ) : null}
      <div className="trailer-frame" style={{ width: '100%', aspectRatio: '16 / 9', background: '#000' }}>
        <iframe
          src={current.url}
          title={`مشغّل: ${title || ''}`}
          loading="lazy"
          referrerPolicy="no-referrer"
          allow="encrypted-media; picture-in-picture; autoplay"
          sandbox="allow-scripts allow-presentation allow-forms allow-popups"
          style={{ width: '100%', height: '100%', border: 0 }}
        />
      </div>
      <p className="panel-note small" style={{ marginTop: 8, marginBottom: 0 }}>
        يتم عرض المحتوى عبر مزوّد خارجي عبر رابط تضمين مُعتمَد. في حال عدم عمل المشغّل،
        قد يكون المزوّد قد حظر الإطارات المضمّنة — استخدم الروابط الرسمية أدناه إن وُجدت.
      </p>
    </section>
  );
}
