import { addSeason } from '@/lib/db.mjs';
import { parseBody, withAdmin, ok, fail } from '@/lib/api-helpers.mjs';

export const POST = withAdmin(async (req, { params }, session) => {
  const { id } = await params;
  const body = await parseBody(req);
  const res = addSeason(id, body, { id: session.user.id, name: session.user.name });
  if (!res.ok) return fail(res.error, 400);
  return ok({ season: res.season });
});
