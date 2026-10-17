'use client';

import { useState, useMemo } from 'react';
import EmbedPlayer from './EmbedPlayer.jsx';
import { t } from '@/lib/i18n.mjs';

/**
 * مكوّن اختيار الحلقات مع مشغّل التضمين — يظهر في صفحة المسلسل.
 */
export default function EpisodesPlayer({ seasons, title, locale = 'ar' }) {
  const isEn = locale === 'en';
  const validSeasons = useMemo(
    () => (seasons || []).filter((s) => s && s.episodesList && s.episodesList.length > 0),
    [seasons]
  );

  const [activeSeason, setActiveSeason] = useState(validSeasons[0] ? validSeasons[0].number : null);
  const season = useMemo(
    () => validSeasons.find((s) => s.number === activeSeason) || validSeasons[0] || null,
    [validSeasons, activeSeason]
  );
  const [activeEpisodeId, setActiveEpisodeId] = useState(
    season && season.episodesList && season.episodesList[0] ? season.episodesList[0].id : null
  );

  const episode = useMemo(() => {
    if (!season || !season.episodesList) return null;
    return season.episodesList.find((e) => e.id === activeEpisodeId) || season.episodesList[0] || null;
  }, [season, activeEpisodeId]);

  if (!validSeasons.length) return null;

  const hasEmbed = episode && (episode.embedUrl || (episode.embeds && episode.embeds.length > 0));

  return (
    <section className="panel" id="episodes-player" aria-labelledby="ep-title">
      <h2 className="panel-title" id="ep-title">{isEn ? 'Episodes' : 'الحلقات'}</h2>

      {/* اختيار الموسم */}
      {validSeasons.length > 1 ? (
        <div className="player-source-list" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {validSeasons.map((s) => (
            <button
              key={s.number}
              type="button"
              onClick={() => {
                setActiveSeason(s.number);
                const first = s.episodesList && s.episodesList[0];
                setActiveEpisodeId(first ? first.id : null);
              }}
              className={`btn ${s.number === activeSeason ? 'btn-accent' : 'btn-ghost'}`}
              style={{ fontSize: 13, padding: '6px 12px' }}
            >
              {isEn ? `S${s.number}` : `موسم ${s.number}`}
            </button>
          ))}
        </div>
      ) : null}

      {/* قائمة الحلقات */}
      {season ? (
        <div style={{ maxHeight: 220, overflowY: 'auto', marginBottom: 12, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }}>
          {season.episodesList.map((ep) => (
            <button
              key={ep.id}
              type="button"
              onClick={() => setActiveEpisodeId(ep.id)}
              className="episode-row"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '8px 12px',
                background: ep.id === activeEpisodeId ? 'rgba(95,168,211,0.12)' : 'transparent',
                border: 0,
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                color: 'inherit',
                cursor: 'pointer',
                textAlign: isEn ? 'left' : 'right',
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'rgba(95,168,211,0.15)',
                  fontSize: 12,
                  flexShrink: 0,
                }}
              >
                {ep.number}
              </span>
              <span style={{ flex: 1 }}>
                <span style={{ display: 'block', fontSize: 14 }}>{isEn ? (ep.titleOriginal || ep.title) : ep.title}</span>
                {ep.runtime ? (
                  <span className="muted small">{isEn ? `${ep.runtime}m` : `${ep.runtime} دقيقة`}</span>
                ) : null}
              </span>
              {!ep.embedUrl && (!ep.embeds || !ep.embeds.length) ? (
                <span className="muted small" style={{ fontSize: 11 }}>{isEn ? 'No source' : 'لا يوجد مصدر'}</span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}

      {/* مشغّل الحلقة */}
      {episode && hasEmbed ? (
        <>
          <h3 style={{ fontSize: 15, margin: '0 0 8px' }}>
            {isEn ? (episode.titleOriginal || episode.title) : episode.title}
          </h3>
          <EmbedPlayer
            url={episode.embedUrl || ''}
            sources={episode.embeds || []}
            title={`${title} · ${episode.title}`}
          />
        </>
      ) : episode ? (
        <p className="panel-note" style={{ marginBottom: 0 }}>
          {isEn
            ? 'No player source added for this episode yet. Add an embed URL from the admin panel.'
            : 'لا يوجد مصدر تشغيل لهذه الحلقة بعد. أضف رابط التضمين من لوحة التحكم.'}
        </p>
      ) : null}
    </section>
  );
}
