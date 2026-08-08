import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  BookOpen, 
  Printer, 
  FileSpreadsheet, 
  FileText, 
  RefreshCw, 
  Save,
  RotateCcw,
  RotateCw,
  Edit2,
  Calendar,
  ChevronDown
} from 'lucide-react';
import { ScheduleItem, ScheduleFilter, LessonStatus, PPCTCurriculum, TeacherProfile } from '../types';
import { LessonDrawer } from './LessonDrawer';
import { AddLessonModal } from './AddLessonModal';
import { PrintPreviewModal } from './PrintPreviewModal';
import { DatePickerModal } from './DatePickerModal';
import { EditWeekDateModal } from './EditWeekDateModal';
import { getWeekRangeFormatted, loadCustomWeekDatesMap } from '../utils/dateWeekUtils';
import { getWeekDayDate } from '../utils/exportUtils';
import { formatTableSessionPeriod, getNormalizedSession, getNormalizedPeriod } from '../utils/classUtils';

interface ScheduleViewProps {
  teacher?: TeacherProfile;
  schedules: ScheduleItem[];
  curriculums?: PPCTCurriculum[];
  teacherAssignedClasses?: string[];
  currentWeek: number;
  setCurrentWeek: (week: number) => void;
  onSelectLesson: (item: ScheduleItem) => void;
  onAddLesson: (dayOfWeek: 'Thứ 2' | 'Thứ 3' | 'Thứ 4' | 'Thứ 5' | 'Thứ 6', period: number) => void;
  onAddScheduleItem?: (newItem: ScheduleItem) => void;
  onStatusChange: (id: string, newStatus: LessonStatus) => void;
  onOpenRescheduleModal: (item: ScheduleItem) => void;
  onUpdateScheduleItem?: (item: ScheduleItem) => void;
  onDeleteScheduleItem?: (itemId: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onNavigate?: (tab: string) => void;
}

const DAYS_OF_WEEK: Array<'Thứ 2' | 'Thứ 3' | 'Thứ 4' | 'Thứ 5' | 'Thứ 6'> = [
  'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6'
];

const DEFAULT_ASSIGNED_CLASSES = ['3A1', '3A2', '3A3', '4A1', '4A2', '4A3', '5A1', '5A2', '5A3'];

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  teacher,
  schedules,
  curriculums = [],
  teacherAssignedClasses = DEFAULT_ASSIGNED_CLASSES,
  currentWeek,
  setCurrentWeek,
  onSelectLesson,
  onAddLesson,
  onAddScheduleItem,
  onStatusChange,
  onOpenRescheduleModal,
  onUpdateScheduleItem,
  onDeleteScheduleItem,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onNavigate,
}) => {
  // Filter state
  const [filter, setFilter] = useState<ScheduleFilter>({
    weekNumber: currentWeek,
    month: 'all',
    semester: 'all',
    academicYear: teacher?.academicYear || '2025-2026',
    grade: 'all',
    className: 'all',
    subject: 'all',
    status: 'all',
    searchQuery: '',
  });

  // Drawer / Detail state
  const [selectedScheduleItem, setSelectedScheduleItem] = useState<ScheduleItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isEditWeekDateOpen, setIsEditWeekDateOpen] = useState(false);
  const [customWeekDatesMap, setCustomWeekDatesMap] = useState(() => loadCustomWeekDatesMap());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Add Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalInitialDay, setAddModalInitialDay] = useState<'Thứ 2' | 'Thứ 3' | 'Thứ 4' | 'Thứ 5' | 'Thứ 6'>('Thứ 2');
  const [addModalInitialPeriod, setAddModalInitialPeriod] = useState<number>(1);

  const handleOpenAddModal = (day: 'Thứ 2' | 'Thứ 3' | 'Thứ 4' | 'Thứ 5' | 'Thứ 6' = 'Thứ 2', period: number = 1) => {
    setAddModalInitialDay(day);
    setAddModalInitialPeriod(period);
    setIsAddModalOpen(true);
  };

  const handleRowClick = (item: ScheduleItem) => {
    setSelectedScheduleItem(item);
    setIsDrawerOpen(true);
  };

  // Combine teacher assigned classes with any existing classes in schedule
  const assignedClassList = useMemo(() => {
    const combined = new Set([...teacherAssignedClasses, ...schedules.map(s => s.className)]);
    return Array.from(combined).filter(Boolean).sort();
  }, [teacherAssignedClasses, schedules]);

  // Filter schedules for current week
  const filteredSchedules = useMemo(() => {
    return schedules.filter(item => {
      if (item.weekNumber !== currentWeek) return false;
      if (filter.grade !== 'all' && item.grade !== filter.grade) return false;
      if (filter.className !== 'all' && item.className !== filter.className) return false;
      if (filter.subject !== 'all' && item.subject !== filter.subject) return false;
      if (filter.status !== 'all' && item.status !== filter.status) return false;
      if (filter.searchQuery) {
        const q = filter.searchQuery.toLowerCase();
        const matchTitle = item.lessonTitle?.toLowerCase().includes(q);
        const matchClass = item.className?.toLowerCase().includes(q);
        const matchSubject = item.subject?.toLowerCase().includes(q);
        if (!matchTitle && !matchClass && !matchSubject) return false;
      }
      return true;
    });
  }, [schedules, currentWeek, filter]);

  // Available options for dropdowns
  const availableClasses = Array.from(new Set(schedules.map(s => s.className))).filter(Boolean);
  const availableSubjects = Array.from(new Set(schedules.map(s => s.subject))).filter(Boolean);

  return (
    <div className="space-y-4 pb-12">
      {/* Top Controller & Filter Toolbar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-3">
        
        {/* Row 1: Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-700/80">
          <button
            onClick={() => handleOpenAddModal('Thứ 2', 1)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold shadow-sm shadow-blue-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm tiết dạy</span>
          </button>

          <button
            onClick={() => onNavigate && onNavigate('ppct')}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            <span>Đồng bộ PPCT</span>
          </button>

          <button
            onClick={() => setIsPrintPreviewOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>🖨️ Xem & In</span>
          </button>

          <button
            onClick={() => setFilter({ weekNumber: currentWeek, month: 'all', semester: 'all', academicYear: teacher?.academicYear || '2025-2026', grade: 'all', className: 'all', subject: 'all', status: 'all', searchQuery: '' })}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl text-xs font-bold transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Làm mới</span>
          </button>

          <button
            onClick={() => alert('Đã tự động lưu toàn bộ dữ liệu lịch báo giảng!')}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-colors ml-auto"
          >
            <Save className="w-4 h-4" />
            <span>Lưu</span>
          </button>
        </div>

        {/* Row 2: Week Selector + Search + Undo/Redo */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Calendar Week Selector */}
          <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-900 p-1.5 rounded-2xl border border-indigo-500/20 shadow-2xs">
            <button
              onClick={() => setCurrentWeek(Math.max(1, currentWeek - 1))}
              className="px-2.5 py-2 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 transition-colors flex items-center space-x-1"
              title="Tuần trước"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Tuần trước</span>
            </button>

            <button
              onClick={() => setIsDatePickerOpen(true)}
              className="flex items-center space-x-2 px-3.5 py-1.5 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-purple-600/10 hover:from-blue-600/20 hover:to-purple-600/20 border border-indigo-500/30 rounded-xl transition-all text-left"
            >
              <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    TUẦN {currentWeek}
                  </span>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-300 font-extrabold bg-indigo-500/15 px-1.5 py-0.5 rounded-md">
                    {getWeekRangeFormatted(currentWeek, teacher?.academicYear || '2025-2026', customWeekDatesMap)}
                  </span>
                </div>
                <div className="text-[10px] text-indigo-500 dark:text-indigo-400 font-bold flex items-center space-x-0.5">
                  <span>Chọn ngày ▼</span>
                </div>
              </div>
            </button>

            <button
              onClick={() => setIsEditWeekDateOpen(true)}
              className="px-2.5 py-2 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold border border-indigo-200 dark:border-slate-700 transition-colors flex items-center space-x-1 shrink-0"
              title="Chỉnh sửa ngày thực tế của tuần"
            >
              <Edit2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="hidden sm:inline">Chỉnh ngày</span>
            </button>

            <button
              onClick={() => setCurrentWeek(Math.min(52, currentWeek + 1))}
              className="px-2.5 py-2 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 transition-colors flex items-center space-x-1"
              title="Tuần sau"
            >
              <span className="hidden sm:inline">Tuần sau</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm tên bài, lớp học, môn..."
              value={filter.searchQuery}
              onChange={(e) => setFilter({ ...filter, searchQuery: e.target.value })}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Undo / Redo */}
          <div className="flex items-center space-x-1">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className={`p-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1 border transition-colors ${
                canUndo 
                  ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600 hover:bg-slate-200' 
                  : 'bg-slate-50 dark:bg-slate-900 text-slate-300 dark:text-slate-600 border-slate-100 dark:border-slate-800 cursor-not-allowed'
              }`}
              title="Hoàn tác (Undo)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className={`p-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1 border transition-colors ${
                canRedo 
                  ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600 hover:bg-slate-200' 
                  : 'bg-slate-50 dark:bg-slate-900 text-slate-300 dark:text-slate-600 border-slate-100 dark:border-slate-800 cursor-not-allowed'
              }`}
              title="Làm lại (Redo)"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Row 3: Dropdown Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Khối lớp</label>
            <select
              value={filter.grade}
              onChange={(e) => setFilter({ ...filter, grade: e.target.value })}
              className="w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-xs"
            >
              <option value="all">Tất cả khối</option>
              {['Khối 1', 'Khối 2', 'Khối 3', 'Khối 4', 'Khối 5'].map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Lớp học</label>
            <select
              value={filter.className}
              onChange={(e) => setFilter({ ...filter, className: e.target.value })}
              className="w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-xs"
            >
              <option value="all">Tất cả lớp</option>
              {availableClasses.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Môn học</label>
            <select
              value={filter.subject}
              onChange={(e) => setFilter({ ...filter, subject: e.target.value })}
              className="w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-xs"
            >
              <option value="all">Tất cả môn</option>
              {availableSubjects.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Trạng thái</label>
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value as any })}
              className="w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-xs"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="completed">🟢 Đã hoàn thành</option>
              <option value="preparing">🟡 Đang chuẩn bị</option>
              <option value="unprepared">⚪ Chưa chuẩn bị</option>
            </select>
          </div>
        </div>

      </div>

      {/* Main 6-Column Schedule Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left min-w-[700px]">
            {/* Table Header */}
            <thead>
              <tr className="bg-slate-100/90 dark:bg-slate-800 text-slate-800 dark:text-slate-200 uppercase text-xs font-black border-b border-slate-200 dark:border-slate-700">
                <th className="px-4 py-3.5 text-center border-r border-slate-200 dark:border-slate-700/80 w-36">
                  Thứ / Ngày
                </th>
                <th className="px-4 py-3.5 text-center border-r border-slate-200 dark:border-slate-700/80 w-36">
                  Buổi – Tiết
                </th>
                <th className="px-3 py-3.5 text-center border-r border-slate-200 dark:border-slate-700/80 w-20">
                  Lớp
                </th>
                <th className="px-3 py-3.5 text-center border-r border-slate-200 dark:border-slate-700/80 w-24">
                  Tiết PPCT
                </th>
                <th className="px-4 py-3.5 text-left border-r border-slate-200 dark:border-slate-700/80">
                  Tên bài dạy
                </th>
                <th className="px-4 py-3.5 text-left w-48">
                  Ghi chú
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
              {DAYS_OF_WEEK.map((day) => {
                const dateStr = getWeekDayDate(currentWeek, day, teacher?.academicYear || '2025-2026');
                const dayItems = filteredSchedules
                  .filter(s => s.dayOfWeek === day)
                  .sort((a, b) => {
                    const sessA = getNormalizedSession(a);
                    const sessB = getNormalizedSession(b);
                    if (sessA !== sessB) return sessA === 'Sáng' ? -1 : 1;
                    return getNormalizedPeriod(a) - getNormalizedPeriod(b);
                  });

                // If no items for this day
                if (dayItems.length === 0) {
                  return (
                    <tr key={day} className="border-b border-slate-200/80 dark:border-slate-800">
                      {/* Column 1: Thứ / Ngày */}
                      <td className="px-4 py-3.5 text-center align-middle font-bold bg-slate-50/70 dark:bg-slate-900/60 border-r border-slate-200 dark:border-slate-800">
                        <div className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                          {day}
                        </div>
                        <div className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                          {dateStr}
                        </div>
                      </td>

                      {/* Columns 2-6 empty placeholder row */}
                      <td className="px-4 py-3.5 text-center border-r border-slate-200 dark:border-slate-800 text-xs text-slate-400">—</td>
                      <td className="px-3 py-3.5 text-center border-r border-slate-200 dark:border-slate-800 text-xs text-slate-400">—</td>
                      <td className="px-3 py-3.5 text-center border-r border-slate-200 dark:border-slate-800 text-xs text-slate-400">—</td>
                      <td className="px-4 py-3.5 border-r border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-400 italic">Chưa có tiết dạy</span>
                          <button
                            onClick={() => handleOpenAddModal(day, 1)}
                            className="text-[11px] font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Thêm tiết</span>
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-400">—</td>
                    </tr>
                  );
                }

                // If there are items for this day, render rows with rowSpan on Column 1
                return dayItems.map((item, index) => {
                  return (
                    <tr 
                      key={item.id}
                      onClick={() => handleRowClick(item)}
                      className="cursor-pointer hover:bg-blue-50/80 dark:hover:bg-blue-950/40 transition-colors group"
                    >
                      {/* Column 1: Thứ / Ngày (rowSpan on first row only) */}
                      {index === 0 && (
                        <td 
                          rowSpan={dayItems.length}
                          className="px-4 py-3.5 text-center align-middle font-bold bg-slate-50/90 dark:bg-slate-900/90 border-r border-slate-200 dark:border-slate-800"
                        >
                          <div className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                            {day}
                          </div>
                          <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                            {dateStr}
                          </div>
                        </td>
                      )}

                      {/* Column 2: Buổi – Tiết */}
                      <td className="px-4 py-3.5 text-center border-r border-slate-200/80 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200">
                        {formatTableSessionPeriod(item.period, item.session)}
                      </td>

                      {/* Column 3: Lớp */}
                      <td className="px-3 py-3.5 text-center border-r border-slate-200/80 dark:border-slate-800">
                        {item.className ? (
                          <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-black bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300">
                            {item.className}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>

                      {/* Column 4: Tiết PPCT */}
                      <td className="px-3 py-3.5 text-center border-r border-slate-200/80 dark:border-slate-800 text-xs font-black text-slate-900 dark:text-white">
                        {item.ppctPeriod ? item.ppctPeriod : '—'}
                      </td>

                      {/* Column 5: Tên bài dạy */}
                      <td className="px-4 py-3.5 border-r border-slate-200/80 dark:border-slate-800">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-xs font-bold ${item.lessonTitle ? 'text-slate-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-300' : 'text-slate-400 italic'}`}>
                            {item.lessonTitle || 'Chưa chọn bài'}
                          </span>
                          <Edit2 className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-all shrink-0" />
                        </div>
                      </td>

                      {/* Column 6: Ghi chú */}
                      <td className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-400 font-medium">
                        {item.notes ? item.notes : '—'}
                      </td>
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Side Detail Drawer (Right Panel) */}
      <LessonDrawer
        item={selectedScheduleItem}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        curriculums={curriculums}
        assignedClasses={assignedClassList}
        onSave={(updated) => {
          onUpdateScheduleItem?.(updated);
        }}
        onDelete={(itemId) => {
          if (onDeleteScheduleItem) {
            onDeleteScheduleItem(itemId);
          }
        }}
        onDeleteSuccess={(msg) => {
          showToast(msg);
        }}
      />

      {/* Add Lesson Modal / Drawer */}
      <AddLessonModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        initialDayOfWeek={addModalInitialDay}
        initialPeriod={addModalInitialPeriod}
        currentWeek={currentWeek}
        teacher={teacher || {
          uid: 't-default',
          name: 'Giáo viên',
          email: '',
          subjects: ['Tin học'],
          assignedClasses: assignedClassList,
          academicYear: teacher?.academicYear || '2025-2026',
          semester: 'Học kỳ I'
        }}
        curriculums={curriculums}
        schedules={schedules}
        assignedClasses={assignedClassList}
        onSave={(newItem) => {
          if (onAddScheduleItem) {
            onAddScheduleItem(newItem);
          } else if (onUpdateScheduleItem) {
            onUpdateScheduleItem(newItem);
          }
        }}
      />

      {/* Print Preview Modal */}
      <PrintPreviewModal
        isOpen={isPrintPreviewOpen}
        onClose={() => setIsPrintPreviewOpen(false)}
        teacher={teacher}
        schedules={schedules}
        currentWeek={currentWeek}
      />

      {/* Date Picker Calendar Modal */}
      <DatePickerModal
        isOpen={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        currentWeek={currentWeek}
        onSelectWeek={(weekNum) => {
          setCurrentWeek(weekNum);
          setFilter((prev) => ({ ...prev, weekNumber: weekNum }));
        }}
        academicYear={teacher?.academicYear || '2025-2026'}
        schedules={schedules}
      />

      {/* Edit Week Date Modal */}
      <EditWeekDateModal
        isOpen={isEditWeekDateOpen}
        onClose={() => setIsEditWeekDateOpen(false)}
        currentWeek={currentWeek}
        academicYear={teacher?.academicYear || '2025-2026'}
        schedules={schedules}
        onSaved={() => {
          setCustomWeekDatesMap(loadCustomWeekDatesMap());
          showToast(`Đã cập nhật ngày thực tế cho Tuần ${currentWeek}`);
        }}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-70 bg-emerald-900 text-emerald-100 px-4 py-3 rounded-xl shadow-2xl border border-emerald-700 text-xs font-bold flex items-center gap-2 animate-bounceIn">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
