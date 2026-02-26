import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getTerminalStatusKeys } from "@/lib/status-machine";

export interface WorkOrderFilter {
  search?: string;
  status?: string;
  salesRepId?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page: number;
  pageSize: number;
}

const workorderInclude = {
  assignedStaff: { select: { id: true, name: true, email: true } },
  salesRep: { select: { id: true, name: true } },
  statusHistory: { orderBy: { createdAt: "asc" as const } },
  comments: { orderBy: { createdAt: "asc" as const } },
  rating: true,
};

export const workorderRepository = {
  async findByWorkorderNumber(workorderNumber: string) {
    return prisma.workOrder.findUnique({
      where: { workorderNumber },
      include: workorderInclude,
    });
  },

  async findById(id: string) {
    return prisma.workOrder.findUnique({
      where: { id },
      include: workorderInclude,
    });
  },

  async findMany(filter: WorkOrderFilter) {
    const where: Prisma.WorkOrderWhereInput = {};

    if (filter.search) {
      where.OR = [
        { workorderNumber: { contains: filter.search, mode: "insensitive" } },
        { clientName: { contains: filter.search, mode: "insensitive" } },
        { clientCompany: { contains: filter.search, mode: "insensitive" } },
      ];
    }

    if (filter.status) {
      where.status = filter.status;
    }

    if (filter.salesRepId) {
      where.salesRepId = filter.salesRepId;
    }

    const orderByField = filter.sortBy || "created_at";
    const fieldMap: Record<string, string> = {
      created_at: "createdAt",
      updated_at: "updatedAt",
      due_date: "dueDate",
      status: "status",
      priority: "priority",
    };
    const orderBy = {
      [fieldMap[orderByField] || "createdAt"]: filter.sortOrder || "desc",
    };

    const [items, total] = await Promise.all([
      prisma.workOrder.findMany({
        where,
        include: {
          assignedStaff: { select: { id: true, name: true, email: true } },
          salesRep: { select: { id: true, name: true } },
        },
        orderBy,
        skip: (filter.page - 1) * filter.pageSize,
        take: filter.pageSize,
      }),
      prisma.workOrder.count({ where }),
    ]);

    return { items, total, totalPages: Math.ceil(total / filter.pageSize) };
  },

  async create(data: Prisma.WorkOrderCreateInput) {
    return prisma.workOrder.create({
      data,
      include: workorderInclude,
    });
  },

  async update(id: string, data: Prisma.WorkOrderUpdateInput) {
    return prisma.workOrder.update({
      where: { id },
      data,
      include: workorderInclude,
    });
  },

  async delete(id: string) {
    return prisma.workOrder.delete({ where: { id } });
  },

  async addStatusHistory(data: {
    workOrderId: string;
    oldStatus: string | null;
    newStatus: string;
    changedBy: string | null;
    note?: string;
  }) {
    return prisma.workOrderStatusHistory.create({ data });
  },

  async incrementFailedAttempts(id: string) {
    const order = await prisma.workOrder.update({
      where: { id },
      data: { failedAttempts: { increment: 1 } },
    });

    const maxAttempts = parseInt(
      process.env.RATE_LIMIT_MAX_ATTEMPTS || "5",
      10,
    );
    const lockoutDuration = parseInt(
      process.env.LOCKOUT_DURATION_MS || "900000",
      10,
    );

    if (order.failedAttempts >= maxAttempts) {
      await prisma.workOrder.update({
        where: { id },
        data: {
          isLocked: true,
          lockedUntil: new Date(Date.now() + lockoutDuration),
        },
      });
    }

    return order;
  },

  async resetFailedAttempts(id: string) {
    return prisma.workOrder.update({
      where: { id },
      data: { failedAttempts: 0, isLocked: false, lockedUntil: null },
    });
  },

  async countByStatus() {
    const results = await prisma.workOrder.groupBy({
      by: ["status"],
      _count: true,
    });
    return results.map((r) => ({ status: r.status, count: r._count }));
  },

  async countOpen() {
    const terminalKeys = await getTerminalStatusKeys();
    return prisma.workOrder.count({
      where: { status: { notIn: terminalKeys } },
    });
  },

  async countOverdue() {
    const terminalKeys = await getTerminalStatusKeys();
    return prisma.workOrder.count({
      where: {
        dueDate: { lt: new Date() },
        status: { notIn: terminalKeys },
      },
    });
  },

  async countWaitingForClient() {
    return prisma.workOrder.count({
      where: { status: "WAITING_FOR_CLIENT" },
    });
  },

  async countCompletedSince(since: Date) {
    return prisma.workOrder.count({
      where: { status: "COMPLETED", updatedAt: { gte: since } },
    });
  },

  async staffWorkload() {
    const terminalKeys = await getTerminalStatusKeys();
    const results = await prisma.workOrder.groupBy({
      by: ["assignedStaffId"],
      where: {
        status: { notIn: terminalKeys },
        assignedStaffId: { not: null },
      },
      _count: true,
    });

    const staffIds = results
      .map((r) => r.assignedStaffId)
      .filter(Boolean) as string[];
    const staff = await prisma.staffUser.findMany({
      where: { id: { in: staffIds } },
      select: { id: true, name: true },
    });

    const staffMap = new Map(staff.map((s) => [s.id, s.name]));
    return results.map((r) => ({
      staffId: r.assignedStaffId || "",
      staffName: staffMap.get(r.assignedStaffId || "") || "Unassigned",
      count: r._count,
    }));
  },

  async findAllForExport(filter: {
    search?: string;
    status?: string;
    salesRepId?: string;
  }) {
    const where: Prisma.WorkOrderWhereInput = {};
    if (filter.search) {
      where.OR = [
        { workorderNumber: { contains: filter.search, mode: "insensitive" } },
        { clientName: { contains: filter.search, mode: "insensitive" } },
      ];
    }
    if (filter.status) {
      where.status = filter.status;
    }
    if (filter.salesRepId) {
      where.salesRepId = filter.salesRepId;
    }

    return prisma.workOrder.findMany({
      where,
      include: {
        assignedStaff: { select: { name: true } },
        salesRep: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  },
};
