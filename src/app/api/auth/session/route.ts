import { NextResponse } from 'next/server';

/**
 * Simple session endpoint that returns no authentication
 * Since v4 removed NextAuth, we just return unauthenticated status
 */
export async function GET() {
  return NextResponse.json({
    user: null,
    isAuthenticated: false
  });
}
