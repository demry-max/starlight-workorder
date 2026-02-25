import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";

interface StatusUpdateEvent {
  workOrderId: string;
  workorderNumber: string;
  oldStatus: string;
  newStatus: string;
  clientEmail?: string | null;
}

interface CommentEvent {
  workOrderId: string;
  workorderNumber: string;
  authorType: string;
  content: string;
  clientEmail?: string | null;
}

interface WorkOrderCreatedEvent {
  workorderNumber: string;
  clientName: string;
  clientEmail: string;
  password: string;
}

async function getSmtpSettings(): Promise<Record<string, string>> {
  try {
    const settings = await prisma.systemSetting.findMany({
      where: { key: { startsWith: "smtp_" } },
    });
    const map: Record<string, string> = {};
    for (const s of settings) {
      map[s.key] = s.value;
    }
    return map;
  } catch {
    return {};
  }
}

async function getTransporter() {
  const db = await getSmtpSettings();
  const host = db.smtp_host || process.env.SMTP_HOST;
  const port = parseInt(db.smtp_port || process.env.SMTP_PORT || "587", 10);
  const user = db.smtp_user || process.env.SMTP_USER;
  const pass = db.smtp_pass || process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

async function getFrom(): Promise<string> {
  const db = await getSmtpSettings();
  return (
    db.smtp_from ||
    process.env.SMTP_FROM ||
    `Starlight WorkOrder <${db.smtp_user || process.env.SMTP_USER || "noreply@starlight.com"}>`
  );
}

function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

async function getStatusLabel(
  statusKey: string,
): Promise<{ en: string; zh: string }> {
  const config = await prisma.statusConfig.findUnique({
    where: { key: statusKey },
    select: { labelEn: true, labelZh: true },
  });
  return config
    ? { en: config.labelEn, zh: config.labelZh }
    : { en: statusKey, zh: statusKey };
}

export const notificationService = {
  async onWorkOrderCreated(event: WorkOrderCreatedEvent): Promise<void> {
    const transporter = await getTransporter();
    if (!transporter || !event.clientEmail) {
      console.log(
        "[Notification] SMTP not configured or no client email, skipping work order created email",
      );
      return;
    }

    const appUrl = getAppUrl();
    const subject = `Your Work Order ${event.workorderNumber} Has Been Created | 您的工单 ${event.workorderNumber} 已创建`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #111827; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: #F59E0B; margin: 0; font-size: 24px;">Starlight WorkOrder</h1>
          <p style="color: #9CA3AF; margin: 4px 0 0;">星耀工单管理系统</p>
        </div>
        <div style="border: 1px solid #E5E7EB; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
          <p>Dear <strong>${event.clientName}</strong>,</p>
          <p>Your work order has been created. Use the credentials below to check its status:</p>
          <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0 0 8px;"><strong>Order Number / 工单号:</strong></p>
            <p style="font-family: monospace; font-size: 18px; margin: 0 0 12px; color: #111827;">${event.workorderNumber}</p>
            <p style="margin: 0 0 8px;"><strong>Password / 密码:</strong></p>
            <p style="font-family: monospace; font-size: 18px; margin: 0; color: #111827;">${event.password}</p>
          </div>
          <a href="${appUrl}/client/login" style="display: inline-block; background: #F59E0B; color: #111827; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Your Work Order / 查看您的工单</a>
          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
          <p style="color: #6B7280; font-size: 12px;">尊敬的 <strong>${event.clientName}</strong>，您的工单已创建。请使用以上凭证查看工单状态。</p>
          <p style="color: #9CA3AF; font-size: 11px; margin-top: 16px;">© 2026 Starlight Business Consulting | 星耀财税</p>
        </div>
      </div>
    `;

    try {
      await transporter.sendMail({
        from: await getFrom(),
        to: event.clientEmail,
        subject,
        html,
      });
      console.log(
        `[Notification] Work order created email sent to ${event.clientEmail}`,
      );
    } catch (err) {
      console.error(
        "[Notification] Failed to send work order created email:",
        err,
      );
    }
  },

  async onStatusUpdate(event: StatusUpdateEvent): Promise<void> {
    console.log("[Notification] Status update:", {
      workorderNumber: event.workorderNumber,
      transition: `${event.oldStatus} → ${event.newStatus}`,
    });

    notificationService._triggerWebhook("status_update", event);

    const transporter = await getTransporter();
    if (!transporter || !event.clientEmail) return;

    const appUrl = getAppUrl();
    const newLabel = await getStatusLabel(event.newStatus);
    const subject = `Work Order ${event.workorderNumber} Status Updated: ${newLabel.en} | 工单状态已更新：${newLabel.zh}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #111827; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: #F59E0B; margin: 0; font-size: 24px;">Starlight WorkOrder</h1>
        </div>
        <div style="border: 1px solid #E5E7EB; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
          <p>Your work order <strong>${event.workorderNumber}</strong> status has been updated:</p>
          <div style="background: #F9FAFB; border-radius: 8px; padding: 16px; margin: 16px 0; text-align: center;">
            <p style="font-size: 20px; font-weight: bold; color: #111827; margin: 0;">${newLabel.en} / ${newLabel.zh}</p>
          </div>
          <a href="${appUrl}/client/login" style="display: inline-block; background: #F59E0B; color: #111827; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Details / 查看详情</a>
          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
          <p style="color: #6B7280; font-size: 12px;">您的工单 <strong>${event.workorderNumber}</strong> 状态已更新为：${newLabel.zh}</p>
          <p style="color: #9CA3AF; font-size: 11px; margin-top: 16px;">© 2026 Starlight Business Consulting</p>
        </div>
      </div>
    `;

    try {
      await transporter.sendMail({
        from: await getFrom(),
        to: event.clientEmail,
        subject,
        html,
      });
      console.log(
        `[Notification] Status update email sent to ${event.clientEmail}`,
      );
    } catch (err) {
      console.error("[Notification] Failed to send status update email:", err);
    }
  },

  async onNewComment(event: CommentEvent): Promise<void> {
    console.log("[Notification] New comment:", {
      workorderNumber: event.workorderNumber,
      authorType: event.authorType,
    });

    notificationService._triggerWebhook("new_comment", event);

    // Only notify client when staff replies (not internal notes, not client's own comments)
    if (event.authorType !== "STAFF") return;

    const transporter = await getTransporter();
    if (!transporter || !event.clientEmail) return;

    const appUrl = getAppUrl();
    const subject = `New Reply on Work Order ${event.workorderNumber} | 工单有新回复`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #111827; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: #F59E0B; margin: 0; font-size: 24px;">Starlight WorkOrder</h1>
        </div>
        <div style="border: 1px solid #E5E7EB; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
          <p>There is a new reply on your work order <strong>${event.workorderNumber}</strong>:</p>
          <div style="background: #F9FAFB; border-left: 4px solid #F59E0B; padding: 12px 16px; margin: 16px 0;">
            <p style="margin: 0; color: #374151;">${event.content.substring(0, 500)}${event.content.length > 500 ? "..." : ""}</p>
          </div>
          <a href="${appUrl}/client/login" style="display: inline-block; background: #F59E0B; color: #111827; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View & Reply / 查看并回复</a>
          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
          <p style="color: #6B7280; font-size: 12px;">您的工单 <strong>${event.workorderNumber}</strong> 有新回复，请登录查看。</p>
          <p style="color: #9CA3AF; font-size: 11px; margin-top: 16px;">© 2026 Starlight Business Consulting</p>
        </div>
      </div>
    `;

    try {
      await transporter.sendMail({
        from: await getFrom(),
        to: event.clientEmail,
        subject,
        html,
      });
      console.log(
        `[Notification] New comment email sent to ${event.clientEmail}`,
      );
    } catch (err) {
      console.error("[Notification] Failed to send comment email:", err);
    }
  },

  _triggerWebhook(eventType: string, payload: unknown): void {
    const webhookUrl = process.env.WEBHOOK_URL;
    if (!webhookUrl) return;

    fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: eventType,
        data: payload,
        timestamp: new Date().toISOString(),
      }),
    }).catch((err) => {
      console.error("[Notification] Webhook failed:", err.message);
    });
  },
};
