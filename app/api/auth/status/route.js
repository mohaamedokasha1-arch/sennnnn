import { NextResponse } from 'next/server';
import { getCurrentUser, hasAdmin } from '@/lib/auth.mjs';

export async function GET() {
  const session = await getCurrentUser();
  const adminExists = hasAdmin();
  if (!session) {
    return NextResponse.json({ authenticated: false, needsSetup: !adminExists });
  }
  return NextResponse.json({
    authenticated: true,
    needsSetup: false,
    user: session.user,
    expiresAt: session.expiresAt,
  });
}
