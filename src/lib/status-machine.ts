import { prisma } from '@/lib/prisma';

// Fetch valid transitions from the database
export async function isValidTransition(
  from: string,
  to: string
): Promise<boolean> {
  const count = await prisma.statusTransition.count({
    where: { fromStatusKey: from, toStatusKey: to },
  });
  return count > 0;
}

export async function getValidNextStatuses(current: string): Promise<string[]> {
  const transitions = await prisma.statusTransition.findMany({
    where: { fromStatusKey: current },
    select: { toStatusKey: true },
  });
  return transitions.map((t) => t.toStatusKey);
}

export async function isTerminalStatus(status: string): Promise<boolean> {
  const config = await prisma.statusConfig.findUnique({
    where: { key: status },
    select: { isTerminal: true },
  });
  return config?.isTerminal ?? false;
}

export async function getTerminalStatusKeys(): Promise<string[]> {
  const configs = await prisma.statusConfig.findMany({
    where: { isTerminal: true, isActive: true },
    select: { key: true },
  });
  return configs.map((c) => c.key);
}

export async function getDefaultStatus(): Promise<string> {
  const config = await prisma.statusConfig.findFirst({
    where: { isDefault: true, isActive: true },
    select: { key: true },
  });
  return config?.key ?? 'DRAFT';
}

export async function getDefaultProgress(statusKey: string): Promise<number> {
  const config = await prisma.statusConfig.findUnique({
    where: { key: statusKey },
    select: { defaultProgress: true },
  });
  return config?.defaultProgress ?? -1;
}

export async function getAllStatusConfigs() {
  return prisma.statusConfig.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });
}

export async function getAllTransitions() {
  return prisma.statusTransition.findMany();
}
