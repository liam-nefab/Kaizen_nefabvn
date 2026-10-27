import { ClientSecretCredential } from '@azure/identity';
import { Client } from '@microsoft/microsoft-graph-client';
import { getConfig } from '../config';

let cachedClient: Client | null = null;
let cachedSiteId: string | null = null;
let cachedListId: string | null = null;
let cachedDriveId: string | null = null;

/**
 * Khởi tạo client Microsoft Graph với quyền ứng dụng (App-only / Sites.Selected)
 */
export function getGraphClient(): Client {
  if (cachedClient) return cachedClient;

  const config = getConfig();
  if (!config.tenantId || !config.clientId || !config.clientSecret) {
    throw new Error('Thiếu cấu hình biến môi trường Entra ID (TENANT_ID, CLIENT_ID, CLIENT_SECRET)');
  }

  const credential = new ClientSecretCredential(
    config.tenantId,
    config.clientId,
    config.clientSecret
  );

  cachedClient = Client.initWithMiddleware({
    authProvider: {
      getAccessToken: async () => {
        const token = await credential.getToken('https://graph.microsoft.com/.default');
        return token.token;
      },
    },
  });

  return cachedClient;
}

/**
 * Thực hiện gọi Graph API với cơ chế Retry tự động khi gặp HTTP 429 (Throttling)
 */
export async function executeWithRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await fn();
    } catch (err: any) {
      attempt++;
      if (err?.statusCode === 429 && attempt < maxRetries) {
        const retryAfter = parseInt(err?.headers?.get?.('Retry-After') || '2', 10);
        await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
        continue;
      }
      throw err;
    }
  }
  throw new Error('Graph API vượt quá số lần thử lại tối đa (429 Throttled)');
}

/**
 * Tìm và cache Site ID, List ID và Drive ID
 */
export async function getSharePointIds(): Promise<{ siteId: string; listId: string; driveId: string }> {
  const config = getConfig();
  const client = getGraphClient();

  if (cachedSiteId && cachedListId && cachedDriveId) {
    return { siteId: cachedSiteId, listId: cachedListId, driveId: cachedDriveId };
  }

  const siteId = config.siteId;
  if (!siteId) {
    throw new Error('SP_SITE_ID chưa được cấu hình');
  }

  // Lấy List ID của KaizenIdeas
  const listsRes = await executeWithRetry(() =>
    client.api(`/sites/${siteId}/lists`).get()
  );
  const targetList = listsRes.value.find((l: any) => l.name === config.listName || l.displayName === config.listName);
  if (!targetList) {
    throw new Error(`Không tìm thấy SharePoint List có tên: ${config.listName}`);
  }

  // Lấy Drive ID của KaizenImages
  const drivesRes = await executeWithRetry(() =>
    client.api(`/sites/${siteId}/drives`).get()
  );
  const targetDrive = drivesRes.value.find((d: any) => d.name === config.driveName);
  if (!targetDrive) {
    throw new Error(`Không tìm thấy Document Library có tên: ${config.driveName}`);
  }

  cachedSiteId = siteId;
  cachedListId = targetList.id;
  cachedDriveId = targetDrive.id;

  return { siteId, listId: targetList.id, driveId: targetDrive.id };
}

/**
 * Tải ảnh lên thư viện KaizenImages theo cấu trúc: /KaizenImages/{Code}/{filename}
 */
export async function uploadImageToDrive(
  code: string,
  fileName: string,
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  const { driveId } = await getSharePointIds();
  const client = getGraphClient();

  const path = `/items/root:/${code}/${fileName}:/content`;
  const uploadRes = await executeWithRetry(() =>
    client
      .api(`/drives/${driveId}${path}`)
      .header('Content-Type', mimeType)
      .put(buffer)
  );

  return uploadRes.webUrl || uploadRes.id;
}
