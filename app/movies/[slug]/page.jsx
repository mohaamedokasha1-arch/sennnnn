import { notFound } from 'next/navigation';
import { buildMetadata } from '@/lib/seo.mjs';
import { getMovies, getWork } from '@/lib/content.mjs';
import WorkDetail from '@/components/WorkDetail.jsx';

/**
 * صفحة تفاصيل الفيلم — تُولَّد صفحة ثابتة لكل فيلم (Static Export).
 * الرابط ثابت وقصير: /movies/<slug>/ ولا يتغير بتغير ترتيب البيانات.
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
      path: `/movies/${slug}/`,
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
    path: work.url,
    canonical: work.url,
    languages: work.synopsisEn
      ? {
          ar: work.url,
          en: `/en${work.url}`,
          'x-default': work.url,
        }
      : null,
    image: work.hasPoster ? work.poster : null,
    imageAlt: work.posterAlt || `بوستر فيلم ${work.title}${work.year ? ` (${work.year})` : ''}`,
    type: 'video.movie',
    locale: 'ar',
  });
}

export default async function MoviePage({ params }) {
  const { slug } = await params;
  const work = getWork('movie', slug);
  if (!work) notFound();
  return <WorkDetail work={work} locale="ar" basePath={work.url} />;
}
