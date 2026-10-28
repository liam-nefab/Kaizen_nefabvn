import {
  IKaizenApiClient,
  SubmitResponse,
  KaizenListResponse,
  LoginResponse,
  PingResponse,
} from './types';
import {
  KaizenItem,
  KaizenSubmitInput,
  KaizenReviewInput,
  KaizenTrackResult,
  KaizenFilterParams,
  KaizenStats,
  UserPrincipal,
} from '../../types/kaizen';

const AUTH_STORAGE_KEY = 'nefab_kaizen_auth_v1';

export class HttpApiClient implements IKaizenApiClient {
  private getAuthToken(): string | null {
    try {
      const raw = sessionStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (data.expiresAt && Date.now() > data.expiresAt) {
        sessionStorage.removeItem(AUTH_STORAGE_KEY);
        return null;
      }
      return data.token || null;
    } catch {
      return null;
    }
  }

  private getAppsScriptUrl(): string {
    const url = import.meta.env.VITE_APPS_SCRIPT_URL?.trim();
    if (!url) {
      throw new Error(
        'Chưa cấu hình URL Google Apps Script (biến VITE_APPS_SCRIPT_URL trong file .env).'
      );
    }
    if (url.includes('/dev')) {
      console.warn(
        '[CẢNH BÁO] URL Apps Script đang dùng chế độ /dev. Trình duyệt ngoài sẽ gặp lỗi đăng nhập Google. Hãy dùng URL triển khai chính thức dạng /exec!'
      );
    }
    if (url.includes('/u/1/') || url.includes('/u/2/')) {
      console.warn(
        '[CẢNH BÁO] URL Apps Script chứa tiền tố tài khoản nhiều người dùng (/u/1/). Hãy đổi thành URL chuẩn không chứa /u/x/.'
      );
    }
    return url;
  }

  private async postAppsScript<T>(
    action: string,
    payload: any = {},
    requireAuth = false
  ): Promise<T> {
    const url = this.getAppsScriptUrl();
    const token = this.getAuthToken();

    if (requireAuth && !token) {
      throw new Error('Yêu cầu đăng nhập để thực hiện thao tác này');
    }

    const requestBody = {
      action,
      payload,
      token: token || undefined,
    };

    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(requestBody),
        redirect: 'follow',
      });
    } catch (networkErr: any) {
      throw new Error(
        `Không thể kết nối đến máy chủ Google Apps Script: ${networkErr?.message || 'Lỗi mạng hoặc CORS'}`
      );
    }

    const text = await res.text();

    // Phát hiện phản hồi HTML (thường do quyền truy cập chưa mở "Anyone" hoặc URL /dev)
    const trimmed = text.trim();
    if (
      trimmed.startsWith('<!DOCTYPE') ||
      trimmed.startsWith('<html') ||
      trimmed.includes('accounts.google.com')
    ) {
      console.error('[DIAGNOSTICS] Máy chủ trả về trang HTML thay vì JSON:', trimmed.slice(0, 300));
      throw new Error(
        'Máy chủ Google trả về trang đăng nhập HTML thay vì dữ liệu JSON. Nguyên nhân: Web App chưa được phân quyền "Who has access: Anyone" (Bất kỳ ai) hoặc đang dùng link /dev. Vui lòng kiểm tra lại cấu hình Deploy trong Apps Script.'
      );
    }

    let result: any;
    try {
      result = JSON.parse(text);
    } catch {
      console.error('[PARSE ERROR] Dữ liệu trả về không phải JSON:', text.slice(0, 300));
      throw new Error(`Phản hồi không hợp lệ từ máy chủ: ${text.slice(0, 100)}`);
    }

    if (!result || typeof result !== 'object') {
      throw new Error('Dữ liệu trả về không hợp lệ');
    }

    if (!result.ok) {
      const errMsg = result.error?.message || result.message || 'Thao tác không thành công';
      throw new Error(errMsg);
    }

    return result.data as T;
  }

  async submitKaizen(input: KaizenSubmitInput): Promise<SubmitResponse> {
    return this.postAppsScript<SubmitResponse>('submit', {
      submitDate: input.submitDate,
      topic: input.topic,
      employeeId: input.employeeId,
      department: input.department,
      ideaName: input.ideaName,
      category: input.category,
      currentState: input.currentState,
      rootCause: input.rootCause,
      benefit: input.benefit,
      savingAmount: input.savingAmount,
      beforeImage: input.beforeImage,
      afterImage: input.afterImage,
      honeypot: input.honeypot,
      idempotencyKey: input.idempotencyKey,
    });
  }

  async trackKaizen(code: string, employeeId: string): Promise<KaizenTrackResult | null> {
    return this.postAppsScript<KaizenTrackResult | null>('track', {
      code: code.trim(),
      employeeId: employeeId.trim(),
    });
  }

  async getKaizens(params: KaizenFilterParams): Promise<KaizenListResponse> {
    return this.postAppsScript<KaizenListResponse>('list', params, true);
  }

  async getKaizenById(id: string): Promise<KaizenItem | null> {
    return this.postAppsScript<KaizenItem | null>('get', { id }, true);
  }

  async reviewKaizen(
    id: string,
    review: KaizenReviewInput,
    reviewerEmail: string
  ): Promise<KaizenItem> {
    return this.postAppsScript<KaizenItem>(
      'review',
      {
        id,
        review,
        reviewerEmail,
      },
      true
    );
  }

  async deleteKaizen(id: string): Promise<boolean> {
    return this.postAppsScript<boolean>('delete', { id }, true);
  }

  async getStats(params?: KaizenFilterParams): Promise<KaizenStats> {
    return this.postAppsScript<KaizenStats>('stats', params || {}, true);
  }

  async exportCsv(params?: KaizenFilterParams): Promise<Blob> {
    const csvContent = await this.postAppsScript<string>('export', params || {}, true);
    // Đảm bảo UTF-8 BOM cho Excel tiếng Việt
    const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
    return new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
  }

  async login(passcode: string, name?: string): Promise<LoginResponse> {
    const res = await this.postAppsScript<LoginResponse>('login', {
      passcode: passcode.trim(),
      name: name?.trim(),
    });

    if (res && res.token) {
      sessionStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({
          token: res.token,
          role: res.role,
          name: res.name || name?.trim() || (res.role === 'admin' ? 'Quản trị viên' : 'Thẩm định viên'),
          expiresAt: res.expiresAt || Date.now() + 6 * 60 * 60 * 1000,
        })
      );
    }

    return res;
  }

  async ping(): Promise<PingResponse> {
    return this.postAppsScript<PingResponse>('ping', {});
  }

  async getCurrentUser(): Promise<UserPrincipal | null> {
    try {
      const raw = sessionStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (data.expiresAt && Date.now() > data.expiresAt) {
        sessionStorage.removeItem(AUTH_STORAGE_KEY);
        return null;
      }
      return {
        identityProvider: 'passcode',
        userId: data.token,
        userDetails: data.name || (data.role === 'admin' ? 'Quản trị viên' : 'Thẩm định viên'),
        userRoles: [data.role],
      };
    } catch {
      return null;
    }
  }
}
