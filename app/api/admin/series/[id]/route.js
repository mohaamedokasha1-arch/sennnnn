import { getSeriesById, updateSeries, deleteSeries, addSeason } from '@/lib/db.mjs';
import { parseBody, withAdmin, ok, fail } from '@/lib/api-helpers.mjs';

export const GET = withAdmin(async (_req, { params }) => {
  const { id } = await params;
  const s = await getSeriesById(id);
  if (!s) return fail('المسلسل غير موجود.', 404);
  return ok({ series: s });
});

export const PATCH = withAdmin(async (req, { params }, session) => {
  const { id } = await params;
  const body = await parseBody(req);
  const res = await updateSeries(id, body, { id: session.user.id, name: session.user.name });
  if (!res.ok) return fail(res.errors?._ || 'فشل التحديث.', 400, { errors: res.errors });
  return ok({ series: res.series });
});

export const DELETE = withAdmin(async (_req, { params }, session) => {
  const { id } = await params;
  const res = await deleteSeries(id, { id: session.user.id, name: session.user.name });
  if (!res.ok) return fail(res.error, 400);
  return ok();
});

// إضافة موسم: POST /api/admin/series/[id]/seasons
