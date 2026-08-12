import React, { useState, useEffect, useMemo } from 'react';
import { 
  Settings as SettingsIcon, 
  User, 
  School, 
  BookOpen, 
  Calendar, 
  Save, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Clock,
  Sparkles,
  X,
  AlertCircle,
  AlertTriangle,
  RotateCcw,
  Sun,
  Moon,
  Info,
  Printer
} from 'lucide-react';
import { TeacherProfile, ClassTimetableRule, PrintSettings, DEFAULT_PRINT_SETTINGS, AcademicYearConfig, TimetableVersion } from '../types';
import { ClassSelectDropdown } from './ClassSelectDropdown';
import { PrintDesignerComponent } from './PrintDesignerComponent';
import { PRIMARY_SUBJECTS } from '../data/primaryCurriculums';
import { getSubjectColorStyle } from '../utils/subjectUtils';
import { getWeekRange, diffDaysUTC, addDaysUTC } from '../utils/dateWeekUtils';
import { getTimetableVersionForWeek } from '../utils/timetableUtils';
import { 
  inferGradeFromClassName, 
  normalizeClassName, 
  getPeriodName, 
  getFullPeriodLabel,
  getNormalizedSession,
  getNormalizedPeriod
} from '../utils/classUtils';

interface SettingsViewProps {
  teacher: TeacherProfile;
  timetableRules: ClassTimetableRule[];
  printSettings?: PrintSettings;
  academicYearConfig?: AcademicYearConfig;
  timetableVersions?: TimetableVersion[];
  onSaveProfile: (profile: TeacherProfile) => void;
  onSaveTimetableRules: (rules: ClassTimetableRule[]) => void;
  onSavePrintSettings?: (settings: PrintSettings) => void;
  onSaveAcademicYearConfig?: (config: AcademicYearConfig) => void;
  onAutoGenerateSchedule: () => void;
  onOpenPreviewModal?: () => void;
}

