import React from 'react';
import { Link } from 'react-router-dom';
import nefabLogo from '../../assets/images/Logo_Nefab_-_Blue_d96c6bd5.png';

interface LogoProps {
  className?: string;
  showSubtitle?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = '', showSubtitle = true }) => {
  return (
    <Link to="/" className={`inline-flex items-center gap-3 group ${className}`}>
      {/* Logo Nefab chính thức theo hình ảnh đính kèm */}
      <img
        src={nefabLogo}
        alt="Nefab"
        className="h-7 sm:h-8 w-auto object-contain transition-transform group-hover:scale-105 shrink-0"
        loading="eager"
      />

      <div className="h-6 w-px bg-slate-200 hidden sm:block shrink-0" />

      {/* Dòng chữ Kaizen Portal với cùng cài đặt chữ */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 leading-none">
          <span className="font-extrabold text-xl tracking-wider text-[#005EB8]">
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
