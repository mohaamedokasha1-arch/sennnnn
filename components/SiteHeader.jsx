import Link from 'next/link';
import { t } from '@/lib/i18n.mjs';
import HeaderSearch from './HeaderSearch.jsx';
import { IconHeart } from './Icons.jsx';
import { BrandBlock } from './Brand.jsx';

/**
 * الشريط العلوي: الشعار + التنقل (سطح المكتب) + البحث الفوري + رابط المفضلة.
 * الاسم والشعار واللون كلها تأتي من site.config.mjs — تغييرها لا يمسّ هذا الملف.
 * الاسم والشعار يتبدلان ديناميكيًا حسب اللغة النشطة (أكاشا سينما / Akasha Cenima).
 */
export default function SiteHeader() {
  const nav = [
    { href: '/movies/', label: t('nav.movies') },
    { href: '/series/', label: t('nav.series') },
    { href: '/genres/', label: t('nav.genres') },
    { href: '/reviews/', label: t('nav.reviews') },
    { href: '/lists/', label: t('nav.lists') },
  ];

  return (
    <header className="site-header">
      <div className="container header-inner">
        <BrandBlock linked />

        <nav className="main-nav" aria-label="التنقل الرئيسي">
          {nav.map((n) => (
            <Link key={n.href} href={n.href}>
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="header-search">
          <HeaderSearch />
        </div>

        <div className="header-actions">
          <Link
            href="/favorites/"
            className="icon-btn hide-mobile"
            aria-label={t('nav.favorites')}
            title={`${t('nav.favorites')} — ${t('favorites.localNotice')}`}
            id="header-fav-link"
          >
            <IconHeart />
          </Link>
        </div>
      </div>
    </header>
  );
}
