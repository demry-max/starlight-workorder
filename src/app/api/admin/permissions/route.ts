import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import {
  getPermissions,
  savePermissions,
  ALL_TAB_IDS,
  type RolePermissions,
} from "@/lib/permissions";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "unauthorized" }, { status: 401 });
  }

  const permissions = await getPermissions();
  return NextResponse.json({ success: true, data: permissions });
}

export async function PUT(request: Request) {
  const session = await getAdminSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "unauthorized" }, { status: 403 });
  }

  const body = (await request.json()) as RolePermissions;

  // Validate: each role key should map to an array of valid tab IDs
  const validTabIds = new Set<string>(ALL_TAB_IDS);
  for (const [role, tabs] of Object.entries(body)) {
    if (!["ADMIN", "MANAGER", "STAFF"].includes(role)) {
      return NextResponse.json({ success: false, error: "invalidRole" }, { status: 400 });
    }
    if (!Array.isArray(tabs) || !tabs.every((t) => validTabIds.has(t))) {
      return NextResponse.json({ success: false, error: "invalidTabs" }, { status: 400 });
    }
  }

  // Ensure ADMIN always has all permissions
  body.ADMIN = [...ALL_TAB_IDS];

  await savePermissions(body);
  return NextResponse.json({ success: true, data: body });
}
