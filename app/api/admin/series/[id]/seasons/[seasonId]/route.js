import { updateSeason, deleteSeason, addEpisode } from '@/lib/db.mjs';
import { parseBody, withAdmin, ok, fail } from '@/lib/api-helpers.mjs';

export const PATCH = withAdmin(async (req, { params }, session) => {
  const { id, seasonId } = await params;
  const body = await parseBody(req);
  try {
    const res = updateSeason(id, seasonId, body, { id: session.user.id, name: session.user.name });
    return ok({ season: res.season });
  } catch (err) {
    return fail(err.message, 400);
  }
});

export const DELETE = withAdmin(async (_req, { params }, session) => {
  const { id, seasonId } = await params;
  deleteSeason(id, seasonId, { id: session.user.id, name: session.user.name });
  return ok();
});

// إضافة حلقة: POST …/seasons/[seasonId]/episodes
