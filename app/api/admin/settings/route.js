import { getSiteSettings, updateSiteSettings } from '@/lib/db.mjs';
import { parseBody, withAdmin, ok } from '@/lib/api-helpers.mjs';

export const GET = withAdmin(() => {
  return ok({ settings: getSiteSettings() });
});

export const POST = withAdmin(async (req, _ctx, session) => {
  const body = await parseBody(req);
  updateSiteSettings(body, { id: session.user.id, name: session.user.name });
  return ok();
});
