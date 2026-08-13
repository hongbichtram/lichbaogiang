import React from 'react';
import { X, Printer, FileText, FileSpreadsheet, Download } from 'lucide-react';
import { ScheduleItem, TeacherProfile, PrintSettings, DEFAULT_PRINT_SETTINGS } from '../types';
import { exportWeeklyWordDoc, exportWeeklyExcel, groupSchedulesByDay, getWeekDayDate } from '../utils/exportUtils';
import { formatLessonDisplayTitle, getNormalizedSession, getNormalizedPeriod } from '../utils/classUtils';

const FIXED_DAYS = [
  { key: 'Thứ 2', displayName: 'Thứ Hai' },
  { key: 'Thứ 3', displayName: 'Thứ Ba' },
  { key: 'Thứ 4', displayName: 'Thứ Tư' },
  { key: 'Thứ 5', displayName: 'Thứ Năm' },
  { key: 'Thứ 6', displayName: 'Thứ Sáu' },
] as const;

const FIXED_ROW_CONFIGS = [
  { session: 'Sáng', period: 1, label: 'Tiết 1', isFirstInSession: true, sessionRowSpan: 4 },
  { session: 'Sáng', period: 2, label: 'Tiết 2', isFirstInSession: false, sessionRowSpan: 0 },
  { session: 'Sáng', period: 3, label: 'Tiết 3', isFirstInSession: false, sessionRowSpan: 0 },
  { session: 'Sáng', period: 4, label: 'Tiết 4', isFirstInSession: false, sessionRowSpan: 0 },
  { session: 'Chiều', period: 1, label: 'Tiết 1', isFirstInSession: true, sessionRowSpan: 3 },
  { session: 'Chiều', period: 2, label: 'Tiết 2', isFirstInSession: false, sessionRowSpan: 0 },
  { session: 'Chiều', period: 3, label: 'Tiết 3', isFirstInSession: false, sessionRowSpan: 0 },
] as const;

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
                    {cfg.showColDay && <th className="border border-slate-400 p-2 text-center align-middle whitespace-nowrap">Thứ, ngày tháng năm</th>}
                    {cfg.showColSession && <th className="border border-slate-400 p-2 text-center align-middle whitespace-nowrap w-16">Buổi</th>}
                    {cfg.showColPeriod && <th className="border border-slate-400 p-2 text-center align-middle whitespace-nowrap w-16">Tiết</th>}
                    {cfg.showColClass && <th className="border border-slate-400 p-2 text-center align-middle whitespace-nowrap w-20">Lớp</th>}
                    {cfg.showColPpctPeriod && <th className="border border-slate-400 p-2 text-center align-middle whitespace-nowrap w-20">Tiết PPCT</th>}
                    {cfg.showColLessonTitle && <th className="border border-slate-400 p-2 text-center align-middle">Tên bài dạy</th>}
                    {cfg.showColNotes && <th className="border border-slate-400 p-2 text-center align-middle w-28">Ghi chú</th>}
                  </tr>
                </thead>
                <tbody>
                  {FIXED_DAYS.map((day) => {
                    const dayScheduleItems = weekSchedules.filter((s) => s.dayOfWeek === day.key);
                    const dateStr =
                      dayScheduleItems.find((s) => !!s.date)?.date ||
                      getWeekDayDate(currentWeek, day.key, teacher.academicYear);

                    return FIXED_ROW_CONFIGS.map((rowCfg, rowIdx) => {
                      const isFirstInDay = rowIdx === 0;
                      const matchingItem = dayScheduleItems.find(
                        (s) =>
                          getNormalizedSession(s) === rowCfg.session &&
                          getNormalizedPeriod(s) === rowCfg.period
                      );

                      return (
                        <tr
                          key={`${day.key}-${rowCfg.session}-${rowCfg.period}`}
                          className="border-b border-slate-400 min-h-[32px]"
                        >
                          {/* Cột 1: Thứ, ngày tháng năm (RowSpan = 7) */}
                          {cfg.showColDay && isFirstInDay && (
                            <td
                              rowSpan={7}
                              className="border border-slate-400 px-2 py-2 text-center align-middle bg-white font-bold text-slate-900"
                            >
                              <div className="font-bold text-slate-900">{day.displayName}</div>
                              {dateStr && (
                                <div className="text-[9.5pt] font-normal text-slate-600 mt-0.5">
                                  {dateStr}
                                </div>
                              )}
                            </td>
                          )}

                          {/* Cột 2: Buổi (Sáng rowSpan=4, Chiều rowSpan=3) */}
                          {cfg.showColSession && rowCfg.isFirstInSession && (
                            <td
                              rowSpan={rowCfg.sessionRowSpan}
                              className="border border-slate-400 px-2 py-2 text-center align-middle bg-white font-bold text-slate-900 whitespace-nowrap"
                            >
                              {rowCfg.session}
                            </td>
                          )}

                          {/* Cột 3: Tiết */}
                          {cfg.showColPeriod && (
                            <td className="border border-slate-400 px-2 py-1.5 text-center align-middle font-medium text-slate-800 whitespace-nowrap">
                              {rowCfg.label}
                            </td>
                          )}

                          {/* Cột 4: Lớp */}
                          {cfg.showColClass && (
                            <td className="border border-slate-400 px-2 py-1.5 text-center align-middle font-bold text-slate-900 whitespace-nowrap">
                              {matchingItem?.className || ''}
                            </td>
                          )}

                          {/* Cột Tiết PPCT (optional) */}
                          {cfg.showColPpctPeriod && (
                            <td className="border border-slate-400 px-2 py-1.5 text-center align-middle text-slate-800 whitespace-nowrap">
                              {matchingItem?.ppctPeriod || ''}
                            </td>
                          )}

                          {/* Cột 5: Tên bài dạy */}
                          {cfg.showColLessonTitle && (
                            <td
                              style={{ fontWeight: cfg.isLessonTitleBold ? 'bold' : 'normal' }}
                              className="border border-slate-400 px-2.5 py-1.5 align-middle text-left text-slate-900"
                            >
                              {matchingItem
                                ? formatLessonDisplayTitle(
                                    matchingItem.lessonTitle,
                                    matchingItem.subject,
                                    ''
                                  )
                                : ''}
                            </td>
                          )}

                          {/* Cột 6: Ghi chú */}
                          {cfg.showColNotes && (
                            <td className="border border-slate-400 px-2.5 py-1.5 align-middle text-left text-slate-700">
                              {matchingItem?.notes || ''}
                            </td>
                          )}
                        </tr>
                      );
                    });
                  })}
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

