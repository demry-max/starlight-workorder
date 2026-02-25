// Notification Service - Abstraction layer for future email/webhook integrations
// This service currently logs events. Replace with actual implementations when ready.

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
}

export const notificationService = {
  onStatusUpdate(event: StatusUpdateEvent): void {
    // Future: Send email notification to client
    // Future: Trigger webhook
    console.log('[Notification] Status update:', {
      workorderNumber: event.workorderNumber,
      transition: `${event.oldStatus} → ${event.newStatus}`,
      clientEmail: event.clientEmail,
    });

    // Webhook hook point
    notificationService._triggerWebhook('status_update', event);
  },

  onNewComment(event: CommentEvent): void {
    // Future: Send email notification
    // Future: Trigger webhook
    console.log('[Notification] New comment:', {
      workorderNumber: event.workorderNumber,
      authorType: event.authorType,
    });

    notificationService._triggerWebhook('new_comment', event);
  },

  // Internal webhook trigger (implement when webhook URL is configured)
  _triggerWebhook(eventType: string, payload: unknown): void {
    const webhookUrl = process.env.WEBHOOK_URL;
    if (!webhookUrl) return;

    // Fire and forget - do not await
    fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: eventType, data: payload, timestamp: new Date().toISOString() }),
    }).catch((err) => {
      console.error('[Notification] Webhook failed:', err.message);
    });
  },

  // Email service hook (implement when email service is configured)
  async sendEmail(_to: string, _subject: string, _body: string): Promise<void> {
    // Future implementation: SendGrid, AWS SES, etc.
    console.log('[Notification] Email sending not configured');
  },
};
