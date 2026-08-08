import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc,
  serverTimestamp
} from 'firebase/firestore';
import { TeacherProfile, PPCTCurriculum, ScheduleItem, ClassTimetableRule } from '../types';
import { CustomWeekDatesMap } from '../utils/dateWeekUtils';

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

const firebaseConfig = {
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY || firebaseConfigData.apiKey || "AIzaSyC1SHw71JjSNFK80nEaGbFj4MA6zPwsgCE",
  authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigData.authDomain || "lichbaogiang-20939.firebaseapp.com",
  projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || firebaseConfigData.projectId || "lichbaogiang-20939",
  storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigData.storageBucket || "lichbaogiang-20939.firebasestorage.app",
  messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigData.messagingSenderId || "481171704495",
  appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID || firebaseConfigData.appId || "1:481171704495:web:c7f969153f0337a7d9225a",
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

export const logoutUser = async () => {
  try {
    await firebaseSignOut(auth);
    console.log('AUTH USER LOGOUT SUCCESS');
  } catch (error) {
    console.error("Sign out error:", error);
  }
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
    await setDoc(ref, { profile, rules: rules || null, updatedAt: new Date().toISOString() }, { merge: true });
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
      return { profile: data.profile || null, rules: data.rules || null };
    }
  } catch (err) {
    console.error('FIRESTORE ERROR', { collection: 'teachers', uid, action: 'read', error: err });
  }
  return { profile: null, rules: null };
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

