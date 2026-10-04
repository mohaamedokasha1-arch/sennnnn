import './globals.css';
import siteConfig from '@/site.config.mjs';
import { t } from '@/lib/i18n.mjs';
import { buildMetadata, websiteJsonLd, organizationJsonLd } from '@/lib/seo.mjs';
import SiteHeader from '@/components/SiteHeader.jsx';
import SiteFooter from '@/components/SiteFooter.jsx';
import MobileNav from '@/components/Navigation.jsx';
import JsonLd from '@/components/JsonLd.jsx';
import { AdHead } from '@/components/Ads.jsx';

/**
 * التخطيط العام: RTL عربي، الوضع الداكن افتراضي، هوية من site.config.mjs.
 * كل الألوان التفاعلية تُشتق من اللون المميز الواحد accent.
 */
const accentCss = `:root{
  --accent:${siteConfig.accent.base};
  --accent-hover:${siteConfig.accent.hover};
  --accent-soft:${siteConfig.accent.soft};
  --accent-ring:${siteConfig.accent.base}73;
}`;

export const metadata = {
  ...buildMetadata({
    title: undefined,
    description: siteConfig.description,
    path: '/',
  }),
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.siteName} — ${siteConfig.slogan}`,
    template: `%s | ${siteConfig.siteName}`,
  },
  applicationName: siteConfig.siteName,
  keywords: ['أفلام', 'مسلسلات', 'مراجعات أفلام', 'تصنيفات أفلام', 'ترشيحات', 'سينما عربية', 'اكتشاف أفلام'],
  authors: [{ name: `${siteConfig.siteName} — فريق التحرير` }],
  creator: siteConfig.siteName,
  publisher: siteConfig.siteName,
  formatDetection: { telephone: false, email: false, address: false },
  manifest: '/site.webmanifest',
  icons: {
    icon: [{ url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
    apple: [{ url: '/apple-icon.png', sizes: '180x180' }],
  },
  openGraph: {
    ...buildMetadata({ path: '/', image: '/og-default.jpg' }).openGraph,
    siteName: siteConfig.siteName,
  },
  twitter: {
    ...buildMetadata({ path: '/', image: '/og-default.jpg' }).twitter,
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0a0c0f',
  colorScheme: 'dark',
};

export default function RootLayout({ children }) {
  return (
    <html lang={siteConfig.locale} dir={siteConfig.dir}>
      <head>
        <link rel="preload" href="/fonts/plex-arabic-coptic-0.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <style dangerouslySetInnerHTML={{ __html: accentCss }} />
        <link rel="preconnect" href="https://www.youtube-nocookie.com" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body>
        <a className="skip-link" href="#main-content">
          {t('site.skipToContent')}
        </a>
        <div className="layout">
          <SiteHeader />
          <main id="main-content">{children}</main>
          <SiteFooter />
        </div>
        <MobileNav />
        <JsonLd data={[websiteJsonLd(), organizationJsonLd()]} />
        {/* سكربت Monetag العام — لا يُحمَّل إلا إذا وُضع الكود في site.config.mjs */}
        <AdHead />
      </body>
    </html>
  );
}
