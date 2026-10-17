import { addEpisode } from '@/lib/db.mjs';
import { parseBody, withAdmin, ok, fail } from '@/lib/api-helpers.mjs';

export const POST = withAdmin(async (req, { params }, session) => {
  const { id, seasonId } = await params;
  const body = await parseBody(req);
  try {
    const res = await addEpisode(id, seasonId, body, { id: session.user.id, name: session.user.name });
    return ok({ episode: res.episode });
  } catch (err) {
    if (err.statusCode === 503) throw err;
    return fail(err.message, 400);
  }
});
