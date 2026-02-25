// Feishu (Lark) Base Integration Service
// This service prepares the integration layer for syncing with Feishu Base.
// Feishu Base will be the source of truth for: status, due_date, assigned_staff
// Local DB is source of truth for: comments, audit logs

interface FeishuConfig {
  appId: string;
  appSecret: string;
  baseAppToken: string;
  tableId: string;
}

interface FeishuRecord {
  record_id: string;
  fields: Record<string, unknown>;
}

interface FeishuAccessTokenResponse {
  code: number;
  msg: string;
  tenant_access_token: string;
  expire: number;
}

function getConfig(): FeishuConfig | null {
  const appId = process.env.FEISHU_APP_ID;
  const appSecret = process.env.FEISHU_APP_SECRET;
  const baseAppToken = process.env.FEISHU_BASE_APP_TOKEN;
  const tableId = process.env.FEISHU_TABLE_ID;

  if (!appId || !appSecret || !baseAppToken || !tableId) {
    return null;
  }

  return { appId, appSecret, baseAppToken, tableId };
}

let cachedToken: { token: string; expiresAt: number } | null = null;

export const feishuService = {
  isConfigured(): boolean {
    return getConfig() !== null;
  },

  async getAccessToken(): Promise<string | null> {
    const config = getConfig();
    if (!config) return null;

    // Return cached token if still valid (with 5-minute buffer)
    if (cachedToken && cachedToken.expiresAt > Date.now() + 5 * 60 * 1000) {
      return cachedToken.token;
    }

    try {
      const response = await fetch(
        'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            app_id: config.appId,
            app_secret: config.appSecret,
          }),
        }
      );

      const data: FeishuAccessTokenResponse = await response.json();
      if (data.code !== 0) {
        console.error('[Feishu] Failed to get access token:', data.msg);
        return null;
      }

      cachedToken = {
        token: data.tenant_access_token,
        expiresAt: Date.now() + data.expire * 1000,
      };

      return cachedToken.token;
    } catch (error) {
      console.error('[Feishu] Token request failed:', error);
      return null;
    }
  },

  async fetchRecords(): Promise<FeishuRecord[]> {
    const config = getConfig();
    const token = await this.getAccessToken();
    if (!config || !token) return [];

    try {
      const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${config.baseAppToken}/tables/${config.tableId}/records`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.code !== 0) {
        console.error('[Feishu] Failed to fetch records:', data.msg);
        return [];
      }

      return data.data?.items || [];
    } catch (error) {
      console.error('[Feishu] Fetch records failed:', error);
      return [];
    }
  },

  async updateRecord(recordId: string, fields: Record<string, unknown>): Promise<boolean> {
    const config = getConfig();
    const token = await this.getAccessToken();
    if (!config || !token) return false;

    try {
      const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${config.baseAppToken}/tables/${config.tableId}/records/${recordId}`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fields }),
      });

      const data = await response.json();
      if (data.code !== 0) {
        console.error('[Feishu] Failed to update record:', data.msg);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[Feishu] Update record failed:', error);
      return false;
    }
  },

  // Sync strategy: Pull from Feishu, merge into local DB
  // Feishu = source of truth for: status, due_date, assigned_staff
  // Local DB = source of truth for: comments, audit logs
  async syncFromFeishu(): Promise<{ synced: number; errors: number }> {
    const records = await this.fetchRecords();
    let synced = 0;
    let errors = 0;

    for (const record of records) {
      try {
        // Map Feishu fields to local schema
        // This mapping should be customized based on actual Feishu Base structure
        const _feishuRecordId = record.record_id;
        const _fields = record.fields;

        // TODO: Implement actual field mapping when Feishu Base is set up
        // Example:
        // const localOrder = await workorderRepository.findByFeishuRecordId(feishuRecordId);
        // if (localOrder) {
        //   await workorderRepository.update(localOrder.id, {
        //     status: mapFeishuStatus(fields.status),
        //     dueDate: fields.due_date,
        //     lastSyncedAt: new Date(),
        //   });
        // }

        synced++;
      } catch {
        errors++;
      }
    }

    return { synced, errors };
  },

  // Webhook endpoint handler for Feishu events
  async handleWebhook(_payload: unknown): Promise<void> {
    // Future: Handle incoming Feishu webhook events
    // e.g., record updates in Feishu Base
    console.log('[Feishu] Webhook received');
  },
};
