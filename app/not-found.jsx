import Link from 'next/link';
import { t, genreLabel } from '@/lib/i18n.mjs';
import { noIndex } from '@/lib/seo.mjs';
import { genresWithContent, latestAdditions } from '@/lib/content.mjs';
import { EmptyState, SectionHeader } from '@/components/ui.jsx';
import { WorkGrid } from '@/components/cards.jsx';

/**
 * صفحة 404 مفيدة: لا تترك الزائر في طريق مسدود — بحث مباشر + تصنيفات + أحدث الإضافات.
 * (يتم توليد out/404.html تلقائيًا من Next، ونجعل نسخًا منه في جذر المخرجات.)
 */
export const metadata = {
  title: 'الصفحة غير موجودة',
  description: 'تعذر العثور على الصفحة المطلوبة. استخدم الروابط للعودة إلى محتوى سينمانا.',
  robots: noIndex,
  // Do not inherit the homepage canonical for an actual 404 response.
  alternates: {},
};

export default function NotFound() {
  const genres = genresWithContent().slice(0, 6);
  const latest = latestAdditions(4);

  return (
    <div className="container">
      <div className="mt-6">
        <EmptyState
          icon="🧭"
          titleAs="h1"
          title={t('notFound.title')}
          body={t('notFound.body')}
          actions={[
            { href: '/', label: t('notFound.homeCta'), primary: true },
            { href: '/search/', label: t('notFound.searchCta') },
          ]}
        />
      </div>

      {genres.length ? (
        <section className="section" aria-labelledby="nf-genres">
          <SectionHeader id="nf-genres" kicker="اقتراحات" title={t('search.popularGenres')} />
          <div className="chips">
            {genres.map((g) => (
              <Link key={g.key} href={g.url} className="chip">
                {genreLabel(g.key)} ({g.count})
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {latest.length ? (
        <section className="section" aria-labelledby="nf-latest">
          <SectionHeader id="nf-latest" kicker="جديد المكتبة" title={t('search.latestAdditions')} href="/movies/" />
          <WorkGrid works={latest} showGenres={false} />
        </section>
      ) : null}

      <p className="muted small center mt-6">
        <Link href="/movies/">الأفلام</Link> · <Link href="/series/">المسلسلات</Link> ·{' '}
        <Link href="/reviews/">المراجعات</Link> · <Link href="/lists/">الترشيحات</Link> ·{' '}
        <Link href="/people/">الأشخاص</Link>
      </p>
    </div>
  );
}
