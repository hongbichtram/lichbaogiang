import React, { useState, useEffect } from 'react';
import { 
  X, 
  BookOpen, 
  CheckCircle2, 
  Trash2, 
  Search,
  Check,
  AlertTriangle
} from 'lucide-react';
import { ScheduleItem, LessonStatus, PPCTCurriculum, PPCTItem } from '../types';
import { getFullPeriodLabel, inferGradeFromClassName, formatTableSessionPeriod } from '../utils/classUtils';
import { getWeekDayDate } from '../utils/exportUtils';

interface LessonDrawerProps {
  item: ScheduleItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedItem: ScheduleItem) => void;
  onDelete?: (itemId: string) => void;
  onDeleteSuccess?: (msg: string) => void;
  curriculums?: PPCTCurriculum[];
  assignedClasses?: string[];
}

export const LessonDrawer: React.FC<LessonDrawerProps> = ({
  item,
  isOpen,
  onClose,
  onSave,
  onDelete,
  onDeleteSuccess,
  curriculums = [],
  assignedClasses = [],
}) => {
  const [formData, setFormData] = useState<Partial<ScheduleItem>>({});
  const [isLessonPickerOpen, setIsLessonPickerOpen] = useState(false);
  const [pickerSearchQuery, setPickerSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Delete modal state
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setFormData({ ...item });
      setIsLessonPickerOpen(false);
      setIsConfirmDeleteOpen(false);
      setDeleteError(null);
      setToastMessage(null);
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const currentGrade = inferGradeFromClassName(formData.className || '4A1');
  const currentSubject = formData.subject || 'Tin học';

  // Find matching PPCT curriculum
  const matchingCurriculum = curriculums.find(c => c.grade === currentGrade && c.subject === currentSubject)
    || curriculums.find(c => c.grade === currentGrade)
    || curriculums[0];

  const ppctItems = matchingCurriculum?.items || [];

  const handleStatusSelect = (status: LessonStatus) => {
    const updated = { ...formData, status } as ScheduleItem;
    setFormData(updated);
    onSave(updated);
  };

  const handleChange = (field: keyof ScheduleItem, value: any) => {
    const updated = { ...formData, [field]: value } as ScheduleItem;
    if (field === 'className') {
      updated.grade = inferGradeFromClassName(value);
    }
    setFormData(updated);
    onSave(updated);
  };

  const handleSelectPpctItem = (ppctItem: PPCTItem) => {
    const updated = {
      ...formData,
      ppctPeriod: ppctItem.periodNumber,
      lessonTitle: ppctItem.title,
      topic: ppctItem.topic,
      requirements: ppctItem.requirements,
    } as ScheduleItem;
    setFormData(updated);
    onSave(updated);
    setIsLessonPickerOpen(false);
    setToastMessage('✅ Đã cập nhật bài dạy từ PPCT');
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleOpenDeleteConfirm = () => {
    if (!formData.id || typeof formData.id !== 'string' || !formData.id.trim()) {
      setDeleteError('Không tìm thấy ID hợp lệ của tiết dạy. Không thể thực hiện xóa!');
      setTimeout(() => setDeleteError(null), 4000);
      return;
    }
    setIsConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!formData.id) return;
    const deletedId = formData.id;
    setIsConfirmDeleteOpen(false);
    if (onDelete) {
      onDelete(deletedId);
    }
    onClose();
    if (onDeleteSuccess) {
      onDeleteSuccess('Đã xóa tiết dạy thành công.');
    }
  };

  // Filter PPCT items for picker
  const filteredPpctItems = ppctItems.filter(p => {
    if (!pickerSearchQuery.trim()) return true;
    const q = pickerSearchQuery.toLowerCase();
    return p.title.toLowerCase().includes(q) || `tiết ${p.periodNumber}`.includes(q);
  });

  const dateStr = getWeekDayDate(formData.weekNumber || 1, formData.dayOfWeek || 'Thứ 2', formData.academicYear || '2025-2026');

  const classList = assignedClasses.length > 0 ? assignedClasses : ['3A1', '3A2', '3A3', '4A1', '4A2', '4A3', '5A1', '5A2', '5A3'];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col h-full">
          
          {/* Drawer Header */}
          <div className="p-5 bg-slate-50 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                  CHI TIẾT TIẾT DẠY
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                {formData.dayOfWeek} – {dateStr} • {getFullPeriodLabel(formData.period || 1, formData.session)}
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Content Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            
            {/* Delete Error Banner if any */}
            {deleteError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center gap-2 animate-shake">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            {/* Lớp Selector */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Lớp học
              </label>
              <select
                value={formData.className || '4A1'}
                onChange={(e) => handleChange('className', e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                {classList.map((cls) => (
                  <option key={cls} value={cls}>
                    Lớp {cls}
                  </option>
                ))}
              </select>
            </div>

            {/* Tiết PPCT */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Tiết PPCT
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={formData.ppctPeriod || 1}
                onChange={(e) => handleChange('ppctPeriod', parseInt(e.target.value, 10) || 1)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-extrabold text-blue-600 dark:text-blue-400 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Tên bài dạy & Button chọn bài */}
            <div className="space-y-2 p-3 bg-blue-50/60 dark:bg-blue-950/30 rounded-xl border border-blue-200/80 dark:border-blue-900/60">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-extrabold text-blue-900 dark:text-blue-300">
                  Tên bài dạy
                </label>
                <button
                  type="button"
                  onClick={() => setIsLessonPickerOpen(true)}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1 shadow-2xs"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>📚 Chọn bài từ PPCT</span>
                </button>
              </div>

              <input
                type="text"
                value={formData.lessonTitle || ''}
                onChange={(e) => handleChange('lessonTitle', e.target.value)}
                placeholder="Nhập tên bài dạy..."
                className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Ghi chú */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Ghi chú
              </label>
              <input
                type="text"
                value={formData.notes || ''}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Nhập ghi chú (Dạy bù, Nghỉ lễ, Kiểm tra...)"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Trạng thái chuẩn bị bài */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                Trạng thái chuẩn bị
              </label>
              <div className="space-y-1.5">
                {[
                  { id: 'unprepared', label: '⚪ Chưa chuẩn bị' },
                  { id: 'preparing', label: '🟡 Đang chuẩn bị' },
                  { id: 'completed', label: '🟢 Đã hoàn thành' },
                ].map((st) => {
                  const isSelected = formData.status === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => handleStatusSelect(st.id as LessonStatus)}
                      className={`w-full text-left p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-900 dark:text-blue-200 ring-1 ring-blue-500'
                          : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <span>{st.label}</span>
                      {isSelected && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Drawer Footer */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/90 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Tự động lưu</span>
            </span>

            <div className="flex items-center gap-2">
              {onDelete && (
                <button
                  type="button"
                  onClick={handleOpenDeleteConfirm}
                  className="p-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/80 text-rose-600 dark:text-rose-400 rounded-xl transition-colors flex items-center gap-1 font-bold"
                  title="Xóa tiết này"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Xóa</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition-colors"
              >
                Lưu thay đổi
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Confirmation Modal for Delete */}
      {isConfirmDeleteOpen && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            
            {/* Header */}
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-rose-100 dark:bg-rose-950/80 text-rose-600 rounded-xl shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Bạn có chắc muốn xóa tiết dạy này?
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Tiết dạy sẽ bị xóa khỏi Lịch báo giảng. Phân phối chương trình sẽ không bị ảnh hưởng.
                </p>
              </div>
            </div>

            {/* Details Box */}
            <div className="p-3 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-xs space-y-2">
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                <span className="font-semibold text-slate-400">Thứ / Ngày:</span>
                <span className="font-bold text-slate-900 dark:text-white">{formData.dayOfWeek} – {dateStr}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                <span className="font-semibold text-slate-400">Buổi – Tiết:</span>
                <span className="font-bold text-slate-900 dark:text-white">{formatTableSessionPeriod(formData.period || 1)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                <span className="font-semibold text-slate-400">Lớp:</span>
                <span className="font-black px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 rounded-md">
                  {formData.className || '—'}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800">
                <span className="font-semibold text-slate-400 block mb-0.5">Tên bài dạy:</span>
                <span className="font-bold text-slate-900 dark:text-white block line-clamp-2">
                  {formData.lessonTitle || 'Chưa chọn bài'}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsConfirmDeleteOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-sm transition-colors"
              >
                Xóa tiết dạy
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Sub-modal: "📚 Chọn bài từ PPCT" */}
      {isLessonPickerOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2.5">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span>CHỌN BÀI DẠY TỪ PPCT ({currentSubject} - {currentGrade})</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsLessonPickerOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={pickerSearchQuery}
                onChange={(e) => setPickerSearchQuery(e.target.value)}
                placeholder="Tìm bài học..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Lessons List */}
            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
              {filteredPpctItems.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">Không tìm thấy bài học phù hợp</p>
              ) : (
                filteredPpctItems.map((pItem) => (
                  <button
                    key={pItem.id || pItem.periodNumber}
                    type="button"
                    onClick={() => handleSelectPpctItem(pItem)}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/50 border border-slate-100 dark:border-slate-700/60 transition-colors group"
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                        Tiết PPCT {pItem.periodNumber} (Tuần {pItem.week})
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-700 dark:group-hover:text-blue-300">
                      {pItem.title}
                    </p>
                  </button>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex justify-end">
              <button
                type="button"
                onClick={() => setIsLessonPickerOpen(false)}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-70 bg-emerald-900 text-emerald-100 px-4 py-3 rounded-xl shadow-2xl border border-emerald-700 text-xs font-bold flex items-center gap-2 animate-bounceIn">
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
};
