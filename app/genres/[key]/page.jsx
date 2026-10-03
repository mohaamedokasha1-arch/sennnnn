import Link from 'next/link';
import { notFound } from 'next/navigation';
import siteConfig from '@/site.config.mjs';
import { t, GENRES, genreLabel } from '@/lib/i18n.mjs';
import { buildMetadata, breadcrumbJsonLd } from '@/lib/seo.mjs';
import { genresWithContent, worksInGenre } from '@/lib/content.mjs';
import { Breadcrumbs, SectionHeader, AdSlot, EmptyState } from '@/components/ui.jsx';
import { WorkGrid } from '@/components/cards.jsx';
import JsonLd from '@/components/JsonLd.jsx';

export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams() {
  return genresWithContent().map((g) => ({ key: g.key }));
}

export async function generateMetadata({ params }) {
  const { key } = await params;
  if (!GENRES[key]) return { title: 'تصنيف غير معروف' };
  const label = genreLabel(key);
  const counts = genresWithContent().find((g) => g.key === key);
  return buildMetadata({
    title: `أفلام ومسلسلات ${label}`,
    description: `أفضل ما يمكن مشاهدته في تصنيف ${label}: ${counts?.count ?? 0} عملًا منشورًا في ${siteConfig.siteName} مع القصة والتصنيفات ومراجعات تحريرية.`,
    path: `/genres/${key}/`,
  });
}

export default async function GenrePage({ params }) {
  const { key } = await params;
  if (!GENRES[key]) notFound();

  const all = worksInGenre(key, 'all');
  if (!all.length) notFound(); // تصنيف بلا محتوى = غير موجود (noindex/404 بدل صفحة فارغة)

  const movies = all.filter((w) => w.kind === 'movie');
  const series = all.filter((w) => w.kind === 'series');
  const label = genreLabel(key);
  const crumbs = [
    { name: t('nav.home'), url: '/' },
    { name: t('nav.genres'), url: '/genres/' },
    { name: label, url: `/genres/${key}/` },
  ];

  return (
    <div className="container">
      <JsonLd data={breadcrumbJsonLd(crumbs.map((c) => ({ name: c.name, url: c.url })))} />
      <Breadcrumbs items={crumbs} />

      <div className="mt-4">
        <SectionHeader
          kicker={t('nav.genres')}
          title={`${label}`}
          sub={`${t('genres.count', { n: all.length })} في تصنيف ${label} — مرتبة بحسب أحدث إضافة.`}
        />
      </div>

      {movies.length ? (
        <section className="section" aria-labelledby="g-movies">
          <h2 id="g-movies" style={{ fontSize: '1.25rem' }}>
            {t('genres.moviesIn')} {label} ({movies.length})
          </h2>
          <div className="mt-4">
            <WorkGrid works={movies} priorityCount={2} showGenres={false} />
          </div>
        </section>
      ) : null}

      {series.length ? (
        <section className="section" aria-labelledby="g-series">
          <h2 id="g-series" style={{ fontSize: '1.25rem' }}>
            {t('genres.seriesIn')} {label} ({series.length})
          </h2>
          <div className="mt-4">
            <WorkGrid works={series} showGenres={false} />
          </div>
        </section>
      ) : null}

      <AdSlot position="bottom" hidden={all.length < 6} />

      <p className="muted small center mt-6">
        <Link href="/genres/">كل التصنيفات</Link> · <Link href="/movies/">كل الأفلام</Link> ·{' '}
        <Link href="/series/">كل المسلسلات</Link>
      </p>
    </div>
  );
}
