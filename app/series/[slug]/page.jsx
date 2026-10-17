import { notFound } from 'next/navigation';
import { buildMetadata } from '@/lib/seo.mjs';
import { getWork, publicDataStatus } from '@/lib/public-data.mjs';
import WorkDetail from '@/components/WorkDetail.jsx';
import PublicUnavailable from '@/components/PublicUnavailable.jsx';

/** صفحة تفاصيل المسلسل — نفس منطق صفحة الفيلم مع بيانات المواسم والحالة */

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const work = await getWork('series', slug);
  if (!work) {
    return buildMetadata({ title: 'الصفحة غير موجودة', description: 'لم نجد هذا المسلسل في المكتبة.', path: `/series/${slug}/`, robots: { index: false, follow: true } });
  }
  const seoTitle = work.seoTitle || work.title;
  const desc = work.seoDescription || `${work.title}${work.year ? ` (${work.year})` : ''}: ${work.synopsis}`;
  return buildMetadata({
    title: seoTitle,
    description: desc,
    path: work.url,
    image: work.hasPoster ? work.poster : null,
    type: 'video.tv_show',
  });
}

export default async function SeriesDetailPage({ params }) {
  const { slug } = await params;
  const work = await getWork('series', slug);
  if (!work) {
    if ((await publicDataStatus()).unavailable) return <PublicUnavailable locale="ar" />;
    notFound();
  }
  return <WorkDetail work={work} />;
}
