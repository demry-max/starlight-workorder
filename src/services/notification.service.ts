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

interface WorkOrderCompletedEvent {
  workOrderId: string;
  workorderNumber: string;
  clientName: string;
  clientEmail: string;
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

/**
 * Returns the base URL for client-facing links in emails.
 * Strips any trailing slash to avoid double-slash issues.
 */
function getClientLoginUrl(): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/+$/, "");
  return `${base}/client/login`;
}

function getRatingUrl(workOrderId: string): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/+$/, "");
  return `${base}/client/rate/${workOrderId}`;
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

function emailWrapper(content: string): string {
  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa;">
      <div style="background: #111827; padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: #F59E0B; margin: 0; font-size: 22px; letter-spacing: 1px;">Starlight WorkOrder</h1>
        <p style="color: #9CA3AF; margin: 6px 0 0; font-size: 13px;">星耀工单管理系统</p>
      </div>
      <div style="background: #ffffff; border: 1px solid #E5E7EB; border-top: none; padding: 28px; border-radius: 0 0 12px 12px;">
        ${content}
        <p style="color: #9CA3AF; font-size: 11px; margin-top: 24px; text-align: center; border-top: 1px solid #f0f0f0; padding-top: 16px;">
          &copy; 2026 Starlight Business Consulting | 星耀财税
        </p>
      </div>
    </div>
  `;
}

function emailButton(href: string, textEn: string, textZh: string): string {
  return `
    <div style="text-align: center; margin: 24px 0;">
      <a href="${href}" style="display: inline-block; background: #F59E0B; color: #111827; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">${textEn} / ${textZh}</a>
    </div>
  `;
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

    const loginUrl = getClientLoginUrl();
    const subject = `Your Work Order ${event.workorderNumber} Has Been Created | 您的工单 ${event.workorderNumber} 已创建`;
    const html = emailWrapper(`
      <p style="color: #374151; font-size: 15px;">Dear <strong>${event.clientName}</strong>,</p>
      <p style="color: #374151; font-size: 14px;">Your work order has been created. Use the credentials below to check its status:</p>
      <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <p style="margin: 0 0 8px; color: #6B7280; font-size: 13px;"><strong>Order Number / 工单号:</strong></p>
        <p style="font-family: 'Courier New', monospace; font-size: 20px; margin: 0 0 16px; color: #111827; letter-spacing: 1px;">${event.workorderNumber}</p>
        <p style="margin: 0 0 8px; color: #6B7280; font-size: 13px;"><strong>Password / 密码:</strong></p>
        <p style="font-family: 'Courier New', monospace; font-size: 20px; margin: 0; color: #111827;">${event.password}</p>
      </div>
      ${emailButton(loginUrl, "View Your Work Order", "查看您的工单")}
      <hr style="border: none; border-top: 1px solid #f0f0f0; margin: 20px 0;" />
      <p style="color: #6B7280; font-size: 12px;">尊敬的 <strong>${event.clientName}</strong>，您的工单已创建。请使用以上凭证查看工单状态。</p>
    `);

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

    const loginUrl = getClientLoginUrl();
    const newLabel = await getStatusLabel(event.newStatus);
    const subject = `Work Order ${event.workorderNumber} Status Updated: ${newLabel.en} | 工单状态已更新：${newLabel.zh}`;
    const html = emailWrapper(`
      <p style="color: #374151; font-size: 14px;">Your work order <strong>${event.workorderNumber}</strong> status has been updated:</p>
      <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
        <p style="font-size: 22px; font-weight: bold; color: #111827; margin: 0;">${newLabel.en}</p>
        <p style="font-size: 16px; color: #6B7280; margin: 4px 0 0;">${newLabel.zh}</p>
      </div>
      ${emailButton(loginUrl, "View Details", "查看详情")}
      <hr style="border: none; border-top: 1px solid #f0f0f0; margin: 20px 0;" />
      <p style="color: #6B7280; font-size: 12px;">您的工单 <strong>${event.workorderNumber}</strong> 状态已更新为：${newLabel.zh}</p>
    `);

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

    if (event.authorType !== "STAFF") return;

    const transporter = await getTransporter();
    if (!transporter || !event.clientEmail) return;

    const loginUrl = getClientLoginUrl();
    const subject = `New Reply on Work Order ${event.workorderNumber} | 工单有新回复`;
    const html = emailWrapper(`
      <p style="color: #374151; font-size: 14px;">There is a new reply on your work order <strong>${event.workorderNumber}</strong>:</p>
      <div style="background: #F9FAFB; border-left: 4px solid #F59E0B; padding: 16px 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
        <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.6;">${event.content.substring(0, 500)}${event.content.length > 500 ? "..." : ""}</p>
      </div>
      ${emailButton(loginUrl, "View & Reply", "查看并回复")}
      <hr style="border: none; border-top: 1px solid #f0f0f0; margin: 20px 0;" />
      <p style="color: #6B7280; font-size: 12px;">您的工单 <strong>${event.workorderNumber}</strong> 有新回复，请登录查看。</p>
    `);

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

  async onWorkOrderCompleted(event: WorkOrderCompletedEvent): Promise<void> {
    const transporter = await getTransporter();
    if (!transporter || !event.clientEmail) {
      console.log(
        "[Notification] SMTP not configured or no client email, skipping rating email",
      );
      return;
    }

    const existingRating = await prisma.rating.findUnique({
      where: { workOrderId: event.workOrderId },
    });
    if (existingRating) return;

    const ratingUrl = getRatingUrl(event.workOrderId);
    const subject = `Rate Our Service - Work Order ${event.workorderNumber} | 服务评价 - 工单 ${event.workorderNumber}`;
    const html = emailWrapper(`
      <p style="color: #374151; font-size: 15px;">Dear <strong>${event.clientName}</strong>,</p>
      <p style="color: #374151; font-size: 14px;">Your work order <strong>${event.workorderNumber}</strong> has been completed. We hope you are satisfied with our service!</p>
      <div style="background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 8px; padding: 24px; margin: 20px 0; text-align: center;">
        <p style="font-size: 28px; margin: 0 0 8px;">&#11088;&#11088;&#11088;&#11088;&#11088;</p>
        <p style="font-size: 16px; font-weight: bold; color: #92400E; margin: 0;">How was your experience?</p>
        <p style="font-size: 14px; color: #A16207; margin: 4px 0 0;">您的体验如何？</p>
      </div>
      <p style="color: #6B7280; font-size: 14px; text-align: center;">Please take a moment to rate our service. Your feedback helps us improve!</p>
      ${emailButton(ratingUrl, "Rate Our Service", "评价我们的服务")}
      <hr style="border: none; border-top: 1px solid #f0f0f0; margin: 20px 0;" />
      <p style="color: #6B7280; font-size: 12px;">尊敬的 <strong>${event.clientName}</strong>，您的工单已完成。请花一点时间评价我们的服务，您的反馈对我们非常重要！</p>
    `);

    try {
      await transporter.sendMail({
        from: await getFrom(),
        to: event.clientEmail,
        subject,
        html,
      });
      console.log(
        `[Notification] Rating email sent to ${event.clientEmail}`,
      );
    } catch (err) {
      console.error("[Notification] Failed to send rating email:", err);
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
