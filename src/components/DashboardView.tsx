import React, { useState, useMemo } from 'react';
import { ArrowRight, CalendarDays, BookOpen, CalendarCheck2, Clock } from 'lucide-react';
import { TeacherProfile, ScheduleItem } from '../types';
import { getNormalizedSession, getNormalizedPeriod } from '../utils/classUtils';
import { 
  formatDateDDMMYYYY, 
  getActualDayDate, 
  loadCustomWeekDatesMap, 
  isSameDay 
} from '../utils/dateWeekUtils';

interface DashboardViewProps {
  teacher: TeacherProfile;
  schedules?: ScheduleItem[];
  currentWeek?: number;
  setCurrentWeek?: (week: number) => void;
  onNavigate?: (tab: string) => void;
  onSelectLesson?: (item: ScheduleItem) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  teacher,
  schedules = [],
  onNavigate,
  onSelectLesson,
}) => {
  // Today's real system date state
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());

  // Format date in Vietnamese e.g. "Thứ Hai, 10/08/2026"
  const dateFormatted = useMemo(() => {
    const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const dayName = dayNames[selectedDate.getDay()];
    const dateStr = formatDateDDMMYYYY(selectedDate);
    return {
      dayName,
      dateStr,
      fullHeader: `${dayName}, ${dateStr}`,
    };
  }, [selectedDate]);

  // Load latest custom week dates map from system
  const customMap = useMemo(() => loadCustomWeekDatesMap(), []);

  // Filter & sort today's teaching items directly from existing schedules & custom week dates
  const todayItems = useMemo(() => {
    const targetDateStr = dateFormatted.dateStr;

    // Filter schedule items that fall on targetDateStr according to the actual system week dates
    const filtered = schedules.filter((item) => {
      const itemActualDate = getActualDayDate(
        item.weekNumber,
        item.dayOfWeek,
        teacher?.academicYear || '2025-2026',
        customMap
      );
      return itemActualDate === targetDateStr;
    });

    // Sort items according to rules:
    // Sáng → Tiết 1 → Tiết 2 → Tiết 3 → Tiết 4 → Chiều → Tiết 1 → Tiết 2 → Tiết 3
    return filtered.sort((a, b) => {
      const sessA = getNormalizedSession(a);
      const sessB = getNormalizedSession(b);

      if (sessA !== sessB) {
        return sessA === 'Sáng' ? -1 : 1;
      }

      const pA = getNormalizedPeriod(a);
      const pB = getNormalizedPeriod(b);
      return pA - pB;
    });
  }, [schedules, dateFormatted.dateStr, teacher?.academicYear, customMap]);

  const isToday = isSameDay(selectedDate, new Date());

  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-4 py-4 sm:py-8 space-y-6 animate-fadeIn">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
              LỊCH DẠY HÔM NAY
            </h1>
            {!isToday && (
              <button
                onClick={() => setSelectedDate(new Date())}
                className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-800 hover:bg-blue-200 transition-colors"
                title="Quay lại ngày hôm nay"
              >
                Hôm nay
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <CalendarDays className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <p className="text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-300">
              {dateFormatted.fullHeader}
            </p>
            {/* Optional subtle date switcher for previewing other dates */}
            <input
              type="date"
              value={`${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`}
              onChange={(e) => {
                if (e.target.value) {
                  const [y, m, d] = e.target.value.split('-').map(Number);
                  setSelectedDate(new Date(y, m - 1, d));
                }
              }}
              className="w-6 h-6 opacity-40 hover:opacity-100 cursor-pointer bg-transparent border-0 p-0 text-transparent"
              title="Chọn ngày xem lịch dạy"
            />
          </div>
        </div>

        {/* View Timetable Action Button */}
        <div>
          <button
            onClick={() => onNavigate?.('timetable')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition-all group"
          >
            <span>Xem thời khóa biểu</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* Main Content: Lessons Table or Empty Message */}
      {todayItems.length > 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          {/* Desktop & Tablet Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  <th className="py-3.5 px-4 text-center w-28">Buổi</th>
                  <th className="py-3.5 px-4 text-center w-28">Tiết</th>
                  <th className="py-3.5 px-4 text-center w-28">Lớp</th>
                  <th className="py-3.5 px-4">Tên bài dạy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
                {todayItems.map((item) => {
                  const session = getNormalizedSession(item);
                  const period = getNormalizedPeriod(item);

                  return (
                    <tr
                      key={item.id}
                      onClick={() => onSelectLesson?.(item)}
                      className="hover:bg-blue-50/50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group"
                    >
                      {/* Buổi */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${
                            session === 'Sáng'
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60'
                              : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800/60'
                          }`}
                        >
                          {session}
                        </span>
                      </td>

                      {/* Tiết */}
                      <td className="py-3.5 px-4 text-center font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        Tiết {period}
                      </td>

                      {/* Lớp */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-extrabold text-xs">
                          {item.className}
                        </span>
                      </td>

                      {/* Tên bài dạy */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {item.lessonTitle || 'Chưa cập nhật tên bài'}
                        </div>
                        {item.ppctPeriod && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1 font-medium">
                            <BookOpen className="w-3 h-3 text-slate-400" />
                            <span>Tiết PPCT: {item.ppctPeriod}</span>
                            {item.subject && <span>• {item.subject}</span>}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile View Layout */}
          <div className="block sm:hidden divide-y divide-slate-100 dark:divide-slate-800">
            {todayItems.map((item) => {
              const session = getNormalizedSession(item);
              const period = getNormalizedPeriod(item);

              return (
                <div
                  key={item.id}
                  onClick={() => onSelectLesson?.(item)}
                  className="p-4 space-y-2 active:bg-slate-50 dark:active:bg-slate-800 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                          session === 'Sáng'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200'
                            : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200'
                        }`}
                      >
                        {session}
                      </span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Tiết {period}
                      </span>
                    </div>

                    <span className="px-2.5 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-extrabold text-xs border border-blue-200 dark:border-blue-800">
                      Lớp {item.className}
                    </span>
                  </div>

                  <div className="font-semibold text-sm text-slate-900 dark:text-white pt-0.5">
                    {item.lessonTitle || 'Chưa cập nhật tên bài'}
                  </div>

                  {item.ppctPeriod && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
                      <span>Tiết PPCT: {item.ppctPeriod}</span>
                      {item.subject && <span>• {item.subject}</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Minimal Empty State when no lessons today */
        <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-6 sm:p-10 border border-slate-200/80 dark:border-slate-800 text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
            <CalendarCheck2 className="w-6 h-6" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">
            Hôm nay không có tiết dạy.
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
            Chúc thầy/cô một ngày làm việc hiệu quả!
          </p>
        </div>
      )}
    </div>
  );
};

