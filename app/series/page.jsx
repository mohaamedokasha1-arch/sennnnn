import siteConfig from '@/site.config.mjs';
import { t } from '@/lib/i18n.mjs';
import { buildMetadata } from '@/lib/seo.mjs';
import CatalogListing from '@/components/CatalogListing.jsx';

export const metadata = buildMetadata({
  title: t('series.title'),
  description: `كل المسلسلات المنشورة في ${siteConfig.siteName}: بيانات المواسم والحلقات عند توفرها، وحالة المسلسل، مع المراجعات المنشورة إن وُجدت — وفلاتر بالنوع والسنة واللغة.`,
  path: '/series/',
});

export const dynamic = 'force-static';

export default function SeriesPage() {
  return <CatalogListing kind="series" />;
}
