import siteConfig from '@/site.config.mjs';

/** ملف robots.txt — يُولَّد تلقائيًا ويشير إلى خريطة الموقع */
export const dynamic = 'force-static';

export default function robots() {
  const base = siteConfig.url.replace(/\/$/, '');
  return {
    // Keep noindex pages crawlable so Google can read their robots meta directive.
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
