import siteConfig from '@/site.config.mjs';

/** ملف robots.txt — يُولَّد تلقائيًا ويشير إلى خريطة الموقع */
export const dynamic = 'force-static';

export default function robots() {
  const base = siteConfig.url.replace(/\/$/, '');
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // صفحات وظيفية لا فائدة من فهرستها (وقد تُنتج محتوى مكررًا)
        disallow: ['/search/', '/favorites/', '/404/', '/404.html'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
