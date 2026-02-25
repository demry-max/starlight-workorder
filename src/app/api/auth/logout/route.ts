import { NextRequest, NextResponse } from 'next/server';
import { clearCookieHeader } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'client';

  const response = NextResponse.json({ success: true });

  if (type === 'admin') {
    response.headers.append('Set-Cookie', clearCookieHeader('admin_token'));
    response.headers.append('Set-Cookie', clearCookieHeader('admin_refresh'));
  } else {
    response.headers.append('Set-Cookie', clearCookieHeader('client_token'));
    response.headers.append('Set-Cookie', clearCookieHeader('client_refresh'));
  }

  return response;
}
