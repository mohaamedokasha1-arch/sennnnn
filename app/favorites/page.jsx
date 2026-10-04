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
    seriesStatus: w.seriesStatus,
  }));

  return (
    <div className="container">
      <Breadcrumbs items={[{ name: t('nav.home'), url: '/' }, { name: t('nav.favorites') }]} />
      <div className="mt-4">
        <SectionHeader kicker="على جهازك" title={t('favorites.title')} sub={t('favorites.intro')} />
      </div>
      <FavoritesView items={items} />
    </div>
  );
}
