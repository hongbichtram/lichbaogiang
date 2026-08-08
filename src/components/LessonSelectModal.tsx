import React, { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  BookOpen, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  ChevronRight, 
  Clock, 
  Check, 
  Filter,
  Info
} from 'lucide-react';
import { ScheduleItem, PPCTCurriculum, PPCTItem } from '../types';

interface LessonSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  scheduleItem: ScheduleItem | null;
  curriculums: PPCTCurriculum[];
  allSchedules: ScheduleItem[];
  onSelectLesson: (item: PPCTItem, warnings?: string[]) => void;
}

export const LessonSelectModal: React.FC<LessonSelectModalProps> = ({
  isOpen,
  onClose,
  scheduleItem,
  curriculums,
  allSchedules,
  onSelectLesson,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPpctItem, setSelectedPpctItem] = useState<PPCTItem | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  // Find matching curriculum for current class grade & subject
  const matchingCurriculum = useMemo(() => {
    if (!scheduleItem) return curriculums[0];
    return curriculums.find(
      c => c.grade === scheduleItem.grade && c.subject === scheduleItem.subject
    ) || curriculums.find(c => c.grade === scheduleItem.grade) || curriculums[0];
  }, [curriculums, scheduleItem]);

  const ppctItems = matchingCurriculum?.items || [];

  // Identify which PPCT items have already been taught/scheduled for this specific class
  const classScheduleHistory = useMemo(() => {
    if (!scheduleItem) return [];
    return allSchedules.filter(
      s => s.className === scheduleItem.className && s.subject === scheduleItem.subject
    );
  }, [allSchedules, scheduleItem]);

  // Find the highest scheduled PPCT period for this class to compute next lesson suggestion
  const maxScheduledPpct = useMemo(() => {
    if (!scheduleItem) return 0;
    let maxPeriod = 0;
    classScheduleHistory.forEach(s => {
      if (s.ppctPeriod && s.weekNumber <= scheduleItem.weekNumber && s.id !== scheduleItem.id) {
        if (s.ppctPeriod > maxPeriod) {
          maxPeriod = s.ppctPeriod;
        }
      }
    });
    return maxPeriod;
  }, [classScheduleHistory, scheduleItem]);

  // Suggested next PPCT item
  const suggestedNextPpct = useMemo(() => {
    if (!scheduleItem) return ppctItems[0];
    const nextPeriodNumber = maxScheduledPpct > 0 ? maxScheduledPpct + 1 : scheduleItem.weekNumber;
    return ppctItems.find(i => i.periodNumber === nextPeriodNumber) || ppctItems.find(i => i.week === scheduleItem.weekNumber) || ppctItems[0];
  }, [ppctItems, maxScheduledPpct, scheduleItem]);

  // Filter PPCT items by search query
  const filteredPpctItems = useMemo(() => {
    if (!searchQuery.trim()) return ppctItems;
    const q = searchQuery.toLowerCase().trim();
    return ppctItems.filter(item => {
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchTopic = item.topic?.toLowerCase().includes(q);
      const matchPeriod = `tiết ${item.periodNumber}`.includes(q) || `bài ${item.periodNumber}`.includes(q) || item.periodNumber.toString() === q;
      const matchReq = item.requirements?.toLowerCase().includes(q);
      return matchTitle || matchTopic || matchPeriod || matchReq;
    });
  }, [ppctItems, searchQuery]);

  if (!isOpen || !scheduleItem) return null;

  // Helper to check warnings for a chosen PPCT item
  const checkLessonWarnings = (item: PPCTItem): string[] => {
    const warnings: string[] = [];

    // 1. Check if already taught in previous or current weeks for this class
    const previousSchedule = classScheduleHistory.find(
      s => (s.ppctPeriod === item.periodNumber || s.lessonTitle === item.title) && s.id !== scheduleItem.id
    );
    if (previousSchedule) {
      warnings.push(`Bài học này đã được báo giảng ở Tuần ${previousSchedule.weekNumber} (Thứ ${previousSchedule.dayOfWeek}, Tiết ${previousSchedule.period}) cho lớp ${scheduleItem.className}.`);
    }

    // 2. Check PPCT order sequence warning
    if (suggestedNextPpct && item.periodNumber !== suggestedNextPpct.periodNumber) {
      if (item.periodNumber > suggestedNextPpct.periodNumber + 1) {
        warnings.push(`Bài học này vượt tiến độ Phân phối chương trình (Đang ở Tiết PPCT ${item.periodNumber}, bài gợi ý tiếp theo là Tiết ${suggestedNextPpct.periodNumber}).`);
      } else if (item.periodNumber < suggestedNextPpct.periodNumber) {
        warnings.push(`Bài học này nằm trước thứ tự bài hiện tại trong PPCT (Tiết ${item.periodNumber} vs Tiết gợi ý ${suggestedNextPpct.periodNumber}).`);
      }
    }

    return warnings;
  };

  const handleChooseItem = (item: PPCTItem) => {
    const warnings = checkLessonWarnings(item);
    if (warnings.length > 0) {
      setSelectedPpctItem(item);
      setWarningMessage(warnings.join(' '));
    } else {
      onSelectLesson(item);
      onClose();
    }
  };

  const handleConfirmWithWarning = () => {
    if (selectedPpctItem) {
      onSelectLesson(selectedPpctItem);
      setSelectedPpctItem(null);
      setWarningMessage(null);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800/80">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  Chọn bài dạy từ PPCT
                </h3>
                <span className="bg-blue-600 text-white text-xs px-2.5 py-0.5 rounded-full font-bold">
                  Lớp {scheduleItem.className}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Môn: <strong className="text-slate-700 dark:text-slate-300">{scheduleItem.subject}</strong> ({scheduleItem.grade}) • {matchingCurriculum?.textbook || 'Chương trình chuẩn GDPT 2018'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-200/50 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* Smart Next Lesson Suggestion Card */}
          {suggestedNextPpct && (
            <div className="p-4 bg-gradient-to-r from-indigo-500/10 via-blue-500/10 to-emerald-500/10 dark:from-indigo-950/40 dark:via-blue-950/40 dark:to-emerald-950/40 rounded-2xl border border-blue-200 dark:border-blue-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-500 text-slate-950">
                    <Sparkles className="w-3 h-3 fill-slate-950" />
                    <span>GỢI Ý BÀI TIẾP THEO</span>
                  </span>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    Tiết PPCT {suggestedNextPpct.periodNumber}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {suggestedNextPpct.title}
                </h4>
                {suggestedNextPpct.topic && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {suggestedNextPpct.topic}
                  </p>
                )}
              </div>

              <button
                onClick={() => handleChooseItem(suggestedNextPpct)}
                className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 whitespace-nowrap"
              >
                <span>⚡ Chọn bài gợi ý</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Warning Banner if selected item triggers warning */}
          {warningMessage && selectedPpctItem && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/60 border-2 border-amber-400 dark:border-amber-700 rounded-2xl text-amber-900 dark:text-amber-200 space-y-3 animate-fadeIn">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <h5 className="font-bold text-sm text-amber-900 dark:text-amber-100">
                    Cảnh báo tiến độ giảng dạy!
                  </h5>
                  <p className="leading-relaxed">{warningMessage}</p>
                  <p className="font-semibold text-amber-800 dark:text-amber-300">
                    Bạn vẫn có thể tiếp tục xác nhận nếu bài dạy phù hợp với thực tế lớp học.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-amber-200 dark:border-amber-800">
                <button
                  onClick={() => {
                    setSelectedPpctItem(null);
                    setWarningMessage(null);
                  }}
                  className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors"
                >
                  Chọn bài khác
                </button>
                <button
                  onClick={handleConfirmWithWarning}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
                >
                  Đồng ý vẫn chọn bài này
                </button>
              </div>
            </div>
          )}

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên bài, chủ đề, tiết PPCT (ví dụ: Bài 5, Thao tác, Tiết 10)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Lesson List Header */}
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            <span>Danh sách Phân phối chương trình ({filteredPpctItems.length} bài)</span>
            <span>Trạng thái đối với Lớp {scheduleItem.className}</span>
          </div>

          {/* Lesson Cards List */}
          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {filteredPpctItems.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <Info className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Không tìm thấy bài học phù hợp với từ khóa "{searchQuery}"
                </p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-2 text-xs text-blue-600 hover:underline font-bold"
                >
                  Xóa bộ lọc tìm kiếm
                </button>
              </div>
            ) : (
              filteredPpctItems.map((item) => {
                // Check if this item is currently scheduled for this class
                const previousSchedule = classScheduleHistory.find(
                  s => s.ppctPeriod === item.periodNumber || s.lessonTitle === item.title
                );
                const isSelectedForCurrentItem = scheduleItem.ppctPeriod === item.periodNumber || scheduleItem.lessonTitle === item.title;
                const isSuggested = suggestedNextPpct?.periodNumber === item.periodNumber;

                return (
                  <div
                    key={item.id || item.periodNumber}
                    onClick={() => handleChooseItem(item)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 group ${
                      isSelectedForCurrentItem
                        ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 shadow-sm'
                        : isSuggested
                        ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/80 hover:border-amber-500'
                        : 'bg-white dark:bg-slate-800/90 border-slate-200/80 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-sm'
                    }`}
                  >
                    {/* Period badge + Lesson Info */}
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                      <div className={`px-2.5 py-1 rounded-lg text-xs font-black shrink-0 ${
                        isSelectedForCurrentItem 
                          ? 'bg-blue-600 text-white' 
                          : isSuggested
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                      }`}>
                        Tiết {item.periodNumber}
                      </div>

                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {item.title}
                          </h5>
                          {isSuggested && (
                            <span className="text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-extrabold px-2 py-0.2 rounded-full border border-amber-300 dark:border-amber-800">
                              Gợi ý
                            </span>
                          )}
                        </div>
                        {item.topic && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {item.topic}
                          </p>
                        )}
                        {item.requirements && (
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 line-clamp-1 italic">
                            YCCĐ: {item.requirements}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Status badge / Select Button */}
                    <div className="shrink-0 flex items-center space-x-2">
                      {previousSchedule ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Đã báo giảng (Tuần {previousSchedule.weekNumber})</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-700 group-hover:bg-blue-600 group-hover:text-white text-slate-700 dark:text-slate-200 transition-colors">
                          <span>Chọn bài</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>💡 Chọn bài sẽ tự động điền Tiết PPCT, Tên bài, Chủ đề & Yêu cầu cần đạt.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
