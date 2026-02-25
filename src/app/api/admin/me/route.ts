import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getPermissions } from "@/lib/permissions";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "unauthorized" }, { status: 401 });
  }

  const permissions = await getPermissions();
  const rolePerms = permissions[session.role] || [];

  return NextResponse.json({
    success: true,
    data: {
      staffId: session.staffId,
      email: session.email,
      role: session.role,
      permissions: rolePerms,
    },
  });
}
