import { updateEpisode, deleteEpisode } from '@/lib/db.mjs';
import { parseBody, withAdmin, ok, fail } from '@/lib/api-helpers.mjs';

export const PATCH = withAdmin(async (req, { params }, session) => {
  const { id, seasonId, episodeId } = await params;
  const body = await parseBody(req);
  try {
    const res = updateEpisode(id, seasonId, episodeId, body, { id: session.user.id, name: session.user.name });
    return ok({ episode: res.episode });
  } catch (err) {
    return fail(err.message, 400);
  }
});

export const DELETE = withAdmin(async (_req, { params }, session) => {
  const { id, seasonId, episodeId } = await params;
  deleteEpisode(id, seasonId, episodeId, { id: session.user.id, name: session.user.name });
  return ok();
});
