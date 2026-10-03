import Link from 'next/link';
import siteConfig from '@/site.config.mjs';
import { t } from '@/lib/i18n.mjs';
import HeaderSearch from './HeaderSearch.jsx';
import { IconHeart } from './Icons.jsx';

/**
 * الشريط العلوي: الشعار + التنقل (سطح المكتب) + البحث الفوري + رابط المفضلة.
 * الاسم والشعار واللون كلها تأتي من site.config.mjs — تغييرها لا يمسّ هذا الملف.
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
        <Link href="/" className="brand" aria-label={`${siteConfig.siteName} — الصفحة الرئيسية`}>
          {siteConfig.logoImage ? (
            <img src={siteConfig.logoImage} alt={siteConfig.siteName} width={38} height={38} />
          ) : (
            <span className="brand-mark" aria-hidden="true">
              {(siteConfig.logoText || siteConfig.siteName).slice(0, 1)}
            </span>
          )}
          <span className="brand-text">
            <span className="brand-name">{siteConfig.logoText || siteConfig.siteName}</span>
            <span className="brand-latin">{siteConfig.siteNameLatin}</span>
          </span>
        </Link>

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
