import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { auditLog, getIp } from "@/lib/logger";
import nodemailer from "nodemailer";

const SMTP_KEYS = [
  "smtp_host",
  "smtp_port",
  "smtp_user",
  "smtp_pass",
  "smtp_from",
] as const;

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "unauthorized" },
        { status: 401 },
      );
    }

    const settings = await prisma.systemSetting.findMany({
      where: { key: { in: [...SMTP_KEYS] } },
    });

    const data: Record<string, string> = {};
    for (const s of settings) {
      // Mask password in response
      data[s.key] = s.key === "smtp_pass" && s.value ? "••••••••" : s.value;
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Get settings error:", error);
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
    const ip = getIp(request);

    for (const key of SMTP_KEYS) {
      const value = body[key];
      if (value === undefined) continue;
      // Skip if password field is the masked placeholder
      if (key === "smtp_pass" && value === "••••••••") continue;

      await prisma.systemSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      });
    }

    await auditLog({
      action: "settings.smtp_update",
      actor: session.staffId,
      actorEmail: session.email,
      targetType: "settings",
      detail: { keys: Object.keys(body).filter((k) => SMTP_KEYS.includes(k as typeof SMTP_KEYS[number])) },
      ip,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update settings error:", error);
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
    const { testEmail } = body;

    if (!testEmail) {
      return NextResponse.json(
        { success: false, error: "validation" },
        { status: 400 },
      );
    }

    // Read current settings from DB
    const settings = await prisma.systemSetting.findMany({
      where: { key: { in: [...SMTP_KEYS] } },
    });
    const db: Record<string, string> = {};
    for (const s of settings) db[s.key] = s.value;

    const host = db.smtp_host || process.env.SMTP_HOST;
    const port = parseInt(db.smtp_port || process.env.SMTP_PORT || "587", 10);
    const user = db.smtp_user || process.env.SMTP_USER;
    const pass = db.smtp_pass || process.env.SMTP_PASS;
    const from =
      db.smtp_from ||
      process.env.SMTP_FROM ||
      `Starlight WorkOrder <${user || "noreply@starlight.com"}>`;

    if (!host || !user || !pass) {
      return NextResponse.json(
        { success: false, error: "SMTP not configured" },
        { status: 400 },
      );
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from,
      to: testEmail,
      subject: "Starlight WorkOrder - Test Email",
      html: `<div style="font-family: Arial, sans-serif; padding: 20px;"><h2>Test Email</h2><p>If you received this email, your SMTP settings are configured correctly.</p><p style="color: #6B7280; font-size: 12px;">如果您收到此邮件，说明SMTP设置配置正确。</p></div>`,
    });

    await auditLog({
      action: "settings.smtp_test",
      actor: session.staffId,
      actorEmail: session.email,
      targetType: "settings",
      detail: { testEmail },
      ip: getIp(request),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Test email error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
