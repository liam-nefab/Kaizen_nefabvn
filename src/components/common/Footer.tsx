import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield, MapPin, HeartHandshake } from 'lucide-react';

export const Footer: React.FC = () => {
  const { isReviewer, login, logout, user } = useAuth();

  return (
    <footer className="bg-white border-t border-slate-200 mt-auto text-xs text-slate-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="md:col-span-2 space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm tracking-wide">NEFAB VIỆT NAM</span>
              <span className="text-slate-300">|</span>
              <span className="font-semibold text-[#005EB8]">Kaizen Continuous Improvement</span>
            </div>
            <p className="text-slate-500 max-w-md leading-relaxed">
              Hệ thống thu thập và tôn vinh sáng kiến cải tiến Kaizen dành cho toàn thể người lao động tại các nhà máy Nefab Việt Nam. Mỗi ý tưởng nhỏ hôm nay là bước tiến lớn cho năng suất và an toàn ngày mai.
            </p>
          </div>

          <div>
            <span className="font-semibold text-slate-800 block mb-2">Cổng thông tin</span>
            <ul className="space-y-1.5">
              <li>
                <Link to="/submit" className="hover:text-[#005EB8] transition-colors">
                  Đăng ký Kaizen mới
                </Link>
              </li>
              <li>
                <Link to="/track" className="hover:text-[#005EB8] transition-colors">
                  Tra cứu tiến độ xử lý
                </Link>
              </li>
              <li className="pt-1">
                {isReviewer ? (
                  <button
                    onClick={logout}
                    className="inline-flex items-center gap-1.5 text-slate-600 hover:text-red-600 font-medium transition-colors"
                  >
                    <Shield className="w-3 h-3 text-[#005EB8]" />
                    Đăng xuất ({user?.userDetails})
                  </button>
                ) : (
                  <button
                    onClick={login}
                    className="inline-flex items-center gap-1.5 text-[#005EB8] hover:underline font-medium"
                    title="Đăng nhập tài khoản Microsoft Entra ID công ty"
                  >
                    <Shield className="w-3 h-3" />
                    Đăng nhập người thẩm định
                  </button>
                )}
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-400">
          <p>© {new Date().getFullYear()} Nefab Group. Bảo lưu mọi quyền.</p>
          <div className="flex items-center gap-2">
            <HeartHandshake className="w-3.5 h-3.5 text-slate-400" />
            <span>Tiết kiệm tài nguyên · Bảo vệ môi trường · Bền vững</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
