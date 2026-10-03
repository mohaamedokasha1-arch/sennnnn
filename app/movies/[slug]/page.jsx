import { notFound } from 'next/navigation';
import { t } from '@/lib/i18n.mjs';
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
    return buildMetadata({ title: 'الصفحة غير موجودة', description: 'لم نجد هذا الفيلم في المكتبة.', path: `/movies/${slug}/`, robots: { index: false, follow: true } });
  }
  const desc = `${work.title}${work.year ? ` (${work.year})` : ''}: ${work.synopsis}`;
  return buildMetadata({
    title: work.title,
    description: desc,
    path: work.url,
    image: work.hasPoster ? work.poster : null,
    type: 'video.movie',
  });
}

export default async function MoviePage({ params }) {
  const { slug } = await params;
  const work = getWork('movie', slug);
  if (!work) notFound();
  return <WorkDetail work={work} />;
}
