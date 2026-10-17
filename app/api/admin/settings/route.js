import { getSiteSettings, updateSiteSettings } from '@/lib/db.mjs';
import { parseBody, withAdmin, ok } from '@/lib/api-helpers.mjs';

export const GET = withAdmin(async () => {
  return ok({ settings: await getSiteSettings() });
});

export const POST = withAdmin(async (req, _ctx, session) => {
  const body = await parseBody(req);
  await updateSiteSettings(body, { id: session.user.id, name: session.user.name });
  return ok();
});
