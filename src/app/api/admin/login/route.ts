import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/services/auth.service';
import { adminLoginSchema } from '@/lib/validators';
import { createCookieHeader } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = adminLoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'validation' },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const result = await authService.adminLogin(email, password);

    if (!result.success) {
      const status = result.error === 'rateLimited' ? 429 : 401;
      return NextResponse.json(
        { success: false, error: result.error },
        { status }
      );
    }

    const response = NextResponse.json({ success: true });

    response.headers.append(
      'Set-Cookie',
      createCookieHeader('admin_token', result.token!, 3600)
    );
    response.headers.append(
      'Set-Cookie',
      createCookieHeader('admin_refresh', result.refreshToken!, 604800)
    );

    return response;
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { success: false, error: 'serverError' },
      { status: 500 }
    );
  }
}
