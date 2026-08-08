import React, { useState } from 'react';
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
  Info
} from 'lucide-react';
import { TeacherProfile, ClassTimetableRule } from '../types';
import { ClassSelectDropdown } from './ClassSelectDropdown';
import { inferGradeFromClassName, normalizeClassName, getPeriodName, getFullPeriodLabel } from '../utils/classUtils';

interface SettingsViewProps {
  teacher: TeacherProfile;
  timetableRules: ClassTimetableRule[];
  onSaveProfile: (profile: TeacherProfile) => void;
  onSaveTimetableRules: (rules: ClassTimetableRule[]) => void;
  onAutoGenerateSchedule: () => void;
}

const DAYS_OF_WEEK: Array<'Thứ 2' | 'Thứ 3' | 'Thứ 4' | 'Thứ 5' | 'Thứ 6'> = [
  'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6'
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  teacher,
  timetableRules,
  onSaveProfile,
  onSaveTimetableRules,
  onAutoGenerateSchedule,
}) => {
  const [profileForm, setProfileForm] = useState<TeacherProfile>({ ...teacher });
  const [rules, setRules] = useState<ClassTimetableRule[]>([...timetableRules]);
  const [addClassInput, setAddClassInput] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>(
    teacher.subjects[0] || 'Tin học'
  );

  // Quick rule form state
  const [newRule, setNewRule] = useState<{
    className: string;
    dayOfWeek: 'Thứ 2' | 'Thứ 3' | 'Thứ 4' | 'Thứ 5' | 'Thứ 6';
    period: number;
  }>({
    className: '',
    dayOfWeek: 'Thứ 2',
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
    period: number,
    selectedClassName: string
  ) => {
    if (!selectedClassName) {
      // Clear cell
      const updated = rules.filter(r => !(r.dayOfWeek === dayOfWeek && r.period === period));
      setRules(updated);
      onSaveTimetableRules(updated);
      return;
    }

    const grade = inferGradeFromClassName(selectedClassName);
    const existingIdx = rules.findIndex(r => r.dayOfWeek === dayOfWeek && r.period === period);

    let updated: ClassTimetableRule[];
    if (existingIdx >= 0) {
      updated = [...rules];
      updated[existingIdx] = {
        ...updated[existingIdx],
        className: selectedClassName,
        grade,
        subject: selectedSubject,
      };
    } else {
      const createdRule: ClassTimetableRule = {
        id: `rule-${Date.now()}-${dayOfWeek}-${period}`,
        className: selectedClassName,
        grade,
        subject: selectedSubject,
        dayOfWeek,
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

    handleCellClassChange(newRule.dayOfWeek, newRule.period, newRule.className);
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
      {/* Page Header */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <SettingsIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <span>Thời Khóa Biểu Cố Định & Quản Lý Lớp Học</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Thiết lập danh sách lớp giảng dạy và phân công Thời khóa biểu cố định để tự động liên kết PPCT và sinh Lịch báo giảng.
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

      {/* Grid Layout: Teacher Profile & Class Management */}
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
        </div>

      </div>

      {/* Main Card: THỜI KHÓA BIỂU CỐ ĐỊNH (Matrix Grid) */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-6">
        
        {/* Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 dark:border-slate-700/60 pb-4">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Clock className="w-5 h-5 text-emerald-500" />
              <span>THỜI KHÓA BIỂU CỐ ĐỊNH</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Nhấp trực tiếp vào ô từng tiết học để chọn Lớp dạy từ danh sách. Thông tin Khối, PPCT sẽ tự động liên kết.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <span className="font-bold text-slate-500 dark:text-slate-400 px-1">Môn dạy:</span>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="bg-white dark:bg-slate-800 font-bold text-blue-600 dark:text-blue-400 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none"
              >
                {teacher.subjects.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Quick Assign Toolbar */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-slate-700 dark:text-slate-300">
              Phân công nhanh theo từng tiết:
            </span>
            <span className="text-[11px] text-slate-400">
              (Hoặc nhấp trực tiếp vào ô bất kỳ trong bảng ma trận phía dưới)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-end">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">Thứ</label>
              <select
                value={newRule.dayOfWeek}
                onChange={(e) => setNewRule({ ...newRule, dayOfWeek: e.target.value as any })}
                className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-white"
              >
                {DAYS_OF_WEEK.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">Tiết</label>
              <select
                value={newRule.period}
                onChange={(e) => setNewRule({ ...newRule, period: parseInt(e.target.value) || 1 })}
                className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-white"
              >
                {[1, 2, 3, 4, 5, 6, 7].map(p => (
                  <option key={p} value={p}>
                    {p <= 4 ? `☀️ Sáng - Tiết ${p}` : `🌤️ Chiều - Tiết ${p - 4}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">Chọn Lớp dạy</label>
              <ClassSelectDropdown
                value={newRule.className}
                assignedClasses={assignedClasses}
                onSelect={(cls) => setNewRule({ ...newRule, className: cls })}
                onClear={() => setNewRule({ ...newRule, className: '' })}
                onQuickAddClass={handleQuickAddClassFromDropdown}
                dayOfWeek={newRule.dayOfWeek}
                period={newRule.period}
                existingRules={rules}
                placeholder="▼ Chọn lớp"
              />
            </div>

            <div>
              <button
                type="button"
                onClick={handleAddRuleFromForm}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center space-x-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm vào TKB</span>
              </button>
            </div>
          </div>
        </div>

        {/* MATRIX GRID TABLE */}
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xs">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-100/90 dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 text-xs font-bold border-b border-slate-200 dark:border-slate-700">
                <th className="p-3 border-r border-slate-200 dark:border-slate-700 w-28 text-center bg-slate-200/50 dark:bg-slate-900 font-bold">
                  Tiết \ Thứ
                </th>
                {DAYS_OF_WEEK.map((day) => (
                  <th key={day} className="p-3 border-r border-slate-200 dark:border-slate-700 text-center font-bold">
                    {day.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-xs">
              
              {/* ☀️ BUỔI SÁNG HEADER */}
              <tr className="bg-amber-100/90 dark:bg-amber-950/60 text-amber-950 dark:text-amber-200 font-black border-y border-amber-300 dark:border-amber-800">
                <td colSpan={DAYS_OF_WEEK.length + 1} className="px-4 py-2.5 text-left text-xs uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <Sun className="w-4 h-4 text-amber-500 fill-amber-400" />
                    <span>☀️ BUỔI SÁNG</span>
                  </div>
                </td>
              </tr>

              {[1, 2, 3, 4].map((period) => (
                <tr key={`period-${period}`} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-2.5 font-bold text-center bg-slate-50/50 dark:bg-slate-900/50 border-r border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">
                    {getPeriodName(period)}
                  </td>
                  {DAYS_OF_WEEK.map((dayOfWeek) => {
                    const rule = rules.find(r => r.dayOfWeek === dayOfWeek && r.period === period);
                    return (
                      <td key={`${dayOfWeek}-${period}`} className="p-1.5 border-r border-slate-200 dark:border-slate-700 align-middle">
                        <ClassSelectDropdown
                          value={rule ? rule.className : ''}
                          assignedClasses={assignedClasses}
                          onSelect={(selectedCls) => handleCellClassChange(dayOfWeek, period, selectedCls)}
                          onClear={() => handleCellClassChange(dayOfWeek, period, '')}
                          onQuickAddClass={handleQuickAddClassFromDropdown}
                          dayOfWeek={dayOfWeek}
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

              {/* 🌤️ BUỔI CHIỀU HEADER */}
              <tr className="bg-indigo-100/90 dark:bg-indigo-950/60 text-indigo-950 dark:text-indigo-200 font-black border-y border-indigo-300 dark:border-indigo-800">
                <td colSpan={DAYS_OF_WEEK.length + 1} className="px-4 py-2.5 text-left text-xs uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <Moon className="w-4 h-4 text-indigo-400 fill-indigo-300" />
                    <span>🌤️ BUỔI CHIỀU</span>
                  </div>
                </td>
              </tr>

              {[5, 6, 7].map((period) => (
                <tr key={`period-${period}`} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-2.5 font-bold text-center bg-slate-50/50 dark:bg-slate-900/50 border-r border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">
                    {getPeriodName(period)}
                  </td>
                  {DAYS_OF_WEEK.map((dayOfWeek) => {
                    const rule = rules.find(r => r.dayOfWeek === dayOfWeek && r.period === period);
                    return (
                      <td key={`${dayOfWeek}-${period}`} className="p-1.5 border-r border-slate-200 dark:border-slate-700 align-middle">
                        <ClassSelectDropdown
                          value={rule ? rule.className : ''}
                          assignedClasses={assignedClasses}
                          onSelect={(selectedCls) => handleCellClassChange(dayOfWeek, period, selectedCls)}
                          onClear={() => handleCellClassChange(dayOfWeek, period, '')}
                          onQuickAddClass={handleQuickAddClassFromDropdown}
                          dayOfWeek={dayOfWeek}
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

        {/* Assigned Rules Summary List */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">
              Danh sách các tiết đã phân công trong TKB ({rules.length} tiết):
            </h4>
            {rules.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Bạn có chắc muốn xóa tất cả tiết trong Thời khóa biểu cố định?')) {
                    setRules([]);
                    onSaveTimetableRules([]);
                  }
                }}
                className="text-[11px] font-bold text-red-500 hover:text-red-600 transition-colors"
              >
                Xóa tất cả TKB
              </button>
            )}
          </div>

          {rules.length === 0 ? (
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-center text-xs text-slate-400 italic">
              Chưa phân công tiết nào trong Thời khóa biểu cố định. Hãy nhấp vào các ô trong bảng trên để chọn Lớp dạy.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-56 overflow-y-auto p-1">
              {rules
                .sort((a, b) => {
                  const dayOrder = DAYS_OF_WEEK.indexOf(a.dayOfWeek) - DAYS_OF_WEEK.indexOf(b.dayOfWeek);
                  if (dayOrder !== 0) return dayOrder;
                  return a.period - b.period;
                })
                .map((rule) => (
                  <div
                    key={rule.id}
                    className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <span className="font-bold text-blue-600 dark:text-blue-400 shrink-0">
                        {rule.dayOfWeek} • {getFullPeriodLabel(rule.period)}
                      </span>
                      <span className="font-extrabold text-slate-900 dark:text-white shrink-0">
                        Lớp {rule.className}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate">
                        ({rule.grade})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteRule(rule.id)}
                      className="p-1 text-slate-400 hover:text-red-500 transition-colors ml-1"
                      title="Xóa tiết này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
