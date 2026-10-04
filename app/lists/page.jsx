import siteConfig from '@/site.config.mjs';
import { t } from '@/lib/i18n.mjs';
import { buildMetadata } from '@/lib/seo.mjs';
import { getLists } from '@/lib/content.mjs';
import { Breadcrumbs, SectionHeader, Notice, EmptyState } from '@/components/ui.jsx';
import { AdSlot } from '@/components/Ads.jsx';
import { ListCard } from '@/components/cards.jsx';

export const metadata = buildMetadata({
  title: t('lists.title'),
  description: `قوائم ترشيحات من إعداد فريق ${siteConfig.siteName}: مجموعات مختارة من الأفلام والمسلسلات في الموقع، بحسب الحالة والمزاج والوقت المتاح.`,
  path: '/lists/',
});

export const dynamic = 'force-static';

export default function ListsPage() {
  const lists = getLists();

  return (
    <div className="container">
      <Breadcrumbs items={[{ name: t('nav.home'), url: '/' }, { name: t('nav.lists') }]} />
      <div className="mt-4">
        <SectionHeader kicker="اختيارات المحرر" title={t('lists.title')} sub={t('lists.intro')} />
      </div>

      <Notice>
        <p className="small" style={{ marginBottom: 0 }}>
          كل قائمة ترشيح تعبّر عن رأي فريق التحرير وليست ترتيبًا موضوعيًا، وكل الأعمال داخلها موجودة
          فعلًا في مكتبة الموقع ويمكن الوصول إليها.
        </p>
      </Notice>

      {lists.length ? (
        <div className="grid grid-2 mt-6">
          {lists.map((l) => (
            <ListCard key={l.slug} list={l} />
          ))}
        </div>
      ) : (
        <div className="mt-6">
          <EmptyState
            icon="📝"
            title="لا توجد قوائم ترشيحات منشورة بعد"
            body="ننشر القوائم فقط عندما تكتمل أعضاؤها من أعمال موجودة في الموقع."
            actions={[{ href: '/movies/', label: t('nav.movies'), primary: true }]}
          />
        </div>
      )}

      <AdSlot zone="bottom" hidden={lists.length < 3} />
    </div>
  );
}
