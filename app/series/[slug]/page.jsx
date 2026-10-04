import { notFound } from 'next/navigation';
import { buildMetadata } from '@/lib/seo.mjs';
import { getSeries, getWork } from '@/lib/content.mjs';
import WorkDetail from '@/components/WorkDetail.jsx';

/** صفحة تفاصيل المسلسل — نفس منطق صفحة الفيلم مع بيانات المواسم والحالة */

export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams() {
  const items = getSeries();
  // في وضع التصدير الثابت لا يقبل Next مسارًا ديناميكيًا بلا أي صفحة مُولَّدة،
  // لذلك عند غياب المحتوى نولّد مسارًا داخليًا واحدًا يعرض صفحة «الصفحة غير موجودة» (noindex).
  // يختفي هذا المسار تلقائيًا بمجرد إضافة أول عنصر، ولا يُدرج في الخريطة ولا يُفهرس.
  return items.length ? items.map((s) => ({ slug: s.slug })) : [{ slug: '__no-content__' }];
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const work = getWork('series', slug);
  if (!work) {
    return buildMetadata({ title: 'الصفحة غير موجودة', description: 'لم نجد هذا المسلسل في المكتبة.', path: `/series/${slug}/`, robots: { index: false, follow: true } });
  }
  const desc = `${work.title}${work.year ? ` (${work.year})` : ''}: ${work.synopsis}`;
  return buildMetadata({
    title: work.title,
    description: desc,
    path: work.url,
    image: work.hasPoster ? work.poster : null,
    type: 'video.tv_show',
  });
}

export default async function SeriesDetailPage({ params }) {
  const { slug } = await params;
  const work = getWork('series', slug);
  if (!work) notFound();
  return <WorkDetail work={work} />;
}
