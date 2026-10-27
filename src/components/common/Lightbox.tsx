import React from 'react';
import { X, ZoomIn } from 'lucide-react';

interface LightboxProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title: string;
  subtitle?: string;
}

export const Lightbox: React.FC<LightboxProps> = ({
  isOpen,
  onClose,
  imageUrl,
  title,
  subtitle,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 sm:p-6"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50">
          <div>
            <h3 className="font-semibold text-slate-900 text-sm sm:text-base">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
            aria-label="Đóng xem ảnh"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Image content */}
        <div className="relative flex-1 overflow-auto bg-slate-950 flex items-center justify-center p-2 min-h-[300px]">
          <img
            src={imageUrl}
            alt={title}
            className="max-h-[75vh] w-auto max-w-full object-contain rounded"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 bg-white border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <ZoomIn className="w-4 h-4 text-[#005EB8]" />
            Nhấn ra ngoài hoặc bấm nút [X] để đóng
          </span>
          <a
            href={imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#005EB8] hover:underline font-medium"
          >
            Mở ảnh gốc
          </a>
        </div>
      </div>
    </div>
  );
};
