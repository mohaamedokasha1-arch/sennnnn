import Link from 'next/link';
import { notFound } from 'next/navigation';
import { t } from '@/lib/i18n.mjs';
import { buildMetadata, reviewJsonLd, breadcrumbJsonLd } from '@/lib/seo.mjs';
import { getReviews, getReview } from '@/lib/content.mjs';
import { renderMarkdown } from '@/lib/markdown.mjs';
import { readingTime, formatDate } from '@/lib/format.mjs';
import { Breadcrumbs, Notice } from '@/components/ui.jsx';
import { AdSlot } from '@/components/Ads.jsx';
import JsonLd from '@/components/JsonLd.jsx';
import ShareRow from '@/components/ShareRow.jsx';


export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams() {
  const items = getReviews();
  // في وضع التصدير الثابت لا يقبل Next مسارًا ديناميكيًا بلا أي صفحة مُولَّدة،
  // لذلك عند غياب المحتوى نولّد مسارًا داخليًا واحدًا يعرض صفحة «الصفحة غير موجودة» (noindex).
  // يختفي هذا المسار تلقائيًا بمجرد إضافة أول عنصر، ولا يُدرج في الخريطة ولا يُفهرس.
  return items.length ? items.map((r) => ({ slug: r.slug })) : [{ slug: '__no-content__' }];
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const review = getReview(slug);
  if (!review) {
    return buildMetadata({ title: 'الصفحة غير موجودة', description: 'لم نجد هذه المراجعة.', path: `/reviews/${slug}/`, robots: { index: false, follow: true } });
  }
  return buildMetadata({
    title: review.title,
    description: review.excerpt,
    path: review.url,
    image: review.work?.hasPoster ? review.work.poster : null,
    type: 'article',
    publishedTime: review.date,
    modifiedTime: review.updatedAt ?? review.date,
    authors: review.author,
  });
}

export default async function ReviewPage({ params }) {
  const { slug } = await params;
  const review = getReview(slug);
  if (!review) notFound();

  const crumbs = [
    { name: t('nav.home'), url: '/' },
    { name: t('nav.reviews'), url: '/reviews/' },
    { name: review.title, url: review.url },
  ];

  return (
    <div className="container">
      <JsonLd data={[reviewJsonLd(review), breadcrumbJsonLd(crumbs.map((c) => ({ name: c.name, url: c.url })))]} />
      <Breadcrumbs items={crumbs} />

      <article className="legal" style={{ maxWidth: 820, marginTop: 18 }}>
        <div className="chips mb-2">
          <span className="chip chip-static chip-type">{t('site.editorialNote')}</span>
        </div>

        <h1>{review.title}</h1>

        <p className="updated">
          {t('reviews.byAuthor', { author: review.author })} · {formatDate(review.date)} ·{' '}
          {t('site.minRead')}: {readingTime(review.body)}
          {typeof review.rating === 'number' ? ` · ${t('reviews.ratingLabel')}: ${review.rating}/10` : ''}
        </p>

        {review.work ? (
          <div className="panel mb-4">
            <div className="spread">
              <div>
                <p className="muted small" style={{ margin: 0 }}>
                  {t('reviews.relatedWork')}
                </p>
                <h2 style={{ margin: '4px 0 0', fontSize: '1.1rem' }}>
                  <Link href={review.work.url}>
                    {review.work.title}
                    {review.work.year ? ` (${review.work.year})` : ''}
                  </Link>
                </h2>
              </div>
              <Link href={review.work.url} className="btn btn-ghost btn-sm">
                صفحة العمل
              </Link>
            </div>
          </div>
        ) : null}

        {review.verdict ? (
          <blockquote className="prose" style={{ borderInlineStart: '3px solid var(--accent)' }}>
            <strong>{t('reviews.verdict')}: </strong>
            {review.verdict}
          </blockquote>
        ) : null}

        <div className="prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(review.body) }} />

        <Notice>
          <p className="small" style={{ marginBottom: 0 }}>
            {t('site.editorialNoteLong')}
          </p>
        </Notice>

        <div className="mt-6">
          <ShareRow title={review.title} />
        </div>

        <p className="muted small mt-6">
          <Link href="/reviews/">كل المراجعات</Link> · <Link href="/movies/">الأفلام</Link> ·{' '}
          <Link href="/series/">المسلسلات</Link>
        </p>
      </article>

      <AdSlot zone="bottom" />
    </div>
  );
}
