import React, { useState, useMemo } from 'react';
import { 
  Clock, 
  School, 
  Plus, 
  Trash2, 
  Sparkles, 
  X, 
  Save, 
  Filter,
  BookOpen
} from 'lucide-react';
import { TeacherProfile, ClassTimetableRule, TimetableVersion } from '../types';
import { ClassSelectDropdown } from './ClassSelectDropdown';
import { 
  inferGradeFromClassName, 
  normalizeClassName, 
  getFullPeriodLabel,
  getNormalizedSession,
  getNormalizedPeriod
} from '../utils/classUtils';
import { 
  getSubjectColorStyle, 
  getTeacherUniqueSubjects, 
  calculateSubjectCounts 
} from '../utils/subjectUtils';

interface TimetableViewProps {
  teacher: TeacherProfile;
  timetableRules: ClassTimetableRule[];
  timetableVersions?: TimetableVersion[];
  currentWeek?: number;
  onSaveProfile: (profile: TeacherProfile) => void;
  onSaveTimetableRules: (rules: ClassTimetableRule[], fromWeek?: number, versionName?: string) => void;
  onAutoGenerateSchedule: () => void;
}

const DAYS_OF_WEEK: Array<'Thứ 2' | 'Thứ 3' | 'Thứ 4' | 'Thứ 5' | 'Thứ 6'> = [
  'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6'
];

