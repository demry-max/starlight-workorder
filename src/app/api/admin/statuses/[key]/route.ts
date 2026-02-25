import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { auditLog, getIp } from '@/lib/logger';

const updateStatusSchema = z.object({
  labelEn: z.string().min(1).max(255).optional(),
  labelZh: z.string().min(1).max(255).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  bgColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  textColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  sortOrder: z.number().int().min(0).optional(),
  defaultProgress: z.number().int().min(-1).max(100).optional(),
  isTerminal: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 });
    }

    const { key } = await params;
    const body = await request.json();
    const parsed = updateStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'validation', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const existing = await prisma.statusConfig.findUnique({ where: { key } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Status not found' }, { status: 404 });
    }

    // If setting as default, unset any existing default
    if (parsed.data.isDefault === true) {
      await prisma.statusConfig.updateMany({
        where: { isDefault: true, key: { not: key } },
        data: { isDefault: false },
      });
    }

    // If unsetting default, ensure at least one default remains
    if (parsed.data.isDefault === false && existing.isDefault) {
      return NextResponse.json(
        { success: false, error: 'Cannot unset the only default status. Set another status as default first.' },
        { status: 400 },
      );
    }

    const updated = await prisma.statusConfig.update({
      where: { key },
      data: parsed.data,
    });

    await auditLog({
      action: 'status.update',
      actor: session.staffId,
      actorEmail: session.email,
      targetType: 'status',
      targetId: key,
      detail: { key, fields: Object.keys(parsed.data) },
      ip: getIp(request),
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update status error:', error);
    return NextResponse.json({ success: false, error: 'serverError' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 });
    }

    const { key } = await params;

    const existing = await prisma.statusConfig.findUnique({ where: { key } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Status not found' }, { status: 404 });
    }

    // Cannot delete the default status
    if (existing.isDefault) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete the default status. Set another status as default first.' },
        { status: 400 },
      );
    }

    // Cannot delete a status that is currently used by work orders
    const usageCount = await prisma.workOrder.count({ where: { status: key } });
    if (usageCount > 0) {
      return NextResponse.json(
        { success: false, error: `Cannot delete: ${usageCount} work order(s) are using this status.` },
        { status: 400 },
      );
    }

    // Also remove any transitions referencing this status
    await prisma.statusTransition.deleteMany({
      where: { OR: [{ fromStatusKey: key }, { toStatusKey: key }] },
    });

    await prisma.statusConfig.delete({ where: { key } });

    await auditLog({
      action: 'status.delete',
      actor: session.staffId,
      actorEmail: session.email,
      targetType: 'status',
      targetId: key,
      detail: { key },
      ip: getIp(request),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete status error:', error);
    return NextResponse.json({ success: false, error: 'serverError' }, { status: 500 });
  }
}
