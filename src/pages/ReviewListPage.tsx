import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  DEPARTMENTS,
  CATEGORIES,
  SCOPES,
  Department,
  Category,
  Scope,
  KaizenStatus,
} from '../constants/kaizen';
import { apiClient } from '../services/api';
import { KaizenItem, KaizenFilterParams } from '../types/kaizen';
import { formatVND } from '../services/imageCompression';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import {
  Search,
  Filter,
  Download,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  Trophy,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  PlusCircle,
  FileSpreadsheet,
} from 'lucide-react';

export const ReviewListPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { success, error: toastError } = useToast();

  const [items, setItems] = useState<KaizenItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Bộ lọc
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState<Department | 'ALL'>('ALL');
  const [category, setCategory] = useState<Category | 'ALL'>('ALL');
  const [status, setStatus] = useState<KaizenStatus | 'ALL'>('ALL');
  const [scope, setScope] = useState<Scope | 'ALL'>('ALL');
  const [quarter, setQuarter] = useState<string>('ALL');
  const [quarterlyAwardOnly, setQuarterlyAwardOnly] = useState(false);

  // Xóa modal confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: KaizenFilterParams = {
        search,
        department,
        category,
        status,
        scope,
        quarter,
        quarterlyAwardOnly,
        page,
        pageSize,
        sortBy: 'submitDate',
        sortOrder: 'desc',
      };
      const res = await apiClient.getKaizens(params);
      setItems(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch {
      toastError('Không thể tải danh sách Kaizen');
    } finally {
      setIsLoading(false);
    }
  }, [search, department, category, status, scope, quarter, quarterlyAwardOnly, page, pageSize, toastError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleResetFilters = () => {
    setSearch('');
    setDepartment('ALL');
    setCategory('ALL');
    setStatus('ALL');
    setScope('ALL');
    setQuarter('ALL');
    setQuarterlyAwardOnly(false);
    setPage(1);
  };

  const handleExportCsv = async () => {
    try {
      const blob = await apiClient.exportCsv({
        search,
        department,
        category,
        status,
        scope,
        quarter,
        quarterlyAwardOnly,
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Kaizen_Nefab_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      success('Xuất file CSV/Excel thành công!');
    } catch {
      toastError('Không thể xuất file CSV');
    }
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await apiClient.deleteKaizen(deletingId);
      success('Đã xóa ý tưởng Kaizen thành công');
      setDeletingId(null);
      loadData();
    } catch {
      toastError('Không thể xóa ý tưởng');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <span>Quản lý thẩm định</span>
            <span>·</span>
            <span>Microsoft Entra ID</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Danh sách sáng kiến Kaizen
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tổng cộng: <strong className="text-slate-800 font-mono tabular-nums">{total}</strong> ý tưởng trong cơ sở dữ liệu
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleExportCsv}
            className="h-10 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-2 border border-slate-200 transition-colors"
            title="Xuất file CSV tương thích Microsoft Excel (hỗ trợ tiếng Việt)"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Xuất Excel/CSV</span>
          </button>

          <button
            onClick={() => navigate('/submit')}
            className="h-10 px-4 rounded-xl bg-[#005EB8] hover:bg-[#00488F] text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Tạo mới</span>
          </button>
        </div>
      </div>

      {/* Bộ lọc thanh công cụ */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Ô tìm kiếm */}
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm theo Mã Kaizen, tên ý tưởng, mã NV, người thực thi..."
              className="w-full h-11 pl-10 pr-3 rounded-xl border border-slate-300 bg-slate-50 text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005EB8]"
            />
          </div>

          {/* Bộ phận (15 bộ phận) */}
          <div>
            <select
              value={department}
              onChange={(e) => {
                setDepartment(e.target.value as Department | 'ALL');
                setPage(1);
              }}
              className="w-full h-11 px-3 rounded-xl border border-slate-300 bg-slate-50 text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005EB8]"
            >
              <option value="ALL">Tất cả bộ phận (15)</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Lĩnh vực (5 lĩnh vực) */}
          <div>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value as Category | 'ALL');
                setPage(1);
              }}
              className="w-full h-11 px-3 rounded-xl border border-slate-300 bg-slate-50 text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005EB8]"
            >
              <option value="ALL">Tất cả lĩnh vực (5)</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dòng lọc thứ hai */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Trạng thái thẩm định */}
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as KaizenStatus | 'ALL');
                setPage(1);
              }}
              className="h-9 px-2.5 rounded-lg border border-slate-300 bg-white text-xs font-medium focus:ring-1 focus:ring-[#005EB8]"
            >
              <option value="ALL">Trạng thái: Tất cả</option>
              <option value="Mới">Mới (Chưa thẩm định)</option>
              <option value="Đã thẩm định">Đã thẩm định</option>
            </select>

            {/* Phạm vi */}
            <select
              value={scope}
              onChange={(e) => {
                setScope(e.target.value as Scope | 'ALL');
                setPage(1);
              }}
              className="h-9 px-2.5 rounded-lg border border-slate-300 bg-white text-xs font-medium focus:ring-1 focus:ring-[#005EB8]"
            >
              <option value="ALL">Phạm vi: Tất cả</option>
              {SCOPES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            {/* Quý */}
            <select
              value={quarter}
              onChange={(e) => {
                setQuarter(e.target.value);
                setPage(1);
              }}
              className="h-9 px-2.5 rounded-lg border border-slate-300 bg-white text-xs font-medium focus:ring-1 focus:ring-[#005EB8]"
            >
              <option value="ALL">Quý: Tất cả</option>
              <option value="2026-Q1">2026 - Quý 1</option>
              <option value="2026-Q2">2026 - Quý 2</option>
              <option value="2026-Q3">2026 - Quý 3</option>
              <option value="2026-Q4">2026 - Quý 4</option>
            </select>

            {/* Toggle tham dự giải quý */}
            <button
              onClick={() => {
                setQuarterlyAwardOnly(!quarterlyAwardOnly);
                setPage(1);
              }}
              className={`h-9 px-3 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                quarterlyAwardOnly
                  ? 'bg-amber-50 border-amber-300 text-amber-800 font-bold'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span>Chỉ xem tham dự giải quý</span>
            </button>
          </div>

          <button
            onClick={handleResetFilters}
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Xóa bộ lọc</span>
          </button>
        </div>
      </div>

      {/* Bảng danh sách Kaizen */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500">
            <div className="w-8 h-8 border-3 border-[#005EB8] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-medium">Đang tải danh sách Kaizen...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-800">Không tìm thấy ý tưởng Kaizen nào</p>
            <p className="text-xs text-slate-500 mt-1">Thử thay đổi từ khóa hoặc điều kiện lọc</p>
            <button
              onClick={handleResetFilters}
              className="mt-4 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
            >
              Đặt lại toàn bộ lọc
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4 whitespace-nowrap">Mã Kaizen</th>
                  <th className="py-3 px-4 whitespace-nowrap">Ngày nộp</th>
                  <th className="py-3 px-4 whitespace-nowrap">Tên ý tưởng & Chủ đề</th>
                  <th className="py-3 px-4 whitespace-nowrap">Bộ phận & NV</th>
                  <th className="py-3 px-4 whitespace-nowrap">Lĩnh vực</th>
                  <th className="py-3 px-4 whitespace-nowrap">Tiết kiệm</th>
                  <th className="py-3 px-4 whitespace-nowrap">Trạng thái</th>
                  <th className="py-3 px-4 whitespace-nowrap">Giải quý</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-blue-50/40 transition-colors group"
                  >
                    {/* Mã Kaizen */}
                    <td className="py-3 px-4 font-mono font-bold text-[#005EB8] whitespace-nowrap">
                      <Link
                        to={`/review/${item.id}`}
                        className="hover:underline flex items-center gap-1"
                      >
                        {item.code}
                      </Link>
                    </td>

                    {/* Ngày nộp */}
                    <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap tabular-nums">
                      {item.submitDate}
                    </td>

                    {/* Tên ý tưởng & Chủ đề */}
                    <td className="py-3 px-4 max-w-[280px]">
                      <Link
                        to={`/review/${item.id}`}
                        className="font-semibold text-slate-900 group-hover:text-[#005EB8] line-clamp-1 text-xs sm:text-sm"
                      >
                        {item.ideaName}
                      </Link>
                      <span className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {item.topic}
                      </span>
                    </td>

                    {/* Bộ phận & Mã NV */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="text-slate-900 font-medium block">{item.department}</span>
                      <span className="text-[11px] font-mono text-slate-400">
                        NV: {item.employeeId}
                      </span>
                    </td>

                    {/* Lĩnh vực */}
                    <td className="py-3 px-4 whitespace-nowrap text-slate-700">
                      {item.category}
                    </td>

                    {/* Tiền tiết kiệm */}
                    <td className="py-3 px-4 whitespace-nowrap font-mono tabular-nums font-semibold text-slate-800">
                      {item.savingAmount ? formatVND(item.savingAmount) : '—'}
                    </td>

                    {/* Trạng thái */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {item.status === 'Đã thẩm định' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Đã duyệt
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" />
                          Mới
                        </span>
                      )}
                    </td>

                    {/* Tham dự giải quý */}
                    <td className="py-3 px-4 whitespace-nowrap text-center">
                      {item.quarterlyAward === 'Có' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          <Trophy className="w-3 h-3 text-amber-500" />
                          Có
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Không</span>
                      )}
                    </td>

                    {/* Nút thao tác */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/review/${item.id}`}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-[#005EB8] hover:bg-slate-100 transition-colors"
                          title="Thẩm định chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>

                        {isAdmin && (
                          <button
                            onClick={() => setDeletingId(item.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Xóa ý tưởng (Admin)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Phân trang */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div>
            Hiển thị trang <span className="font-bold">{page}</span> /{' '}
            <span className="font-bold">{totalPages}</span> (Tổng số {total} bản ghi)
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Trang trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-1 font-mono font-medium">{page}</span>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Trang sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal xác nhận xóa dành cho Admin */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Xác nhận xóa ý tưởng Kaizen?
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              Hành động này chỉ dành cho Quản trị viên (Admin) và không thể hoàn tác. Bản ghi và các hình ảnh liên quan sẽ bị xóa khỏi hệ thống.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200"
              >
                Hủy bỏ
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:bg-slate-300"
              >
                {isDeleting ? 'Đang xóa...' : 'Đồng ý xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
