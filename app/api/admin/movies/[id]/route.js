import { getMovieById, updateMovie, deleteMovie, duplicateMovie } from '@/lib/db.mjs';
import { parseBody, withAdmin, ok, fail } from '@/lib/api-helpers.mjs';

export const GET = withAdmin(async (_req, { params }) => {
  const { id } = await params;
  const m = await getMovieById(id);
  if (!m) return fail('الفيلم غير موجود.', 404);
  return ok({ movie: m });
});

export const PATCH = withAdmin(async (req, { params }, session) => {
  const { id } = await params;
  const body = await parseBody(req);
  const res = await updateMovie(id, body, { id: session.user.id, name: session.user.name });
  if (!res.ok) return fail(res.errors?._ || 'فشل التحديث.', 400, { errors: res.errors });
  return ok({ movie: res.movie });
});

export const DELETE = withAdmin(async (_req, { params }, session) => {
  const { id } = await params;
  const res = await deleteMovie(id, { id: session.user.id, name: session.user.name });
  if (!res.ok) return fail(res.error, 400);
  return ok();
});

export const POST = withAdmin(async (req, { params }, session) => {
  if (new URL(req.url).searchParams.get('action') !== 'duplicate') return fail('عملية غير مدعومة.', 400);
  const { id } = await params;
  const res = await duplicateMovie(id, { id: session.user.id, name: session.user.name });
  if (!res.ok) return fail(res.error, 404);
  return ok({ movie: res.movie });
});
