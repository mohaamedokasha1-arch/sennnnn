'use client';

import { useState } from 'react';
import { t } from '@/lib/i18n.mjs';
import { IconExternal } from './Icons.jsx';

/**
 * مشغّل التريلر والفيديو المضمّن المتجاوب (16:9 للموبايل والتابلت والكمبيوتر).
 * يدعم YouTube و Vimeo وروابط التضمين المباشرة عبر iframe.
 */
const SRC = {
  youtube: (id, locale = 'ar') => `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&hl=${locale}`,
  vimeo: (id) => `https://player.vimeo.com/video/${id}`,
};

export function resolveTrailerSrc(trailer, locale = 'ar') {
  if (!trailer) return null;
  if (trailer.embedUrl) return trailer.embedUrl;
  if (trailer.url) {
    const m = trailer.url.match(/^(https:\/\/[^/]+\/)(?:watch|play)\.php\?vid=([\w-]+)$/i);
    if (m) return `${m[1]}embed.php?vid=${m[2]}`;
    return trailer.url;
  }
  if (trailer.provider && trailer.id) return SRC[trailer.provider]?.(trailer.id, locale) ?? null;
  return null;
}

export default function TrailerEmbed({ trailer, title, locale = 'ar' }) {
  const primaryEmbedSrc = resolveTrailerSrc(trailer, locale);
  const rawUrl = trailer?.url || primaryEmbedSrc;
  const hasDistinctRawUrl = Boolean(rawUrl && primaryEmbedSrc && rawUrl !== primaryEmbedSrc);
  const [useRawUrl, setUseRawUrl] = useState(false);

  if (!primaryEmbedSrc) return null;
  const activeSrc = useRawUrl ? rawUrl : primaryEmbedSrc;
  const isEn = locale === 'en';

  return (
    <section className="panel" aria-labelledby="trailer-title" id="trailer-section">
      <div className="spread mb-2">
        <h2 className="panel-title" id="trailer-title" style={{ marginBottom: 0 }}>
          {t('work.trailer', null, locale)}
          {trailer.subtitled ? <span className="badge badge-accent">{t('work.subtitlesBadge', null, locale)}</span> : null}
        </h2>
        <div className="row" style={{ gap: 8 }}>
          {hasDistinctRawUrl ? (
            <>
              <button
                type="button"
                className={`btn btn-sm ${!useRawUrl ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setUseRawUrl(false)}
              >
                {isEn ? 'Server 1 (Embed)' : 'سيرفر التضمين 1'}
              </button>
              <button
                type="button"
                className={`btn btn-sm ${useRawUrl ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setUseRawUrl(true)}
              >
                {isEn ? 'Server 2 (Direct)' : 'سيرفر المشاهدة 2'}
              </button>
            </>
          ) : null}
          <a
            href={rawUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost btn-sm"
            aria-label={isEn ? 'Open video in a new tab' : 'فتح الفيديو في نافذة مستقلة'}
          >
            <span>{isEn ? 'Open Link' : 'فتح الرابط المباشر'}</span>
            <IconExternal width={15} height={15} />
          </a>
        </div>
      </div>

      <div className="trailer-frame" style={{ width: '100%', aspectRatio: '16 / 9' }}>
        <iframe
          key={activeSrc}
          src={activeSrc}
          data-original-url={rawUrl}
          title={`${t('work.trailer', null, locale)}: ${title}`}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          style={{ width: '100%', height: '100%', border: 0 }}
        />
      </div>

      <p className="panel-note mt-2" style={{ marginBottom: 0 }}>
        {t('work.trailerNote', null, locale)}
      </p>
    </section>
  );
}
