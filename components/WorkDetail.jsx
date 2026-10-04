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
 * مكوّن صفحة تفاصيل العمل (فيلم أو مسلسل) — يُستخدم في مسارين مختلفين، ويدعم العربية (RTL) والإنجليزية (LTR).
 * كل قسم يعتمد على وجود بيانات فعلية: إن غابت البيانات يختفي القسم أو تظهر رسالة صريحة،
 * ولا نعرض أبدًا قيمة فارغة أو قسمًا شبه فارغ.
 */
export default function WorkDetail({ work, locale = 'ar', basePath = null }) {
  const isEn = locale === 'en';
  const dir = isEn ? 'ltr' : 'rtl';
  const review = getReviewForWork(work);
  const similar = similarWorks(work, 6);
  const kindLabel = typeLabel(work.kind, locale);
  const genitive = work.kind === 'series' ? 'مسلسل' : 'فيلم';

  const canonicalArPath = basePath || work.url;
  const altEnPath = `/en${canonicalArPath}`;
  const currentUrl = isEn ? altEnPath : canonicalArPath;

  const displayTitle = isEn
    ? work.headingEn || (work.titleOriginal ? `${work.titleOriginal}${work.year ? ` (${work.year})` : ''}` : work.title)
    : work.isSubtitled && work.headingSubtitled
      ? work.headingSubtitled
      : work.heading || work.title;

  const crumbName = isEn ? work.titleOriginal || work.title : work.title;
  const crumbs = [
    { name: t('nav.home', null, locale), url: '/' },
    {
      name: work.kind === 'series' ? t('nav.series', null, locale) : t('nav.movies', null, locale),
      url: work.kind === 'series' ? '/series/' : '/movies/',
    },
    { name: crumbName, url: currentUrl },
  ];

  const ld = [workJsonLd(work, locale), breadcrumbJsonLd(crumbs.map((c) => ({ name: c.name, url: c.url })))];
  if (review && !isEn) ld.push(reviewJsonLd(review));

  const posterAlt = isEn
    ? work.posterAltEn || `Official poster for ${work.titleOriginal || work.title}${work.year ? ` (${work.year})` : ''}`
    : work.posterAlt ||
      `بوستر ${genitive} ${work.title}${work.titleOriginal ? ` (${work.titleOriginal})` : ''}${work.year ? ` ${work.year}` : ''}`;

  const synopsisText = isEn && work.synopsisEn ? work.synopsisEn : work.synopsis;
  const notesText = isEn && work.notesEn ? work.notesEn : work.notes;
  const subtitlesText = work.isSubtitled
    ? t('work.subtitlesBadge', null, locale)
    : isEn
      ? work.subtitlesEn || work.subtitles
      : work.subtitles;
  const ageNote = isEn ? work.ageRatingNoteEn || work.ageRatingNote : work.ageRatingNote;

  const hasExtendedDetails = Boolean(
    work.releaseDateEG || work.subtitles || work.isSubtitled || (work.titleOriginal && work.title)
  );

  return (
    <div className="container" dir={dir} lang={isEn ? 'en' : 'ar'}>
      <JsonLd data={ld} />

      <div className="spread" style={{ alignItems: 'center' }}>
        <Breadcrumbs items={crumbs} />
        {work.kind === 'movie' ? (
          <div className="mt-4">
            <Link
              href={isEn ? canonicalArPath : altEnPath}
              className="btn btn-ghost btn-sm"
              hrefLang={isEn ? 'ar' : 'en'}
              lang={isEn ? 'ar' : 'en'}
              aria-label={isEn ? 'التبديل إلى النسخة العربية' : 'Switch to English version'}
            >
              🌐 {isEn ? t('work.langSwitchAr', null, 'ar') : t('work.langSwitchEn', null, 'en')}
            </Link>
          </div>
        ) : null}
      </div>

      <article className="mt-4">
        <header className="detail-head">
          <div className="detail-poster" style={work.hasPoster ? { aspectRatio: 'auto' } : undefined}>
            {work.hasPoster ? (
              <img
                src={work.poster}
                alt={posterAlt}
                width={640}
                height={800}
                fetchPriority="high"
                decoding="async"
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            ) : (
              <PosterFallback title={isEn ? work.titleOriginal || work.title : work.title} year={work.year} />
            )}
          </div>

          <div>
            <div className="chips mb-2">
              <span className="chip chip-static chip-type">{kindLabel}</span>
              {work.isSubtitled ? (
                <span className="badge badge-accent">{t('work.subtitlesBadge', null, locale)}</span>
              ) : null}
              {work.demo ? <DemoBadge /> : null}
              {work.kind === 'series' && work.seriesStatus ? (
                <span className="chip chip-static">{statusLabel(work.seriesStatus, locale)}</span>
              ) : null}
            </div>

            <h1 className="detail-title">{displayTitle}</h1>
            {work.titleOriginal ? (
              <p className="detail-original">
                {isEn ? (
                  <>
                    <span dir="rtl" lang="ar">
                      {work.title}
                    </span>
                    {work.year ? ` · ${work.year}` : ''}
                  </>
                ) : (
                  <>
                    <span>{work.title}</span>
                    {' · '}
                    <span dir="ltr" lang="en">
                      {work.titleOriginal}
                    </span>
                    {work.year ? ` (${work.year})` : ''}
                  </>
                )}
              </p>
            ) : null}

            <div className="row mb-2">
              {work.year ? <span className="chip chip-static">{work.year}</span> : null}
              {work.releaseDateEG ? (
                <span className="chip chip-static">
                  {t('work.releaseDateEG', null, locale)}: {formatDate(work.releaseDateEG, locale)}
                </span>
              ) : null}
              {work.runtime ? (
                <span className="chip chip-static">
                  {work.kind === 'series'
                    ? isEn
                      ? `${formatRuntime(work.runtime, locale)} / ep`
                      : `${formatRuntime(work.runtime, locale)} للحلقة`
                    : formatRuntime(work.runtime, locale)}
                </span>
              ) : null}
              {work.ageRating ? (
                <span className="chip chip-static">
                  {t('work.ageRating', null, locale)}: {work.ageRating}
                  {ageNote ? ` (${ageNote})` : ''}
                </span>
              ) : null}
              {work.country ? <span className="chip chip-static">{countryLabel(work.country, locale)}</span> : null}
              {work.language ? <span className="chip chip-static">{languageLabel(work.language, locale)}</span> : null}
            </div>

            {work.genres.length ? (
              <nav className="chips mb-4" aria-label={t('work.genres', null, locale)}>
                {work.genres.map((g) => (
                  <Link key={g} href={genreUrl(g)} className="chip">
                    {genreLabel(g, locale)}
                  </Link>
                ))}
              </nav>
            ) : null}

            {hasExtendedDetails ? (
              <dl className="meta-grid" aria-label={t('work.details', null, locale)}>
                {work.title ? (
                  <div className="meta-item">
                    <dt>{t('work.arabicTitle', null, locale)}</dt>
                    <dd dir="rtl" lang="ar">
                      {work.title}
                    </dd>
                  </div>
                ) : null}
                {work.titleOriginal ? (
                  <div className="meta-item">
                    <dt>{t('work.englishTitle', null, locale)}</dt>
                    <dd dir="ltr" lang="en">
                      {work.titleOriginal}
                    </dd>
                  </div>
                ) : null}
                {work.year ? (
                  <div className="meta-item">
                    <dt>{t('work.releaseYear', null, locale)}</dt>
                    <dd>{work.year}</dd>
                  </div>
                ) : null}
                {work.releaseDateEG ? (
                  <div className="meta-item">
                    <dt>{t('work.releaseDateEG', null, locale)}</dt>
                    <dd>{formatDate(work.releaseDateEG, locale)}</dd>
                  </div>
                ) : null}
                {work.language ? (
                  <div className="meta-item">
                    <dt>{t('work.originalLanguage', null, locale)}</dt>
                    <dd>{languageLabel(work.language, locale)}</dd>
                  </div>
                ) : null}
                {subtitlesText ? (
                  <div className="meta-item">
                    <dt>{t('work.subtitles', null, locale)}</dt>
                    <dd>{subtitlesText}</dd>
                  </div>
                ) : null}
                {work.ageRating ? (
                  <div className="meta-item">
                    <dt>{t('work.ageRating', null, locale)}</dt>
                    <dd>
                      {work.ageRating}
                      {ageNote ? <span className="muted small"> — {ageNote}</span> : null}
                    </dd>
                  </div>
                ) : null}
                {work.runtime ? (
                  <div className="meta-item">
                    <dt>{t('work.runtime', null, locale)}</dt>
                    <dd>{formatRuntime(work.runtime, locale)}</dd>
                  </div>
                ) : null}
              </dl>
            ) : null}

            <section aria-labelledby="synopsis-title">
              <h2 id="synopsis-title" style={{ fontSize: '1.15rem' }}>
                {t('work.synopsis', null, locale)}
              </h2>
              <p className="prose" style={{ marginBottom: 0 }}>
                {synopsisText}
              </p>
            </section>

            <div className="row mt-4">
              <FavoriteButton id={`${work.kind}:${work.slug}`} title={work.title} variant="inline" />
              <ShareRow title={displayTitle} locale={locale} />
            </div>
          </div>
        </header>

        <AdSlot position="top" />

        {/* ------------------------------ طاقم العمل ------------------------------ */}
        {work.directorPeople.length || work.writerPeople?.length || work.castPeople.length ? (
          <section className="panel" aria-labelledby="people-title" style={{ marginTop: 26 }}>
            <h2 className="panel-title" id="people-title">
              {work.writerPeople?.length
                ? t('work.crewTitle', null, locale)
                : isEn
                  ? 'Direction & Cast'
                  : 'الإخراج والتمثيل'}
            </h2>
            {work.directorPeople.length ? (
              <div className="mb-4">
                <h3 className="muted small" style={{ marginBottom: 8 }}>
                  {t('work.director', null, locale)}
                </h3>
                <PersonChips
                  people={work.directorPeople}
                  role={t('person.director', null, locale)}
                  locale={locale}
                />
              </div>
            ) : null}
            {work.writerPeople?.length ? (
              <div className="mb-4">
                <h3 className="muted small" style={{ marginBottom: 8 }}>
                  {t('work.writers', null, locale)}
                </h3>
                <PersonChips people={work.writerPeople} role={t('person.writer', null, locale)} locale={locale} />
              </div>
            ) : null}
            {work.castPeople.length ? (
              <div>
                <h3 className="muted small" style={{ marginBottom: 8 }}>
                  {t('work.cast', null, locale)}
                </h3>
                <PersonChips people={work.castPeople} role={t('person.actor', null, locale)} locale={locale} />
              </div>
            ) : null}
            <p className="panel-note mt-4" style={{ marginBottom: 0 }}>
              {t('work.castNote', null, locale)}
            </p>
          </section>
        ) : null}

        {/* ------------------------------ المواسم ------------------------------ */}
        {work.kind === 'series' ? <SeasonsBlock work={work} /> : null}

        {/* ------------------------------ التريلر ------------------------------ */}
        {work.trailer ? (
          <TrailerEmbed trailer={work.trailer} title={displayTitle} locale={locale} />
        ) : (
          <section className="panel panel-disabled" id="trailer-section" aria-labelledby="trailer-title">
            <h2 className="panel-title" id="trailer-title">
              {t('work.trailer', null, locale)}
            </h2>
            <p className="panel-note" style={{ marginBottom: 0 }}>
              {t('work.trailerPending', null, locale)}
            </p>
          </section>
        )}

        {/* --------------------------- روابط المشاهدة --------------------------- */}
        <WatchLinks work={work} locale={locale} />

        {/* --------------------------- المراجعة التحريرية --------------------------- */}
        {review ? (
          <section className="panel" aria-labelledby="review-title">
            <h2 className="panel-title" id="review-title">
              {t('work.review', null, locale)}
            </h2>
            <div className="row mb-2 small muted">
              <span>{t('reviews.byAuthor', { author: review.author }, locale)}</span>
              {review.date ? <span>· {formatDate(review.date, locale)}</span> : null}
              {typeof review.rating === 'number' ? <Star value={review.rating} locale={locale} /> : null}
            </div>
            {review.verdict ? (
              <blockquote className="prose" style={{ marginTop: 0 }}>
                {review.verdict}
              </blockquote>
            ) : null}
            <Link href={review.url} className="section-link">
              {isEn ? 'Read full review →' : 'اقرأ المراجعة كاملة ←'}
            </Link>
            <p className="panel-note mt-4" style={{ marginBottom: 0 }}>
              {t('site.editorialNoteLong', null, locale)}
            </p>
          </section>
        ) : (
          <section className="panel panel-disabled" aria-labelledby="review-title">
            <h2 className="panel-title" id="review-title">
              {t('work.review', null, locale)}
            </h2>
            <p className="panel-note" style={{ marginBottom: 0 }}>
              {t('work.reviewEmpty', null, locale)}
            </p>
          </section>
        )}

        {/* ------------------------------ ملاحظات المحرر ------------------------------ */}
        {notesText ? (
          <section className="panel" aria-labelledby="notes-title">
            <h2 className="panel-title" id="notes-title">
              {t('work.notes', null, locale)}
            </h2>
            <div className="prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(notesText) }} />
            <p className="panel-note" style={{ marginBottom: 0 }}>
              {t('work.missingInfo', null, locale)}
            </p>
          </section>
        ) : null}

        {/* ------------------------------ أعمال مشابهة ------------------------------ */}
        {similar.length ? (
          <section className="section" aria-labelledby="similar-title">
            <h2 id="similar-title" style={{ fontSize: '1.3rem' }}>
              {t('work.similar', null, locale)}
            </h2>
            <p className="section-sub">{t('work.similarSub', null, locale)}</p>
            <div className="mt-4" dir="rtl">
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
