import Link from 'next/link';
import { t, genreLabel, genreUrl, typeLabel } from '@/lib/i18n.mjs';
import { formatDate } from '@/lib/format.mjs';
import PosterImage from './PosterImage.jsx';
import WorkCard from './WorkCard.jsx';
import { IconList, IconStar, IconArrow } from './Icons.jsx';

/** شبكة بطاقات الأعمال */
export function WorkGrid({ works = [], priorityCount = 0, showGenres = true, rail = false }) {
  return (
    <div className={rail ? 'rail' : 'grid'}>
      {works.map((w, i) => (
        <WorkCard key={`${w.kind}:${w.slug}`} work={w} priority={i < priorityCount} showGenres={showGenres} />
      ))}
    </div>
  );
}

/** بطاقة مراجعة تحريرية */
export function ReviewCard({ review }) {
  return (
    <article className="review-card">
      <div className="row" style={{ gap: 8 }}>
        {typeof review.rating === 'number' ? (
          <span className="review-rating" title={t('reviews.ratingLabel')}>
            <IconStar width={16} height={16} />
            {review.rating}/10
          </span>
        ) : null}
        <span className="muted small">{t('reviews.ratingLabel')}</span>
      </div>
      <h3 style={{ margin: 0, fontSize: '1.05rem' }}>
        <Link href={review.url}>{review.title}</Link>
      </h3>
      {review.work ? (
        <p className="muted small" style={{ margin: 0 }}>
          {typeLabel(review.work.kind)}: <Link href={review.work.url}>{review.work.title}</Link>
          {review.work.year ? ` · ${review.work.year}` : ''}
        </p>
      ) : null}
      <p className="small" style={{ margin: 0, color: 'var(--text-soft)' }}>
        {review.excerpt}
      </p>
      <div className="spread" style={{ marginTop: 'auto' }}>
        <span className="muted small">
          {t('reviews.byAuthor', { author: review.author })}
          {review.date ? ` · ${formatDate(review.date)}` : ''}
        </span>
        <Link href={review.url} className="section-link">
          اقرأ المراجعة
          <IconArrow width={15} height={15} className="flip" />
        </Link>
      </div>
    </article>
  );
}

/** بطاقة قائمة ترشيحات */
export function ListCard({ list }) {
  return (
    <article className="review-card">
      <div className="row" style={{ gap: 8 }}>
        <span className="badge badge-accent">
          <IconList width={14} height={14} />
          {t('lists.itemsCount', { n: list.items.length })}
        </span>
      </div>
      <h3 style={{ margin: 0, fontSize: '1.05rem' }}>
        <Link href={list.url}>{list.title}</Link>
      </h3>
      <p className="small" style={{ margin: 0, color: 'var(--text-soft)' }}>
        {list.description}
      </p>
      <div className="rail" style={{ marginTop: 6, gridAutoColumns: '78px' }}>
        {list.items.slice(0, 5).map((it) => (
          <Link key={it.ref} href={it.work.url} aria-label={it.work.title}>
            <span className="card-media" style={{ aspectRatio: '2/3', display: 'block' }}>
              <PosterImage
                src={it.work.hasPoster ? it.work.poster : null}
                title={it.work.title}
                year={it.work.year}
                alt=""
                width={156}
                height={234}
                loading="lazy"
              />
            </span>
          </Link>
        ))}
      </div>
      <div className="spread" style={{ marginTop: 'auto' }}>
        <span className="muted small">{formatDate(list.date)}</span>
        <Link href={list.url} className="section-link">
          القائمة كاملة
          <IconArrow width={15} height={15} className="flip" />
        </Link>
      </div>
    </article>
  );
}

/** بطاقة شخص (ممثل/مخرج) */
export function PersonCard({ person }) {
  return (
    <Link href={person.url} className="person-chip" style={{ borderRadius: 'var(--radius)', padding: 12 }}>
      <span className="person-avatar" aria-hidden="true">
        {person.name.trim().slice(0, 1)}
      </span>
      <span>
        <span style={{ fontWeight: 600 }}>{person.name}</span>
        <span className="person-role">
          {person.roleLabel} · {person.worksCount ?? person.works?.length ?? 0} عمل
        </span>
      </span>
    </Link>
  );
}

/** بطاقة تصنيف */
export function GenreCard({ genre }) {
  return (
    <article className="review-card" style={{ gap: 8 }}>
      <h3 style={{ margin: 0, fontSize: '1.1rem' }}>
        <Link href={genre.url}>{genre.label}</Link>
      </h3>
      <p className="muted small" style={{ margin: 0 }}>
        {genre.movies ? `${genre.movies} فيلم` : ''}
        {genre.movies && genre.series ? ' · ' : ''}
        {genre.series ? `${genre.series} مسلسل` : ''}
      </p>
      <div className="rail" style={{ gridAutoColumns: '64px' }}>
        {genre.sample.slice(0, 4).map((w) => (
          <Link key={`${w.kind}:${w.slug}`} href={w.url} aria-label={w.title}>
            <span className="card-media" style={{ aspectRatio: '2/3', display: 'block' }}>
              <PosterImage
                src={w.hasPoster ? w.poster : null}
                title={w.title}
                year={w.year}
                alt=""
                width={128}
                height={192}
                loading="lazy"
              />
            </span>
          </Link>
        ))}
      </div>
      <div className="spread" style={{ marginTop: 'auto' }}>
        <span className="muted small">{t('genres.count', { n: genre.count })}</span>
        <Link href={genre.url} className="section-link">
          تصفّح
          <IconArrow width={15} height={15} className="flip" />
        </Link>
      </div>
    </article>
  );
}

export { WorkCard };
