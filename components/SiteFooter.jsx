import Link from 'next/link';
import siteConfig from '@/site.config.mjs';
import { t } from '@/lib/i18n.mjs';
import { siteStats } from '@/lib/content.mjs';

/**
 * التذييل: روابط التنقل + الصفحات القانونية + بيان النشاط (منصة اكتشاف لا استضافة).
 * كل الروابط تؤدي إلى صفحات موجودة فعليًا في الموقع.
 */
export default function SiteFooter() {
  const stats = siteStats();
  const year = new Date().getFullYear();

  const browse = [
    { href: '/movies/', label: t('nav.movies') },
    { href: '/series/', label: t('nav.series') },
    { href: '/genres/', label: t('nav.genres') },
    { href: '/reviews/', label: t('nav.reviews') },
    { href: '/lists/', label: t('nav.lists') },
    { href: '/search/', label: t('nav.search') },
  ];

  const legal = [
    { href: '/about/', label: 'من نحن' },
    { href: '/contact/', label: 'اتصل بنا' },
    { href: '/privacy/', label: 'سياسة الخصوصية' },
    { href: '/cookies/', label: 'سياسة ملفات تعريف الارتباط' },
    { href: '/terms/', label: 'شروط الاستخدام' },
    { href: '/ip-rights/', label: 'حقوق الملكية وإزالة المحتوى' },
  ];

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-col">
            <div className="brand" style={{ marginBottom: 12 }}>
              <span className="brand-mark" aria-hidden="true">
                {(siteConfig.logoText || siteConfig.siteName).slice(0, 1)}
              </span>
              <span className="brand-text">
                <span className="brand-name">{siteConfig.logoText || siteConfig.siteName}</span>
                <span className="brand-latin">{siteConfig.siteNameLatin}</span>
              </span>
            </div>
            <p className="footer-about">{siteConfig.description}</p>
            <p className="footer-about" style={{ marginTop: 10 }}>
              {stats.works} عملًا · {stats.reviews} مراجعة · {stats.lists} قائمة ترشيحات
            </p>
          </div>

          <div className="footer-col">
            <h3>{t('footer.browse')}</h3>
            <ul>
              {browse.map((l) => (
                <li key={l.href}>
                  <Link href={l.href}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-col">
            <h3>{t('footer.legal')}</h3>
            <ul>
              {legal.map((l) => (
                <li key={l.href}>
                  <Link href={l.href}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-col">
            <h3>{t('footer.about')}</h3>
            <ul>
              <li>
                <a href={`mailto:${siteConfig.contact.email}`}>{siteConfig.contact.email}</a>
              </li>
              {siteConfig.social.map((s) => (
                <li key={s.url}>
                  <a href={s.url} rel="noopener noreferrer me" target="_blank">
                    {s.label}
                  </a>
                </li>
              ))}
              <li>
                <Link href="/favorites/">{t('nav.favorites')}</Link>
              </li>
            </ul>
          </div>
        </div>

        <p className="footer-legal-note">{t('footer.noHosting')}</p>
        <p className="footer-legal-note">{t('footer.disclaimer')}</p>

        <div className="footer-bottom">
          <span>
            © {year} {siteConfig.siteName} — {t('footer.rights')}
          </span>
        </div>
      </div>
    </footer>
  );
}
