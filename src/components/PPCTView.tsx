import React, { useState } from 'react';
import { 
  BookOpen, 
  Sparkles, 
  Plus, 
  Trash2, 
  Edit, 
  CheckCircle2, 
  RefreshCw, 
  Save, 
  Layers,
  Search,
  FileSpreadsheet,
  Download,
  Copy,
  Eye,
  FileDown,
  AlertTriangle,
  X
} from 'lucide-react';
import { PPCTCurriculum, PPCTItem, ScheduleItem, TeacherProfile } from '../types';
import { PREDEFINED_PPCTS, getPredefinedPPCT } from '../data/primaryCurriculums';
import { downloadPPCTTemplate, exportPPCTToExcel } from '../utils/ppctExcelUtils';
import { PpctExcelImportModal } from './PpctExcelImportModal';

interface PPCTViewProps {
  teacher: TeacherProfile;
  schedules?: ScheduleItem[];
  curriculums: PPCTCurriculum[];
  onSaveCurriculum: (curriculum: PPCTCurriculum) => void;
  onSyncToSchedule: (curriculum: PPCTCurriculum) => void;
  onDeleteCurriculum?: (id: string) => void;
}

export const PPCTView: React.FC<PPCTViewProps> = ({
  teacher,
  schedules = [],
  curriculums,
  onSaveCurriculum,
  onSyncToSchedule,
  onDeleteCurriculum,
}) => {
  const [selectedGrade, setSelectedGrade] = useState('Khối 4');
  const [selectedSubject, setSelectedSubject] = useState('Tin học');
  const [selectedTextbook, setSelectedTextbook] = useState('Chân trời sáng tạo');
  const [searchQuery, setSearchQuery] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // State for PPCT deletion modal and toast
  const [deletingCurriculum, setDeletingCurriculum] = useState<PPCTCurriculum | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Find existing loaded curriculum or get predefined match
  const currentCurriculum = curriculums.find(
    c => c.grade === selectedGrade && c.subject === selectedSubject
  );

  const [items, setItems] = useState<PPCTItem[]>(
    currentCurriculum?.items || getPredefinedPPCT(selectedGrade, selectedSubject, selectedTextbook)?.items || []
  );

  // Handle Delete Confirmation Execution
  const handleConfirmDelete = () => {
    if (!deletingCurriculum) return;

    try {
      const targetId = deletingCurriculum.id;
      const targetGrade = deletingCurriculum.grade;
      const targetSubject = deletingCurriculum.subject;

      if (onDeleteCurriculum) {
        onDeleteCurriculum(targetId);
      }

      // If deleted curriculum is currently loaded in table, reset items
      if (selectedGrade === targetGrade && selectedSubject === targetSubject) {
        setItems([]);
      }

      setDeletingCurriculum(null);
      setToastMessage({
        type: 'success',
        text: '✅ Đã xóa Phân phối chương trình thành công.'
      });
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      console.error('Lỗi khi xóa PPCT:', err);
      setDeletingCurriculum(null);
      setToastMessage({
        type: 'error',
        text: '❌ Không thể xóa PPCT. Vui lòng thử lại.'
      });
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  // Check if target deleting curriculum is currently used in schedule
  const isTargetUsedInSchedule = deletingCurriculum
    ? schedules.some(s => s.grade === deletingCurriculum.grade && s.subject === deletingCurriculum.subject)
    : false;

  // Sync / Load default dataset
  const handleLoadDefaultPPCT = () => {
    const predefined = getPredefinedPPCT(selectedGrade, selectedSubject, selectedTextbook);
    if (predefined) {
      setItems([...predefined.items]);
      const newCurr: PPCTCurriculum = {
        id: `${selectedGrade}-${selectedSubject}`.toLowerCase().replace(/\s+/g, '-'),
        teacherId: teacher.uid,
        grade: selectedGrade,
        subject: selectedSubject,
        textbook: '',
        academicYear: teacher.academicYear,
        semester: teacher.semester,
        items: predefined.items,
        updatedAt: new Date().toISOString(),
      };
      onSaveCurriculum(newCurr);
    } else {
      alert(`Không tìm thấy PPCT sẵn có cho môn ${selectedSubject} - ${selectedGrade}. Bạn có thể tạo hoặc Nhập từ Excel!`);
    }
  };

  const handleApplyPPCTToSchedule = () => {
    const curr: PPCTCurriculum = {
      id: `${selectedGrade}-${selectedSubject}`.toLowerCase().replace(/\s+/g, '-'),
      teacherId: teacher.uid,
      grade: selectedGrade,
      subject: selectedSubject,
      textbook: '',
      academicYear: teacher.academicYear,
      semester: teacher.semester,
      items: items,
      updatedAt: new Date().toISOString(),
    };
    onSaveCurriculum(curr);
    onSyncToSchedule(curr);
    alert(`⚡ Đã đồng bộ ${items.length} tiết PPCT ${selectedSubject} ${selectedGrade} vào Lịch báo giảng thành công!`);
  };

  const handleConfirmImportCurriculum = (newCurriculum: PPCTCurriculum, overwriteExisting: boolean) => {
    onSaveCurriculum(newCurriculum);
    setSelectedGrade(newCurriculum.grade);
    setSelectedSubject(newCurriculum.subject);
    setItems(newCurriculum.items);
  };

  const handleItemChange = (id: string, field: keyof PPCTItem, val: any) => {
    const updated = items.map(item => item.id === id ? { ...item, [field]: val } : item);
    setItems(updated);
  };

  const handleAddItem = () => {
    const newItem: PPCTItem = {
      id: `custom-${Date.now()}`,
      week: items.length > 0 ? items[items.length - 1].week : 1,
      periodNumber: items.length + 1,
      title: 'Bài học mới...',
      topic: 'Chủ đề mới',
      requirements: 'Yêu cầu cần đạt...',
    };
    setItems([...items, newItem]);
  };

  const handleDeleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  // Export current active PPCT
  const handleExportCurrentToExcel = () => {
    const curr: PPCTCurriculum = {
      id: `${selectedGrade}-${selectedSubject}`.toLowerCase().replace(/\s+/g, '-'),
      teacherId: teacher.uid,
      grade: selectedGrade,
      subject: selectedSubject,
      textbook: '',
      academicYear: teacher.academicYear,
      semester: teacher.semester,
      items: items,
      updatedAt: new Date().toISOString(),
    };
    exportPPCTToExcel(curr);
  };

  const filteredItems = items.filter(item => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return item.title.toLowerCase().includes(q) || item.topic?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      
      {/* Header Bar with Prominent Excel Import Buttons */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Chức năng Đồng Bộ Phân Phối Chương Trình (PPCT)</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Quản lý Phân phối chương trình Lớp học
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tự động liên kết bài dạy 35 tuần với Thời khóa biểu cố định và sinh Lịch báo giảng.
            </p>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-blue-500/20 flex items-center space-x-2 transition-all transform hover:-translate-y-0.5"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>📥 Nhập PPCT từ Excel</span>
            </button>

            <button
              onClick={downloadPPCTTemplate}
              className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-600 flex items-center space-x-1.5 transition-colors"
            >
              <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>📄 Tải file Excel mẫu</span>
            </button>

            <button
              onClick={handleExportCurrentToExcel}
              className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-600 flex items-center space-x-1.5 transition-colors"
            >
              <FileDown className="w-4 h-4 text-blue-500" />
              <span>Xuất Excel</span>
            </button>

            <button
              onClick={handleApplyPPCTToSchedule}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-emerald-500/20 flex items-center space-x-1.5 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>⚡ Đồng bộ PPCT</span>
            </button>
          </div>
        </div>

        {/* Dropdowns Selection Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Khối lớp
            </label>
            <select
              value={selectedGrade}
              onChange={(e) => {
                setSelectedGrade(e.target.value);
                const saved = curriculums.find(c => c.grade === e.target.value && c.subject === selectedSubject);
                if (saved) {
                  setItems(saved.items);
                } else {
                  const p = getPredefinedPPCT(e.target.value, selectedSubject, '');
                  if (p) setItems([...p.items]);
                }
              }}
              className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
            >
              {['Khối 1', 'Khối 2', 'Khối 3', 'Khối 4', 'Khối 5'].map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Môn học
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => {
                setSelectedSubject(e.target.value);
                const saved = curriculums.find(c => c.grade === selectedGrade && c.subject === e.target.value);
                if (saved) {
                  setItems(saved.items);
                } else {
                  const p = getPredefinedPPCT(selectedGrade, e.target.value, '');
                  if (p) setItems([...p.items]);
                }
              }}
              className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
            >
              {['Tin học', 'Toán', 'Tiếng Việt', 'Công nghệ', 'Đạo đức', 'Tự nhiên và Xã hội'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col justify-between">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Tổng số tiết chương trình: <strong className="text-emerald-600 dark:text-emerald-400 text-sm">{items.length} tiết</strong>
            </div>
            <div className="flex items-center justify-between gap-2 mt-1">
              <button
                type="button"
                onClick={handleLoadDefaultPPCT}
                className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Nạp dữ liệu PPCT mặc định</span>
              </button>

              {currentCurriculum && onDeleteCurriculum && (
                <button
                  type="button"
                  onClick={() => setDeletingCurriculum(currentCurriculum)}
                  className="text-[11px] font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 px-2 py-0.5 rounded-md transition-colors flex items-center gap-1"
                  title="Xóa bộ PPCT đang chọn"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Xóa PPCT này</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MY SAVED PPCTS COLLECTION ("📚 PPCT CỦA TÔI") */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>📚 PPCT CỦA TÔI ({curriculums.length} bộ chương trình đã lưu)</span>
          </h3>
          <span className="text-[11px] text-slate-400">
            Dễ dàng quản lý, xem, nhân bản hoặc xuất Excel
          </span>
        </div>

        {curriculums.length === 0 ? (
          <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-center text-xs text-slate-400 italic">
            Chưa có PPCT tùy chỉnh nào được lưu. Bạn có thể nhấn <strong>"📥 Nhập PPCT từ Excel"</strong> để tải file Excel chương trình của mình lên!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {curriculums.map((c) => {
              const isCurrentSelected = c.grade === selectedGrade && c.subject === selectedSubject;
              return (
                <div
                  key={c.id}
                  className={`p-3.5 rounded-2xl border transition-all space-y-2.5 ${
                    isCurrentSelected
                      ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 shadow-2xs'
                      : 'bg-slate-50/70 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-100/80 dark:bg-blue-950 px-2 py-0.5 rounded-md">
                        {c.grade} • {c.subject}
                      </span>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                        Phân phối chương trình {c.subject} {c.grade}
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        {c.items?.length || 0} bài học | {c.academicYear} ({c.semester})
                      </p>
                    </div>

                    {isCurrentSelected && (
                      <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full shrink-0">
                        Đang chọn
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedGrade(c.grade);
                        setSelectedSubject(c.subject);
                        setItems(c.items);
                      }}
                      className="px-2.5 py-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg text-[11px] font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3 text-blue-500" />
                      <span>Xem / Chọn</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => exportPPCTToExcel(c)}
                        title="Xuất Excel"
                        className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const dup: PPCTCurriculum = {
                            ...c,
                            id: `${c.id}-copy-${Date.now()}`,
                            updatedAt: new Date().toISOString(),
                          };
                          onSaveCurriculum(dup);
                          setToastMessage({
                            type: 'success',
                            text: `Đã nhân bản bộ PPCT ${c.subject} ${c.grade} thành công!`
                          });
                          setTimeout(() => setToastMessage(null), 3000);
                        }}
                        title="Nhân bản"
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      {onDeleteCurriculum && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingCurriculum(c);
                          }}
                          title="Xóa PPCT"
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Curriculum Items Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm overflow-hidden space-y-4 p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm bài học..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={handleAddItem}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm bài học mới</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                <th className="p-3 text-center w-16">Tuần</th>
                <th className="p-3 text-center w-20">Tiết PPCT</th>
                <th className="p-3 w-1/3">Tên bài dạy</th>
                <th className="p-3 w-1/4">Chủ đề / Mạch kiến thức</th>
                <th className="p-3">Yêu cầu cần đạt (GDPT 2018)</th>
                <th className="p-3 text-center w-16">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-3 text-center font-bold text-blue-600 dark:text-blue-400">
                    <input
                      type="number"
                      value={item.week}
                      onChange={(e) => handleItemChange(item.id, 'week', parseInt(e.target.value) || 1)}
                      className="w-12 text-center bg-transparent border border-transparent hover:border-slate-300 rounded font-bold"
                    />
                  </td>
                  <td className="p-3 text-center font-bold text-slate-700 dark:text-slate-300">
                    {item.periodNumber}
                  </td>
                  <td className="p-3 font-semibold text-slate-900 dark:text-white">
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => handleItemChange(item.id, 'title', e.target.value)}
                      className="w-full bg-transparent border border-transparent hover:border-slate-300 dark:hover:border-slate-700 p-1 rounded font-semibold"
                    />
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-400">
                    <input
                      type="text"
                      value={item.topic || ''}
                      onChange={(e) => handleItemChange(item.id, 'topic', e.target.value)}
                      className="w-full bg-transparent border border-transparent hover:border-slate-300 dark:hover:border-slate-700 p-1 rounded"
                    />
                  </td>
                  <td className="p-3 text-slate-500 dark:text-slate-400">
                    <input
                      type="text"
                      value={item.requirements || ''}
                      onChange={(e) => handleItemChange(item.id, 'requirements', e.target.value)}
                      className="w-full bg-transparent border border-transparent hover:border-slate-300 dark:hover:border-slate-700 p-1 rounded"
                    />
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                      title="Xóa bài này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Excel Import Modal */}
      <PpctExcelImportModal
        teacher={teacher}
        existingCurriculums={curriculums}
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onConfirmImport={handleConfirmImportCurriculum}
      />

      {/* Delete PPCT Confirmation Modal */}
      {deletingCurriculum && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-extrabold text-sm tracking-wide">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>XÓA PHÂN PHỐI CHƯƠNG TRÌNH</span>
              </div>
              <button
                type="button"
                onClick={() => setDeletingCurriculum(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 py-1">
              <p className="text-xs text-slate-700 dark:text-slate-300">
                Bạn có chắc chắn muốn xóa:
              </p>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">
                  "Phân phối chương trình {deletingCurriculum.subject} {deletingCurriculum.grade}"
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  {deletingCurriculum.items?.length || 0} bài học | {deletingCurriculum.academicYear} ({deletingCurriculum.semester})
                </p>
              </div>

              {isTargetUsedInSchedule ? (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900/50 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                  <p className="font-bold flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>⚠️ PPCT này đang được sử dụng trong Lịch báo giảng. Bạn có chắc chắn muốn xóa?</span>
                  </p>
                  <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 pl-5">
                    Lưu ý: Thao tác này xóa bản ghi PPCT và KHÔNG tự động xóa dữ liệu lịch báo giảng đã được lập.
                  </p>
                </div>
              ) : (
                <p className="text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>⚠️ Dữ liệu PPCT sẽ bị xóa khỏi hệ thống.</span>
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setDeletingCurriculum(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isTargetUsedInSchedule ? 'Vẫn xóa' : 'Xóa PPCT'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Result Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl shadow-xl border text-xs font-bold flex items-center gap-3 animate-bounceIn ${
          toastMessage.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-100 border-emerald-300 dark:border-emerald-800'
            : 'bg-red-50 dark:bg-red-950 text-red-900 dark:text-red-100 border-red-300 dark:border-red-800'
        }`}>
          <span>{toastMessage.text}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

    </div>
  );
};
