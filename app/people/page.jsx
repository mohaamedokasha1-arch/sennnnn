import siteConfig from '@/site.config.mjs';
import { t } from '@/lib/i18n.mjs';
import { buildMetadata } from '@/lib/seo.mjs';
import { getPeople } from '@/lib/content.mjs';
import { Breadcrumbs, SectionHeader, EmptyState, Notice } from '@/components/ui.jsx';
import { PersonCard } from '@/components/cards.jsx';

export const metadata = buildMetadata({
  title: 'الممثلون والمخرجون',
  description: `صفحات الممثلين والمخرجين في ${siteConfig.siteName}: نبذة مختصرة من إعداد فريقنا، وقائمة بالأعمال المسجّلة داخل الموقع فقط.`,
  path: '/people/',
});

export const dynamic = 'force-static';

export default function PeoplePage() {
  const people = getPeople();
  const directors = people.filter((p) => p.roles.includes('director'));
  const actors = people.filter((p) => p.roles.includes('actor'));

  return (
    <div className="container">
      <Breadcrumbs items={[{ name: t('nav.home'), url: '/' }, { name: 'الأشخاص' }]} />
      <div className="mt-4">
        <SectionHeader as="h1" kicker="طاقم العمل" title="الممثلون والمخرجون" sub="نبذة مكتوبة خصيصًا لسينمانا، وأعمال تم تسجيلها داخل الموقع فقط." />
      </div>

      <Notice>
        <p className="small" style={{ marginBottom: 0 }}>
          {t('person.worksNote')} تُنشأ صفحة الشخص فقط عند توفر معلومات كافية مكتوبة أصليًا من فريقنا،
          ولا تُنسخ النبذ من أي مصدر محمي.
        </p>
      </Notice>

      {directors.length ? (
        <section className="section" aria-labelledby="p-directors">
          <h2 id="p-directors" style={{ fontSize: '1.25rem' }}>
            مخرجون ({directors.length})
          </h2>
          <div className="people-row mt-4">
            {directors.map((p) => (
              <PersonCard key={p.id} person={p} />
            ))}
          </div>
        </section>
      ) : null}

      {actors.length ? (
        <section className="section" aria-labelledby="p-actors">
          <h2 id="p-actors" style={{ fontSize: '1.25rem' }}>
            ممثلون ({actors.length})
          </h2>
          <div className="people-row mt-4">
            {actors.map((p) => (
              <PersonCard key={p.id} person={p} />
            ))}
          </div>
        </section>
      ) : null}

      {!people.length ? (
        <EmptyState icon="🎭" title="لا توجد صفحات أشخاص بعد" body="تُضاف صفحات الممثلين والمخرجين عند توفر نبذة أصلية وأعمال مسجّلة داخل الموقع." />
      ) : null}
    </div>
  );
}
