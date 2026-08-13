import React from 'react';
import { X, Printer, FileText, FileSpreadsheet, Download } from 'lucide-react';
import { ScheduleItem, TeacherProfile, PrintSettings, DEFAULT_PRINT_SETTINGS } from '../types';
import { exportWeeklyWordDoc, exportWeeklyExcel, buildLessonReportTableData, getWeekDayDate } from '../utils/exportUtils';

interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher?: TeacherProfile;
  schedules: ScheduleItem[];
  currentWeek: number;
  printSettings?: PrintSettings;
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  isOpen,
  onClose,
  teacher = {
    uid: 'gv01',
    fullName: 'Hồng Bích Trâm',
    email: 'hongbichtram13@gmail.com',
    schoolName: 'Trường Tiểu học Nguyễn Du',
    teacherCode: 'GV01',
    academicYear: '2026-2027',
    semester: 'Học kỳ I',
    subjects: ['Tin học'],
    grades: ['Khối 3', 'Khối 4', 'Khối 5'],
    assignedClasses: ['3A1', '4A1', '5A1'],
  },
  schedules,
  currentWeek,
  printSettings = DEFAULT_PRINT_SETTINGS,
}) => {
  if (!isOpen) return null;

  const cfg = printSettings || DEFAULT_PRINT_SETTINGS;

  // Filter schedules for current week
  const weekSchedules = schedules.filter((s) => s.weekNumber === currentWeek);
  const tableData = buildLessonReportTableData(weekSchedules, currentWeek, teacher.academicYear);

  const handleExportWord = () => {
    exportWeeklyWordDoc(weekSchedules, teacher, currentWeek);
  };

  const handleExportExcel = () => {
    exportWeeklyExcel(weekSchedules, teacher, currentWeek);
  };

  const handlePrint = () => {
    window.print();
  };

  // Resolved dynamic title
  const displayTitle = (cfg.customTitle || 'LỊCH BÁO GIẢNG TUẦN {week}')
    .replace('{week}', String(currentWeek))
    .replace('{school}', cfg.schoolName || teacher.schoolName)
    .replace('{teacher}', cfg.teacherName || teacher.fullName);

  // Calculate visible columns count for empty state colSpan
  const visibleColsCount = [
    cfg.showColDay,
    cfg.showColPeriod,
    cfg.showColSession,
    cfg.showColClass,
    cfg.showColPpctPeriod,
    cfg.showColLessonTitle,
    cfg.showColNotes,
  ].filter(Boolean).length || 1;

  // Dates calculation for Monday to Friday of current week
  const mondayDate = getWeekDayDate(currentWeek, 'Thứ 2', teacher.academicYear);
  const fridayDate = getWeekDayDate(currentWeek, 'Thứ 6', teacher.academicYear);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-xs animate-fadeIn overflow-y-auto print:p-0 print:bg-white print:static">
      
      {/* Dynamic CSS injection for printing */}
      <style>{`
        @page {
          size: A4 portrait;
          margin: 8mm 10mm 8mm 10mm;
        }
        @media print {
          html, body {
            height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            font-family: '${cfg.fontFamily || 'Times New Roman'}', serif !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          .print-page {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          table {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            width: 100% !important;
            border-collapse: collapse !important;
          }
          tr, td, th {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          thead {
            display: table-header-group;
          }
        }
      `}</style>

      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-5xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[95vh] print:max-h-none print:shadow-none print:border-none print:w-full print:rounded-none">
        
        {/* Modal Header (Hidden on print) */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 no-print">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-xl">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                XEM TRƯỚC VÀ IN LỊCH BÁO GIẢNG
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tuần {currentWeek} • {cfg.schoolName || teacher.schoolName} • Font: {cfg.fontFamily} (Khổ A4)
              </p>
            </div>
          </div>

          {/* Action Export Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>🖨 In ngay</span>
            </button>

            <button
              type="button"
              onClick={handleExportWord}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Word</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Excel</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Printable Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-200/80 dark:bg-slate-950 flex justify-center print:p-0 print:bg-white print:overflow-visible">
          <div
            style={{
              fontFamily: `'${cfg.fontFamily || 'Times New Roman'}', serif`,
            }}
            className="print-page bg-white text-slate-900 p-6 sm:p-8 rounded-xl shadow-2xl border border-slate-300 w-full max-w-[210mm] space-y-3 leading-normal print:shadow-none print:border-none print:max-w-none print:w-full print:p-0 print:rounded-none"
          >
            
            {/* Header metadata */}
            <div className="flex justify-between items-start text-[9.5pt] leading-tight border-b border-slate-300 pb-2">
              <div className="space-y-0.5">
                {cfg.showSchoolName && (
                  <p><strong>Trường:</strong> {cfg.schoolName || teacher.schoolName || 'Tiểu học'}</p>
                )}
                {cfg.showTeacherName && (
                  <p><strong>Giáo viên:</strong> {cfg.teacherName || teacher.fullName} {cfg.showTeacherCode && (cfg.teacherCode || teacher.teacherCode) ? `- Mã GV: ${cfg.teacherCode || teacher.teacherCode}` : ''}</p>
                )}
              </div>
              <div className="text-right space-y-0.5">
                {cfg.showAcademicYear && (
                  <p><strong>Năm học:</strong> {cfg.academicYear || teacher.academicYear || '2025-2026'}</p>
                )}
                {cfg.showSemester && (
                  <p><strong>Học kỳ:</strong> {cfg.semester || teacher.semester || 'Học kỳ I'}</p>
                )}
              </div>
            </div>

            {/* Document Title */}
            <div className="text-center pt-0.5 pb-1">
              <h1
                style={{
                  fontSize: `${Math.min(cfg.titleFontSize || 14, 14)}pt`,
                  fontWeight: cfg.isTitleBold ? 'bold' : 'normal',
                }}
                className="uppercase text-slate-900 tracking-wide font-bold leading-tight"
              >
                {displayTitle}
              </h1>
              <p className="text-[9pt] italic font-normal text-slate-700 mt-0.5">
                (Từ ngày {mondayDate} đến ngày {fridayDate})
              </p>
            </div>

            {/* Configured Columns Table */}
            <div className="overflow-x-auto print:overflow-visible">
              <table
                style={{
                  textAlign: cfg.contentAlign as any,
                }}
                className="w-full border-collapse border border-slate-900 text-[8.5pt] print:text-[8pt] leading-tight"
              >
                <thead>
                  <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-900 text-center">
                    <th className="border border-slate-900 py-1 px-1 w-[17%] align-middle">Thứ, ngày tháng năm</th>
                    <th className="border border-slate-900 py-1 px-1 w-[8%] align-middle">Buổi</th>
                    <th className="border border-slate-900 py-1 px-1 w-[7%] align-middle">Tiết</th>
                    <th className="border border-slate-900 py-1 px-1 w-[8%] align-middle">Lớp</th>
                    <th className="border border-slate-900 py-1 px-1 w-[48%] align-middle">Tên bài dạy</th>
                    <th className="border border-slate-900 py-1 px-1 w-[12%] align-middle">Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {tableData.allRows.map((row) => (
                    <tr
                      key={`${row.dayKey}-${row.session}-${row.period}`}
                      className="border-b border-slate-900"
                    >
                      {/* Cột 1: Thứ, ngày tháng năm (RowSpan = 7) */}
                      {row.isFirstInDay && (
                        <td
                          rowSpan={row.dayRowSpan}
                          className="border border-slate-900 px-1 py-1 text-center align-middle bg-white font-bold text-slate-900"
                        >
                          <div className="font-bold text-slate-900">{row.dayDisplayName}</div>
                          {row.dateStr && (
                            <div className="text-[7.5pt] font-normal text-slate-700 mt-0.5 whitespace-nowrap">
                              {row.dateStr}
                            </div>
                          )}
                        </td>
                      )}

                      {/* Cột 2: Buổi (Sáng rowSpan=4, Chiều rowSpan=3) */}
                      {row.isFirstInSession && (
                        <td
                          rowSpan={row.sessionRowSpan}
                          className="border border-slate-900 px-1 py-1 text-center align-middle bg-white font-bold text-slate-900 whitespace-nowrap"
                        >
                          {row.session}
                        </td>
                      )}

                      {/* Cột 3: Tiết */}
                      <td className="border border-slate-900 px-1 py-1 text-center align-middle font-medium text-slate-900 whitespace-nowrap">
                        {row.periodLabel}
                      </td>

                      {/* Cột 4: Lớp */}
                      <td className="border border-slate-900 px-1 py-1 text-center align-middle font-bold text-slate-900 whitespace-nowrap">
                        {row.className}
                      </td>

                      {/* Cột 5: Tên bài dạy */}
                      <td
                        style={{ fontWeight: cfg.isLessonTitleBold ? 'bold' : 'normal' }}
                        className="border border-slate-900 px-1.5 py-1 align-middle text-left text-slate-900"
                      >
                        {row.displayLessonTitle}
                      </td>

                      {/* Cột 6: Ghi chú */}
                      <td className="border border-slate-900 px-1.5 py-1 align-middle text-left text-slate-800">
                        {row.notes}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer Signatures */}
            <div
              className="pt-3 flex justify-between text-center font-semibold text-[9pt] leading-tight gap-2 print:pt-2"
            >
              {cfg.showSigBoard && (
                <div className="space-y-0.5">
                  <p className="font-bold uppercase text-[9pt]">{cfg.sigBoardTitle || 'BAN GIÁM HIỆU DUYỆT'}</p>
                  <p className="text-[8pt] text-slate-600 italic font-normal">(Ký và ghi rõ họ tên)</p>
                </div>
              )}

              {cfg.showSigDepartmentHead && (
                <div className="space-y-0.5">
                  <p className="font-bold uppercase text-[9pt]">{cfg.sigDepartmentHeadTitle || 'TỔ TRƯỞNG CHUYÊN MÔN'}</p>
                  <p className="text-[8pt] text-slate-600 italic font-normal">(Ký tên)</p>
                </div>
              )}

              {cfg.showSigTeacher && (
                <div className="space-y-0.5">
                  <p className="italic text-[8pt] text-slate-600 font-normal">..., ngày ..... tháng ..... năm 2026</p>
                  <p className="font-bold uppercase text-[9pt]">{cfg.sigTeacherTitle || 'GIÁO VIÊN BÁO GIẢNG'}</p>
                  <p className="text-[8pt] text-slate-600 italic font-normal">(Ký và ghi rõ họ tên)</p>
                  <div className="pt-7 font-bold text-slate-900 text-[9pt]">{cfg.teacherName || teacher.fullName}</div>
                </div>
              )}

              {cfg.showSigCreator && (
                <div className="space-y-0.5">
                  <p className="font-bold uppercase text-[9pt]">{cfg.sigCreatorTitle || 'NGƯỜI LẬP'}</p>
                  <p className="text-[8pt] text-slate-600 italic font-normal">(Ký tên)</p>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

