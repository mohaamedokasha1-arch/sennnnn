import { t } from '@/lib/i18n.mjs';
import { IconExternal } from './Icons.jsx';

/**
 * مشغّل التريلر المضمّن المتجاوب (16:9 للموبايل والتابلت والكمبيوتر).
 * يدعم YouTube (عبر youtube-nocookie) و Vimeo فقط.
 * أي رابط تضمين آخر يجب أن يمرّ من قائمة النطاقات الرسمية في lib/content.mjs،
 * وإلا يوقف البناء — لذلك لا يمكن أن يظهر هنا مشغّل من مصدر غير رسمي.
 */
const SRC = {
  youtube: (id, locale = 'ar') => `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&hl=${locale}`,
  vimeo: (id) => `https://player.vimeo.com/video/${id}`,
};

export function resolveTrailerSrc(trailer, locale = 'ar') {
  if (!trailer) return null;
  if (trailer.provider && trailer.id) return SRC[trailer.provider]?.(trailer.id, locale) ?? null;
  if (trailer.url) return trailer.url;
  return null;
}

export default function TrailerEmbed({ trailer, title, locale = 'ar' }) {
  const embedSrc = resolveTrailerSrc(trailer, locale);
  if (!embedSrc) return null;
  const isEn = locale === 'en';

  return (
    <section className="panel" aria-labelledby="trailer-title" id="trailer-section">
      <div className="spread mb-2">
        <h2 className="panel-title" id="trailer-title" style={{ marginBottom: 0 }}>
          {t('work.trailer', null, locale)}
          {trailer.subtitled ? <span className="badge badge-accent">{t('work.subtitlesBadge', null, locale)}</span> : null}
        </h2>
        <div className="row" style={{ gap: 8 }}>
          <a
            href={embedSrc}
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
          src={embedSrc}
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
