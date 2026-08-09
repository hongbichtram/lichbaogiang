import React, { useState, useEffect } from 'react';
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
  Sun,
  Moon,
  Info,
  Printer
} from 'lucide-react';
import { TeacherProfile, ClassTimetableRule, PrintSettings, DEFAULT_PRINT_SETTINGS } from '../types';
import { ClassSelectDropdown } from './ClassSelectDropdown';
import { PrintDesignerComponent } from './PrintDesignerComponent';
import { PRIMARY_SUBJECTS } from '../data/primaryCurriculums';
import { getSubjectColorStyle } from '../utils/subjectUtils';
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
  onSaveProfile: (profile: TeacherProfile) => void;
  onSaveTimetableRules: (rules: ClassTimetableRule[]) => void;
  onSavePrintSettings?: (settings: PrintSettings) => void;
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
  onSaveProfile,
  onSaveTimetableRules,
  onSavePrintSettings,
  onAutoGenerateSchedule,
  onOpenPreviewModal,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'print_template'>('profile');
  const [profileForm, setProfileForm] = useState<TeacherProfile>({ ...teacher });
  const [rules, setRules] = useState<ClassTimetableRule[]>([...timetableRules]);
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
    if (!trimmed) return;

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
    if (!cleaned) return;

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
        </div>
      </div>

      {activeTab === 'print_template' ? (
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


