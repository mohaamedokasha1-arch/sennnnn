import { notFound } from 'next/navigation';
import siteConfig from '@/site.config.mjs';
import { t } from '@/lib/i18n.mjs';
import { buildMetadata, noIndex } from '@/lib/seo.mjs';
import { getMovies } from '@/lib/content.mjs';
import { DEFAULT_PAGE_SIZE, paginationPageNumbers } from '@/lib/filter.mjs';
import CatalogListing from '@/components/CatalogListing.jsx';

export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams() {
  return paginationPageNumbers(getMovies().length).map((page) => ({ page: String(page) }));
}

export async function generateMetadata({ params }) {
  const { page: rawPage } = await params;
  const page = Number(rawPage);
  const pageNumbers = paginationPageNumbers(getMovies().length);
  if (!Number.isInteger(page) || !pageNumbers.includes(page)) {
    return buildMetadata({
      title: 'صفحة أفلام غير موجودة',
      description: `الصفحة المطلوبة غير موجودة ضمن فهرس الأفلام في ${siteConfig.siteName}.`,
      path: `/movies/page/${rawPage}/`,
      robots: noIndex,
    });
  }

  const pageCount = pageNumbers.length + 1;
  return buildMetadata({
    title: `${t('movies.title')} | صفحة ${page} من ${pageCount}`,
    description: `صفحة ${page} من ${pageCount} في فهرس الأفلام المنشورة لدى ${siteConfig.siteName}. تتضمن أعمالًا إضافية مع روابط مباشرة إلى تفاصيل القصة والتصنيفات وطاقم العمل.`,
    path: `/movies/page/${page}/`,
  });
}

export default async function PaginatedMoviesPage({ params }) {
  const { page: rawPage } = await params;
  const page = Number(rawPage);
  if (!Number.isInteger(page) || !paginationPageNumbers(getMovies().length).includes(page)) notFound();
  return <CatalogListing kind="movie" page={page} />;
}
