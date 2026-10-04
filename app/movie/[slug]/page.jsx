import { notFound } from 'next/navigation';
import { buildMetadata } from '@/lib/seo.mjs';
import { getMovies, getWork } from '@/lib/content.mjs';
import WorkDetail from '@/components/WorkDetail.jsx';

/**
 * مسار مرادف لصفحة الفيلم (/movie/<slug>/) مع توجيه Canonical للرابط الأساسي
 * حتى يعمل كلٌّ من /movie/digger-2026/ و /movies/digger-2026/ بكفاءة ودون تكرار محتوى في محركات البحث.
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
      title: 'الصفحة غير موجودة',
      description: 'لم نجد هذا الفيلم في المكتبة.',
      path: `/movie/${slug}/`,
      robots: { index: false, follow: true },
    });
  }
  const seoTitle =
    work.isSubtitled && work.seoTitleSubtitled
      ? work.seoTitleSubtitled
      : work.seoTitle || work.title;
  const desc = work.seoDescription || `${work.title}${work.year ? ` (${work.year})` : ''}: ${work.synopsis}`;
  return buildMetadata({
    title: seoTitle,
    description: desc,
    path: `/movie/${slug}/`,
    canonical: `/movie/${slug}/`,
    languages: {
      ar: `/movie/${slug}/`,
      en: `/en/movie/${slug}/`,
      'x-default': `/movie/${slug}/`,
    },
    image: work.hasPoster ? work.poster : null,
    imageAlt: work.posterAlt || `بوستر فيلم ${work.title}${work.year ? ` (${work.year})` : ''}`,
    type: 'video.movie',
    locale: 'ar',
  });
}

export default async function MovieAliasPage({ params }) {
  const { slug } = await params;
  const work = getWork('movie', slug);
  if (!work) notFound();
  return <WorkDetail work={work} locale="ar" basePath={`/movie/${slug}/`} />;
}
