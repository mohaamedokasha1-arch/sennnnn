import siteConfig from '@/site.config.mjs';

/** ملف بيانات تطبيق الويب — يسمح بإضافة الموقع إلى الشاشة الرئيسية على الهاتف */
export const dynamic = 'force-static';

export function GET() {
  const manifest = {
    name: siteConfig.siteName,
    short_name: siteConfig.siteName,
    description: siteConfig.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0c0f',
    theme_color: '#0a0c0f',
    dir: 'rtl',
    lang: 'ar',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
  return new Response(JSON.stringify(manifest), { headers: { 'content-type': 'application/manifest+json' } });
}
