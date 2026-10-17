import { getMovieById, updateMovie, deleteMovie, duplicateMovie } from '@/lib/db.mjs';
import { parseBody, withAdmin, ok, fail } from '@/lib/api-helpers.mjs';

export const GET = withAdmin(async (_req, { params }) => {
  const { id } = await params;
  const m = getMovieById(id);
  if (!m) return fail('الفيلم غير موجود.', 404);
  return ok({ movie: m });
});

export const PATCH = withAdmin(async (req, { params }, session) => {
  const { id } = await params;
  const body = await parseBody(req);
  const res = updateMovie(id, body, { id: session.user.id, name: session.user.name });
  if (!res.ok) return fail(res.errors?._ || 'فشل التحديث.', 400, { errors: res.errors });
  return ok({ movie: res.movie });
});

export const DELETE = withAdmin(async (_req, { params }, session) => {
  const { id } = await params;
  const res = deleteMovie(id, { id: session.user.id, name: session.user.name });
  if (!res.ok) return fail(res.error, 400);
  return ok();
});

export async function POST(req, { params }) {
  // POST /api/admin/movies/[id]/duplicate
  const { searchParams } = new URL(req.url);
  if (searchParams.get('action') !== 'duplicate') {
    return fail('عملية غير مدعومة.', 400);
  }
  const session = (await import('@/lib/auth.mjs')).requireAdmin();
  if (!session) return fail('غير مصرح.', 401);
  const { id } = await params;
  const res = duplicateMovie(id, { id: session.user.id, name: session.user.name });
  if (!res.ok) return fail(res.error, 400);
  (await import('@/lib/api-helpers.mjs')); // force side-effect
  // invalidate cache
  (await import('@/lib/public-data.mjs')).invalidateCache();
  return Response.json({ ok: true, movie: res.movie });
}
