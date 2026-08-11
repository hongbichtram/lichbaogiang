import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc,
  getDocs,
  collection,
  deleteDoc,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { 
  TeacherProfile, 
  AcademicYearConfig,
  PPCTCurriculum, 
  ScheduleItem, 
  ClassTimetableRule, 
  TimetableVersion,
  AppUser, 
  UserRole, 
  UserStatus,
  SharedCurriculum,
  TeacherCurriculumData,
  TeacherCurriculumSelection,
  TeacherLessonProgress,
  TeacherCustomLesson,
  TeacherCurriculumNote
} from '../types';
import { CustomWeekDatesMap } from '../utils/dateWeekUtils';
import { ADMIN_UID, isConfiguredAdminUid } from '../config/adminConfig';

declare global {
  interface ImportMetaEnv {
    VITE_FIREBASE_API_KEY?: string;
    VITE_FIREBASE_AUTH_DOMAIN?: string;
    VITE_FIREBASE_PROJECT_ID?: string;
    VITE_FIREBASE_STORAGE_BUCKET?: string;
    VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
    VITE_FIREBASE_APP_ID?: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

// Safely load firebase config if present
const configFiles = (import.meta as any).glob('../../firebase-applet-config.json', { eager: true });
const configModule = Object.values(configFiles)[0] as any;
const firebaseConfigData = configModule?.default || configModule || {
  apiKey: "AIzaSyC1SHw71JjSNFK80nEaGbFj4MA6zPwsgCE",
  authDomain: "lichbaogiang-20939.firebaseapp.com",
  projectId: "lichbaogiang-20939",
  storageBucket: "lichbaogiang-20939.firebasestorage.app",
  messagingSenderId: "481171704495",
  appId: "1:481171704495:web:c7f969153f0337a7d9225a"
};

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigData.apiKey || "AIzaSyC1SHw71JjSNFK80nEaGbFj4MA6zPwsgCE",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigData.authDomain || "lichbaogiang-20939.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigData.projectId || "lichbaogiang-20939",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigData.storageBucket || "lichbaogiang-20939.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigData.messagingSenderId || "481171704495",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfigData.appId || "1:481171704495:web:c7f969153f0337a7d9225a",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
console.log('FIREBASE INIT', { projectId: firebaseConfig.projectId, authDomain: firebaseConfig.authDomain });

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  console.log('AUTH LOGIN START');
  try {
    const result = await signInWithPopup(auth, googleProvider);
    console.log('AUTH LOGIN SUCCESS');
    console.log('UID:', result.user.uid);
    console.log('EMAIL:', result.user.email);
    return result.user;
  } catch (error: any) {
    console.error('AUTH LOGIN ERROR:', error);
    const code = error?.code || 'unknown';
    const msg = error?.message || String(error);
    console.error(`Firebase Auth Error Code: ${code}, Message: ${msg}`);
    throw error;
  }
};

export const loginWithEmailAndPassword = async (email: string, pass: string) => {
  console.log('EMAIL AUTH LOGIN START');
  try {
    const result = await signInWithEmailAndPassword(auth, email, pass);
    console.log('EMAIL AUTH LOGIN SUCCESS:', result.user.uid);
    return result.user;
  } catch (error: any) {
    console.error('EMAIL AUTH LOGIN ERROR:', error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await firebaseSignOut(auth);
    console.log('AUTH USER LOGOUT SUCCESS');
  } catch (error) {
    console.error("Sign out error:", error);
  }
};

// --- USER ROLE & PERMISSION HELPERS ---

export function isAdmin(role?: string | null): boolean {
  return role === 'admin';
}

export function isTeacher(role?: string | null): boolean {
  return role === 'teacher';
}

export function isActiveUser(status?: string | null): boolean {
  return status === 'active';
}

/**
 * Fetch user document from users/{uid}
 */
export const fetchUserDocument = async (uid: string): Promise<AppUser | null> => {
  if (!uid) return null;
  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        uid,
        displayName: data.displayName || '',
        email: data.email || '',
        role: (data.role as UserRole) || 'teacher',
        status: (data.status as UserStatus) || 'active',
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    }
  } catch (err) {
    console.error('Error fetching user document:', err);
  }
  return null;
};

/**
 * Sync user document upon successful authentication.
 * Document path: users/{uid}
 * If exists: read role and status.
 * If not exists: default role = "teacher", status = "active".
 * If user.uid matches ADMIN_UID: ensure role = "admin".
 */
