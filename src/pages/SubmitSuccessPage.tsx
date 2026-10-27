import React, { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Copy,
  Check,
  Search,
  PlusCircle,
  Home,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useToast } from '../components/common/Toast';

export const SubmitSuccessPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { success } = useToast();
  const [copied, setCopied] = useState(false);

  const state = location.state as {
    code?: string;
    id?: string;
    ideaName?: string;
    employeeId?: string;
    submitDate?: string;
  } | null;

  const code = state?.code || 'KZ-2026-0031';
  const employeeId = state?.employeeId || 'NF1024';

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    success(`Đã sao chép mã Kaizen: ${code}`);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10 text-center">
        {/* Success Icon */}
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 animate-in zoom-in duration-300">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div className="inline-flex items-center gap-1.5 bg-[#E8F1FB] text-[#005EB8] text-xs font-bold px-3 py-1 rounded-full mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Gửi thành công</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
          Cảm ơn sáng kiến của bạn!
        </h1>
        <p className="text-slate-600 text-sm max-w-md mx-auto leading-relaxed mb-6">
          Ý tưởng Kaizen của bạn đã được ghi nhận vào hệ thống nhà máy Nefab. Hãy lưu lại mã số bên dưới để tiện tra cứu kết quả thẩm định.
        </p>

        {/* Code Badge Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-8 max-w-md mx-auto">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Mã Kaizen của bạn
          </span>
          <div className="flex items-center justify-center gap-3">
            <span className="text-2xl sm:text-3xl font-black text-[#005EB8] font-mono tracking-wider tabular-nums">
              {code}
            </span>
            <button
              onClick={handleCopy}
              className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors shadow-xs"
              title="Sao chép mã"
              aria-label="Sao chép mã Kaizen"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
          {state?.ideaName && (
            <p className="text-xs text-slate-600 font-medium mt-2 line-clamp-1">
              {state.ideaName}
            </p>
          )}
        </div>

        {/* What happens next steps */}
        <div className="text-left bg-[#F5F7FA] rounded-xl p-5 mb-8 border border-slate-200/80">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-[#005EB8]" />
            Các bước tiếp theo
          </h3>
          <ul className="text-xs text-slate-600 space-y-2">
            <li className="flex items-start gap-2">
              <span className="font-bold text-[#005EB8] shrink-0">1.</span>
              <span>Ban thẩm định Kaizen sẽ họp xem xét tính khả thi trong vòng 30 ngày.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-[#005EB8] shrink-0">2.</span>
              <span>Ý tưởng được phê duyệt sẽ được phân công người phụ trách và bố trí kinh phí thực thi.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-[#005EB8] shrink-0">3.</span>
              <span>Tiền thưởng sáng kiến sẽ được chi trả vào kỳ lương của tháng hoàn thành.</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() =>
              navigate('/track', {
                state: { code, employeeId },
              })
            }
            className="w-full sm:w-auto h-12 px-6 rounded-xl bg-[#005EB8] hover:bg-[#00488F] text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-xs"
          >
            <Search className="w-4 h-4" />
            <span>Theo dõi tiến độ xử lý</span>
          </button>

          <Link
            to="/submit"
            className="w-full sm:w-auto h-12 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm transition-colors flex items-center justify-center gap-2 border border-slate-200"
          >
            <PlusCircle className="w-4 h-4 text-slate-600" />
            <span>Gửi thêm ý tưởng khác</span>
          </Link>

          <Link
            to="/"
            className="w-full sm:w-auto h-12 px-4 rounded-xl text-slate-500 hover:text-slate-800 font-medium text-sm flex items-center justify-center gap-1.5"
          >
            <Home className="w-4 h-4" />
            <span>Về trang chủ</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
