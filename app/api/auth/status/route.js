import { getCurrentUser, hasAdmin } from '@/lib/auth.mjs';
import { apiError, ok } from '@/lib/api-helpers.mjs';

export async function GET() {
  try {
    const session = await getCurrentUser();
    const adminExists = await hasAdmin();
    if (!session) return ok({ authenticated: false, needsSetup: !adminExists });
    return ok({ authenticated: true, needsSetup: false, user: session.user, expiresAt: session.expiresAt });
  } catch (err) {
    return apiError(err);
  }
}
