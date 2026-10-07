import Link from 'next/link';
import siteConfig from '@/site.config.mjs';
import { t } from '@/lib/i18n.mjs';
import { getMovies, getSeries, facets } from '@/lib/content.mjs';
import { DEFAULT_PAGE_SIZE } from '@/lib/filter.mjs';
import { Breadcrumbs, SectionHeader } from '@/components/ui.jsx';
import { AdSlot } from '@/components/Ads.jsx';
import FilterBar from '@/components/FilterBar.jsx';

/** Shared server-rendered movie/series catalog. Pagination links remain ordinary crawlable URLs. */
export default function CatalogListing({ kind, page = 1 }) {
  const isMovie = kind === 'movie';
  const works = isMovie ? getMovies() : getSeries();
  const section = isMovie ? 'movies' : 'series';
  const basePath = isMovie ? '/movies/' : '/series/';
  const title = t(`${section}.title`);
  const pageTitle = page > 1 ? `${title} — الصفحة ${page}` : title;
  const pageCount = Math.max(1, Math.ceil(works.length / DEFAULT_PAGE_SIZE));
  const items = works.map((work) => ({
    kind: work.kind,
    slug: work.slug,
    url: work.url,
    title: work.title,
    titleOriginal: work.titleOriginal,
    year: work.year,
    genres: work.genres,
    language: work.language,
    country: work.country,
    poster: work.hasPoster ? work.poster : null,
    hasPoster: work.hasPoster,
    posterDesign: work.posterDesign,
    posterAlt: work.posterAlt,
    addedAt: work.addedAt,
    seriesStatus: isMovie ? null : work.seriesStatus,
  }));

  const breadcrumbs = [
    { name: t('nav.home'), url: '/' },
    { name: title, url: basePath },
    ...(page > 1 ? [{ name: `الصفحة ${page}`, url: `${basePath}page/${page}/` }] : []),
  ];
  const description = page > 1
    ? `${t(`${section}.intro`)} الصفحة ${page} من ${pageCount} في مكتبة ${siteConfig.siteName}.`
    : t(`${section}.intro`);

  return (
    <div className="container">
      <Breadcrumbs items={breadcrumbs} />

      <div className="mt-4">
        <SectionHeader
          as="h1"
          kicker="المكتبة"
          title={pageTitle}
          sub={description}
        />
      </div>

      <FilterBar
        items={items}
        facets={facets(kind)}
        showStatus={!isMovie}
        initialPage={page}
        basePath={basePath}
        emptyText={t(`empty.${section}`)}
      />

      <AdSlot zone="bottom" hidden={works.length < 6} />

      {isMovie ? (
        <p className="muted small center mt-6">
          تفضّل المسلسلات؟ <Link href="/series/">تصفّح صفحة المسلسلات</Link> · أو ابدأ من{' '}
          <Link href="/genres/">التصنيفات</Link>.
        </p>
      ) : (
        <p className="muted small center mt-6">
          تفضّل الأفلام؟ <Link href="/movies/">تصفّح صفحة الأفلام</Link> · أو جرّب{' '}
          <Link href="/lists/">ترشيحات المحرر</Link>.
        </p>
      )}
    </div>
  );
}
