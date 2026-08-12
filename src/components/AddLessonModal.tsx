import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  BookOpen, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  Search,
  Calendar,
  Clock,
  Check
} from 'lucide-react';
import { ScheduleItem, TeacherProfile, PPCTCurriculum, PPCTItem, ClassTimetableRule, TimetableVersion } from '../types';
import { getWeekDayDate } from '../utils/exportUtils';
import { inferGradeFromClassName } from '../utils/classUtils';
import { getTeacherUniqueSubjects } from '../utils/subjectUtils';
import { getScheduleForTeachingSlot, getTimetableVersionForWeek } from '../utils/timetableUtils';

interface AddLessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDayOfWeek?: 'Thứ 2' | 'Thứ 3' | 'Thứ 4' | 'Thứ 5' | 'Thứ 6';
  initialPeriod?: number;
  currentWeek: number;
  teacher: TeacherProfile;
  curriculums: PPCTCurriculum[];
  timetableRules?: ClassTimetableRule[];
  timetableVersions?: TimetableVersion[];
  schedules: ScheduleItem[];
  assignedClasses: string[];
  onSave: (newItem: ScheduleItem) => void;
}

const DAYS_LIST: Array<'Thứ 2' | 'Thứ 3' | 'Thứ 4' | 'Thứ 5' | 'Thứ 6'> = [
  'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6'
];

