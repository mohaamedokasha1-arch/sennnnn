import { logout } from '@/lib/db.mjs';
import { getCurrentUser, clearSessionCookie } from '@/lib/auth.mjs';
import { apiError, ok } from '@/lib/api-helpers.mjs';

export async function POST() {
  try {
    const session = await getCurrentUser();
    if (session) await logout(session.token);
    await clearSessionCookie();
    return ok();
  } catch (err) {
    // Clear the browser cookie even if the remote store is temporarily unavailable.
    try { await clearSessionCookie(); } catch (cookieErr) { console.error('Could not clear session cookie:', cookieErr); }
    return apiError(err);
  }
}
