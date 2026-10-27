import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Logo } from './Logo';
import { useAuth } from '../../context/AuthContext';
import { PlusCircle, LogIn, LogOut, Menu, X, Shield, Search } from 'lucide-react';

export const Header: React.FC = () => {
  const { user, isReviewer, isAdmin, login, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `whitespace-nowrap shrink-0 text-sm font-medium transition-colors ${
      isActive
        ? 'text-[#005EB8] font-semibold border-b-2 border-[#005EB8] pb-1'
        : 'text-slate-600 hover:text-slate-900'
    }`;

  const mobileNavClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-[#E8F1FB] text-[#005EB8] font-semibold'
        : 'text-slate-700 hover:bg-slate-100'
    }`;

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Brand Wordmark / Logo */}
          <div className="shrink-0">
            <Logo />
          </div>

          {/* Zone 2: Clean 4-5 Navigation links */}
          <nav className="hidden md:flex items-center gap-7">
            <NavLink to="/" end className={navClass}>
              Trang chủ
            </NavLink>
            <NavLink to="/submit" className={navClass}>
              Gửi ý tưởng
            </NavLink>
            <NavLink to="/track" className={navClass}>
              Tra cứu
            </NavLink>
            <NavLink to="/review" className={navClass}>
              Thẩm định
            </NavLink>
            <NavLink to="/dashboard" className={navClass}>
              Thống kê
            </NavLink>
          </nav>

          {/* Zone 3: Primary Action & Auth */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            {isReviewer ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
                  <Shield className="w-3.5 h-3.5 text-[#005EB8]" />
                  <span className="font-semibold text-slate-800">
                    {isAdmin ? 'Admin' : 'Reviewer'}
                  </span>
                  <span className="text-slate-400">·</span>
                  <span className="max-w-[140px] truncate" title={user?.userDetails}>
                    {user?.userDetails || 'Nội bộ'}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Đăng xuất Entra ID"
                  aria-label="Đăng xuất"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={login}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg transition-colors whitespace-nowrap"
                title="Dành cho người thẩm định nhà máy (Microsoft Entra ID)"
              >
                <LogIn className="w-3.5 h-3.5 text-slate-500" />
                <span>Đăng nhập nội bộ</span>
              </button>
            )}

            <button
              onClick={() => navigate('/submit')}
              className="inline-flex items-center gap-2 bg-[#005EB8] hover:bg-[#00488F] text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-xs transition-colors whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Gửi Kaizen</span>
            </button>
          </div>

          {/* Mobile hamburger button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => navigate('/track')}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              aria-label="Tra cứu ý tưởng"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              aria-label="Mở menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-2 shadow-lg">
          <NavLink
            to="/"
            end
            onClick={() => setMobileMenuOpen(false)}
            className={mobileNavClass}
          >
            Trang chủ
          </NavLink>
          <NavLink
            to="/submit"
            onClick={() => setMobileMenuOpen(false)}
            className={mobileNavClass}
          >
            <PlusCircle className="w-4 h-4 text-[#005EB8]" />
            Gửi ý tưởng Kaizen
          </NavLink>
          <NavLink
            to="/track"
            onClick={() => setMobileMenuOpen(false)}
            className={mobileNavClass}
          >
            <Search className="w-4 h-4" />
            Tra cứu trạng thái
          </NavLink>
          <NavLink
            to="/review"
            onClick={() => setMobileMenuOpen(false)}
            className={mobileNavClass}
          >
            <Shield className="w-4 h-4 text-[#005EB8]" />
            Danh sách thẩm định
          </NavLink>
          <NavLink
            to="/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className={mobileNavClass}
          >
            Dashboard thống kê
          </NavLink>

          <div className="pt-3 border-t border-slate-100">
            {isReviewer ? (
              <div className="space-y-2">
                <div className="px-3 py-2 bg-slate-50 rounded-lg text-xs text-slate-600 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-900 block">
                      {isAdmin ? 'Quản trị viên (Admin)' : 'Người thẩm định (Reviewer)'}
                    </span>
                    <span className="text-slate-500 truncate block">
                      {user?.userDetails}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  Đăng xuất Entra ID
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  login();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                <LogIn className="w-4 h-4" />
                Đăng nhập (Dành cho Reviewer / Admin)
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