export const syncUserRoleOnLogin = async (user: User): Promise<AppUser> => {
  const uid = user.uid;
  const userRef = doc(db, 'users', uid);
  const isAdminByConfig = isConfiguredAdminUid(uid);

  let appUser: AppUser;

  try {
    const snap = await getDoc(userRef);

    if (snap.exists()) {
      const data = snap.data();
      let role: UserRole = (data.role as UserRole) || 'teacher';
      let status: UserStatus = (data.status as UserStatus) || 'active';

      // If configured as ADMIN_UID, elevate/sync role to admin if not already
      if (isAdminByConfig && role !== 'admin') {
        role = 'admin';
        await setDoc(userRef, { role: 'admin', updatedAt: serverTimestamp() }, { merge: true });
      }

      // Update lastLoginAt on login
      await setDoc(userRef, { 
        displayName: data.displayName || user.displayName || '',
        email: data.email || user.email || '',
        lastLoginAt: serverTimestamp(),
        updatedAt: serverTimestamp() 
      }, { merge: true });

      appUser = {
        uid,
        displayName: data.displayName || user.displayName || '',
        email: data.email || user.email || '',
        role,
        status,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        lastLoginAt: data.lastLoginAt,
      };
    } else {
      // Document does not exist: create default user document
      const defaultRole: UserRole = isAdminByConfig ? 'admin' : 'teacher';
      const defaultStatus: UserStatus = 'active';

      const newUserDoc = {
        displayName: user.displayName || '',
        email: user.email || '',
        role: defaultRole,
        status: defaultStatus,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      };

      await setDoc(userRef, newUserDoc);

      appUser = {
        uid,
        displayName: newUserDoc.displayName,
        email: newUserDoc.email,
        role: defaultRole,
        status: defaultStatus,
      };
    }

    // Log system activity entry for login
    try {
      const logsRef = collection(db, 'systemLogs');
      await setDoc(doc(logsRef), {
        uid,
        performerName: appUser.displayName || appUser.email || 'Người dùng',
        performerEmail: appUser.email || '',
        action: 'login',
        actionLabel: 'Đăng nhập',
        details: `Đăng nhập hệ thống thành công (Vai trò: ${appUser.role.toUpperCase()})`,
        timestamp: new Date().toISOString(),
        createdAt: serverTimestamp()
      });
    } catch (e) {
      // Silently ignore log creation if permissions fail on initial state
    }
  } catch (err) {
    console.error('Error syncing user document on login:', err);
    // Fallback in-memory state if Firestore write fails
    appUser = {
      uid,
      displayName: user.displayName || '',
      email: user.email || '',
      role: isAdminByConfig ? 'admin' : 'teacher',
      status: 'active',
    };
  }

  // Print required debug log (Requirement 7)
  console.log(`AUTH USER\nUID: ${appUser.uid}\nEMAIL: ${appUser.email}\nROLE: ${appUser.role}\nSTATUS: ${appUser.status}`);

  return appUser;
};

// --- FIRESTORE DATA SYNC HELPERS ---

// 1. Teacher Profile & Rules
export const saveTeacherProfileToFirestore = async (uid: string, profile: TeacherProfile, rules?: ClassTimetableRule[]) => {
  console.log('FIRESTORE SAVE START', { collection: 'teachers', uid });
  if (!uid) {
    console.error('FIRESTORE ERROR', { collection: 'teachers', uid, action: 'write', error: 'User UID is empty' });
    return;
  }
  try {
    const ref = doc(db, 'teachers', uid);
    await setDoc(ref, { 
      name: profile.fullName || '',
      email: profile.email || '',
      assignedSubjects: profile.subjects || [],
      profile, 
      rules: rules || null, 
      updatedAt: new Date().toISOString() 
    }, { merge: true });
    console.log('FIRESTORE SAVE SUCCESS', { collection: 'teachers', uid });
  } catch (err) {
    console.error('FIRESTORE ERROR', { collection: 'teachers', uid, action: 'write', error: err });
  }
};

