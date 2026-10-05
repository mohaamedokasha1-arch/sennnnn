import siteConfig from '@/site.config.mjs';

/**
 * robots.txt is generated as a static text/plain file for every deployment.
 * Keep it to directives Google supports: the site stays crawlable, while
 * noindex pages remain accessible so Google can read their page-level robots tag.
 * The non-standard `Host` directive is intentionally omitted (Google ignores it).
 */
export const dynamic = 'force-static';

export default function robots() {
  const origin = new URL(siteConfig.url).origin;
  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: `${origin}/sitemap.xml`,
  };
}
