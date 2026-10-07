import Link from 'next/link';
import siteConfig from '@/site.config.mjs';
import { t } from '@/lib/i18n.mjs';
import { buildMetadata } from '@/lib/seo.mjs';
import { genresWithContent } from '@/lib/content.mjs';
import { Breadcrumbs, SectionHeader, EmptyState } from '@/components/ui.jsx';
import { GenreCard } from '@/components/cards.jsx';

export const metadata = buildMetadata({
  title: t('genres.title'),
  description: `تصنيفات الأفلام والمسلسلات في ${siteConfig.siteName} — تُعرض التصنيفات التي تحتوي محتوى منشورًا فعليًا فقط، بلا تصنيفات فارغة.`,
  path: '/genres/',
});

export const dynamic = 'force-static';

/** صفحات التصنيفات: تُبنى فقط للتصنيفات التي تحتوي محتوى منشورًا فعليًا */
export default function GenresPage() {
  const genres = genresWithContent();

  return (
    <div className="container">
      <Breadcrumbs items={[{ name: t('nav.home'), url: '/' }, { name: t('nav.genres'), url: '/genres/' }]} />
      <div className="mt-4">
        <SectionHeader as="h1" kicker="تصفّح بالمزاج" title={t('genres.title')} sub={t('genres.intro')} />
      </div>

      {genres.length ? (
        <div className="grid grid-2">
          {genres.map((g) => (
            <GenreCard key={g.key} genre={g} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon="🗂️"
          title="لا توجد تصنيفات بها محتوى منشور بعد"
          body="تُبنى صفحات التصنيفات تلقائيًا عند إضافة أول عمل منشور في كل تصنيف."
          actions={[{ href: '/movies/', label: t('nav.movies'), primary: true }]}
        />
      )}

      <p className="muted small center mt-6">
        كل صفحة عمل تحتوي روابط لتصنيفاتها، وكل صفحة تصنيف تعود للأفلام والمسلسلات المرتبطة بها.
        لا تصنيفات فارغة ظاهرة للزائر.
      </p>
    </div>
  );
}
