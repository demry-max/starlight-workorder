import { workorderRepository } from '@/repositories/workorder.repository';
import { getStartOfWeek } from '@/lib/utils';
import type { DashboardStats } from '@/types';

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const startOfWeek = getStartOfWeek();

    const [totalOpen, overdue, waitingForClient, completedThisWeek, byStatus, staffWorkload] =
      await Promise.all([
        workorderRepository.countOpen(),
        workorderRepository.countOverdue(),
        workorderRepository.countWaitingForClient(),
        workorderRepository.countCompletedSince(startOfWeek),
        workorderRepository.countByStatus(),
        workorderRepository.staffWorkload(),
      ]);

    return {
      totalOpen,
      overdue,
      waitingForClient,
      completedThisWeek,
      byStatus,
      staffWorkload,
    };
  },
};
