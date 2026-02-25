import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { workorderService } from "@/services/workorder.service";
import { createWorkOrderSchema, paginationSchema } from "@/lib/validators";
import { staffRepository } from "@/repositories/staff.repository";
import { workorderRepository } from "@/repositories/workorder.repository";
import { stringify } from "csv-stringify/sync";
import { auditLog, getIp } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "unauthorized" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    const parsed = paginationSchema.safeParse(params);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "validation" },
        { status: 400 },
      );
    }

    // Check if export requested
    if (searchParams.get("export") === "csv") {
      const orders = await workorderRepository.findAllForExport({
        search: parsed.data.search,
        status: parsed.data.status,
        salesRepId: parsed.data.salesRepId,
      });

      const csvData = orders.map((o) => ({
        "Order Number": o.workorderNumber,
        "Client Name": o.clientName,
        Company: o.clientCompany || "",
        Status: o.status,
        Priority: o.priority,
        Progress: `${o.progressPercentage}%`,
        "Assigned To": o.assignedStaff?.name || "Unassigned",
        "Sales Rep": o.salesRep?.name || "",
        "Due Date": o.dueDate?.toISOString().split("T")[0] || "",
        Created: o.createdAt.toISOString().split("T")[0],
        Updated: o.updatedAt.toISOString().split("T")[0],
      }));

      const csv = stringify(csvData, { header: true });

      await auditLog({
        action: "workorder.export",
        actor: session.staffId,
        actorEmail: session.email,
        targetType: "workorder",
        detail: {
          format: "csv",
          count: orders.length,
          filters: {
            search: parsed.data.search,
            status: parsed.data.status,
            salesRepId: parsed.data.salesRepId,
          },
        },
        ip: getIp(request),
      });

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="workorders-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    const result = await workorderService.list(parsed.data);

    return NextResponse.json({
      success: true,
      data: result.items,
      pagination: {
        page: parsed.data.page,
        pageSize: parsed.data.pageSize,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    console.error("List workorders error:", error);
    return NextResponse.json(
      { success: false, error: "serverError" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const parsed = createWorkOrderSchema.safeParse(body);

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

    const result = await workorderService.create(parsed.data, session.staffId);

    await auditLog({
      action: "workorder.create",
      actor: session.staffId,
      actorEmail: session.email,
      targetType: "workorder",
      targetId: result.id,
      detail: {
        workorderNumber: result.workorderNumber,
        clientName: parsed.data.clientName,
      },
      ip: getIp(request),
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    console.error("Create workorder error:", error);
    return NextResponse.json(
      { success: false, error: "serverError" },
      { status: 500 },
    );
  }
}

// GET staff list for assignment dropdown
export async function OPTIONS() {
  try {
    const staff = await staffRepository.findAll();
    return NextResponse.json({ success: true, data: staff });
  } catch (error) {
    console.error("Get staff error:", error);
    return NextResponse.json(
      { success: false, error: "serverError" },
      { status: 500 },
    );
  }
}
