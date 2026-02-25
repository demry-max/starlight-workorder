import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { auditLog, getIp } from '@/lib/logger';
import { z } from 'zod';

const updateSalesRepSchema = z.object({
  name: z.string().min(1).max(255).trim().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = updateSalesRepSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'validation', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const salesRep = await prisma.salesRep.update({
      where: { id },
      data: parsed.data,
    });

    await auditLog({
      action: 'salesrep.update',
      actor: session.staffId,
      actorEmail: session.email,
      targetType: 'salesrep',
      targetId: id,
      detail: { fields: Object.keys(parsed.data) },
      ip: getIp(request),
    });

    return NextResponse.json({ success: true, data: salesRep });
  } catch (error) {
    console.error('Update sales rep error:', error);
    return NextResponse.json({ success: false, error: 'serverError' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await prisma.salesRep.delete({ where: { id } });

    await auditLog({
      action: 'salesrep.delete',
      actor: session.staffId,
      actorEmail: session.email,
      targetType: 'salesrep',
      targetId: id,
      ip: getIp(request),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete sales rep error:', error);
    return NextResponse.json({ success: false, error: 'serverError' }, { status: 500 });
  }
}
