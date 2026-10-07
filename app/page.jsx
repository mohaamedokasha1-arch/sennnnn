import Link from 'next/link';
import siteConfig from '@/site.config.mjs';
import { t } from '@/lib/i18n.mjs';
import { buildMetadata } from '@/lib/seo.mjs';
import {
  latestAdditions,
  featuredMovies,
  getSeries,
  getMovies,
  getReviews,
  getLists,
  genresWithContent,
  worksWithTrailer,
  popularWorks,
  siteStats,
} from '@/lib/content.mjs';
import { SectionHeader, Notice, Stat } from '@/components/ui.jsx';
import { AdSlot } from '@/components/Ads.jsx';
import { WorkGrid, ReviewCard, ListCard } from '@/components/cards.jsx';
import PosterImage from '@/components/PosterImage.jsx';

export const metadata = buildMetadata({
  title: 'اكتشف الأفلام والمسلسلات العربية والعالمية',
  description: siteConfig.description,
  path: '/',
  image: '/og-default.jpg',
});

/**
 * الصفحة الرئيسية: أقسام تُبنى من بيانات المحتوى الفعلية.
 * أي قسم لا يجد بيانات كافية يُخفى تلقائيًا (أو يظهر برسالة صريحة عند الضرورة).
 */
export default function HomePage() {
  const latest = latestAdditions(8);
  const featured = featuredMovies();
  const series = getSeries().slice(0, 4);
  const movies = getMovies();
  const reviews = getReviews().slice(0, 3);
  const lists = getLists().slice(0, 3);
  const genres = genresWithContent().slice(0, 6);
  const trailers = worksWithTrailer(3);
  const popular = popularWorks(6);
  const stats = siteStats();

  const heroPosters = (featured.length ? featured : latest).slice(0, 3);

  return (
    <div className="container">
      {/* ------------------------------ البانر ------------------------------ */}
      <section className="hero" aria-labelledby="hero-title">
        <div>
          <p className="hero-kicker">{t('home.heroKicker')}</p>
          <h1 id="hero-title">
            {siteConfig.siteName} — {t('home.heroTitle')}
          </h1>
          <p className="hero-lead">{siteConfig.description}</p>
          <div className="hero-actions">
            <Link href="/movies/" className="btn btn-primary">
              {t('home.heroCtaMovies')}
            </Link>
            <Link href="/genres/" className="btn btn-ghost">
              {t('home.heroCtaGenres')}
            </Link>
          </div>
          <div className="hero-stats">
            <span>
              <b>{stats.works}</b> عملًا في المكتبة
            </span>
            <span>
              <b>{stats.movies}</b> فيلمًا
            </span>
            <span>
              <b>{stats.series}</b> مسلسلًا
            </span>
            <span>
              <b>{stats.reviews}</b> مراجعة تحريرية
            </span>
          </div>
        </div>
        <div className="hero-posters" aria-hidden="true">
          {heroPosters.map((w, index) => (
            <span key={`${w.kind}:${w.slug}`} className="card-media" style={{ display: 'block' }}>
              <PosterImage
                src={w.hasPoster ? w.poster : null}
                title={w.title}
                year={w.year}
                alt=""
                width={600}
                height={900}
                loading={index === 0 ? 'eager' : 'lazy'}
                fetchPriority={index === 0 ? 'high' : undefined}
              />
            </span>
          ))}
        </div>
      </section>

      {/* مساحة إعلانية واحدة أعلى المحتوى (فارغة حاليًا) — لا تلامس المحتوى ولا تزاحمه */}
      <AdSlot zone="top" hidden={stats.works < 6} />

      {/* --------------------------- أحدث الإضافات --------------------------- */}
      {latest.length ? (
        <section className="section" aria-labelledby="latest-title">
          <SectionHeader id="latest-title" title={t('home.latest')} sub={t('home.latestSub')} href="/movies/" />
          <WorkGrid works={latest} showGenres />
        </section>
      ) : null}

      {/* --------------------------- أفلام مميزة --------------------------- */}
      {featured.length ? (
        <section className="section" aria-labelledby="featured-title">
          <SectionHeader id="featured-title" title={t('home.featured')} sub={t('home.featuredSub')} href="/movies/" />
          <WorkGrid works={featured} showGenres={false} />
        </section>
      ) : null}

      <AdSlot zone="between" hidden={stats.works < 8} />

      {/* ----------------------------- المسلسلات ----------------------------- */}
      {series.length ? (
        <section className="section" aria-labelledby="series-title">
          <SectionHeader id="series-title" title={t('home.series')} sub={t('home.seriesSub')} href="/series/" />
          <WorkGrid works={series} showGenres />
        </section>
      ) : null}

      {/* --------------------------- أفلام حسب النوع --------------------------- */}
      {genres.length ? (
        <section className="section" aria-labelledby="genres-title">
          <SectionHeader id="genres-title" title={t('home.byGenre')} sub={t('home.byGenreSub')} href="/genres/" />
          <div className="grid grid-2">
            {genres.map((g) => (
              <div key={g.key} className="panel">
                <h3 className="panel-title" style={{ marginBottom: 12 }}>
                  <Link href={g.url}>{g.label}</Link>
                </h3>
                <div className="rail" style={{ gridAutoColumns: '86px' }}>
                  {g.sample.map((w) => (
                    <Link key={`${w.kind}:${w.slug}`} href={w.url} aria-label={`${w.title} — ${g.label}`}>
                      <span className="card-media" style={{ aspectRatio: '2/3', display: 'block' }}>
                        <PosterImage
                          src={w.hasPoster ? w.poster : null}
                          title={w.title}
                          year={w.year}
                          alt=""
                          width={172}
                          height={258}
                          loading="lazy"
                        />
                      </span>
                    </Link>
                  ))}
                </div>
                <p className="muted small mt-2" style={{ marginBottom: 0 }}>
                  {t('genres.count', { n: g.count })}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* -------------------------- ترشيحات المحرر -------------------------- */}
      {lists.length ? (
        <section className="section" aria-labelledby="lists-title">
          <SectionHeader id="lists-title" title={t('home.recommendations')} sub={t('home.recommendationsSub')} href="/lists/" />
          <div className="grid grid-2">
            {lists.map((l) => (
              <ListCard key={l.slug} list={l} />
            ))}
          </div>
        </section>
      ) : null}

      {/* ---------------- الأكثر مشاهدة: يظهر فقط ببيانات حقيقية ---------------- */}
      <section className="section" aria-labelledby="popular-title">
        <SectionHeader id="popular-title" title={t('home.popular')} />
        {popular.length ? (
          <WorkGrid works={popular} />
        ) : (
          <div className="panel panel-disabled">
            <p className="panel-note" style={{ marginBottom: 0 }}>
              {t('home.popularDisabled')}
            </p>
          </div>
        )}
      </section>

      {/* --------------------------- أحدث المراجعات --------------------------- */}
      {reviews.length ? (
        <section className="section" aria-labelledby="reviews-title">
          <SectionHeader id="reviews-title" title={t('home.latestReviews')} sub={t('home.latestReviewsSub')} href="/reviews/" />
          <Notice>
            <p className="small" style={{ marginBottom: 0 }}>
              {t('site.editorialNoteLong')}
            </p>
          </Notice>
          <div className="grid grid-2 mt-4">
            {reviews.map((r) => (
              <ReviewCard key={r.slug} review={r} />
            ))}
          </div>
        </section>
      ) : null}

      {/* --------------------------- تريلرات رسمية --------------------------- */}
      <section className="section" aria-labelledby="trailers-title">
        <SectionHeader id="trailers-title" title={t('home.trailers')} sub={t('home.trailersSub')} />
        {trailers.length ? (
          <div className="grid grid-2">
            {trailers.map((w) => (
              <article key={`${w.kind}:${w.slug}`} className="panel">
                <h3 className="panel-title">
                  <Link href={w.url}>{w.title}</Link>
                </h3>
                <div className="trailer-frame">
                  <iframe
                    src={
                      w.trailer.url
                        ? w.trailer.url.replace(/^(https:\/\/[^/]+\/)(?:watch|play)\.php\?vid=([\w-]+)$/i, '$1embed.php?vid=$2')
                        : w.trailer.provider === 'youtube'
                          ? `https://www.youtube-nocookie.com/embed/${w.trailer.id}?rel=0&modestbranding=1&hl=ar`
                          : `https://player.vimeo.com/video/${w.trailer.id}`
                    }
                    data-original-url={w.trailer.url || undefined}
                    title={`${t('work.trailer')}: ${w.title}`}
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-cross-origin"
                  />
                </div>
                <p className="panel-note mt-2" style={{ marginBottom: 0 }}>
                  {t('work.trailerNote')}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <div className="panel panel-disabled">
            <p className="panel-note" style={{ marginBottom: 0 }}>
              {t('home.trailersEmpty')}
            </p>
          </div>
        )}
      </section>

      {/* --------------------------- إحصاءات الموقع --------------------------- */}
      <section className="section" aria-labelledby="stats-title">
        <SectionHeader id="stats-title" title="المكتبة بالأرقام" sub="أرقام محسوبة من ملفات المحتوى الفعلية داخل الموقع" />
        <div className="stat-row">
          <Stat value={stats.works} label="عمل منشور" />
          <Stat value={stats.people} label="شخص في الدليل" />
          <Stat value={stats.reviews} label="مراجعة تحريرية" />
          <Stat value={stats.lists} label="قائمة ترشيحات" />
          <Stat value={stats.trailers} label="تريلر رسمي مضمّن" />
          <Stat value={stats.watchLinks} label="رابط مشاهدة رسمي" />
        </div>
      </section>

      <AdSlot zone="bottom" hidden={stats.works < 6} />
    </div>
  );
}
