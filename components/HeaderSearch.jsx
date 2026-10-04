'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { t } from '@/lib/i18n.mjs';
import { highlightParts, matchTokens, scoreItem } from '@/lib/highlight.mjs';
import { IconSearch } from './Icons.jsx';
import PosterImage from './PosterImage.jsx';

/**
 * بحث فوري في الشريط العلوي — يعمل بالكامل في المتصفح على ملف الفهرس الثابت
 * /search-index.json الذي يُولَّد وقت البناء من بيانات المحتوى. لا API ولا خدمة خارجية.
 */
export default function HeaderSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(null);
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef(null);
  const inputRef = useRef(null);

  // تحميل الفهرس عند أول تفاعل (لا نحمّله في الصفحة الأولى إن لم يُستخدم)
  const ensureIndex = async () => {
    if (index || loading) return;
    setLoading(true);
    try {
      const res = await fetch('/search-index.json');
      const data = await res.json();
      setIndex(data);
    } catch {
      setIndex({ works: [], reviews: [], lists: [], people: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const onDocClick = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const results = useMemo(() => {
    if (!index || !query.trim()) return [];
    const pool = [...index.works, ...index.reviews, ...index.lists, ...index.people];
    return pool
      .filter((it) => matchTokens(it.search, query))
      .map((it) => ({ ...it, _score: scoreItem(it, query) }))
      .sort((a, b) => b._score - a._score)
      .slice(0, 6);
  }, [index, query]);

  useEffect(() => setActive(-1), [query]);

  const go = (href) => {
    setOpen(false);
    setQuery('');
    router.push(href);
  };

  const submit = (e) => {
    e.preventDefault();
    if (active >= 0 && results[active]) return go(results[active].url);
    if (query.trim()) go(`/search/?q=${encodeURIComponent(query.trim())}`);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div className="search-box" ref={boxRef} role="search">
      <form className="search-input-wrap" onSubmit={submit}>
        <span className="search-icon">
          <IconSearch width={18} height={18} />
        </span>
        <label className="sr-only" htmlFor="site-search">
          {t('search.label')}
        </label>
        <input
          id="site-search"
          ref={inputRef}
          type="search"
          name="q"
          value={query}
          placeholder={t('search.placeholder')}
          autoComplete="off"
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            ensureIndex();
            if (query.trim()) setOpen(true);
          }}
          onKeyDown={onKeyDown}
          aria-expanded={open && Boolean(query.trim())}
          aria-controls="search-suggestions"
        />
        <button type="submit" className="search-submit">
          {t('search.submit')}
        </button>
      </form>

      {open && query.trim() ? (
        <div className="suggest" id="search-suggestions" role="listbox" aria-label={t('search.title')}>
          {results.length === 0 ? (
            <p className="suggest-empty">{loading ? 'جارٍ التحميل…' : t('search.emptyTitle')}</p>
          ) : (
            results.map((r, i) => (
              <Link
                key={r.id}
                href={r.url}
                className="suggest-item"
                data-active={i === active}
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onClick={() => setOpen(false)}
              >
                <PosterImage
                  compact
                  className="suggest-thumb"
                  src={r.poster}
                  title={r.title}
                  year={r.year}
                  alt=""
                  width={42}
                  height={62}
                  loading="lazy"
                />
                <span>
                  <span className="suggest-title">
                    {highlightParts(r.title, query).map((p, k) =>
                      p.hit ? (
                        <mark className="hit" key={k}>
                          {p.text}
                        </mark>
                      ) : (
                        <span key={k}>{p.text}</span>
                      )
                    )}
                  </span>
                  <span className="suggest-meta">
                    {[r.typeLabel, r.year, r.workTitle, r.worksCount ? `${r.worksCount} عمل` : null, r.count ? `${r.count} عمل` : null]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </span>
              </Link>
            ))
          )}
          <Link href={`/search/?q=${encodeURIComponent(query.trim())}`} className="suggest-all" onClick={() => setOpen(false)}>
            {t('search.resultsFor', { q: query.trim() })} ←
          </Link>
        </div>
      ) : null}
    </div>
  );
}
