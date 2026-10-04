import Link from 'next/link';
import { notFound } from 'next/navigation';
import { t } from '@/lib/i18n.mjs';
import { buildMetadata, listJsonLd, breadcrumbJsonLd } from '@/lib/seo.mjs';
import { getLists } from '@/lib/content.mjs';
import { renderMarkdown } from '@/lib/markdown.mjs';
import { formatDate } from '@/lib/format.mjs';
import { Breadcrumbs, Notice } from '@/components/ui.jsx';
import JsonLd from '@/components/JsonLd.jsx';
import ShareRow from '@/components/ShareRow.jsx';


export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams() {
  const items = getLists();
  // في وضع التصدير الثابت لا يقبل Next مسارًا ديناميكيًا بلا أي صفحة مُولَّدة،
  // لذلك عند غياب المحتوى نولّد مسارًا داخليًا واحدًا يعرض صفحة «الصفحة غير موجودة» (noindex).
  // يختفي هذا المسار تلقائيًا بمجرد إضافة أول عنصر، ولا يُدرج في الخريطة ولا يُفهرس.
  return items.length ? items.map((l) => ({ slug: l.slug })) : [{ slug: '__no-content__' }];
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const list = getLists().find((l) => l.slug === slug);
  if (!list) {
    return buildMetadata({ title: 'الصفحة غير موجودة', description: 'لم نجد هذه القائمة.', path: `/lists/${slug}/`, robots: { index: false, follow: true } });
  }
  return buildMetadata({
    title: list.title,
    description: list.description,
    path: list.url,
    image: list.items[0]?.work?.hasPoster ? list.items[0].work.poster : null,
    type: 'article',
    publishedTime: list.date,
    authors: list.author,
  });
}

export default async function ListPage({ params }) {
  const { slug } = await params;
  const list = getLists().find((l) => l.slug === slug);
  if (!list) notFound();

  const crumbs = [
    { name: t('nav.home'), url: '/' },
    { name: t('nav.lists'), url: '/lists/' },
    { name: list.title, url: list.url },
  ];

  return (
    <div className="container">
      <JsonLd data={[listJsonLd(list), breadcrumbJsonLd(crumbs.map((c) => ({ name: c.name, url: c.url })))]} />
      <Breadcrumbs items={crumbs} />

      <article className="mt-4">
        <div className="chips mb-2">
          <span className="chip chip-static chip-type">{t('nav.lists')}</span>
        </div>

        <h1>{list.title}</h1>
        <p className="muted small">
          {t('reviews.byAuthor', { author: list.author })}
          {list.date ? ` · ${formatDate(list.date)}` : ''} · {t('lists.itemsCount', { n: list.items.length })}
        </p>

        <p className="prose">{list.description}</p>

        {list.intro ? <div className="prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(list.intro) }} /> : null}

        <Notice>
          <p className="small" style={{ marginBottom: 0 }}>
            هذه قائمة ترشيحات تحريرية وليست تصنيفًا موضوعيًا. الترتيب داخل القائمة لا يعني تفاضلًا بين الأعمال
            إلا إذا ذُكر ذلك صراحة.
          </p>
        </Notice>

        <section className="section" aria-labelledby="list-items">
          <h2 id="list-items" style={{ fontSize: '1.3rem' }}>
            {t('lists.items')}
          </h2>

          <ol className="stack mt-4" style={{ counterReset: 'item' }}>
            {list.items.map((it, i) => (
              <li key={it.ref} className="panel">
                <div className="row" style={{ alignItems: 'flex-start', gap: 16 }}>
                  <span className="badge badge-accent" style={{ minWidth: 34, justifyContent: 'center' }}>
                    {i + 1}
                  </span>
                  {it.work.hasPoster ? (
                    <Link href={it.work.url} aria-hidden="true" tabIndex={-1}>
                      <img
                        src={it.work.poster}
                        alt={`بوستر ${it.work.title}`}
                        width={78}
                        height={117}
                        loading="lazy"
                        style={{ borderRadius: 8, border: '1px solid var(--border)' }}
                      />
                    </Link>
                  ) : null}
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <h3 style={{ margin: '0 0 4px', fontSize: '1.05rem' }}>
                      <Link href={it.work.url}>
                        {it.work.title}
                        {it.work.year ? ` (${it.work.year})` : ''}
                      </Link>
                    </h3>
                    <p className="muted small" style={{ margin: 0 }}>
                      {it.work.synopsis.slice(0, 180)}
                      {it.work.synopsis.length > 180 ? '…' : ''}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <div className="mt-4">
          <ShareRow title={list.title} />
        </div>

        <p className="muted small mt-6">
          <Link href="/lists/">كل قوائم الترشيحات</Link> · <Link href="/movies/">الأفلام</Link> ·{' '}
          <Link href="/series/">المسلسلات</Link>
        </p>
      </article>
    </div>
  );
}
