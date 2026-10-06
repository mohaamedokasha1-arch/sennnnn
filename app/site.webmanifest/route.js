import siteConfig from '@/site.config.mjs';
import { brandConfig } from '@/lib/brand.mjs';

/** Arabic-first PWA manifest; the product currently has one shared install entry point. */
export const dynamic = 'force-static';

export function GET() {
  const manifest = {
    id: '/',
    name: brandConfig.ar.name,
    short_name: brandConfig.ar.shortName,
    description: siteConfig.description,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#0a0c0f',
    theme_color: '#0a0c0f',
    dir: brandConfig.ar.direction,
    lang: 'ar',
    categories: ['entertainment'],
    icons: [
      { src: '/assets/logo/akasha-favicon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/assets/logo/akasha-favicon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  };
  return new Response(JSON.stringify(manifest), {
    headers: { 'content-type': 'application/manifest+json; charset=utf-8' },
  });
}
