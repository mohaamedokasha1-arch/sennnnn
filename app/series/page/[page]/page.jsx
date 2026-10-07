import { notFound } from 'next/navigation';
import siteConfig from '@/site.config.mjs';
import { t } from '@/lib/i18n.mjs';
import { buildMetadata, noIndex } from '@/lib/seo.mjs';
import { getSeries } from '@/lib/content.mjs';
import { paginationPageNumbers } from '@/lib/filter.mjs';
import CatalogListing from '@/components/CatalogListing.jsx';

export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams() {
  return paginationPageNumbers(getSeries().length).map((page) => ({ page: String(page) }));
}

export async function generateMetadata({ params }) {
  const { page: rawPage } = await params;
  const page = Number(rawPage);
  const pageNumbers = paginationPageNumbers(getSeries().length);
  if (!Number.isInteger(page) || !pageNumbers.includes(page)) {
    return buildMetadata({
      title: 'صفحة مسلسلات غير موجودة',
      description: `الصفحة المطلوبة غير موجودة ضمن فهرس المسلسلات في ${siteConfig.siteName}.`,
      path: `/series/page/${rawPage}/`,
      robots: noIndex,
    });
  }

  const pageCount = pageNumbers.length + 1;
  return buildMetadata({
    title: `${t('series.title')} | صفحة ${page} من ${pageCount}`,
    description: `صفحة ${page} من ${pageCount} في فهرس المسلسلات المنشورة لدى ${siteConfig.siteName}. تتضمن أعمالًا إضافية مع روابط مباشرة إلى تفاصيل القصص والتصنيفات وطاقم العمل.`,
    path: `/series/page/${page}/`,
  });
}

export default async function PaginatedSeriesPage({ params }) {
  const { page: rawPage } = await params;
  const page = Number(rawPage);
  if (!Number.isInteger(page) || !paginationPageNumbers(getSeries().length).includes(page)) notFound();
  return <CatalogListing kind="series" page={page} />;
}
