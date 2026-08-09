import React, { useState, useEffect } from 'react';
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
  X,
  ShieldCheck,
  Check,
  BookmarkCheck,
  Library
} from 'lucide-react';
import { PPCTCurriculum, PPCTItem, ScheduleItem, TeacherProfile, SharedCurriculum } from '../types';
import { PREDEFINED_PPCTS, getPredefinedPPCT, PRIMARY_SUBJECTS } from '../data/primaryCurriculums';
import { downloadPPCTTemplate, exportPPCTToExcel } from '../utils/ppctExcelUtils';
import { PpctExcelImportModal } from './PpctExcelImportModal';
import { useAuth } from '../context/AuthContext';
import { 
  fetchSharedCurriculums, 
  saveSharedCurriculum, 
  updateSharedCurriculum, 
  deleteSharedCurriculum,
  fetchTeacherCurriculumData,
  selectCurriculumForTeacher
} from '../lib/firebase';

interface PPCTViewProps {
  teacher: TeacherProfile;
  schedules?: ScheduleItem[];
  curriculums: PPCTCurriculum[]; // Legacy / Personal curriculums
  onSaveCurriculum: (curriculum: PPCTCurriculum) => void;
  onSyncToSchedule: (curriculum: PPCTCurriculum | SharedCurriculum) => void;
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
  const { userRole, isAdmin } = useAuth();

  // Tab View Mode: 'library' (Kho PPCT Chung) vs 'my_ppcts' (PPCT Cá nhân / Cũ)
  const [activeTab, setActiveTab] = useState<'library' | 'my_ppcts'>('library');

  // Shared Curriculums State (curriculumLibrary)
  const [sharedCurriculums, setSharedCurriculums] = useState<SharedCurriculum[]>([]);
  const [isLoadingShared, setIsLoadingShared] = useState<boolean>(false);
  const [selectedSharedCurriculumId, setSelectedSharedCurriculumId] = useState<string | null>(null);

  // Teacher Selections State (teacherCurriculumData/{uid})
  const [selectedCurriculumIds, setSelectedCurriculumIds] = useState<string[]>([]);

  // Selection Dropdowns State
  const [selectedGrade, setSelectedGrade] = useState('Khối 4');
  const [selectedSubject, setSelectedSubject] = useState('Tin học');
  const [selectedTextbook, setSelectedTextbook] = useState('Chân trời sáng tạo');
  const [searchQuery, setSearchQuery] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Deletion modal and toast state
  const [deletingCurriculum, setDeletingCurriculum] = useState<PPCTCurriculum | SharedCurriculum | null>(null);
  const [isDeletingShared, setIsDeletingShared] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Active items being displayed in table
  const [items, setItems] = useState<PPCTItem[]>([]);

  // 1. Fetch Shared Curriculums & Teacher Selections on Mount
  const loadSharedLibraryData = async () => {
    setIsLoadingShared(true);
    try {
      const sharedList = await fetchSharedCurriculums();
      setSharedCurriculums(sharedList);

      if (teacher.uid) {
        const teacherData = await fetchTeacherCurriculumData(teacher.uid);
        if (teacherData && teacherData.curriculumSelections) {
          setSelectedCurriculumIds(teacherData.curriculumSelections.map(s => s.curriculumId));
        }
      }
    } catch (err) {
      console.error('Lỗi khi tải Kho PPCT Dùng Chung:', err);
    } finally {
      setIsLoadingShared(false);
    }
  };

  useEffect(() => {
    loadSharedLibraryData();
  }, [teacher.uid]);

  // Sync items based on activeTab, selectedGrade, and selectedSubject
  useEffect(() => {
    if (activeTab === 'library') {
      const matchingShared = sharedCurriculums.find(
        sc => sc.grade === selectedGrade && sc.subject === selectedSubject
      );
      if (matchingShared) {
        setSelectedSharedCurriculumId(matchingShared.id);
        setItems(matchingShared.items || []);
      } else {
        setSelectedSharedCurriculumId(null);
        const predefined = getPredefinedPPCT(selectedGrade, selectedSubject, selectedTextbook);
        setItems(predefined ? [...predefined.items] : []);
      }
    } else {
      // Legacy / Personal curriculums
      const saved = curriculums.find(c => c.grade === selectedGrade && (c.subject || 'Tin học') === selectedSubject);
      if (saved) {
        setItems(saved.items || []);
      } else {
        const predefined = getPredefinedPPCT(selectedGrade, selectedSubject, selectedTextbook);
        setItems(predefined ? [...predefined.items] : []);
      }
    }
  }, [activeTab, selectedGrade, selectedSubject, sharedCurriculums, curriculums]);

