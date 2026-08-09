import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { ScheduleView } from './components/ScheduleView';
import { PPCTView } from './components/PPCTView';
import { StatsView } from './components/StatsView';
import { ExportView } from './components/ExportView';
import { SettingsView } from './components/SettingsView';
import { TimetableView } from './components/TimetableView';
import { Footer } from './components/Footer';
import { RescheduleModal } from './components/RescheduleModal';
import { LessonDrawer } from './components/LessonDrawer';
import { TeacherProfile, ScheduleItem, PPCTCurriculum, SharedCurriculum, ClassTimetableRule, LessonStatus, PrintSettings, DEFAULT_PRINT_SETTINGS } from './types';
import { PREDEFINED_PPCTS } from './data/primaryCurriculums';
import { 
  auth, 
  signInWithGoogle, 
  logoutUser,
  saveTeacherProfileToFirestore,
  fetchTeacherProfileFromFirestore,
  savePPCTsToFirestore,
  fetchPPCTsFromFirestore,
  saveSchedulesToFirestore,
  fetchSchedulesFromFirestore,
  saveCustomWeekDatesToFirestore,
  fetchCustomWeekDatesFromFirestore,
  savePrintSettingsToFirestore,
  fetchPrintSettingsFromFirestore,
  syncUserRoleOnLogin
} from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

import { loadCustomWeekDatesMap, saveCustomWeekDatesMap } from './utils/dateWeekUtils';

// Helper to create default teacher profile
const DEFAULT_TEACHER: TeacherProfile = {
  uid: 'gv-demo-01',
  fullName: 'Hồng Bích Trâm',
  email: 'hongbichtram13@gmail.com',
  schoolName: 'Trường Tiểu học Nguyễn Du',
  teacherCode: 'GV-2024-88',
  subjects: ['Tin học', 'Toán'],
  grades: ['Khối 3', 'Khối 4', 'Khối 5'],
  assignedClasses: ['3A1', '3A2', '3A3', '4A1', '4A2', '4A3', '5A1', '5A2', '5A3'],
  academicYear: '2024 - 2025',
  semester: 'Học kỳ I',
};

// Initial default timetable rules
const DEFAULT_RULES: ClassTimetableRule[] = [
  { id: 'r1', className: '4A1', grade: 'Khối 4', subject: 'Tin học', dayOfWeek: 'Thứ 2', period: 2 },
  { id: 'r2', className: '4A2', grade: 'Khối 4', subject: 'Tin học', dayOfWeek: 'Thứ 2', period: 3 },
  { id: 'r3', className: '3A1', grade: 'Khối 3', subject: 'Tin học', dayOfWeek: 'Thứ 3', period: 1 },
  { id: 'r4', className: '3A2', grade: 'Khối 3', subject: 'Tin học', dayOfWeek: 'Thứ 3', period: 2 },
  { id: 'r5', className: '4A1', grade: 'Khối 4', subject: 'Tin học', dayOfWeek: 'Thứ 4', period: 6 },
  { id: 'r6', className: '4A3', grade: 'Khối 4', subject: 'Tin học', dayOfWeek: 'Thứ 5', period: 1 },
  { id: 'r7', className: '5A1', grade: 'Khối 5', subject: 'Tin học', dayOfWeek: 'Thứ 5', period: 2 },
  { id: 'r8', className: '4A2', grade: 'Khối 4', subject: 'Toán', dayOfWeek: 'Thứ 6', period: 1 },
];

