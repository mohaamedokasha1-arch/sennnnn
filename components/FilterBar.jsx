'use client';

import { useEffect, useMemo, useState } from 'react';
import { t } from '@/lib/i18n.mjs';
import { computeResults } from '@/lib/filter.mjs';
import WorkCard from './WorkCard.jsx';
import { EmptyState } from './ui.jsx';

/**
 * ============================================================================
 *  شبكة نتائج + فلاتر + ترتيب + ترقيم — تعمل بالكامل في المتصفح
 * ============================================================================
 *  سبب ذلك: الموقع ثابت (Static Export) بلا خادم؛ لذلك تُنفَّذ الفلترة على
 *  فهرس محلي مُمرَّر من وقت البناء. لا تُرسل أي بيانات لأي جهة خارجية.
 *  ملاحظة SEO: صفحة القائمة الأساسية تُفهرس، أما حالات الفلترة المركّبة فمُستثناة
 *  عبر robots/noindex (انظر الصفحات) لمنع المحتوى المكرر.
 * ============================================================================
 */
export default function FilterBar({ items = [], facets = {}, pageSize = 24, showStatus = false, emptyText, hint }) {
  const [genre, setGenre] = useState('');
  const [year, setYear] = useState('');
  const [language, setLanguage] = useState('');
  const [country, setCountry] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);

  const languages = facets.languages ?? [];
  const countries = facets.countries ?? [];
  const statuses = facets.statuses ?? [];

  // نفس وحدة المنطق المُختبَرة آليًا (lib/filter.mjs) — بلا نسخ مكرر للمنطق
  const result = useMemo(
    () => computeResults(items, { genre, year, language, country, status }, sort, page, pageSize),
    [items, genre, year, language, country, status, sort, page, pageSize]
  );
  const { slice: visible, count, totalPages, current } = result;

  useEffect(() => setPage(1), [genre, year, language, country, status, sort]);

  const hasFilters = Boolean(genre || year || language || country || status);

  const reset = () => {
    setGenre('');
    setYear('');
    setLanguage('');
    setCountry('');
    setStatus('');
    setSort('newest');
  };

  const countLabel = count === 1 ? t('filter.resultsCountOne') : t('filter.resultsCount', { n: count });

  return (
    <>
      <section className="filters" aria-label="الفلاتر والترتيب">
        <div className="filters-row">
          {facets.genres?.length ? (
            <div className="field">
              <label htmlFor="f-genre">{t('filter.genre')}</label>
              <select id="f-genre" value={genre} onChange={(e) => setGenre(e.target.value)}>
                <option value="">{t('filter.all')}</option>
                {facets.genres.map((g) => (
                  <option key={g.key} value={g.key}>
                    {g.label} ({g.count})
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {facets.years?.length ? (
            <div className="field">
              <label htmlFor="f-year">{t('filter.year')}</label>
              <select id="f-year" value={year} onChange={(e) => setYear(e.target.value)}>
                <option value="">{t('filter.all')}</option>
                {facets.years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {languages.length ? (
            <div className="field">
              <label htmlFor="f-lang">{t('filter.language')}</label>
              <select id="f-lang" value={language} onChange={(e) => setLanguage(e.target.value)}>
                <option value="">{t('filter.all')}</option>
                {languages.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label} ({l.count})
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {countries.length ? (
            <div className="field">
              <label htmlFor="f-country">{t('filter.country')}</label>
              <select id="f-country" value={country} onChange={(e) => setCountry(e.target.value)}>
                <option value="">{t('filter.all')}</option>
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label} ({c.count})
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {showStatus && statuses.length ? (
            <div className="field">
              <label htmlFor="f-status">{t('filter.status')}</label>
              <select id="f-status" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">{t('filter.all')}</option>
                {statuses.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label} ({s.count})
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="field">
            <label htmlFor="f-sort">{t('sort.label')}</label>
            <select id="f-sort" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="newest">{t('sort.newest')}</option>
              <option value="yearDesc">{t('sort.yearDesc')}</option>
              <option value="yearAsc">{t('sort.yearAsc')}</option>
              <option value="title">{t('sort.title')}</option>
            </select>
          </div>
        </div>

        <div className="filters-foot">
          <span className="results-count" aria-live="polite">
            {countLabel}
          </span>
          {hasFilters ? (
            <button type="button" className="btn btn-ghost btn-sm" onClick={reset}>
              {t('filter.clear')}
            </button>
          ) : null}
        </div>
      </section>

      {visible.length ? (
        <>
          <div className="grid">
            {visible.map((w) => (
              <WorkCard key={`${w.kind}:${w.slug}`} work={w} />
            ))}
          </div>

          {totalPages > 1 ? (
            <nav className="pager" aria-label="ترقيم النتائج">
              <button type="button" className={current === 1 ? 'disabled' : ''} onClick={() => setPage(current - 1)} disabled={current === 1}>
                {t('pager.previous')}
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) =>
                n === current ? (
                  <span key={n} aria-current="page">
                    {n}
                  </span>
                ) : (
                  <button key={n} type="button" onClick={() => setPage(n)} aria-label={`${t('pager.page', { n })}`}>
                    {n}
                  </button>
                )
              )}
              <button
                type="button"
                className={current === totalPages ? 'disabled' : ''}
                onClick={() => setPage(current + 1)}
                disabled={current === totalPages}
              >
                {t('pager.next')}
              </button>
            </nav>
          ) : null}

          <p className="muted small center mt-4">
            {t('pager.showing', { shown: visible.length, total: count })}
          </p>
        </>
      ) : (
        <EmptyState
          icon="🎬"
          title={emptyText ?? t('search.emptyTitle')}
          body={t('empty.filtersHint')}
          hint={hint}
          actions={[{ href: '/', label: t('nav.home'), primary: true }, { href: '/genres/', label: t('nav.genres') }]}
        />
      )}
    </>
  );
}
