import Link from 'next/link';
import { t, genreUrl, genreLabel, typeLabel, countryLabel, languageLabel, statusLabel } from '@/lib/i18n.mjs';
import { formatRuntime, formatDate } from '@/lib/format.mjs';
import { renderMarkdown } from '@/lib/markdown.mjs';
import { workJsonLd, reviewJsonLd, breadcrumbJsonLd } from '@/lib/seo.mjs';
import { similarWorks, getReviewForWork } from '@/lib/content.mjs';
import { DemoBadge, PosterFallback, default as JsonLd } from './JsonLd.jsx';
import { Breadcrumbs, AdSlot, Notice } from './ui.jsx';
import { Star, WatchLinks, SeasonsBlock, PersonChips } from './WorkDetailParts.jsx';
import ShareRow from './ShareRow.jsx';
import FavoriteButton from './FavoriteButton.jsx';
import TrailerEmbed from './TrailerEmbed.jsx';
import { WorkGrid } from './cards.jsx';

/**
 * مكوّن صفحة تفاصيل العمل (فيلم أو مسلسل) — يُستخدم في مسارين مختلفين.
 * كل قسم يعتمد على وجود بيانات فعلية: إن غابت البيانات يختفي القسم أو تظهر رسالة صريحة،
 * ولا نعرض أبدًا قيمة فارغة أو قسمًا شبه فارغ.
 */
