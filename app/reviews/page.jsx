import siteConfig from '@/site.config.mjs';
import { t } from '@/lib/i18n.mjs';
import { buildMetadata, noIndex } from '@/lib/seo.mjs';
import { getReviews } from '@/lib/content.mjs';
import { Breadcrumbs, SectionHeader, Notice, EmptyState } from '@/components/ui.jsx';
import { AdSlot } from '@/components/Ads.jsx';
import { ReviewCard } from '@/components/cards.jsx';

const publishedReviews = getReviews();

export const metadata = buildMetadata({
  title: t('reviews.title'),
  description: `مراجعات أصلية كتبها فريق ${siteConfig.siteName}: تحليل ونقد وخلاصة لكل عمل، مع توضيح دائم أنها آراء تحريرية لا أحكام نهائية.`,
  path: '/reviews/',
  robots: publishedReviews.length ? undefined : noIndex,
});

export const dynamic = 'force-static';

export default function ReviewsPage() {
  const reviews = getReviews();

  return (
    <div className="container">
      <Breadcrumbs items={[{ name: t('nav.home'), url: '/' }, { name: t('nav.reviews'), url: '/reviews/' }]} />
      <div className="mt-4">
        <SectionHeader as="h1" kicker="نقد تحريري" title={t('reviews.title')} sub={t('reviews.intro')} />
      </div>

      <Notice>
        <strong>{t('site.editorialNote')}</strong>
        <p className="small" style={{ marginBottom: 0 }}>
          {t('site.editorialNoteLong')} المراجعات مكتوبة يدويًا لـ{siteConfig.siteName}، ولا تُنقل من أي مصدر آخر,
          ولا تُنشأ آليًا.
        </p>
      </Notice>

      {reviews.length ? (
        <div className="grid grid-2 mt-6">
          {reviews.map((r) => (
            <ReviewCard key={r.slug} review={r} />
          ))}
        </div>
      ) : (
        <div className="mt-6">
          <EmptyState
            icon="✍️"
            title="لا توجد مراجعات منشورة بعد"
            body="نكتب المراجعات يدويًا وننشرها فقط عندما تكون جاهزة. لا نستخدم مراجعات مولّدة آليًا."
            actions={[{ href: '/movies/', label: t('nav.movies'), primary: true }]}
          />
        </div>
      )}

      <AdSlot zone="bottom" hidden={reviews.length < 4} />
    </div>
  );
}
