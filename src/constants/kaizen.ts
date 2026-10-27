/**
 * Nefab Kaizen Portal - Hằng số dùng chung toàn hệ thống
 * (Frontend, Validation, Bộ lọc & API)
 */

export const NEFAB_THEME = {
  primary: '#005EB8', // Xanh dương Nefab
  primaryHover: '#00488F',
  primaryLight: '#E8F1FB',
  primaryBorder: '#B8D5F5',
  success: '#2E9E5B', // Xanh lá - Hoàn thành
  successLight: '#EDF8F1',
  warning: '#F59E0B', // Cam - Đang xử lý / Mới
  warningLight: '#FEF7EB',
  danger: '#DC2626', // Đỏ - Từ chối / Lỗi
  dangerLight: '#FEF2F2',
  background: '#F5F7FA',
  card: '#FFFFFF',
  border: '#E2E8F0',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
} as const;

/**
 * 15 Bộ phận chuẩn hóa của nhà máy Nefab (chính xác từng ký tự theo yêu cầu)
 */
export const DEPARTMENTS = [
  'Kinh doanh',
  'Nhân sự & Thương hiệu',
  'Sản xuất -Đài Loan',
  'Sản xuất- Giấy',
  'Sản xuất- Gỗ',
  'Sản xuất- Nhựa',
  'Tài chính - Kế toán',
  'Thiết kế',
  'Vận hành',
  'Vận hành - Bảo trì',
  'Vận hành - Chất lượng',
  'Vận hành - Kho',
  'Vận hành- CS',
  'Vận hành- Planning',
  'Vận hành- Pur',
] as const;

export type Department = typeof DEPARTMENTS[number];

/**
 * 5 Lĩnh vực Kaizen cải tiến
 */
export const CATEGORIES = [
  'Cải tiến dụng cụ/ máy móc',
  'An toàn/ 5S',
  'Năng suất',
  'Chất lượng',
  'Chuỗi cung ứng',
] as const;

export type Category = typeof CATEGORIES[number];

/**
 * 4 Phạm vi triển khai của Nefab Việt Nam
 */
export const SCOPES = [
  'Bắc Ninh',
  'Đà Nẵng',
  'Đồng Nai',
  'Tất cả',
] as const;

export type Scope = typeof SCOPES[number];

/**
 * Trạng thái xử lý Kaizen
 */
export const STATUSES = [
  'Mới',
  'Đã thẩm định',
] as const;

export type KaizenStatus = typeof STATUSES[number];

/**
 * Đánh giá hoàn thành thực tế
 */
export const COMPLETION_STATUSES = [
  'Hoàn thành',
  'Chưa hoàn thành',
] as const;

export type CompletionStatus = typeof COMPLETION_STATUSES[number];

/**
 * Tham dự giải quý
 */
export const QUARTERLY_AWARDS = [
  'Có',
  'Không',
] as const;

export type QuarterlyAward = typeof QUARTERLY_AWARDS[number];
