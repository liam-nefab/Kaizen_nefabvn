import {
  IKaizenApiClient,
  SubmitResponse,
  KaizenListResponse,
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

export class HttpApiClient implements IKaizenApiClient {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });

    if (!res.ok) {
      let errMsg = `Lỗi máy chủ (${res.status})`;
      try {
        const data = await res.json();
        if (data?.error?.message) {
          errMsg = data.error.message;
        }
      } catch {
        // fallback
      }
      throw new Error(errMsg);
    }

    return (await res.json()) as T;
  }

  async submitKaizen(input: KaizenSubmitInput): Promise<SubmitResponse> {
    const payload = {
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
    };

    return this.request<SubmitResponse>('/api/kaizen', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async trackKaizen(code: string, employeeId: string): Promise<KaizenTrackResult | null> {
    const params = new URLSearchParams({
      code: code.trim(),
      employeeId: employeeId.trim(),
    });
    return this.request<KaizenTrackResult | null>(`/api/kaizen/track?${params.toString()}`);
  }

  async getKaizens(params: KaizenFilterParams): Promise<KaizenListResponse> {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.department && params.department !== 'ALL') query.set('department', params.department);
    if (params.category && params.category !== 'ALL') query.set('category', params.category);
    if (params.status && params.status !== 'ALL') query.set('status', params.status);
    if (params.completion && params.completion !== 'ALL') query.set('completion', params.completion);
    if (params.scope && params.scope !== 'ALL') query.set('scope', params.scope);
    if (params.quarter && params.quarter !== 'ALL') query.set('quarter', params.quarter);
    if (params.startDate) query.set('startDate', params.startDate);
    if (params.endDate) query.set('endDate', params.endDate);
    if (params.quarterlyAwardOnly) query.set('quarterlyAwardOnly', 'true');
    if (params.page) query.set('page', String(params.page));
    if (params.pageSize) query.set('pageSize', String(params.pageSize));
    if (params.sortBy) query.set('sortBy', params.sortBy);
    if (params.sortOrder) query.set('sortOrder', params.sortOrder);

    return this.request<KaizenListResponse>(`/api/kaizen?${query.toString()}`);
  }

  async getKaizenById(id: string): Promise<KaizenItem | null> {
    return this.request<KaizenItem | null>(`/api/kaizen/${id}`);
  }

  async reviewKaizen(
    id: string,
    review: KaizenReviewInput,
    _reviewerEmail: string
  ): Promise<KaizenItem> {
    return this.request<KaizenItem>(`/api/kaizen/${id}/review`, {
      method: 'PATCH',
      body: JSON.stringify(review),
    });
  }

  async deleteKaizen(id: string): Promise<boolean> {
    const res = await fetch(`/api/kaizen/${id}`, {
      method: 'DELETE',
    });
    return res.ok;
  }

  async getStats(params?: KaizenFilterParams): Promise<KaizenStats> {
    const query = new URLSearchParams();
    if (params?.department && params.department !== 'ALL') query.set('department', params.department);
    if (params?.category && params.category !== 'ALL') query.set('category', params.category);
    if (params?.scope && params.scope !== 'ALL') query.set('scope', params.scope);
    if (params?.quarter && params.quarter !== 'ALL') query.set('quarter', params.quarter);
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);

    return this.request<KaizenStats>(`/api/stats?${query.toString()}`);
  }

  async exportCsv(params?: KaizenFilterParams): Promise<Blob> {
    const query = new URLSearchParams();
    if (params?.department && params.department !== 'ALL') query.set('department', params.department);
    if (params?.category && params.category !== 'ALL') query.set('category', params.category);
    if (params?.scope && params.scope !== 'ALL') query.set('scope', params.scope);
    if (params?.quarter && params.quarter !== 'ALL') query.set('quarter', params.quarter);

    const res = await fetch(`/api/export?${query.toString()}`);
    if (!res.ok) {
      throw new Error('Lỗi xuất tệp Excel/CSV từ máy chủ');
    }
    return res.blob();
  }

  async getCurrentUser(): Promise<UserPrincipal | null> {
    try {
      const res = await fetch('/.auth/me');
      if (!res.ok) return null;
      const data = await res.json();
      const principal = data?.clientPrincipal;
      if (!principal) return null;

      return {
        identityProvider: principal.identityProvider,
        userId: principal.userId,
        userDetails: principal.userDetails,
        userRoles: principal.userRoles || [],
      };
    } catch {
      return null;
    }
  }
}