// Generate initial seed schedules if empty
function generateInitialSchedules(): ScheduleItem[] {
  const items: ScheduleItem[] = [];
  const days: Array<'Thứ 2' | 'Thứ 3' | 'Thứ 4' | 'Thứ 5' | 'Thứ 6'> = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6'];
  
  // Find Tin học 4 PPCT items
  const th4 = PREDEFINED_PPCTS.find(p => p.grade === 'Khối 4' && p.subject === 'Tin học');
  const th3 = PREDEFINED_PPCTS.find(p => p.grade === 'Khối 3' && p.subject === 'Tin học');

  for (let w = 1; w <= 35; w++) {
    // 4A1 Tin học
    const ppct4 = th4?.items.find(i => i.week === w) || {
      periodNumber: w,
      title: `Bài ${w}: Học tốt môn Tin học Lớp 4 (Tuần ${w})`,
      topic: 'Chủ đề: Ứng dụng tin học',
      requirements: 'Đạt kiến thức chuẩn GDPT 2018'
    };

    const ppct3 = th3?.items.find(i => i.week === w) || {
      periodNumber: w,
      title: `Bài ${w}: Khám phá thế giới số Lớp 3 (Tuần ${w})`,
      topic: 'Chủ đề: Máy tính và em',
      requirements: 'Rèn luyện kỹ năng cơ bản'
    };

    items.push({
      id: `s-4a1-w${w}`,
      teacherId: DEFAULT_TEACHER.uid,
      academicYear: '2024 - 2025',
      semester: 'Học kỳ I',
      weekNumber: w,
      dayOfWeek: 'Thứ 2',
      period: 2,
      className: '4A1',
      subject: 'Tin học',
      grade: 'Khối 4',
      lessonTitle: ppct4.title,
      topic: ppct4.topic,
      ppctPeriod: ppct4.periodNumber,
      status: w < 10 ? 'completed' : w === 10 ? 'preparing' : 'unprepared',
      objectives: 'Giúp học sinh nắm vững khái niệm và thao tác thực hành.',
      requirements: ppct4.requirements,
      methods: 'Trực quan, thực hành nhóm, trò chơi học tập',
      equipment: 'Máy tính, máy chiếu, bài giảng điện tử',
      notes: 'Học sinh hăng hái phát biểu.',
      updatedAt: new Date().toISOString()
    });

    items.push({
      id: `s-4a2-w${w}`,
      teacherId: DEFAULT_TEACHER.uid,
      academicYear: '2024 - 2025',
      semester: 'Học kỳ I',
      weekNumber: w,
      dayOfWeek: 'Thứ 2',
      period: 3,
      className: '4A2',
      subject: 'Tin học',
      grade: 'Khối 4',
      lessonTitle: ppct4.title,
      topic: ppct4.topic,
      ppctPeriod: ppct4.periodNumber,
      status: w < 10 ? 'completed' : w === 10 ? 'preparing' : 'unprepared',
      requirements: ppct4.requirements,
      updatedAt: new Date().toISOString()
    });

    items.push({
      id: `s-3a1-w${w}`,
      teacherId: DEFAULT_TEACHER.uid,
      academicYear: '2024 - 2025',
      semester: 'Học kỳ I',
      weekNumber: w,
      dayOfWeek: 'Thứ 3',
      period: 1,
      className: '3A1',
      subject: 'Tin học',
      grade: 'Khối 3',
      lessonTitle: ppct3.title,
      topic: ppct3.topic,
      ppctPeriod: ppct3.periodNumber,
      status: w < 10 ? 'completed' : 'unprepared',
      requirements: ppct3.requirements,
      updatedAt: new Date().toISOString()
    });

    items.push({
      id: `s-3a2-w${w}`,
      teacherId: DEFAULT_TEACHER.uid,
      academicYear: '2024 - 2025',
      semester: 'Học kỳ I',
      weekNumber: w,
      dayOfWeek: 'Thứ 3',
      period: 2,
      className: '3A2',
      subject: 'Tin học',
      grade: 'Khối 3',
      lessonTitle: ppct3.title,
      topic: ppct3.topic,
      ppctPeriod: ppct3.periodNumber,
      status: w < 10 ? 'completed' : 'unprepared',
      requirements: ppct3.requirements,
      updatedAt: new Date().toISOString()
    });

    items.push({
      id: `s-4a3-w${w}`,
      teacherId: DEFAULT_TEACHER.uid,
      academicYear: '2024 - 2025',
      semester: 'Học kỳ I',
      weekNumber: w,
      dayOfWeek: 'Thứ 5',
      period: 1,
      className: '4A3',
      subject: 'Tin học',
      grade: 'Khối 4',
      lessonTitle: ppct4.title,
      topic: ppct4.topic,
      ppctPeriod: ppct4.periodNumber,
      status: w < 10 ? 'completed' : 'unprepared',
      requirements: ppct4.requirements,
      updatedAt: new Date().toISOString()
    });
  }

  return items;
}

