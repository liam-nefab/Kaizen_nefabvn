import {
  Department,
  Category,
  Scope,
  KaizenStatus,
  CompletionStatus,
  QuarterlyAward,
} from '../constants/kaizen';

/**
 * Bản ghi Kaizen hoàn chỉnh (tương ứng SharePoint List KaizenIdeas)
 */
export interface KaizenItem {
  id: string; // SharePoint ID hoặc UUID
  code: string; // Mã Kaizen dạng KZ-YYYY-NNNN (Title trong SP)
  submitDate: string; // YYYY-MM-DD
  topic: string; // Chủ đề
  employeeId: string; // Mã số nhân viên (In hoa)
  department: Department; // 1 trong 15 bộ phận
  ideaName: string; // Tên ý tưởng Kaizen
  category: Category; // 1 trong 5 lĩnh vực
  currentState: string; // Hiện trạng
  rootCause: string; // Nguyên nhân
  benefit: string; // Lợi ích
  beforeImageUrl: string; // URL ảnh trước trong thư viện
  afterImageUrl?: string; // URL ảnh sau (tùy chọn)
  savingAmount?: number; // Số tiền tiết kiệm (VNĐ, tùy chọn)
  idempotencyKey?: string; // UUID chống trùng
  
  // Phần thẩm định (Reviewer điền)
  status: KaizenStatus; // Mới | Đã thẩm định
  scope?: Scope; // Bắc Ninh | Đà Nẵng | Đồng Nai | Tất cả
  owner?: string; // Phụ trách thực thi
  completion?: CompletionStatus; // Hoàn thành | Chưa hoàn thành
  implementDate?: string; // Ngày thực hiện YYYY-MM-DD
  payMonth?: string; // Tháng chi trả YYYY-MM
  reviewerNote?: string; // Ghi chú khác
  quarterlyAward?: QuarterlyAward; // Có | Không
  reviewedBy?: string; // Email người thẩm định (từ Entra ID)
  reviewedAt?: string; // Thời gian thẩm định ISO
  quarter?: string; // VD: 2026-Q4 (tự tính từ submitDate)
  
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Dữ liệu người nộp gửi lên form đăng ký
 */
export interface KaizenSubmitInput {
  submitDate: string;
  topic: string;
  employeeId: string;
  department: Department;
  ideaName: string;
  category: Category;
  currentState: string;
  rootCause: string;
  benefit: string;
  savingAmount?: number | null;
  beforeImage: File | string; // File hoặc Base64
  afterImage?: File | string | null;
  honeypot?: string; // Chống spam bot
  idempotencyKey: string;
}

/**
 * Form thẩm định của Reviewer
 */
export interface KaizenReviewInput {
  scope: Scope;
  owner: string;
  completion: CompletionStatus;
  implementDate?: string;
  payMonth?: string;
  reviewerNote?: string;
  quarterlyAward: QuarterlyAward;
}

/**
 * Dữ liệu tra cứu an toàn cho công nhân (không lộ thông tin nhạy cảm)
 */
export interface KaizenTrackResult {
  code: string;
  employeeId: string;
  submitDate: string;
  topic: string;
  ideaName: string;
  department: Department;
  category: Category;
  status: KaizenStatus;
  completion?: CompletionStatus;
  implementDate?: string;
  quarterlyAward?: QuarterlyAward;
}

/**
 * Bộ lọc danh sách Kaizen & Dashboard
 */
export interface KaizenFilterParams {
  search?: string;
  department?: Department | 'ALL';
  category?: Category | 'ALL';
  status?: KaizenStatus | 'ALL';
  completion?: CompletionStatus | 'ALL';
  scope?: Scope | 'ALL';
  quarter?: string | 'ALL';
  startDate?: string;
  endDate?: string;
  quarterlyAwardOnly?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: 'submitDate' | 'savingAmount' | 'code';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Thống kê Dashboard
 */
export interface KaizenStats {
  totalCount: number;
  reviewedCount: number;
  newCount: number;
  completedCount: number;
  completionRate: number; // Phần trăm (%)
  totalSavings: number; // Tổng VNĐ
  quarterlyAwardCount: number;
  byMonth: { month: string; count: number; savings: number }[];
  byDepartment: { department: string; count: number; completed: number }[];
  byCategory: { category: string; count: number }[];
  byScope: { scope: string; count: number }[];
  topContributors: { employeeId: string; count: number; totalSavings: number }[];
  quarterlyNominees: KaizenItem[];
}

/**
 * Người dùng đăng nhập qua Microsoft Entra ID (Azure Static Web Apps)
 */
export interface UserPrincipal {
  identityProvider: string;
  userId: string;
  userDetails: string; // Email hoặc tên
  userRoles: string[]; // ["anonymous", "authenticated", "reviewer", "admin"]
}

export type AppRole = 'public' | 'reviewer' | 'admin';
