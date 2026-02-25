import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { dashboardService } from '@/services/dashboard.service';

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'unauthorized' },
        { status: 401 }
      );
    }

    const stats = await dashboardService.getStats();
    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      { success: false, error: 'serverError' },
      { status: 500 }
    );
  }
}
