import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  FileText, 
  Printer, 
  Download, 
  Filter, 
  CheckCircle2, 
  School, 
  User, 
  Calendar 
} from 'lucide-react';
import { ScheduleItem, TeacherProfile } from '../types';
import { exportWeeklyWordDoc, exportWeeklyExcel, buildLessonReportTableData, getWeekDayDate } from '../utils/exportUtils';

interface ExportViewProps {
  teacher: TeacherProfile;
  schedules: ScheduleItem[];
  currentWeek: number;
}

export const ExportView: React.FC<ExportViewProps> = ({ teacher, schedules, currentWeek }) => {
  const [exportScope, setExportScope] = useState<'week' | 'month' | 'semester' | 'year'>('week');
  const [selectedWeek, setSelectedWeek] = useState(currentWeek);

  // Filter schedules to export
  const exportSchedules = schedules.filter(item => {
    if (exportScope === 'week') {
      return item.weekNumber === selectedWeek;
    }
    return true;
  });

  const tableData = buildLessonReportTableData(exportSchedules, selectedWeek, teacher.academicYear);
  const mondayDate = getWeekDayDate(selectedWeek, 'Thứ 2', teacher.academicYear);
  const fridayDate = getWeekDayDate(selectedWeek, 'Thứ 6', teacher.academicYear);

  const handleExportWord = () => {
    exportWeeklyWordDoc(exportSchedules, teacher, selectedWeek);
  };

  const handleExportExcel = () => {
    exportWeeklyExcel(exportSchedules, teacher, selectedWeek);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800 mb-1">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Chức năng Xuất Báo Giảng Chuẩn Biểu Mẫu Nhà Trường</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Xuất Báo Giảng (Word, Excel, PDF)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Xuất dữ liệu theo quy cách chuẩn BGD&ĐT: Tên trường, Giáo viên, Bảng lịch 6 cột và Chữ ký duyệt.
            </p>
          </div>

          {/* Action Export Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportWord}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center space-x-2 transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Tải Word (.docx)</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center space-x-2 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Tải Excel (.xlsx)</span>
            </button>

            <button
              onClick={handlePrintPDF}
              className="px-4 py-2.5 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-md flex items-center space-x-2 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>In PDF A4</span>
            </button>
          </div>
        </div>

        {/* Scope and Week Filters */}
        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-100 dark:border-slate-700">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Phạm vi xuất:</span>
            <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              {[
                { id: 'week', label: 'Theo Tuần' },
                { id: 'month', label: 'Theo Tháng' },
                { id: 'semester', label: 'Học kỳ' },
                { id: 'year', label: 'Cả năm' },
              ].map((scope) => (
                <button
                  key={scope.id}
                  onClick={() => setExportScope(scope.id as any)}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                    exportScope === scope.id
                      ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {scope.label}
                </button>
              ))}
            </div>
          </div>

          {exportScope === 'week' && (
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Chọn tuần:</span>
              <select
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(parseInt(e.target.value) || 1)}
                className="px-3 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white"
              >
                {Array.from({ length: 35 }, (_, i) => i + 1).map(w => (
                  <option key={w} value={w}>Tuần {w}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Live Printable Preview Card */}
      <div className="bg-white text-slate-900 p-8 rounded-2xl border border-slate-200 shadow-xl max-w-5xl mx-auto space-y-6 print:p-0 print:border-none print:shadow-none font-['Times_New_Roman',_serif] text-[13pt]">
        {/* Document Header (No National Emblem) */}
        <div className="flex justify-between items-start text-[11pt] font-normal leading-relaxed">
          <div className="space-y-0.5">
            <p><strong>Trường:</strong> {teacher.schoolName || 'Tiểu học'}</p>
            <p><strong>Giáo viên:</strong> {teacher.fullName || 'Chưa cập nhật'} {teacher.teacherCode ? `- Mã GV: ${teacher.teacherCode}` : ''}</p>
          </div>
          <div className="text-right space-y-0.5">
            <p><strong>Năm học:</strong> {teacher.academicYear}</p>
            <p><strong>Học kỳ:</strong> {teacher.semester}</p>
          </div>
        </div>

        <div className="text-center pt-2">
          <h1 className="text-[15pt] font-bold uppercase text-slate-900 tracking-wide">
            LỊCH BÁO GIẢNG {exportScope === 'week' ? `TUẦN ${selectedWeek}` : 'TỔNG HỢP'}
          </h1>
          <p className="text-[10pt] italic text-slate-600 mt-1">
            (Từ ngày {mondayDate} đến ngày {fridayDate})
          </p>
        </div>

        {/* Printable Schedule Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border border-slate-900 text-[10pt] font-['Times_New_Roman',_serif] mx-auto leading-tight">
            <thead>
              <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-900 text-center">
                <th className="border border-slate-900 py-1.5 px-1 w-[17%] align-middle">Thứ, ngày tháng năm</th>
                <th className="border border-slate-900 py-1.5 px-1 w-[8%] align-middle">Buổi</th>
                <th className="border border-slate-900 py-1.5 px-1 w-[7%] align-middle">Tiết</th>
                <th className="border border-slate-900 py-1.5 px-1 w-[8%] align-middle">Lớp</th>
                <th className="border border-slate-900 py-1.5 px-1 w-[48%] align-middle">Tên bài dạy</th>
                <th className="border border-slate-900 py-1.5 px-1 w-[12%] align-middle">Ghi chú</th>
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
                      <div className="font-bold text-slate-900 text-[10.5pt]">{row.dayDisplayName}</div>
                      {row.dateStr && (
                        <div className="text-[8.5pt] font-normal text-slate-700 mt-0.5 whitespace-nowrap">
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
                  <td className="border border-slate-900 px-1.5 py-1 align-middle text-left text-slate-900">
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

        {/* Printable Signatures Block */}
        <div className="pt-8 flex justify-between text-[11pt] text-center font-semibold">
          <div className="space-y-1">
            <p className="font-bold">BAN GIÁM HIỆU DUYỆT</p>
            <p className="text-[10pt] text-slate-500 italic font-normal">(Ký và ghi rõ họ tên)</p>
          </div>
          <div className="space-y-1">
            <p className="italic text-[10pt] text-slate-600 font-normal">..., ngày ..... tháng ..... năm 2026</p>
            <p className="font-bold">GIÁO VIÊN BÁO GIẢNG</p>
            <p className="text-[10pt] text-slate-500 italic font-normal">(Ký và ghi rõ họ tên)</p>
            <div className="pt-14 font-bold text-[11pt] text-slate-900">{teacher.fullName}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
