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
import { AdminLayout } from './components/admin/AdminLayout';
import { TeacherProfile, ScheduleItem, PPCTCurriculum, SharedCurriculum, ClassTimetableRule, TimetableVersion, LessonStatus, PrintSettings, DEFAULT_PRINT_SETTINGS, AcademicYearConfig, AppUser, SystemConfig } from './types';
import { isConfiguredAdminUid } from './config/adminConfig';
import { fetchSystemConfig } from './services/adminService';
import { SystemAnnouncementBanner } from './components/SystemAnnouncementBanner';
import { LoginScreen } from './components/auth/LoginScreen';
import { Ban, ShieldAlert, LogOut as LogOutIcon, Loader2, Calendar } from 'lucide-react';
import { PREDEFINED_PPCTS } from './data/primaryCurriculums';
import { 
  auth, 
  signInWithGoogle, 
  logoutUser,
  saveTeacherProfileToFirestore,
  fetchTeacherProfileFromFirestore,
  fetchTimetableVersionsFromFirestore,
  saveOrSplitTimetableVersionInFirestore,
  savePPCTsToFirestore,
  fetchPPCTsFromFirestore,
  saveSchedulesToFirestore,
  fetchSchedulesFromFirestore,
  saveCustomWeekDatesToFirestore,
  fetchCustomWeekDatesFromFirestore,
  savePrintSettingsToFirestore,
  fetchPrintSettingsFromFirestore,
  saveAcademicYearConfigToFirestore,
  fetchAcademicYearConfigFromFirestore,
  deleteTimetableVersionFromFirestore,
  syncUserRoleOnLogin
} from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

import { loadCustomWeekDatesMap, saveCustomWeekDatesMap, normalizeAcademicYear } from './utils/dateWeekUtils';
import { getTimetableVersionForWeek } from './utils/timetableUtils';
import { getNormalizedSession, getNormalizedPeriod } from './utils/classUtils';

// Helper to create default teacher profile
const DEFAULT_TEACHER: TeacherProfile = {
  uid: 'gv-demo-01',
  fullName: 'Hồng Bích Trâm',
  email: 'hongbichtram13@gmail.com',
  schoolName: 'Trường Tiểu học Nguyễn Du',
  teacherCode: 'GV-2024-88',
  subjects: ['Tin học'],
  grades: ['Khối 3', 'Khối 4', 'Khối 5'],
  assignedClasses: ['3A1', '3A2', '3A3', '4A1', '4A2', '4A3', '5A1', '5A2', '5A3'],
  academicYear: '2026 - 2027',
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
];