// Utility to guarantee unique IDs across schedule items
function ensureUniqueScheduleIds(items: ScheduleItem[]): ScheduleItem[] {
  const seenIds = new Set<string>();
  return items.map((item, idx) => {
    let uniqueId = item.id;
    if (!uniqueId || seenIds.has(uniqueId)) {
      const dayClean = (item.dayOfWeek || 'day').replace(/\s+/g, '');
      uniqueId = `${item.id || 'item'}-${dayClean}-p${item.period || 0}-${idx}`;
    }
    seenIds.add(uniqueId);
    if (uniqueId !== item.id) {
      return { ...item, id: uniqueId };
    }
    return item;
  });
}

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [currentWeek, setCurrentWeek] = useState<number>(10);
  const [teacher, setTeacher] = useState<TeacherProfile>(() => {
    const saved = localStorage.getItem('smart_schedule_teacher');
    return saved ? JSON.parse(saved) : DEFAULT_TEACHER;
  });

  const [schedules, setSchedules] = useState<ScheduleItem[]>(() => {
    const saved = localStorage.getItem('smart_schedule_items');
    const items = saved ? JSON.parse(saved) : generateInitialSchedules();
    return ensureUniqueScheduleIds(items);
  });

  // History stack for Undo/Redo
  const [history, setHistory] = useState<ScheduleItem[][]>([]);
  const [redoStack, setRedoStack] = useState<ScheduleItem[][]>([]);

  const [curriculums, setCurriculums] = useState<PPCTCurriculum[]>(() => {
    const saved = localStorage.getItem('smart_schedule_ppcts');
    if (saved) return JSON.parse(saved);
    return PREDEFINED_PPCTS.map((p, idx) => ({
      id: `ppct-${idx}`,
      teacherId: DEFAULT_TEACHER.uid,
      grade: p.grade,
      subject: p.subject,
      textbook: p.textbook,
      academicYear: '2024 - 2025',
      semester: 'Học kỳ I',
      items: p.items,
      updatedAt: new Date().toISOString()
    }));
  });

  const [timetableRules, setTimetableRules] = useState<ClassTimetableRule[]>(() => {
    const saved = localStorage.getItem('smart_schedule_rules');
    return saved ? JSON.parse(saved) : DEFAULT_RULES;
  });

  const [printSettings, setPrintSettings] = useState<PrintSettings>(() => {
    const saved = localStorage.getItem('smart_schedule_print_settings');
    return saved ? JSON.parse(saved) : DEFAULT_PRINT_SETTINGS;
  });

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('smart_schedule_theme') === 'dark' ||
      window.matchMedia('(prefers-color-scheme: dark)').matches;
  });


  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'idle'>('saved');
  const [authUser, setAuthUser] = useState<any>(null);

  // Modals & Drawers state
  const [selectedLessonForDrawer, setSelectedLessonForDrawer] = useState<ScheduleItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedLessonForReschedule, setSelectedLessonForReschedule] = useState<ScheduleItem | null>(null);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);

  // Sync Dark Mode Class to HTML tag
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('smart_schedule_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('smart_schedule_theme', 'light');
    }
  }, [darkMode]);

  // Auth Listener & Firestore Data Sync
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthUser(user);
      if (user) {
        setAutoSaveStatus('saving');
        try {
          // Sync user role and status in users/{uid} collection
          await syncUserRoleOnLogin(user);

          // Fetch existing user data from Firestore
          const [fsTeacherData, fsPPCTs, fsSchedules, fsCustomDates, fsPrintSettings] = await Promise.all([
            fetchTeacherProfileFromFirestore(user.uid),
            fetchPPCTsFromFirestore(user.uid),
            fetchSchedulesFromFirestore(user.uid),
            fetchCustomWeekDatesFromFirestore(user.uid),
            fetchPrintSettingsFromFirestore(user.uid),
          ]);

          const hasRemoteData = !!(fsTeacherData.profile || fsPPCTs || fsSchedules || fsCustomDates || fsPrintSettings);

          if (hasRemoteData) {
            // Firestore has existing data for this teacher -> load remote state
            if (fsTeacherData.profile) {
              setTeacher(fsTeacherData.profile);
              localStorage.setItem('smart_schedule_teacher', JSON.stringify(fsTeacherData.profile));
            }
            if (fsTeacherData.rules) {
              setTimetableRules(fsTeacherData.rules);
              localStorage.setItem('smart_schedule_rules', JSON.stringify(fsTeacherData.rules));
            }
            if (fsPPCTs) {
              setCurriculums(fsPPCTs);
              localStorage.setItem('smart_schedule_ppcts', JSON.stringify(fsPPCTs));
            }
            if (fsSchedules) {
              const sanitized = ensureUniqueScheduleIds(fsSchedules);
              setSchedules(sanitized);
              localStorage.setItem('smart_schedule_items', JSON.stringify(sanitized));
            }
            if (fsCustomDates) {
              saveCustomWeekDatesMap(fsCustomDates);
            }
            if (fsPrintSettings) {
              setPrintSettings(fsPrintSettings);
              localStorage.setItem('smart_schedule_print_settings', JSON.stringify(fsPrintSettings));
            }
          } else {
            // First time login for this teacher on Cloud -> migrate local data to Firestore
            const updatedProfile: TeacherProfile = {
              ...teacher,
              uid: user.uid,
              fullName: user.displayName || teacher.fullName,
              email: user.email || teacher.email,
              avatarUrl: user.photoURL || teacher.avatarUrl,
            };
            setTeacher(updatedProfile);
            localStorage.setItem('smart_schedule_teacher', JSON.stringify(updatedProfile));

            const localCustomDates = loadCustomWeekDatesMap();

            await Promise.all([
              saveTeacherProfileToFirestore(user.uid, updatedProfile, timetableRules),
              savePPCTsToFirestore(user.uid, curriculums),
              saveSchedulesToFirestore(user.uid, schedules),
              saveCustomWeekDatesToFirestore(user.uid, localCustomDates),
              savePrintSettingsToFirestore(user.uid, printSettings),
            ]);
          }

        } catch (err) {
          console.error('Failed to sync Firestore data on login:', err);
        } finally {
          setAutoSaveStatus('saved');
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Save schedules to LocalStorage & Firestore with Auto-save indicator
  const updateSchedulesWithHistory = (newSchedules: ScheduleItem[]) => {
    const sanitized = ensureUniqueScheduleIds(newSchedules);
    setAutoSaveStatus('saving');
    setHistory(prev => [...prev, schedules]);
    setRedoStack([]);
    setSchedules(sanitized);
    localStorage.setItem('smart_schedule_items', JSON.stringify(sanitized));
    if (authUser?.uid) {
      saveSchedulesToFirestore(authUser.uid, sanitized);
    } else {
      console.warn('SAVE SCHEDULE SKIPPED: User is not logged in (authUser is null). Log in to save to Cloud Firestore.');
    }
    setTimeout(() => {
      setAutoSaveStatus('saved');
    }, 400);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setRedoStack(prev => [schedules, ...prev]);
    setHistory(prev => prev.slice(0, -1));
    setSchedules(previous);
    localStorage.setItem('smart_schedule_items', JSON.stringify(previous));
    if (authUser?.uid) {
      saveSchedulesToFirestore(authUser.uid, previous);
    }
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[0];
    setHistory(prev => [...prev, schedules]);
    setRedoStack(prev => prev.slice(1));
    setSchedules(next);
    localStorage.setItem('smart_schedule_items', JSON.stringify(next));
    if (authUser?.uid) {
      saveSchedulesToFirestore(authUser.uid, next);
    }
  };

  // Schedule Action Handlers
  const handleSelectLesson = (item: ScheduleItem) => {
    setSelectedLessonForDrawer(item);
    setIsDrawerOpen(true);
  };

  const handleSaveLessonDrawer = (updatedItem: ScheduleItem) => {
    const updated = schedules.map(s => s.id === updatedItem.id ? updatedItem : s);
    updateSchedulesWithHistory(updated);
  };

  const handleStatusChange = (id: string, newStatus: LessonStatus) => {
    const updated = schedules.map(s => s.id === id ? { ...s, status: newStatus, updatedAt: new Date().toISOString() } : s);
    updateSchedulesWithHistory(updated);
  };

  const handleAddScheduleItem = (newItem: ScheduleItem) => {
    updateSchedulesWithHistory([...schedules, newItem]);
  };

  const handleDeleteScheduleItem = (itemId: string) => {
    const updated = schedules.filter(s => s.id !== itemId);
    updateSchedulesWithHistory(updated);
  };

  const handleAddLesson = (dayOfWeek: 'Thứ 2' | 'Thứ 3' | 'Thứ 4' | 'Thứ 5' | 'Thứ 6', period: number) => {
    const newItem: ScheduleItem = {
      id: `s-custom-${Date.now()}`,
      teacherId: teacher.uid,
      academicYear: teacher.academicYear,
      semester: teacher.semester,
      weekNumber: currentWeek,
      dayOfWeek,
      period,
      className: '4A1',
      subject: 'Tin học',
      grade: 'Khối 4',
      lessonTitle: 'Bài học mới bổ sung',
      status: 'unprepared',
      updatedAt: new Date().toISOString(),
    };
    updateSchedulesWithHistory([...schedules, newItem]);
  };

  const handleOpenRescheduleModal = (item: ScheduleItem) => {
    setSelectedLessonForReschedule(item);
    setIsRescheduleOpen(true);
  };

  const handleConfirmReschedule = (rescheduledItem: ScheduleItem, shiftAll: boolean) => {
    if (!shiftAll) {
      // Simple item update
      const updated = schedules.map(s => s.id === rescheduledItem.id ? rescheduledItem : s);
      updateSchedulesWithHistory(updated);
    } else {
      // Shift PPCT periods forward for subsequent weeks of this class
      const targetClass = rescheduledItem.className;
      const targetSubject = rescheduledItem.subject;
      const startWeek = rescheduledItem.weekNumber;

      const updated = schedules.map(s => {
        if (s.className === targetClass && s.subject === targetSubject && s.weekNumber >= startWeek) {
          if (s.id === rescheduledItem.id) {
            return rescheduledItem;
          }
          // Shift PPCT period forward by 1
          const shiftedPpct = (s.ppctPeriod || 0) + 1;
          return {
            ...s,
            ppctPeriod: shiftedPpct,
            updatedAt: new Date().toISOString()
          };
        }
        return s;
      });
      updateSchedulesWithHistory(updated);
    }
    setIsRescheduleOpen(false);
  };

  // Print Settings Handler
  const handleSavePrintSettings = async (newSettings: PrintSettings) => {
    setPrintSettings(newSettings);
    localStorage.setItem('smart_schedule_print_settings', JSON.stringify(newSettings));
    if (authUser?.uid) {
      setAutoSaveStatus('saving');
      try {
        await savePrintSettingsToFirestore(authUser.uid, newSettings);
      } catch (err) {
        console.error('Failed to save print settings to Firestore:', err);
      } finally {
        setAutoSaveStatus('saved');
      }
    }
  };

  // PPCT Handlers

  const handleSaveCurriculum = (updatedCurriculum: PPCTCurriculum) => {
    const existingIdx = curriculums.findIndex(
      c => c.id === updatedCurriculum.id || (c.grade === updatedCurriculum.grade && c.subject === updatedCurriculum.subject)
    );
    let updated: PPCTCurriculum[];
    if (existingIdx >= 0) {
      updated = [...curriculums];
      updated[existingIdx] = updatedCurriculum;
    } else {
      updated = [...curriculums, updatedCurriculum];
    }
    setCurriculums(updated);
    localStorage.setItem('smart_schedule_ppcts', JSON.stringify(updated));
    if (authUser?.uid) {
      savePPCTsToFirestore(authUser.uid, updated);
    } else {
      console.warn('SAVE PPCT SKIPPED: User is not logged in (authUser is null). Log in to save to Cloud Firestore.');
    }
  };

  const handleDeleteCurriculum = (id: string) => {
    const updated = curriculums.filter(c => c.id !== id);
    setCurriculums(updated);
    localStorage.setItem('smart_schedule_ppcts', JSON.stringify(updated));
    if (authUser?.uid) {
      savePPCTsToFirestore(authUser.uid, updated);
    }
  };

  const handleSyncPPCTToSchedule = (curriculum: PPCTCurriculum | SharedCurriculum) => {
    // Map items in schedule matching grade and subject to PPCT lessons
    const updated = schedules.map(s => {
      if (s.grade === curriculum.grade && s.subject === curriculum.subject) {
        const matchingItem = curriculum.items.find(i => i.week === s.weekNumber);
        if (matchingItem) {
          return {
            ...s,
            curriculumId: curriculum.id,
            lessonId: matchingItem.id,
            lessonTitle: matchingItem.title,
            topic: matchingItem.topic,
            ppctPeriod: matchingItem.periodNumber,
            requirements: matchingItem.requirements,
            updatedAt: new Date().toISOString(),
          };
        }
      }
      return s;
    });
    updateSchedulesWithHistory(updated);
  };

  // Auto Generate Schedule from Timetable Rules + Curriculums
  const handleAutoGenerateSchedule = () => {
    if (timetableRules.length === 0) return;
    const newItems: ScheduleItem[] = [];

    for (let w = 1; w <= 35; w++) {
      timetableRules.forEach((rule, idx) => {
        const curr = curriculums.find(c => c.grade === rule.grade && c.subject === rule.subject);
        const ppctItem = curr?.items.find(i => i.week === w);
        const dayClean = (rule.dayOfWeek || 'day').replace(/\s+/g, '');
        const ruleIdPart = rule.id || `${rule.className}-${rule.subject}-${idx}`;

        newItems.push({
          id: `gen-${ruleIdPart}-${dayClean}-p${rule.period}-w${w}`,
          teacherId: teacher.uid,
          curriculumId: curr?.id,
          lessonId: ppctItem?.id,
          academicYear: teacher.academicYear,
          semester: teacher.semester,
          weekNumber: w,
          dayOfWeek: rule.dayOfWeek,
          period: rule.period,
          className: rule.className,
          subject: rule.subject,
          grade: rule.grade,
          lessonTitle: ppctItem ? ppctItem.title : `Bài học Tuần ${w} môn ${rule.subject}`,
          topic: ppctItem?.topic,
          ppctPeriod: ppctItem ? ppctItem.periodNumber : w,
          status: w < currentWeek ? 'completed' : w === currentWeek ? 'preparing' : 'unprepared',
          requirements: ppctItem?.requirements,
          updatedAt: new Date().toISOString(),
        });
      });
    }

    updateSchedulesWithHistory(newItems);
  };

  // Settings Handlers
  const handleSaveProfile = async (newProfile: TeacherProfile) => {
    setTeacher(newProfile);
    localStorage.setItem('smart_schedule_teacher', JSON.stringify(newProfile));
    const uid = authUser?.uid || newProfile.uid;
    console.log('SETTINGS SUBJECT SAVE', {
      UID: uid || 'no-uid',
      DATA: newProfile.subjects || [],
    });
    if (uid) {
      try {
        await saveTeacherProfileToFirestore(uid, newProfile, timetableRules);
        console.log('SETTINGS SUBJECT SAVE SUCCESS');
      } catch (err: any) {
        console.error('SETTINGS SUBJECT SAVE ERROR', {
          'ERROR CODE': err?.code || 'unknown',
          'ERROR MESSAGE': err?.message || String(err),
        });
      }
    } else {
      console.log('SETTINGS SUBJECT SAVE SUCCESS (Local storage)');
    }
  };

  const handleSaveTimetableRules = (newRules: ClassTimetableRule[]) => {
    setTimetableRules(newRules);
    localStorage.setItem('smart_schedule_rules', JSON.stringify(newRules));
    if (authUser?.uid) {
      saveTeacherProfileToFirestore(authUser.uid, teacher, newRules);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] text-slate-800 dark:text-slate-100 font-sans transition-colors duration-200 flex flex-col">
      {/* Header Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        teacher={teacher}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        autoSaveStatus={autoSaveStatus}
        user={authUser}
        onLogin={signInWithGoogle}
        onLogout={logoutUser}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'dashboard' && (
          <DashboardView
            teacher={teacher}
            schedules={schedules}
            currentWeek={currentWeek}
            setCurrentWeek={setCurrentWeek}
            onNavigate={setCurrentTab}
            onSelectLesson={handleSelectLesson}
          />
        )}

        {currentTab === 'schedule' && (
          <ScheduleView
            teacher={teacher}
            schedules={schedules}
            curriculums={curriculums}
            teacherAssignedClasses={teacher.assignedClasses}
            currentWeek={currentWeek}
            printSettings={printSettings}
            setCurrentWeek={setCurrentWeek}
            onSelectLesson={handleSelectLesson}
            onAddLesson={handleAddLesson}
            onAddScheduleItem={handleAddScheduleItem}
            onStatusChange={handleStatusChange}
            onOpenRescheduleModal={handleOpenRescheduleModal}
            onUpdateScheduleItem={handleSaveLessonDrawer}
            onDeleteScheduleItem={handleDeleteScheduleItem}
            canUndo={history.length > 0}
            canRedo={redoStack.length > 0}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onNavigate={setCurrentTab}
          />
        )}


        {currentTab === 'ppct' && (
          <PPCTView
            teacher={teacher}
            schedules={schedules}
            curriculums={curriculums}
            onSaveCurriculum={handleSaveCurriculum}
            onSyncToSchedule={handleSyncPPCTToSchedule}
            onDeleteCurriculum={handleDeleteCurriculum}
          />
        )}

        {currentTab === 'timetable' && (
          <TimetableView
            teacher={teacher}
            timetableRules={timetableRules}
            onSaveProfile={handleSaveProfile}
            onSaveTimetableRules={handleSaveTimetableRules}
            onAutoGenerateSchedule={handleAutoGenerateSchedule}
          />
        )}

        {currentTab === 'stats' && (
          <StatsView
            schedules={schedules}
            currentWeek={currentWeek}
          />
        )}

        {currentTab === 'export' && (
          <ExportView
            teacher={teacher}
            schedules={schedules}
            currentWeek={currentWeek}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsView
            teacher={teacher}
            timetableRules={timetableRules}
            printSettings={printSettings}
            onSaveProfile={handleSaveProfile}
            onSaveTimetableRules={handleSaveTimetableRules}
            onSavePrintSettings={handleSavePrintSettings}
            onAutoGenerateSchedule={handleAutoGenerateSchedule}
          />
        )}

      </main>

      {/* Global Footer */}
      <Footer />

      {/* Reschedule Shift Modal */}
      <RescheduleModal
        item={selectedLessonForReschedule}
        isOpen={isRescheduleOpen}
        onClose={() => setIsRescheduleOpen(false)}
        onConfirmReschedule={handleConfirmReschedule}
      />

      {/* Lesson Details Drawer */}
      <LessonDrawer
        item={selectedLessonForDrawer}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSave={handleSaveLessonDrawer}
      />
    </div>
  );
}
