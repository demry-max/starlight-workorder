import bcrypt from "bcryptjs";
import { workorderRepository } from "@/repositories/workorder.repository";
import { isValidTransition, getDefaultProgress } from "@/lib/status-machine";
import { generateWorkOrderNumber } from "@/lib/utils";
import { notificationService } from "./notification.service";

export const workorderService = {
  async getClientView(workOrderId: string) {
    const order = await workorderRepository.findById(workOrderId);
    if (!order) return null;

    return {
      id: order.id,
      workorderNumber: order.workorderNumber,
      clientName: order.clientName,
      clientCompany: order.clientCompany,
      status: order.status,
      progressPercentage: order.progressPercentage,
      priority: order.priority,
      assignedStaffName: order.assignedStaff?.name || null,
      description: order.description,
      dueDate: order.dueDate?.toISOString() || null,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      statusHistory: order.statusHistory.map((h) => ({
        id: h.id,
        oldStatus: h.oldStatus,
        newStatus: h.newStatus,
        note: h.note,
        createdAt: h.createdAt.toISOString(),
      })),
      // Filter out internal comments for client view
      comments: order.comments
        .filter((c) => !c.isInternal)
        .map((c) => ({
          id: c.id,
          authorType: c.authorType,
          authorName: c.authorName,
          content: c.content,
          createdAt: c.createdAt.toISOString(),
        })),
    };
  },

  async getAdminView(workOrderId: string) {
    const order = await workorderRepository.findById(workOrderId);
    if (!order) return null;

    return {
      ...order,
      dueDate: order.dueDate?.toISOString() || null,
      lockedUntil: order.lockedUntil?.toISOString() || null,
      lastSyncedAt: order.lastSyncedAt?.toISOString() || null,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      assignedStaffName: order.assignedStaff?.name || null,
      statusHistory: order.statusHistory.map((h) => ({
        ...h,
        createdAt: h.createdAt.toISOString(),
      })),
      comments: order.comments.map((c) => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
      })),
    };
  },

  async create(
    data: {
      clientName: string;
      clientCompany?: string;
      clientEmail?: string;
      clientPhone?: string;
      description?: string;
      priority?: string;
      dueDate?: string;
      assignedStaffId?: string;
      salesRepId?: string;
      password: string;
    },
    staffId: string,
  ) {
    const workorderNumber = generateWorkOrderNumber();
    const passwordHash = await bcrypt.hash(data.password, 12);

    const order = await workorderRepository.create({
      workorderNumber,
      passwordHash,
      clientName: data.clientName,
      clientCompany: data.clientCompany || null,
      clientEmail: data.clientEmail || null,
      clientPhone: data.clientPhone || null,
      description: data.description || null,
      priority: (data.priority as never) || "MEDIUM",
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      assignedStaff: data.assignedStaffId
        ? { connect: { id: data.assignedStaffId } }
        : undefined,
      salesRep: data.salesRepId
        ? { connect: { id: data.salesRepId } }
        : undefined,
      status: "DRAFT",
    });

    await workorderRepository.addStatusHistory({
      workOrderId: order.id,
      oldStatus: null,
      newStatus: "DRAFT",
      changedBy: staffId,
      note: "Work order created",
    });

    // Send email notification with credentials
    if (data.clientEmail) {
      notificationService.onWorkOrderCreated({
        workorderNumber,
        clientName: data.clientName,
        clientEmail: data.clientEmail,
        password: data.password,
      });
    }

    return { ...order, generatedPassword: data.password, workorderNumber };
  },

  async updateStatus(
    workOrderId: string,
    newStatus: string,
    staffId: string,
    note?: string,
  ) {
    const order = await workorderRepository.findById(workOrderId);
    if (!order) throw new Error("Work order not found");

    const valid = await isValidTransition(order.status, newStatus);
    if (!valid) {
      throw new Error(
        `Invalid transition from ${order.status} to ${newStatus}`,
      );
    }

    const updateData: Record<string, unknown> = { status: newStatus };

    // Auto-update progress based on status
    const defaultProgress = await getDefaultProgress(newStatus);
    if (defaultProgress >= 0) {
      updateData.progressPercentage = defaultProgress;
    }

    const updated = await workorderRepository.update(workOrderId, updateData);

    await workorderRepository.addStatusHistory({
      workOrderId,
      oldStatus: order.status,
      newStatus,
      changedBy: staffId,
      note: note || undefined,
    });

    // Trigger notification hook
    notificationService.onStatusUpdate({
      workOrderId,
      workorderNumber: order.workorderNumber,
      oldStatus: order.status,
      newStatus,
      clientEmail: order.clientEmail,
    });

    return updated;
  },

  async update(
    workOrderId: string,
    data: {
      progressPercentage?: number;
      priority?: string;
      dueDate?: string | null;
      assignedStaffId?: string | null;
      salesRepId?: string | null;
      description?: string;
      clientName?: string;
      clientCompany?: string | null;
      clientEmail?: string | null;
      clientPhone?: string | null;
    },
  ) {
    const updateData: Record<string, unknown> = {};

    if (data.progressPercentage !== undefined)
      updateData.progressPercentage = data.progressPercentage;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.clientName !== undefined) updateData.clientName = data.clientName;
    if (data.clientCompany !== undefined)
      updateData.clientCompany = data.clientCompany;
    if (data.clientEmail !== undefined)
      updateData.clientEmail = data.clientEmail || null;
    if (data.clientPhone !== undefined)
      updateData.clientPhone = data.clientPhone;

    if (data.dueDate !== undefined) {
      updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    }

    if (data.assignedStaffId !== undefined) {
      if (data.assignedStaffId) {
        updateData.assignedStaff = { connect: { id: data.assignedStaffId } };
      } else {
        updateData.assignedStaff = { disconnect: true };
      }
    }

    if (data.salesRepId !== undefined) {
      if (data.salesRepId) {
        updateData.salesRep = { connect: { id: data.salesRepId } };
      } else {
        updateData.salesRep = { disconnect: true };
      }
    }

    return workorderRepository.update(workOrderId, updateData);
  },

  async list(filter: {
    search?: string;
    status?: string;
    salesRepId?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    page: number;
    pageSize: number;
  }) {
    return workorderRepository.findMany(filter);
  },
};