// Generate initial seed schedules matching teacher's registered subjects and active TimetableVersions
function generateInitialSchedules(): ScheduleItem[] {
  return [];
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
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return ensureUniqueScheduleIds(parsed);
        }
      } catch (e) {
        // ignore
      }
    }
    return [];
  });

  // History stack for Undo/Redo
  const [history, setHistory] = useState<ScheduleItem[][]>([]);
  const [redoStack, setRedoStack] = useState<ScheduleItem[][]>([]);
  const isHydratingRef = useRef<boolean>(true);
  const dataReadyRef = useRef<boolean>(false);

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

  const [timetableVersions, setTimetableVersions] = useState<TimetableVersion[]>(() => {
    const saved = localStorage.getItem('smart_schedule_timetable_versions');
    return saved ? JSON.parse(saved) : [];
  });

  const [printSettings, setPrintSettings] = useState<PrintSettings>(() => {
    const saved = localStorage.getItem('smart_schedule_print_settings');
    return saved ? JSON.parse(saved) : DEFAULT_PRINT_SETTINGS;
  });

  const [academicYearConfig, setAcademicYearConfig] = useState<AcademicYearConfig>(() => {
    const saved = localStorage.getItem('smart_schedule_academic_year_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return {
      academicYear: '2026-2027',
      week1StartDate: '2026-09-01',
      totalWeeks: 35
    };
  });

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('smart_schedule_theme') === 'dark' ||
      window.matchMedia('(prefers-color-scheme: dark)').matches;
  });


  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'idle'>('saved');
  const [authUser, setAuthUser] = useState<any>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [dataReady, setDataReady] = useState<boolean>(false);
  const [systemConfig, setSystemConfig] = useState<SystemConfig | null>(null);

  // Load system config on mount and tab switch
  useEffect(() => {
    fetchSystemConfig().then(cfg => {
      setSystemConfig(cfg);
    }).catch(err => console.warn('Could not load system config:', err));
  }, [currentTab]);

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
    let isCancelled = false;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthUser(user);
      if (user) {
        console.log(`[AUTH] USER READY uid=${user.uid}`);
        console.log(`[HYDRATION] START uid=${user.uid}`);
        isHydratingRef.current = true;
        dataReadyRef.current = false;
        setDataReady(false);
        setAuthLoading(true);
        setAutoSaveStatus('saving');
        try {
          // Sync user role and status in users/{uid} collection
          const syncedUser = await syncUserRoleOnLogin(user);
          if (isCancelled) return;
          setAppUser(syncedUser);

          // Fetch existing user data from Firestore
          const year = teacher.academicYear || '2026-2027';
          const [fsTeacherData, fsVersions, fsPPCTs, fsSchedulesResult, fsCustomDates, fsPrintSettings, fsConfig] = await Promise.all([
            fetchTeacherProfileFromFirestore(user.uid),
            fetchTimetableVersionsFromFirestore(user.uid),
            fetchPPCTsFromFirestore(user.uid),
            fetchSchedulesFromFirestore(user.uid),
            fetchCustomWeekDatesFromFirestore(user.uid),
            fetchPrintSettingsFromFirestore(user.uid),
            fetchAcademicYearConfigFromFirestore(user.uid, year),
          ]);

          if (isCancelled) return;

          let activeTeacher: TeacherProfile = teacher;
          let activeRules: ClassTimetableRule[] = timetableRules;
          let activeVersions: TimetableVersion[] = timetableVersions;

          // Load profile, config, rules, versions, ppcts
          if (fsTeacherData.profile) {
            activeTeacher = { ...fsTeacherData.profile, uid: user.uid };
            setTeacher(activeTeacher);
            localStorage.setItem('smart_schedule_teacher', JSON.stringify(activeTeacher));
          }
          if (fsConfig) {
            setAcademicYearConfig(fsConfig);
            localStorage.setItem('smart_schedule_academic_year_config', JSON.stringify(fsConfig));
          }
          if (fsTeacherData.rules && fsTeacherData.rules.length > 0) {
            activeRules = fsTeacherData.rules;
            setTimetableRules(activeRules);
            localStorage.setItem('smart_schedule_rules', JSON.stringify(activeRules));
          }

          // Sync Timetable Versions
          if (fsVersions && fsVersions.length > 0) {
            activeVersions = fsVersions;
            setTimetableVersions(activeVersions);
            localStorage.setItem('smart_schedule_timetable_versions', JSON.stringify(activeVersions));
          } else if (fsTeacherData.rules && fsTeacherData.rules.length > 0) {
            console.log('MIGRATION: Auto-creating initial timetableVersion from teachers/{uid}.rules');
            const vYear = activeTeacher.academicYear || '2026-2027';
            const migrated = await saveOrSplitTimetableVersionInFirestore(
              user.uid,
              vYear,
              1,
              fsTeacherData.rules,
              'Thời khóa biểu ban đầu'
            );
            if (isCancelled) return;
            activeVersions = migrated;
            setTimetableVersions(migrated);
            localStorage.setItem('smart_schedule_timetable_versions', JSON.stringify(migrated));
          }

          if (fsPPCTs) {
            setCurriculums(fsPPCTs);
            localStorage.setItem('smart_schedule_ppcts', JSON.stringify(fsPPCTs));
          }

          // STRICT LOAD: WEEKLY SCHEDULES
          if (fsSchedulesResult.status === 'success') {
            if (fsSchedulesResult.exists) {
              const fsItems = fsSchedulesResult.items || [];
              if (fsItems.length > 0) {
                // Priority 1: Remote Firestore schedule items exist -> LOAD DIRECTLY
                console.log('[HYDRATION] FIRESTORE SCHEDULES: HAS_DATA');
                console.log(`[HYDRATION] ITEMS COUNT: ${fsItems.length}`);
                const sanitized = ensureUniqueScheduleIds(fsItems);
                setSchedules(sanitized);
                localStorage.setItem(`smart_schedule_items_${user.uid}`, JSON.stringify(sanitized));
                localStorage.setItem('smart_schedule_items', JSON.stringify(sanitized));
              } else {
                // SUCCESS_EMPTY: Firestore document exists but items array is empty.
                console.log('[HYDRATION] FIRESTORE SCHEDULES: EMPTY');
                const savedLocal = localStorage.getItem(`smart_schedule_items_${user.uid}`) || localStorage.getItem('smart_schedule_items');
                let localItems: ScheduleItem[] = [];
                if (savedLocal) {
                  try {
                    const parsed = JSON.parse(savedLocal);
                    if (Array.isArray(parsed)) localItems = parsed;
                  } catch (e) {
                    localItems = [];
                  }
                }
                if (localItems && localItems.length > 0) {
                  const sanitized = ensureUniqueScheduleIds(localItems);
                  console.log(`[HYDRATION] ITEMS COUNT: ${sanitized.length}`);
                  setSchedules(sanitized);
                  localStorage.setItem(`smart_schedule_items_${user.uid}`, JSON.stringify(sanitized));
                } else {
                  console.log('[HYDRATION] ITEMS COUNT: 0');
                  setSchedules([]);
                  localStorage.setItem(`smart_schedule_items_${user.uid}`, JSON.stringify([]));
                }
              }
            } else {
              // Priority 2: Document does not exist in Firestore yet. Check LocalStorage cache for THIS UID first
              console.log('[HYDRATION] FIRESTORE SCHEDULES: EMPTY');
              const savedLocal = localStorage.getItem(`smart_schedule_items_${user.uid}`) || localStorage.getItem('smart_schedule_items');
              let localItems: ScheduleItem[] = [];
              if (savedLocal) {
                try {
                  const parsed = JSON.parse(savedLocal);
                  if (Array.isArray(parsed)) localItems = parsed;
                } catch (e) {
                  localItems = [];
                }
              }

              if (localItems && localItems.length > 0) {
                const sanitized = ensureUniqueScheduleIds(localItems);
                console.log(`[HYDRATION] ITEMS COUNT: ${sanitized.length}`);
                setSchedules(sanitized);
                localStorage.setItem(`smart_schedule_items_${user.uid}`, JSON.stringify(sanitized));
              } else {
                console.log('[HYDRATION] ITEMS COUNT: 0');
                setSchedules([]);
              }
            }
          } else {
            // Priority 3: Firestore read error (e.g. network error). Retain local cache.
            console.log('[HYDRATION] FIRESTORE SCHEDULES: ERROR');
            const savedLocal = localStorage.getItem(`smart_schedule_items_${user.uid}`) || localStorage.getItem('smart_schedule_items');
            if (savedLocal) {
              try {
                const localItems = JSON.parse(savedLocal);
                if (Array.isArray(localItems) && localItems.length > 0) {
                  const sanitized = ensureUniqueScheduleIds(localItems);
                  console.log(`[HYDRATION] ITEMS COUNT: ${sanitized.length}`);
                  setSchedules(sanitized);
                } else {
                  console.log('[HYDRATION] ITEMS COUNT: 0');
                }
              } catch (e) {
                console.log('[HYDRATION] ITEMS COUNT: 0');
              }
            } else {
              console.log('[HYDRATION] ITEMS COUNT: 0');
            }
          }

          console.log('[HYDRATION] STATE HYDRATED');

          if (fsCustomDates) {
            saveCustomWeekDatesMap(fsCustomDates);
          }
          if (fsPrintSettings) {
            setPrintSettings(fsPrintSettings);
            localStorage.setItem('smart_schedule_print_settings', JSON.stringify(fsPrintSettings));
          }

          if (isCancelled) return;
        } catch (err) {
          console.error('Failed to sync Firestore data on login:', err);
        } finally {
          if (!isCancelled) {
            isHydratingRef.current = false;
            dataReadyRef.current = true;
            setDataReady(true);
            setAuthLoading(false);
            setAutoSaveStatus('saved');
            console.log('[HYDRATION] DATA READY');
          }
        }
      } else {
        if (!isCancelled) {
          setAppUser(null);
          setSchedules([]);
          isHydratingRef.current = false;
          dataReadyRef.current = false;
          setDataReady(false);
          setAuthLoading(false);
        }
      }
    });
    return () => {
      isCancelled = true;
      unsubscribe();
    };
  }, []);

  // Save schedules to LocalStorage & Firestore with Auto-save indicator
  const updateSchedulesWithHistory = (newSchedules: ScheduleItem[]) => {
    if (isHydratingRef.current || !dataReadyRef.current) {
      console.warn('[DATA WRITE] Blocked updateSchedulesWithHistory: hydration in progress or data not ready');
      return;
    }
    const sanitized = ensureUniqueScheduleIds(newSchedules);
    const currentUid = authUser?.uid || auth.currentUser?.uid;

    if (sanitized.length === 0) {
      console.log('[SCHEDULE-SAVE-ZERO-ITEMS-CHECK] itemCount is 0.');
    }

    setAutoSaveStatus('saving');
    setHistory(prev => [...prev, schedules]);
    setRedoStack([]);
    setSchedules(sanitized);
    localStorage.setItem('smart_schedule_items', JSON.stringify(sanitized));
    if (currentUid) {
      localStorage.setItem(`smart_schedule_items_${currentUid}`, JSON.stringify(sanitized));
      saveSchedulesToFirestore(currentUid, sanitized);
    } else {
      console.warn('SAVE SCHEDULE SKIPPED: User is not logged in.');
    }
    setTimeout(() => {
      setAutoSaveStatus('saved');
    }, 400);
  };

  const handleUndo = () => {
    if (isHydratingRef.current || !dataReadyRef.current || history.length === 0) return;
    const previous = history[history.length - 1];
    setRedoStack(prev => [schedules, ...prev]);
    setHistory(prev => prev.slice(0, -1));
    console.log('[SCHEDULE-STATE-BEFORE]', schedules);
    console.log('[SCHEDULE-STATE-SET]', previous);
    setSchedules(previous);
    localStorage.setItem('smart_schedule_items', JSON.stringify(previous));
    if (authUser?.uid && dataReadyRef.current && !isHydratingRef.current) {
      saveSchedulesToFirestore(authUser.uid, previous);
    }
  };

  const handleRedo = () => {
    if (isHydratingRef.current || !dataReadyRef.current || redoStack.length === 0) return;
    const next = redoStack[0];
    setHistory(prev => [...prev, schedules]);
    setRedoStack(prev => prev.slice(1));
    console.log('[SCHEDULE-STATE-BEFORE]', schedules);
    console.log('[SCHEDULE-STATE-SET]', next);
    setSchedules(next);
    localStorage.setItem('smart_schedule_items', JSON.stringify(next));
    if (authUser?.uid && dataReadyRef.current && !isHydratingRef.current) {
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
    const defaultSubject = teacher.subjects?.[0] || 'Môn học';
    const defaultClass = teacher.assignedClasses?.[0] || '1A1';
    const defaultGrade = teacher.grades?.[0] || 'Khối 1';

    const newItem: ScheduleItem = {
      id: `s-custom-${Date.now()}`,
      teacherId: teacher.uid,
      academicYear: normalizeAcademicYear(teacher.academicYear),
      semester: teacher.semester || 'Học kỳ I',
      weekNumber: currentWeek,
      dayOfWeek,
      period,
      className: defaultClass,
      subject: defaultSubject,
      grade: defaultGrade,
      lessonTitle: 'Bài học mới bổ sung',
      status: 'unprepared',
      generatedFromTKB: false,
      source: 'manual',
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

  // Academic Year Config Handler
  const handleSaveAcademicYearConfig = async (newConfig: AcademicYearConfig) => {
    setAcademicYearConfig(newConfig);
    localStorage.setItem('smart_schedule_academic_year_config', JSON.stringify(newConfig));
    if (authUser?.uid) {
      setAutoSaveStatus('saving');
      try {
        await saveAcademicYearConfigToFirestore(authUser.uid, newConfig);
      } catch (err) {
        console.error('Failed to save academic year config to Firestore:', err);
      } finally {
        setAutoSaveStatus('saved');
      }
    }
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

  // Auto Generate Schedule from Timetable Rules + Curriculums with Versioning
  const handleGenerateFromTKB = (weekNumber?: number, customVersions?: TimetableVersion[], customTeacher?: TeacherProfile) => {
    const activeTeacherProfile = customTeacher || teacher;
    const activeVersionsList = customVersions || timetableVersions;

    const targetWeek = weekNumber || currentWeek;
    console.log('[TKB-LBG][CLICK] Executing handleGenerateFromTKB for week:', targetWeek);
    console.log('[TKB-LBG][WEEK]', targetWeek);

    const year = normalizeAcademicYear(activeTeacherProfile.academicYear);
    console.log('[TKB-LBG][ACADEMIC_YEAR]', year);

    const weeksToProcess = weekNumber ? [weekNumber] : Array.from({ length: 35 }, (_, i) => i + 1);
    let existing = [...schedules];
    let createdCount = 0;
    let skippedCount = 0;
    let hasValidVersion = false;
    let hasMatchedRules = false;

    const teacherSubjects = (activeTeacherProfile.subjects || []).map(s => s.trim().toLowerCase());

    for (const w of weeksToProcess) {
      const ver = getTimetableVersionForWeek(activeVersionsList, year, w);

      if (!ver) {
        console.log('[TKB-LBG][VERSION]', null);
        console.log('[TKB-LBG][RULES]', 0);
        console.log('[TKB-LBG][TEACHER_SUBJECTS]', teacherSubjects);
        console.log('[TKB-LBG][MATCHED_RULES]', 0);
        console.log('[TKB-LBG][GENERATED]', 0);
        console.log('[TKB-LBG][SAVE]', 'SKIPPED_NO_VERSION');
        continue;
      }

      hasValidVersion = true;

      console.log('[TKB-LBG][VERSION]', {
        id: ver.id,
        versionName: ver.versionName,
        fromWeek: ver.fromWeek,
        toWeek: ver.toWeek,
        academicYear: ver.academicYear
      });

      const sourceRules = Array.isArray(ver.rules) ? ver.rules : [];
      console.log('[TKB-LBG][RULES]', sourceRules.length);
      console.log('[TKB-LBG][TEACHER_SUBJECTS]', teacherSubjects);

      const matchingRules = teacherSubjects.length > 0
        ? sourceRules.filter(r => r.subject && teacherSubjects.includes(r.subject.trim().toLowerCase()))
        : [];

      console.log('[TKB-LBG][MATCHED_RULES]', matchingRules.length);

      if (matchingRules.length > 0) {
        hasMatchedRules = true;
      }

      const validSlots = new Set<string>();
      let weekCreated = 0;

      matchingRules.forEach((rule, idx) => {
        const normSession = getNormalizedSession(rule);
        const normPeriod = getNormalizedPeriod(rule);
        const ruleSubjectNorm = (rule.subject || '').trim().toLowerCase();

        validSlots.add(`${rule.className}_${rule.dayOfWeek}_${normSession}_${normPeriod}_${ruleSubjectNorm}`);

        const curr = curriculums.find(c => c.grade === rule.grade && c.subject?.trim().toLowerCase() === ruleSubjectNorm);
        const ppctItem = curr?.items.find(i => i.week === w) || curr?.items.find(i => i.periodNumber === w);

        const existingIdx = existing.findIndex(s => 
          s.weekNumber === w &&
          s.dayOfWeek === rule.dayOfWeek &&
          getNormalizedSession(s) === normSession &&
          getNormalizedPeriod(s) === normPeriod &&
          s.className === rule.className
        );

        if (existingIdx >= 0) {
          const item = existing[existingIdx];
          const itemSubNorm = (item.subject || '').trim().toLowerCase();

          if (itemSubNorm === ruleSubjectNorm) {
            existing[existingIdx] = {
              ...item,
              generatedFromTKB: true,
              source: 'timetable',
              academicYear: year,
            };
            skippedCount++;
          } else {
            existing[existingIdx] = {
              ...item,
              subject: rule.subject,
              grade: rule.grade,
              lessonTitle: ppctItem ? ppctItem.title : `Bài học Tuần ${w} môn ${rule.subject}`,
              topic: ppctItem?.topic,
              ppctPeriod: ppctItem ? ppctItem.periodNumber : w,
              requirements: ppctItem?.requirements,
              generatedFromTKB: true,
              source: 'timetable',
              academicYear: year,
              updatedAt: new Date().toISOString(),
            };
            createdCount++;
            weekCreated++;
          }
        } else {
          const dayClean = (rule.dayOfWeek || 'day').replace(/\s+/g, '');
          const ruleIdPart = rule.id || `${rule.className}-${rule.subject}-${idx}`;

          const createdItem: ScheduleItem = {
            id: `gen-${ruleIdPart}-${dayClean}-p${normPeriod}-w${w}-${Date.now()}`,
            teacherId: teacher.uid,
            curriculumId: curr?.id,
            lessonId: ppctItem?.id,
            academicYear: year,
            semester: teacher.semester || 'Học kỳ I',
            weekNumber: w,
            dayOfWeek: rule.dayOfWeek,
            session: normSession,
            period: normPeriod,
            className: rule.className,
            subject: rule.subject,
            grade: rule.grade,
            lessonTitle: ppctItem ? ppctItem.title : `Bài học Tuần ${w} môn ${rule.subject}`,
            topic: ppctItem?.topic,
            ppctPeriod: ppctItem ? ppctItem.periodNumber : w,
            status: w < currentWeek ? 'completed' : w === currentWeek ? 'preparing' : 'unprepared',
            requirements: ppctItem?.requirements,
            generatedFromTKB: true,
            source: 'timetable',
            updatedAt: new Date().toISOString(),
          };

          existing.push(createdItem);
          createdCount++;
          weekCreated++;
        }
      });

      let weekRemoved = 0;

      // Clean up auto-generated TKB slots for week w that no longer exist in validSlots or not in teacher.subjects
      existing = existing.filter(s => {
        if (s.weekNumber !== w) return true;

        if (s.source === 'manual' || s.generatedFromTKB === false) return true;

        const sSubNorm = (s.subject || '').trim().toLowerCase();
        if (!teacherSubjects.includes(sSubNorm)) {
          weekRemoved++;
          return false;
        }

        const sNormSession = getNormalizedSession(s);
        const sNormPeriod = getNormalizedPeriod(s);
        const slotKey = `${s.className}_${s.dayOfWeek}_${sNormSession}_${sNormPeriod}_${sSubNorm}`;
        const isValid = validSlots.has(slotKey);
        if (!isValid) {
          weekRemoved++;
        }
        return isValid;
      });

      console.log('[TKB-LBG][GENERATED]', weekCreated);
      console.log('[TKB-LBG][SAVE]', {
        weekNumber: w,
        created: weekCreated,
        removed: weekRemoved,
        totalItems: existing.length
      });
    }

    if (!hasValidVersion) {
      console.warn('[TKB-LBG] Generation skipped: No TimetableVersion found for target week');
      return { createdCount: 0, skippedCount: 0, noVersionFound: true, noMatchedRules: false };
    }

    if (!hasMatchedRules) {
      console.warn('[TKB-LBG] Generation skipped: No matching rules for teacher subjects');
      return { createdCount: 0, skippedCount: 0, noVersionFound: false, noMatchedRules: true };
    }

    updateSchedulesWithHistory(existing);
    return { createdCount, skippedCount, noVersionFound: false, noMatchedRules: false };
  };

  const handleAutoGenerateSchedule = () => {
    handleGenerateFromTKB();
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
    handleGenerateFromTKB(undefined, undefined, newProfile);
  };

  const handleSaveTimetableRules = async (newRules: ClassTimetableRule[], fromWeek: number = 1, versionName?: string) => {
    setTimetableRules(newRules);
    localStorage.setItem('smart_schedule_rules', JSON.stringify(newRules));

    const year = teacher.academicYear || '2026-2027';
    let finalVersions: TimetableVersion[] = [];

    if (authUser?.uid) {
      const updatedVersions = await saveOrSplitTimetableVersionInFirestore(
        authUser.uid,
        year,
        fromWeek,
        newRules,
        versionName
      );
      setTimetableVersions(updatedVersions);
      localStorage.setItem('smart_schedule_timetable_versions', JSON.stringify(updatedVersions));
      finalVersions = updatedVersions;
    } else {
      const now = new Date().toISOString();
      const yearVers = timetableVersions.filter(v => v.academicYear === year);
      const otherVers = timetableVersions.filter(v => v.academicYear !== year);

      let adjusted: TimetableVersion[] = [];
      const exactMatch = yearVers.find(v => v.fromWeek === fromWeek);

      if (exactMatch) {
        adjusted = yearVers.map(v => {
          if (v.id === exactMatch.id) {
            return {
              ...v,
              rules: newRules,
              versionName: versionName || v.versionName,
              updatedAt: now,
            };
          }
          return v;
        });
      } else {
        const coveringVer = yearVers.find(v => v.fromWeek < fromWeek && v.toWeek >= fromWeek);

        if (coveringVer) {
          const oldToWeek = coveringVer.toWeek;
          const newVer: TimetableVersion = {
            id: `v-${fromWeek}-${oldToWeek}-${Date.now()}`,
            uid: teacher.uid,
            academicYear: year,
            versionName: versionName || `Thời khóa biểu áp dụng từ tuần ${fromWeek}`,
            fromWeek,
            toWeek: oldToWeek,
            rules: newRules,
            createdAt: now,
            updatedAt: now,
            createdBy: teacher.uid,
          };

          adjusted = yearVers.map(v => {
            if (v.id === coveringVer.id) {
              return { ...v, toWeek: fromWeek - 1, updatedAt: now };
            }
            return v;
          });
          adjusted.push(newVer);
        } else if (yearVers.length === 0) {
          if (fromWeek === 1) {
            adjusted = [{
              id: `v-1-35-${Date.now()}`,
              uid: teacher.uid,
              academicYear: year,
              versionName: versionName || 'Thời khóa biểu ban đầu',
              fromWeek: 1,
              toWeek: 35,
              rules: newRules,
              createdAt: now,
              updatedAt: now,
              createdBy: teacher.uid,
            }];
          } else {
            const v1: TimetableVersion = {
              id: `v-1-${fromWeek - 1}-${Date.now()}`,
              uid: teacher.uid,
              academicYear: year,
              versionName: 'Thời khóa biểu ban đầu',
              fromWeek: 1,
              toWeek: fromWeek - 1,
              rules: timetableRules,
              createdAt: now,
              updatedAt: now,
              createdBy: teacher.uid,
            };
            const v2: TimetableVersion = {
              id: `v-${fromWeek}-35-${Date.now()}`,
              uid: teacher.uid,
              academicYear: year,
              versionName: versionName || `Thời khóa biểu áp dụng từ tuần ${fromWeek}`,
              fromWeek,
              toWeek: 35,
              rules: newRules,
              createdAt: now,
              updatedAt: now,
              createdBy: teacher.uid,
            };
            adjusted = [v1, v2];
          }
        } else {
          const futureVersions = yearVers.filter(v => v.fromWeek > fromWeek).sort((a, b) => a.fromWeek - b.fromWeek);
          const targetEndWeek = futureVersions.length > 0 ? futureVersions[0].fromWeek - 1 : 35;
          const newVer: TimetableVersion = {
            id: `v-${fromWeek}-${targetEndWeek}-${Date.now()}`,
            uid: teacher.uid,
            academicYear: year,
            versionName: versionName || (fromWeek === 1 ? 'Thời khóa biểu ban đầu' : `Thời khóa biểu áp dụng từ tuần ${fromWeek}`),
            fromWeek,
            toWeek: targetEndWeek,
            rules: newRules,
            createdAt: now,
            updatedAt: now,
            createdBy: teacher.uid,
          };
          adjusted = [...yearVers, newVer];
        }
      }

      adjusted.sort((a, b) => a.fromWeek - b.fromWeek);
      const combined = [...otherVers, ...adjusted];
      setTimetableVersions(combined);
      localStorage.setItem('smart_schedule_timetable_versions', JSON.stringify(combined));
      finalVersions = combined;
    }

    handleGenerateFromTKB(undefined, finalVersions);
  };

  const handleDeleteTimetableVersion = async (versionId: string) => {
    const currentUid = authUser?.uid || auth.currentUser?.uid;
    if (!currentUid || !versionId) return;

    try {
      console.log(`[DELETE VERSION] Deleting timetableVersion ${versionId} for user ${currentUid}`);
      await deleteTimetableVersionFromFirestore(currentUid, versionId);

      const updatedVersions = timetableVersions.filter(v => v.id !== versionId);
      setTimetableVersions(updatedVersions);
      localStorage.setItem('smart_schedule_timetable_versions', JSON.stringify(updatedVersions));

      console.log(`[DELETE VERSION] Successfully deleted version ${versionId}. Remaining count: ${updatedVersions.length}`);
      handleGenerateFromTKB(undefined, updatedVersions);
    } catch (err) {
      console.error('Failed to delete timetable version:', err);
    }
  };

  if (authLoading || (authUser && !dataReady)) {
    return (
      <div className="min-h-screen bg-[#090D16] flex flex-col items-center justify-center space-y-4 text-slate-100 font-sans">
        <div className="p-4 rounded-3xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-2xl shadow-indigo-500/20 animate-pulse">
          <Calendar className="w-10 h-10" />
        </div>
        <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold tracking-wider uppercase">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Đang tải dữ liệu Lịch báo giảng...</span>
        </div>
      </div>
    );
  }

  if (!authUser) {
    return <LoginScreen darkMode={darkMode} />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] text-slate-800 dark:text-slate-100 font-sans transition-colors duration-200 flex flex-col">
      {/* Locked Account Notice overlay */}
      {appUser && appUser.status === 'disabled' ? (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-rose-500/40 p-6 rounded-2xl shadow-2xl text-white space-y-5 text-center">
            <div className="w-16 h-16 bg-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mx-auto border border-rose-500/40 shadow-lg shadow-rose-500/20">
              <Ban className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-black text-rose-300 uppercase tracking-wide">
                TÀI KHOẢN CỦA BẠN ĐÃ BỊ KHÓA
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Tài khoản <span className="font-bold text-white">{appUser.email}</span> hiện đang bị tạm khóa bởi Quản trị viên hệ thống.
              </p>
              <p className="text-[11px] text-slate-400">
                Vui lòng liên hệ Ban Giám hiệu hoặc Quản trị viên để được hỗ trợ mở khóa.
              </p>
            </div>
            <button 
              onClick={logoutUser} 
              className="w-full flex items-center justify-center space-x-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
            >
              <LogOutIcon className="w-4 h-4" />
              <span>Đăng xuất khỏi hệ thống</span>
            </button>
          </div>
        </div>
      ) : currentTab === 'admin' ? (
        (() => {
          const isAdminUser = appUser?.role === 'admin' || isConfiguredAdminUid(authUser?.uid);
          if (!isAdminUser) {
            return (
              <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-slate-900 border border-amber-500/40 p-6 rounded-2xl shadow-2xl text-white space-y-4 text-center">
                  <div className="w-16 h-16 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto border border-amber-500/40">
                    <ShieldAlert className="w-8 h-8" />
                  </div>
                  <h2 className="text-base font-bold text-amber-300 uppercase">TỪ CHỐI TRUY CẬP PHÂN HỆ QUẢN TRỊ</h2>
                  <p className="text-xs text-slate-300">
                    Tài khoản của bạn là Giáo viên và không có quyền truy cập khu vực Quản trị.
                  </p>
                  <button
                    onClick={() => setCurrentTab('dashboard')}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Quay lại Trang chủ Giáo viên
                  </button>
                </div>
              </div>
            );
          }
          return (
            <AdminLayout
              currentUser={appUser || authUser}
              onBackToMain={() => setCurrentTab('dashboard')}
              onLogout={logoutUser}
              darkMode={darkMode}
              setDarkMode={setDarkMode}
            />
          );
        })()
      ) : (
        <>
          {/* Header Navigation */}
          <Navbar
            currentTab={currentTab}
            setCurrentTab={setCurrentTab}
            teacher={teacher}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            autoSaveStatus={autoSaveStatus}
            user={authUser}
            appUser={appUser}
            onLogin={signInWithGoogle}
            onLogout={logoutUser}
          />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* System Announcement Banner for Teachers */}
        <SystemAnnouncementBanner systemConfig={systemConfig} />

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
            timetableRules={timetableRules}
            timetableVersions={timetableVersions}
            academicYearConfig={academicYearConfig}
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
            timetableVersions={timetableVersions}
            currentWeek={currentWeek}
            onSaveProfile={handleSaveProfile}
            onSaveTimetableRules={handleSaveTimetableRules}
            onDeleteTimetableVersion={handleDeleteTimetableVersion}
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
            academicYearConfig={academicYearConfig}
            timetableVersions={timetableVersions}
            onSaveProfile={handleSaveProfile}
            onSaveTimetableRules={handleSaveTimetableRules}
            onSavePrintSettings={handleSavePrintSettings}
            onSaveAcademicYearConfig={handleSaveAcademicYearConfig}
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
        </>
      )}
    </div>
  );
}
