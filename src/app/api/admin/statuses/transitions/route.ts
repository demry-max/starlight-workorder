import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { auditLog, getIp } from "@/lib/logger";

const transitionsSchema = z.array(
  z.object({
    fromStatusKey: z.string().min(1).max(100),
    toStatusKey: z.string().min(1).max(100),
  }),
);

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "unauthorized" },
        { status: 401 },
      );
    }

    const transitions = await prisma.statusTransition.findMany();

    return NextResponse.json({ success: true, data: transitions });
  } catch (error) {
    console.error("List transitions error:", error);
    return NextResponse.json(
      { success: false, error: "serverError" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const parsed = transitionsSchema.safeParse(body);
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

    // Validate that all referenced status keys exist
    const allKeysSet = new Set<string>();
    for (const t of parsed.data) {
      allKeysSet.add(t.fromStatusKey);
      allKeysSet.add(t.toStatusKey);
    }
    const allKeys = Array.from(allKeysSet);

    const existingStatuses = await prisma.statusConfig.findMany({
      where: { key: { in: allKeys } },
      select: { key: true },
    });
    const existingKeys = new Set(existingStatuses.map((s) => s.key));

    for (const key of allKeys) {
      if (!existingKeys.has(key)) {
        return NextResponse.json(
          { success: false, error: `Status key "${key}" does not exist.` },
          { status: 400 },
        );
      }
    }

    // Replace all transitions
    await prisma.statusTransition.deleteMany({});
    if (parsed.data.length > 0) {
      await prisma.statusTransition.createMany({ data: parsed.data });
    }

    const transitions = await prisma.statusTransition.findMany();

    await auditLog({
      action: "status.transitions_update",
      actor: session.staffId,
      actorEmail: session.email,
      targetType: "status",
      detail: { count: parsed.data.length },
      ip: getIp(request),
    });

    return NextResponse.json({ success: true, data: transitions });
  } catch (error) {
    console.error("Update transitions error:", error);
    return NextResponse.json(
      { success: false, error: "serverError" },
      { status: 500 },
    );
  }
}
