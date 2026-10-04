import Link from 'next/link';
import { t, statusLabel } from '@/lib/i18n.mjs';
import { formatRuntime } from '@/lib/format.mjs';
import { IconStar, IconExternal, IconShield } from './Icons.jsx';

/** تقييم المحرر (رأي تحريري — لا توجد تقييمات مستخدمين في هذه النسخة) */
export function Star({ value, locale = 'ar' }) {
  if (typeof value !== 'number') return null;
  return (
    <span className="review-rating" title={t('reviews.ratingLabel', null, locale)}>
      <IconStar width={15} height={15} />
      {value}/10 <span className="muted small">({t('reviews.ratingLabel', null, locale)})</span>
    </span>
  );
}

/**
 * روابط المشاهدة الرسمية.
 * - الروابط تأتي من حقل watch في ملف العمل، وقد تحقق البناء من أنها https وعلى نطاق معتمد.
 * - إن لم توجد روابط: رسالة صريحة توضح أننا لا نوفر روابط غير رسمية.
 */
export function WatchLinks({ work, locale = 'ar' }) {
  if (!work.watch.length) {
    return (
      <section className="panel panel-disabled" aria-labelledby="watch-title">
        <h2 className="panel-title" id="watch-title">
          {t('work.watch', null, locale)}
        </h2>
        <p className="panel-note" style={{ marginBottom: 0 }}>
          {t('work.watchEmpty', null, locale)}
        </p>
      </section>
    );
  }
  return (
    <section className="panel" aria-labelledby="watch-title">
      <h2 className="panel-title" id="watch-title">
        <IconShield width={18} height={18} />
        {t('work.watch', null, locale)}
      </h2>
      <div className="watch-list">
        {work.watch.map((w) => (
          <a key={w.url} className="watch-link" href={w.url} target="_blank" rel="noopener noreferrer">
            <span>
              {w.label}
              <span className="watch-badge">{locale === 'en' ? 'Official Platform' : 'منصة رسمية'}</span>
            </span>
            <IconExternal width={16} height={16} />
          </a>
        ))}
      </div>
      <p className="panel-note mt-4" style={{ marginBottom: 0 }}>
        {t('work.watchNote', null, locale)}
      </p>
    </section>
  );
}

/** المواسم والحلقات — تُعرض فقط عند توفر بياناتها الفعلية */
export function SeasonsBlock({ work }) {
  const hasSeasons = work.seasons.length > 0;
  return (
    <section className="panel" aria-labelledby="seasons-title">
      <h2 className="panel-title" id="seasons-title">
        {t('series.seasons')}
        {work.seriesStatus ? <span className="badge badge-accent">{statusLabel(work.seriesStatus)}</span> : null}
      </h2>

      {hasSeasons ? (
        <div className="seasons">
          {work.seasons.map((s) => (
            <div className="season" key={s.number}>
              <div>
                <strong>
                  {t('series.season', { n: s.number })}
                  {s.year ? <span className="muted small"> · {s.year}</span> : null}
                </strong>
                {s.episodes ? (
                  <div className="season-episodes" aria-hidden="true">
                    {Array.from({ length: Math.min(s.episodes, 24) }, (_, i) => (
                      <span className="ep-dot" key={i} />
                    ))}
                  </div>
                ) : null}
              </div>
              <span className="muted small">{s.episodes ? t('series.episodesCount', { n: s.episodes }) : ''}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="panel-note" style={{ marginBottom: 0 }}>
          {t('series.noSeasons')}
        </p>
      )}

      <p className="panel-note mt-4" style={{ marginBottom: 0 }}>
        لا نضيف عددًا لحلقات أو مواسم لم نتحقق منه. أي بيانات ناقصة تُترك فارغة بدل تخمينها.
      </p>
    </section>
  );
}

/** شرائح أشخاص مع رابط لصفحة كل شخص */
export function PersonChips({ people = [], role, locale = 'ar' }) {
  if (!people.length) return null;
  const isEn = locale === 'en';
  return (
    <div className="people-row">
      {people.map((p) => {
        const mainName = isEn && p.nameOriginal ? p.nameOriginal : p.name;
        const subName = isEn ? (p.nameOriginal ? p.name : null) : p.nameOriginal;
        const avatarChar = mainName.trim().slice(0, 1);
        const worksSuffix = p.works.length
          ? isEn
            ? ` · ${p.works.length} ${p.works.length === 1 ? 'title' : 'titles'} on site`
            : ` · ${p.works.length} عمل في الموقع`
          : '';
        return (
          <Link key={p.id} href={p.url} className="person-chip">
            <span className="person-avatar" aria-hidden="true">
              {avatarChar}
            </span>
            <span>
              <span>{mainName}</span>
              {subName ? (
                <span className="muted small" dir={isEn ? 'rtl' : 'ltr'} style={{ marginInlineStart: 6 }}>
                  ({subName})
                </span>
              ) : null}
              <span className="person-role">
                {role}
                {worksSuffix}
              </span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}

export { formatRuntime };
