import { changePassword, logout } from '@/lib/db.mjs';
import { parseBody, withAdmin, ok, fail } from '@/lib/api-helpers.mjs';
import { getCurrentUser, clearSessionCookie } from '@/lib/auth.mjs';

export const POST = withAdmin(async (req, _ctx, session) => {
  const body = await parseBody(req);
  const res = changePassword(session.user.id, String(body.currentPassword || ''), String(body.newPassword || ''));
  if (!res.ok) return fail(res.error, 400);
  const s = await getCurrentUser();
  if (s) logout(s.token);
  await clearSessionCookie();
  return ok({ sessionEnded: true });
});
