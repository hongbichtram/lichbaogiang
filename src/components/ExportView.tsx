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
import { exportWeeklyWordDoc, exportWeeklyExcel, groupSchedulesByDay } from '../utils/exportUtils';

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

  const dayGroups = groupSchedulesByDay(exportSchedules, selectedWeek, teacher.academicYear);

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
              Xuất dữ liệu theo quy cách chuẩn BGD&ĐT: Tên trường, Giáo viên, Bảng lịch 7 cột và Chữ ký duyệt.
            </p>
          </div>

          {/* Action Export Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportWord}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center space-x-2 transition-all"
            >
              <FileText className="w-4 h-4" />
              <span>Tải Word (.docx)</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center space-x-2 transition-all"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Tải Excel (.xlsx)</span>
            </button>

            <button
              onClick={handlePrintPDF}
              className="px-4 py-2.5 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-md flex items-center space-x-2 transition-all"
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
        <div className="flex justify-between items-start text-[13pt] font-normal leading-relaxed">
          <div className="space-y-1">
            <p><strong>Trường:</strong> {teacher.schoolName || 'Tiểu học'}</p>
            <p><strong>Giáo viên:</strong> {teacher.fullName || 'Chưa cập nhật'} - <strong>Mã GV:</strong> {teacher.teacherCode || 'GV01'}</p>
          </div>
          <div className="text-right space-y-1">
            <p><strong>Năm học:</strong> {teacher.academicYear}</p>
            <p><strong>Học kỳ:</strong> {teacher.semester}</p>
          </div>
        </div>

        <div className="text-center pt-2">
          <h1 className="text-[16pt] font-bold uppercase text-slate-900 tracking-wide">
            LỊCH BÁO GIẢNG {exportScope === 'week' ? `TUẦN ${selectedWeek}` : 'TỔNG HỢP'}
          </h1>
        </div>

        {/* Printable Schedule Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border border-slate-400 text-[13pt] font-['Times_New_Roman',_serif] mx-auto">
            <thead>
              <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-400 text-center">
                <th className="border border-slate-400 p-2.5 w-[17%] text-center align-middle">Thứ, ngày tháng năm</th>
                <th className="border border-slate-400 p-2.5 w-[8%] text-center align-middle">Tiết</th>
                <th className="border border-slate-400 p-2.5 w-[8%] text-center align-middle">Lớp</th>
                <th className="border border-slate-400 p-2.5 w-[10%] text-center align-middle">Tiết PPCT</th>
                <th className="border border-slate-400 p-2.5 w-[45%] text-center align-middle">Tên bài dạy / Nội dung</th>
                <th className="border border-slate-400 p-2.5 w-[12%] text-center align-middle">Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {dayGroups.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-6 text-slate-400 italic align-middle">
                    Chưa có lịch báo giảng trong tuần này.
                  </td>
                </tr>
              ) : (
                dayGroups.map((group) =>
                  group.items.map((item, itemIdx) => (
                    <tr key={item.id} className="border-b border-slate-300 min-h-[38px]">
                      {itemIdx === 0 && (
                        <td
                          rowSpan={group.items.length}
                          className="border border-slate-400 px-2.5 py-2 text-center align-middle font-['Times_New_Roman',_serif] bg-white"
                        >
                          <div className="font-bold text-[13pt] text-slate-900">{group.dayDisplayName}</div>
                          <div className="text-[11pt] font-normal text-slate-600 mt-0.5">{group.dateStr}</div>
                        </td>
                      )}
                      <td className="border border-slate-400 px-2 py-2 text-center align-middle">Tiết {item.period}</td>
                      <td className="border border-slate-400 px-2 py-2 text-center align-middle font-bold">{item.className}</td>
                      <td className="border border-slate-400 px-2 py-2 text-center align-middle">{item.ppctPeriod || '-'}</td>
                      <td className="border border-slate-400 px-2.5 py-2 align-middle font-medium">{item.lessonTitle || 'Chưa cập nhật'}</td>
                      <td className="border border-slate-400 px-2.5 py-2 align-middle text-slate-700">{item.notes || ''}</td>
                    </tr>
                  ))
                )
              )}
            </tbody>
          </table>
        </div>

        {/* Printable Signatures Block */}
        <div className="pt-8 flex justify-between text-[13pt] text-center font-semibold">
          <div className="space-y-1">
            <p className="font-bold">BAN GIÁM HIỆU DUYỆT</p>
            <p className="text-[11pt] text-slate-500 italic font-normal">(Ký và ghi rõ họ tên)</p>
          </div>
          <div className="space-y-1">
            <p className="italic text-[11pt] text-slate-600 font-normal">..., Ngày ..... tháng ..... năm 2026</p>
            <p className="font-bold">GIÁO VIÊN BÁO GIẢNG</p>
            <p className="text-[11pt] text-slate-500 italic font-normal">(Ký và ghi rõ họ tên)</p>
            <div className="pt-14 font-bold text-[13pt] text-slate-900">{teacher.fullName}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
