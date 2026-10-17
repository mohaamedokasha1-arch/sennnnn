import { notFound } from 'next/navigation';
import { buildMetadata } from '@/lib/seo.mjs';
import { getWork, publicDataStatus } from '@/lib/public-data.mjs';
import WorkDetail from '@/components/WorkDetail.jsx';
import PublicUnavailable from '@/components/PublicUnavailable.jsx';

/**
 * مسار قديم متوافق (/movie/<slug>/). يبقى متاحًا لحفظ الروابط السابقة،
 * لكن canonical يشير دائمًا إلى المسار الأساسي المحدد في بيانات العمل.
 */
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const work = await getWork('movie', slug);
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

export default async function MovieAliasPage({ params }) {
  const { slug } = await params;
  const work = await getWork('movie', slug);
  if (!work) {
    if ((await publicDataStatus()).unavailable) return <PublicUnavailable locale="ar" />;
    notFound();
  }
  return <WorkDetail work={work} locale="ar" basePath={work.url} />;
}
