import { Suspense } from 'react';
import siteConfig from '@/site.config.mjs';
import { t } from '@/lib/i18n.mjs';
import { buildMetadata, noIndex } from '@/lib/seo.mjs';
import { genresWithContent, latestAdditions } from '@/lib/content.mjs';
import { Breadcrumbs, SectionHeader } from '@/components/ui.jsx';
import SearchResults from '@/components/SearchResults.jsx';

/**
 * صفحة البحث — تعمل على فهرس الموقع المحلي (ملف ثابت /search-index.json).
 * لا يوجد أي محرك بحث خارجي أو API: البحث جزئي بالعربية أو بالاسم الأصلي،
 * ويُحسب في متصفح الزائر من نفس بيانات الموقع.
 */
export const metadata = buildMetadata({
  title: t('search.title'),
  description: `ابحث في مكتبة ${siteConfig.siteName} بالاسم العربي أو الأصلي — بحث جزئي يعمل بالكامل داخل الموقع دون أي خدمة خارجية.`,
  path: '/search/',
  robots: noIndex,
});

export const dynamic = 'force-static';

export default function SearchPage() {
  const latest = latestAdditions(4).map((w) => ({
    kind: w.kind,
    slug: w.slug,
    url: w.url,
    title: w.title,
    titleOriginal: w.titleOriginal,
    year: w.year,
    genres: w.genres,
    poster: w.hasPoster ? w.poster : null,
    hasPoster: w.hasPoster,
    seriesStatus: w.seriesStatus,
  }));
  const genres = genresWithContent().slice(0, 6).map((g) => ({ key: g.key, label: g.label, url: g.url, count: g.count }));

  return (
    <div className="container">
      <Breadcrumbs items={[{ name: t('nav.home'), url: '/' }, { name: t('search.title'), url: '/search/' }]} structuredData={false} />
      <div className="mt-4">
        <SectionHeader as="h1" kicker="بحث داخلي" title={t('search.title')} sub={t('search.tip')} />
      </div>
      <Suspense fallback={<p className="muted">…</p>}>
        <SearchResults latest={latest} genres={genres} />
      </Suspense>
    </div>
  );
}
