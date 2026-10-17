import sitemap from '../sitemap.js';

/** Legacy Search Console mirror, generated from the same live entries as sitemap.xml. */
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const entries = await sitemap();
    // These entries contain normalized local URLs only; match Next's metadata XML
    // serialization so the mirror remains byte-for-byte equivalent.
    const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
      entries.map(({ url }) => `<url>\n<loc>${url}</loc>\n</url>\n`).join('') +
      '</urlset>\n';
    return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
  } catch (err) {
    console.error('Sitemap mirror unavailable:', err);
    return new Response('تعذّر تحميل خريطة الموقع مؤقتًا.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }
}
