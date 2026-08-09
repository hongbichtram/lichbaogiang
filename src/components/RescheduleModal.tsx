import React, { useState } from 'react';
import { ArrowLeftRight, X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { ScheduleItem } from '../types';
import { getFullPeriodLabel, formatLessonDisplayTitle } from '../utils/classUtils';

interface RescheduleModalProps {
  item: ScheduleItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmReschedule: (item: ScheduleItem, shiftAll: boolean) => void;
}

export const RescheduleModal: React.FC<RescheduleModalProps> = ({
  item,
  isOpen,
  onClose,
  onConfirmReschedule,
}) => {
  const [shiftAll, setShiftAll] = useState(true);

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Điều chỉnh & Dời lịch dạy
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Lớp {item.className} • Môn {item.subject} • {item.dayOfWeek} • {getFullPeriodLabel(item.period)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lesson Details Box */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700 text-xs space-y-1">
          <span className="font-semibold text-blue-600 dark:text-blue-400 block">
            Bài dạy hiện tại (Tiết PPCT {item.ppctPeriod || '-'})
          </span>
          <span className="font-bold text-slate-900 dark:text-white text-sm block">
            {formatLessonDisplayTitle(item.lessonTitle, item.subject)}
          </span>
        </div>

        {/* Prompt Question */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-amber-700 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Bạn muốn dời toàn bộ các bài phía sau?</span>
          </div>

          <div className="space-y-2">
            <label
              onClick={() => setShiftAll(true)}
              className={`flex items-start space-x-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                shiftAll
                  ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 text-blue-900 dark:text-blue-200 ring-2 ring-blue-500/20'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <input
                type="radio"
                name="shiftOption"
                checked={shiftAll}
                onChange={() => setShiftAll(true)}
                className="mt-0.5"
              />
              <div className="text-xs space-y-0.5">
                <span className="font-bold block">Đồng ý: Dời toàn bộ các bài học phía sau</span>
                <span className="text-slate-500 dark:text-slate-400 block">
                  Tự động cập nhật toàn bộ lịch dạy của lớp {item.className} tịnh tiến 1 tiết. Đảm bảo không bị trùng bài và không bị thiếu tiết theo đúng PPCT.
                </span>
              </div>
            </label>

            <label
              onClick={() => setShiftAll(false)}
              className={`flex items-start space-x-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                !shiftAll
                  ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 text-blue-900 dark:text-blue-200 ring-2 ring-blue-500/20'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <input
                type="radio"
                name="shiftOption"
                checked={!shiftAll}
                onChange={() => setShiftAll(false)}
                className="mt-0.5"
              />
              <div className="text-xs space-y-0.5">
                <span className="font-bold block">Chỉ bỏ qua/hoãn bài học tiết này</span>
                <span className="text-slate-500 dark:text-slate-400 block">
                  Chỉ thay đổi tiết học hiện tại, giữ nguyên danh sách bài dạy của các tuần tiếp theo.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            onClick={() => {
              onConfirmReschedule(item, shiftAll);
              onClose();
            }}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center space-x-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Xác nhận dời lịch</span>
          </button>
        </div>
      </div>
    </div>
  );
};
