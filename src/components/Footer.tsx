import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full py-5 text-center text-xs text-slate-400 dark:text-slate-500 border-t border-slate-200/60 dark:border-slate-800/80 mt-auto select-none">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="font-medium">
          © 2026 <strong className="text-slate-700 dark:text-slate-300 font-bold">Hồng Bích Trâm</strong> · Lịch Báo Giảng
        </p>
        <p className="text-[11px] text-slate-400 dark:text-slate-600">
          Ứng dụng Lịch báo giảng dành cho giáo viên tiểu học
        </p>
      </div>
    </footer>
  );
};
