'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { t } from '@/lib/i18n.mjs';
import { highlightParts, matchTokens, scoreItem, snippet } from '@/lib/highlight.mjs';
import { EmptyState } from './ui.jsx';
import { WorkGrid, ReviewCard, PersonCard } from './cards.jsx';
import SearchForm from './SearchForm.jsx';
import PosterImage from './PosterImage.jsx';

/**
 * ============================================================================
 *  نتائج البحث — تُحسب في المتصفح من ملف الفهرس الثابت /search-index.json
 * ============================================================================
 *  لماذا في المتصفح؟ لأن الموقع ثابت بالكامل على استضافة بلا خادم (Static Export)،
 *  فلا يوجد مكان لتنفيذ بحث وقت الطلب. الفهرس نفسه يُولَّد وقت البناء من المحتوى.
 *  لا يُرسل نص البحث إلى أي جهة، ولا يوجد تتبّع.
 * ============================================================================
 */
export default function SearchResults({ latest = [], genres = [] }) {
  const params = useSearchParams();
  const q = (params.get('q') ?? '').trim();
  const [index, setIndex] = useState(null);

  useEffect(() => {
    let alive = true;
    fetch('/search-index.json')
      .then((r) => r.json())
      .then((data) => {
        if (alive) setIndex(data);
      })
      .catch(() => {
        if (alive) setIndex({ works: [], reviews: [], lists: [], people: [] });
      });
    return () => {
      alive = false;
    };
  }, []);

  const results = useMemo(() => {
    if (!index || !q) return null;
    const pool = [...index.works, ...index.reviews, ...index.lists, ...index.people];
    const hits = pool
      .filter((it) => matchTokens(it.search, q))
      .map((it) => ({ ...it, _score: scoreItem(it, q) }))
      .sort((a, b) => b._score - a._score);
    return {
      works: hits.filter((h) => h.kind === 'movie' || h.kind === 'series'),
      reviews: hits.filter((h) => h.kind === 'review'),
      lists: hits.filter((h) => h.kind === 'list'),
      people: hits.filter((h) => h.kind === 'person'),
      total: hits.length,
    };
  }, [index, q]);

  const Mark = ({ text }) => (
    <>
      {highlightParts(text, q).map((p, i) => (p.hit ? <mark className="hit" key={i}>{p.text}</mark> : <span key={i}>{p.text}</span>))}
    </>
  );

  return (
    <>
      <SearchForm />

      {!q ? (
        <>
          {genres.length ? (
            <section className="section" aria-labelledby="s-genres">
              <h2 id="s-genres" style={{ fontSize: '1.25rem' }}>
                {t('search.popularGenres')}
              </h2>
              <div className="chips mt-4">
                {genres.map((g) => (
                  <Link key={g.key} href={g.url} className="chip">
                    {g.label} ({g.count})
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          {latest.length ? (
            <section className="section" aria-labelledby="s-latest">
              <h2 id="s-latest" style={{ fontSize: '1.25rem' }}>
                {t('search.latestAdditions')}
              </h2>
              <div className="mt-4">
                <WorkGrid works={latest} showGenres={false} />
              </div>
            </section>
          ) : null}
        </>
      ) : results === null ? (
        <p className="muted mt-6">…</p>
      ) : results.total === 0 ? (
        <>
          <div className="mt-4">
            <EmptyState icon="🔍" title={t('search.emptyTitle')} body={t('search.emptyBody')} hint={t('search.tip')} />
          </div>
          {genres.length ? (
            <section className="section" aria-labelledby="s-genres2">
              <h2 id="s-genres2" style={{ fontSize: '1.25rem' }}>
                {t('search.popularGenres')}
              </h2>
              <div className="chips mt-4">
                {genres.map((g) => (
                  <Link key={g.key} href={g.url} className="chip">
                    {g.label} ({g.count})
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
          {latest.length ? (
            <section className="section" aria-labelledby="s-latest2">
              <h2 id="s-latest2" style={{ fontSize: '1.25rem' }}>
                {t('search.latestAdditions')}
              </h2>
              <div className="mt-4">
                <WorkGrid works={latest} showGenres={false} />
              </div>
            </section>
          ) : null}
        </>
      ) : (
        <>
          <p className="results-count mt-4" aria-live="polite">
            {t('search.resultsFor', { q })} — {results.total === 1 ? t('search.countOne') : t('search.countMany', { n: results.total })}
          </p>

          {results.works.length ? (
            <section className="section" aria-labelledby="s-works">
              <h2 id="s-works" style={{ fontSize: '1.25rem' }}>
                أعمال ({results.works.length})
              </h2>
              <div className="grid mt-4">
                {results.works.map((r) => (
                  <article className="card" key={r.id}>
                    <div className="card-media">
                      <Link href={r.url} tabIndex={-1} aria-hidden="true">
                        <PosterImage
                          src={r.poster}
                          title={r.title}
                          year={r.year}
                          alt={
                            r.posterDesign
                              ? `غلاف تصميمي أصلي من إنتاج أكاشا سينما لـ ${r.title} — ليس البوستر الرسمي`
                              : `بوستر ${r.title}`
                          }
                          width={600}
                          height={900}
                          loading="lazy"
                        />
                      </Link>
                      <div className="card-badges">
                        <span className="chip chip-static chip-type">{r.typeLabel}</span>
                        {r.year ? <span className="chip chip-static">{r.year}</span> : null}
                      </div>
                      {r.posterDesign ? (
                        <div className="card-scrim">
                          <span className="chip chip-static" data-poster-design="true" title={t('work.posterDesignNote')}>
                            {t('work.posterDesignBadge')}
                          </span>
                        </div>
                      ) : null}
                    </div>
                    <div className="card-body">
                      <h3 className="card-title">
                        <Link href={r.url}>
                          <Mark text={r.title} />
                        </Link>
                      </h3>
                      {r.titleOriginal ? (
                        <p className="card-meta" dir="ltr">
                          {r.titleOriginal}
                        </p>
                      ) : null}
                      <p className="card-meta">{snippet(r.synopsis, q, 110)}</p>
                      {r.genres?.length ? (
                        <div className="card-genres">
                          {r.genres.slice(0, 3).map((g) => (
                            <span key={g} className="chip chip-static">
                              {g}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {results.reviews.length ? (
            <section className="section" aria-labelledby="s-reviews">
              <h2 id="s-reviews" style={{ fontSize: '1.25rem' }}>
                مراجعات ({results.reviews.length})
              </h2>
              <div className="grid grid-2 mt-4">
                {results.reviews.map((r) => (
                  <ReviewCard
                    key={r.id}
                    review={{
                      slug: r.id.replace('review:', ''),
                      url: r.url,
                      title: r.title,
                      rating: null,
                      author: r.author,
                      date: r.date,
                      excerpt: snippet(r.excerpt, q, 160),
                      work: null,
                    }}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {results.lists.length ? (
            <section className="section" aria-labelledby="s-lists">
              <h2 id="s-lists" style={{ fontSize: '1.25rem' }}>
                قوائم ترشيحات ({results.lists.length})
              </h2>
              <ul className="stack mt-4">
                {results.lists.map((l) => (
                  <li key={l.id} className="panel">
                    <Link href={l.url} style={{ fontWeight: 700 }}>
                      <Mark text={l.title} />
                    </Link>
                    {l.description ? (
                      <p className="small muted" style={{ margin: '6px 0 0' }}>
                        {snippet(l.description, q, 160)}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {results.people.length ? (
            <section className="section" aria-labelledby="s-people">
              <h2 id="s-people" style={{ fontSize: '1.25rem' }}>
                أشخاص ({results.people.length})
              </h2>
              <div className="people-row mt-4">
                {results.people.map((p) => (
                  <PersonCard
                    key={p.id}
                    person={{ id: p.id, url: p.url, name: p.title, roleLabel: p.typeLabel, worksCount: p.worksCount }}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}
    </>
  );
}