export const fetchTeacherProfileFromFirestore = async (uid: string): Promise<{ profile: TeacherProfile | null; rules: ClassTimetableRule[] | null }> => {
  console.log('FIRESTORE LOAD START', { collection: 'teachers', uid });
  if (!uid) {
    console.error('FIRESTORE ERROR', { collection: 'teachers', uid, action: 'read', error: 'User UID is empty' });
    return { profile: null, rules: null };
  }
  try {
    const ref = doc(db, 'teachers', uid);
    const snap = await getDoc(ref);
    const exists = snap.exists();
    console.log('FIRESTORE LOAD SUCCESS', { collection: 'teachers', uid, dataFound: exists });
    if (exists) {
      const data = snap.data();
      let profileData = data.profile || null;
      if (profileData) {
        const assigned = data.assignedSubjects || profileData.subjects;
        if (Array.isArray(assigned) && assigned.length > 0) {
          profileData = {
            ...profileData,
            subjects: assigned,
          };
        }
      }
      return { profile: profileData, rules: data.rules || null };
    }
  } catch (err) {
    console.error('FIRESTORE ERROR', { collection: 'teachers', uid, action: 'read', error: err });
  }
  return { profile: null, rules: null };
};

// 1b. Timetable Versions (subcollection teachers/{uid}/timetableVersions)
export const fetchTimetableVersionsFromFirestore = async (uid: string): Promise<TimetableVersion[]> => {
  console.log('FIRESTORE LOAD VERSIONS START', { collection: 'teachers', subcollection: 'timetableVersions', uid });
  if (!uid) return [];
  try {
    const ref = collection(db, 'teachers', uid, 'timetableVersions');
    const snap = await getDocs(ref);
    const versions: TimetableVersion[] = [];
    snap.forEach(docSnap => {
      const data = docSnap.data();
      versions.push({
        id: docSnap.id,
        uid: data.uid || uid,
        academicYear: data.academicYear || '2025-2026',
        versionName: data.versionName || 'Thời khóa biểu',
        fromWeek: Number(data.fromWeek) || 1,
        toWeek: Number(data.toWeek) || 35,
        rules: data.rules || [],
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
        createdBy: data.createdBy || uid,
      });
    });
    // Sort versions by fromWeek ascending
    versions.sort((a, b) => a.fromWeek - b.fromWeek);
    console.log('FIRESTORE LOAD VERSIONS SUCCESS', { uid, count: versions.length });
    return versions;
  } catch (err) {
    console.error('FIRESTORE ERROR loading timetableVersions:', err);
    return [];
  }
};

