import React, { useState, useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { apiClient } from '../services/api';
import { KaizenTrackResult } from '../types/kaizen';
import { useToast } from '../components/common/Toast';
import {
  Search,
  CheckCircle2,
  Clock,
  Trophy,
  AlertCircle,
  FileQuestion,
  Calendar,
  Building,
  Tag,
} from 'lucide-react';

export const TrackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { error: toastError } = useToast();

  const navState = location.state as { code?: string; employeeId?: string } | null;

  const [code, setCode] = useState(
    searchParams.get('code') || navState?.code || ''
  );
  const [employeeId, setEmployeeId] = useState(
    searchParams.get('employeeId') || navState?.employeeId || ''
  );
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<KaizenTrackResult | null>(null);
  const [searched, setSearched] = useState(false);

  const doTrack = async (c: string, emp: string) => {
    if (!c.trim() || !emp.trim()) {
      toastError('Vui lòng nhập đầy đủ Mã Kaizen và Mã nhân viên');
      return;
    }

    setIsLoading(true);
    setSearched(true);
    try {
      const data = await apiClient.trackKaizen(c.trim(), emp.trim());
      setResult(data);
    } catch {
      toastError('Không thể tra cứu vào lúc này. Vui lòng thử lại sau.');
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (code && employeeId) {
      doTrack(code, employeeId);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doTrack(code, employeeId);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Header card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 mb-6 shadow-xs text-center">
        <div className="w-12 h-12 rounded-xl bg-[#E8F1FB] text-[#005EB8] flex items-center justify-center mx-auto mb-3">
          <Search className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Tra cứu tiến độ Kaizen
        </h1>
        <p className="text-sm text-slate-600 mt-1 max-w-lg mx-auto">
          Nhập mã Kaizen và mã số nhân viên của bạn để kiểm tra tình trạng tiếp nhận, thẩm định và chi trả khen thưởng.
        </p>

        {/* Search form */}
        <form onSubmit={handleSubmit} className="mt-6 max-w-xl mx-auto space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Mã Kaizen
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="VD: KZ-2026-0001"
                className="w-full h-12 px-3.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 font-mono uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005EB8]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Mã nhân viên nộp
              </label>
              <input
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
                placeholder="VD: NF1024"
                className="w-full h-12 px-3.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005EB8]"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 rounded-xl bg-[#005EB8] hover:bg-[#00488F] text-white font-bold text-sm shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:bg-slate-300"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Đang tra cứu dữ liệu...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Kiểm tra trạng thái</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Kết quả tra cứu */}
      {searched && !isLoading && (
        <>
          {result ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
              {/* Header result */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-500 mb-1">
                    <span>Mã:</span>
                    <span className="font-bold text-[#005EB8] text-base">{result.code}</span>
                    <span>·</span>
                    <span>Mã NV: {result.employeeId}</span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                    {result.ideaName}
                  </h2>
                </div>

                <div className="shrink-0">
                  {result.status === 'Đã thẩm định' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Đã thẩm định
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      <Clock className="w-4 h-4 text-amber-600" />
                      Đang chờ thẩm định
                    </span>
                  )}
                </div>
              </div>

              {/* Progress Stepper Timeline */}
              <div className="py-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-4">
                  Tiến độ giải quyết sáng kiến
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Bước 1: Tiếp nhận */}
                  <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
                    <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs mb-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Bước 1: Đã tiếp nhận</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Ngày nộp: <span className="font-semibold">{result.submitDate}</span>
                    </p>
                  </div>

                  {/* Bước 2: Thẩm định */}
                  <div
                    className={`p-4 rounded-xl border ${
                      result.status === 'Đã thẩm định'
                        ? 'bg-emerald-50/70 border-emerald-200'
                        : 'bg-amber-50/70 border-amber-200'
                    }`}
                  >
                    <div
                      className={`flex items-center gap-2 font-bold text-xs mb-1 ${
                        result.status === 'Đã thẩm định' ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {result.status === 'Đã thẩm định' ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Clock className="w-4 h-4" />
                      )}
                      <span>Bước 2: Ban Kaizen duyệt</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      {result.status === 'Đã thẩm định'
                        ? 'Đã được Ban thẩm định phê duyệt'
                        : 'Đang xếp lịch thẩm định'}
                    </p>
                  </div>

                  {/* Bước 3: Triển khai & Giải quý */}
                  <div
                    className={`p-4 rounded-xl border ${
                      result.completion === 'Hoàn thành'
                        ? 'bg-emerald-50/70 border-emerald-200'
                        : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}
                  >
                    <div
                      className={`flex items-center gap-2 font-bold text-xs mb-1 ${
                        result.completion === 'Hoàn thành'
                          ? 'text-emerald-700'
                          : 'text-slate-600'
                      }`}
                    >
                      {result.completion === 'Hoàn thành' ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Clock className="w-4 h-4" />
                      )}
                      <span>Bước 3: Thực thi nhà xưởng</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      {result.completion === 'Hoàn thành'
                        ? `Hoàn thành ngày ${result.implementDate || 'vừa qua'}`
                        : 'Đang tiến hành / Chờ nghiệm thu'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Thông tin chi tiết */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <Building className="w-4 h-4 text-[#005EB8]" />
                  <span>Bộ phận:</span>
                  <span className="font-semibold text-slate-900">{result.department}</span>
                </div>

                <div className="flex items-center gap-2 text-slate-600">
                  <Tag className="w-4 h-4 text-[#005EB8]" />
                  <span>Lĩnh vực:</span>
                  <span className="font-semibold text-slate-900">{result.category}</span>
                </div>

                <div className="flex items-center gap-2 text-slate-600">
                  <Calendar className="w-4 h-4 text-[#005EB8]" />
                  <span>Chủ đề:</span>
                  <span className="font-semibold text-slate-900">{result.topic}</span>
                </div>

                {result.quarterlyAward === 'Có' && (
                  <div className="flex items-center gap-2 text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    <span className="font-bold text-xs">
                      Ý tưởng được Ban thẩm định chọn tham dự Giải thưởng Quý!
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-3">
                <FileQuestion className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                Không tìm thấy ý tưởng Kaizen
              </h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                Vui lòng kiểm tra lại chính xác Mã Kaizen (VD: <span className="font-mono">KZ-2026-0001</span>) và Mã số nhân viên đã nộp đơn. Vì lý do bảo mật, hai thông tin này phải khớp hoàn toàn.
              </p>
            </div>
          )}
        </>
      )}

      {/* Gợi ý mẫu */}
      {!searched && (
        <div className="bg-slate-100/80 rounded-2xl p-5 border border-slate-200 text-xs text-slate-600 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-[#005EB8] shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-800">Thử nghiệm nhanh:</span> Bạn có thể tra cứu mã mẫu <button type="button" onClick={() => { setCode('KZ-2026-0001'); setEmployeeId('NF1024'); }} className="text-[#005EB8] font-bold font-mono underline mx-1">KZ-2026-0001</button> với mã NV <span className="font-bold font-mono">NF1024</span> hoặc <button type="button" onClick={() => { setCode('KZ-2026-0026'); setEmployeeId('NF2230'); }} className="text-[#005EB8] font-bold font-mono underline mx-1">KZ-2026-0026</button> với mã NV <span className="font-bold font-mono">NF2230</span>.
          </div>
        </div>
      )}
    </div>
  );
};
