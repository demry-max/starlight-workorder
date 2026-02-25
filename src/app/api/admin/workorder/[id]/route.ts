import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { workorderService } from "@/services/workorder.service";
import { commentService } from "@/services/comment.service";
import { updateWorkOrderSchema, commentSchema } from "@/lib/validators";
import { staffRepository } from "@/repositories/staff.repository";
import { workorderRepository } from "@/repositories/workorder.repository";
import { WorkOrderStatus } from "@prisma/client";

export async function GET(
  _request: NextRequest,
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

    // Also get staff list for assignment
    const staff = await staffRepository.findAll();

    return NextResponse.json({ success: true, data, staff });
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

    const { status, statusNote, ...updateData } = parsed.data;

    // Handle status transition
    if (status) {
      try {
        await workorderService.updateStatus(
          id,
          status as WorkOrderStatus,
          session.staffId,
          statusNote,
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
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
  _request: NextRequest,
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
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete workorder error:", error);
    return NextResponse.json(
      { success: false, error: "serverError" },
      { status: 500 },
    );
  }
}
