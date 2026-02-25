import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/services/auth.service';
import { clientLoginSchema } from '@/lib/validators';
import { createCookieHeader } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = clientLoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'validation' },
        { status: 400 }
      );
    }

    const { workorderNumber, password } = parsed.data;
    const result = await authService.clientLogin(workorderNumber, password);

    if (!result.success) {
      const status = result.locked ? 429 : 401;
      return NextResponse.json(
        { success: false, error: result.error, locked: result.locked },
        { status }
      );
    }

    const response = NextResponse.json({ success: true });

    // Set httpOnly cookies
    response.headers.append(
      'Set-Cookie',
      createCookieHeader('client_token', result.token!, 3600) // 1 hour
    );
    response.headers.append(
      'Set-Cookie',
      createCookieHeader('client_refresh', result.refreshToken!, 604800) // 7 days
    );

    return response;
  } catch (error) {
    console.error('Client login error:', error);
    return NextResponse.json(
      { success: false, error: 'serverError' },
      { status: 500 }
    );
  }
}
