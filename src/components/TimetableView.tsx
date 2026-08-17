import React, { useState, useMemo } from 'react';
import { 
  Clock, 
  School, 
  Plus, 
  Trash2, 
  Sparkles, 
  X, 
  Filter,
  Calendar,
  Layers,
  ListFilter
} from 'lucide-react';
import { TeacherProfile, ClassTimetableRule, TimetableVersion } from '../types';
import { ClassSelectDropdown } from './ClassSelectDropdown';
import { 
  inferGradeFromClassName, 
  normalizeClassName, 
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
  onDeleteTimetableVersion?: (versionId: string) => Promise<void> | void;
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
  onDeleteTimetableVersion,
  onAutoGenerateSchedule,
}) => {
  const [rules, setRules] = useState<ClassTimetableRule[]>([...timetableRules]);
  const [addClassInput, setAddClassInput] = useState('');
  const [applyFromWeek, setApplyFromWeek] = useState<number>(currentWeek || 1);
  const [versionNameInput, setVersionNameInput] = useState<string>('');
  
  // Selected timetable version for management / deletion
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState<boolean>(false);
  const [versionToDelete, setVersionToDelete] = useState<TimetableVersion | null>(null);
  const [isDeletingVersion, setIsDeletingVersion] = useState<boolean>(false);

  // Sync selectedVersionId if deleted or missing from timetableVersions
  React.useEffect(() => {
    if (selectedVersionId && !timetableVersions.some(v => v.id === selectedVersionId)) {
      setSelectedVersionId(null);
    }
  }, [timetableVersions, selectedVersionId]);

  const selectedVersion = useMemo(() => {
    return timetableVersions.find(v => v.id === selectedVersionId) || null;
  }, [timetableVersions, selectedVersionId]);

  const handleSelectVersion = (v: TimetableVersion) => {
    setSelectedVersionId(v.id);
    if (v.rules && v.rules.length > 0) {
      setRules([...v.rules]);
    }
    setApplyFromWeek(v.fromWeek);
    setVersionNameInput(v.versionName || '');
  };

  const handleConfirmDeleteVersion = async () => {
    if (!versionToDelete || !onDeleteTimetableVersion) return;
    setIsDeletingVersion(true);
    try {
      await onDeleteTimetableVersion(versionToDelete.id);
      setSelectedVersionId(null);
      setShowDeleteConfirmModal(false);
      setVersionToDelete(null);
    } catch (err) {
      console.error('Error deleting timetable version:', err);
    } finally {
      setIsDeletingVersion(false);
    }
  };
  
  // Filter by subject on timetable matrix
  const [subjectFilter, setSubjectFilter] = useState<string>('all');

  // Currently selected subject for quick assignment
  const [activeSubject, setActiveSubject] = useState<string>(
    teacher.subjects[0] || 'Tin học'
  );

  // Expand / collapse state for assigned rules list
  const [isListExpanded, setIsListExpanded] = useState(false);

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
    if (!cleaned) {
      alert('Vui lòng nhập tên lớp mới (ví dụ: 3A1, 4A2)!');
      return;
    }

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
    <div className="space-y-3 pb-8 max-w-[1600px] mx-auto animate-fadeIn font-sans">
      
      {/* 1. TOP HEADER & PHIÊN BẢN TKB (COMPACT BAR) */}
      <div className="bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white uppercase tracking-wide leading-tight">
              THỜI KHÓA BIỂU CỐ ĐỊNH
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Bảng điều khiển phân công tiết dạy và quản lý phiên bản TKB áp dụng theo tuần
            </p>
          </div>
        </div>

        {/* Action Button: Auto-generate 35-week schedule */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            id="btn-auto-generate-tkb-35w"
            onClick={() => {
              onAutoGenerateSchedule();
              alert('⚡ Đã lập Lịch báo giảng 35 tuần tự động từ Thời khóa biểu!');
            }}
            className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-bold shadow-xs shadow-emerald-600/20 transition-all flex items-center justify-center space-x-1.5 cursor-pointer border border-emerald-500/30 whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>⚡ Lập Lịch Báo Giảng Tự Động (35 Tuần)</span>
          </button>
        </div>
      </div>

      {/* 2. THANH QUẢN LÝ PHIÊN BẢN TKB (COMPACT VERSION BAR) */}
      <div className="bg-slate-900 text-white px-3.5 py-2.5 rounded-xl border border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-2.5 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-extrabold text-indigo-400 uppercase tracking-wider text-[11px] shrink-0 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" />
            <span>Phiên bản TKB:</span>
          </span>

          <div className="flex items-center gap-1.5 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700">
            <span className="text-[11px] text-slate-300 font-medium whitespace-nowrap">Áp dụng từ tuần:</span>
            <select
              value={applyFromWeek}
              onChange={(e) => setApplyFromWeek(Number(e.target.value))}
              className="bg-transparent text-xs font-black text-indigo-300 focus:outline-none cursor-pointer"
            >
              {Array.from({ length: 35 }, (_, i) => i + 1).map((w) => (
                <option key={w} value={w} className="bg-slate-900 text-white">Tuần {w}</option>
              ))}
            </select>
          </div>

          <input
            type="text"
            value={versionNameInput}
            onChange={(e) => setVersionNameInput(e.target.value)}
            placeholder="Tên phiên bản (ví dụ: TKB HK2)..."
            className="px-2.5 py-1 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 w-48 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Existing Version Badges */}
        {timetableVersions && timetableVersions.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            <span className="text-[10px] text-slate-400 font-semibold uppercase">Đã lưu:</span>
            {timetableVersions.map((v) => {
              const isSelected = selectedVersionId === v.id;
              const isAppliesToWeek = applyFromWeek >= v.fromWeek && applyFromWeek <= v.toWeek;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => handleSelectVersion(v)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs ring-1 ring-indigo-400'
                      : isAppliesToWeek
                      ? 'bg-indigo-950/80 text-indigo-300 border-indigo-700'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500'
                  }`}
                >
                  <span>{v.versionName || 'TKB'}</span>
                  <span className="opacity-75 text-[10px] font-mono">(T{v.fromWeek}–T{v.toWeek})</span>
                </button>
              );
            })}

            {selectedVersion && (
              <button
                type="button"
                onClick={() => {
                  setVersionToDelete(selectedVersion);
                  setShowDeleteConfirmModal(true);
                }}
                className="px-2 py-0.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded-md text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer ml-1"
                title="Xóa phiên bản TKB đang chọn"
              >
                <Trash2 className="w-3 h-3" />
                <span>Xóa</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. BỐ CỤC CHÍNH 2 CỘT (DESKTOP): CỘT TRÁI (28-30%) | CỘT PHẢI (70-72%)    */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
        
        {/* =================================================== */}
        {/* CỘT TRÁI: PANEL PHÂN CÔNG TKB & THỐNG KÊ (28-32%) */}
        {/* =================================================== */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-3">
          
          {/* CARD CHÍNH: PHÂN CÔNG TKB */}
          <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
            
            {/* THỐNG KÊ TIẾT DẠY (GỌN GÀNG Ở ĐẦU PANEL) */}
            <div className="p-2.5 bg-slate-50 dark:bg-slate-900/70 rounded-lg border border-slate-200 dark:border-slate-700/80 space-y-1.5">
              <div className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                THỐNG KÊ TIẾT DẠY
              </div>
              <div className="space-y-1">
                {subjectStats.map((stat) => (
                  <div key={stat.subject} className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1">
                      <span>{stat.style.icon}</span>
                      <span className="uppercase">{stat.subject}:</span>
                    </span>
                    <span className="font-black text-blue-600 dark:text-blue-400">
                      {stat.count} tiết/tuần
                    </span>
                  </div>
                ))}
                <div className="pt-1 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs font-black text-slate-900 dark:text-white">
                  <span className="uppercase">TỔNG CỘNG:</span>
                  <span className="text-slate-900 dark:text-white bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-[11px]">
                    {totalLessonsCount} tiết/tuần
                  </span>
                </div>
              </div>
            </div>

            {/* TIÊU ĐỀ PANEL */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-2">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wide">
                  PHÂN CÔNG TKB
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">Nhập nhanh</span>
            </div>

            {/* CÁC TRƯỜNG NHẬP LIỆU XẾP THEO CHIỀU DỌC (100% WIDTH) */}
            <div className="space-y-2 text-xs">
              
              {/* Thứ */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Thứ
                </label>
                <select
                  value={newRule.dayOfWeek}
                  onChange={(e) => setNewRule({ ...newRule, dayOfWeek: e.target.value as any })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-xs text-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
                >
                  {DAYS_OF_WEEK.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Buổi */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Buổi
                </label>
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
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-xs text-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Sáng">Sáng</option>
                  <option value="Chiều">Chiều</option>
                </select>
              </div>

              {/* Tiết */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Tiết
                </label>
                <select
                  value={newRule.period}
                  onChange={(e) => setNewRule({ ...newRule, period: parseInt(e.target.value) || 1 })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-xs text-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
                >
                  {(newRule.session === 'Sáng' ? [1, 2, 3, 4] : [1, 2, 3]).map(p => (
                    <option key={p} value={p}>Tiết {p}</option>
                  ))}
                </select>
              </div>

              {/* Môn học */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Môn học
                </label>
                <select
                  value={newRule.subject}
                  onChange={(e) => setNewRule({ ...newRule, subject: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-blue-50/50 dark:bg-slate-900 border border-blue-500/40 rounded-lg font-extrabold text-xs text-blue-700 dark:text-blue-300 focus:outline-none focus:border-blue-500"
                >
                  {availableSubjects.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Lớp dạy */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Lớp dạy
                </label>
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

              {/* NÚT THÊM TKB */}
              <div className="pt-1.5">
                <button
                  type="button"
                  id="btn-add-tkb-rule"
                  onClick={handleAddRuleFromForm}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg font-extrabold text-xs shadow-xs shadow-blue-600/30 flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ THÊM TKB</span>
                </button>
              </div>
            </div>

          </div>

          {/* SUB-CARD: QUẢN LÝ DANH SÁCH LỚP DẠY (ASSIGNED CLASSES) */}
          <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1">
                <School className="w-3.5 h-3.5 text-blue-500" />
                <span>Lớp phụ trách ({assignedClasses.length}):</span>
              </span>
            </div>

            {/* Danh sách thẻ lớp */}
            <div className="flex flex-wrap items-center gap-1.5 max-h-28 overflow-y-auto p-1 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
              {assignedClasses.length === 0 ? (
                <span className="text-[11px] text-amber-500 italic p-1">Chưa có lớp nào</span>
              ) : (
                assignedClasses.map((cls) => (
                  <span
                    key={cls}
                    className="px-2 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 dark:text-slate-200 shadow-2xs"
                  >
                    <span>{cls}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveClass(cls)}
                      className="text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                      title={`Xóa lớp ${cls}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Thêm lớp mới */}
            <form onSubmit={handleAddClass} className="flex items-center gap-1.5">
              <input
                type="text"
                value={addClassInput}
                onChange={(e) => setAddClassInput(e.target.value)}
                placeholder="+ Thêm lớp (ví dụ: 4A1)..."
                className="flex-1 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold shrink-0 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Thêm</span>
              </button>
            </form>
          </div>

        </div>

        {/* =================================================== */}
        {/* CỘT PHẢI: BẢNG THỜI KHÓA BIỂU (68-72%)             */}
        {/* =================================================== */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-3 min-w-0">
          
          {/* CARD CHÍNH CỘT PHẢI */}
          <div className="bg-white dark:bg-slate-800 p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
            
            {/* TOP BAR BẢNG TKB: LỌC MÔN & MÔN PHÂN CÔNG NHANH */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100 dark:border-slate-700/60 text-xs">
              
              {/* Lọc môn học */}
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span className="font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap text-[11px]">
                  Hiển thị môn:
                </span>
                <select
                  value={subjectFilter}
                  onChange={(e) => setSubjectFilter(e.target.value)}
                  className="px-2.5 py-1 bg-slate-50 dark:bg-slate-900 border border-blue-500/30 rounded-lg text-xs font-bold text-blue-700 dark:text-blue-300 focus:outline-none cursor-pointer"
                >
                  <option value="all">Tất cả môn học</option>
                  {availableSubjects.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>

              {/* Môn đang phân công nhanh */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-slate-400 hidden sm:inline">Phân công nhanh:</span>
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
                      className={`px-2.5 py-0.5 rounded-md text-[11px] font-black transition-all flex items-center gap-1 border cursor-pointer ${
                        isActive
                          ? `${style.badgeSolid} shadow-2xs scale-105`
                          : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                      }`}
                    >
                      <span>{style.icon}</span>
                      <span>{sub}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* BẢNG THỜI KHÓA BIỂU MATRIX (TABLE CONTAINER) */}
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xs max-h-[calc(100vh-280px)] lg:max-h-none overflow-y-auto">
              <table className="w-full text-left border-collapse min-w-[650px]">
                <thead>
                  <tr className="bg-slate-100/95 dark:bg-slate-900/95 text-slate-800 dark:text-slate-200 text-xs font-extrabold border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
                    <th className="p-2 sm:p-2.5 border-r border-slate-200 dark:border-slate-700 w-16 text-center font-black uppercase bg-slate-200/60 dark:bg-slate-900">
                      Buổi
                    </th>
                    <th className="p-2 sm:p-2.5 border-r border-slate-200 dark:border-slate-700 w-16 text-center font-black uppercase bg-slate-200/40 dark:bg-slate-900">
                      Tiết
                    </th>
                    {DAYS_OF_WEEK.map((day) => (
                      <th key={day} className="p-2 sm:p-2.5 border-r border-slate-200 dark:border-slate-700 text-center font-black uppercase">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-xs">
                  
                  {/* BUỔI SÁNG (4 Tiết) */}
                  {[1, 2, 3, 4].map((period, periodIdx) => (
                    <tr key={`morning-period-${period}`} className="hover:bg-amber-50/20 dark:hover:bg-slate-800/40 transition-colors">
                      {periodIdx === 0 && (
                        <td
                          rowSpan={4}
                          className="p-2 text-center align-middle font-black bg-amber-500/10 text-amber-700 dark:text-amber-300 border-r border-amber-200 dark:border-amber-900/50 uppercase tracking-wider text-xs"
                        >
                          <div className="flex flex-col items-center justify-center gap-0.5">
                            <span>Sáng</span>
                            <span className="text-[10px] font-normal text-amber-600/80 dark:text-amber-400/80">(4T)</span>
                          </div>
                        </td>
                      )}
                      <td className="p-2 font-bold text-center bg-slate-50/70 dark:bg-slate-900/70 border-r border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs">
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
                            <td key={`${dayOfWeek}-Sáng-${period}`} className="p-1 border-r border-slate-200 dark:border-slate-700 align-middle">
                              <div className={`p-1.5 rounded-lg border flex flex-col items-center justify-center text-center transition-all ${subjectStyle.bgLight} ${subjectStyle.borderClass} group relative`}>
                                {/* Subject Name */}
                                <span className={`text-[10px] font-black uppercase tracking-wider leading-tight ${subjectStyle.textClass}`}>
                                  {rule.subject || 'TIN HỌC'}
                                </span>
                                {/* Class Name */}
                                <span className="text-xs font-black text-slate-900 dark:text-white mt-0.5">
                                  Lớp {rule.className}
                                </span>

                                {/* Dropdown for quick edit/clear */}
                                <div className="mt-1 w-full max-w-[100px]">
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
                          <td key={`${dayOfWeek}-Sáng-${period}`} className="p-1 border-r border-slate-200 dark:border-slate-700 align-middle">
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

                  {/* BUỔI CHIỀU (3 Tiết) */}
                  {[1, 2, 3].map((period, periodIdx) => (
                    <tr key={`afternoon-period-${period}`} className="hover:bg-indigo-50/20 dark:hover:bg-slate-800/40 transition-colors">
                      {periodIdx === 0 && (
                        <td
                          rowSpan={3}
                          className="p-2 text-center align-middle font-black bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-r border-indigo-200 dark:border-indigo-900/50 uppercase tracking-wider text-xs border-t-2 border-t-slate-300 dark:border-t-slate-600"
                        >
                          <div className="flex flex-col items-center justify-center gap-0.5">
                            <span>Chiều</span>
                            <span className="text-[10px] font-normal text-indigo-600/80 dark:text-indigo-400/80">(3T)</span>
                          </div>
                        </td>
                      )}
                      <td className={`p-2 font-bold text-center bg-slate-50/70 dark:bg-slate-900/70 border-r border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs ${periodIdx === 0 ? 'border-t-2 border-t-slate-300 dark:border-t-slate-600' : ''}`}>
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
                            <td key={`${dayOfWeek}-Chiều-${period}`} className={`p-1 border-r border-slate-200 dark:border-slate-700 align-middle ${periodIdx === 0 ? 'border-t-2 border-t-slate-300 dark:border-t-slate-600' : ''}`}>
                              <div className={`p-1.5 rounded-lg border flex flex-col items-center justify-center text-center transition-all ${subjectStyle.bgLight} ${subjectStyle.borderClass} group relative`}>
                                {/* Subject Name */}
                                <span className={`text-[10px] font-black uppercase tracking-wider leading-tight ${subjectStyle.textClass}`}>
                                  {rule.subject || 'TIN HỌC'}
                                </span>
                                {/* Class Name */}
                                <span className="text-xs font-black text-slate-900 dark:text-white mt-0.5">
                                  Lớp {rule.className}
                                </span>

                                {/* Dropdown for quick edit/clear */}
                                <div className="mt-1 w-full max-w-[100px]">
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
                          <td key={`${dayOfWeek}-Chiều-${period}`} className={`p-1 border-r border-slate-200 dark:border-slate-700 align-middle ${periodIdx === 0 ? 'border-t-2 border-t-slate-300 dark:border-t-slate-600' : ''}`}>
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

            {/* DANH SÁCH CÁC TIẾT ĐÃ PHÂN CÔNG (COLLAPSIBLE FOOTER) */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-700 dark:text-slate-200 flex items-center gap-1">
                    <ListFilter className="w-3.5 h-3.5 text-blue-500" />
                    <span>Danh sách tiết đã phân công ({displayedRules.length} tiết)</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsListExpanded(!isListExpanded)}
                    className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-blue-600 dark:text-blue-400 font-bold text-[11px] transition-all hover:bg-slate-200"
                  >
                    <span>{isListExpanded ? 'Thu gọn ▲' : 'Xem chi tiết ▼'}</span>
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
                    className="text-[11px] font-bold text-red-500 hover:text-red-600 transition-colors shrink-0"
                  >
                    Xóa tất cả TKB
                  </button>
                )}
              </div>

              {/* Expanded Content with Grid */}
              {isListExpanded && (
                <div className="animate-in fade-in duration-200 pt-1">
                  {displayedRules.length === 0 ? (
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg text-center text-xs text-slate-400 italic">
                      Chưa phân công tiết nào trong Thời khóa biểu. Hãy chọn Lớp dạy trong bảng phía trên.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-1">
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
                              className={`p-2 rounded-xl border flex items-center justify-between transition-all ${subjectStyle.bgLight} ${subjectStyle.borderClass}`}
                            >
                              <div className="space-y-0.5 truncate pr-1">
                                <div className="text-[11px] font-black text-slate-800 dark:text-slate-100 flex items-center gap-1">
                                  <span className="text-blue-600 dark:text-blue-400">{rule.dayOfWeek}</span>
                                  <span className="text-slate-400">•</span>
                                  <span>{normSession}</span>
                                  <span className="text-slate-400">•</span>
                                  <span className="bg-slate-200/80 dark:bg-slate-700 px-1 py-0.2 rounded text-[10px]">
                                    Tiết {normPeriod}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1 pt-0.5 flex-wrap">
                                  <select
                                    value={rule.subject || availableSubjects[0] || 'Tin học'}
                                    onChange={(e) => handleUpdateRuleSubject(rule.id, e.target.value)}
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wide border cursor-pointer ${subjectStyle.badgeClass} focus:outline-none`}
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
                                className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors shrink-0"
                                title="Xóa tiết này"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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

      </div>

      {/* MODAL XÁC NHẬN XÓA PHIÊN BẢN TKB */}
      {showDeleteConfirmModal && versionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-xl shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Xác nhận xóa phiên bản TKB
                </h3>
                <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  {versionToDelete.versionName || 'Thời khóa biểu'} (Tuần {versionToDelete.fromWeek} – {versionToDelete.toWeek})
                </p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-1 text-xs text-slate-700 dark:text-slate-300 font-medium">
              <p>Bạn có chắc chắn muốn xóa phiên bản TKB này không?</p>
              <p>Các phiên bản TKB khác sẽ không bị ảnh hưởng.</p>
              <p>Lịch báo giảng đã lưu cũng không bị xóa.</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirmModal(false);
                  setVersionToDelete(null);
                }}
                disabled={isDeletingVersion}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteVersion}
                disabled={isDeletingVersion}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isDeletingVersion ? (
                  <span>Đang xóa...</span>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa phiên bản</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
