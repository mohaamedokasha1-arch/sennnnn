import { getStats, getAuditLog } from '@/lib/db.mjs';
import { withAdmin, ok } from '@/lib/api-helpers.mjs';

export const GET = withAdmin(async () => {
  const stats = await getStats();
  const log = await getAuditLog({ limit: 20 });
  return ok({ stats, log });
});