export default function WorkDetail({ work }) {
  const review = getReviewForWork(work);
  const similar = similarWorks(work, 6);
  const kindLabel = typeLabel(work.kind);
  const genitive = work.kind === 'series' ? 'مسلسل' : 'فيلم';

  const crumbs = [
    { name: t('nav.home'), url: '/' },
    { name: work.kind === 'series' ? t('nav.series') : t('nav.movies'), url: work.kind === 'series' ? '/series/' : '/movies/' },
    { name: work.title, url: work.url },
  ];

  const ld = [workJsonLd(work), breadcrumbJsonLd(crumbs.map((c) => ({ name: c.name, url: c.url })))];
  if (review) ld.push(reviewJsonLd(review));

  return (
    <div className="container">
      <JsonLd data={ld} />
      <Breadcrumbs items={crumbs} />

      <article className="mt-4">
        <header className="detail-head">
          <div className="detail-poster">
            {work.hasPoster ? (
              <img src={work.poster} alt={`بوستر ${genitive} ${work.title}${work.year ? ` (${work.year})` : ''}`} width={600} height={900} fetchPriority="high" />
            ) : (
              <PosterFallback title={work.title} year={work.year} />
            )}
          </div>

          <div>
            <div className="chips mb-2">
              <span className="chip chip-static chip-type">{kindLabel}</span>
              {work.demo ? <DemoBadge /> : null}
              {work.kind === 'series' && work.seriesStatus ? <span className="chip chip-static">{statusLabel(work.seriesStatus)}</span> : null}
            </div>

            <h1 className="detail-title">{work.title}</h1>
            {work.titleOriginal ? (
              <p className="detail-original" dir="ltr" lang="en">
                {work.titleOriginal}
              </p>
            ) : null}

            <div className="row mb-2">
              {work.year ? <span className="chip chip-static">{work.year}</span> : null}
              {work.runtime ? (
                <span className="chip chip-static">
                  {work.kind === 'series' ? `${formatRuntime(work.runtime)} للحلقة` : formatRuntime(work.runtime)}
                </span>
              ) : null}
              {work.ageRating ? <span className="chip chip-static">التصنيف العمري: {work.ageRating}</span> : null}
              {work.country ? <span className="chip chip-static">{countryLabel(work.country)}</span> : null}
              {work.language ? <span className="chip chip-static">{languageLabel(work.language)}</span> : null}
            </div>

            {work.genres.length ? (
              <nav className="chips mb-4" aria-label={t('work.genres')}>
                {work.genres.map((g) => (
                  <Link key={g} href={genreUrl(g)} className="chip">
                    {genreLabel(g)}
                  </Link>
                ))}
              </nav>
            ) : null}

            <section aria-labelledby="synopsis-title">
              <h2 id="synopsis-title" style={{ fontSize: '1.15rem' }}>
                {t('work.synopsis')}
              </h2>
              <p className="prose" style={{ marginBottom: 0 }}>
                {work.synopsis}
              </p>
            </section>

            <div className="row mt-4">
              <FavoriteButton id={`${work.kind}:${work.slug}`} title={work.title} variant="inline" />
              <ShareRow title={work.title} />
            </div>
          </div>
        </header>

        <AdSlot position="top" />

        {/* ------------------------------ طاقم العمل ------------------------------ */}
        {work.directorPeople.length || work.castPeople.length ? (
          <section className="panel" aria-labelledby="people-title" style={{ marginTop: 26 }}>
            <h2 className="panel-title" id="people-title">
              الإخراج والتمثيل
            </h2>
            {work.directorPeople.length ? (
              <div className="mb-4">
                <h3 className="muted small" style={{ marginBottom: 8 }}>
                  {t('work.director')}
                </h3>
                <PersonChips people={work.directorPeople} role={t('person.director')} />
              </div>
            ) : null}
            {work.castPeople.length ? (
              <div>
                <h3 className="muted small" style={{ marginBottom: 8 }}>
                  {t('work.cast')}
                </h3>
                <PersonChips people={work.castPeople} role={t('person.actor')} />
              </div>
            ) : null}
            <p className="panel-note mt-4" style={{ marginBottom: 0 }}>
              {t('work.castNote')}
            </p>
          </section>
        ) : null}

        {/* ------------------------------ المواسم ------------------------------ */}
        {work.kind === 'series' ? <SeasonsBlock work={work} /> : null}

        {/* --------------------------- المراجعة التحريرية --------------------------- */}
        {review ? (
          <section className="panel" aria-labelledby="review-title">
            <h2 className="panel-title" id="review-title">
              {t('work.review')}
            </h2>
            <div className="row mb-2 small muted">
              <span>{t('reviews.byAuthor', { author: review.author })}</span>
              {review.date ? <span>· {formatDate(review.date)}</span> : null}
              {typeof review.rating === 'number' ? <Star value={review.rating} /> : null}
            </div>
            {review.verdict ? (
              <blockquote className="prose" style={{ marginTop: 0 }}>
                {review.verdict}
              </blockquote>
            ) : null}
            <Link href={review.url} className="section-link">
              اقرأ المراجعة كاملة ←
            </Link>
            <p className="panel-note mt-4" style={{ marginBottom: 0 }}>
              {t('site.editorialNoteLong')}
            </p>
          </section>
        ) : (
          <section className="panel panel-disabled">
            <h2 className="panel-title">{t('work.review')}</h2>
            <p className="panel-note" style={{ marginBottom: 0 }}>
              لا توجد مراجعة تحريرية لهذا العمل بعد. لا نكتب مراجعة صورية أو مولّدة تلقائيًا — المراجعات تُكتب يدويًا فقط.
            </p>
          </section>
        )}

        {/* ------------------------------ التريلر ------------------------------ */}
        {work.trailer ? (
          <TrailerEmbed trailer={work.trailer} title={work.title} />
        ) : (
          <section className="panel panel-disabled">
            <h2 className="panel-title">{t('work.trailer')}</h2>
            <p className="panel-note" style={{ marginBottom: 0 }}>
              لا يوجد تريلر رسمي موثّق ومضمّن لهذا العمل. لن نضمّن أي مقطع غير رسمي أو غير مصرّح بتضمينه.
            </p>
          </section>
        )}

        {/* --------------------------- روابط المشاهدة --------------------------- */}
        <WatchLinks work={work} />

        {/* ------------------------------ ملاحظات المحرر ------------------------------ */}
        {work.notes ? (
          <section className="panel" aria-labelledby="notes-title">
            <h2 className="panel-title" id="notes-title">
              ملاحظات تحريرية
            </h2>
            <div className="prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(work.notes) }} />
            <p className="panel-note" style={{ marginBottom: 0 }}>
              {t('work.missingInfo')}
            </p>
          </section>
        ) : null}

        {/* ------------------------------ أعمال مشابهة ------------------------------ */}
        {similar.length ? (
          <section className="section" aria-labelledby="similar-title">
            <h2 id="similar-title" style={{ fontSize: '1.3rem' }}>
              {t('work.similar')}
            </h2>
            <p className="section-sub">{t('work.similarSub')}</p>
            <div className="mt-4">
              <WorkGrid works={similar} showGenres={false} />
            </div>
          </section>
        ) : null}

        {work.demo ? (
          <Notice variant="demo">
            <span className="small">{t('site.demoBannerBody')}</span>
          </Notice>
        ) : null}

        <AdSlot position="bottom" />
      </article>
    </div>
  );
}
