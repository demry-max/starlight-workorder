import { prisma } from "@/lib/prisma";

interface AuditLogInput {
  action: string;
  actor?: string | null;
  actorEmail?: string | null;
  targetType?: string | null;
  targetId?: string | null;
  detail?: Record<string, unknown> | string | null;
  ip?: string | null;
  success?: boolean;
}

export async function auditLog(input: AuditLogInput): Promise<void> {
  const detail =
    input.detail && typeof input.detail === "object"
      ? JSON.stringify(input.detail)
      : (input.detail ?? null);

  const logEntry = {
    action: input.action,
    actor: input.actor ?? null,
    actorEmail: input.actorEmail ?? null,
    targetType: input.targetType ?? null,
    targetId: input.targetId ?? null,
    detail,
    ipAddress: input.ip ?? null,
    success: input.success ?? true,
  };

  // Structured console output
  const level = logEntry.success ? "info" : "error";
  const ts = new Date().toISOString();
  console[level === "info" ? "log" : "error"](
    JSON.stringify({ ts, level, ...logEntry }),
  );

  // Write to DB (fire-and-forget)
  try {
    await prisma.auditLog.create({ data: logEntry });
  } catch (err) {
    // Logging should never crash the request
    console.error("Failed to write audit log to DB:", err);
  }
}

export function getIp(request: Request): string | null {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    null
  );
}
