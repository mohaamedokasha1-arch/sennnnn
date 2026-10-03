'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { t } from '@/lib/i18n.mjs';
import { IconFilm, IconGrid, IconHeart, IconHome, IconMore, IconTv, IconClose, IconPen, IconList, IconUsers, IconShield } from './Icons.jsx';
import { FAV_EVENT, FAV_KEY } from './FavoriteButton.jsx';

/**
 * التنقل على الهاتف: قائمة سفلية ثابتة (5 عناصر) + درج جانبي لبقية الصفحات.
 * لا نوافذ منبثقة تلقائية ولا نوافذ مزعجة — الدرج يُفتح فقط بضغطة المستخدم.
 */
export default function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [favCount, setFavCount] = useState(0);

  useEffect(() => {
    const sync = () => {
      try {
        const arr = JSON.parse(window.localStorage.getItem(FAV_KEY) || '[]');
        setFavCount(Array.isArray(arr) ? arr.length : 0);
      } catch {
        setFavCount(0);
      }
    };
    sync();
    window.addEventListener(FAV_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(FAV_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const isActive = (href) => pathname === href || (href !== '/' && pathname?.startsWith(href));

  const moreLinks = [
    { href: '/genres/', label: t('nav.genres'), icon: <IconGrid width={18} height={18} /> },
    { href: '/reviews/', label: t('nav.reviews'), icon: <IconPen width={18} height={18} /> },
    { href: '/lists/', label: t('nav.lists'), icon: <IconList width={18} height={18} /> },
    { href: '/people/', label: 'الممثلون والمخرجون', icon: <IconUsers width={18} height={18} /> },
    { href: '/about/', label: 'من نحن', icon: <IconShield width={18} height={18} /> },
    { href: '/contact/', label: 'اتصل بنا', icon: <IconList width={18} height={18} /> },
  ];

  return (
    <>
      <nav className="bottom-nav" aria-label="التنقل الرئيسي على الهاتف">
        <Link href="/" aria-current={pathname === '/' ? 'page' : undefined}>
          <IconHome />
          {t('nav.home')}
        </Link>
        <Link href="/movies/" aria-current={isActive('/movies') ? 'page' : undefined}>
          <IconFilm />
          {t('nav.movies')}
        </Link>
        <Link href="/series/" aria-current={isActive('/series') ? 'page' : undefined}>
          <IconTv />
          {t('nav.series')}
        </Link>
        <Link href="/favorites/" aria-current={isActive('/favorites') ? 'page' : undefined}>
          <span style={{ position: 'relative' }}>
            <IconHeart filled={favCount > 0} />
            {favCount > 0 ? (
              <span
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  top: -6,
                  insetInlineEnd: -10,
                  background: 'var(--accent)',
                  color: '#05222f',
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  borderRadius: 999,
                  padding: '0 5px',
                  lineHeight: '15px',
                }}
              >
                {favCount}
              </span>
            ) : null}
          </span>
          {t('nav.favorites')}
          <span className="sr-only">{favCount ? `(${favCount})` : ''}</span>
        </Link>
        <button type="button" onClick={() => setOpen(true)} data-active={open} aria-expanded={open} aria-haspopup="dialog">
          <IconMore />
          {t('nav.menu')}
        </button>
      </nav>

      {open ? (
        <div className="drawer" role="dialog" aria-modal="true" aria-label={t('nav.menu')}>
          <div className="drawer-panel">
            <div className="spread">
              <h3>{t('nav.menu')}</h3>
              <button type="button" className="icon-btn" onClick={() => setOpen(false)} aria-label={t('nav.closeMenu')}>
                <IconClose />
              </button>
            </div>
            <nav className="stack" aria-label="صفحات إضافية">
              {moreLinks.map((l) => (
                <Link key={l.href} href={l.href} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {l.icon}
                  {l.label}
                </Link>
              ))}
            </nav>
            <Link href="/search/" className="btn btn-primary" onClick={() => setOpen(false)}>
              {t('nav.search')}
            </Link>
          </div>
          <button
            type="button"
            aria-label={t('nav.closeMenu')}
            onClick={() => setOpen(false)}
            style={{ position: 'absolute', inset: 0, background: 'transparent', border: 0, zIndex: -1 }}
          />
        </div>
      ) : null}
    </>
  );
}
