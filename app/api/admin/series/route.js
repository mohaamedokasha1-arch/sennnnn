import { listSeries, createSeries } from '@/lib/db.mjs';
import { parseBody, withAdmin, ok, fail } from '@/lib/api-helpers.mjs';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const q = Object.fromEntries(searchParams.entries());
  const opts = {
    search: q.search || '',
    sort: q.sort || 'newest',
    page: Number(q.page) || 1,
    perPage: Math.min(50, Math.max(10, Number(q.perPage) || 20)),
    genre: q.genre || '',
  };
  if (q.draft === 'true') opts.draft = true;
  else if (q.draft === 'false') opts.draft = false;
  if (q.featured === 'true') opts.featured = true;
  else if (q.featured === 'false') opts.featured = false;
  if (q.missingEmbed === '1') opts.missingEmbed = true;
  if (q.missingPoster === '1') opts.missingPoster = true;
  const result = listSeries(opts);
  return Response.json({ ok: true, ...result });
}

export const POST = withAdmin(async (req, _, session) => {
  const body = await parseBody(req);
  const res = createSeries(body, { id: session.user.id, name: session.user.name });
  if (!res.ok) return fail('فشل الحفظ.', 400, { errors: res.errors });
  return ok({ series: res.series });
});
