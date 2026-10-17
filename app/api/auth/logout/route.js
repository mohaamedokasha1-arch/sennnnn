import { NextResponse } from 'next/server';
import { logout } from '@/lib/db.mjs';
import { getCurrentUser, clearSessionCookie } from '@/lib/auth.mjs';

export async function POST() {
  const session = await getCurrentUser();
  if (session) logout(session.token);
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