export const TimetableView: React.FC<TimetableViewProps> = ({
  teacher,
  timetableRules,
  timetableVersions = [],
  currentWeek = 1,
  onSaveProfile,
  onSaveTimetableRules,
  onAutoGenerateSchedule,
}) => {
  const [rules, setRules] = useState<ClassTimetableRule[]>([...timetableRules]);
  const [addClassInput, setAddClassInput] = useState('');
  const [applyFromWeek, setApplyFromWeek] = useState<number>(currentWeek || 1);
  const [versionNameInput, setVersionNameInput] = useState<string>('');
  
  // Filter by subject on timetable matrix
  const [subjectFilter, setSubjectFilter] = useState<string>('all');

  // Currently selected subject for quick assignment
  const [activeSubject, setActiveSubject] = useState<string>(
    teacher.subjects[0] || 'Tin học'
  );

  // Expand / collapse state for assigned rules list
  const [isListExpanded, setIsListExpanded] = useState(true);

  // Quick rule form state
  const [newRule, setNewRule] = useState<{
    subject: string;
    className: string;
    dayOfWeek: 'Thứ 2' | 'Thứ 3' | 'Thứ 4' | 'Thứ 5' | 'Thứ 6';
    session: 'Sáng' | 'Chiều';
    period: number;
  }>({
    subject: teacher.subjects[0] || 'Tin học',
    className: '',
    dayOfWeek: 'Thứ 2',
    session: 'Sáng',
    period: 1,
  });

  const assignedClasses = teacher.assignedClasses || [];

  // Extract all unique subjects available
  const availableSubjects = useMemo(() => {
    return getTeacherUniqueSubjects(teacher.subjects, rules, []);
  }, [teacher.subjects, rules]);

  // Keep activeSubject in sync with availableSubjects if teacher subjects change
  React.useEffect(() => {
    if (availableSubjects.length > 0 && !availableSubjects.includes(activeSubject)) {
      setActiveSubject(availableSubjects[0]);
      setNewRule(prev => ({ ...prev, subject: availableSubjects[0] }));
    }
  }, [availableSubjects, activeSubject]);

  // Statistics per subject
  const subjectStats = useMemo(() => {
    return calculateSubjectCounts(rules, availableSubjects);
  }, [rules, availableSubjects]);

  const totalLessonsCount = rules.length;

  // Filtered rules for displaying in matrix table
  const displayedRules = useMemo(() => {
    if (subjectFilter === 'all') return rules;
    return rules.filter(r => (r.subject || 'Tin học') === subjectFilter);
  }, [rules, subjectFilter]);

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
    selectedClassName: string,
    targetSubject: string = activeSubject
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

    const subName = targetSubject || activeSubject || 'Tin học';

    let updated: ClassTimetableRule[];
    if (existingIdx >= 0) {
      updated = [...rules];
      updated[existingIdx] = {
        ...updated[existingIdx],
        className: selectedClassName,
        grade,
        subject: subName,
        subjectName: subName,
        session,
        period,
      };
    } else {
      const createdRule: ClassTimetableRule = {
        id: `rule-${Date.now()}-${dayOfWeek}-${session}-${period}`,
        className: selectedClassName,
        grade,
        subject: subName,
        subjectName: subName,
        dayOfWeek,
        session,
        period,
      };
      updated = [...rules, createdRule];
    }

    setRules(updated);
    onSaveTimetableRules(updated, applyFromWeek, versionNameInput);
  };

  // Add rule from quick rule form
  const handleAddRuleFromForm = () => {
    if (!newRule.className) {
      alert('Vui lòng chọn Lớp dạy từ danh sách!');
      return;
    }
    if (!newRule.subject) {
      alert('Vui lòng chọn Môn học!');
      return;
    }
    if (newRule.session === 'Chiều' && newRule.period > 3) {
      alert('Buổi chiều chỉ có 3 tiết (Tiết 1, 2, 3)!');
      return;
    }

    handleCellClassChange(
      newRule.dayOfWeek, 
      newRule.session, 
      newRule.period, 
      newRule.className, 
      newRule.subject
    );
    setNewRule(prev => ({ ...prev, className: '' }));
  };

  // Delete rule
  const handleDeleteRule = (id: string) => {
    const updated = rules.filter(r => r.id !== id);
    setRules(updated);
    onSaveTimetableRules(updated, applyFromWeek, versionNameInput);
  };

  // Update subject of an existing rule
  const handleUpdateRuleSubject = (ruleId: string, newSubject: string) => {
    const updated = rules.map(r => {
      if (r.id === ruleId) {
        return {
          ...r,
          subject: newSubject,
          subjectName: newSubject,
        };
      }
      return r;
    });
    setRules(updated);
    onSaveTimetableRules(updated, applyFromWeek, versionNameInput);
  };

  // Update class of an existing rule
  const handleUpdateRuleClass = (ruleId: string, newClassName: string) => {
    const grade = inferGradeFromClassName(newClassName);
    const updated = rules.map(r => {
      if (r.id === ruleId) {
        return {
          ...r,
          className: newClassName,
          grade,
        };
      }
      return r;
    });
    setRules(updated);
    onSaveTimetableRules(updated, applyFromWeek, versionNameInput);
  };

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto animate-fadeIn">
      {/* Page Header */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center space-x-2">
            <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <span>THỜI KHÓA BIỂU CỐ ĐỊNH</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
            Quản lý tất cả môn học và chia phiên bản TKB theo tuần áp dụng.
          </p>
        </div>

        <button
          onClick={() => {
            onAutoGenerateSchedule();
            alert('⚡ Đã lập Lịch báo giảng 35 tuần tự động từ Thời khóa biểu!');
          }}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center space-x-2 shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>⚡ Lập Lịch Báo Giảng Tự Động (35 Tuần)</span>
        </button>
      </div>

      {/* Timetable Versioning Selector Bar */}
      <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/80 to-purple-50/80 dark:from-slate-800 dark:via-slate-800 dark:to-slate-800 p-5 rounded-2xl border border-indigo-200/80 dark:border-indigo-900/60 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-extrabold text-indigo-950 dark:text-indigo-200 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Cấu Hình Phiên Bản TKB Theo Tuần</span>
            </h3>
            <p className="text-xs text-indigo-800/80 dark:text-slate-400">
              TKB mới sẽ bắt đầu có hiệu lực từ tuần đã chọn và tiếp tục áp dụng cho các tuần sau cho đến trước khi có phiên bản TKB mới.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-slate-700">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">Áp dụng từ tuần:</label>
              <select
                value={applyFromWeek}
                onChange={(e) => setApplyFromWeek(Number(e.target.value))}
                className="bg-transparent text-xs font-black text-indigo-600 dark:text-indigo-400 focus:outline-none cursor-pointer"
              >
                {Array.from({ length: 35 }, (_, i) => i + 1).map((w) => (
                  <option key={w} value={w}>Tuần {w}</option>
                ))}
              </select>
            </div>

            <input
              type="text"
              value={versionNameInput}
              onChange={(e) => setVersionNameInput(e.target.value)}
              placeholder="Tên phiên bản (ví dụ: TKB áp dụng từ HK2)..."
              className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-900 border border-indigo-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white max-w-xs"
            />
          </div>
        </div>

        {/* Display existing versions */}
        {timetableVersions && timetableVersions.length > 0 && (
          <div className="pt-2 border-t border-indigo-100 dark:border-slate-700/60 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Các phiên bản hiện có:</span>
            {timetableVersions.map((v) => (
              <span
                key={v.id}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 border ${
                  applyFromWeek >= v.fromWeek && applyFromWeek <= v.toWeek
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                <span>{v.versionName || 'TKB'}</span>
                <span className="opacity-80 font-mono">(Tuần {v.fromWeek} – {v.toWeek})</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Class Management Bar */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-4">
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
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-5">
        
        {/* Top Controls: Subject Filter + Active Subject Assign Selection */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-100 dark:border-slate-700/60 pb-4">
          
          {/* Subject Filter Dropdown */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="font-extrabold text-xs sm:text-sm text-slate-700 dark:text-slate-200 whitespace-nowrap">
              Môn học:
            </span>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-blue-500/30 rounded-xl text-xs sm:text-sm font-extrabold text-blue-700 dark:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
            >
              <option value="all">Tất cả môn học</option>
              {availableSubjects.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Subject Switcher for Cell Allocation */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <span className="font-bold text-slate-500 dark:text-slate-400 pl-1">Môn đang phân công:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {availableSubjects.map((sub) => {
                const style = getSubjectColorStyle(sub);
                const isActive = activeSubject === sub;
                return (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => {
                      setActiveSubject(sub);
                      setNewRule(prev => ({ ...prev, subject: sub }));
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1 border ${
                      isActive
                        ? `${style.badgeSolid} shadow-xs scale-105`
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                    }`}
                  >
                    <span>{style.icon}</span>
                    <span>{sub}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* STATISTICS SECTION (REQUIREMENT 6) */}
        <div className="flex flex-wrap items-center gap-3 p-3.5 bg-slate-50/80 dark:bg-slate-900/60 rounded-xl border border-slate-200/60 dark:border-slate-800">
          <span className="text-xs font-black uppercase text-slate-400 tracking-wider mr-1">
            THỐNG KÊ TIẾT DẠY:
          </span>

          {subjectStats.map((stat) => (
            <div
              key={stat.subject}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border ${stat.style.badgeClass}`}
            >
              <span>{stat.style.icon}</span>
              <span>{stat.subject}:</span>
              <span className="text-sm font-black">{stat.count} tiết/tuần</span>
            </div>
          ))}

          <div className="px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 flex items-center gap-1.5 shadow-2xs ml-auto">
            <span>📚</span>
            <span>Tổng cộng:</span>
            <span className="text-sm font-black">{totalLessonsCount} tiết/tuần</span>
          </div>
        </div>

        {/* Quick Assign Toolbar (REQUIREMENT 8) */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-blue-600" />
              <span>Phân công tiết dạy mới:</span>
            </span>
            <span className="text-xs text-slate-400 hidden sm:inline">
              (Hoặc chọn lớp trực tiếp trong ô của bảng phía dưới)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5 items-end">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Thứ</label>
              <select
                value={newRule.dayOfWeek}
                onChange={(e) => setNewRule({ ...newRule, dayOfWeek: e.target.value as any })}
                className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white"
              >
                {DAYS_OF_WEEK.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Buổi</label>
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
                className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white"
              >
                <option value="Sáng">Sáng</option>
                <option value="Chiều">Chiều</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Tiết</label>
              <select
                value={newRule.period}
                onChange={(e) => setNewRule({ ...newRule, period: parseInt(e.target.value) || 1 })}
                className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white"
              >
                {(newRule.session === 'Sáng' ? [1, 2, 3, 4] : [1, 2, 3]).map(p => (
                  <option key={p} value={p}>Tiết {p}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Môn học *</label>
              <select
                value={newRule.subject}
                onChange={(e) => setNewRule({ ...newRule, subject: e.target.value })}
                className="w-full p-2 bg-white dark:bg-slate-800 border border-blue-500/40 rounded-xl text-xs font-extrabold text-blue-700 dark:text-blue-300"
              >
                {availableSubjects.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Lớp dạy *</label>
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
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-extrabold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center space-x-1 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm TKB</span>
              </button>
            </div>
          </div>
        </div>

        {/* MATRIX GRID TABLE (REQUIREMENT 2 & 3) */}
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xs">
          <table className="w-full text-left border-collapse min-w-[750px]">
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
              
              {/* BUỔI SÁNG SECTION (4 Periods) */}
              {[1, 2, 3, 4].map((period, periodIdx) => (
                <tr key={`morning-period-${period}`} className="hover:bg-amber-50/30 dark:hover:bg-slate-800/50 transition-colors">
                  {periodIdx === 0 && (
                    <td
                      rowSpan={4}
                      className="p-3 text-center align-middle font-black bg-amber-500/10 text-amber-700 dark:text-amber-300 border-r border-amber-200 dark:border-amber-900/50 uppercase tracking-wider text-xs sm:text-sm"
                    >
                      <div className="flex flex-col items-center justify-center gap-1.5">
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

                    // Check if hidden by subject filter
                    const isFilteredOut = rule && subjectFilter !== 'all' && (rule.subject || 'Tin học') !== subjectFilter;

                    if (rule && !isFilteredOut) {
                      const subjectStyle = getSubjectColorStyle(rule.subject);
                      return (
                        <td key={`${dayOfWeek}-Sáng-${period}`} className="p-1.5 border-r border-slate-200 dark:border-slate-700 align-middle">
                          <div className={`p-2 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${subjectStyle.bgLight} ${subjectStyle.borderClass} group relative`}>
                            {/* Prominent Subject Name */}
                            <span className={`text-[11px] sm:text-xs font-black uppercase tracking-wider ${subjectStyle.textClass}`}>
                              {rule.subject || 'TIN HỌC'}
                            </span>
                            {/* Class Name Directly Below */}
                            <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white mt-0.5">
                              Lớp {rule.className}
                            </span>

                            {/* Dropdown for quick edit/clear */}
                            <div className="mt-1 w-full max-w-[110px]">
                              <ClassSelectDropdown
                                value={rule.className}
                                assignedClasses={assignedClasses}
                                onSelect={(selectedCls) => handleCellClassChange(dayOfWeek, 'Sáng', period, selectedCls, rule.subject || activeSubject)}
                                onClear={() => handleCellClassChange(dayOfWeek, 'Sáng', period, '')}
                                onQuickAddClass={handleQuickAddClassFromDropdown}
                                dayOfWeek={dayOfWeek}
                                session="Sáng"
                                period={period}
                                existingRules={rules}
                                currentRuleId={rule.id}
                                compact={true}
                              />
                            </div>
                          </div>
                        </td>
                      );
                    }

                    return (
                      <td key={`${dayOfWeek}-Sáng-${period}`} className="p-1.5 border-r border-slate-200 dark:border-slate-700 align-middle">
                        <ClassSelectDropdown
                          value=""
                          assignedClasses={assignedClasses}
                          onSelect={(selectedCls) => handleCellClassChange(dayOfWeek, 'Sáng', period, selectedCls, activeSubject)}
                          onClear={() => handleCellClassChange(dayOfWeek, 'Sáng', period, '')}
                          onQuickAddClass={handleQuickAddClassFromDropdown}
                          dayOfWeek={dayOfWeek}
                          session="Sáng"
                          period={period}
                          existingRules={rules}
                          compact={true}
                          placeholder="Chọn lớp"
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* BUỔI CHIỀU SECTION (3 Periods) */}
              {[1, 2, 3].map((period, periodIdx) => (
                <tr key={`afternoon-period-${period}`} className="hover:bg-indigo-50/30 dark:hover:bg-slate-800/50 transition-colors">
                  {periodIdx === 0 && (
                    <td
                      rowSpan={3}
                      className="p-3 text-center align-middle font-black bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-r border-indigo-200 dark:border-indigo-900/50 uppercase tracking-wider text-xs sm:text-sm border-t-2 border-t-slate-300 dark:border-t-slate-600"
                    >
                      <div className="flex flex-col items-center justify-center gap-1.5">
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

                    const isFilteredOut = rule && subjectFilter !== 'all' && (rule.subject || 'Tin học') !== subjectFilter;

                    if (rule && !isFilteredOut) {
                      const subjectStyle = getSubjectColorStyle(rule.subject);
                      return (
                        <td key={`${dayOfWeek}-Chiều-${period}`} className={`p-1.5 border-r border-slate-200 dark:border-slate-700 align-middle ${periodIdx === 0 ? 'border-t-2 border-t-slate-300 dark:border-t-slate-600' : ''}`}>
                          <div className={`p-2 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${subjectStyle.bgLight} ${subjectStyle.borderClass} group relative`}>
                            {/* Prominent Subject Name */}
                            <span className={`text-[11px] sm:text-xs font-black uppercase tracking-wider ${subjectStyle.textClass}`}>
                              {rule.subject || 'TIN HỌC'}
                            </span>
                            {/* Class Name Directly Below */}
                            <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white mt-0.5">
                              Lớp {rule.className}
                            </span>

                            {/* Dropdown for quick edit/clear */}
                            <div className="mt-1 w-full max-w-[110px]">
                              <ClassSelectDropdown
                                value={rule.className}
                                assignedClasses={assignedClasses}
                                onSelect={(selectedCls) => handleCellClassChange(dayOfWeek, 'Chiều', period, selectedCls, rule.subject || activeSubject)}
                                onClear={() => handleCellClassChange(dayOfWeek, 'Chiều', period, '')}
                                onQuickAddClass={handleQuickAddClassFromDropdown}
                                dayOfWeek={dayOfWeek}
                                session="Chiều"
                                period={period}
                                existingRules={rules}
                                currentRuleId={rule.id}
                                compact={true}
                              />
                            </div>
                          </div>
                        </td>
                      );
                    }

                    return (
                      <td key={`${dayOfWeek}-Chiều-${period}`} className={`p-1.5 border-r border-slate-200 dark:border-slate-700 align-middle ${periodIdx === 0 ? 'border-t-2 border-t-slate-300 dark:border-t-slate-600' : ''}`}>
                        <ClassSelectDropdown
                          value=""
                          assignedClasses={assignedClasses}
                          onSelect={(selectedCls) => handleCellClassChange(dayOfWeek, 'Chiều', period, selectedCls, activeSubject)}
                          onClear={() => handleCellClassChange(dayOfWeek, 'Chiều', period, '')}
                          onQuickAddClass={handleQuickAddClassFromDropdown}
                          dayOfWeek={dayOfWeek}
                          session="Chiều"
                          period={period}
                          existingRules={rules}
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

        {/* ASSIGNED RULES LIST (REQUIREMENT 7) */}
        <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-700/60">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h4 className="font-extrabold text-xs sm:text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <span>📋 Danh sách các tiết đã phân công ({displayedRules.length} tiết)</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsListExpanded(!isListExpanded)}
                className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-700/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 font-bold text-xs transition-all flex items-center gap-1"
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
                className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors shrink-0"
              >
                Xóa tất cả TKB
              </button>
            )}
          </div>

          {/* Expanded Content with Clean Layout & Larger Text */}
          {isListExpanded && (
            <div className="animate-in fade-in duration-200">
              {displayedRules.length === 0 ? (
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-center text-xs sm:text-sm text-slate-400 italic font-medium">
                  Chưa phân công tiết nào trong Thời khóa biểu. Hãy chọn Lớp dạy trong bảng phía trên.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto p-1">
                  {displayedRules
                    .sort((a, b) => {
                      const dayOrder = DAYS_OF_WEEK.indexOf(a.dayOfWeek) - DAYS_OF_WEEK.indexOf(b.dayOfWeek);
                      if (dayOrder !== 0) return dayOrder;
                      const sessA = getNormalizedSession(a);
                      const sessB = getNormalizedSession(b);
                      if (sessA !== sessB) return sessA === 'Sáng' ? -1 : 1;
                      return getNormalizedPeriod(a) - getNormalizedPeriod(b);
                    })
                    .map((rule) => {
                      const subjectStyle = getSubjectColorStyle(rule.subject);
                      const normSession = getNormalizedSession(rule);
                      const normPeriod = getNormalizedPeriod(rule);

                      return (
                        <div
                          key={rule.id}
                          className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${subjectStyle.bgLight} ${subjectStyle.borderClass}`}
                        >
                          <div className="space-y-1 truncate pr-2">
                            {/* Row 1: Day • Session • Period (Large & Clear) */}
                            <div className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                              <span className="text-blue-600 dark:text-blue-400">{rule.dayOfWeek}</span>
                              <span className="text-slate-400">•</span>
                              <span>{normSession}</span>
                              <span className="text-slate-400">•</span>
                              <span className="bg-slate-200/80 dark:bg-slate-700 px-1.5 py-0.5 rounded-md text-[11px]">
                                Tiết {normPeriod}
                              </span>
                            </div>

                            {/* Row 2: Editable SUBJECT & CLASS */}
                            <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                              <select
                                value={rule.subject || availableSubjects[0] || 'Tin học'}
                                onChange={(e) => handleUpdateRuleSubject(rule.id, e.target.value)}
                                className={`px-2 py-0.5 rounded-lg text-xs font-black uppercase tracking-wide border cursor-pointer ${subjectStyle.badgeClass} focus:outline-none focus:ring-1 focus:ring-blue-500`}
                              >
                                {availableSubjects.map((sub) => (
                                  <option key={sub} value={sub}>
                                    {sub}
                                  </option>
                                ))}
                              </select>

                              <ClassSelectDropdown
                                value={rule.className}
                                assignedClasses={assignedClasses}
                                onSelect={(selectedCls) => handleUpdateRuleClass(rule.id, selectedCls)}
                                onClear={() => handleDeleteRule(rule.id)}
                                onQuickAddClass={handleQuickAddClassFromDropdown}
                                dayOfWeek={rule.dayOfWeek}
                                session={normSession}
                                period={normPeriod}
                                existingRules={rules}
                                currentRuleId={rule.id}
                                compact={true}
                              />
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteRule(rule.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors shrink-0"
                            title="Xóa tiết này"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
