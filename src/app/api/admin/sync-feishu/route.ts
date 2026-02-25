import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { feishuService } from '@/services/feishu.service';
import { auditLog, getIp } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'unauthorized' },
        { status: 401 }
      );
    }

    if (!feishuService.isConfigured()) {
      return NextResponse.json(
        { success: false, error: 'Feishu integration is not configured.' },
        { status: 400 }
      );
    }

    const result = await feishuService.syncFromFeishu();

    await auditLog({
      action: 'feishu.sync',
      actor: session.staffId,
      actorEmail: session.email,
      targetType: 'feishu',
      detail: result,
      ip: getIp(request),
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Feishu sync error:', error);
    await auditLog({
      action: 'feishu.sync',
      success: false,
      detail: { error: error instanceof Error ? error.message : 'Unknown error' },
    });
    return NextResponse.json(
      { success: false, error: 'serverError' },
      { status: 500 }
    );
  }
}

// GET endpoint to check Feishu configuration status
export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { configured: feishuService.isConfigured() },
    });
  } catch (error) {
    console.error('Feishu status error:', error);
    return NextResponse.json(
      { success: false, error: 'serverError' },
      { status: 500 }
    );
  }
}
