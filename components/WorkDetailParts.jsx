import Link from 'next/link';
import { t, statusLabel } from '@/lib/i18n.mjs';
import { formatRuntime } from '@/lib/format.mjs';
import { IconStar, IconExternal, IconShield } from './Icons.jsx';

/** تقييم المحرر (رأي تحريري — لا توجد تقييمات مستخدمين في هذه النسخة) */
export function Star({ value }) {
  if (typeof value !== 'number') return null;
  return (
    <span className="review-rating" title={t('reviews.ratingLabel')}>
      <IconStar width={15} height={15} />
      {value}/10 <span className="muted small">({t('reviews.ratingLabel')})</span>
    </span>
  );
}

/**
 * روابط المشاهدة الرسمية.
 * - الروابط تأتي من حقل watch في ملف العمل، وقد تحقق البناء من أنها https وعلى نطاق معتمد.
 * - إن لم توجد روابط: رسالة صريحة توضح أننا لا نوفر روابط غير رسمية.
 */
export function WatchLinks({ work }) {
  if (!work.watch.length) {
    return (
      <section className="panel panel-disabled" aria-labelledby="watch-title">
        <h2 className="panel-title" id="watch-title">
          {t('work.watch')}
        </h2>
        <p className="panel-note" style={{ marginBottom: 0 }}>
          {t('work.watchEmpty')}
        </p>
      </section>
    );
  }
  return (
    <section className="panel" aria-labelledby="watch-title">
      <h2 className="panel-title" id="watch-title">
        <IconShield width={18} height={18} />
        {t('work.watch')}
      </h2>
      <div className="watch-list">
        {work.watch.map((w) => (
          <a key={w.url} className="watch-link" href={w.url} target="_blank" rel="noopener noreferrer">
            <span>
              {w.label}
              <span className="watch-badge">منصة رسمية</span>
            </span>
            <IconExternal width={16} height={16} />
          </a>
        ))}
      </div>
      <p className="panel-note mt-4" style={{ marginBottom: 0 }}>
        {t('work.watchNote')}
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
export function PersonChips({ people = [], role }) {
  if (!people.length) return null;
  return (
    <div className="people-row">
      {people.map((p) => (
        <Link key={p.id} href={p.url} className="person-chip">
          <span className="person-avatar" aria-hidden="true">
            {p.name.trim().slice(0, 1)}
          </span>
          <span>
            {p.name}
            <span className="person-role">
              {role}
              {p.works.length ? ` · ${p.works.length} عمل في الموقع` : ''}
            </span>
          </span>
        </Link>
      ))}
    </div>
  );
}

export { formatRuntime };
