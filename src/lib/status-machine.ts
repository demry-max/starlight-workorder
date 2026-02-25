import { WorkOrderStatus } from '@prisma/client';

// Define valid status transitions (Finite State Machine)
const VALID_TRANSITIONS: Record<WorkOrderStatus, WorkOrderStatus[]> = {
  DRAFT: ['RECEIVED', 'CANCELLED'],
  RECEIVED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: [
    'WAITING_FOR_CLIENT',
    'WAITING_FOR_THIRD_PARTY',
    'COMPLETED',
    'CANCELLED',
  ],
  WAITING_FOR_CLIENT: ['IN_PROGRESS', 'CANCELLED'],
  WAITING_FOR_THIRD_PARTY: ['IN_PROGRESS', 'CANCELLED'],
  COMPLETED: ['CLOSED'],
  CLOSED: [],
  CANCELLED: [],
};

export function isValidTransition(
  from: WorkOrderStatus,
  to: WorkOrderStatus
): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function getValidNextStatuses(current: WorkOrderStatus): WorkOrderStatus[] {
  return VALID_TRANSITIONS[current] || [];
}

export function isTerminalStatus(status: WorkOrderStatus): boolean {
  return status === 'CLOSED' || status === 'CANCELLED';
}

// Default progress percentages for each status
export const STATUS_DEFAULT_PROGRESS: Record<WorkOrderStatus, number> = {
  DRAFT: 0,
  RECEIVED: 5,
  IN_PROGRESS: 50,
  WAITING_FOR_CLIENT: -1, // -1 means don't auto-update
  WAITING_FOR_THIRD_PARTY: -1,
  COMPLETED: 100,
  CLOSED: 100,
  CANCELLED: -1,
};
