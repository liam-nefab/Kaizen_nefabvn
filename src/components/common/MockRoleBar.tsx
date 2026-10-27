import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { AppRole } from '../../types/kaizen';
import { mockClientInstance } from '../../services/api';
import { useToast } from './Toast';
import { ShieldCheck, UserCheck, Users, RotateCcw } from 'lucide-react';

export const MockRoleBar: React.FC = () => {
  const { role, setMockRole, isMock } = useAuth();
  const { success } = useToast();

  if (!isMock) return null;

  const handleRoleChange = (newRole: AppRole) => {
    setMockRole(newRole);
    const label =
      newRole === 'admin'
        ? 'Quản trị viên (Admin)'
        : newRole === 'reviewer'
        ? 'Người thẩm định (Reviewer)'
        : 'Công nhân (Public)';
    success(`Đã chuyển vai trò sang: ${label}`);
  };

  const handleReset = () => {
    mockClientInstance.resetToDefault();
    success('Đã khôi phục 30 bản ghi Kaizen mẫu ban đầu');
    window.location.reload();
  };

  return (
    <aside aria-label="Demo Role Switcher" className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 bg-white/95 backdrop-blur-md border border-slate-300 shadow-xl rounded-full px-4 py-2 flex items-center gap-2 sm:gap-3 text-xs max-w-[95vw] overflow-x-auto">
      <div className="flex items-center gap-1.5 text-slate-500 font-medium whitespace-nowrap pl-1">
        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        <span className="hidden sm:inline">Chế độ Demo (Giả lập Entra ID):</span>
      </div>

      <div className="flex items-center bg-slate-100 p-0.5 rounded-full">
        <button
          onClick={() => handleRoleChange('public')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-medium transition-all ${
            role === 'public'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          title="Công nhân gửi ý tưởng qua link công khai, không cần đăng nhập"
        >
          <Users className="w-3.5 h-3.5 text-slate-500" />
          <span className="whitespace-nowrap">Công nhân</span>
        </button>

        <button
          onClick={() => handleRoleChange('reviewer')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-medium transition-all ${
            role === 'reviewer'
              ? 'bg-[#005EB8] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          title="Đăng nhập tài khoản Microsoft Entra ID - Thẩm định ý tưởng"
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span className="whitespace-nowrap">Reviewer</span>
        </button>

        <button
          onClick={() => handleRoleChange('admin')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-medium transition-all ${
            role === 'admin'
              ? 'bg-[#005EB8] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          title="Quản trị viên Entra ID - Thẩm định, Xóa, Xuất toàn bộ dữ liệu"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="whitespace-nowrap">Admin</span>
        </button>
      </div>

      <div className="h-4 w-px bg-slate-300 mx-0.5 hidden sm:block" />

      <button
        onClick={handleReset}
        className="text-slate-500 hover:text-slate-800 p-1 rounded-full hover:bg-slate-100 transition-colors flex items-center gap-1 whitespace-nowrap"
        title="Khôi phục lại 30 dữ liệu mẫu"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        <span className="hidden md:inline">Đặt lại dữ liệu</span>
      </button>
    </aside>
  );
};
