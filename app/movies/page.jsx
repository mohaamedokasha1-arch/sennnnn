import siteConfig from '@/site.config.mjs';
import { t } from '@/lib/i18n.mjs';
import { buildMetadata } from '@/lib/seo.mjs';
import CatalogListing from '@/components/CatalogListing.jsx';

export const metadata = buildMetadata({
  title: t('movies.title'),
  description: `كل الأفلام المنشورة في ${siteConfig.siteName}: قصة كل فيلم، تصنيفاته، وطاقم العمل، مع المراجعات المنشورة إن وُجدت — وفلاتر بالنوع والسنة واللغة والبلد.`,
  path: '/movies/',
});

/** The first catalog page is statically rendered; later pages have dedicated crawlable routes. */
export const dynamic = 'force-static';

export default function MoviesPage() {
  return <CatalogListing kind="movie" />;
}
