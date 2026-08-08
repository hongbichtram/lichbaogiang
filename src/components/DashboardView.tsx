import React from 'react';
import { TeacherProfile } from '../types';

interface DashboardViewProps {
  teacher: TeacherProfile;
  schedules?: any[];
  currentWeek?: number;
  setCurrentWeek?: (week: number) => void;
  onNavigate?: (tab: string) => void;
  onSelectLesson?: (item: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ teacher }) => {
  return (
    <div className="min-h-[65vh] flex flex-col items-center justify-center text-center px-4 py-8 animate-fadeIn select-none">
      <div className="max-w-xl w-full space-y-6">
        
        {/* User Greeting Tag */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 text-xs font-semibold">
          <span>Xin chào, <strong className="text-slate-900 dark:text-white font-bold">{teacher.fullName || 'Hồng Bích Trâm'}</strong>!</span>
        </div>

        {/* Central Icon */}
        <div className="text-5xl sm:text-6xl pt-2 pb-1 select-none">
          📅
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
          LỊCH BÁO GIẢNG
        </h1>

        {/* Description */}
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-md mx-auto font-normal">
          Công cụ hỗ trợ giáo viên lập, quản lý và xuất lịch báo giảng theo thời khóa biểu và phân phối chương trình.
        </p>

        {/* Footer Instruction Note */}
        <div className="pt-2">
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium tracking-wide">
            Chọn chức năng trên thanh menu để bắt đầu.
          </p>
        </div>

      </div>
    </div>
  );
};
