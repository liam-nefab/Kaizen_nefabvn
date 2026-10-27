import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, LogIn, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false,
}) => {
  const { isReviewer, isAdmin, isLoading, login } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <div className="w-8 h-8 border-3 border-[#005EB8] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Đang kiểm tra quyền truy cập...</span>
        </div>
      </div>
    );
  }

  // Nếu chưa đăng nhập hoặc không có quyền Reviewer/Admin
  if (!isReviewer || (requireAdmin && !isAdmin)) {
    return (
      <div className="max-w-xl mx-auto my-16 px-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#E8F1FB] text-[#005EB8] flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <h2 className="text-xl font-bold text-slate-900 mb-2">
            Yêu cầu quyền {requireAdmin ? 'Quản trị viên (Admin)' : 'Người thẩm định (Reviewer)'}
          </h2>
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            Khu vực này dành riêng cho Ban giám đốc, Trưởng bộ phận và Nhóm thẩm định Kaizen của Nefab Việt Nam. Vui lòng đăng nhập bằng tài khoản Microsoft Entra ID của công ty (@nefab.com).
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={login}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#005EB8] hover:bg-[#00488F] text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-xs transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span>Đăng nhập Microsoft Entra ID</span>
            </button>

            <Link
              to="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Về trang chủ</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
