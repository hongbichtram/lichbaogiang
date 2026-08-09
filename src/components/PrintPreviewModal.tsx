import React from 'react';
import { X, Printer, FileText, FileSpreadsheet, Download } from 'lucide-react';
import { ScheduleItem, TeacherProfile, PrintSettings, DEFAULT_PRINT_SETTINGS } from '../types';
import { exportWeeklyWordDoc, exportWeeklyExcel, groupSchedulesByDay } from '../utils/exportUtils';
import { formatTableSessionPeriod, formatLessonDisplayTitle } from '../utils/classUtils';

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
    academicYear: '2025-2026',
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
  const dayGroups = groupSchedulesByDay(weekSchedules, currentWeek, teacher.academicYear);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-xs animate-fadeIn overflow-y-auto print:p-0 print:bg-white print:static">
      
      {/* Dynamic CSS injection for printing */}
      <style>{`
        @page {
          size: ${cfg.paperSize} ${cfg.orientation};
          margin: ${cfg.marginTop}mm ${cfg.marginRight}mm ${cfg.marginBottom}mm ${cfg.marginLeft}mm;
        }
        @media print {
          body {
            font-family: '${cfg.fontFamily}', serif !important;
            background: #fff !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-5xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:w-full print:rounded-none">
        
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
                Tuần {currentWeek} • {cfg.schoolName || teacher.schoolName} • Font: {cfg.fontFamily} ({cfg.paperSize})
              </p>
            </div>
          </div>

          {/* Action Export Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>🖨 In ngay</span>
            </button>

            <button
              type="button"
              onClick={handleExportWord}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <FileText className="w-4 h-4" />
              <span>Word</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Excel</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Printable Content Area */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-slate-100 dark:bg-slate-950 print:p-0 print:bg-white">
          <div
            style={{
              fontFamily: `'${cfg.fontFamily}', serif`,
              paddingTop: `${cfg.marginTop}mm`,
              paddingBottom: `${cfg.marginBottom}mm`,
              paddingLeft: `${cfg.marginLeft}mm`,
              paddingRight: `${cfg.marginRight}mm`,
              fontSize: `${cfg.contentFontSize}pt`,
            }}
            className="bg-white text-slate-900 rounded-2xl shadow-xl max-w-4xl mx-auto space-y-6 leading-relaxed border border-slate-200 print:shadow-none print:border-none print:max-w-none"
          >
            
            {/* Header metadata */}
            <div className="flex justify-between items-start leading-relaxed border-b border-slate-200 pb-3">
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
            <div className="text-center pt-1">
              <h1
                style={{
                  fontSize: `${cfg.titleFontSize}pt`,
                  fontWeight: cfg.isTitleBold ? 'bold' : 'normal',
                }}
                className="uppercase text-slate-900 tracking-wide"
              >
                {displayTitle}
              </h1>
            </div>

            {/* Configured Columns Table */}
            <div className="overflow-x-auto">
              <table
                style={{
                  fontSize: `${cfg.tableFontSize}pt`,
                  textAlign: cfg.contentAlign as any,
                }}
                className="w-full border-collapse border border-slate-400"
              >
                <thead>
                  <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-400">
                    {cfg.showColDay && <th className="border border-slate-400 p-2.5 text-center align-middle">Thứ, ngày tháng năm</th>}
                    {cfg.showColPeriod && <th className="border border-slate-400 p-2.5 text-center align-middle">Tiết</th>}
                    {cfg.showColSession && <th className="border border-slate-400 p-2.5 text-center align-middle">Buổi</th>}
                    {cfg.showColClass && <th className="border border-slate-400 p-2.5 text-center align-middle">Lớp</th>}
                    {cfg.showColPpctPeriod && <th className="border border-slate-400 p-2.5 text-center align-middle">Tiết PPCT</th>}
                    {cfg.showColLessonTitle && <th className="border border-slate-400 p-2.5 text-center align-middle">Tên bài dạy</th>}
                    {cfg.showColNotes && <th className="border border-slate-400 p-2.5 text-center align-middle">Ghi chú</th>}
                  </tr>
                </thead>
                <tbody>
                  {dayGroups.length === 0 ? (
                    <tr>
                      <td colSpan={visibleColsCount} className="text-center p-6 text-slate-400 italic align-middle">
                        Chưa có lịch báo giảng trong tuần này.
                      </td>
                    </tr>
                  ) : (
                    dayGroups.map((group) =>
                      group.items.map((item, itemIdx) => (
                        <tr key={item.id} className="border-b border-slate-300 min-h-[38px]">
                          {cfg.showColDay && itemIdx === 0 && (
                            <td
                              rowSpan={group.items.length}
                              className="border border-slate-400 px-2.5 py-2 text-center align-middle bg-white font-bold"
                            >
                              <div>{group.dayDisplayName}</div>
                              <div className="text-[10pt] font-normal text-slate-600 mt-0.5">{group.dateStr}</div>
                            </td>
                          )}
                          {cfg.showColPeriod && (
                            <td className="border border-slate-400 px-2 py-2 text-center align-middle">
                              {formatTableSessionPeriod(item.period, item.session)}
                            </td>
                          )}
                          {cfg.showColSession && (
                            <td className="border border-slate-400 px-2 py-2 text-center align-middle">
                              {item.session || (item.period <= 5 ? 'Sáng' : 'Chiều')}
                            </td>
                          )}
                          {cfg.showColClass && (
                            <td className="border border-slate-400 px-2 py-2 text-center align-middle font-bold">
                              {item.className}
                            </td>
                          )}
                          {cfg.showColPpctPeriod && (
                            <td className="border border-slate-400 px-2 py-2 text-center align-middle">
                              {item.ppctPeriod || '-'}
                            </td>
                          )}
                          {cfg.showColLessonTitle && (
                            <td
                              style={{ fontWeight: cfg.isLessonTitleBold ? 'bold' : 'normal' }}
                              className="border border-slate-400 px-2.5 py-2 align-middle text-left"
                            >
                              {formatLessonDisplayTitle(item.lessonTitle, item.subject, 'Chưa cập nhật')}
                            </td>
                          )}
                          {cfg.showColNotes && (
                            <td className="border border-slate-400 px-2.5 py-2 align-middle text-slate-700 text-left">
                              {item.notes || ''}
                            </td>
                          )}
                        </tr>
                      ))
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer Signatures */}
            <div
              style={{ fontSize: `${cfg.contentFontSize}pt` }}
              className="pt-8 flex justify-between text-center font-semibold gap-2"
            >
              {cfg.showSigBoard && (
                <div className="space-y-1">
                  <p className="font-bold uppercase text-[11pt]">{cfg.sigBoardTitle || 'BAN GIÁM HIỆU DUYỆT'}</p>
                  <p className="text-[10pt] text-slate-500 italic font-normal">(Ký và ghi rõ họ tên)</p>
                </div>
              )}

              {cfg.showSigDepartmentHead && (
                <div className="space-y-1">
                  <p className="font-bold uppercase text-[11pt]">{cfg.sigDepartmentHeadTitle || 'TỔ TRƯỞNG CHUYÊN MÔN'}</p>
                  <p className="text-[10pt] text-slate-500 italic font-normal">(Ký tên)</p>
                </div>
              )}

              {cfg.showSigTeacher && (
                <div className="space-y-1">
                  <p className="italic text-[10pt] text-slate-600 font-normal">..., Ngày ..... tháng ..... năm 2026</p>
                  <p className="font-bold uppercase text-[11pt]">{cfg.sigTeacherTitle || 'GIÁO VIÊN BÁO GIẢNG'}</p>
                  <p className="text-[10pt] text-slate-500 italic font-normal">(Ký và ghi rõ họ tên)</p>
                  <div className="pt-14 font-bold text-slate-900">{cfg.teacherName || teacher.fullName}</div>
                </div>
              )}

              {cfg.showSigCreator && (
                <div className="space-y-1">
                  <p className="font-bold uppercase text-[11pt]">{cfg.sigCreatorTitle || 'NGƯỜI LẬP'}</p>
                  <p className="text-[10pt] text-slate-500 italic font-normal">(Ký tên)</p>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

