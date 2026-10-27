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
  AppRole,
} from '../../types/kaizen';
import { INITIAL_MOCK_KAIZENS } from './mockData';

const STORAGE_KEY = 'nefab_kaizen_mock_items_v1';
const ROLE_KEY = 'nefab_kaizen_active_role_v1';

export class MockApiClient implements IKaizenApiClient {
  private getStoredItems(): KaizenItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch {
      // ignore
    }
    this.saveItems(INITIAL_MOCK_KAIZENS);
    return INITIAL_MOCK_KAIZENS;
  }

  private saveItems(items: KaizenItem[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore storage quota error
    }
  }

  public getActiveRole(): AppRole {
    try {
      const role = localStorage.getItem(ROLE_KEY);
      if (role === 'reviewer' || role === 'admin' || role === 'public') {
        return role;
      }
    } catch {
      // ignore
    }
    return 'public';
  }

  public setActiveRole(role: AppRole) {
    try {
      localStorage.setItem(ROLE_KEY, role);
    } catch {
      // ignore
    }
  }

  public resetToDefault() {
    this.saveItems(INITIAL_MOCK_KAIZENS);
  }

  async submitKaizen(input: KaizenSubmitInput): Promise<SubmitResponse> {
    // Giả lập network delay ngắn cho trải nghiệm mượt mà
    await new Promise((r) => setTimeout(r, 400));

    // Kiểm tra honeypot chống bot
    if (input.honeypot && input.honeypot.trim() !== '') {
      throw new Error('Yêu cầu không hợp lệ (Spam detected)');
    }

    const items = this.getStoredItems();

    // Kiểm tra idempotency key chống gửi trùng
    if (input.idempotencyKey) {
      const existing = items.find((i) => i.idempotencyKey === input.idempotencyKey);
      if (existing) {
        return {
          id: existing.id,
          code: existing.code,
          message: 'Ý tưởng đã được tiếp nhận trước đó.',
        };
      }
    }

    const year = new Date().getFullYear();
    const count = items.length + 1;
    const code = `KZ-${year}-${String(count).padStart(4, '0')}`;
    const id = `kz-${Date.now()}`;

    // Xác định ảnh
    let beforeUrl = '/src/assets/images/hero_nefab_plant_1793080719672.jpg';
    if (typeof input.beforeImage === 'string') {
      beforeUrl = input.beforeImage;
    }

    let afterUrl: string | undefined = undefined;
    if (input.afterImage && typeof input.afterImage === 'string') {
      afterUrl = input.afterImage;
    }

    // Tính quý từ submitDate (YYYY-MM-DD)
    const month = parseInt(input.submitDate.split('-')[1] || '1', 10);
    const q = Math.ceil(month / 3);
    const quarter = `${input.submitDate.split('-')[0]}-Q${q}`;

    const newItem: KaizenItem = {
      id,
      code,
      submitDate: input.submitDate,
      topic: input.topic.trim(),
      employeeId: input.employeeId.trim().toUpperCase(),
      department: input.department,
      ideaName: input.ideaName.trim(),
      category: input.category,
      currentState: input.currentState.trim(),
      rootCause: input.rootCause.trim(),
      benefit: input.benefit.trim(),
      beforeImageUrl: beforeUrl,
      afterImageUrl: afterUrl,
      savingAmount: input.savingAmount ? Number(input.savingAmount) : undefined,
      idempotencyKey: input.idempotencyKey,
      status: 'Mới',
      quarter,
      createdAt: new Date().toISOString(),
    };

    items.unshift(newItem);
    this.saveItems(items);

    return {
      id,
      code,
      message: 'Gửi ý tưởng Kaizen thành công!',
    };
  }

  async trackKaizen(code: string, employeeId: string): Promise<KaizenTrackResult | null> {
    await new Promise((r) => setTimeout(r, 250));
    const cleanCode = code.trim().toUpperCase();
    const cleanEmp = employeeId.trim().toUpperCase();

    const items = this.getStoredItems();
    const match = items.find(
      (item) =>
        item.code.toUpperCase() === cleanCode &&
        item.employeeId.toUpperCase() === cleanEmp
    );

    if (!match) return null;

    return {
      code: match.code,
      employeeId: match.employeeId,
      submitDate: match.submitDate,
      topic: match.topic,
      ideaName: match.ideaName,
      department: match.department,
      category: match.category,
      status: match.status,
      completion: match.completion,
      implementDate: match.implementDate,
      quarterlyAward: match.quarterlyAward,
    };
  }

  async getKaizens(params: KaizenFilterParams): Promise<KaizenListResponse> {
    await new Promise((r) => setTimeout(r, 200));
    let items = this.getStoredItems();

    if (params.search && params.search.trim() !== '') {
      const q = params.search.toLowerCase().trim();
      items = items.filter(
        (i) =>
          i.code.toLowerCase().includes(q) ||
          i.topic.toLowerCase().includes(q) ||
          i.ideaName.toLowerCase().includes(q) ||
          i.employeeId.toLowerCase().includes(q) ||
          (i.owner && i.owner.toLowerCase().includes(q))
      );
    }

    if (params.department && params.department !== 'ALL') {
      items = items.filter((i) => i.department === params.department);
    }

    if (params.category && params.category !== 'ALL') {
      items = items.filter((i) => i.category === params.category);
    }

    if (params.status && params.status !== 'ALL') {
      items = items.filter((i) => i.status === params.status);
    }

    if (params.completion && params.completion !== 'ALL') {
      items = items.filter((i) => i.completion === params.completion);
    }

    if (params.scope && params.scope !== 'ALL') {
      items = items.filter((i) => i.scope === params.scope);
    }

    if (params.quarter && params.quarter !== 'ALL') {
      items = items.filter((i) => i.quarter === params.quarter);
    }

    if (params.startDate) {
      items = items.filter((i) => i.submitDate >= params.startDate!);
    }

    if (params.endDate) {
      items = items.filter((i) => i.submitDate <= params.endDate!);
    }

    if (params.quarterlyAwardOnly) {
      items = items.filter((i) => i.quarterlyAward === 'Có');
    }

    // Sắp xếp
    const sortBy = params.sortBy || 'submitDate';
    const sortOrder = params.sortOrder || 'desc';

    items.sort((a, b) => {
      let valA: string | number = '';
      let valB: string | number = '';

      if (sortBy === 'submitDate') {
        valA = a.submitDate;
        valB = b.submitDate;
      } else if (sortBy === 'savingAmount') {
        valA = a.savingAmount || 0;
        valB = b.savingAmount || 0;
      } else {
        valA = a.code;
        valB = b.code;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    const page = params.page || 1;
    const pageSize = params.pageSize || 10;
    const total = items.length;
    const totalPages = Math.ceil(total / pageSize) || 1;
    const startIndex = (page - 1) * pageSize;
    const pagedItems = items.slice(startIndex, startIndex + pageSize);

    return {
      items: pagedItems,
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  async getKaizenById(id: string): Promise<KaizenItem | null> {
    await new Promise((r) => setTimeout(r, 150));
    const items = this.getStoredItems();
    return items.find((i) => i.id === id || i.code === id) || null;
  }

  async reviewKaizen(
    id: string,
    review: KaizenReviewInput,
    reviewerEmail: string
  ): Promise<KaizenItem> {
    await new Promise((r) => setTimeout(r, 300));
    const items = this.getStoredItems();
    const index = items.findIndex((i) => i.id === id || i.code === id);
    if (index === -1) {
      throw new Error('Không tìm thấy ý tưởng Kaizen để thẩm định');
    }

    // Quy tắc nghiệp vụ bắt buộc:
    // 1. Hoàn thành thì bắt buộc có ngày thực hiện
    if (review.completion === 'Hoàn thành' && !review.implementDate) {
      throw new Error('Nếu kiểm tra hoàn thành là "Hoàn thành", bắt buộc phải nhập Ngày thực hiện');
    }

    // 2. Tham dự giải quý = Có thì bắt buộc có phụ trách thực thi và tháng chi trả
    if (review.quarterlyAward === 'Có') {
      if (!review.owner || review.owner.trim() === '') {
        throw new Error('Nếu tham dự giải quý, bắt buộc phải có Phụ trách thực thi');
      }
      if (!review.payMonth || review.payMonth.trim() === '') {
        throw new Error('Nếu tham dự giải quý, bắt buộc phải có Tháng chi trả');
      }
    }

    const updated: KaizenItem = {
      ...items[index],
      status: 'Đã thẩm định',
      scope: review.scope,
      owner: review.owner.trim(),
      completion: review.completion,
      implementDate: review.implementDate || undefined,
      payMonth: review.payMonth || undefined,
      reviewerNote: review.reviewerNote?.trim() || undefined,
      quarterlyAward: review.quarterlyAward,
      reviewedBy: reviewerEmail,
      reviewedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    items[index] = updated;
    this.saveItems(items);
    return updated;
  }

  async deleteKaizen(id: string): Promise<boolean> {
    await new Promise((r) => setTimeout(r, 200));
    const items = this.getStoredItems();
    const newItems = items.filter((i) => i.id !== id && i.code !== id);
    if (newItems.length === items.length) return false;
    this.saveItems(newItems);
    return true;
  }

  async getStats(params?: KaizenFilterParams): Promise<KaizenStats> {
    await new Promise((r) => setTimeout(r, 200));
    let items = this.getStoredItems();

    // Áp dụng bộ lọc cho dashboard nếu có
    if (params) {
      if (params.department && params.department !== 'ALL') {
        items = items.filter((i) => i.department === params.department);
      }
      if (params.category && params.category !== 'ALL') {
        items = items.filter((i) => i.category === params.category);
      }
      if (params.scope && params.scope !== 'ALL') {
        items = items.filter((i) => i.scope === params.scope);
      }
      if (params.quarter && params.quarter !== 'ALL') {
        items = items.filter((i) => i.quarter === params.quarter);
      }
      if (params.startDate) {
        items = items.filter((i) => i.submitDate >= params.startDate!);
      }
      if (params.endDate) {
        items = items.filter((i) => i.submitDate <= params.endDate!);
      }
    }

    const totalCount = items.length;
    const reviewedCount = items.filter((i) => i.status === 'Đã thẩm định').length;
    const newCount = items.filter((i) => i.status === 'Mới').length;
    const completedCount = items.filter((i) => i.completion === 'Hoàn thành').length;
    const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    const totalSavings = items.reduce((sum, i) => sum + (i.savingAmount || 0), 0);
    const quarterlyAwardCount = items.filter((i) => i.quarterlyAward === 'Có').length;

    // Theo tháng (tổng hợp 10 tháng gần nhất hoặc các tháng có data)
    const monthMap: Record<string, { count: number; savings: number }> = {};
    items.forEach((item) => {
      const ym = item.submitDate.substring(0, 7); // YYYY-MM
      if (!monthMap[ym]) monthMap[ym] = { count: 0, savings: 0 };
      monthMap[ym].count += 1;
      monthMap[ym].savings += item.savingAmount || 0;
    });

    const byMonth = Object.keys(monthMap)
      .sort()
      .map((m) => {
        const [year, month] = m.split('-');
        return {
          month: `T${parseInt(month, 10)}/${year.slice(2)}`,
          count: monthMap[m].count,
          savings: Math.round(monthMap[m].savings / 1000000), // Triệu VNĐ
        };
      });

    // Theo bộ phận
    const deptMap: Record<string, { count: number; completed: number }> = {};
    items.forEach((item) => {
      const d = item.department;
      if (!deptMap[d]) deptMap[d] = { count: 0, completed: 0 };
      deptMap[d].count += 1;
      if (item.completion === 'Hoàn thành') deptMap[d].completed += 1;
    });

    const byDepartment = Object.keys(deptMap)
      .map((d) => ({
        department: d,
        count: deptMap[d].count,
        completed: deptMap[d].completed,
      }))
      .sort((a, b) => b.count - a.count);

    // Theo lĩnh vực
    const catMap: Record<string, number> = {};
    items.forEach((item) => {
      const c = item.category;
      catMap[c] = (catMap[c] || 0) + 1;
    });
    const byCategory = Object.keys(catMap).map((c) => ({
      category: c,
      count: catMap[c],
    }));

    // Theo phạm vi
    const scopeMap: Record<string, number> = {};
    items.forEach((item) => {
      const s = item.scope || 'Chưa phân';
      scopeMap[s] = (scopeMap[s] || 0) + 1;
    });
    const byScope = Object.keys(scopeMap).map((s) => ({
      scope: s,
      count: scopeMap[s],
    }));

    // Top 10 người nộp nhiều nhất
    const empMap: Record<string, { count: number; totalSavings: number }> = {};
    items.forEach((item) => {
      const e = item.employeeId;
      if (!empMap[e]) empMap[e] = { count: 0, totalSavings: 0 };
      empMap[e].count += 1;
      empMap[e].totalSavings += item.savingAmount || 0;
    });

    const topContributors = Object.keys(empMap)
      .map((e) => ({
        employeeId: e,
        count: empMap[e].count,
        totalSavings: empMap[e].totalSavings,
      }))
      .sort((a, b) => b.count - a.count || b.totalSavings - a.totalSavings)
      .slice(0, 10);

    // Danh sách tham dự giải quý
    const quarterlyNominees = items.filter((i) => i.quarterlyAward === 'Có');

    return {
      totalCount,
      reviewedCount,
      newCount,
      completedCount,
      completionRate,
      totalSavings,
      quarterlyAwardCount,
      byMonth,
      byDepartment,
      byCategory,
      byScope,
      topContributors,
      quarterlyNominees,
    };
  }

  async exportCsv(params?: KaizenFilterParams): Promise<Blob> {
    const list = await this.getKaizens({
      ...(params || {}),
      page: 1,
      pageSize: 10000,
    });

    const headers = [
      'Mã Kaizen',
      'Ngày nộp',
      'Quý',
      'Mã nhân viên',
      'Bộ phận',
      'Chủ đề',
      'Tên ý tưởng',
      'Lĩnh vực',
      'Hiện trạng',
      'Nguyên nhân',
      'Lợi ích',
      'Tiết kiệm (VNĐ)',
      'Trạng thái',
      'Phạm vi',
      'Phụ trách thực thi',
      'Hoàn thành',
      'Ngày thực hiện',
      'Tháng chi trả',
      'Giải quý',
      'Người thẩm định',
      'Ngày thẩm định',
      'Ghi chú',
    ];

    const escapeCsv = (str?: string | number | null) => {
      if (str === undefined || str === null) return '""';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    const rows = list.items.map((item) => [
      escapeCsv(item.code),
      escapeCsv(item.submitDate),
      escapeCsv(item.quarter),
      escapeCsv(item.employeeId),
      escapeCsv(item.department),
      escapeCsv(item.topic),
      escapeCsv(item.ideaName),
      escapeCsv(item.category),
      escapeCsv(item.currentState),
      escapeCsv(item.rootCause),
      escapeCsv(item.benefit),
      escapeCsv(item.savingAmount || 0),
      escapeCsv(item.status),
      escapeCsv(item.scope || ''),
      escapeCsv(item.owner || ''),
      escapeCsv(item.completion || ''),
      escapeCsv(item.implementDate || ''),
      escapeCsv(item.payMonth || ''),
      escapeCsv(item.quarterlyAward || ''),
      escapeCsv(item.reviewedBy || ''),
      escapeCsv(item.reviewedAt || ''),
      escapeCsv(item.reviewerNote || ''),
    ]);

    // Thêm BOM UTF-8 (\uFEFF) để Microsoft Excel mở tiếng Việt chuẩn không bị lỗi font
    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  }

  async getCurrentUser(): Promise<UserPrincipal | null> {
    const role = this.getActiveRole();
    if (role === 'public') {
      return null;
    }

    if (role === 'admin') {
      return {
        identityProvider: 'aad',
        userId: 'admin-001',
        userDetails: 'admin.kaizen@nefab.com',
        userRoles: ['authenticated', 'reviewer', 'admin'],
      };
    }

    return {
      identityProvider: 'aad',
      userId: 'reviewer-001',
      userDetails: 'reviewer.plant@nefab.com',
      userRoles: ['authenticated', 'reviewer'],
    };
  }
}
