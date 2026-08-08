import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronDown, 
  Search, 
  Plus, 
  Check, 
  AlertTriangle, 
  X, 
  School 
} from 'lucide-react';
import { ClassTimetableRule } from '../types';
import { getFullPeriodLabel, getNormalizedSession, getNormalizedPeriod } from '../utils/classUtils';

interface ClassSelectDropdownProps {
  value: string; // Current selected class name, e.g. "4A1"
  assignedClasses: string[]; // List of teacher's available classes, e.g. ["3A1", "3A2", "4A1", ...]
  onSelect: (className: string) => void;
  onClear?: () => void;
  onQuickAddClass?: (newClassName: string) => void;
  placeholder?: string;
  dayOfWeek?: 'Thứ 2' | 'Thứ 3' | 'Thứ 4' | 'Thứ 5' | 'Thứ 6';
  session?: 'Sáng' | 'Chiều';
  period?: number;
  existingRules?: ClassTimetableRule[];
  currentRuleId?: string;
  compact?: boolean; // For display inside matrix cell
}

export const ClassSelectDropdown: React.FC<ClassSelectDropdownProps> = ({
  value,
  assignedClasses = [],
  onSelect,
  onClear,
  onQuickAddClass,
  placeholder = 'Chọn lớp',
  dayOfWeek,
  session,
  period,
  existingRules = [],
  currentRuleId,
  compact = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [quickAddInput, setQuickAddInput] = useState('');
  
  // Conflict warning state
  const [conflictWarning, setConflictWarning] = useState<{
    pendingClass: string;
    conflictingSlot: string;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Filter classes based on search query
  const filteredClasses = assignedClasses.filter(cls =>
    cls.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  // Handle class selection & conflict checking
  const handleAttemptSelect = (className: string) => {
    // Check if class is already scheduled in existingRules for the EXACT same slot
    if (dayOfWeek && period && existingRules.length > 0) {
      const normSession = session || 'Sáng';
      const conflict = existingRules.find(r => 
        r.id !== currentRuleId &&
        r.className === className &&
        r.dayOfWeek === dayOfWeek &&
        getNormalizedSession(r) === normSession &&
        getNormalizedPeriod(r) === period
      );

      if (conflict) {
        setConflictWarning({
          pendingClass: className,
          conflictingSlot: `${conflict.dayOfWeek} – ${getFullPeriodLabel(conflict.period, conflict.session)}`,
        });
        setIsOpen(false);
        return;
      }
    }

    // No conflict, select directly
    onSelect(className);
    setIsOpen(false);
  };

  const handleConfirmConflictSelection = () => {
    if (conflictWarning) {
      onSelect(conflictWarning.pendingClass);
      setConflictWarning(null);
    }
  };

  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = quickAddInput.trim().toUpperCase();
    if (cleaned) {
      if (onQuickAddClass) {
        onQuickAddClass(cleaned);
      }
      handleAttemptSelect(cleaned);
      setQuickAddInput('');
      setShowQuickAddModal(false);
    }
  };

  return (
    <div ref={containerRef} className="relative inline-block w-full text-left">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between rounded-xl border font-bold transition-all ${
          compact
            ? value
              ? 'px-2 py-1.5 text-xs sm:text-sm bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 shadow-2xs hover:bg-blue-100'
              : 'px-2 py-1.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 text-slate-400 dark:text-slate-500 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            : value
              ? 'p-2.5 text-xs sm:text-sm bg-blue-50/80 dark:bg-blue-950/50 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200 shadow-2xs hover:bg-blue-100/80'
              : 'p-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-400'
        }`}
      >
        <span className="truncate flex items-center gap-1">
          {value ? (
            <>
              <span className="font-extrabold">{value}</span>
            </>
          ) : (
            <span className="font-normal italic">▼ {placeholder}</span>
          )}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 ml-1 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-56 sm:w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Search Box Header */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-900/60">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="🔍 Tìm lớp (ví dụ: 4A, 5)..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Classes List */}
          <div className="max-h-48 overflow-y-auto p-1.5 space-y-0.5">
            {assignedClasses.length === 0 ? (
              <div className="p-3 text-center space-y-2">
                <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                  Chưa có lớp học. Vui lòng thêm lớp trong mục “Quản lý lớp”.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setShowQuickAddModal(true);
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs inline-flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Thêm lớp</span>
                </button>
              </div>
            ) : filteredClasses.length === 0 ? (
              <div className="p-3 text-center space-y-2">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Không tìm thấy lớp "{searchQuery}".
                </p>
                {onQuickAddClass && searchQuery.trim() && (
                  <button
                    type="button"
                    onClick={() => {
                      const newCls = searchQuery.trim().toUpperCase();
                      onQuickAddClass(newCls);
                      handleAttemptSelect(newCls);
                    }}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold inline-flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3 h-3 text-blue-600" />
                    <span>Thêm lớp "{searchQuery.trim().toUpperCase()}"</span>
                  </button>
                )}
              </div>
            ) : (
              filteredClasses.map((cls) => {
                const isSelected = cls === value;
                return (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => handleAttemptSelect(cls)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-2xs font-bold'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/80'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white' : 'bg-slate-300 dark:bg-slate-600'}`} />
                      <span>{cls}</span>
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-1.5 border-t border-slate-100 dark:border-slate-700/80 bg-slate-50/40 dark:bg-slate-900/40 flex items-center justify-between text-xs">
            {value && onClear ? (
              <button
                type="button"
                onClick={() => {
                  onClear();
                  setIsOpen(false);
                }}
                className="w-full text-center py-1.5 px-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg font-semibold transition-colors flex items-center justify-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>Xóa chọn lớp</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setShowQuickAddModal(true);
                }}
                className="w-full text-center py-1.5 px-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg font-semibold transition-colors flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Thêm lớp mới</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Quick Add Class Modal */}
      {showQuickAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-5 max-w-sm w-full space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <School className="w-4 h-4 text-blue-600" />
                <span>Thêm Lớp Học Mới</span>
              </h4>
              <button
                onClick={() => setShowQuickAddModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickAddSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tên Lớp (ví dụ: 3A1, 4A2, 5A3)
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Nhập tên lớp..."
                  value={quickAddInput}
                  onChange={(e) => setQuickAddInput(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowQuickAddModal(false)}
                  className="px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20"
                >
                  Xác nhận thêm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Conflict Warning Dialog */}
      {conflictWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-amber-200 dark:border-amber-900/50 p-6 max-w-md w-full space-y-4">
            <div className="flex items-start gap-3 text-amber-600 dark:text-amber-400">
              <div className="p-2.5 bg-amber-100 dark:bg-amber-950/80 rounded-2xl">
                <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-base text-slate-900 dark:text-white">
                  Cảnh Báo Trùng Lịch Lớp
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  ⚠️ Lớp <strong className="text-amber-700 dark:text-amber-300">{conflictWarning.pendingClass}</strong> đã được sử dụng ở <strong className="text-slate-900 dark:text-white">{conflictWarning.conflictingSlot}</strong>. Vui lòng kiểm tra lại thời khóa biểu.
                </p>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200/60 dark:border-amber-900/30">
              Bạn có muốn tiếp tục phân công lớp này cho tiết mới hay không?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConflictWarning(null)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors"
              >
                Hủy / Chọn lớp khác
              </button>
              <button
                type="button"
                onClick={handleConfirmConflictSelection}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 transition-colors"
              >
                Vẫn phân công
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
