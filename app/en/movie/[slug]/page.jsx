import { notFound } from 'next/navigation';
import { buildMetadata } from '@/lib/seo.mjs';
import { getMovies, getWork } from '@/lib/content.mjs';
import WorkDetail from '@/components/WorkDetail.jsx';

/**
 * English (LTR) Movie Alias Page (/en/movie/<slug>/).
 */
export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams() {
  return getMovies().map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const work = getWork('movie', slug);
  if (!work) {
    return buildMetadata({
      title: 'Page Not Found',
      description: 'Movie not found in the catalog.',
      path: `/en/movie/${slug}/`,
      robots: { index: false, follow: true },
      locale: 'en',
    });
  }
  const enTitle = work.seoTitleEn || `${work.titleOriginal || work.title}${work.year ? ` (${work.year})` : ''} | Story, Cast & Official Trailer`;
  const desc =
    work.seoDescriptionEn ||
    `${work.titleOriginal || work.title}${work.year ? ` (${work.year})` : ''}: ${work.synopsisEn || work.synopsis}`;
  return buildMetadata({
    title: enTitle,
    description: desc,
    path: `/en/movie/${slug}/`,
    canonical: `/en/movie/${slug}/`,
    languages: {
      ar: `/movie/${slug}/`,
      en: `/en/movie/${slug}/`,
      'x-default': `/movie/${slug}/`,
    },
    image: work.hasPoster ? work.poster : null,
    imageAlt: work.posterAltEn || `Official poster for ${work.titleOriginal || work.title}${work.year ? ` (${work.year})` : ''}`,
    type: 'video.movie',
    locale: 'en',
  });
}

export default async function MovieAliasPageEn({ params }) {
  const { slug } = await params;
  const work = getWork('movie', slug);
  if (!work) notFound();
  return <WorkDetail work={work} locale="en" basePath={`/movie/${slug}/`} />;
}
