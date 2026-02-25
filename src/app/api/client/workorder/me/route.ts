import { NextRequest, NextResponse } from 'next/server';
import { getClientSession } from '@/lib/auth';
import { workorderService } from '@/services/workorder.service';
import { auditLog, getIp } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const session = await getClientSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'unauthorized' },
        { status: 401 }
      );
    }

    const data = await workorderService.getClientView(session.workOrderId);
    if (!data) {
      return NextResponse.json(
        { success: false, error: 'notFound' },
        { status: 404 }
      );
    }

    await auditLog({
      action: 'workorder.client_view',
      actor: `client:${session.workorderNumber}`,
      targetType: 'workorder',
      targetId: session.workOrderId,
      ip: getIp(request),
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Get client workorder error:', error);
    return NextResponse.json(
      { success: false, error: 'serverError' },
      { status: 500 }
    );
  }
}
