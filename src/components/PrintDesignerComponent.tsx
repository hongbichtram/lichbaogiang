import React, { useState } from 'react';
import { 
  Printer, 
  Save, 
  RotateCcw, 
  Eye, 
  Type, 
  Layout, 
  FileText, 
  CheckSquare, 
  Square, 
  Sparkles,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Sliders
} from 'lucide-react';
import { PrintSettings, DEFAULT_PRINT_SETTINGS, TeacherProfile, ScheduleItem } from '../types';

interface PrintDesignerComponentProps {
  teacher: TeacherProfile;
  settings: PrintSettings;
  onSaveSettings: (settings: PrintSettings) => void;
  onOpenPreviewModal: () => void;
}

// Sample schedules for real-time preview
const SAMPLE_PREVIEW_ITEMS = [
  {
    day: 'Thứ 2',
    dateStr: '08/09/2025',
    period: 'Tiết 2 (Sáng)',
    className: '4A1',
    ppct: 1,
    lessonTitle: 'Bài 1: Khám phá máy tính và mạng Internet',
    notes: 'Học tại phòng Máy 1',
  },
  {
    day: 'Thứ 2',
    dateStr: '08/09/2025',
    period: 'Tiết 3 (Sáng)',
    className: '4A2',
    ppct: 1,
    lessonTitle: 'Bài 1: Khám phá máy tính và mạng Internet',
    notes: '',
  },
  {
    day: 'Thứ 3',
    dateStr: '09/09/2025',
    period: 'Tiết 1 (Sáng)',
    className: '3A1',
    ppct: 1,
    lessonTitle: 'Bài 1: Thông tin và xử lý thông tin xung quanh em',
    notes: 'Chuẩn bị tranh ảnh',
  },
  {
    day: 'Thứ 4',
    dateStr: '10/09/2025',
    period: 'Tiết 1 (Chiều)',
    className: '5A1',
    ppct: 1,
    lessonTitle: 'Bài 1: Thu thập và tổ chức dữ liệu thông tin',
    notes: 'Thực hành nhóm',
  },
];