const DAYS_OF_WEEK: Array<'Thứ 2' | 'Thứ 3' | 'Thứ 4' | 'Thứ 5' | 'Thứ 6'> = [
  'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6'
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  teacher,
  timetableRules,
  printSettings = DEFAULT_PRINT_SETTINGS,
  academicYearConfig,
  timetableVersions = [],
  onSaveProfile,
  onSaveTimetableRules,
  onSavePrintSettings,
  onSaveAcademicYearConfig,
  onAutoGenerateSchedule,
  onOpenPreviewModal,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'print_template' | 'academic_week'>('profile');
  const [profileForm, setProfileForm] = useState<TeacherProfile>({ ...teacher });
  const [rules, setRules] = useState<ClassTimetableRule[]>([...timetableRules]);
  
  // Academic Year Week Management State
  const [week1StartDate, setWeek1StartDate] = useState<string>(
    academicYearConfig?.week1StartDate || '2026-09-01'
  );
  const [totalWeeks, setTotalWeeks] = useState<number>(
    academicYearConfig?.totalWeeks || 35
  );
  const [customWeekMap, setCustomWeekMap] = useState<Record<number, { startDate: string; endDate: string }>>(
    academicYearConfig?.customWeekMap || {}
  );
  const [selectedWeekToEdit, setSelectedWeekToEdit] = useState<number>(1);
  const [editingWeekStartDate, setEditingWeekStartDate] = useState<string>('2026-09-01');
  const [weekConfigSavedMsg, setWeekConfigSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    if (academicYearConfig) {
      setWeek1StartDate(academicYearConfig.week1StartDate || '2026-09-01');
      setTotalWeeks(academicYearConfig.totalWeeks || 35);
      setCustomWeekMap(academicYearConfig.customWeekMap || {});
    }
  }, [academicYearConfig]);

  useEffect(() => {
    const range = getWeekRange(selectedWeekToEdit, week1StartDate, customWeekMap);
    setEditingWeekStartDate(range.startDate);
  }, [selectedWeekToEdit, week1StartDate]);

  // Validation Warnings Check
  const validationWarnings = useMemo(() => {
    const warnings: string[] = [];
    for (let w = 1; w <= totalWeeks - 1; w++) {
      const curr = getWeekRange(w, week1StartDate, customWeekMap);
      const next = getWeekRange(w + 1, week1StartDate, customWeekMap);

      if (next.startDate <= curr.startDate) {
        warnings.push(`Tuần ${w + 1} (${next.startDateFormatted}) có ngày bắt đầu nhỏ hơn hoặc bằng ngày bắt đầu Tuần ${w} (${curr.startDateFormatted}).`);
      } else if (next.startDate <= curr.endDate) {
        warnings.push(`Tuần ${w + 1} (bắt đầu ${next.startDateFormatted}) bị trùng lặp ngày với Tuần ${w} (kết thúc ${curr.endDateFormatted}).`);
      } else {
        const gap = diffDaysUTC(next.startDate, curr.endDate) - 1;
        if (gap > 0) {
          warnings.push(`Giữa Tuần ${w} (kết thúc ${curr.endDateFormatted}) và Tuần ${w + 1} (bắt đầu ${next.startDateFormatted}) có ${gap} ngày bị bỏ trống.`);
        }
      }
    }
    return warnings;
  }, [totalWeeks, week1StartDate, customWeekMap]);
  const [addClassInput, setAddClassInput] = useState('');
  const [addSubjectInput, setAddSubjectInput] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>(
    teacher.subjects[0] || 'Tin học'
  );

  // Sync profileForm with teacher prop when teacher changes (e.g. from Firestore load)
  useEffect(() => {
    setProfileForm({ ...teacher });
    console.log('SETTINGS SUBJECT LOAD', {
      UID: teacher.uid || 'no-uid',
      'ASSIGNED SUBJECTS': teacher.subjects || [],
    });
  }, [teacher]);

  const currentSubjects = profileForm.subjects || ['Tin học'];

  // Handlers for MÔN HỌC ĐƯỢC PHÂN CÔNG
  const handleToggleSubject = (subjectName: string) => {
    const before = [...currentSubjects];
    let after: string[];
    if (before.includes(subjectName)) {
      if (before.length <= 1) {
        alert('Phải giữ tối thiểu 1 môn học được phân công!');
        return;
      }
      after = before.filter(s => s !== subjectName);
    } else {
      after = [...before, subjectName];
    }

    console.log('SETTINGS SUBJECT TOGGLE', {
      SUBJECT: subjectName,
      BEFORE: before,
      AFTER: after,
    });

    const updatedProfile = { ...profileForm, subjects: after };
    setProfileForm(updatedProfile);
    onSaveProfile(updatedProfile);
  };

  const handleAddCustomSubject = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = addSubjectInput.trim();
    if (!trimmed) {
      alert('Vui lòng nhập tên môn học cần thêm (ví dụ: Kỹ năng sống, Ngoại ngữ 2)!');
      return;
    }

    const before = [...currentSubjects];
    if (before.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
      alert(`Môn "${trimmed}" đã có trong danh sách phân công!`);
      return;
    }

    const after = [...before, trimmed];
    console.log('SETTINGS SUBJECT TOGGLE', {
      SUBJECT: trimmed,
      BEFORE: before,
      AFTER: after,
    });

    const updatedProfile = { ...profileForm, subjects: after };
    setProfileForm(updatedProfile);
    onSaveProfile(updatedProfile);
    setAddSubjectInput('');
    alert(`✅ Đã thêm môn "${trimmed}" vào danh sách phân công thành công!`);
  };

  const handleRemoveSubject = (subjectToRemove: string) => {
    const before = [...currentSubjects];
    if (before.length <= 1) {
      alert('Phải giữ tối thiểu 1 môn học được phân công!');
      return;
    }
    const after = before.filter(s => s !== subjectToRemove);
    console.log('SETTINGS SUBJECT TOGGLE', {
      SUBJECT: subjectToRemove,
      BEFORE: before,
      AFTER: after,
    });
    const updatedProfile = { ...profileForm, subjects: after };
    setProfileForm(updatedProfile);
    onSaveProfile(updatedProfile);
  };


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

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(profileForm);
    alert('Đã lưu thông tin Giáo viên & Danh sách Lớp học thành công!');
  };

  // Add new class to assignedClasses list
  const handleAddClass = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleaned = normalizeClassName(addClassInput);
    if (!cleaned) {
      alert('Vui lòng nhập mã/tên lớp mới (ví dụ: 3A1, 4A2)!');
      return;
    }

    const currentClasses = profileForm.assignedClasses || [];
    if (currentClasses.includes(cleaned)) {
      alert(`Lớp ${cleaned} đã tồn tại trong danh sách!`);
      return;
    }

    const updatedClasses = [...currentClasses, cleaned].sort();
    const updatedProfile = { ...profileForm, assignedClasses: updatedClasses };
    setProfileForm(updatedProfile);
    onSaveProfile(updatedProfile);
    setAddClassInput('');
    alert(`✅ Đã thêm lớp "${cleaned}" vào danh sách phân công thành công!`);
  };

  // Quick add class from dropdown callback
  const handleQuickAddClassFromDropdown = (className: string) => {
    const cleaned = normalizeClassName(className);
    if (!cleaned) return;

    const currentClasses = profileForm.assignedClasses || [];
    if (!currentClasses.includes(cleaned)) {
      const updatedClasses = [...currentClasses, cleaned].sort();
      const updatedProfile = { ...profileForm, assignedClasses: updatedClasses };
      setProfileForm(updatedProfile);
      onSaveProfile(updatedProfile);
    }
  };

  // Remove class from assignedClasses list
  const handleRemoveClass = (clsToRemove: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa lớp ${clsToRemove} khỏi danh sách? các tiết của lớp này trong TKB cố định cũng sẽ được dọn dẹp.`)) {
      return;
    }

    const currentClasses = profileForm.assignedClasses || [];
    const updatedClasses = currentClasses.filter(c => c !== clsToRemove);
    const updatedProfile = { ...profileForm, assignedClasses: updatedClasses };
    setProfileForm(updatedProfile);
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

  const assignedClasses = profileForm.assignedClasses || [];

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Page Header & Navigation Tabs */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <SettingsIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <span>Cài Đặt Hệ Thống</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Quản lý thông tin hồ sơ giáo viên, danh sách lớp học và tùy chỉnh giao diện Mẫu In Lịch Báo Giảng.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Hồ Sơ & Danh Sách Lớp</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('print_template')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'print_template'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>Thiết Kế Mẫu In</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('academic_week')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'academic_week'
                ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Tuần Học</span>
          </button>
        </div>
      </div>

      {activeTab === 'academic_week' ? (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-700 pb-4">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  <span>Quản Lý Tuần Học (Năm học {teacher.academicYear || '2026-2027'})</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Mỗi tuần có thể có ngày bắt đầu riêng bằng Date Picker. Lịch báo giảng (weeklySchedules) sẽ liên kết theo weekNumber và hiển thị chính xác khoảng ngày đã cấu hình.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (onSaveAcademicYearConfig) {
                    onSaveAcademicYearConfig({
                      academicYear: teacher.academicYear || '2026-2027',
                      week1StartDate,
                      totalWeeks,
                      customWeekMap,
                      updatedAt: new Date().toISOString()
                    });
                    setWeekConfigSavedMsg('Đã lưu cấu hình ngày các tuần học thành công!');
                    setTimeout(() => setWeekConfigSavedMsg(null), 3000);
                  }
                }}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 shrink-0"
              >
                <Save className="w-4 h-4" />
                <span>Lưu Cấu Hình Tuần Học</span>
              </button>
            </div>

            {weekConfigSavedMsg && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{weekConfigSavedMsg}</span>
              </div>
            )}

            {/* General Settings: Week 1 Default & Total Weeks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>Mốc Ngày Bắt Đầu Tuần 1 (Gốc Mặc Định)</span>
                </label>
                <input
                  type="date"
                  value={week1StartDate}
                  onChange={(e) => setWeek1StartDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Các tuần chưa có ngày tùy chỉnh sẽ tự động tính từ mốc Tuần 1 này (mỗi tuần +7 ngày).
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>Số Tuần Của Năm Học</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={52}
                  value={totalWeeks}
                  onChange={(e) => setTotalWeeks(Math.max(1, Math.min(52, parseInt(e.target.value, 10) || 35)))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Mặc định 35 tuần theo quy định của Bộ GD&ĐT.
                </p>
              </div>
            </div>

            {/* Quick Single Week Configurator Box */}
            <div className="p-4 bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200/80 dark:border-teal-800/80 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-teal-900 dark:text-teal-200 flex items-center gap-2 uppercase tracking-wide">
                  <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span>Cấu Hình Nhanh Ngày Bắt Đầu Cho Từng Tuần</span>
                </div>
                {Object.keys(customWeekMap).length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCustomWeekMap({})}
                    className="text-[11px] text-rose-600 hover:text-rose-700 dark:text-rose-400 font-bold hover:underline flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Xóa tất cả tùy chỉnh ({Object.keys(customWeekMap).length} tuần)</span>
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                {/* Select Week Box */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Chọn tuần:</span>
                  <select
                    value={selectedWeekToEdit}
                    onChange={(e) => {
                      const w = Number(e.target.value);
                      setSelectedWeekToEdit(w);
                      const range = getWeekRange(w, week1StartDate, customWeekMap);
                      setEditingWeekStartDate(range.startDate);
                    }}
                    className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                  >
                    {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((w) => (
                      <option key={w} value={w}>
                        Tuần {w} {customWeekMap[w] ? '★' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Picker */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Bắt đầu từ ngày:</span>
                  <input
                    type="date"
                    value={editingWeekStartDate}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditingWeekStartDate(val);
                      if (val) {
                        setCustomWeekMap((prev) => ({
                          ...prev,
                          [selectedWeekToEdit]: {
                            startDate: val,
                            endDate: addDaysUTC(val, 6)
                          }
                        }));
                      }
                    }}
                    className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>

                {/* Calculated 7-Day Range */}
                <div className="text-xs font-bold text-slate-700 dark:text-slate-200 px-3 py-1.5 bg-teal-100/60 dark:bg-teal-950/60 rounded-lg border border-teal-200 dark:border-teal-800">
                  Khoảng ngày Tuần {selectedWeekToEdit}: <span className="text-teal-700 dark:text-teal-300">{getWeekRange(selectedWeekToEdit, week1StartDate, customWeekMap).startDateFormatted} → {getWeekRange(selectedWeekToEdit, week1StartDate, customWeekMap).endDateFormatted}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => {
                      const newMap = { ...customWeekMap };
                      let currStart = editingWeekStartDate;
                      for (let w = selectedWeekToEdit; w <= totalWeeks; w++) {
                        newMap[w] = {
                          startDate: currStart,
                          endDate: addDaysUTC(currStart, 6)
                        };
                        currStart = addDaysUTC(currStart, 7);
                      }
                      setCustomWeekMap(newMap);
                    }}
                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
                    title="Tự động tính ngày nối tiếp các tuần tiếp theo từ tuần này (+7 ngày mỗi tuần)"
                  >
                    <span>Nối tiếp các tuần sau</span>
                  </button>

                  {customWeekMap[selectedWeekToEdit] && (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomWeekMap((prev) => {
                          const next = { ...prev };
                          delete next[selectedWeekToEdit];
                          return next;
                        });
                        const range = getWeekRange(selectedWeekToEdit, week1StartDate, {});
                        setEditingWeekStartDate(range.startDate);
                      }}
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition-all"
                    >
                      <span>Khôi phục mặc định</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Validation Warnings Box */}
            {validationWarnings.length > 0 && (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Cảnh Báo Cấu Hình Ngày ({validationWarnings.length} vấn đề):</span>
                </div>
                <ul className="list-disc list-inside text-xs text-amber-700 dark:text-amber-300 space-y-1 pl-1 max-h-36 overflow-y-auto">
                  {validationWarnings.map((warn, idx) => (
                    <li key={idx}>{warn}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Detailed Weeks Table */}
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-700/60">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Info className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span>Danh Sách Tất Cả {totalWeeks} Tuần Trong Năm Học</span>
                </h4>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Đã tùy chỉnh: <strong className="text-teal-600 dark:text-teal-400">{Object.keys(customWeekMap).length}</strong> / {totalWeeks} tuần
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[480px] overflow-y-auto pr-2">
                {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((wNum) => {
                  const range = getWeekRange(wNum, week1StartDate, customWeekMap);
                  const isCustom = Boolean(customWeekMap[wNum]);
                  const activeVersion = getTimetableVersionForWeek(
                    timetableVersions,
                    teacher.academicYear || '2026-2027',
                    wNum
                  );

                  return (
                    <div
                      key={wNum}
                      className={`p-3.5 rounded-xl border transition-all text-xs space-y-2 ${
                        isCustom
                          ? 'bg-teal-50/40 dark:bg-teal-950/20 border-teal-300/80 dark:border-teal-700/80 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-700/60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                            Tuần {wNum}
                          </span>
                          {isCustom ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border border-teal-300 dark:border-teal-800">
                              Tùy chỉnh
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-200/70 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                              Mặc định
                            </span>
                          )}
                        </div>

                        {activeVersion ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                            {activeVersion.versionName}
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded-md text-[10px] text-slate-400 dark:text-slate-500">
                            Chưa TKB
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2 bg-white dark:bg-slate-800/80 p-2 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                        <div className="space-y-1 w-full">
                          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                            Ngày bắt đầu:
                          </label>
                          <input
                            type="date"
                            value={range.startDate}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val) {
                                setCustomWeekMap((prev) => ({
                                  ...prev,
                                  [wNum]: {
                                    startDate: val,
                                    endDate: addDaysUTC(val, 6)
                                  }
                                }));
                              }
                            }}
                            className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs font-bold text-slate-900 dark:text-white"
                          />
                        </div>

                        <div className="space-y-1 shrink-0 text-right">
                          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block">
                            Khoảng ngày:
                          </label>
                          <span className="text-[11px] font-extrabold text-teal-700 dark:text-teal-300 block">
                            {range.startDateFormatted} → {range.endDateFormatted}
                          </span>
                        </div>
                      </div>

                      {isCustom && (
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              setCustomWeekMap((prev) => {
                                const next = { ...prev };
                                delete next[wNum];
                                return next;
                              });
                            }}
                            className="text-[10px] font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:underline"
                          >
                            Xóa tùy chỉnh
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'print_template' ? (
        <PrintDesignerComponent
          teacher={teacher}
          settings={printSettings}
          onSaveSettings={(newSettings) => {
            if (onSavePrintSettings) onSavePrintSettings(newSettings);
          }}
          onOpenPreviewModal={() => {
            if (onOpenPreviewModal) onOpenPreviewModal();
          }}
        />
      ) : (
        /* Grid Layout: Teacher Profile & Class Management */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        
        {/* Card 1: Teacher & School Info */}
        <form onSubmit={handleProfileSubmit} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2 border-b border-slate-100 dark:border-slate-700/60 pb-3">
            <User className="w-5 h-5 text-indigo-500" />
            <span>Hồ Sơ Giáo Viên</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Họ và tên Giáo viên</label>
              <input
                type="text"
                required
                value={profileForm.fullName}
                onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Tên Trường</label>
              <input
                type="text"
                required
                value={profileForm.schoolName}
                onChange={(e) => setProfileForm({ ...profileForm, schoolName: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Năm học</label>
                <select
                  value={profileForm.academicYear}
                  onChange={(e) => setProfileForm({ ...profileForm, academicYear: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white"
                >
                  <option value="2024 - 2025">2024 - 2025</option>
                  <option value="2025 - 2026">2025 - 2026</option>
                  <option value="2026 - 2027">2026 - 2027</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Học kỳ</label>
                <select
                  value={profileForm.semester}
                  onChange={(e) => setProfileForm({ ...profileForm, semester: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white"
                >
                  <option value="Học kỳ I">Học kỳ I</option>
                  <option value="Học kỳ II">Học kỳ II</option>
                </select>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center justify-center space-x-1.5"
          >
            <Save className="w-4 h-4" />
            <span>Lưu thay đổi hồ sơ</span>
          </button>

          {/* Block: Thông tin ứng dụng */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-700/60 space-y-2.5">
            <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
              <Info className="w-3.5 h-3.5 text-indigo-500" />
              <span>Thông tin ứng dụng</span>
            </h4>
            <div className="bg-slate-50 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Tên ứng dụng:</span>
                <span className="font-bold text-slate-900 dark:text-white">Lịch Báo Giảng</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Tác giả:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">Hồng Bích Trâm</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Phiên bản:</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">1.0</span>
              </div>
            </div>
          </div>
        </form>

        {/* Card 2: Quản Lý Danh Sách Lớp Học */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <School className="w-5 h-5 text-blue-500" />
              <span>Quản Lý Danh Sách Lớp Học Phân Công</span>
            </h3>
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-lg">
              {assignedClasses.length} Lớp học
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Danh sách lớp này sẽ tự động xuất hiện trong ô chọn Lớp (Dropdown) ở Thời khóa biểu cố định và Lịch Báo Giảng.
          </p>

          {/* Form add new class */}
          <form onSubmit={handleAddClass} className="flex items-center gap-2">
            <input
              type="text"
              value={addClassInput}
              onChange={(e) => setAddClassInput(e.target.value)}
              placeholder="Nhập mã/tên lớp mới (ví dụ: 3A1, 4A2, 5A3)..."
              className="flex-1 p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white placeholder:font-normal"
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 shrink-0 flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm lớp</span>
            </button>
          </form>

          {/* Classes Chips List */}
          <div className="min-h-[100px] p-4 bg-slate-50/60 dark:bg-slate-900/60 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex flex-wrap gap-2 items-center">
            {assignedClasses.length === 0 ? (
              <div className="w-full text-center py-6 text-amber-600 dark:text-amber-400 text-xs font-medium space-y-1">
                <AlertCircle className="w-6 h-6 mx-auto opacity-80" />
                <p>Chưa có lớp học. Vui lòng thêm lớp trong mục “Quản lý lớp” ở trên.</p>
              </div>
            ) : (
              assignedClasses.map((cls) => (
                <div
                  key={cls}
                  className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xs flex items-center gap-2 text-xs font-extrabold text-slate-800 dark:text-slate-100 group hover:border-blue-400 transition-all"
                >
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>{cls}</span>
                  <span className="text-[10px] text-slate-400 font-normal">({inferGradeFromClassName(cls)})</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveClass(cls)}
                    title={`Xóa lớp ${cls}`}
                    className="p-0.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-md transition-colors ml-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* SECTION: MÔN HỌC ĐƯỢC PHÂN CÔNG */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-emerald-500" />
                <span>MÔN HỌC ĐƯỢC PHÂN CÔNG</span>
              </h3>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg">
                {currentSubjects.length} Môn học
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Quản lý chính xác các môn học mà bạn được phân công giảng dạy (Ví dụ: Tin học + Công nghệ, hoặc Toán + Tin học).
              Danh sách môn này sẽ được dùng thống nhất trong Thời khóa biểu, Phân phối chương trình (PPCT) và Lịch báo giảng.
            </p>

            {/* Checkbox multi-select list for standard subjects */}
            <div className="space-y-2">
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Tích chọn môn học đảm nhận:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {PRIMARY_SUBJECTS.map((sub) => {
                  const isSelected = currentSubjects.includes(sub);
                  const style = getSubjectColorStyle(sub);
                  return (
                    <div
                      key={sub}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleToggleSubject(sub)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleToggleSubject(sub);
                        }
                      }}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center space-x-2 text-xs font-bold ${
                        isSelected
                          ? `${style.bgLight} ${style.borderClass} ${style.textClass} shadow-2xs`
                          : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 pointer-events-none"
                      />
                      <span className="text-sm">{style.icon}</span>
                      <span className="truncate">{sub}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Form add custom subject */}
            <form onSubmit={handleAddCustomSubject} className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
              <input
                type="text"
                value={addSubjectInput}
                onChange={(e) => setAddSubjectInput(e.target.value)}
                placeholder="Thêm môn học khác (ví dụ: Kỹ năng sống, Ngoại ngữ 2)..."
                className="flex-1 p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white placeholder:font-normal"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 shrink-0 flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm môn</span>
              </button>
            </form>

            {/* Currently assigned subjects badges list */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
              <div className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Danh sách môn học đang phân công:
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                {currentSubjects.map((sub) => {
                  const style = getSubjectColorStyle(sub);
                  return (
                    <div
                      key={sub}
                      className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-extrabold transition-all shadow-2xs ${style.badgeClass}`}
                    >
                      <span className="text-sm">{style.icon}</span>
                      <span>{sub}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubject(sub)}
                        title={`Xóa môn ${sub}`}
                        className="p-0.5 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-md transition-colors ml-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Explicit Save Button for Môn được phân công */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
              <p className="text-[11px] text-slate-400 italic">
                * Dữ liệu môn học sẽ được lưu vào tài khoản giáo viên theo mã định danh Firebase UID.
              </p>
              <button
                type="button"
                onClick={() => {
                  onSaveProfile({ ...profileForm, subjects: currentSubjects });
                  alert(`✅ Đã lưu danh sách môn học được phân công (${currentSubjects.join(', ')}) thành công vào tài khoản!`);
                }}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5 shrink-0"
              >
                <Save className="w-4 h-4" />
                <span>Lưu thay đổi môn học</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};


