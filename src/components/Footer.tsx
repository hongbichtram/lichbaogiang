import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full py-4 text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400 border-t border-slate-200/70 dark:border-slate-800/80 mt-auto select-none bg-slate-50/50 dark:bg-slate-950/30 backdrop-blur-xs">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-center text-center">
        <p className="tracking-wide">
          © 2026 <span className="font-semibold text-slate-700 dark:text-slate-200">LỊCH BÁO GIẢNG TIỂU HỌC</span>
          <span className="mx-2 text-slate-400 dark:text-slate-500">·</span>
          Tác giả: <span className="font-bold text-indigo-600 dark:text-indigo-400">Hồng Bích Trâm</span>
        </p>
      </div>
    </footer>
  );
};
