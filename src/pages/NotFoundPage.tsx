import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, Home, Send } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="max-w-lg mx-auto my-16 px-4 text-center">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 sm:p-10">
        <div className="w-16 h-16 rounded-2xl bg-[#E8F1FB] text-[#005EB8] flex items-center justify-center mx-auto mb-4">
          <FileQuestion className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">404</h1>
        <h2 className="text-lg font-bold text-slate-800 mb-2">Không tìm thấy trang yêu cầu</h2>
        <p className="text-xs text-slate-500 mb-6 leading-relaxed">
          Đường dẫn bạn vừa truy cập không tồn tại hoặc đã được thay đổi cấu trúc. Hãy sử dụng các liên kết bên dưới để tiếp tục.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#005EB8] hover:bg-[#00488F] text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Về trang chủ</span>
          </Link>
          <Link
            to="/submit"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl text-xs font-medium transition-colors"
          >
            <Send className="w-4 h-4" />
            <span>Gửi ý tưởng Kaizen</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