export const PrintDesignerComponent: React.FC<PrintDesignerComponentProps> = ({
  teacher,
  settings,
  onSaveSettings,
  onOpenPreviewModal,
}) => {
  const [form, setForm] = useState<PrintSettings>({ ...settings });
  const [activeTab, setActiveTab] = useState<'header' | 'columns' | 'typography' | 'layout' | 'signatures'>('header');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSave = () => {
    onSaveSettings(form);
    showToast('✅ Đã lưu cấu hình Mẫu in thành công!');
  };

  const handleReset = () => {
    if (confirm('Bạn có chắc chắn muốn khôi phục về Mẫu in mặc định ban đầu?')) {
      const reset = {
        ...DEFAULT_PRINT_SETTINGS,
        schoolName: teacher.schoolName || '',
        teacherName: teacher.fullName || '',
        teacherCode: teacher.teacherCode || '',
        academicYear: teacher.academicYear || '2025 - 2026',
        semester: teacher.semester || 'Học kỳ I',
      };
      setForm(reset);
      onSaveSettings(reset);
      showToast('🔄 Đã khôi phục Mẫu in về mặc định!');
    }
  };

  // Helper to resolve string placeholders
  const displayTitle = (form.customTitle || 'LỊCH BÁO GIẢNG TUẦN {week}')
    .replace('{week}', '1')
    .replace('{school}', form.schoolName || teacher.schoolName)
    .replace('{teacher}', form.teacherName || teacher.fullName);

  return (
    <div className="space-y-6">
      {/* Toast alert */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center space-x-2 animate-bounce text-xs font-bold">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner & Main Actions */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Tùy chỉnh mẫu in linh hoạt & Trực quan</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Printer className="w-5 h-5 text-indigo-500" />
            <span>Thiết Kế Mẫu In Lịch Báo Giảng</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tự do thay đổi tiêu đề, phông chữ, bật/tắt cột, lề trang A4 và chữ ký theo đúng quy định của trường bạn.
          </p>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenPreviewModal}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Eye className="w-4 h-4 text-indigo-500" />
            <span>Xem trước toàn màn hình</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:hover:bg-amber-900/80 dark:text-amber-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border border-amber-200/60 dark:border-amber-800"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Mặc định</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-500/20 flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>Lưu mẫu in</span>
          </button>
        </div>
      </div>

      {/* 2-Column Responsive Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Controls & Settings Form (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm overflow-hidden flex flex-col">
          
          {/* Settings Section Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-900/50 p-1.5 overflow-x-auto scrollbar-none gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('header')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'header'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200/60 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>1. Đầu trang</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('columns')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'columns'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200/60 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>2. Ẩn/Hiện cột</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('typography')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'typography'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200/60 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>3. Kiểu chữ</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('layout')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'layout'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200/60 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
              }`}
            >
              <Layout className="w-3.5 h-3.5" />
              <span>4. Bố cục & Lề</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('signatures')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'signatures'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200/60 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>5. Chữ ký</span>
            </button>
          </div>

          {/* Form Content Area */}
          <div className="p-5 space-y-4 max-h-[600px] overflow-y-auto">
            
            {/* TAB 1: THÔNG TIN ĐẦU TRANG */}
            {activeTab === 'header' && (
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/60 text-slate-700 dark:text-slate-300">
                  <p className="font-bold text-indigo-800 dark:text-indigo-300 mb-0.5">Tiêu đề Lịch Báo Giảng</p>
                  <input
                    type="text"
                    value={form.customTitle}
                    onChange={(e) => setForm({ ...form, customTitle: e.target.value })}
                    placeholder="LỊCH BÁO GIẢNG TUẦN {week}"
                    className="w-full p-2.5 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
                  />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Gợi ý: Dùng cú pháp <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">{'{week}'}</code> để hệ thống tự động chèn số tuần hiện tại.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <h4 className="font-bold text-slate-900 dark:text-white uppercase text-[11px] tracking-wider text-slate-400">
                    Bật/Tắt & Thay đổi nhãn thông tin
                  </h4>

                  {/* School Name */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200/70 dark:border-slate-700/60 space-y-2">
                    <label className="flex items-center space-x-2 font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.showSchoolName}
                        onChange={(e) => setForm({ ...form, showSchoolName: e.target.checked })}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Hiển thị Tên trường</span>
                    </label>
                    {form.showSchoolName && (
                      <input
                        type="text"
                        value={form.schoolName || teacher.schoolName}
                        onChange={(e) => setForm({ ...form, schoolName: e.target.value })}
                        placeholder="Tên trường học..."
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
                      />
                    )}
                  </div>

                  {/* Teacher Name */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200/70 dark:border-slate-700/60 space-y-2">
                    <label className="flex items-center space-x-2 font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.showTeacherName}
                        onChange={(e) => setForm({ ...form, showTeacherName: e.target.checked })}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Hiển thị Tên giáo viên</span>
                    </label>
                    {form.showTeacherName && (
                      <input
                        type="text"
                        value={form.teacherName || teacher.fullName}
                        onChange={(e) => setForm({ ...form, teacherName: e.target.value })}
                        placeholder="Họ và tên..."
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
                      />
                    )}
                  </div>

                  {/* Teacher Code */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200/70 dark:border-slate-700/60 space-y-2">
                    <label className="flex items-center space-x-2 font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.showTeacherCode}
                        onChange={(e) => setForm({ ...form, showTeacherCode: e.target.checked })}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Hiển thị Mã giáo viên</span>
                    </label>
                    {form.showTeacherCode && (
                      <input
                        type="text"
                        value={form.teacherCode || teacher.teacherCode}
                        onChange={(e) => setForm({ ...form, teacherCode: e.target.value })}
                        placeholder="Mã số giáo viên..."
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
                      />
                    )}
                  </div>

                  {/* Academic Year & Semester */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200/70 dark:border-slate-700/60 space-y-1">
                      <label className="flex items-center space-x-2 font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.showAcademicYear}
                          onChange={(e) => setForm({ ...form, showAcademicYear: e.target.checked })}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>Năm học</span>
                      </label>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200/70 dark:border-slate-700/60 space-y-1">
                      <label className="flex items-center space-x-2 font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.showSemester}
                          onChange={(e) => setForm({ ...form, showSemester: e.target.checked })}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>Học kỳ</span>
                      </label>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* TAB 2: BẢNG LỊCH BÁO GIẢNG (CỘT HẠNG MỤC) */}
            {activeTab === 'columns' && (
              <div className="space-y-3 text-xs">
                <p className="text-slate-500 dark:text-slate-400">
                  Tích chọn các cột bạn muốn hiển thị trong bảng Lịch báo giảng:
                </p>

                <div className="space-y-2">
                  {[
                    { key: 'showColDay', label: 'Cột 1: Thứ, ngày tháng năm' },
                    { key: 'showColPeriod', label: 'Cột 2: Tiết học (ví dụ: Tiết 1, 2)' },
                    { key: 'showColSession', label: 'Cột 3: Buổi (Sáng / Chiều)' },
                    { key: 'showColClass', label: 'Cột 4: Lớp giảng dạy (ví dụ: 4A1)' },
                    { key: 'showColPpctPeriod', label: 'Cột 5: Tiết PPCT' },
                    { key: 'showColLessonTitle', label: 'Cột 6: Tên bài dạy' },
                    { key: 'showColNotes', label: 'Cột 7: Ghi chú' },
                  ].map((col) => (
                    <label
                      key={col.key}
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/70 dark:border-slate-700/60 font-semibold text-slate-800 dark:text-slate-200 cursor-pointer hover:border-indigo-400 transition-colors"
                    >
                      <span>{col.label}</span>
                      <input
                        type="checkbox"
                        checked={(form as any)[col.key]}
                        onChange={(e) => setForm({ ...form, [col.key]: e.target.checked })}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                      />
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: KIỂU CHỮ (TYPOGRAPHY) */}
            {activeTab === 'typography' && (
              <div className="space-y-4 text-xs">
                {/* Font Family */}
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Font chữ toàn trang
                  </label>
                  <select
                    value={form.fontFamily}
                    onChange={(e) => setForm({ ...form, fontFamily: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
                  >
                    <option value="Times New Roman">Times New Roman (Chuẩn BGD&ĐT)</option>
                    <option value="Arial">Arial (Không chân)</option>
                    <option value="Calibri">Calibri</option>
                    <option value="Aptos">Aptos (Mặc định MS Office)</option>
                    <option value="Roboto">Roboto</option>
                    <option value="Segoe UI">Segoe UI</option>
                  </select>
                </div>

                {/* Font sizes */}
                <div className="space-y-3 pt-2">
                  <div>
                    <div className="flex justify-between items-center mb-1 font-bold text-slate-800 dark:text-slate-200">
                      <span>Cỡ chữ tiêu đề:</span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{form.titleFontSize} pt</span>
                    </div>
                    <input
                      type="range"
                      min="12"
                      max="24"
                      value={form.titleFontSize}
                      onChange={(e) => setForm({ ...form, titleFontSize: Number(e.target.value) })}
                      className="w-full accent-indigo-600"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1 font-bold text-slate-800 dark:text-slate-200">
                      <span>Cỡ chữ thông tin chung:</span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{form.contentFontSize} pt</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="18"
                      value={form.contentFontSize}
                      onChange={(e) => setForm({ ...form, contentFontSize: Number(e.target.value) })}
                      className="w-full accent-indigo-600"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1 font-bold text-slate-800 dark:text-slate-200">
                      <span>Cỡ chữ nội dung bảng:</span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{form.tableFontSize} pt</span>
                    </div>
                    <input
                      type="range"
                      min="9"
                      max="16"
                      value={form.tableFontSize}
                      onChange={(e) => setForm({ ...form, tableFontSize: Number(e.target.value) })}
                      className="w-full accent-indigo-600"
                    />
                  </div>
                </div>

                {/* Bold formatting */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                  <label className="flex items-center space-x-2 font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isTitleBold}
                      onChange={(e) => setForm({ ...form, isTitleBold: e.target.checked })}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>In đậm Tiêu đề chính</span>
                  </label>

                  <label className="flex items-center space-x-2 font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isLessonTitleBold}
                      onChange={(e) => setForm({ ...form, isLessonTitleBold: e.target.checked })}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>In đậm Tên bài dạy trong bảng</span>
                  </label>
                </div>

              </div>
            )}

            {/* TAB 4: BỐ CỤC & LỀ TRANG (LAYOUT) */}
            {activeTab === 'layout' && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Khổ giấy</label>
                    <select
                      value={form.paperSize}
                      onChange={(e) => setForm({ ...form, paperSize: e.target.value as any })}
                      className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
                    >
                      <option value="A4">Khổ A4 (Chuẩn)</option>
                      <option value="A3">Khổ A3</option>
                      <option value="Letter">Khổ Letter</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Hướng trang</label>
                    <select
                      value={form.orientation}
                      onChange={(e) => setForm({ ...form, orientation: e.target.value as any })}
                      className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
                    >
                      <option value="portrait">Trang Dọc (Portrait)</option>
                      <option value="landscape">Trang Ngang (Landscape)</option>
                    </select>
                  </div>
                </div>

                {/* Alignment */}
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                    Căn chỉnh nội dung bảng
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'left', label: 'Trái', icon: AlignLeft },
                      { id: 'center', label: 'Giữa', icon: AlignCenter },
                      { id: 'right', label: 'Phải', icon: AlignRight },
                    ].map((item) => {
                      const Icon = item.icon;
                      const active = form.contentAlign === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setForm({ ...form, contentAlign: item.id as any })}
                          className={`p-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${
                            active
                              ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-950/80 dark:border-indigo-400 dark:text-indigo-300'
                              : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Margins */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                  <h4 className="font-bold text-slate-900 dark:text-white uppercase text-[11px] tracking-wider text-slate-400 mb-2">
                    Căn lề trang in (mm)
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Lề trên (Top):</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="5"
                          max="50"
                          value={form.marginTop}
                          onChange={(e) => setForm({ ...form, marginTop: Number(e.target.value) })}
                          className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold"
                        />
                        <span className="text-slate-400">mm</span>
                      </div>
                    </div>

                    <div>
                      <span className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Lề dưới (Bottom):</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="5"
                          max="50"
                          value={form.marginBottom}
                          onChange={(e) => setForm({ ...form, marginBottom: Number(e.target.value) })}
                          className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold"
                        />
                        <span className="text-slate-400">mm</span>
                      </div>
                    </div>

                    <div>
                      <span className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Lề trái (Left):</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="5"
                          max="50"
                          value={form.marginLeft}
                          onChange={(e) => setForm({ ...form, marginLeft: Number(e.target.value) })}
                          className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold"
                        />
                        <span className="text-slate-400">mm</span>
                      </div>
                    </div>

                    <div>
                      <span className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Lề phải (Right):</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="5"
                          max="50"
                          value={form.marginRight}
                          onChange={(e) => setForm({ ...form, marginRight: Number(e.target.value) })}
                          className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold"
                        />
                        <span className="text-slate-400">mm</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 5: CHỮ KÝ CUỐI TRANG */}
            {activeTab === 'signatures' && (
              <div className="space-y-3 text-xs">
                <p className="text-slate-500 dark:text-slate-400">
                  Bật/tắt và chỉnh sửa chức danh ký duyệt cuối trang in:
                </p>

                {/* Board of Management */}
                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200/70 dark:border-slate-700/60 space-y-2">
                  <label className="flex items-center space-x-2 font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.showSigBoard}
                      onChange={(e) => setForm({ ...form, showSigBoard: e.target.checked })}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Ban giám hiệu duyệt</span>
                  </label>
                  {form.showSigBoard && (
                    <input
                      type="text"
                      value={form.sigBoardTitle}
                      onChange={(e) => setForm({ ...form, sigBoardTitle: e.target.value })}
                      placeholder="BAN GIÁM HIỆU DUYỆT"
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
                    />
                  )}
                </div>

                {/* Department Head */}
                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200/70 dark:border-slate-700/60 space-y-2">
                  <label className="flex items-center space-x-2 font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.showSigDepartmentHead}
                      onChange={(e) => setForm({ ...form, showSigDepartmentHead: e.target.checked })}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Tổ trưởng chuyên môn</span>
                  </label>
                  {form.showSigDepartmentHead && (
                    <input
                      type="text"
                      value={form.sigDepartmentHeadTitle}
                      onChange={(e) => setForm({ ...form, sigDepartmentHeadTitle: e.target.value })}
                      placeholder="TỔ TRƯỞNG CHUYÊN MÔN"
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
                    />
                  )}
                </div>

                {/* Teacher Signature */}
                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200/70 dark:border-slate-700/60 space-y-2">
                  <label className="flex items-center space-x-2 font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.showSigTeacher}
                      onChange={(e) => setForm({ ...form, showSigTeacher: e.target.checked })}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Giáo viên báo giảng</span>
                  </label>
                  {form.showSigTeacher && (
                    <input
                      type="text"
                      value={form.sigTeacherTitle}
                      onChange={(e) => setForm({ ...form, sigTeacherTitle: e.target.value })}
                      placeholder="GIÁO VIÊN BÁO GIẢNG"
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
                    />
                  )}
                </div>

                {/* Creator Signature */}
                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200/70 dark:border-slate-700/60 space-y-2">
                  <label className="flex items-center space-x-2 font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.showSigCreator}
                      onChange={(e) => setForm({ ...form, showSigCreator: e.target.checked })}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Người lập bảng</span>
                  </label>
                  {form.showSigCreator && (
                    <input
                      type="text"
                      value={form.sigCreatorTitle}
                      onChange={(e) => setForm({ ...form, sigCreatorTitle: e.target.value })}
                      placeholder="NGƯỜI LẬP BẢNG"
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
                    />
                  )}
                </div>

              </div>
            )}

          </div>

          {/* Footer Save Quick Bar */}
          <div className="p-4 bg-slate-50/80 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center shrink-0">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              * Thay đổi sẽ cập nhật trực tiếp ở khung bên phải
            </span>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-500/20 flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Lưu mẫu in</span>
            </button>
          </div>

        </div>

        {/* RIGHT COLUMN: REAL-TIME LIVE PREVIEW (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-indigo-500" />
              <span>Xem trước Mẫu in theo thời gian thực (Live Preview)</span>
            </span>
            <span className="text-[11px] font-semibold text-slate-400">
              {form.paperSize} • {form.orientation === 'portrait' ? 'Khổ dọc' : 'Khổ ngang'}
            </span>
          </div>

          {/* Paper Sheet Preview Container */}
          <div className="bg-slate-200/80 dark:bg-slate-950 p-4 sm:p-6 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-inner overflow-x-auto min-h-[600px] flex justify-center">
            
            {/* The A4 Paper Sheet */}
            <div
              style={{
                fontFamily: `'${form.fontFamily}', serif`,
                paddingTop: `${form.marginTop}mm`,
                paddingBottom: `${form.marginBottom}mm`,
                paddingLeft: `${form.marginLeft}mm`,
                paddingRight: `${form.marginRight}mm`,
                width: form.orientation === 'portrait' ? '100%' : '100%',
                maxWidth: form.orientation === 'portrait' ? '800px' : '1050px',
              }}
              className="bg-white text-slate-900 rounded-xl shadow-2xl border border-slate-300 space-y-5 transition-all"
            >
              
              {/* Header Info Block */}
              <div
                style={{ fontSize: `${form.contentFontSize}pt` }}
                className="flex justify-between items-start leading-relaxed border-b border-slate-200 pb-3"
              >
                <div className="space-y-0.5">
                  {form.showSchoolName && (
                    <p><strong>Trường:</strong> {form.schoolName || teacher.schoolName || 'Tiểu học'}</p>
                  )}
                  {form.showTeacherName && (
                    <p><strong>Giáo viên:</strong> {form.teacherName || teacher.fullName} {form.showTeacherCode && (form.teacherCode || teacher.teacherCode) ? `- Mã GV: ${form.teacherCode || teacher.teacherCode}` : ''}</p>
                  )}
                </div>
                <div className="text-right space-y-0.5">
                  {form.showAcademicYear && (
                    <p><strong>Năm học:</strong> {form.academicYear || teacher.academicYear || '2025 - 2026'}</p>
                  )}
                  {form.showSemester && (
                    <p><strong>Học kỳ:</strong> {form.semester || teacher.semester || 'Học kỳ I'}</p>
                  )}
                </div>
              </div>

              {/* Title Block */}
              <div className="text-center pt-1">
                <h1
                  style={{
                    fontSize: `${form.titleFontSize}pt`,
                    fontWeight: form.isTitleBold ? 'bold' : 'normal',
                  }}
                  className="uppercase text-slate-900 tracking-wide"
                >
                  {displayTitle}
                </h1>
              </div>

              {/* Schedule Table Preview */}
              <div className="overflow-x-auto">
                <table
                  style={{
                    fontSize: `${form.tableFontSize}pt`,
                    textAlign: form.contentAlign as any,
                  }}
                  className="w-full border-collapse border border-slate-400"
                >
                  <thead>
                    <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-400">
                      {form.showColDay && <th className="border border-slate-400 p-2 text-center align-middle">Thứ, ngày</th>}
                      {form.showColPeriod && <th className="border border-slate-400 p-2 text-center align-middle">Tiết</th>}
                      {form.showColSession && <th className="border border-slate-400 p-2 text-center align-middle">Buổi</th>}
                      {form.showColClass && <th className="border border-slate-400 p-2 text-center align-middle">Lớp</th>}
                      {form.showColPpctPeriod && <th className="border border-slate-400 p-2 text-center align-middle">Tiết PPCT</th>}
                      {form.showColLessonTitle && <th className="border border-slate-400 p-2 text-center align-middle">Tên bài dạy</th>}
                      {form.showColNotes && <th className="border border-slate-400 p-2 text-center align-middle">Ghi chú</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {SAMPLE_PREVIEW_ITEMS.map((item, idx) => (
                      <tr key={idx} className="border-b border-slate-300">
                        {form.showColDay && (
                          <td className="border border-slate-400 p-2 text-center align-middle font-bold">
                            <div>{item.day}</div>
                            <div className="text-[9pt] font-normal text-slate-500">{item.dateStr}</div>
                          </td>
                        )}
                        {form.showColPeriod && <td className="border border-slate-400 p-2 text-center align-middle">{item.period}</td>}
                        {form.showColSession && <td className="border border-slate-400 p-2 text-center align-middle">Sáng</td>}
                        {form.showColClass && <td className="border border-slate-400 p-2 text-center align-middle font-bold">{item.className}</td>}
                        {form.showColPpctPeriod && <td className="border border-slate-400 p-2 text-center align-middle">{item.ppct}</td>}
                        {form.showColLessonTitle && (
                          <td
                            style={{ fontWeight: form.isLessonTitleBold ? 'bold' : 'normal' }}
                            className="border border-slate-400 p-2 align-middle text-left"
                          >
                            {item.lessonTitle}
                          </td>
                        )}
                        {form.showColNotes && <td className="border border-slate-400 p-2 text-slate-600 align-middle text-left">{item.notes}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Footer Signatures Preview */}
              <div
                style={{ fontSize: `${form.contentFontSize}pt` }}
                className="pt-6 flex justify-between text-center font-semibold gap-2"
              >
                {form.showSigBoard && (
                  <div className="space-y-1">
                    <p className="font-bold uppercase text-[10pt]">{form.sigBoardTitle || 'BAN GIÁM HIỆU DUYỆT'}</p>
                    <p className="text-[9pt] text-slate-400 italic font-normal">(Ký, đóng dấu)</p>
                  </div>
                )}

                {form.showSigDepartmentHead && (
                  <div className="space-y-1">
                    <p className="font-bold uppercase text-[10pt]">{form.sigDepartmentHeadTitle || 'TỔ TRƯỞNG CHUYÊN MÔN'}</p>
                    <p className="text-[9pt] text-slate-400 italic font-normal">(Ký tên)</p>
                  </div>
                )}

                {form.showSigTeacher && (
                  <div className="space-y-1">
                    <p className="italic text-[9pt] text-slate-500 font-normal">..., Ngày ..... tháng ..... năm 2026</p>
                    <p className="font-bold uppercase text-[10pt]">{form.sigTeacherTitle || 'GIÁO VIÊN BÁO GIẢNG'}</p>
                    <p className="text-[9pt] text-slate-400 italic font-normal">(Ký và ghi rõ họ tên)</p>
                    <div className="pt-10 font-bold text-slate-900">{form.teacherName || teacher.fullName}</div>
                  </div>
                )}

                {form.showSigCreator && (
                  <div className="space-y-1">
                    <p className="font-bold uppercase text-[10pt]">{form.sigCreatorTitle || 'NGƯỜI LẬP'}</p>
                    <p className="text-[9pt] text-slate-400 italic font-normal">(Ký tên)</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
