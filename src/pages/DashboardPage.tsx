import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  DEPARTMENTS,
  CATEGORIES,
  SCOPES,
  Department,
  Category,
  Scope,
} from '../constants/kaizen';
import { apiClient } from '../services/api';
import { KaizenStats, KaizenFilterParams } from '../types/kaizen';
import { formatVND } from '../services/imageCompression';
import { useToast } from '../components/common/Toast';
import {
  Lightbulb,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  Trophy,
  Download,
  RotateCcw,
  Users,
  Award,
  ChevronRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';

const COLORS = ['#005EB8', '#2E9E5B', '#F59E0B', '#8B5CF6', '#06B6D4', '#EC4899', '#64748B'];

export const DashboardPage: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [stats, setStats] = useState<KaizenStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Bộ lọc Dashboard
  const [department, setDepartment] = useState<Department | 'ALL'>('ALL');
  const [category, setCategory] = useState<Category | 'ALL'>('ALL');
  const [scope, setScope] = useState<Scope | 'ALL'>('ALL');
  const [quarter, setQuarter] = useState<string>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: KaizenFilterParams = {
        department,
        category,
        scope,
        quarter,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };
      const data = await apiClient.getStats(params);
      setStats(data);
    } catch {
      toastError('Không thể tải dữ liệu thống kê');
    } finally {
      setIsLoading(false);
    }
  }, [department, category, scope, quarter, startDate, endDate, toastError]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleResetFilters = () => {
    setDepartment('ALL');
    setCategory('ALL');
    setScope('ALL');
    setQuarter('ALL');
    setStartDate('');
    setEndDate('');
  };

  const handleExportCsv = async () => {
    try {
      const blob = await apiClient.exportCsv({
        department,
        category,
        scope,
        quarter,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Nefab_Kaizen_Report_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      success('Đã xuất file báo cáo Excel/CSV thành công!');
    } catch {
      toastError('Không thể xuất file báo cáo');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <span>Báo cáo & Phân tích</span>
            <span>·</span>
            <span>Ban Giám Đốc Nefab Việt Nam</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Dashboard Thống kê Kaizen
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Dữ liệu sáng kiến liên tục tại các nhà máy Bắc Ninh, Đà Nẵng và Đồng Nai
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="h-10 px-4 rounded-xl bg-[#005EB8] hover:bg-[#00488F] text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Xuất Báo cáo Excel/CSV</span>
        </button>
      </div>

      {/* Thanh bộ lọc Dashboard */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Quý / Năm */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
              Quý / Năm
            </label>
            <select
              value={quarter}
              onChange={(e) => setQuarter(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-slate-50 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005EB8]"
            >
              <option value="ALL">Tất cả các Quý</option>
              <option value="2026-Q1">2026 - Quý 1</option>
              <option value="2026-Q2">2026 - Quý 2</option>
              <option value="2026-Q3">2026 - Quý 3</option>
              <option value="2026-Q4">2026 - Quý 4</option>
            </select>
          </div>

          {/* Bộ phận */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
              Bộ phận (15)
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value as Department | 'ALL')}
              className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-slate-50 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005EB8]"
            >
              <option value="ALL">Tất cả bộ phận</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Lĩnh vực */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
              Lĩnh vực (5)
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category | 'ALL')}
              className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-slate-50 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005EB8]"
            >
              <option value="ALL">Tất cả lĩnh vực</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Phạm vi */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
              Nhà máy / Phạm vi
            </label>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value as Scope | 'ALL')}
              className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-slate-50 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005EB8]"
            >
              <option value="ALL">Tất cả nhà máy</option>
              {SCOPES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Đặt lại */}
          <div className="flex items-end">
            <button
              onClick={handleResetFilters}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Xóa bộ lọc</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* KPI 1: Tổng số Kaizen */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <Lightbulb className="w-4 h-4 text-[#005EB8]" />
            <span>Tổng Kaizen</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
            {stats?.totalCount || 0}
          </div>
          <p className="text-[11px] text-slate-400">Sáng kiến đã ghi nhận</p>
        </div>

        {/* KPI 2: Đã thẩm định / Chưa */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Đã thẩm định</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 font-mono tabular-nums">
            {stats?.reviewedCount || 0}
          </div>
          <p className="text-[11px] text-slate-500">
            Chưa thẩm định: <span className="font-bold text-amber-600">{stats?.newCount || 0}</span>
          </p>
        </div>

        {/* KPI 3: Tỷ lệ hoàn thành */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Tỷ lệ hoàn thành</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
            {stats?.completionRate || 0}%
          </div>
          <p className="text-[11px] text-slate-500">
            {stats?.completedCount || 0} sáng kiến đã thực thi
          </p>
        </div>

        {/* KPI 4: Tiết kiệm làm lợi */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <TrendingUp className="w-4 h-4 text-amber-600" />
            <span>Tổng tiết kiệm</span>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-amber-600 font-mono tabular-nums truncate">
            {formatVND(stats?.totalSavings || 0)}
          </div>
          <p className="text-[11px] text-slate-400">Làm lợi cho nhà máy</p>
        </div>

        {/* KPI 5: Giải quý */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-1 col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>Tham dự giải quý</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#005EB8] font-mono tabular-nums">
            {stats?.quarterlyAwardCount || 0}
          </div>
          <p className="text-[11px] text-slate-400">Được chọn xét thưởng</p>
        </div>
      </div>

      {/* Grid Biểu đồ hàng 1: Xu hướng theo tháng & Lĩnh vực Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Biểu đồ theo tháng (8 cột) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Xu hướng sáng kiến & Tiết kiệm theo tháng
              </h3>
              <p className="text-xs text-slate-500">Số lượng Kaizen (cột) và Tiền tiết kiệm (triệu VNĐ, đường)</p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.byMonth || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" orientation="left" tick={{ fontSize: 11 }} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11 }}
                  unit=" tr"
                />
                <Tooltip
                  formatter={(val: any, name: any) => [
                    name === 'count' ? `${val} ý tưởng` : `${val} triệu ₫`,
                    name === 'count' ? 'Số Kaizen' : 'Tiết kiệm',
                  ]}
                />
                <Legend
                  formatter={(value) => (value === 'count' ? 'Số lượng Kaizen' : 'Tiết kiệm (Triệu VNĐ)')}
                />
                <Bar
                  yAxisId="left"
                  dataKey="count"
                  fill="#005EB8"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={35}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="savings"
                  stroke="#F59E0B"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Biểu đồ tròn theo lĩnh vực (4 cột) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Phân bố theo 5 Lĩnh vực
            </h3>
            <p className="text-xs text-slate-500 mb-4">Tỷ trọng các đề tài cải tiến</p>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.byCategory || []}
                  dataKey="count"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {(stats?.byCategory || []).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => [`${value} ý tưởng`, 'Số lượng']} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Chú thích lĩnh vực */}
          <div className="grid grid-cols-1 gap-1.5 pt-2 border-t border-slate-100 text-xs">
            {(stats?.byCategory || []).map((cat, idx) => (
              <div key={cat.category} className="flex items-center justify-between text-slate-600">
                <div className="flex items-center gap-2 truncate pr-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                  <span className="truncate">{cat.category}</span>
                </div>
                <span className="font-bold text-slate-900 font-mono tabular-nums">
                  {cat.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grid Biểu đồ hàng 2: Xếp hạng theo Bộ phận (Cột ngang) & Phân bố theo Nhà máy */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Bộ phận (7 cột) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Đóng góp sáng kiến theo Bộ phận (15 bộ phận)
              </h3>
              <p className="text-xs text-slate-500">Xếp hạng số lượng gửi và tỷ lệ hoàn thành</p>
            </div>
          </div>

          <div className="h-80 w-full overflow-y-auto">
            <ResponsiveContainer width="100%" height={stats?.byDepartment.length ? stats.byDepartment.length * 36 + 40 : 300}>
              <BarChart
                data={stats?.byDepartment || []}
                layout="vertical"
                margin={{ left: 100, right: 20, top: 10, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="department"
                  tick={{ fontSize: 11 }}
                  width={95}
                />
                <Tooltip />
                <Legend
                  formatter={(v) => (v === 'count' ? 'Tổng số nộp' : 'Đã hoàn thành')}
                />
                <Bar dataKey="count" fill="#005EB8" radius={[0, 4, 4, 0]} maxBarSize={20} />
                <Bar dataKey="completed" fill="#2E9E5B" radius={[0, 4, 4, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Phân bố theo Phạm vi / Nhà máy (5 cột) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900">
              Phân bố theo Nhà máy & Phạm vi áp dụng
            </h3>
            <p className="text-xs text-slate-500">Bắc Ninh · Đà Nẵng · Đồng Nai · Toàn quốc</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.byScope || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="scope" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(val: any) => [`${val} Kaizen`, 'Số lượng']} />
                <Bar dataKey="count" fill="#005EB8" radius={[4, 4, 0, 0]} maxBarSize={45}>
                  {(stats?.byScope || []).map((_, index) => (
                    <Cell key={`scope-cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Grid 2 Bảng: Top 10 người nộp nhiều nhất & Danh sách tham dự giải quý */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top 10 người nộp nhiều nhất */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[#005EB8]" />
              <h3 className="text-sm font-bold text-slate-900">
                Top 10 Người nộp nhiều Kaizen nhất
              </h3>
            </div>
            <span className="text-xs text-slate-400">Xếp hạng theo mã NV</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="py-2.5 px-3">Hạng</th>
                  <th className="py-2.5 px-3">Mã nhân viên</th>
                  <th className="py-2.5 px-3 text-right">Số Kaizen</th>
                  <th className="py-2.5 px-3 text-right">Tiết kiệm (VNĐ)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {(stats?.topContributors || []).map((c, idx) => (
                  <tr key={c.employeeId} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-sans font-bold">
                      {idx === 0 && <span className="text-amber-500 font-bold">🥇 1</span>}
                      {idx === 1 && <span className="text-slate-400 font-bold">🥈 2</span>}
                      {idx === 2 && <span className="text-amber-700 font-bold">🥉 3</span>}
                      {idx > 2 && <span className="text-slate-500">#{idx + 1}</span>}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">
                      {c.employeeId}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-[#005EB8] tabular-nums">
                      {c.count}
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-600 font-semibold tabular-nums">
                      {formatVND(c.totalSavings)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Danh sách tham dự giải quý */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900">
                Danh sách Tham dự Giải Quý Nefab
              </h3>
            </div>
            <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded">
              {stats?.quarterlyNominees.length || 0} sáng kiến
            </span>
          </div>

          <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
            {(stats?.quarterlyNominees || []).map((nom) => (
              <div
                key={nom.id}
                className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-blue-50/40 hover:border-blue-200 transition-all flex items-start justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500 mb-0.5">
                    <span className="font-bold text-[#005EB8]">{nom.code}</span>
                    <span>·</span>
                    <span>NV: {nom.employeeId}</span>
                    <span>·</span>
                    <span>{nom.department}</span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1">
                    {nom.ideaName}
                  </h4>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                    <span>Phụ trách: <strong>{nom.owner || 'Chưa gán'}</strong></span>
                    <span>·</span>
                    <span>Chi trả: <strong>{nom.payMonth || '—'}</strong></span>
                  </div>
                </div>

                <Link
                  to={`/review/${nom.id}`}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-[#005EB8] hover:bg-white transition-colors shrink-0"
                  title="Xem chi tiết"
                >
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
