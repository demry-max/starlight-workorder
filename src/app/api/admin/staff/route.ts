import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { staffRepository } from '@/repositories/staff.repository';

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'unauthorized' },
        { status: 401 }
      );
    }

    const staff = await staffRepository.findAll();
    return NextResponse.json({ success: true, data: staff });
  } catch (error) {
    console.error('Get staff error:', error);
    return NextResponse.json(
      { success: false, error: 'serverError' },
      { status: 500 }
    );
  }
}
