import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect client workorder pages
  if (pathname.startsWith('/client/workorder')) {
    const clientToken = request.cookies.get('client_token')?.value;
    if (!clientToken) {
      return NextResponse.redirect(new URL('/client/login', request.url));
    }
  }

  // Protect admin pages (except login)
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const adminToken = request.cookies.get('admin_token')?.value;
    if (!adminToken) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // Security headers
  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  return response;
}

export const config = {
  matcher: ['/client/workorder/:path*', '/admin/:path*'],
};
