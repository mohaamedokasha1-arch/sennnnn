import { t } from '@/lib/i18n.mjs';
import { buildMetadata, noIndex } from '@/lib/seo.mjs';
import { getWorks } from '@/lib/content.mjs';
import { Breadcrumbs, SectionHeader } from '@/components/ui.jsx';
import FavoritesView from '@/components/FavoritesView.jsx';

/** صفحة المفضلة: قائمة محلية في متصفح الزائر — صفحة وظيفية لا تُفهرس */
export const metadata = buildMetadata({
  title: t('favorites.title'),
  description: t('favorites.intro'),
  path: '/favorites/',
  canonical: false,
  robots: noIndex,
});

export const dynamic = 'force-static';

export default function FavoritesPage() {
  const items = getWorks('all').map((w) => ({
    kind: w.kind,
    slug: w.slug,
    url: w.url,
    title: w.title,
    titleOriginal: w.titleOriginal,
    year: w.year,
    genres: w.genres,
    poster: w.hasPoster ? w.poster : null,
    hasPoster: w.hasPoster,
    // يلزم لعرض وسم «غلاف تصميمي أصلي» على بطاقات المفضلة (WorkCard يقرأه من هنا).
    posterDesign: w.posterDesign,
    posterAlt: w.posterAlt,
    seriesStatus: w.seriesStatus,
  }));

  return (
    <div className="container">
      <Breadcrumbs items={[{ name: t('nav.home'), url: '/' }, { name: t('nav.favorites'), url: '/favorites/' }]} structuredData={false} />
      <div className="mt-4">
        <SectionHeader as="h1" kicker="على جهازك" title={t('favorites.title')} sub={t('favorites.intro')} />
      </div>
      <FavoritesView items={items} />
    </div>
  );
}