  const handleGradeChange = (newGrade: string) => {
    setSelectedGrade(newGrade);
  };

  const handleSubjectChange = (newSubject: string) => {
    setSelectedSubject(newSubject);
  };

  // ADMIN Action: Save / Update Shared Curriculum in curriculumLibrary
  const handleSaveSharedPPCT = async () => {
    if (!isAdmin) return;

    const currId = selectedSharedCurriculumId || `${teacher.academicYear || '2026-2027'}_${selectedSubject}_${selectedGrade}`.replace(/\s+/g, '');
    const sharedData: SharedCurriculum = {
      id: currId,
      academicYear: teacher.academicYear || '2026 - 2027',
      subject: selectedSubject,
      grade: selectedGrade,
      name: `Phân phối chương trình ${selectedSubject} ${selectedGrade}`,
      items: items,
      version: 1,
      updatedBy: teacher.uid || 'admin',
      updatedAt: new Date().toISOString()
    };

    try {
      await saveSharedCurriculum(sharedData);
      setToastMessage({
        type: 'success',
        text: `✅ [ADMIN] Đã lưu PPCT Dùng Chung ${selectedSubject} ${selectedGrade} vào Kho Library!`
      });
      await loadSharedLibraryData();
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error('Lỗi khi Admin lưu PPCT chung:', err);
      setToastMessage({
        type: 'error',
        text: '❌ Không thể lưu PPCT Dùng Chung. Vui lòng kiểm tra lại.'
      });
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  // TEACHER Action: Select a Shared Curriculum for usage
  const handleTeacherSelectSharedPPCT = async (sharedCurr: SharedCurriculum) => {
    if (!teacher.uid) return;
    try {
      await selectCurriculumForTeacher(teacher.uid, sharedCurr.id);
      setSelectedCurriculumIds(prev => Array.from(new Set([...prev, sharedCurr.id])));
      setToastMessage({
        type: 'success',
        text: `📌 Đã chọn sử dụng PPCT ${sharedCurr.subject} ${sharedCurr.grade} cho tài khoản cá nhân!`
      });
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error('Lỗi khi chọn PPCT dùng chung:', err);
      setToastMessage({
        type: 'error',
        text: '❌ Lỗi khi chọn PPCT. Vui lòng thử lại.'
      });
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  // Save legacy/personal PPCT
  const handleSaveCurrentPPCT = () => {
    const currId = `ppct-${selectedGrade}-${selectedSubject}`.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const curr: PPCTCurriculum = {
      id: currId,
      teacherId: teacher.uid,
      grade: selectedGrade,
      subject: selectedSubject,
      textbook: selectedTextbook || '',
      academicYear: teacher.academicYear || '2026 - 2027',
      semester: teacher.semester || 'Học kỳ I',
      items: items,
      updatedAt: new Date().toISOString(),
    };
    onSaveCurriculum(curr);
    setToastMessage({
      type: 'success',
      text: `✅ Đã lưu PPCT Cá Nhân ${selectedSubject} ${selectedGrade} (${items.length} tiết) thành công!`
    });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Handle Delete Confirmation Execution
  const handleConfirmDelete = async () => {
    if (!deletingCurriculum) return;

    try {
      if (isDeletingShared && isAdmin) {
        // Delete from curriculumLibrary
        await deleteSharedCurriculum(deletingCurriculum.id);
        await loadSharedLibraryData();
        setToastMessage({
          type: 'success',
          text: '✅ [ADMIN] Đã xóa PPCT Dùng Chung khỏi Kho Library thành công.'
        });
      } else if (onDeleteCurriculum) {
        // Delete legacy personal PPCT
        onDeleteCurriculum(deletingCurriculum.id);
        setToastMessage({
          type: 'success',
          text: '✅ Đã xóa Phân phối chương trình cá nhân thành công.'
        });
      }

      setDeletingCurriculum(null);
      setIsDeletingShared(false);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      console.error('Lỗi khi xóa PPCT:', err);
      setDeletingCurriculum(null);
      setIsDeletingShared(false);
      setToastMessage({
        type: 'error',
        text: '❌ Không thể xóa PPCT. Vui lòng thử lại.'
      });
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  // Sync / Load default dataset
  const handleLoadDefaultPPCT = () => {
    const predefined = getPredefinedPPCT(selectedGrade, selectedSubject, selectedTextbook);
    if (predefined) {
      setItems([...predefined.items]);
    } else {
      alert(`Không tìm thấy PPCT sẵn có cho môn ${selectedSubject} - ${selectedGrade}. Bạn có thể tạo hoặc Nhập từ Excel!`);
    }
  };

  const handleApplyPPCTToSchedule = () => {
    const activeShared = sharedCurriculums.find(sc => sc.grade === selectedGrade && sc.subject === selectedSubject);
    const currToSync = activeShared || {
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

    onSyncToSchedule(currToSync);
    alert(`⚡ Đã đồng bộ ${items.length} tiết PPCT ${selectedSubject} ${selectedGrade} vào Lịch báo giảng thành công!`);
  };

  const handleConfirmImportCurriculum = async (importedCurr: PPCTCurriculum) => {
    if (activeTab === 'library' && isAdmin) {
      // Save directly to curriculumLibrary for Admin
      const sharedData: SharedCurriculum = {
        id: importedCurr.id || `${teacher.academicYear}_${importedCurr.subject}_${importedCurr.grade}`.replace(/\s+/g, ''),
        academicYear: importedCurr.academicYear || teacher.academicYear || '2026 - 2027',
        subject: importedCurr.subject,
        grade: importedCurr.grade,
        name: `Phân phối chương trình ${importedCurr.subject} ${importedCurr.grade}`,
        items: importedCurr.items,
        version: 1,
        updatedBy: teacher.uid || 'admin',
        updatedAt: new Date().toISOString()
      };
      await saveSharedCurriculum(sharedData);
      await loadSharedLibraryData();
      setToastMessage({
        type: 'success',
        text: `✅ [ADMIN] Đã nhập thành công PPCT Dùng Chung cho môn ${importedCurr.subject} ${importedCurr.grade}!`
      });
    } else {
      onSaveCurriculum(importedCurr);
    }
    setSelectedGrade(importedCurr.grade);
    setSelectedSubject(importedCurr.subject);
    setItems(importedCurr.items);
  };

  const handleItemChange = (id: string, field: keyof PPCTItem, val: any) => {
    const updated = items.map(item => item.id === id ? { ...item, [field]: val } : item);
    setItems(updated);
  };

  const handleAddItem = () => {
    const newItem: PPCTItem = {
      id: `lesson-${items.length + 1}`,
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
      
      {/* Header Bar */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center space-x-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Chức năng Quản lý Phân Phối Chương Trình (PPCT)</span>
              </div>
              {isAdmin ? (
                <span className="inline-flex items-center gap-1 text-xs font-extrabold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950 px-2.5 py-1 rounded-full border border-purple-200 dark:border-purple-800">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Quyền Quản trị viên (Admin)</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950 px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-800">
                  <span>Giáo viên</span>
                </span>
              )}
            </div>

            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Phân phối chương trình Dùng chung & Lịch báo giảng
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isAdmin 
                ? 'Admin quản lý Kho PPCT Dùng Chung toàn trường (curriculumLibrary) và phân quyền cho giáo viên.'
                : 'Giáo viên tham chiếu Kho PPCT Dùng Chung của trường hoặc quản lý bộ PPCT cá nhân.'}
            </p>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-blue-500/20 flex items-center space-x-2 transition-all transform hover:-translate-y-0.5"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>📥 Nhập Excel {activeTab === 'library' && isAdmin ? 'vào Kho Chung' : ''}</span>
            </button>

            <button
              onClick={downloadPPCTTemplate}
              className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-600 flex items-center space-x-1.5 transition-colors"
            >
              <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>File mẫu</span>
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
              <span>⚡ Đồng bộ Lịch báo giảng</span>
            </button>
          </div>
        </div>

        {/* Tab Selector: KHO PPCT DÙNG CHUNG vs PPCT CÁ NHÂN */}
        <div className="flex border-b border-slate-200 dark:border-slate-700 pt-2 gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('library')}
            className={`pb-3 px-1 text-xs font-extrabold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'library'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <Library className="w-4 h-4" />
            <span>KHO PPCT DÙNG CHUNG (curriculumLibrary)</span>
            <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-[10px] px-2 py-0.5 rounded-full font-bold">
              {sharedCurriculums.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('my_ppcts')}
            className={`pb-3 px-1 text-xs font-extrabold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'my_ppcts'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>PPCT CÁ NHÂN / CŨ (curriculums)</span>
            <span className="bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 text-[10px] px-2 py-0.5 rounded-full font-bold">
              {curriculums.length}
            </span>
          </button>
        </div>

        {/* Dropdowns Selection Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Khối lớp
            </label>
            <select
              value={selectedGrade}
              onChange={(e) => handleGradeChange(e.target.value)}
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
              onChange={(e) => handleSubjectChange(e.target.value)}
              className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
            >
              {PRIMARY_SUBJECTS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col justify-between">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Tổng số tiết bài học: <strong className="text-emerald-600 dark:text-emerald-400 text-sm">{items.length} tiết</strong>
            </div>
            <div className="flex items-center justify-between gap-2 mt-1">
              <button
                type="button"
                onClick={handleLoadDefaultPPCT}
                className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Nạp mẫu chuẩn GDPT</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* TAB 1: KHO PPCT DÙNG CHUNG (curriculumLibrary) */}
      {activeTab === 'library' && (
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
            <div className="space-y-0.5">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Library className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>KHO PPCT DÙNG CHUNG TOÀN TRƯỜNG ({sharedCurriculums.length} bộ chương trình)</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                {isAdmin 
                  ? 'Quản trị viên có toàn quyền thêm, sửa, xóa các bộ PPCT dùng chung cho toàn bộ giáo viên.'
                  : 'Giáo viên chỉ có quyền đọc và chọn PPCT dùng chung để đồng bộ vào Lịch báo giảng cá nhân.'}
              </p>
            </div>

            {isAdmin && (
              <button
                type="button"
                onClick={handleSaveSharedPPCT}
                className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-extrabold shadow-sm flex items-center gap-1.5 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>➕ [ADMIN] Lưu/Thêm Kho Chung</span>
              </button>
            )}
          </div>

          {isLoadingShared ? (
            <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
              <span>Đang tải Kho PPCT Dùng Chung...</span>
            </div>
          ) : sharedCurriculums.length === 0 ? (
            <div className="p-6 bg-purple-50/50 dark:bg-slate-900/50 rounded-xl text-center text-xs text-slate-500 dark:text-slate-400 italic space-y-2">
              <p>Chưa có bộ PPCT Dùng Chung nào trong Kho Library.</p>
              {isAdmin && (
                <p className="text-purple-700 dark:text-purple-300 font-bold">
                  👉 ADMIN có thể chọn Khối/Môn bên trên và bấm <strong>"➕ [ADMIN] Lưu/Thêm Kho Chung"</strong> hoặc <strong>"📥 Nhập Excel vào Kho Chung"</strong> để đăng tải bộ PPCT đầu tiên!
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {sharedCurriculums.map((sc) => {
                const isSelectedByTeacher = selectedCurriculumIds.includes(sc.id);
                const isCurrentGradeSubject = sc.grade === selectedGrade && sc.subject === selectedSubject;

                return (
                  <div
                    key={sc.id}
                    className={`p-3.5 rounded-2xl border transition-all space-y-2.5 ${
                      isSelectedByTeacher
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700'
                        : isCurrentGradeSubject
                        ? 'bg-purple-50/70 dark:bg-purple-950/40 border-purple-300 dark:border-purple-700'
                        : 'bg-slate-50/70 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-extrabold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950 px-2 py-0.5 rounded-md">
                          {sc.grade} • {sc.subject}
                        </span>
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                          {sc.name || `PPCT ${sc.subject} ${sc.grade}`}
                        </h4>
                        <p className="text-[10px] text-slate-400">
                          {sc.items?.length || 0} bài học | {sc.academicYear}
                        </p>
                      </div>

                      {isSelectedByTeacher && (
                        <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>Đang dùng</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedGrade(sc.grade);
                          setSelectedSubject(sc.subject);
                          setSelectedSharedCurriculumId(sc.id);
                          setItems(sc.items || []);
                        }}
                        className="px-2.5 py-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg text-[11px] font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3 text-purple-500" />
                        <span>Xem chi tiết</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        {/* TEACHER Action Button: Select for Usage */}
                        <button
                          type="button"
                          onClick={() => handleTeacherSelectSharedPPCT(sc)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                            isSelectedByTeacher
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                          }`}
                        >
                          <BookmarkCheck className="w-3.5 h-3.5" />
                          <span>{isSelectedByTeacher ? 'Đã chọn' : '📌 Chọn dùng'}</span>
                        </button>

                        {/* ADMIN Action Button: Delete Shared Curriculum */}
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingCurriculum(sc as any);
                              setIsDeletingShared(true);
                            }}
                            title="Xóa PPCT Dùng Chung (Admin)"
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
      )}

      {/* TAB 2: PPCT CỦA TÔI / CŨ (curriculums/{uid}) */}
      {activeTab === 'my_ppcts' && (
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>📚 BỘ PPCT CÁ NHÂN / CŨ ({curriculums.length} bộ đã lưu)</span>
            </h3>
            <span className="text-[11px] text-slate-400">
              Dữ liệu PPCT cá nhân luôn được lưu trữ an toàn nguyên vẹn
            </span>
          </div>

          {curriculums.length === 0 ? (
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-center text-xs text-slate-400 italic">
              Chưa có PPCT cá nhân nào được tạo.
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

                        {onDeleteCurriculum && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingCurriculum(c);
                              setIsDeletingShared(false);
                            }}
                            title="Xóa PPCT cá nhân"
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
      )}

      {/* Curriculum Items Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm overflow-hidden space-y-4 p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm bài học trong PPCT..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Show Save Buttons depending on role & tab */}
            {activeTab === 'library' && isAdmin ? (
              <button
                onClick={handleSaveSharedPPCT}
                className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-xs"
              >
                <Save className="w-4 h-4" />
                <span>[ADMIN] Lưu Kho Chung</span>
              </button>
            ) : (
              <button
                onClick={handleSaveCurrentPPCT}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-xs"
              >
                <Save className="w-4 h-4" />
                <span>Lưu PPCT Cá Nhân</span>
              </button>
            )}

            {(activeTab === 'my_ppcts' || isAdmin) && (
              <button
                onClick={handleAddItem}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm bài mới</span>
              </button>
            )}
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
                {(activeTab === 'my_ppcts' || isAdmin) && (
                  <th className="p-3 text-center w-16">Thao tác</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-3 text-center font-bold text-blue-600 dark:text-blue-400">
                    {activeTab === 'my_ppcts' || isAdmin ? (
                      <input
                        type="number"
                        value={item.week}
                        onChange={(e) => handleItemChange(item.id, 'week', parseInt(e.target.value) || 1)}
                        className="w-12 text-center bg-transparent border border-transparent hover:border-slate-300 rounded font-bold"
                      />
                    ) : (
                      <span>Tuần {item.week}</span>
                    )}
                  </td>
                  <td className="p-3 text-center font-bold text-slate-700 dark:text-slate-300">
                    Tiết {item.periodNumber}
                  </td>
                  <td className="p-3 font-semibold text-slate-900 dark:text-white">
                    {activeTab === 'my_ppcts' || isAdmin ? (
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => handleItemChange(item.id, 'title', e.target.value)}
                        className="w-full bg-transparent border border-transparent hover:border-slate-300 dark:hover:border-slate-700 p-1 rounded font-semibold"
                      />
                    ) : (
                      <span>{item.title}</span>
                    )}
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-400">
                    {activeTab === 'my_ppcts' || isAdmin ? (
                      <input
                        type="text"
                        value={item.topic || ''}
                        onChange={(e) => handleItemChange(item.id, 'topic', e.target.value)}
                        className="w-full bg-transparent border border-transparent hover:border-slate-300 dark:hover:border-slate-700 p-1 rounded"
                      />
                    ) : (
                      <span>{item.topic || '-'}</span>
                    )}
                  </td>
                  <td className="p-3 text-slate-500 dark:text-slate-400">
                    {activeTab === 'my_ppcts' || isAdmin ? (
                      <input
                        type="text"
                        value={item.requirements || ''}
                        onChange={(e) => handleItemChange(item.id, 'requirements', e.target.value)}
                        className="w-full bg-transparent border border-transparent hover:border-slate-300 dark:hover:border-slate-700 p-1 rounded"
                      />
                    ) : (
                      <span>{item.requirements || '-'}</span>
                    )}
                  </td>
                  {(activeTab === 'my_ppcts' || isAdmin) && (
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                        title="Xóa bài này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
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
                onClick={() => {
                  setDeletingCurriculum(null);
                  setIsDeletingShared(false);
                }}
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
                  {deletingCurriculum.items?.length || 0} bài học
                </p>
              </div>

              {isDeletingShared ? (
                <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>⚠️ [ADMIN] Thao tác này sẽ xóa bộ PPCT Dùng Chung khỏi Kho Library.</span>
                </p>
              ) : (
                <p className="text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>⚠️ Dữ liệu PPCT sẽ bị xóa khỏi hệ thống cá nhân.</span>
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
              <button
                type="button"
                onClick={() => {
                  setDeletingCurriculum(null);
                  setIsDeletingShared(false);
                }}
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
                <span>Xóa PPCT</span>
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

