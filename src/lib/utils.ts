import crypto from 'crypto';

export function generateWorkOrderNumber(): string {
  return 'WO-' + crypto.randomBytes(5).toString('hex').toUpperCase();
}

export function formatDate(date: Date | string | null): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
}

export function isOverdue(dueDate: Date | string | null, status: string): boolean {
  if (!dueDate) return false;
  const terminalStatuses = ['COMPLETED', 'CLOSED', 'CANCELLED'];
  if (terminalStatuses.includes(status)) return false;
  const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  return due < new Date();
}

export function getStartOfWeek(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const start = new Date(now);
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);
  return start;
}
