/**
 * ============================================================================
 *  مساعدات المصادقة لطرق الـAPI
 * ============================================================================
 */
import { cookies } from 'next/headers';
import { getSession, hasAdmin } from './db.mjs';

const COOKIE_NAME = 'akasha_session';

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return getSession(token);
}

export async function requireAdmin() {
  const session = await getCurrentUser();
  if (!session || session.user.role !== 'admin') {
    return null;
  }
  return session;
}

export async function setSessionCookie(token, expiresAt) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(expiresAt),
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

export { hasAdmin };
