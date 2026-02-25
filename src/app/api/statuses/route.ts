import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [configs, transitions] = await Promise.all([
      prisma.statusConfig.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.statusTransition.findMany(),
    ]);

    return NextResponse.json({
      success: true,
      data: { configs, transitions },
    });
  } catch (error) {
    console.error('Fetch statuses error:', error);
    return NextResponse.json(
      { success: false, error: 'serverError' },
      { status: 500 },
    );
  }
}
