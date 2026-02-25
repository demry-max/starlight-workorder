import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getAdminSession } from "@/lib/auth";
import { workorderService } from "@/services/workorder.service";
import { commentService } from "@/services/comment.service";
import { updateWorkOrderSchema, commentSchema } from "@/lib/validators";
import { staffRepository } from "@/repositories/staff.repository";
import { workorderRepository } from "@/repositories/workorder.repository";
import { prisma } from "@/lib/prisma";
import { auditLog, getIp } from "@/lib/logger";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await params;
    const data = await workorderService.getAdminView(id);
    if (!data) {
      return NextResponse.json(
        { success: false, error: "notFound" },
        { status: 404 },
      );
    }

    const [staff, salesReps] = await Promise.all([
      staffRepository.findAll(),
      prisma.salesRep.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
      }),
    ]);

    await auditLog({
      action: "workorder.view",
      actor: session.staffId,
      actorEmail: session.email,
      targetType: "workorder",
      targetId: id,
      ip: getIp(request),
    });

    return NextResponse.json({ success: true, data, staff, salesReps });
  } catch (error) {
    console.error("Get admin workorder error:", error);
    return NextResponse.json(
      { success: false, error: "serverError" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = updateWorkOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "validation",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { status, statusNote, password, ...updateData } = parsed.data;
    const ip = getIp(request);

    // Handle password reset
    if (password) {
      const passwordHash = await bcrypt.hash(password, 12);
      await workorderRepository.update(id, { passwordHash });
      await auditLog({
        action: "workorder.password_reset",
        actor: session.staffId,
        actorEmail: session.email,
        targetType: "workorder",
        targetId: id,
        ip,
      });
    }

    // Handle status transition
    if (status) {
      try {
        const existing = await workorderService.getAdminView(id);
        await workorderService.updateStatus(
          id,
          status,
          session.staffId,
          statusNote,
        );
        await auditLog({
          action: "workorder.status_change",
          actor: session.staffId,
          actorEmail: session.email,
          targetType: "workorder",
          targetId: id,
          detail: { from: existing?.status, to: status, note: statusNote },
          ip,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        await auditLog({
          action: "workorder.status_change",
          actor: session.staffId,
          actorEmail: session.email,
          targetType: "workorder",
          targetId: id,
          detail: { to: status, error: message },
          ip,
          success: false,
        });
        return NextResponse.json(
          { success: false, error: "invalidTransition", message },
          { status: 400 },
        );
      }
    }

    // Handle other field updates
    const fieldsToUpdate = Object.fromEntries(
      Object.entries(updateData).filter(([, v]) => v !== undefined),
    );
    if (Object.keys(fieldsToUpdate).length > 0) {
      await workorderService.update(id, fieldsToUpdate);
      await auditLog({
        action: "workorder.update",
        actor: session.staffId,
        actorEmail: session.email,
        targetType: "workorder",
        targetId: id,
        detail: { fields: Object.keys(fieldsToUpdate) },
        ip,
      });
    }

    const updated = await workorderService.getAdminView(id);
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Update workorder error:", error);
    return NextResponse.json(
      { success: false, error: "serverError" },
      { status: 500 },
    );
  }
}

// Add comment (staff)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = commentSchema.safeParse({ ...body, workOrderId: id });

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "validation" },
        { status: 400 },
      );
    }

    const staff = await staffRepository.findById(session.staffId);
    const comment = await commentService.addStaffComment(
      id,
      session.staffId,
      staff?.name || "Staff",
      parsed.data.content,
      parsed.data.isInternal,
    );

    await auditLog({
      action: "comment.staff_add",
      actor: session.staffId,
      actorEmail: session.email,
      targetType: "workorder",
      targetId: id,
      detail: { commentId: comment.id, isInternal: parsed.data.isInternal },
      ip: getIp(request),
    });

    return NextResponse.json({ success: true, data: comment });
  } catch (error) {
    console.error("Staff comment error:", error);
    return NextResponse.json(
      { success: false, error: "serverError" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await params;
    await workorderRepository.delete(id);

    await auditLog({
      action: "workorder.delete",
      actor: session.staffId,
      actorEmail: session.email,
      targetType: "workorder",
      targetId: id,
      ip: getIp(request),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete workorder error:", error);
    return NextResponse.json(
      { success: false, error: "serverError" },
      { status: 500 },
    );
  }
}
