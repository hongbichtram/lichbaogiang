import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X, Check } from 'lucide-react';
import { 
  getWeekStartEndDates, 
  formatDateDDMMYYYY, 
  getWeekNumberFromDate, 
  isSameDay,
  getWeekRangeFormatted,
  loadCustomWeekDatesMap
} from '../utils/dateWeekUtils';
import { ScheduleItem } from '../types';

interface DatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentWeek: number;
  onSelectWeek: (weekNum: number) => void;
  academicYear?: string;
  schedules?: ScheduleItem[];
}

export const DatePickerModal: React.FC<DatePickerModalProps> = ({
  isOpen,
  onClose,
  currentWeek,
  onSelectWeek,
  academicYear = '2025-2026',
  schedules = [],
}) => {
  if (!isOpen) return null;

  const customMap = loadCustomWeekDatesMap();

  // Compute the current active week's Monday and Friday
  const activeWeekDates = getWeekStartEndDates(currentWeek, academicYear);

  // Default displayed month & year based on current active week's Monday
  const [viewDate, setViewDate] = useState<Date>(() => new Date(activeWeekDates.monday));

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth(); // 0..11

  // Handle month navigation
  const handlePrevMonth = () => {
    setViewDate(new Date(viewYear, viewMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewYear, viewMonth + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
    const todayWeek = getWeekNumberFromDate(today, academicYear);
    onSelectWeek(todayWeek);
    onClose();
  };

  // Generate matrix of dates for viewMonth
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
  const lastDayOfMonth = new Date(viewYear, viewMonth + 1, 0);

  // Day of week for 1st of month (0 = Sun, 1 = Mon...)
  const firstDayIndex = firstDayOfMonth.getDay();
  // We want Monday = 0, Tuesday = 1 ... Sunday = 6
  const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

  const calendarDays: { date: Date; isCurrentMonth: boolean }[] = [];

  // Previous month padding days
  for (let i = startOffset; i > 0; i--) {
    const d = new Date(viewYear, viewMonth, 1 - i);
    calendarDays.push({ date: d, isCurrentMonth: false });
  }

  // Current month days
  for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
    const d = new Date(viewYear, viewMonth, i);
    calendarDays.push({ date: d, isCurrentMonth: true });
  }

  // Next month padding days to complete grid (multiples of 7)
  const remaining = (7 - (calendarDays.length % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(viewYear, viewMonth + 1, i);
    calendarDays.push({ date: d, isCurrentMonth: false });
  }

  // Helper to check if a date falls within active week (Monday to Sunday)
  const isDateInActiveWeek = (d: Date): boolean => {
    const mon = new Date(activeWeekDates.monday);
    mon.setHours(0, 0, 0, 0);
    const sun = new Date(activeWeekDates.sunday);
    sun.setHours(23, 59, 59, 999);
    return d.getTime() >= mon.getTime() && d.getTime() <= sun.getTime();
  };

  // Check schedules on a specific date for status indicators
  const getDateStatusIndicator = (d: Date) => {
    const dateStr = formatDateDDMMYYYY(d);
    const dayItems = schedules.filter((s) => s.date === dateStr);
    
    if (dayItems.length === 0) return null;

    const hasHoliday = dayItems.some((s) => s.status === 'off' || s.notes?.includes('Nghỉ'));
    const hasRescheduled = dayItems.some((s) => s.status === 'rescheduled' || s.notes?.includes('Dạy bù'));

    if (hasHoliday) return <span className="w-1.5 h-1.5 rounded-full bg-rose-500" title="Nghỉ lễ" />;
    if (hasRescheduled) return <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Dạy bù" />;
    return <span className="w-1.5 h-1.5 rounded-full bg-blue-500" title="Có tiết dạy" />;
  };

  const handleSelectDate = (date: Date) => {
    const weekNum = getWeekNumberFromDate(date, academicYear);
    onSelectWeek(weekNum);
    onClose();
  };

  const todayDate = new Date();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl border border-indigo-500/20 overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-indigo-500/20">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-600/30 rounded-xl border border-indigo-400/30 text-indigo-300">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-wider uppercase bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                CHỌN NGÀY VÀ TUẦN BÁO GIẢNG
              </h3>
              <p className="text-[11px] text-indigo-300/80 font-medium">
                Chọn bất kỳ ngày nào để hệ thống tự xác định tuần
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Calendar Body */}
        <div className="p-4 sm:p-5 space-y-4 bg-slate-50 dark:bg-slate-900">
          
          {/* Active Week Banner */}
          <div className="bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-purple-600/10 border border-indigo-500/30 p-3 rounded-2xl flex items-center justify-between text-slate-900 dark:text-white">
            <div>
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest block">
                ĐANG CHỌN
              </span>
              <span className="text-sm font-black text-indigo-950 dark:text-white">
                TUẦN {currentWeek}
              </span>
              <span className="text-xs text-indigo-600 dark:text-indigo-300 font-bold ml-2">
                ({getWeekRangeFormatted(currentWeek, academicYear, customMap)})
              </span>
            </div>
            <button
              onClick={handleToday}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              Hôm nay
            </button>
          </div>

          {/* Month Navigation Row */}
          <div className="flex items-center justify-between px-1">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-300 transition-colors flex items-center space-x-1 text-xs font-bold"
              title="Tháng trước"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Tháng trước</span>
            </button>

            <span className="text-sm font-extrabold uppercase text-slate-900 dark:text-white tracking-wider">
              THÁNG {viewMonth + 1} / {viewYear}
            </span>

            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-300 transition-colors flex items-center space-x-1 text-xs font-bold"
              title="Tháng sau"
            >
              <span className="hidden sm:inline">Tháng sau</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Day Headers (T2, T3, T4, T5, T6, T7, CN) */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-slate-500 dark:text-slate-400 py-1 border-b border-slate-200 dark:border-slate-800">
            <span>T2</span>
            <span>T3</span>
            <span>T4</span>
            <span>T5</span>
            <span>T6</span>
            <span className="text-indigo-600 dark:text-indigo-400">T7</span>
            <span className="text-rose-500">CN</span>
          </div>

          {/* Grid of Days */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map(({ date, isCurrentMonth }, idx) => {
              const inActiveWeek = isDateInActiveWeek(date);
              const isToday = isSameDay(date, todayDate);
              const indicator = getDateStatusIndicator(date);

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectDate(date)}
                  className={`relative flex flex-col items-center justify-center h-10 rounded-xl transition-all ${
                    !isCurrentMonth
                      ? 'text-slate-300 dark:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800/40'
                      : inActiveWeek
                      ? 'bg-indigo-600/20 text-indigo-900 dark:text-indigo-100 font-black border border-indigo-500/40 shadow-2xs'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-800 font-medium'
                  } ${isToday ? 'ring-2 ring-indigo-500 ring-offset-1 dark:ring-offset-slate-900 font-black' : ''}`}
                >
                  <span className="text-xs">{date.getDate()}</span>
                  
                  {/* Status indicator dot */}
                  {indicator ? (
                    <div className="absolute bottom-1">{indicator}</div>
                  ) : inActiveWeek ? (
                    <div className="w-1 h-1 rounded-full bg-indigo-500 absolute bottom-1" />
                  ) : null}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center space-x-4 text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>Có tiết</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Nghỉ lễ</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Dạy bù</span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-slate-100 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 text-center">
          <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
            * Chọn bất kỳ ngày nào để xem Lịch báo giảng của tuần đó.
          </p>
        </div>

      </div>
    </div>
  );
};
