import Link from 'next/link';
import siteConfig from '@/site.config.mjs';
import { t } from '@/lib/i18n.mjs';
import { buildMetadata } from '@/lib/seo.mjs';
import { getMovies, facets } from '@/lib/content.mjs';
import { Breadcrumbs, SectionHeader } from '@/components/ui.jsx';
import { AdSlot } from '@/components/Ads.jsx';
import FilterBar from '@/components/FilterBar.jsx';

export const metadata = buildMetadata({
  title: t('movies.title'),
  description: `كل الأفلام المنشورة في ${siteConfig.siteName}: قصة كل فيلم، تصنيفاته، طاقم العمل، ومراجعات تحريرية أصلية — مع فلاتر بالنوع والسنة واللغة والبلد.`,
  path: '/movies/',
});

/**
 * صفحة الأفلام — تُبنى القوائم وقت البناء، وتعمل الفلاتر/الترتيب/الترقيم في المتصفح
 * (موقع ثابت بلا خادم). الصفحة الأساسية مفهرسة، وحالات الفلترة المركّبة لا تُنشئ روابط
 * جديدة قابلة للفهرسة، فلا يحدث محتوى مكرر.
 */
export const dynamic = 'force-static';

export default function MoviesPage() {
  const movies = getMovies();
  const f = facets('movie');

  const items = movies.map((m) => ({
    kind: m.kind,
    slug: m.slug,
    url: m.url,
    title: m.title,
    titleOriginal: m.titleOriginal,
    year: m.year,
    genres: m.genres,
    language: m.language,
    country: m.country,
    poster: m.hasPoster ? m.poster : null,
    hasPoster: m.hasPoster,
    addedAt: m.addedAt,
    seriesStatus: null,
  }));

  return (
    <div className="container">
      <Breadcrumbs items={[{ name: t('nav.home'), url: '/' }, { name: t('nav.movies') }]} />

      <div className="mt-4">
        <SectionHeader kicker="المكتبة" title={t('movies.title')} sub={t('movies.intro')} />
      </div>

      <FilterBar items={items} facets={f} showStatus={false} emptyText={t('empty.movies')} />

      <AdSlot zone="bottom" hidden={movies.length < 6} />

      <p className="muted small center mt-6">
        تفضّل المسلسلات؟ <Link href="/series/">تصفّح صفحة المسلسلات</Link> · أو ابدأ من{' '}
        <Link href="/genres/">التصنيفات</Link>.
      </p>
    </div>
  );
}
