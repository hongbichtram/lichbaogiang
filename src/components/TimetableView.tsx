import React, { useState } from 'react';
import { 
  Clock, 
  School, 
  Plus, 
  Trash2, 
  Sparkles, 
  X, 
  AlertCircle, 
  Save, 
  BookOpen
} from 'lucide-react';
import { TeacherProfile, ClassTimetableRule } from '../types';
import { ClassSelectDropdown } from './ClassSelectDropdown';
import { 
  inferGradeFromClassName, 
  normalizeClassName, 
  getFullPeriodLabel,
  getNormalizedSession,
  getNormalizedPeriod
} from '../utils/classUtils';

interface TimetableViewProps {
  teacher: TeacherProfile;
  timetableRules: ClassTimetableRule[];
  onSaveProfile: (profile: TeacherProfile) => void;
  onSaveTimetableRules: (rules: ClassTimetableRule[]) => void;
  onAutoGenerateSchedule: () => void;
}

const DAYS_OF_WEEK: Array<'Thứ 2' | 'Thứ 3' | 'Thứ 4' | 'Thứ 5' | 'Thứ 6'> = [
  'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6'
];

export const TimetableView: React.FC<TimetableViewProps> = ({
  teacher,
  timetableRules,
  onSaveProfile,
  onSaveTimetableRules,
  onAutoGenerateSchedule,
}) => {
  const [rules, setRules] = useState<ClassTimetableRule[]>([...timetableRules]);
  const [addClassInput, setAddClassInput] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>(
    teacher.subjects[0] || 'Tin học'
  );

  // Expand / collapse state for assigned rules list (default collapsed)
  const [isListExpanded, setIsListExpanded] = useState(false);

  // Quick rule form state
  const [newRule, setNewRule] = useState<{
    className: string;
    dayOfWeek: 'Thứ 2' | 'Thứ 3' | 'Thứ 4' | 'Thứ 5' | 'Thứ 6';
    session: 'Sáng' | 'Chiều';
    period: number;
  }>({
    className: '',
    dayOfWeek: 'Thứ 2',
    session: 'Sáng',
    period: 1,
  });

  const assignedClasses = teacher.assignedClasses || [];

  // Add new class to assignedClasses list
  const handleAddClass = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleaned = normalizeClassName(addClassInput);
    if (!cleaned) return;

    if (assignedClasses.includes(cleaned)) {
      alert(`Lớp ${cleaned} đã tồn tại trong danh sách!`);
      return;
    }

    const updatedClasses = [...assignedClasses, cleaned].sort();
    const updatedProfile = { ...teacher, assignedClasses: updatedClasses };
    onSaveProfile(updatedProfile);
    setAddClassInput('');
  };

  // Quick add class from dropdown callback
  const handleQuickAddClassFromDropdown = (className: string) => {
    const cleaned = normalizeClassName(className);
    if (!cleaned) return;

    if (!assignedClasses.includes(cleaned)) {
      const updatedClasses = [...assignedClasses, cleaned].sort();
      const updatedProfile = { ...teacher, assignedClasses: updatedClasses };
      onSaveProfile(updatedProfile);
    }
  };

  // Remove class from assignedClasses list
  const handleRemoveClass = (clsToRemove: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa lớp ${clsToRemove} khỏi danh sách? Các tiết của lớp này trong TKB cố định cũng sẽ được dọn dẹp.`)) {
      return;
    }

    const updatedClasses = assignedClasses.filter(c => c !== clsToRemove);
    const updatedProfile = { ...teacher, assignedClasses: updatedClasses };
    onSaveProfile(updatedProfile);

    // Remove any timetable rule assigned to this class
    const updatedRules = rules.filter(r => r.className !== clsToRemove);
    setRules(updatedRules);
    onSaveTimetableRules(updatedRules);
  };

  // Assign or clear a matrix cell in timetable
  const handleCellClassChange = (
    dayOfWeek: 'Thứ 2' | 'Thứ 3' | 'Thứ 4' | 'Thứ 5' | 'Thứ 6',
    session: 'Sáng' | 'Chiều',
    period: number,
    selectedClassName: string
  ) => {
    if (session === 'Chiều' && period > 3) {
      alert('Buổi chiều chỉ có 3 tiết (Tiết 1, 2, 3)! Tuyệt đối không có Tiết 4 ở buổi chiều.');
      return;
    }

    if (!selectedClassName) {
      // Clear cell for this specific slot
      const updated = rules.filter(r => 
        !(r.dayOfWeek === dayOfWeek && getNormalizedSession(r) === session && getNormalizedPeriod(r) === period)
      );
      setRules(updated);
      onSaveTimetableRules(updated);
      return;
    }

    const grade = inferGradeFromClassName(selectedClassName);
    const existingIdx = rules.findIndex(r => 
      r.dayOfWeek === dayOfWeek && getNormalizedSession(r) === session && getNormalizedPeriod(r) === period
    );

    let updated: ClassTimetableRule[];
    if (existingIdx >= 0) {
      updated = [...rules];
      updated[existingIdx] = {
        ...updated[existingIdx],
        className: selectedClassName,
        grade,
        subject: selectedSubject,
        session,
        period,
      };
    } else {
      const createdRule: ClassTimetableRule = {
        id: `rule-${Date.now()}-${dayOfWeek}-${session}-${period}`,
        className: selectedClassName,
        grade,
        subject: selectedSubject,
        dayOfWeek,
        session,
        period,
      };
      updated = [...rules, createdRule];
    }

    setRules(updated);
    onSaveTimetableRules(updated);
  };

  // Add rule from quick rule form
  const handleAddRuleFromForm = () => {
    if (!newRule.className) {
      alert('Vui lòng chọn Lớp dạy từ danh sách!');
      return;
    }
    if (newRule.session === 'Chiều' && newRule.period > 3) {
      alert('Buổi chiều chỉ có 3 tiết (Tiết 1, 2, 3)!');
      return;
    }

    handleCellClassChange(newRule.dayOfWeek, newRule.session, newRule.period, newRule.className);
    setNewRule(prev => ({ ...prev, className: '' }));
  };

  // Delete rule
  const handleDeleteRule = (id: string) => {
    const updated = rules.filter(r => r.id !== id);
    setRules(updated);
    onSaveTimetableRules(updated);
  };

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <span>Thời Khóa Biểu Cố Định</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Phân công thời khóa biểu cố định theo tuần. Nhấp vào từng ô để phân công lớp hoặc dùng công cụ phân công nhanh.
          </p>
        </div>

        <button
          onClick={() => {
            onAutoGenerateSchedule();
            alert('⚡ Đã lập Lịch báo giảng 35 tuần tự động từ Thời khóa biểu cố định!');
          }}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center space-x-2 shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>⚡ Lập Lịch Báo Giảng Tự Động</span>
        </button>
      </div>

      {/* Class Management Bar */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700/60 pb-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <School className="w-4 h-4 text-blue-500" />
            <span>Danh Sách Lớp Dạy ({assignedClasses.length} lớp)</span>
          </h3>

          <form onSubmit={handleAddClass} className="flex items-center gap-2 max-w-md w-full">
            <input
              type="text"
              value={addClassInput}
              onChange={(e) => setAddClassInput(e.target.value)}
              placeholder="Thêm lớp mới (ví dụ: 3A1, 4A2)..."
              className="flex-1 p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
            />
            <button
              type="submit"
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shrink-0 flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm</span>
            </button>
          </form>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {assignedClasses.length === 0 ? (
            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              Chưa có lớp học nào. Hãy nhập tên lớp để bắt đầu phân công TKB.
            </p>
          ) : (
            assignedClasses.map((cls) => (
              <div
                key={cls}
                className="px-2.5 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200"
              >
                <span>{cls}</span>
                <span className="text-[10px] text-slate-400 font-normal">({inferGradeFromClassName(cls)})</span>
                <button
                  type="button"
                  onClick={() => handleRemoveClass(cls)}
                  className="text-slate-400 hover:text-red-500 transition-colors ml-1"
                  title={`Xóa lớp ${cls}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Card: THỜI KHÓA BIỂU CỐ ĐỊNH (Matrix Grid) */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-6">
        
        {/* Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 dark:border-slate-700/60 pb-4">
          <div className="space-y-1">
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
              <Clock className="w-6 h-6 text-emerald-500" />
              <span>BẢNG MA TRẬN THỜI KHÓA BIỂU</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Buổi Sáng có 4 tiết, Buổi Chiều có 3 tiết (không có Tiết 4 ở buổi chiều).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm">
              <span className="font-bold text-slate-500 dark:text-slate-400 px-1">Môn dạy:</span>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="bg-white dark:bg-slate-800 font-extrabold text-blue-600 dark:text-blue-400 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none"
              >
                {teacher.subjects.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Quick Assign Toolbar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200">
              Phân công nhanh theo từng tiết:
            </span>
            <span className="text-xs text-slate-400 hidden sm:inline">
              (Hoặc nhấp trực tiếp vào ô bất kỳ trong bảng ma trận phía dưới)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Thứ</label>
              <select
                value={newRule.dayOfWeek}
                onChange={(e) => setNewRule({ ...newRule, dayOfWeek: e.target.value as any })}
                className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-bold text-slate-800 dark:text-white"
              >
                {DAYS_OF_WEEK.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Buổi</label>
              <select
                value={newRule.session}
                onChange={(e) => {
                  const s = e.target.value as 'Sáng' | 'Chiều';
                  setNewRule(prev => ({
                    ...prev,
                    session: s,
                    period: s === 'Chiều' && prev.period > 3 ? 1 : prev.period
                  }));
                }}
                className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-bold text-slate-800 dark:text-white"
              >
                <option value="Sáng">☀️ Sáng</option>
                <option value="Chiều">🌤️ Chiều</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Tiết</label>
              <select
                value={newRule.period}
                onChange={(e) => setNewRule({ ...newRule, period: parseInt(e.target.value) || 1 })}
                className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-bold text-slate-800 dark:text-white"
              >
                {(newRule.session === 'Sáng' ? [1, 2, 3, 4] : [1, 2, 3]).map(p => (
                  <option key={p} value={p}>Tiết {p}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Chọn Lớp dạy</label>
              <ClassSelectDropdown
                value={newRule.className}
                assignedClasses={assignedClasses}
                onSelect={(cls) => setNewRule({ ...newRule, className: cls })}
                onClear={() => setNewRule({ ...newRule, className: '' })}
                onQuickAddClass={handleQuickAddClassFromDropdown}
                dayOfWeek={newRule.dayOfWeek}
                session={newRule.session}
                period={newRule.period}
                existingRules={rules}
                placeholder="▼ Chọn lớp"
              />
            </div>

            <div>
              <button
                type="button"
                onClick={handleAddRuleFromForm}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 flex items-center justify-center space-x-1 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm vào TKB</span>
              </button>
            </div>
          </div>
        </div>

        {/* MATRIX GRID TABLE */}
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xs">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-100/90 dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-extrabold border-b border-slate-200 dark:border-slate-700">
                <th className="p-3.5 border-r border-slate-200 dark:border-slate-700 w-24 text-center font-black uppercase bg-slate-200/50 dark:bg-slate-900">
                  Buổi
                </th>
                <th className="p-3.5 border-r border-slate-200 dark:border-slate-700 w-24 text-center font-black uppercase bg-slate-200/30 dark:bg-slate-900">
                  Tiết
                </th>
                {DAYS_OF_WEEK.map((day) => (
                  <th key={day} className="p-3.5 border-r border-slate-200 dark:border-slate-700 text-center font-black uppercase">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-xs sm:text-sm">
              
              {/* ☀️ BUỔI SÁNG SECTION (4 Periods) */}
              {[1, 2, 3, 4].map((period, periodIdx) => (
                <tr key={`morning-period-${period}`} className="hover:bg-amber-50/30 dark:hover:bg-slate-800/50 transition-colors">
                  {periodIdx === 0 && (
                    <td
                      rowSpan={4}
                      className="p-3 text-center align-middle font-black bg-amber-500/10 text-amber-700 dark:text-amber-300 border-r border-amber-200 dark:border-amber-900/50 uppercase tracking-wider text-xs sm:text-sm"
                    >
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <span className="text-lg">☀️</span>
                        <span>Sáng</span>
                        <span className="text-[11px] font-normal text-amber-600/80 dark:text-amber-400/80">(4 tiết)</span>
                      </div>
                    </td>
                  )}
                  <td className="p-3 font-bold text-center bg-slate-50/60 dark:bg-slate-900/60 border-r border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs sm:text-sm">
                    Tiết {period}
                  </td>
                  {DAYS_OF_WEEK.map((dayOfWeek) => {
                    const rule = rules.find(
                      r => r.dayOfWeek === dayOfWeek && getNormalizedSession(r) === 'Sáng' && getNormalizedPeriod(r) === period
                    );
                    return (
                      <td key={`${dayOfWeek}-Sáng-${period}`} className="p-1.5 border-r border-slate-200 dark:border-slate-700 align-middle">
                        <ClassSelectDropdown
                          value={rule ? rule.className : ''}
                          assignedClasses={assignedClasses}
                          onSelect={(selectedCls) => handleCellClassChange(dayOfWeek, 'Sáng', period, selectedCls)}
                          onClear={() => handleCellClassChange(dayOfWeek, 'Sáng', period, '')}
                          onQuickAddClass={handleQuickAddClassFromDropdown}
                          dayOfWeek={dayOfWeek}
                          session="Sáng"
                          period={period}
                          existingRules={rules}
                          currentRuleId={rule?.id}
                          compact={true}
                          placeholder="Chọn lớp"
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* 🌤️ BUỔI CHIỀU SECTION (3 Periods) */}
              {[1, 2, 3].map((period, periodIdx) => (
                <tr key={`afternoon-period-${period}`} className="hover:bg-indigo-50/30 dark:hover:bg-slate-800/50 transition-colors">
                  {periodIdx === 0 && (
                    <td
                      rowSpan={3}
                      className="p-3 text-center align-middle font-black bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-r border-indigo-200 dark:border-indigo-900/50 uppercase tracking-wider text-xs sm:text-sm border-t-2 border-t-slate-300 dark:border-t-slate-600"
                    >
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <span className="text-lg">🌤️</span>
                        <span>Chiều</span>
                        <span className="text-[11px] font-normal text-indigo-600/80 dark:text-indigo-400/80">(3 tiết)</span>
                      </div>
                    </td>
                  )}
                  <td className={`p-3 font-bold text-center bg-slate-50/60 dark:bg-slate-900/60 border-r border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs sm:text-sm ${periodIdx === 0 ? 'border-t-2 border-t-slate-300 dark:border-t-slate-600' : ''}`}>
                    Tiết {period}
                  </td>
                  {DAYS_OF_WEEK.map((dayOfWeek) => {
                    const rule = rules.find(
                      r => r.dayOfWeek === dayOfWeek && getNormalizedSession(r) === 'Chiều' && getNormalizedPeriod(r) === period
                    );
                    return (
                      <td key={`${dayOfWeek}-Chiều-${period}`} className={`p-1.5 border-r border-slate-200 dark:border-slate-700 align-middle ${periodIdx === 0 ? 'border-t-2 border-t-slate-300 dark:border-t-slate-600' : ''}`}>
                        <ClassSelectDropdown
                          value={rule ? rule.className : ''}
                          assignedClasses={assignedClasses}
                          onSelect={(selectedCls) => handleCellClassChange(dayOfWeek, 'Chiều', period, selectedCls)}
                          onClear={() => handleCellClassChange(dayOfWeek, 'Chiều', period, '')}
                          onQuickAddClass={handleQuickAddClassFromDropdown}
                          dayOfWeek={dayOfWeek}
                          session="Chiều"
                          period={period}
                          existingRules={rules}
                          currentRuleId={rule?.id}
                          compact={true}
                          placeholder="Chọn lớp"
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}

            </tbody>
          </table>
        </div>

        {/* Assigned Rules Summary List (Gom gọn / Thu gọn) */}
        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-700/60">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h4 className="font-extrabold text-xs sm:text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <span>📋 Danh sách các tiết đã phân công ({rules.length} tiết)</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsListExpanded(!isListExpanded)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 font-bold text-xs sm:text-sm transition-all flex items-center gap-1 active:scale-95"
              >
                <span>{isListExpanded ? 'Thu gọn ▲' : 'Xem danh sách ▼'}</span>
              </button>
            </div>

            {rules.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Bạn có chắc muốn xóa tất cả tiết trong Thời khóa biểu cố định?')) {
                    setRules([]);
                    onSaveTimetableRules([]);
                  }
                }}
                className="text-xs sm:text-sm font-bold text-red-500 hover:text-red-600 transition-colors shrink-0"
              >
                Xóa tất cả TKB
              </button>
            )}
          </div>

          {/* Expanded Content with Smooth Transition */}
          {isListExpanded && (
            <div className="animate-in fade-in duration-200">
              {rules.length === 0 ? (
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-center text-xs sm:text-sm text-slate-400 italic">
                  Chưa phân công tiết nào trong Thời khóa biểu cố định. Hãy nhấp vào các ô trong bảng trên để chọn Lớp dạy.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto p-1">
                  {rules
                    .sort((a, b) => {
                      const dayOrder = DAYS_OF_WEEK.indexOf(a.dayOfWeek) - DAYS_OF_WEEK.indexOf(b.dayOfWeek);
                      if (dayOrder !== 0) return dayOrder;
                      const sessA = getNormalizedSession(a);
                      const sessB = getNormalizedSession(b);
                      if (sessA !== sessB) return sessA === 'Sáng' ? -1 : 1;
                      return getNormalizedPeriod(a) - getNormalizedPeriod(b);
                    })
                    .map((rule) => (
                      <div
                        key={rule.id}
                        className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs sm:text-sm font-medium"
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <span className="font-bold text-blue-600 dark:text-blue-400 shrink-0">
                            {rule.dayOfWeek} • {getFullPeriodLabel(rule.period, rule.session)}
                          </span>
                          <span className="font-extrabold text-slate-900 dark:text-white shrink-0">
                            Lớp {rule.className}
                          </span>
                          <span className="text-xs text-slate-400 truncate">
                            ({rule.grade})
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteRule(rule.id)}
                          className="p-1 text-slate-400 hover:text-red-500 transition-colors ml-1"
                          title="Xóa tiết này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
