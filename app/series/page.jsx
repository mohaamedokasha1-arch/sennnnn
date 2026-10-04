import Link from 'next/link';
import siteConfig from '@/site.config.mjs';
import { t } from '@/lib/i18n.mjs';
import { buildMetadata } from '@/lib/seo.mjs';
import { getSeries, facets } from '@/lib/content.mjs';
import { Breadcrumbs, SectionHeader } from '@/components/ui.jsx';
import { AdSlot } from '@/components/Ads.jsx';
import FilterBar from '@/components/FilterBar.jsx';

export const metadata = buildMetadata({
  title: t('series.title'),
  description: `كل المسلسلات المنشورة في ${siteConfig.siteName}: بيانات المواسم والحلقات عند توفرها، حالة المسلسل، ومراجعات تحريرية — مع فلاتر بالنوع والسنة واللغة.`,
  path: '/series/',
});

export const dynamic = 'force-static';

export default function SeriesPage() {
  const series = getSeries();
  const f = facets('series');

  const items = series.map((s) => ({
    kind: s.kind,
    slug: s.slug,
    url: s.url,
    title: s.title,
    titleOriginal: s.titleOriginal,
    year: s.year,
    genres: s.genres,
    language: s.language,
    country: s.country,
    poster: s.hasPoster ? s.poster : null,
    hasPoster: s.hasPoster,
    addedAt: s.addedAt,
    seriesStatus: s.seriesStatus,
  }));

  return (
    <div className="container">
      <Breadcrumbs items={[{ name: t('nav.home'), url: '/' }, { name: t('nav.series') }]} />

      <div className="mt-4">
        <SectionHeader kicker="المكتبة" title={t('series.title')} sub={t('series.intro')} />
      </div>

      <FilterBar items={items} facets={f} showStatus emptyText={t('empty.series')} />

      <AdSlot zone="bottom" hidden={series.length < 6} />

      <p className="muted small center mt-6">
        تفضّل الأفلام؟ <Link href="/movies/">تصفّح صفحة الأفلام</Link> · أو جرّب{' '}
        <Link href="/lists/">ترشيحات المحرر</Link>.
      </p>
    </div>
  );
}