export const AddLessonModal: React.FC<AddLessonModalProps> = ({
  isOpen,
  onClose,
  initialDayOfWeek = 'Thứ 2',
  initialPeriod = 1,
  currentWeek,
  teacher,
  curriculums,
  timetableRules = [],
  timetableVersions = [],
  schedules,
  assignedClasses,
  onSave,
}) => {
  // Available subjects
  const availableSubjects = useMemo(() => {
    return getTeacherUniqueSubjects(teacher?.subjects || [], [], schedules);
  }, [teacher?.subjects, schedules]);

  // Form state
  const [dayOfWeek, setDayOfWeek] = useState<'Thứ 2' | 'Thứ 3' | 'Thứ 4' | 'Thứ 5' | 'Thứ 6'>(initialDayOfWeek);
  const [session, setSession] = useState<'sáng' | 'chiều'>('sáng');
  const [subPeriod, setSubPeriod] = useState<number>(1); // 1..4 for sáng, 1..3 for chiều
  const [selectedSubject, setSelectedSubject] = useState<string>(availableSubjects[0] || 'Tin học');
  const [selectedClass, setSelectedClass] = useState<string>('4A1');
  const [ppctPeriod, setPpctPeriod] = useState<number>(1);
  const [lessonTitle, setLessonTitle] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Sub-modal state for "📚 Chọn bài dạy"
  const [isLessonPickerOpen, setIsLessonPickerOpen] = useState<boolean>(false);
  const [pickerSearchQuery, setPickerSearchQuery] = useState<string>('');

  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Available classes fallback
  const classList = useMemo(() => {
    if (assignedClasses && assignedClasses.length > 0) return assignedClasses;
    return ['3A1', '3A2', '3A3', '4A1', '4A2', '4A3', '5A1', '5A2', '5A3'];
  }, [assignedClasses]);

  // Active timetable rules for the selected week
  const activeRulesForWeek = useMemo(() => {
    const year = teacher?.academicYear || '2026-2027';
    if (timetableVersions && timetableVersions.length > 0) {
      const ver = getTimetableVersionForWeek(timetableVersions, year, currentWeek);
      if (ver?.rules) return ver.rules;
    }
    return [];
  }, [timetableVersions, teacher?.academicYear, currentWeek]);

  // Find matching slot in Timetable (TKB)
  const tkbSlot = useMemo(() => {
    return getScheduleForTeachingSlot(
      activeRulesForWeek,
      dayOfWeek,
      subPeriod,
      session === 'sáng' ? 'Sáng' : 'Chiều'
    );
  }, [activeRulesForWeek, dayOfWeek, subPeriod, session]);

  // When TKB slot is found for the selected day + period, auto fill class & subject
  useEffect(() => {
    if (tkbSlot) {
      if (tkbSlot.className) setSelectedClass(tkbSlot.className);
      if (tkbSlot.subject) setSelectedSubject(tkbSlot.subject);
    }
  }, [tkbSlot]);

  // Sync initial parameters when modal opens
  useEffect(() => {
    if (isOpen) {
      const validDay = (initialDayOfWeek === ('Thứ 7' as any) ? 'Thứ 2' : initialDayOfWeek) || 'Thứ 2';
      setDayOfWeek(validDay);

      if (initialPeriod > 4) {
        setSession('chiều');
        setSubPeriod(Math.min(3, Math.max(1, initialPeriod - 4)));
      } else {
        setSession('sáng');
        setSubPeriod(Math.min(4, Math.max(1, initialPeriod)));
      }

      const defaultCls = classList[0] || '4A1';
      setSelectedClass(defaultCls);
      setSelectedSubject(availableSubjects[0] || 'Tin học');
      setNotes('');
      setIsLessonPickerOpen(false);
      setToastMessage(null);
    }
  }, [isOpen, initialDayOfWeek, initialPeriod, classList, availableSubjects]);

  // Infer Grade & Subject for selected class
  const currentGrade = useMemo(() => inferGradeFromClassName(selectedClass), [selectedClass]);

  // Find matching PPCT curriculum specifically for Subject + Grade
  const matchingCurriculum = useMemo(() => {
    return curriculums.find(c => c.grade === currentGrade && c.subject === selectedSubject)
      || curriculums.find(c => c.grade === currentGrade)
      || curriculums[0];
  }, [curriculums, currentGrade, selectedSubject]);

  const ppctItems = matchingCurriculum?.items || [];

  // Calculate suggested next PPCT item for this class & subject
  const suggestedPpctItem = useMemo(() => {
    if (!ppctItems || ppctItems.length === 0) return null;

    // Find all schedules taught for this class & subject
    const classHistory = schedules.filter(
      s => s.className === selectedClass && s.subject === selectedSubject && s.ppctPeriod
    );

    let maxPeriod = 0;
    classHistory.forEach(s => {
      if (s.ppctPeriod && s.ppctPeriod > maxPeriod) {
        maxPeriod = s.ppctPeriod;
      }
    });

    const nextPeriodNumber = maxPeriod > 0 ? maxPeriod + 1 : currentWeek;
    return (
      ppctItems.find(i => i.periodNumber === nextPeriodNumber) ||
      ppctItems.find(i => i.week === currentWeek) ||
      ppctItems[0]
    );
  }, [ppctItems, schedules, selectedClass, selectedSubject, currentWeek]);

  // Auto-fill PPCT & Lesson Title when class, subject or matching curriculum changes
  useEffect(() => {
    if (suggestedPpctItem) {
      setPpctPeriod(suggestedPpctItem.periodNumber);
      setLessonTitle(suggestedPpctItem.title);
    } else {
      setPpctPeriod(currentWeek);
      setLessonTitle(`Bài học tuần ${currentWeek}`);
    }
  }, [selectedClass, selectedSubject, suggestedPpctItem, currentWeek]);

  if (!isOpen) return null;

  // Check duplicate period
  const targetSession = session === 'sáng' ? 'Sáng' : 'Chiều';
  const isDuplicatePeriod = schedules.some(
    s => s.weekNumber === currentWeek &&
         s.dayOfWeek === dayOfWeek &&
         (s.session === targetSession || (!s.session && ((s.period <= 4 && targetSession === 'Sáng') || (s.period > 4 && targetSession === 'Chiều')))) &&
         (s.period === subPeriod || (s.period === (targetSession === 'Sáng' ? subPeriod : subPeriod + 4))) &&
         s.className === selectedClass
  );

  // Check if lesson is different from suggested PPCT
  const isPpctMismatch = suggestedPpctItem && (
    lessonTitle !== suggestedPpctItem.title || ppctPeriod !== suggestedPpctItem.periodNumber
  );

  // Filtered PPCT items for "📚 Chọn bài dạy" sub-modal
  const filteredPpctItems = ppctItems.filter(item => {
    if (!pickerSearchQuery.trim()) return true;
    const q = pickerSearchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      `tiết ${item.periodNumber}`.includes(q) ||
      (item.topic && item.topic.toLowerCase().includes(q))
    );
  });

  const handleSelectPpctItemFromPicker = (item: PPCTItem) => {
    setPpctPeriod(item.periodNumber);
    setLessonTitle(item.title);
    setIsLessonPickerOpen(false);
  };

  const handleSaveLesson = () => {
    const newItem: ScheduleItem = {
      id: `s-custom-${Date.now()}`,
      teacherId: teacher.uid,
      curriculumId: matchingCurriculum?.id,
      lessonId: suggestedPpctItem?.id,
      academicYear: teacher.academicYear || '2026-2027',
      semester: teacher.semester || 'Học kỳ I',
      weekNumber: currentWeek,
      dayOfWeek: dayOfWeek,
      session: session === 'sáng' ? 'Sáng' : 'Chiều',
      period: subPeriod,
      className: selectedClass,
      subject: selectedSubject,
      subjectName: selectedSubject,
      grade: currentGrade,
      ppctPeriod: ppctPeriod || undefined,
      lessonTitle: lessonTitle || `Tiết ${ppctPeriod}`,
      topic: suggestedPpctItem?.topic,
      requirements: suggestedPpctItem?.requirements,
      notes: notes.trim() || undefined,
      status: 'unprepared',
      generatedFromTKB: false,
      source: 'manual',
      updatedAt: new Date().toISOString(),
    };

    onSave(newItem);
    setToastMessage('✅ Đã thêm tiết dạy vào Lịch báo giảng.');
    setTimeout(() => {
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden transition-all">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
              THÊM TIẾT DẠY
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          
          {/* Field 1: Thứ / Ngày */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Thứ / Ngày
            </label>
            <select
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(e.target.value as any)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {DAYS_LIST.map((day) => {
                const dateStr = getWeekDayDate(currentWeek, day, teacher.academicYear || '2026-2027');
                return (
                  <option key={day} value={day}>
                    {day} - {dateStr}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Field 2 & 3: Buổi & Tiết */}
          <div className="grid grid-cols-2 gap-3">
            {/* Buổi */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Buổi
              </label>
              <select
                value={session}
                onChange={(e) => {
                  const newSession = e.target.value as 'sáng' | 'chiều';
                  setSession(newSession);
                  if (newSession === 'chiều' && subPeriod > 3) {
                    setSubPeriod(1);
                  }
                }}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="sáng">Sáng</option>
                <option value="chiều">Chiều</option>
              </select>
            </div>

            {/* Tiết */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Tiết
              </label>
              <select
                value={subPeriod}
                onChange={(e) => setSubPeriod(parseInt(e.target.value, 10))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {session === 'sáng' ? (
                  <>
                    <option value={1}>Tiết 1</option>
                    <option value={2}>Tiết 2</option>
                    <option value={3}>Tiết 3</option>
                    <option value={4}>Tiết 4</option>
                  </>
                ) : (
                  <>
                    <option value={1}>Tiết 1</option>
                    <option value={2}>Tiết 2</option>
                    <option value={3}>Tiết 3</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* TKB Relation Banner */}
          {tkbSlot ? (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800 rounded-xl text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center justify-between shadow-2xs">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Theo TKB: Lớp <strong className="font-black underline">{tkbSlot.className}</strong> – Môn <strong className="font-black underline">{tkbSlot.subject}</strong></span>
              </span>
              <span className="text-[10px] bg-emerald-200/60 dark:bg-emerald-900/60 px-2 py-0.5 rounded-md uppercase font-extrabold text-emerald-900 dark:text-emerald-200 shrink-0">
                Đã liên kết TKB
              </span>
            </div>
          ) : (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800 rounded-xl text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5 shadow-2xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Chưa có tiết dạy trong thời khóa biểu ở thời điểm này.</span>
            </div>
          )}

          {/* Field 4 & 5: Môn học & Lớp */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Môn học *
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-blue-500/40 rounded-xl text-xs font-extrabold text-blue-700 dark:text-blue-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {availableSubjects.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Lớp *
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {classList.map((cls) => (
                  <option key={cls} value={cls}>
                    Lớp {cls}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Field 5 & 6: Tiết PPCT & Tên bài dạy */}
          <div className="space-y-2 p-3 bg-blue-50/60 dark:bg-blue-950/30 rounded-xl border border-blue-200/80 dark:border-blue-900/60">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-extrabold text-blue-900 dark:text-blue-300">
                Tiết PPCT & Tên bài dạy
              </label>
              <button
                type="button"
                onClick={() => setIsLessonPickerOpen(true)}
                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1 shadow-2xs"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>📚 Chọn bài dạy</span>
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <div className="col-span-1">
                <span className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">Tiết PPCT</span>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={ppctPeriod}
                  onChange={(e) => setPpctPeriod(parseInt(e.target.value, 10) || 1)}
                  className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-extrabold text-blue-600 dark:text-blue-400 text-center"
                />
              </div>

              <div className="col-span-3">
                <span className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">Tên bài dạy</span>
                <input
                  type="text"
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  placeholder="Nhập hoặc chọn tên bài dạy..."
                  className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Field 7: Ghi chú */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Ghi chú
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Nhập ghi chú nếu cần (dạy bù, nghỉ lễ, kiểm tra...)"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Validation Warnings */}
          {isDuplicatePeriod && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 rounded-xl flex items-start gap-2 text-xs font-bold text-amber-900 dark:text-amber-200">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <span>⚠️ Tiết dạy này đã tồn tại trong Lịch báo giảng.</span>
            </div>
          )}

          {!isDuplicatePeriod && isPpctMismatch && (
            <div className="p-2.5 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900/60 rounded-xl flex items-center gap-2 text-xs font-semibold text-sky-800 dark:text-sky-200">
              <Info className="w-4 h-4 shrink-0 text-sky-600 dark:text-sky-400" />
              <span>ℹ️ Bài này khác với tiến độ PPCT hiện tại.</span>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Tự động lưu</span>
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSaveLesson}
              disabled={isDuplicatePeriod}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5 ${
                isDuplicatePeriod
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed dark:bg-slate-700 dark:text-slate-500'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>Lưu tiết dạy</span>
            </button>
          </div>
        </div>

      </div>

      {/* Sub-modal: "📚 Chọn bài dạy từ PPCT" */}
      {isLessonPickerOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2.5">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span>CHỌN BÀI DẠY TỪ PPCT ({selectedSubject} - {currentGrade})</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsLessonPickerOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={pickerSearchQuery}
                onChange={(e) => setPickerSearchQuery(e.target.value)}
                placeholder="Tìm bài học..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Lessons List */}
            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
              {filteredPpctItems.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">Không tìm thấy bài học phù hợp</p>
              ) : (
                filteredPpctItems.map((item) => (
                  <button
                    key={item.id || item.periodNumber}
                    type="button"
                    onClick={() => handleSelectPpctItemFromPicker(item)}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/50 border border-slate-100 dark:border-slate-700/60 transition-colors group"
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                        Tiết PPCT {item.periodNumber} (Tuần {item.week})
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-700 dark:group-hover:text-blue-300">
                      {item.title}
                    </p>
                  </button>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex justify-end">
              <button
                type="button"
                onClick={() => setIsLessonPickerOpen(false)}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-70 bg-emerald-900 text-emerald-100 px-4 py-3 rounded-xl shadow-2xl border border-emerald-700 text-xs font-bold flex items-center gap-2 animate-bounceIn">
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
};
