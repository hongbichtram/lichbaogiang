import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full py-5 text-center text-xs text-slate-400 dark:text-slate-500 border-t border-slate-200/60 dark:border-slate-800/80 mt-auto select-none">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5 text-xs sm:text-sm whitespace-nowrap">
          <span className="text-slate-500 dark:text-slate-400 font-normal">Tác giả:</span>
          <span className="text-slate-800 dark:text-slate-200 font-bold tracking-wide">Hồng Bích Trâm</span>
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
          © {new Date().getFullYear()} Lịch Báo Giảng · Ứng dụng dành cho giáo viên
        </p>
      </div>
    </footer>
  );
};
