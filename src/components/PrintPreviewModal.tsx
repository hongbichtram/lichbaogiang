import React from 'react';
import { X, Printer, FileText, FileSpreadsheet, Download } from 'lucide-react';
import { ScheduleItem, TeacherProfile } from '../types';
import { exportWeeklyWordDoc, exportWeeklyExcel, groupSchedulesByDay } from '../utils/exportUtils';

interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher?: TeacherProfile;
  schedules: ScheduleItem[];
  currentWeek: number;
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
}) => {
  if (!isOpen) return null;

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-5xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-xl">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                XEM TRƯỚC VÀ IN LỊCH BÁO GIẢNG
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Lịch báo giảng Tuần {currentWeek} • {teacher.schoolName}
              </p>
            </div>
          </div>

          {/* Action Export Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>🖨 In</span>
            </button>

            <button
              type="button"
              onClick={handleExportWord}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <FileText className="w-4 h-4" />
              <span>↓ Word</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>↓ Excel</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>↓ PDF</span>
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
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-slate-100 dark:bg-slate-950">
          <div className="bg-white text-slate-900 p-8 sm:p-10 rounded-2xl shadow-xl max-w-4xl mx-auto space-y-6 font-['Times_New_Roman',_serif] text-[13pt] leading-relaxed border border-slate-200 print:shadow-none print:border-none">
            
            {/* Header metadata */}
            <div className="flex justify-between items-start text-[13pt] font-normal">
              <div className="space-y-1">
                <p><strong>Trường:</strong> {teacher.schoolName || 'Tiểu học'}</p>
                <p><strong>Giáo viên:</strong> {teacher.fullName || 'Hồng Bích Trâm'} {teacher.teacherCode ? `- Mã GV: ${teacher.teacherCode}` : ''}</p>
              </div>
              <div className="text-right space-y-1">
                <p><strong>Năm học:</strong> {teacher.academicYear || '2025-2026'}</p>
                <p><strong>Học kỳ:</strong> {teacher.semester || 'Học kỳ I'}</p>
              </div>
            </div>

            {/* Document Title */}
            <div className="text-center pt-2">
              <h1 className="text-[16pt] font-bold uppercase text-slate-900 tracking-wide">
                LỊCH BÁO GIẢNG TUẦN {currentWeek}
              </h1>
            </div>

            {/* 6-Column BGD Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse border border-slate-400 text-[12pt] sm:text-[13pt] font-['Times_New_Roman',_serif]">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-400 text-center">
                    <th className="border border-slate-400 p-2.5 w-[18%] text-center align-middle">Thứ, ngày tháng năm</th>
                    <th className="border border-slate-400 p-2.5 w-[10%] text-center align-middle">Tiết</th>
                    <th className="border border-slate-400 p-2.5 w-[10%] text-center align-middle">Lớp</th>
                    <th className="border border-slate-400 p-2.5 w-[12%] text-center align-middle">Tiết PPCT</th>
                    <th className="border border-slate-400 p-2.5 w-[38%] text-center align-middle">Tên bài dạy</th>
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
                              className="border border-slate-400 px-2.5 py-2 text-center align-middle font-['Times_New_Roman',_serif] bg-white font-bold"
                            >
                              <div className="text-[13pt] text-slate-900">{group.dayDisplayName}</div>
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

            {/* Signatures */}
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

      </div>
    </div>
  );
};
