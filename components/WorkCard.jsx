import Link from 'next/link';
import { t, genreLabel, typeLabel, genreUrl } from '@/lib/i18n.mjs';
import { DemoBadge, PosterFallback } from './JsonLd.jsx';
import FavoriteButton from './FavoriteButton.jsx';

/**
 * بطاقة عمل (فيلم/مسلسل) — المكوّن الأساسي في كل الشبكات.
 * - معالجة أنيقة للبيانات الناقصة: أي عنصر غير متوفر يُخفى بدل عرض قيمة فارغة.
 * - البوستر بتحميل كسول (ما عدا أول بطاقات الشاشة الأولى: priority).
 */
export default function WorkCard({ work, priority = false, showGenres = true, note = null }) {
  const {
    kind,
    slug,
    url,
    title,
    titleOriginal,
    year,
    genres,
    hasPoster,
    poster,
    demo,
    seriesStatus,
  } = work;

  const genitive = kind === 'series' ? 'مسلسل' : 'فيلم';
  const posterAlt = `بوستر ${genitive} ${title}${year ? ` (${year})` : ''}`;

  return (
    <article className="card">
      <div className="card-media">
        <Link href={url} tabIndex={-1} aria-hidden="true">
          {hasPoster ? (
            <img
              src={poster}
              alt={posterAlt}
              width={600}
              height={900}
              loading={priority ? 'eager' : 'lazy'}
              {...(priority ? { fetchPriority: 'high' } : {})}
              decoding="async"
            />
          ) : (
            <PosterFallback title={title} year={year} />
          )}
        </Link>

        <div className="card-badges">
          <span className="chip chip-static chip-type">{typeLabel(kind)}</span>
          {demo ? <DemoBadge compact /> : null}
          {kind === 'series' && seriesStatus ? (
            <span className="chip chip-static">{seriesStatus === 'ongoing' ? 'مستمر' : seriesStatus === 'limited' ? 'محدود' : 'منتهٍ'}</span>
          ) : null}
        </div>

        {t('work.favoriteAdd') ? (
          <div className="card-fav">
            <FavoriteButton id={`${kind}:${slug}`} title={title} />
          </div>
        ) : null}

        <div className="card-scrim">
          {year ? <span className="chip chip-static">{year}</span> : null}
        </div>
      </div>

      <div className="card-body">
        <h3 className="card-title">
          <Link href={url}>{title}</Link>
        </h3>
        {titleOriginal ? (
          <p className="card-meta" dir="ltr" style={{ justifyContent: 'flex-start' }}>
            {titleOriginal}
          </p>
        ) : null}
        {note ? <p className="card-meta">{note}</p> : null}
        {showGenres && genres?.length ? (
          <div className="card-genres">
            {genres.slice(0, 3).map((g) => (
              <Link key={g} href={genreUrl(g)} className="chip">
                {genreLabel(g)}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}
