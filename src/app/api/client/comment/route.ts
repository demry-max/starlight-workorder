import { NextRequest, NextResponse } from 'next/server';
import { getClientSession } from '@/lib/auth';
import { commentService } from '@/services/comment.service';
import { commentSchema } from '@/lib/validators';
import { auditLog, getIp } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const session = await getClientSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = commentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'validation' },
        { status: 400 }
      );
    }

    // Clients can only comment on their own work order
    if (parsed.data.workOrderId !== session.workOrderId) {
      return NextResponse.json(
        { success: false, error: 'unauthorized' },
        { status: 403 }
      );
    }

    // Client comments are never internal
    const comment = await commentService.addClientComment(
      parsed.data.workOrderId,
      parsed.data.content,
      'Client'
    );

    await auditLog({
      action: 'comment.client_add',
      actor: `client:${session.workorderNumber}`,
      targetType: 'workorder',
      targetId: parsed.data.workOrderId,
      detail: { commentId: comment.id },
      ip: getIp(request),
    });

    return NextResponse.json({ success: true, data: comment });
  } catch (error) {
    console.error('Client comment error:', error);
    return NextResponse.json(
      { success: false, error: 'serverError' },
      { status: 500 }
    );
  }
}
