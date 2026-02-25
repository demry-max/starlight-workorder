import { NextRequest, NextResponse } from "next/server";
import { clearCookieHeader, getAdminSession, getClientSession } from "@/lib/auth";
import { auditLog, getIp } from "@/lib/logger";

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "client";
  const ip = getIp(request);

  if (type === "admin") {
    const session = await getAdminSession();
    await auditLog({
      action: "auth.logout",
      actor: session?.staffId,
      actorEmail: session?.email,
      detail: { type: "admin" },
      ip,
    });
  } else {
    const session = await getClientSession();
    await auditLog({
      action: "auth.logout",
      actor: session ? `client:${session.workorderNumber}` : null,
      detail: { type: "client" },
      ip,
    });
  }

  const response = NextResponse.json({ success: true });

  if (type === "admin") {
    response.headers.append("Set-Cookie", clearCookieHeader("admin_token"));
    response.headers.append("Set-Cookie", clearCookieHeader("admin_refresh"));
  } else {
    response.headers.append("Set-Cookie", clearCookieHeader("client_token"));
    response.headers.append("Set-Cookie", clearCookieHeader("client_refresh"));
  }

  return response;
}