export const saveTimetableVersionToFirestore = async (uid: string, version: TimetableVersion): Promise<void> => {
  if (!uid || !version.id) return;
  try {
    const ref = doc(db, 'teachers', uid, 'timetableVersions', version.id);
    await setDoc(ref, {
      ...version,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.error('FIRESTORE ERROR saving timetableVersion:', err);
  }
};

export const deleteTimetableVersionFromFirestore = async (uid: string, versionId: string): Promise<void> => {
  if (!uid || !versionId) return;
  try {
    const ref = doc(db, 'teachers', uid, 'timetableVersions', versionId);
    await deleteDoc(ref);
  } catch (err) {
    console.error('FIRESTORE ERROR deleting timetableVersion:', err);
  }
};

export const saveOrSplitTimetableVersionInFirestore = async (
  uid: string,
  academicYear: string,
  fromWeek: number,
  newRules: ClassTimetableRule[],
  versionName?: string
): Promise<TimetableVersion[]> => {
  if (!uid) return [];

  try {
    // 1. Fetch current versions
    const existingVersions = await fetchTimetableVersionsFromFirestore(uid);
    const yearVersions = existingVersions.filter(v => v.academicYear === academicYear);

    const batch = writeBatch(db);
    const now = new Date().toISOString();

    // Check if an existing version starts at exact same fromWeek
    const exactMatch = yearVersions.find(v => v.fromWeek === fromWeek);

    if (exactMatch) {
      // Update existing version starting at fromWeek
      const vRef = doc(db, 'teachers', uid, 'timetableVersions', exactMatch.id);
      batch.update(vRef, {
        rules: newRules,
        versionName: versionName || exactMatch.versionName,
        updatedAt: now,
      });
    } else {
      // Find covering version where v.fromWeek < fromWeek and v.toWeek >= fromWeek
      const coveringVer = yearVersions.find(v => v.fromWeek < fromWeek && v.toWeek >= fromWeek);

      if (coveringVer) {
        const oldToWeek = coveringVer.toWeek;
        // Slice covering version so its end week becomes (fromWeek - 1)
        const covRef = doc(db, 'teachers', uid, 'timetableVersions', coveringVer.id);
        batch.update(covRef, {
          toWeek: fromWeek - 1,
          updatedAt: now,
        });

        // Create new version starting from fromWeek to oldToWeek
        const newVerId = `v-${fromWeek}-${oldToWeek}-${Date.now()}`;
        const newVerDoc: TimetableVersion = {
          id: newVerId,
          uid,
          academicYear,
          versionName: versionName || `Thời khóa biểu áp dụng từ tuần ${fromWeek}`,
          fromWeek,
          toWeek: oldToWeek,
          rules: newRules,
          createdAt: now,
          updatedAt: now,
          createdBy: uid,
        };
        batch.set(doc(db, 'teachers', uid, 'timetableVersions', newVerId), newVerDoc);
      } else if (yearVersions.length === 0) {
        if (fromWeek === 1) {
          // Simple case: single version covering 1-35
          const newVerId = `v-1-35-${Date.now()}`;
          const newVerDoc: TimetableVersion = {
            id: newVerId,
            uid,
            academicYear,
            versionName: versionName || 'Thời khóa biểu ban đầu',
            fromWeek: 1,
            toWeek: 35,
            rules: newRules,
            createdAt: now,
            updatedAt: now,
            createdBy: uid,
          };
          batch.set(doc(db, 'teachers', uid, 'timetableVersions', newVerId), newVerDoc);
        } else {
          // fromWeek > 1 and no version exists yet: create baseline (1..fromWeek-1) and new (fromWeek..35)
          const teacherSnap = await fetchTeacherProfileFromFirestore(uid);
          const baselineRules = teacherSnap?.rules || newRules;

          const v1Id = `v-1-${fromWeek - 1}-${Date.now()}`;
          const v1Doc: TimetableVersion = {
            id: v1Id,
            uid,
            academicYear,
            versionName: 'Thời khóa biểu ban đầu',
            fromWeek: 1,
            toWeek: fromWeek - 1,
            rules: baselineRules,
            createdAt: now,
            updatedAt: now,
            createdBy: uid,
          };
          batch.set(doc(db, 'teachers', uid, 'timetableVersions', v1Id), v1Doc);

          const v2Id = `v-${fromWeek}-35-${Date.now()}`;
          const v2Doc: TimetableVersion = {
            id: v2Id,
            uid,
            academicYear,
            versionName: versionName || `Thời khóa biểu áp dụng từ tuần ${fromWeek}`,
            fromWeek,
            toWeek: 35,
            rules: newRules,
            createdAt: now,
            updatedAt: now,
            createdBy: uid,
          };
          batch.set(doc(db, 'teachers', uid, 'timetableVersions', v2Id), v2Doc);
        }
      } else {
        // yearVersions.length > 0 but no version covers fromWeek
        const futureVersions = yearVersions.filter(v => v.fromWeek > fromWeek).sort((a, b) => a.fromWeek - b.fromWeek);
        const targetEndWeek = futureVersions.length > 0 ? futureVersions[0].fromWeek - 1 : 35;

        const newVerId = `v-${fromWeek}-${targetEndWeek}-${Date.now()}`;
        const newVerDoc: TimetableVersion = {
          id: newVerId,
          uid,
          academicYear,
          versionName: versionName || (fromWeek === 1 ? 'Thời khóa biểu ban đầu' : `Thời khóa biểu áp dụng từ tuần ${fromWeek}`),
          fromWeek,
          toWeek: targetEndWeek,
          rules: newRules,
          createdAt: now,
          updatedAt: now,
          createdBy: uid,
        };
        batch.set(doc(db, 'teachers', uid, 'timetableVersions', newVerId), newVerDoc);
      }
    }

    // Also sync rules snapshot in teachers/{uid}.rules for backward compatibility
    const teacherRef = doc(db, 'teachers', uid);
    batch.set(teacherRef, { rules: newRules, updatedAt: now }, { merge: true });

    // Commit batch
    await batch.commit();

    // Fetch and return updated list of versions
    return await fetchTimetableVersionsFromFirestore(uid);
  } catch (err) {
    console.error('FIRESTORE ERROR in saveOrSplitTimetableVersionInFirestore:', err);
    return await fetchTimetableVersionsFromFirestore(uid);
  }
};

// --- ACADEMIC YEAR CONFIG HELPERS (teachers/{uid}/academicYearConfigs/{academicYear}) ---
export const saveAcademicYearConfigToFirestore = async (uid: string, config: AcademicYearConfig): Promise<void> => {
  if (!uid || !config.academicYear) return;
  try {
    const ref = doc(db, 'teachers', uid, 'academicYearConfigs', config.academicYear);
    await setDoc(ref, {
      ...config,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    console.log('FIRESTORE SAVE ACADEMIC YEAR CONFIG SUCCESS', { uid, academicYear: config.academicYear });
  } catch (err) {
    console.error('FIRESTORE ERROR saving academicYearConfig:', err);
  }
};

export const fetchAcademicYearConfigFromFirestore = async (uid: string, academicYear: string): Promise<AcademicYearConfig | null> => {
  if (!uid || !academicYear) return null;
  try {
    const ref = doc(db, 'teachers', uid, 'academicYearConfigs', academicYear);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      return {
        academicYear: data.academicYear || academicYear,
        week1StartDate: data.week1StartDate || '2026-09-01',
        totalWeeks: Number(data.totalWeeks) || 35,
        customWeekMap: data.customWeekMap || undefined,
        updatedAt: data.updatedAt || new Date().toISOString()
      };
    }
  } catch (err) {
    console.error('FIRESTORE ERROR fetching academicYearConfig:', err);
  }
  return null;
};

// 2. PPCT Curriculums
export const savePPCTsToFirestore = async (uid: string, curriculums: PPCTCurriculum[]) => {
  console.log('FIRESTORE SAVE START', { collection: 'curriculums', uid, count: curriculums.length });
  if (!uid) {
    console.error('FIRESTORE ERROR', { collection: 'curriculums', uid, action: 'write', error: 'User UID is empty' });
    return;
  }
  try {
    const ref = doc(db, 'curriculums', uid);
    await setDoc(ref, { items: curriculums, updatedAt: new Date().toISOString() }, { merge: true });
    console.log('FIRESTORE SAVE SUCCESS', { collection: 'curriculums', uid });
  } catch (err) {
    console.error('FIRESTORE ERROR', { collection: 'curriculums', uid, action: 'write', error: err });
  }
};

export const fetchPPCTsFromFirestore = async (uid: string): Promise<PPCTCurriculum[] | null> => {
  console.log('FIRESTORE LOAD START', { collection: 'curriculums', uid });
  if (!uid) {
    console.error('FIRESTORE ERROR', { collection: 'curriculums', uid, action: 'read', error: 'User UID is empty' });
    return null;
  }
  try {
    const ref = doc(db, 'curriculums', uid);
    const snap = await getDoc(ref);
    const exists = snap.exists();
    console.log('FIRESTORE LOAD SUCCESS', { collection: 'curriculums', uid, dataFound: exists });
    if (exists) {
      const data = snap.data();
      return data.items || [];
    }
  } catch (err) {
    console.error('FIRESTORE ERROR', { collection: 'curriculums', uid, action: 'read', error: err });
  }
  return null;
};

// 3. Weekly Schedules
export const saveSchedulesToFirestore = async (uid: string, schedules: ScheduleItem[]) => {
  console.log('FIRESTORE SAVE START', { collection: 'weeklySchedules', uid, count: schedules.length });
  if (!uid) {
    console.error('FIRESTORE ERROR', { collection: 'weeklySchedules', uid, action: 'write', error: 'User UID is empty' });
    return;
  }
  try {
    const ref = doc(db, 'weeklySchedules', uid);
    await setDoc(ref, { items: schedules, updatedAt: new Date().toISOString() }, { merge: true });
    console.log('FIRESTORE SAVE SUCCESS', { collection: 'weeklySchedules', uid });
  } catch (err) {
    console.error('FIRESTORE ERROR', { collection: 'weeklySchedules', uid, action: 'write', error: err });
  }
};

export const fetchSchedulesFromFirestore = async (uid: string): Promise<ScheduleItem[] | null> => {
  console.log('FIRESTORE LOAD START', { collection: 'weeklySchedules', uid });
  if (!uid) {
    console.error('FIRESTORE ERROR', { collection: 'weeklySchedules', uid, action: 'read', error: 'User UID is empty' });
    return null;
  }
  try {
    const ref = doc(db, 'weeklySchedules', uid);
    const snap = await getDoc(ref);
    const exists = snap.exists();
    console.log('FIRESTORE LOAD SUCCESS', { collection: 'weeklySchedules', uid, dataFound: exists });
    if (exists) {
      const data = snap.data();
      return data.items || [];
    }
  } catch (err) {
    console.error('FIRESTORE ERROR', { collection: 'weeklySchedules', uid, action: 'read', error: err });
  }
  return null;
};

// 4. Custom Week Dates Map
export const saveCustomWeekDatesToFirestore = async (uid: string, map: CustomWeekDatesMap) => {
  console.log('FIRESTORE SAVE START', { collection: 'customWeekDates', uid, keysCount: Object.keys(map).length });
  if (!uid) {
    console.error('FIRESTORE ERROR', { collection: 'customWeekDates', uid, action: 'write', error: 'User UID is empty' });
    return;
  }
  try {
    const ref = doc(db, 'customWeekDates', uid);
    await setDoc(ref, { weekDatesMap: map, updatedAt: new Date().toISOString() }, { merge: true });
    console.log('FIRESTORE SAVE SUCCESS', { collection: 'customWeekDates', uid });
  } catch (err) {
    console.error('FIRESTORE ERROR', { collection: 'customWeekDates', uid, action: 'write', error: err });
  }
};

export const fetchCustomWeekDatesFromFirestore = async (uid: string): Promise<CustomWeekDatesMap | null> => {
  console.log('FIRESTORE LOAD START', { collection: 'customWeekDates', uid });
  if (!uid) {
    console.error('FIRESTORE ERROR', { collection: 'customWeekDates', uid, action: 'read', error: 'User UID is empty' });
    return null;
  }
  try {
    const ref = doc(db, 'customWeekDates', uid);
    const snap = await getDoc(ref);
    const exists = snap.exists();
    console.log('FIRESTORE LOAD SUCCESS', { collection: 'customWeekDates', uid, dataFound: exists });
    if (exists) {
      const data = snap.data();
      return data.weekDatesMap || null;
    }
  } catch (err) {
    console.error('FIRESTORE ERROR', { collection: 'customWeekDates', uid, action: 'read', error: err });
  }
  return null;
};

// 5. Print Settings (printSettings/{uid})
export const savePrintSettingsToFirestore = async (uid: string, settings: any) => {
  console.log('FIRESTORE SAVE START', { collection: 'printSettings', uid });
  if (!uid) {
    console.error('FIRESTORE ERROR', { collection: 'printSettings', uid, action: 'write', error: 'User UID is empty' });
    return;
  }
  try {
    const ref = doc(db, 'printSettings', uid);
    await setDoc(ref, { settings, updatedAt: new Date().toISOString() }, { merge: true });
    console.log('FIRESTORE SAVE SUCCESS', { collection: 'printSettings', uid });
  } catch (err) {
    console.error('FIRESTORE ERROR', { collection: 'printSettings', uid, action: 'write', error: err });
  }
};

export const fetchPrintSettingsFromFirestore = async (uid: string): Promise<any | null> => {
  console.log('FIRESTORE LOAD START', { collection: 'printSettings', uid });
  if (!uid) {
    console.error('FIRESTORE ERROR', { collection: 'printSettings', uid, action: 'read', error: 'User UID is empty' });
    return null;
  }
  try {
    const ref = doc(db, 'printSettings', uid);
    const snap = await getDoc(ref);
    const exists = snap.exists();
    console.log('FIRESTORE LOAD SUCCESS', { collection: 'printSettings', uid, dataFound: exists });
    if (exists) {
      const data = snap.data();
      return data.settings || null;
    }
  } catch (err) {
    console.error('FIRESTORE ERROR', { collection: 'printSettings', uid, action: 'read', error: err });
  }
  return null;
};


// --- SHARED CURRICULUM LIBRARY HELPERS (curriculumLibrary/{curriculumId}) ---

export const saveSharedCurriculum = async (curriculum: SharedCurriculum): Promise<void> => {
  const currentUser = auth.currentUser;
  const updatedBy = currentUser?.uid || curriculum.updatedBy || 'admin';
  const id = curriculum.id;

  if (!id) {
    console.error('FIRESTORE ERROR: curriculumId is required');
    return;
  }

  try {
    const ref = doc(db, 'curriculumLibrary', id);
    const dataToSave = {
      ...curriculum,
      updatedBy,
      updatedAt: new Date().toISOString(),
      createdAt: curriculum.createdAt || new Date().toISOString()
    };
    await setDoc(ref, dataToSave, { merge: true });
    console.log('FIRESTORE SAVE SUCCESS', { collection: 'curriculumLibrary', id });
  } catch (err) {
    console.error('FIRESTORE ERROR', { collection: 'curriculumLibrary', id, action: 'write', error: err });
    throw err;
  }
};

export const fetchSharedCurriculums = async (): Promise<SharedCurriculum[]> => {
  try {
    const ref = collection(db, 'curriculumLibrary');
    const snap = await getDocs(ref);
    const items: SharedCurriculum[] = [];
    snap.forEach((docSnap) => {
      items.push({
        id: docSnap.id,
        ...docSnap.data()
      } as SharedCurriculum);
    });
    console.log('FIRESTORE LOAD SUCCESS', { collection: 'curriculumLibrary', count: items.length });
    return items;
  } catch (err) {
    console.error('FIRESTORE ERROR', { collection: 'curriculumLibrary', action: 'read', error: err });
    return [];
  }
};

export const fetchSharedCurriculumById = async (curriculumId: string): Promise<SharedCurriculum | null> => {
  if (!curriculumId) return null;
  try {
    const ref = doc(db, 'curriculumLibrary', curriculumId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as SharedCurriculum;
    }
  } catch (err) {
    console.error('FIRESTORE ERROR', { collection: 'curriculumLibrary', id: curriculumId, action: 'read', error: err });
  }
  return null;
};

export const updateSharedCurriculum = async (curriculumId: string, data: Partial<SharedCurriculum>): Promise<void> => {
  if (!curriculumId) return;
  const currentUser = auth.currentUser;
  try {
    const ref = doc(db, 'curriculumLibrary', curriculumId);
    await setDoc(ref, {
      ...data,
      updatedBy: currentUser?.uid || 'admin',
      updatedAt: new Date().toISOString()
    }, { merge: true });
    console.log('FIRESTORE UPDATE SUCCESS', { collection: 'curriculumLibrary', id: curriculumId });
  } catch (err) {
    console.error('FIRESTORE ERROR', { collection: 'curriculumLibrary', id: curriculumId, action: 'update', error: err });
    throw err;
  }
};

export const deleteSharedCurriculum = async (curriculumId: string): Promise<void> => {
  if (!curriculumId) return;
  try {
    const ref = doc(db, 'curriculumLibrary', curriculumId);
    await deleteDoc(ref);
    console.log('FIRESTORE DELETE SUCCESS', { collection: 'curriculumLibrary', id: curriculumId });
  } catch (err) {
    console.error('FIRESTORE ERROR', { collection: 'curriculumLibrary', id: curriculumId, action: 'delete', error: err });
    throw err;
  }
};


// --- TEACHER-SPECIFIC CURRICULUM DATA HELPERS (teacherCurriculumData/{uid}) ---

export const fetchTeacherCurriculumData = async (uid: string): Promise<TeacherCurriculumData | null> => {
  if (!uid) return null;
  try {
    const ref = doc(db, 'teacherCurriculumData', uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      return {
        uid,
        curriculumSelections: data.curriculumSelections || [],
        lessonProgress: data.lessonProgress || [],
        customLessons: data.customLessons || [],
        notes: data.notes || [],
        updatedAt: data.updatedAt
      };
    }
  } catch (err) {
    console.error('FIRESTORE ERROR', { collection: 'teacherCurriculumData', uid, action: 'read', error: err });
  }
  return null;
};

export const saveTeacherCurriculumData = async (uid: string, data: Partial<TeacherCurriculumData>): Promise<void> => {
  if (!uid) return;
  try {
    const ref = doc(db, 'teacherCurriculumData', uid);
    const payload = {
      ...data,
      uid,
      updatedAt: new Date().toISOString()
    };
    await setDoc(ref, payload, { merge: true });
    console.log('FIRESTORE SAVE SUCCESS', { collection: 'teacherCurriculumData', uid });
  } catch (err) {
    console.error('FIRESTORE ERROR', { collection: 'teacherCurriculumData', uid, action: 'write', error: err });
    throw err;
  }
};

export const selectCurriculumForTeacher = async (uid: string, curriculumId: string): Promise<void> => {
  if (!uid || !curriculumId) return;
  const current = await fetchTeacherCurriculumData(uid);
  const selections = current?.curriculumSelections || [];
  const existingIdx = selections.findIndex(s => s.curriculumId === curriculumId);
  const now = new Date().toISOString();

  let updatedSelections = [...selections];
  if (existingIdx >= 0) {
    updatedSelections[existingIdx] = { curriculumId, selectedAt: now };
  } else {
    updatedSelections.push({ curriculumId, selectedAt: now });
  }

  await saveTeacherCurriculumData(uid, {
    curriculumSelections: updatedSelections
  });
};

export const saveLessonProgress = async (
  uid: string,
  curriculumId: string,
  lessonId: string,
  status: string,
  taughtAt?: string | null
): Promise<void> => {
  if (!uid || !curriculumId || !lessonId) return;
  const current = await fetchTeacherCurriculumData(uid);
  const progressList = current?.lessonProgress || [];
  const existingIdx = progressList.findIndex(p => p.curriculumId === curriculumId && p.lessonId === lessonId);

  const newProgressItem: TeacherLessonProgress = {
    curriculumId,
    lessonId,
    status,
    taughtAt: taughtAt || new Date().toISOString()
  };

  let updatedProgress = [...progressList];
  if (existingIdx >= 0) {
    updatedProgress[existingIdx] = newProgressItem;
  } else {
    updatedProgress.push(newProgressItem);
  }

  await saveTeacherCurriculumData(uid, {
    lessonProgress: updatedProgress
  });
};

export const saveTeacherCustomLesson = async (
  uid: string,
  customLessonData: TeacherCustomLesson
): Promise<void> => {
  if (!uid || !customLessonData.curriculumId) return;
  const current = await fetchTeacherCurriculumData(uid);
  const customLessons = current?.customLessons || [];
  const now = new Date().toISOString();

  const existingIdx = customLessons.findIndex(
    cl => cl.curriculumId === customLessonData.curriculumId && 
          cl.sourceLessonId === customLessonData.sourceLessonId &&
          cl.title === customLessonData.title
  );

  let updatedCustomLessons = [...customLessons];
  if (existingIdx >= 0) {
    updatedCustomLessons[existingIdx] = {
      ...customLessonData,
      updatedAt: now
    };
  } else {
    updatedCustomLessons.push({
      ...customLessonData,
      createdAt: now,
      updatedAt: now
    });
  }

  await saveTeacherCurriculumData(uid, {
    customLessons: updatedCustomLessons
  });
};

export const saveTeacherCurriculumNote = async (
  uid: string,
  curriculumId: string,
  lessonId: string,
  note: string
): Promise<void> => {
  if (!uid || !curriculumId || !lessonId) return;
  const current = await fetchTeacherCurriculumData(uid);
  const notesList = current?.notes || [];
  const existingIdx = notesList.findIndex(n => n.curriculumId === curriculumId && n.lessonId === lessonId);

  const newNoteItem: TeacherCurriculumNote = {
    curriculumId,
    lessonId,
    note
  };

  let updatedNotes = [...notesList];
  if (existingIdx >= 0) {
    updatedNotes[existingIdx] = newNoteItem;
  } else {
    updatedNotes.push(newNoteItem);
  }

  await saveTeacherCurriculumData(uid, {
    notes: updatedNotes
  });
};


// --- REAL FIRESTORE WRITE TEST FUNCTION ---
export const testFirestoreWrite = async (): Promise<{ success: boolean; message: string; error?: any }> => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    const msg = "LỖI: Chưa đăng nhập Google! Vui lòng đăng nhập trước khi kiểm tra.";
    console.error("FIRESTORE REAL WRITE ERROR:", msg);
    return { success: false, message: msg };
  }

  const uid = currentUser.uid;
  console.log("FIRESTORE REAL WRITE START", { uid, projectId: firebaseConfig.projectId, docPath: `debug/${uid}` });

  try {
    const ref = doc(db, 'debug', uid);
    await setDoc(ref, {
      test: true,
      message: "Firestore connection test",
      uid: uid,
      projectId: "lichbaogiang-20939",
      createdAt: serverTimestamp()
    });
    console.log("FIRESTORE REAL WRITE SUCCESS", { docPath: `debug/${uid}` });
    return { 
      success: true, 
      message: `FIRESTORE REAL WRITE SUCCESS!\nĐã ghi thành công document: debug/${uid}\nProject ID: ${firebaseConfig.projectId}\n\nHãy vào Firebase Console -> lichbaogiang-20939 -> Firestore Database -> Data -> collection "debug" -> document "${uid}" để xác nhận.` 
    };
  } catch (err: any) {
    console.error("FIRESTORE REAL WRITE ERROR:", err);
    const errCode = err?.code || 'unknown';
    const errDetails = err?.message || String(err);
    return { 
      success: false, 
      message: `FIRESTORE REAL WRITE ERROR [${errCode}]:\n${errDetails}`, 
      error: err 
    };
  }
};

export { onAuthStateChanged };
export type { User };

