import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { auditLog, getIp } from '@/lib/logger';
import { z } from 'zod';

const createSalesRepSchema = z.object({
  name: z.string().min(1).max(255).trim(),
});

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 });
    }

    const salesReps = await prisma.salesRep.findMany({
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ success: true, data: salesReps });
  } catch (error) {
    console.error('Get sales reps error:', error);
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
    const parsed = createSalesRepSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'validation', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const salesRep = await prisma.salesRep.create({
      data: { name: parsed.data.name },
    });

    await auditLog({
      action: 'salesrep.create',
      actor: session.staffId,
      actorEmail: session.email,
      targetType: 'salesrep',
      targetId: salesRep.id,
      detail: { name: salesRep.name },
      ip: getIp(request),
    });

    return NextResponse.json({ success: true, data: salesRep }, { status: 201 });
  } catch (error) {
    console.error('Create sales rep error:', error);
    return NextResponse.json({ success: false, error: 'serverError' }, { status: 500 });
  }
}
