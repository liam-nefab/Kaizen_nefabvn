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
 * 5 Lĩnh vực Kaizen cải tiến (Chuẩn hóa duy nhất - Canonical)
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
 * Mã khóa ổn định cho 5 lĩnh vực (tránh lệch chuỗi tiếng Việt khi gửi API/lưu trữ)
 */
export const CATEGORY_KEYS = {
  TOOLS_MACHINES: 'Cải tiến dụng cụ/ máy móc',
  SAFETY_5S: 'An toàn/ 5S',
  PRODUCTIVITY: 'Năng suất',
  QUALITY: 'Chất lượng',
  SUPPLY_CHAIN: 'Chuỗi cung ứng',
} as const;

export type CategoryKey = keyof typeof CATEGORY_KEYS;

/**
 * Hàm chuẩn hóa chuỗi Lĩnh vực tiếng Việt (chống lệch khoảng trắng quanh '/', NFC/NFD, hoa/thường)
 */
export function normalizeCategory(raw?: string | null): Category {
  if (!raw) return CATEGORIES[0];
  const cleaned = raw
    .normalize('NFC')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\s*\/\s*/g, '/ '); // chuẩn hóa khoảng trắng quanh dấu '/'

  const lower = cleaned.toLowerCase();

  if (lower.includes('dụng cụ') || lower.includes('dung cu') || lower.includes('máy móc') || lower.includes('may moc') || lower.includes('máy') || lower.includes('may')) {
    return 'Cải tiến dụng cụ/ máy móc';
  }
  if (lower.includes('an toàn') || lower.includes('an toan') || lower.includes('5s')) {
    return 'An toàn/ 5S';
  }
  if (lower.includes('năng suất') || lower.includes('nang suat')) {
    return 'Năng suất';
  }
  if (lower.includes('chất lượng') || lower.includes('chat luong')) {
    return 'Chất lượng';
  }
  if (lower.includes('chuỗi cung ứng') || lower.includes('chuoi cung ung') || lower.includes('cung ứng')) {
    return 'Chuỗi cung ứng';
  }

  // Khớp chính xác nếu có
  const match = CATEGORIES.find((c) => c.toLowerCase() === lower);
  return match || CATEGORIES[0];
}

/**
 * Hàm chuẩn hóa Bộ phận tiếng Việt
 */
export function normalizeDepartment(raw?: string | null): Department {
  if (!raw) return DEPARTMENTS[0];
  const cleaned = raw.normalize('NFC').trim().replace(/\s+/g, ' ');
  const lower = cleaned.toLowerCase();

  const match = DEPARTMENTS.find((d) => d.toLowerCase() === lower);
  if (match) return match;

  // Xử lý các biến thể dấu '-'
  const simplified = lower.replace(/\s*-\s*/g, '-');
  const matchHyphen = DEPARTMENTS.find((d) => d.toLowerCase().replace(/\s*-\s*/g, '-') === simplified);
  return matchHyphen || DEPARTMENTS[0];
}

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
