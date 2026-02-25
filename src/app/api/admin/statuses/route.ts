import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { auditLog, getIp } from '@/lib/logger';

const createStatusSchema = z.object({
  key: z.string().min(1).max(100).regex(/^[A-Z][A-Z0-9_]*$/, 'Key must be uppercase with underscores'),
  labelEn: z.string().min(1).max(255),
  labelZh: z.string().min(1).max(255),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  bgColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  textColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  sortOrder: z.number().int().min(0).default(0),
  defaultProgress: z.number().int().min(-1).max(100).default(-1),
  isTerminal: z.boolean().default(false),
  isDefault: z.boolean().default(false),
});

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 });
    }

    const statuses = await prisma.statusConfig.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({ success: true, data: statuses });
  } catch (error) {
    console.error('List statuses error:', error);
    return NextResponse.json({ success: false, error: 'serverError' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'validation', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    // Check for duplicate key
    const existing = await prisma.statusConfig.findUnique({ where: { key: parsed.data.key } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Status key already exists' },
        { status: 409 },
      );
    }

    // If this status is being set as default, unset any existing default
    if (parsed.data.isDefault) {
      await prisma.statusConfig.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const status = await prisma.statusConfig.create({ data: parsed.data });

    await auditLog({
      action: 'status.create',
      actor: session.staffId,
      actorEmail: session.email,
      targetType: 'status',
      targetId: parsed.data.key,
      detail: { key: parsed.data.key, labelEn: parsed.data.labelEn },
      ip: getIp(request),
    });

    return NextResponse.json({ success: true, data: status }, { status: 201 });
  } catch (error) {
    console.error('Create status error:', error);
    return NextResponse.json({ success: false, error: 'serverError' }, { status: 500 });
  }
}
