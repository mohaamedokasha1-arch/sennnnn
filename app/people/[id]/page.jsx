import Link from 'next/link';
import { notFound } from 'next/navigation';
import siteConfig from '@/site.config.mjs';
import { t, countryLabel } from '@/lib/i18n.mjs';
import { buildMetadata, personJsonLd, noIndex } from '@/lib/seo.mjs';
import { getPeople, getPerson } from '@/lib/content.mjs';
import { renderMarkdown } from '@/lib/markdown.mjs';
import { Breadcrumbs, EmptyState } from '@/components/ui.jsx';
import { AdSlot } from '@/components/Ads.jsx';
import { WorkGrid } from '@/components/cards.jsx';
import JsonLd from '@/components/JsonLd.jsx';

export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams() {
  return getPeople().map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const person = getPerson(id);
  if (!person) {
    return buildMetadata({ title: 'الصفحة غير موجودة', description: 'لم نجد هذا الشخص.', path: `/people/${id}/`, robots: { index: false, follow: true } });
  }
  return buildMetadata({
    title: `${person.name} — ${person.roleLabel}`,
    description: person.bio || `${person.name} (${person.roleLabel}) — الأعمال المسجّلة داخل الموقع.`,
    path: person.url,
    image: person.hasPhoto ? person.photo : null,
    imageAlt: person.hasPhoto ? `صورة ${person.name}` : null,
    robots: person.works.length ? undefined : noIndex,
  });
}

export default async function PersonPage({ params }) {
  const { id } = await params;
  const person = getPerson(id);
  if (!person) notFound();

  const crumbs = [
    { name: t('nav.home'), url: '/' },
    { name: 'الأشخاص', url: '/people/' },
    { name: person.name, url: person.url },
  ];

  return (
    <div className="container">
      <JsonLd data={personJsonLd(person)} />
      <Breadcrumbs items={crumbs} />

      <article className="mt-4">
        <div className="row mb-2" style={{ gap: 14 }}>
          {person.hasPhoto ? (
            <img
              className="person-avatar"
              src={person.photo}
              alt={`صورة ${person.name}`}
              width={56}
              height={56}
              loading="eager"
              decoding="async"
              style={{ width: 56, height: 56, objectFit: 'cover' }}
            />
          ) : (
            <span className="person-avatar" style={{ width: 56, height: 56, fontSize: '1.3rem' }} aria-hidden="true">
              {person.name.trim().slice(0, 1)}
            </span>
          )}
          <div>
            <h1 style={{ margin: 0 }}>{person.name}</h1>
            <p className="muted small" style={{ margin: 0 }}>
              {person.roleLabel}
              {person.country ? ` · ${countryLabel(person.country)}` : ''}
              {person.works.length ? ` · ${person.works.length} عمل في الموقع` : ''}
            </p>
          </div>
        </div>

        {person.bio ? (
          <section className="panel" aria-labelledby="bio-title">
            <h2 className="panel-title" id="bio-title">
              {t('person.about')}
            </h2>
            <div className="prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(person.bio) }} />
            <p className="panel-note" style={{ marginBottom: 0 }}>
              النبذة مكتوبة أصلًا لـ{siteConfig.siteName}، وليست منقولة من أي مصدر خارجي.
            </p>
          </section>
        ) : null}

        <section className="section" aria-labelledby="works-title">
          <h2 id="works-title" style={{ fontSize: '1.3rem' }}>
            {t('person.works')} ({person.works.length})
          </h2>
          <p className="section-sub">{t('person.worksNote')}</p>

          {person.works.length ? (
            <div className="mt-4">
              <WorkGrid works={person.works} showGenres />
            </div>
          ) : (
            <div className="mt-4">
              <EmptyState
                icon="🎬"
                title={t('person.empty')}
                body="لا نضيف عملًا لصفحة شخص دون تسجيله فعليًا في مكتبة الموقع."
                actions={[{ href: '/movies/', label: t('nav.movies'), primary: true }]}
              />
            </div>
          )}
        </section>

        <p className="muted small mt-6">
          <Link href="/people/">كل الأشخاص</Link> · <Link href="/movies/">الأفلام</Link> ·{' '}
          <Link href="/series/">المسلسلات</Link>
        </p>
      </article>

      <AdSlot zone="bottom" hidden={person.works.length < 4} />
    </div>
  );
}
