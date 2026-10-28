import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import { Lock, User, Eye, EyeOff, LogIn, ArrowLeft, ShieldCheck, Activity } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, role, isReviewer } = useAuth();
  const { success, error: toastError } = useToast();

  const [passcode, setPasscode] = useState('');
  const [name, setName] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const redirectPath = searchParams.get('redirect') || '/review';

  // Nếu đã đăng nhập rồi, tự động chuyển hướng
  React.useEffect(() => {
    if (isReviewer) {
      navigate(redirectPath, { replace: true });
    }
  }, [isReviewer, navigate, redirectPath]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) {
      setErrorMessage('Vui lòng nhập mã truy cập (Passcode)');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await login(passcode, name);
      success('Đăng nhập thành công!');
      navigate(redirectPath, { replace: true });
    } catch (err: any) {
      const msg = err?.message || 'Đăng nhập không thành công. Vui lòng kiểm tra lại mã.';
      setErrorMessage(msg);
      toastError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 px-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        {/* Header Icon & Title */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[#E8F1FB] text-[#005EB8] flex items-center justify-center mx-auto mb-3">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Đăng nhập Thẩm định Kaizen
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Dành cho Ban Thẩm định & Quản trị viên Nefab Việt Nam
          </p>
        </div>

        {errorMessage && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2.5">
            <span className="font-bold text-sm shrink-0">⚠️</span>
            <div className="leading-relaxed">{errorMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Mã truy cập Passcode */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Mã truy cập (Passcode) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPasscode ? 'text' : 'password'}
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Nhập mã truy cập..."
                autoComplete="current-password"
                className="w-full h-12 pl-10 pr-11 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-[#005EB8] focus:bg-white focus:ring-2 focus:ring-[#005EB8]/20 transition-all font-mono"
                required
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-4 pointer-events-none" />
              <button
                type="button"
                onClick={() => setShowPasscode(!showPasscode)}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
                tabIndex={-1}
              >
                {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Phân quyền tự động (Thẩm định viên hoặc Quản trị viên) theo mã.
            </p>
          </div>

          {/* Họ và tên người thẩm định */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Họ và tên người thẩm định <span className="text-slate-400 font-normal">(Tùy chọn)</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Nguyễn Văn A - Quản lý xưởng"
                className="w-full h-12 pl-10 pr-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-[#005EB8] focus:bg-white focus:ring-2 focus:ring-[#005EB8]/20 transition-all"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-4 pointer-events-none" />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Tên sẽ được lưu vào lịch sử thẩm định của từng ý tưởng Kaizen.
            </p>
          </div>

          {/* Nút bấm Đăng nhập */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 bg-[#005EB8] hover:bg-[#00488F] disabled:bg-slate-300 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 shadow-xs transition-colors mt-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Đang xác thực...</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Đăng nhập hệ thống</span>
              </>
            )}
          </button>
        </form>

        {/* Footer Links & Info */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col items-center gap-3">
          <Link
            to="/"
            className="text-xs text-slate-500 hover:text-[#005EB8] flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại trang chủ</span>
          </Link>

          <Link
            to="/diagnostics"
            className="text-[11px] text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors"
          >
            <Activity className="w-3 h-3" />
            <span>Kiểm tra kết nối hệ thống (Diagnostics)</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
