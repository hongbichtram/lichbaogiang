import React, { useState, useRef } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  ArrowRight, 
  ArrowLeft, 
  Edit3, 
  FileCheck, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { PPCTCurriculum, PPCTItem, TeacherProfile } from '../types';
import { 
  downloadPPCTTemplate, 
  parseAndValidatePPCTExcel, 
  ParsedPPCTResult, 
  ParsedPPCTRow 
} from '../utils/ppctExcelUtils';

interface PpctExcelImportModalProps {
  teacher: TeacherProfile;
  existingCurriculums: PPCTCurriculum[];
  isOpen: boolean;
  onClose: () => void;
  onConfirmImport: (newCurriculum: PPCTCurriculum, overwriteExisting: boolean) => void;
}

export const PpctExcelImportModal: React.FC<PpctExcelImportModalProps> = ({
  teacher,
  existingCurriculums,
  isOpen,
  onClose,
  onConfirmImport,
}) => {
  if (!isOpen) return null;

  // Step state: 1 = Metadata, 2 = File Upload, 3 = Preview & Validate
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Metadata Form State
  const [academicYear, setAcademicYear] = useState<string>(teacher.academicYear || '2026 - 2027');
  const [semester, setSemester] = useState<string>(teacher.semester || 'Học kỳ I');
  const [subject, setSubject] = useState<string>(teacher.subjects[0] || 'Tin học');
  const [grade, setGrade] = useState<string>('Khối 4');
  const [textbook, setTextbook] = useState<string>('Chân trời sáng tạo');
  const [title, setTitle] = useState<string>(`PPCT ${subject} ${grade}`);

  // Auto update title when metadata changes
  const handleMetadataChange = (fGrade: string, fSubj: string) => {
    setTitle(`PPCT ${fSubj} ${fGrade}`);
  };

  // Uploaded File & Parsed Result State
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedResult, setParsedResult] = useState<ParsedPPCTResult | null>(null);

  // Duplicate warning prompt state
  const [showOverwritePrompt, setShowOverwritePrompt] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection or drop
  const handleProcessFile = async (selectedFile: File) => {
    if (!selectedFile.name.match(/\.(xlsx|xls)$/i)) {
      setParseError('Vui lòng chọn file Excel đúng định dạng (.xlsx hoặc .xls).');
      return;
    }

    setFile(selectedFile);
    setIsParsing(true);
    setParseError(null);

    try {
      const result = await parseAndValidatePPCTExcel(selectedFile);
      setParsedResult(result);
      setStep(3); // Advance to preview
    } catch (err: any) {
      setParseError(err || 'Không thể đọc dữ liệu file Excel. Vui lòng kiểm tra file.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  // Edit cell in preview table
  const handleRowCellChange = (rowIndex: number, field: keyof ParsedPPCTRow, val: any) => {
    if (!parsedResult) return;

    const updatedRows = parsedResult.rows.map(row => {
      if (row.rowIndex === rowIndex) {
        const updatedRow = { ...row, [field]: val };

        // Re-validate row
        const errors: string[] = [];
        if (!updatedRow.week || updatedRow.week <= 0) errors.push('Thiếu hoặc sai số Tuần');
        if (!updatedRow.periodNumber || updatedRow.periodNumber <= 0) errors.push('Thiếu số Tiết PPCT');
        if (!updatedRow.title || !updatedRow.title.trim()) errors.push('Chưa nhập Tên bài dạy');

        return { ...updatedRow, errors };
      }
      return row;
    });

    const validCount = updatedRows.filter(r => r.errors.length === 0).length;
    const invalidCount = updatedRows.length - validCount;

    setParsedResult({
      ...parsedResult,
      validCount,
      invalidCount,
      rows: updatedRows,
    });
  };

  // Check if existing matching PPCT is already in system
  const existingDuplicate = existingCurriculums.find(
    c => c.grade === grade && c.subject === subject && c.academicYear === academicYear
  );

  // Final confirmation to save PPCT
  const handleConfirmSave = (overwrite: boolean = false) => {
    if (!parsedResult || parsedResult.rows.length === 0) return;

    if (existingDuplicate && !overwrite && !showOverwritePrompt) {
      setShowOverwritePrompt(true);
      return;
    }

    const items: PPCTItem[] = parsedResult.rows.map(row => ({
      id: `ppct-item-${Date.now()}-${row.periodNumber}-${Math.random().toString(36).substr(2, 4)}`,
      week: row.week,
      periodNumber: row.periodNumber,
      title: row.title,
      topic: row.topic || '',
      requirements: row.requirements || '',
      note: row.notes || '',
    }));

    const newCurriculum: PPCTCurriculum = {
      id: `${grade}-${subject}`.toLowerCase().replace(/\s+/g, '-'),
      teacherId: teacher.uid,
      grade,
      subject,
      textbook: '',
      academicYear,
      semester,
      items,
      updatedAt: new Date().toISOString(),
    };

    onConfirmImport(newCurriculum, overwrite);
    setShowOverwritePrompt(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/80 rounded-2xl text-emerald-600 dark:text-emerald-400">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                THÊM PHÂN PHỐI CHƯƠNG TRÌNH TỪ FILE EXCEL
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Nhập danh sách bài học 35 tuần từ file Excel có sẵn hoặc file mẫu chuẩn.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Progress Indicator */}
        <div className="px-6 py-3 bg-slate-100/60 dark:bg-slate-900/40 border-b border-slate-200/60 dark:border-slate-700/60 flex items-center justify-around text-xs font-bold">
          <div className={`flex items-center gap-2 ${step === 1 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 1 ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
              1
            </span>
            <span>① Chọn thông tin PPCT</span>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-300" />
          <div className={`flex items-center gap-2 ${step === 2 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 2 ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
              2
            </span>
            <span>② Tải file Excel lên</span>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-300" />
          <div className={`flex items-center gap-2 ${step === 3 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 3 ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
              3
            </span>
            <span>③ Kiểm tra → Xác nhận</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {/* STEP 1: Metadata Configuration */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="p-4 bg-blue-50/80 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-900/50 flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
                  Xác định môn học và khối lớp tương ứng trước khi tải file Excel lên. Thông tin này sẽ tự động liên kết với Lịch báo giảng.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-bold">Năm học</label>
                  <select
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
                  >
                    <option value="2024 - 2025">2024 - 2025</option>
                    <option value="2025 - 2026">2025 - 2026</option>
                    <option value="2026 - 2027">2026 - 2027</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-bold">Học kỳ</label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
                  >
                    <option value="Học kỳ I">Học kỳ I</option>
                    <option value="Học kỳ II">Học kỳ II</option>
                    <option value="Cả năm">Cả năm</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-bold">Khối lớp</label>
                  <select
                    value={grade}
                    onChange={(e) => {
                      setGrade(e.target.value);
                      handleMetadataChange(e.target.value, subject);
                    }}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
                  >
                    {['Khối 1', 'Khối 2', 'Khối 3', 'Khối 4', 'Khối 5'].map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-bold">Môn học</label>
                  <select
                    value={subject}
                    onChange={(e) => {
                      setSubject(e.target.value);
                      handleMetadataChange(grade, e.target.value);
                    }}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
                  >
                    {['Tin học', 'Toán', 'Tiếng Việt', 'Công nghệ', 'Đạo đức', 'Tự nhiên và Xã hội'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-bold">Tên hiển thị PPCT</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Excel File Drag & Drop / Upload */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Template Download Prompt Banner */}
              <div className="p-4 bg-emerald-50/80 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <h4 className="font-bold text-xs text-emerald-900 dark:text-emerald-200">
                    Chưa có file Excel đúng định dạng?
                  </h4>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                    Tải file Excel mẫu chuẩn (Cột: Tuần - Tiết PPCT - Tên bài dạy - Số tiết).
                  </p>
                </div>

                <button
                  type="button"
                  onClick={downloadPPCTTemplate}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 shrink-0 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>📄 Tải file Excel mẫu</span>
                </button>
              </div>

              {/* Drag and Drop Zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all cursor-pointer ${
                  isDragOver
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 scale-[0.99]'
                    : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 bg-slate-50/50 dark:bg-slate-900/50'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleProcessFile(e.target.files[0]);
                    }
                  }}
                />

                <div className="space-y-3">
                  <div className="w-14 h-14 bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                    <Upload className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                      Kéo thả file Excel PPCT vào đây
                    </p>
                    <p className="text-xs text-slate-400 mt-1">hoặc nhấp để chọn file từ máy tính</p>
                  </div>
                  <span className="inline-block text-[11px] font-bold text-slate-500 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded-full">
                    Hỗ trợ định dạng: .xlsx, .xls
                  </span>
                </div>
              </div>

              {/* Parsing Loader or Errors */}
              {isParsing && (
                <div className="p-4 bg-blue-50 dark:bg-blue-950/40 rounded-2xl text-center text-xs font-bold text-blue-700 dark:text-blue-300 animate-pulse">
                  🔄 Đang đọc và phân tích file Excel... Vui lòng chờ trong giây lát.
                </div>
              )}

              {parseError && (
                <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-2xl text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{parseError}</span>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Preview & Validation Table */}
          {step === 3 && parsedResult && (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              {/* Summary Stats Banner */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-emerald-500" />
                    <span>Đã đọc thành công {parsedResult.totalRows} dòng từ file Excel</span>
                  </div>
                  <div className="text-slate-500 dark:text-slate-400">
                    Năm học: <strong className="text-slate-800 dark:text-slate-200">{academicYear}</strong> | Học kỳ: <strong className="text-slate-800 dark:text-slate-200">{semester}</strong> | Môn: <strong className="text-slate-800 dark:text-slate-200">{subject}</strong> | Khối: <strong className="text-slate-800 dark:text-slate-200">{grade}</strong> ({textbook})
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 rounded-full font-bold">
                    ✅ {parsedResult.validCount} dòng hợp lệ
                  </span>
                  {parsedResult.invalidCount > 0 && (
                    <span className="px-3 py-1 bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 rounded-full font-bold">
                      ⚠️ {parsedResult.invalidCount} dòng cần kiểm tra
                    </span>
                  )}
                </div>
              </div>

              {/* Warnings List */}
              {parsedResult.warnings.length > 0 && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/50 rounded-xl space-y-1 text-xs text-amber-800 dark:text-amber-300">
                  {parsedResult.warnings.map((w, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 font-medium">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Editable Preview Table */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden max-h-80 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 z-10">
                    <tr>
                      <th className="p-2.5 text-center w-12">Dòng</th>
                      <th className="p-2.5 text-center w-16">Tuần</th>
                      <th className="p-2.5 text-center w-20">Tiết PPCT</th>
                      <th className="p-2.5">Tên bài dạy</th>
                      <th className="p-2.5 w-20 text-center">Số tiết</th>
                      <th className="p-2.5 w-36">Chủ đề</th>
                      <th className="p-2.5 w-44">Trạng thái / Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {parsedResult.rows.map((row) => {
                      const hasError = row.errors.length > 0;
                      return (
                        <tr
                          key={row.rowIndex}
                          className={`hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors ${
                            hasError ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''
                          }`}
                        >
                          <td className="p-2 text-center text-slate-400 font-mono text-[11px]">
                            {row.rowIndex}
                          </td>

                          {/* Editable Week */}
                          <td className="p-2 text-center">
                            <input
                              type="number"
                              value={row.week}
                              onChange={(e) => handleRowCellChange(row.rowIndex, 'week', parseInt(e.target.value) || 0)}
                              className="w-12 text-center p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-bold text-blue-600 dark:text-blue-400"
                            />
                          </td>

                          {/* Editable Period */}
                          <td className="p-2 text-center">
                            <input
                              type="number"
                              value={row.periodNumber}
                              onChange={(e) => handleRowCellChange(row.rowIndex, 'periodNumber', parseInt(e.target.value) || 0)}
                              className="w-14 text-center p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-bold text-slate-800 dark:text-slate-200"
                            />
                          </td>

                          {/* Editable Lesson Title */}
                          <td className="p-2">
                            <input
                              type="text"
                              value={row.title}
                              onChange={(e) => handleRowCellChange(row.rowIndex, 'title', e.target.value)}
                              className="w-full p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-semibold text-slate-900 dark:text-white"
                            />
                          </td>

                          {/* Editable Periods Count */}
                          <td className="p-2 text-center">
                            <input
                              type="number"
                              value={row.periodsCount}
                              onChange={(e) => handleRowCellChange(row.rowIndex, 'periodsCount', parseInt(e.target.value) || 1)}
                              className="w-12 text-center p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-bold"
                            />
                          </td>

                          {/* Editable Topic */}
                          <td className="p-2">
                            <input
                              type="text"
                              value={row.topic || ''}
                              onChange={(e) => handleRowCellChange(row.rowIndex, 'topic', e.target.value)}
                              className="w-full p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-600 dark:text-slate-300"
                            />
                          </td>

                          {/* Error or OK Badge */}
                          <td className="p-2">
                            {hasError ? (
                              <div className="space-y-0.5">
                                {row.errors.map((errStr, idx) => (
                                  <span key={idx} className="inline-block text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded">
                                    ⚠️ {errStr}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                ✓ Hợp lệ
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Existing Duplicate Prompt Dialog */}
          {showOverwritePrompt && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-900/80 rounded-2xl space-y-3 animate-in zoom-in-95 duration-150">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs text-amber-900 dark:text-amber-200">
                  <h4 className="font-bold text-sm">⚠️ Phân Phối Chương Trình Đã Tồn Tại!</h4>
                  <p>
                    Hệ thống đã phát hiện bộ PPCT trùng khớp (<strong className="text-slate-900 dark:text-white">{grade} – {subject} ({textbook})</strong>). Bạn muốn cập nhật đè lên PPCT cũ hay lưu thành một bản ghi mới?
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleConfirmSave(false)}
                  className="px-3.5 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold hover:bg-slate-300 transition-colors"
                >
                  Tạo bản PPCT mới
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmSave(true)}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 transition-colors"
                >
                  Cập nhật PPCT cũ
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/60 flex items-center justify-between">
          <div>
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((step - 1) as any)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold hover:bg-slate-200 flex items-center gap-1 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quay lại</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors"
            >
              Hủy
            </button>

            {step === 1 && (
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-colors"
              >
                <span>Tiếp tục: Tải file</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {step === 3 && (
              <button
                type="button"
                onClick={() => handleConfirmSave(false)}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Xác nhận nhập PPCT</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
