import React, { useState, useEffect } from 'react';
import { X, Calendar, RotateCcw, Save, AlertTriangle, ArrowRight, Info, CheckCircle2 } from 'lucide-react';
import { 
  CustomWeekDate, 
  getDefaultWeekDates, 
  convertDDMMYYYYToISO, 
  convertISOToDDMMYYYY, 
  loadCustomWeekDatesMap, 
  propagateWeekDatesFrom,
  resetWeekDatesFrom,
  calculateWeek5DaysFromMonday
} from '../utils/dateWeekUtils';
import { ScheduleItem } from '../types';
import { auth, saveCustomWeekDatesToFirestore } from '../lib/firebase';

interface EditWeekDateModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentWeek: number;
  academicYear?: string;
  schedules?: ScheduleItem[];
  onSaved: () => void;
}

export const EditWeekDateModal: React.FC<EditWeekDateModalProps> = ({
  isOpen,
  onClose,
  currentWeek,
  academicYear = '2025-2026',
  schedules = [],
  onSaved,
}) => {
  if (!isOpen) return null;

  const defaultDates = getDefaultWeekDates(currentWeek, academicYear);
  const currentMap = loadCustomWeekDatesMap();
  const existingCustom = currentMap[currentWeek];

  // Primary anchor: Start Date (Thứ 2) in ISO YYYY-MM-DD
  const [startDateISO, setStartDateISO] = useState<string>(
    convertDDMMYYYYToISO(existingCustom ? existingCustom.startDate : defaultDates.startDate)
  );

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showCascadeWarning, setShowCascadeWarning] = useState<boolean>(false);

  // Compute 5 teaching days (Thứ 2 -> Thứ 6) preview based on selected startDateISO
  const getPreviewWeek = (): CustomWeekDate => {
    if (!startDateISO) return defaultDates;
    const [y, m, d] = startDateISO.split('-').map(Number);
    if (!y || !m || !d) return defaultDates;
    const startD = new Date(y, m - 1, d);
    return calculateWeek5DaysFromMonday(startD);
  };

  const preview = getPreviewWeek();

  // Handle start date picker change
  const handleStartDateChange = (val: string) => {
    setStartDateISO(val);
    setErrorMessage(null);
    setShowCascadeWarning(false);
  };

  const handleResetDefault = () => {
    if (window.confirm(`Khôi phục lịch ngày mặc định từ Tuần ${currentWeek} trở đi?`)) {
      const updatedMap = resetWeekDatesFrom(currentWeek, 35);
      if (auth.currentUser?.uid) {
        saveCustomWeekDatesToFirestore(auth.currentUser.uid, updatedMap);
      }
      onSaved();
      onClose();
    }
  };

  const handleInitialSaveClick = () => {
    setErrorMessage(null);

    if (!startDateISO) {
      setErrorMessage('Vui lòng chọn ngày bắt đầu (Thứ 2) hợp lệ.');
      return;
    }

    // Show cascade notification modal warning
    setShowCascadeWarning(true);
  };

  const executeSave = () => {
    // Propagate custom dates continuously from currentWeek through week 35
    const updatedMap = propagateWeekDatesFrom(currentWeek, startDateISO, academicYear, 35);
    if (auth.currentUser?.uid) {
      saveCustomWeekDatesToFirestore(auth.currentUser.uid, updatedMap);
    }
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl border border-indigo-500/20 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-indigo-500/20 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-600/30 rounded-xl border border-indigo-400/30 text-indigo-300">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-wider uppercase bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                ĐIỀU CHỈNH NGÀY THỰC TẾ TUẦN {currentWeek}
              </h3>
              <p className="text-[11px] text-indigo-300/80 font-medium">
                Tự động nối tiếp 5 ngày học (Thứ 2 → Thứ 6) cho các tuần sau
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 overflow-y-auto space-y-4 bg-slate-50 dark:bg-slate-900 flex-1">
          
          {errorMessage && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Principle Info Banner */}
          <div className="bg-indigo-50 dark:bg-slate-800/90 border border-indigo-500/20 p-3.5 rounded-2xl flex items-start gap-2.5 text-slate-700 dark:text-slate-300 text-xs">
            <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-slate-900 dark:text-white">
                Nguyên tắc quản lý lịch báo giảng:
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-600 dark:text-slate-400">
                <li>Chỉ tính 5 ngày giảng dạy: <strong>Thứ 2 → Thứ 6</strong> (bỏ qua Thứ 7, Chủ nhật).</li>
                <li><strong>Không thay đổi PPCT</strong>, tên bài dạy, hay thời khóa biểu cố định.</li>
                <li>Tự động nối tiếp tính ngày cho các tuần tiếp theo.</li>
              </ul>
            </div>
          </div>

          {/* Start Date Selection (Thứ 2) */}
          <div className="p-4 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
            <label className="block text-xs font-black text-slate-900 dark:text-white uppercase">
              Ngày bắt đầu tuần {currentWeek} (Thứ 2):
            </label>
            <div className="flex items-center gap-3">
              <input
                type="date"
                value={startDateISO}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="flex-1 p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 shrink-0 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-2 rounded-xl border border-indigo-500/20">
                {preview.startDate} – {preview.endDate}
              </span>
            </div>
          </div>

          {/* 5 Teaching Days Preview Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <span>Lịch 5 ngày giảng dạy Tuần {currentWeek}:</span>
            </h4>

            <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700/60 overflow-hidden">
              {[
                { label: 'Thứ 2', dateStr: preview.dayDates['Thứ 2'] },
                { label: 'Thứ 3', dateStr: preview.dayDates['Thứ 3'] },
                { label: 'Thứ 4', dateStr: preview.dayDates['Thứ 4'] },
                { label: 'Thứ 5', dateStr: preview.dayDates['Thứ 5'] },
                { label: 'Thứ 6', dateStr: preview.dayDates['Thứ 6'] },
              ].map(({ label, dateStr }) => (
                <div key={label} className="flex items-center justify-between p-2.5 px-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <span className="text-xs font-black text-slate-900 dark:text-white uppercase">
                    {label}
                  </span>
                  <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
                    {dateStr}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Cascade Warning Modal Confirmation */}
          {showCascadeWarning && (
            <div className="p-4 bg-amber-500/15 border border-amber-500/40 rounded-2xl space-y-3 animate-fadeIn">
              <div className="flex items-center gap-2 font-black text-xs text-amber-800 dark:text-amber-300">
                <AlertTriangle className="w-4.5 h-4.5 text-amber-500 shrink-0" />
                <span>XÁC NHẬN CẬP NHẬT CHUỖI LỊCH TUẦN</span>
              </div>
              <p className="text-xs leading-relaxed font-semibold text-slate-800 dark:text-amber-100">
                ⚠️ Việc thay đổi ngày của <strong>Tuần {currentWeek}</strong> sẽ tự động điều chỉnh ngày thực tế của các tuần tiếp theo (Tuần {currentWeek + 1}, Tuần {currentWeek + 2}...). Bạn có muốn tiếp tục?
              </p>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCascadeWarning(false)}
                  className="px-3.5 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={executeSave}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Xác nhận điều chỉnh</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-100 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={handleResetDefault}
            className="px-3 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
            title="Khôi phục lịch ngày mặc định"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">↩ Khôi phục lịch mặc định</span>
            <span className="sm:hidden">Khôi phục</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-bold transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleInitialSaveClick}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/25 transition-colors flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Lưu thay đổi</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
