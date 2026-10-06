import './globals.css';
import siteConfig from '@/site.config.mjs';
import { t } from '@/lib/i18n.mjs';
import { buildMetadata, seoTitle, websiteJsonLd, organizationJsonLd } from '@/lib/seo.mjs';
import { brandName } from '@/lib/brand.mjs';
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
    default: seoTitle('اكتشف الأفلام والمسلسلات العربية والعالمية', 'ar', '/'),
    template: `%s | ${brandName('ar')}`,
  },
  applicationName: brandName('ar'),
  keywords: ['أفلام', 'مسلسلات', 'مراجعات أفلام', 'تصنيفات أفلام', 'ترشيحات', 'سينما عربية', 'اكتشاف أفلام'],
  authors: [{ name: `${brandName('ar')} — فريق التحرير` }],
  creator: brandName('ar'),
  publisher: brandName('ar'),
  // وسم إثبات ملكية الموقع لدى Google Search Console — يُقرأ من site.config.mjs.
  // Next.js يُدرجه في <head> قبل <body> تلقائيًا (meta name="google-site-verification").
  ...(siteConfig.googleSiteVerification
    ? { verification: { google: siteConfig.googleSiteVerification } }
    : {}),
  formatDetection: { telephone: false, email: false, address: false },
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/assets/logo/akasha-favicon.ico', sizes: 'any', type: 'image/x-icon' },
      { url: '/assets/logo/akasha-favicon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/assets/logo/akasha-favicon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  other: { language: 'ar' },
  openGraph: {
    ...buildMetadata({ path: '/', image: '/og-default.jpg' }).openGraph,
    title: seoTitle('اكتشف الأفلام والمسلسلات العربية والعالمية', 'ar', '/'),
    siteName: brandName('ar'),
  },
  twitter: {
    ...buildMetadata({ path: '/', image: '/og-default.jpg' }).twitter,
    title: seoTitle('اكتشف الأفلام والمسلسلات العربية والعالمية', 'ar', '/'),
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
