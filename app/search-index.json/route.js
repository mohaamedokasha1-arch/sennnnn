import { buildIndex } from '@/lib/search.mjs';
import { getWorks } from '@/lib/public-data.mjs';

/** Keep newly published dashboard entries searchable without redeploying. */
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const index = buildIndex(await getWorks());
    return Response.json(index, {
      headers: { 'X-Robots-Tag': 'noindex, nofollow', 'Cache-Control': 'public, max-age=0, s-maxage=2' },
    });
  } catch (err) {
    console.error('Search index unavailable:', err);
    return Response.json({ works: [], reviews: [], lists: [], people: [] }, {
      headers: { 'X-Robots-Tag': 'noindex, nofollow', 'Cache-Control': 'no-store' },
    });
  }
}
