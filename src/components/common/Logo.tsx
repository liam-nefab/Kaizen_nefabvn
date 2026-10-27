import React from 'react';
import { Link } from 'react-router-dom';

interface LogoProps {
  className?: string;
  showSubtitle?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = '', showSubtitle = true }) => {
  return (
    <Link to="/" className={`inline-flex items-center gap-3 group ${className}`}>
      {/* Logo Nefab chính thức - Biểu trưng nhận diện thương hiệu Nefab */}
      <div className="h-9 px-2.5 rounded-lg bg-[#005EB8] text-white flex items-center justify-center font-bold shadow-xs transition-transform group-hover:scale-105 shrink-0">
        <svg
          className="h-4 w-auto"
          viewBox="0 0 102 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="Nefab Logo"
        >
          {/* N */}
          <path
            d="M3 2H8.5L16.5 15.5V2H21V22H15.5L7.5 8.5V22H3V2Z"
            fill="white"
          />
          {/* E */}
          <path
            d="M26 2H39V6H31V10H37.5V14H31V18H39V22H26V2Z"
            fill="white"
          />
          {/* F */}
          <path
            d="M44 2H57V6H49V10H56V14H49V22H44V2Z"
            fill="white"
          />
          {/* A */}
          <path
            d="M59 22L67.5 2H73.5L82 22H76.8L75 17.5H66L64.2 22H59ZM67.5 13.5H73.5L70.5 6L67.5 13.5Z"
            fill="white"
          />
          {/* B */}
          <path
            d="M87 2H96C99 2 101.5 3.5 101.5 6.5C101.5 8.5 100.2 10 98.5 10.8C100.8 11.5 102.2 13.2 102.2 15.8C102.2 19.5 99 22 95 22H87V2ZM91.5 6V10H95.5C96.8 10 97.8 9.2 97.8 8C97.8 6.8 96.8 6 95.5 6H91.5ZM91.5 14V18H95.5C97 18 98 17.2 98 16C98 14.8 97 14 95.5 14H91.5Z"
            fill="white"
          />
        </svg>
      </div>

      <div className="h-6 w-px bg-slate-200 hidden sm:block shrink-0" />

      {/* Dòng chữ Kaizen Portal với cùng cài đặt chữ */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 leading-none">
          <span className="font-extrabold text-xl tracking-wider text-[#005EB8] font-sans">
            Kaizen
          </span>
          <span className="text-xs uppercase font-bold tracking-widest text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
            Portal
          </span>
        </div>
        {showSubtitle && (
          <span className="text-[10px] text-slate-400 font-medium tracking-tight mt-0.5 hidden sm:inline">
            Cổng sáng kiến cải tiến nhà máy
          </span>
        )}
      </div>
    </Link>
  );
};
