import {
  KaizenItem,
  KaizenSubmitInput,
  KaizenReviewInput,
  KaizenTrackResult,
  KaizenFilterParams,
  KaizenStats,
  UserPrincipal,
} from '../../types/kaizen';

export interface SubmitResponse {
  id: string;
  code: string;
  message: string;
}

export interface KaizenListResponse {
  items: KaizenItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface IKaizenApiClient {
  /** Gửi ý tưởng Kaizen mới (Public) */
  submitKaizen(input: KaizenSubmitInput): Promise<SubmitResponse>;

  /** Tra cứu trạng thái Kaizen theo mã và mã nhân viên (Public) */
  trackKaizen(code: string, employeeId: string): Promise<KaizenTrackResult | null>;

  /** Lấy danh sách Kaizen có bộ lọc và phân trang (Reviewer/Admin) */
  getKaizens(params: KaizenFilterParams): Promise<KaizenListResponse>;

  /** Lấy chi tiết 1 Kaizen (Reviewer/Admin) */
  getKaizenById(id: string): Promise<KaizenItem | null>;

  /** Cập nhật thẩm định Kaizen (Reviewer/Admin) */
  reviewKaizen(id: string, review: KaizenReviewInput, reviewerEmail: string): Promise<KaizenItem>;

  /** Xóa Kaizen (Admin) */
  deleteKaizen(id: string): Promise<boolean>;

  /** Lấy dữ liệu thống kê tổng hợp (Reviewer/Admin) */
  getStats(params?: KaizenFilterParams): Promise<KaizenStats>;

  /** Xuất file CSV/Excel UTF-8 BOM (Admin) */
  exportCsv(params?: KaizenFilterParams): Promise<Blob>;

  /** Lấy thông tin phiên đăng nhập hiện tại từ SWA hoặc Mock */
  getCurrentUser(): Promise<UserPrincipal | null>;
}
