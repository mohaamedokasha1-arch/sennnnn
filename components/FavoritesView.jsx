'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { t } from '@/lib/i18n.mjs';
import WorkCard from './WorkCard.jsx';
import { EmptyState, Notice } from './ui.jsx';
import { readFavorites, writeFavorites, FAV_EVENT } from './FavoriteButton.jsx';

/**
 * ============================================================================
 *  صفحة المفضلة — قراءة من التخزين المحلي فقط (لا خادم، لا حساب، لا تتبّع)
 * ============================================================================
 *  نوضح للزائر بصراحة أن القائمة محلية: لا تنتقل بين الأجهزة، وتُفقد عند مسح
 *  بيانات المتصفح. لا نوعد بمزامنة لا نستطيع تقديمها في هذه النسخة.
 * ============================================================================
 */
export default function FavoritesView({ items = [] }) {
  const [ids, setIds] = useState([]);
  const [ready, setReady] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const sync = () => {
      setIds(readFavorites());
      setReady(true);
    };
    sync();
    window.addEventListener(FAV_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(FAV_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const byId = new Map(items.map((w) => [`${w.kind}:${w.slug}`, w]));
  const works = ids.map((id) => byId.get(id)).filter(Boolean);

  const copyList = async () => {
    const text = works.map((w, i) => `${i + 1}. ${w.title}${w.year ? ` (${w.year})` : ''} — ${w.url}`).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      window.prompt(t('favorites.export'), text);
    }
  };

  return (
    <>
      <Notice>
        <strong>{t('favorites.intro')}</strong>
        <p className="small mt-0" style={{ marginBottom: 0 }}>
          {t('favorites.localNotice')}
        </p>
      </Notice>

      {!ready ? (
        <p className="muted mt-6">…</p>
      ) : works.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon="🤍"
            title={t('empty.favorites')}
            body={t('empty.favoritesHint')}
            actions={[
              { href: '/movies/', label: t('nav.movies'), primary: true },
              { href: '/series/', label: t('nav.series') },
              { href: '/genres/', label: t('nav.genres') },
            ]}
          />
        </div>
      ) : (
        <>
          <div className="spread mt-4">
            <p className="muted small" style={{ margin: 0 }}>
              {t('lists.itemsCount', { n: works.length })}
            </p>
            <div className="row">
              <button type="button" className="btn btn-ghost btn-sm" onClick={copyList}>
                {copied ? t('work.shareCopied') : t('favorites.export')}
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  writeFavorites([]);
                }}
              >
                {t('favorites.clear')}
              </button>
            </div>
          </div>

          <div className="grid mt-4">
            {works.map((w) => (
              <WorkCard key={`${w.kind}:${w.slug}`} work={w} />
            ))}
          </div>

          <p className="muted small center mt-6">
            <Link href="/movies/">تصفّح مزيدًا من الأفلام</Link> · <Link href="/series/">المسلسلات</Link>
          </p>
        </>
      )}
    </>
  );
}
