import { 
  db,
  firebaseConfig 
} from '../lib/firebase';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut as secondarySignOut, updateProfile } from 'firebase/auth';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp,
  addDoc
} from 'firebase/firestore';
import { 
  AppUser, 
  UserRole, 
  UserStatus, 
  SystemConfig, 
  SystemLog, 
  TeacherUsageStats 
} from '../types';

const DEFAULT_SYSTEM_CONFIG: SystemConfig = {
  appName: 'Lịch báo giảng Tiểu học',
  schoolName: 'Trường Tiểu học',
  defaultAcademicYear: '2026-2027',
  supportEmail: 'admin@truongtieuhoc.edu.vn',
  supportPhone: '0901234567',
  contactEmail: 'admin@truongtieuhoc.edu.vn',
  contactPhone: '0901234567',
  systemAnnouncement: 'Hệ thống Quản lý Lịch báo giảng Tiểu học vận hành chính thức.',
  announcement: 'Hệ thống Quản lý Lịch báo giảng Tiểu học vận hành chính thức.',
  updatedAt: new Date().toISOString()
};

/**
 * Đếm số lượng Admin đang hoạt động
 */
export async function getActiveAdminCount(): Promise<number> {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', '==', 'admin'), where('status', '==', 'active'));
    const snap = await getDocs(q);
    return snap.size;
  } catch (e) {
    return 1;
  }
}

/**
 * Lấy danh sách tất cả người dùng trong hệ thống (chỉ Admin)
 */
export async function getAllUsers(): Promise<AppUser[]> {
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    const list: AppUser[] = [];

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      let teacherCode = data.teacherCode || '';
      
      // Fallback: Nếu không có mã trong user doc, đọc từ teachers/{uid}
      if (!teacherCode) {
        try {
          const tDoc = await getDoc(doc(db, 'teachers', docSnap.id));
          if (tDoc.exists()) {
            teacherCode = tDoc.data().teacherCode || '';
          }
        } catch (e) {
          // Ignore fallback errors
        }
      }

      list.push({
        uid: docSnap.id,
        displayName: data.displayName || data.email || 'Giáo viên',
        email: data.email || '',
        teacherCode: teacherCode,
        role: (data.role as UserRole) || 'teacher',
        status: (data.status as UserStatus) || 'active',
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
        lastLoginAt: data.lastLoginAt?.toDate ? data.lastLoginAt.toDate().toISOString() : data.lastLoginAt
      });
    }

    // Sắp xếp người dùng mới nhất lên đầu
    list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    return list;
  } catch (err) {
    console.error('Error fetching users list:', err);
    return [];
  }
}

/**
 * Admin Tạo tài khoản giáo viên mới qua Firebase Auth & Firestore
 */
export async function createTeacherAccount(
  data: {
    displayName: string;
    email: string;
    teacherCode?: string;
    password: string;
    role: UserRole;
    status: UserStatus;
  },
  performer: { uid: string; displayName?: string; email?: string }
): Promise<{ success: boolean; message?: string; newUid?: string }> {
  let secondaryApp: any = null;
  try {
    // 1. Tạo instance Firebase App phụ để khởi tạo Auth user mà không làm gián đoạn phiên Admin hiện tại
    const appName = `SecondaryAuthApp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    secondaryApp = initializeApp(firebaseConfig, appName);
    const secondaryAuth = getAuth(secondaryApp);

    // 2. Tạo tài khoản trong Auth
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, data.email.trim(), data.password);
    const newUid = userCredential.user.uid;

    try {
      await updateProfile(userCredential.user, { displayName: data.displayName.trim() });
    } catch (e) {
      console.warn('Could not set displayName on secondary auth user:', e);
    }

    // 3. Đăng xuất khỏi secondary auth
    await secondarySignOut(secondaryAuth);

    // 4. Tạo các tài liệu cần thiết trên Firestore (users/{uid} & teachers/{uid})
    const nowISO = new Date().toISOString();

    // Doc 1: users/{newUid}
    const userRef = doc(db, 'users', newUid);
    await setDoc(userRef, {
      uid: newUid,
      displayName: data.displayName.trim(),
      email: data.email.trim().toLowerCase(),
      teacherCode: data.teacherCode?.trim() || '',
      role: data.role || 'teacher',
      status: data.status || 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLoginAt: null
    });

    // Doc 2: teachers/{newUid} (Profile cơ bản)
    const teacherRef = doc(db, 'teachers', newUid);
    await setDoc(teacherRef, {
      uid: newUid,
      fullName: data.displayName.trim(),
      email: data.email.trim().toLowerCase(),
      teacherCode: data.teacherCode?.trim() || '',
      schoolName: 'Trường Tiểu học',
      subjects: [],
      grades: [],
      assignedClasses: [],
      academicYear: '2026-2027',
      semester: 'Học kỳ I'
    });

    // 5. Ghi nhật ký hệ thống
    await logSystemActivity({
      uid: performer.uid,
      adminUid: performer.uid,
      performerName: performer.displayName || performer.email || 'Admin',
      performerEmail: performer.email || '',
      action: 'CREATE_TEACHER',
      actionLabel: 'Tạo tài khoản giáo viên',
      targetUid: newUid,
      targetUserId: newUid,
      targetUserName: data.displayName.trim(),
      targetUserEmail: data.email.trim().toLowerCase(),
      details: `Đã tạo tài khoản giáo viên mới: ${data.displayName.trim()} (${data.email.trim()}) - Mã GV: ${data.teacherCode || 'Chưa đặt'}`,
      timestamp: nowISO
    });

    return { success: true, newUid };
  } catch (err: any) {
    console.error('Error creating teacher account:', err);
    let errMsg = 'Đã xảy ra lỗi khi tạo tài khoản.';
    if (err.code === 'auth/email-already-in-use') {
      errMsg = 'Email này đã được đăng ký cho một tài khoản khác trong hệ thống.';
    } else if (err.code === 'auth/weak-password') {
      errMsg = 'Mật khẩu quá yếu. Vui lòng nhập ít nhất 6 ký tự.';
    } else if (err.code === 'auth/invalid-email') {
      errMsg = 'Địa chỉ email không đúng định dạng.';
    } else if (err.message) {
      errMsg = err.message;
    }
    return { success: false, message: errMsg };
  } finally {
    if (secondaryApp) {
      try {
        await deleteApp(secondaryApp);
      } catch (e) {
        // Ignore app deletion errors
      }
    }
  }
}

/**
 * Lấy thống kê chi tiết sử dụng dữ liệu của một Giáo viên (Read-Only)
 */
export async function getTeacherUsageStats(teacherUid: string): Promise<TeacherUsageStats> {
  try {
    let teacherCode = '';
    let academicYearInUse = '2026-2027';

    try {
      const tDoc = await getDoc(doc(db, 'teachers', teacherUid));
      if (tDoc.exists()) {
        const d = tDoc.data();
        teacherCode = d.teacherCode || '';
        academicYearInUse = d.academicYear || '2026-2027';
      }
    } catch (e) {
      console.warn('Could not fetch teacher profile doc:', e);
    }

    // 1. Đếm số phiên bản Thời khóa biểu
    let timetableVersionsCount = 0;
    try {
      const versionsRef = collection(db, 'teachers', teacherUid, 'timetableVersions');
      const verSnap = await getDocs(versionsRef);
      timetableVersionsCount = verSnap.size;
    } catch (e) {
      console.warn('Could not fetch teacher timetable versions count:', e);
    }

    // 2. Đếm số lịch báo giảng
    let scheduleItemsCount = 0;
    try {
      const schedulesRef = collection(db, 'weeklySchedules');
      const q = query(schedulesRef, where('teacherId', '==', teacherUid));
      const schedSnap = await getDocs(q);
      scheduleItemsCount = schedSnap.size;
    } catch (e) {
      console.warn('Could not fetch teacher schedules count:', e);
    }

    // 3. Đếm số Phân phối chương trình
    let ppctCurriculumsCount = 0;
    try {
      const ppctRef = collection(db, 'curriculums');
      const qPPCT = query(ppctRef, where('teacherId', '==', teacherUid));
      const ppctSnap = await getDocs(qPPCT);
      ppctCurriculumsCount = ppctSnap.size;
    } catch (e) {
      console.warn('Could not fetch teacher PPCT count:', e);
    }

    // 4. Kiểm tra cấu hình tuần học đã lưu
    let academicWeeksConfiguredCount = 0;
    try {
      const configsRef = collection(db, 'teachers', teacherUid, 'academicYearConfigs');
      const confSnap = await getDocs(configsRef);
      academicWeeksConfiguredCount = confSnap.size > 0 ? 35 : 0;
    } catch (e) {
      console.warn('Could not fetch academic configs count:', e);
    }

    return {
      teacherUid,
      teacherCode,
      academicYearInUse,
      timetableVersionsCount,
      academicWeeksConfiguredCount,
      scheduleItemsCount,
      ppctCurriculumsCount
    };
  } catch (err) {
    console.error('Error fetching teacher stats:', err);
    return {
      teacherUid,
      timetableVersionsCount: 0,
      academicWeeksConfiguredCount: 0,
      scheduleItemsCount: 0,
      ppctCurriculumsCount: 0
    };
  }
}

/**
 * Khóa hoặc Mở khóa tài khoản giáo viên (Bảo vệ Admin cuối cùng)
 */
export async function toggleUserStatus(
  targetUser: AppUser,
  newStatus: UserStatus,
  performer: { uid: string; displayName?: string; email?: string }
): Promise<{ success: boolean; message?: string }> {
  try {
    // Bảo vệ không cho Admin tự khóa chính tài khoản của mình
    if (performer.uid === targetUser.uid && newStatus === 'disabled') {
      return {
        success: false,
        message: 'Bạn không thể tự khóa tài khoản Admin đang đăng nhập của chính mình!'
      };
    }

    // Kiểm tra bảo vệ Admin cuối cùng
    if (targetUser.role === 'admin' && newStatus === 'disabled') {
      const activeAdminCount = await getActiveAdminCount();
      if (activeAdminCount <= 1) {
        return { 
          success: false, 
          message: 'Không thể khóa Quản trị viên duy nhất của hệ thống! Hệ thống phải giữ ít nhất một Admin hoạt động.' 
        };
      }
    }

    const userRef = doc(db, 'users', targetUser.uid);
    await updateDoc(userRef, {
      status: newStatus,
      updatedAt: serverTimestamp()
    });

    // Ghi nhật ký hệ thống
    const action = newStatus === 'disabled' ? 'DISABLE_TEACHER' : 'ENABLE_TEACHER';
    const actionLabel = newStatus === 'disabled' ? 'Khóa tài khoản' : 'Mở khóa tài khoản';
    await logSystemActivity({
      uid: performer.uid,
      adminUid: performer.uid,
      performerName: performer.displayName || performer.email || 'Admin',
      performerEmail: performer.email || '',
      action,
      actionLabel,
      targetUid: targetUser.uid,
      targetUserId: targetUser.uid,
      targetUserName: targetUser.displayName,
      targetUserEmail: targetUser.email,
      details: `${actionLabel}: ${targetUser.displayName} (${targetUser.email})`,
      timestamp: new Date().toISOString()
    });

    return { success: true };
  } catch (err: any) {
    console.error('Error toggling user status:', err);
    return { success: false, message: err.message || 'Không thể thay đổi trạng thái tài khoản.' };
  }
}

/**
 * Thay đổi Vai trò người dùng (Chỉ Admin, Bảo vệ Admin cuối cùng)
 */
export async function updateUserRole(
  targetUser: AppUser,
  newRole: UserRole,
  performer: { uid: string; displayName?: string; email?: string }
): Promise<{ success: boolean; message?: string }> {
  try {
    // Bảo vệ không cho Admin tự hạ quyền của chính mình về Teacher
    if (performer.uid === targetUser.uid && newRole === 'teacher') {
      return {
        success: false,
        message: 'Bạn không thể tự hạ quyền Admin của chính mình về Giáo viên!'
      };
    }

    // Kiểm tra bảo vệ Admin cuối cùng
    if (targetUser.role === 'admin' && newRole === 'teacher') {
      const activeAdminCount = await getActiveAdminCount();
      if (activeAdminCount <= 1) {
        return { 
          success: false, 
          message: 'Không thể hạ quyền Quản trị viên duy nhất của hệ thống về Giáo viên! Hệ thống phải có ít nhất một Admin.' 
        };
      }
    }

    const userRef = doc(db, 'users', targetUser.uid);
    await updateDoc(userRef, {
      role: newRole,
      updatedAt: serverTimestamp()
    });

    await logSystemActivity({
      uid: performer.uid,
      adminUid: performer.uid,
      performerName: performer.displayName || performer.email || 'Admin',
      performerEmail: performer.email || '',
      action: 'CHANGE_ROLE',
      actionLabel: 'Phân quyền tài khoản',
      targetUid: targetUser.uid,
      targetUserId: targetUser.uid,
      targetUserName: targetUser.displayName,
      targetUserEmail: targetUser.email,
      details: `Đổi vai trò người dùng ${targetUser.displayName} (${targetUser.email}) thành ${newRole.toUpperCase()}`,
      timestamp: new Date().toISOString()
    });

    return { success: true };
  } catch (err: any) {
    console.error('Error updating user role:', err);
    return { success: false, message: err.message || 'Không thể phân quyền người dùng.' };
  }
}

/**
 * Lấy cấu hình chung hệ thống từ systemConfig/app
 */
export async function fetchSystemConfig(): Promise<SystemConfig> {
  try {
    let docRef = doc(db, 'systemConfig', 'app');
    let docSnap = await getDoc(docRef);
    
    // Fallback nếu chưa tạo systemConfig/app
    if (!docSnap.exists()) {
      docRef = doc(db, 'systemConfig', 'default');
      docSnap = await getDoc(docRef);
    }

    if (docSnap.exists()) {
      const data = docSnap.data();
      const supportEmail = data.supportEmail || data.contactEmail || DEFAULT_SYSTEM_CONFIG.supportEmail || '';
      const supportPhone = data.supportPhone || data.contactPhone || DEFAULT_SYSTEM_CONFIG.supportPhone || '';
      const systemAnnouncement = data.systemAnnouncement !== undefined 
        ? data.systemAnnouncement 
        : (data.announcement !== undefined ? data.announcement : DEFAULT_SYSTEM_CONFIG.systemAnnouncement);

      return {
        ...DEFAULT_SYSTEM_CONFIG,
        ...data,
        supportEmail,
        supportPhone,
        contactEmail: supportEmail,
        contactPhone: supportPhone,
        systemAnnouncement,
        announcement: systemAnnouncement
      } as SystemConfig;
    }
  } catch (err) {
    console.error('Error fetching system config:', err);
  }
  return DEFAULT_SYSTEM_CONFIG;
}

/**
 * Lưu cấu hình chung hệ thống vào systemConfig/app (Chỉ Admin)
 */
export async function saveSystemConfig(
  config: SystemConfig,
  performer: { uid: string; displayName?: string; email?: string }
): Promise<{ success: boolean; message?: string }> {
  try {
    const configRef = doc(db, 'systemConfig', 'app');
    const nowISO = new Date().toISOString();

    const emailToSave = (config.supportEmail || config.contactEmail || '').trim();
    const phoneToSave = (config.supportPhone || config.contactPhone || '').trim();
    const announcementToSave = (config.systemAnnouncement !== undefined ? config.systemAnnouncement : (config.announcement || '')).trim();

    const updatedData = {
      appName: config.appName.trim(),
      schoolName: config.schoolName.trim(),
      defaultAcademicYear: config.defaultAcademicYear.trim(),
      supportEmail: emailToSave,
      supportPhone: phoneToSave,
      systemAnnouncement: announcementToSave,
      contactEmail: emailToSave,
      contactPhone: phoneToSave,
      announcement: announcementToSave,
      updatedAt: nowISO,
      updatedBy: performer.uid
    };

    await setDoc(configRef, updatedData, { merge: true });

    // Ghi nhật ký hệ thống UPDATE_SYSTEM_CONFIG
    await logSystemActivity({
      uid: performer.uid,
      adminUid: performer.uid,
      performerName: performer.displayName || performer.email || 'Admin',
      performerEmail: performer.email || '',
      action: 'UPDATE_SYSTEM_CONFIG',
      actionLabel: 'Cập nhật Cấu hình Hệ thống',
      details: `Đã cập nhật Cấu hình Hệ thống: App="${config.appName.trim()}", Trường="${config.schoolName.trim()}", Năm học Mặc định="${config.defaultAcademicYear.trim()}"`,
      timestamp: nowISO
    });

    return { success: true };
  } catch (err: any) {
    console.error('Error saving system config:', err);
    return { success: false, message: err.message || 'Không thể lưu cấu hình hệ thống.' };
  }
}

/**
 * Ghi nhật ký hoạt động hệ thống
 */
export async function logSystemActivity(entry: Omit<SystemLog, 'id'>): Promise<void> {
  try {
    const logsRef = collection(db, 'systemLogs');
    await addDoc(logsRef, {
      ...entry,
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.error('Failed to log system activity:', err);
  }
}

/**
 * Lấy nhật ký hoạt động hệ thống (Chỉ Admin)
 */
export async function fetchSystemLogs(limitCount: number = 500): Promise<SystemLog[]> {
  try {
    const logsRef = collection(db, 'systemLogs');
    const q = query(logsRef, orderBy('createdAt', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);
    const logs: SystemLog[] = [];

    snapshot.forEach(docSnap => {
      const d = docSnap.data();
      logs.push({
        id: docSnap.id,
        uid: d.uid || '',
        adminUid: d.adminUid || d.uid || '',
        performerName: d.performerName || 'Hệ thống',
        performerEmail: d.performerEmail || '',
        action: d.action || 'login',
        actionLabel: d.actionLabel || d.action,
        targetUid: d.targetUid || d.targetUserId,
        targetUserId: d.targetUserId || d.targetUid,
        targetUserName: d.targetUserName,
        targetUserEmail: d.targetUserEmail,
        details: d.details || '',
        timestamp: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : d.timestamp || new Date().toISOString(),
        metadata: d.metadata
      });
    });

    return logs;
  } catch (err) {
    console.error('Error fetching system logs:', err);
    return [];
  }
}

/**
 * Lấy dữ liệu tổng hợp mức độ sử dụng hệ thống của tất cả giáo viên (Chỉ đếm số lượng, KHÔNG hiển thị nội dung cá nhân)
 */
export async function fetchSystemUsageOverview() {
  try {
    const users = await getAllUsers();
    
    // Lấy danh sách teacherIds có Lịch báo giảng
    let teachersWithSchedulesCount = 0;
    try {
      const schedulesRef = collection(db, 'weeklySchedules');
      const schedSnap = await getDocs(schedulesRef);
      const uniqueTeacherIds = new Set<string>();
      schedSnap.forEach(docSnap => {
        const d = docSnap.data();
        const tId = d.teacherId || d.teacherUid || d.uid;
        if (tId) uniqueTeacherIds.add(tId);
      });
      teachersWithSchedulesCount = uniqueTeacherIds.size;
    } catch (e) {
      console.warn('Could not fetch weeklySchedules count:', e);
    }

    // Đếm số giáo viên đã tạo TKB & cấu hình tuần học
    const teachers = users.filter(u => u.role === 'teacher');
    
    const teacherChecks = await Promise.all(
      teachers.map(async (t) => {
        let hasTimetable = false;
        let hasAcademicWeeks = false;
        try {
          const verSnap = await getDocs(collection(db, 'teachers', t.uid, 'timetableVersions'));
          hasTimetable = !verSnap.empty;
        } catch (e) {}
        try {
          const confSnap = await getDocs(collection(db, 'teachers', t.uid, 'academicYearConfigs'));
          hasAcademicWeeks = !confSnap.empty;
        } catch (e) {}
        return { hasTimetable, hasAcademicWeeks };
      })
    );

    const teachersWithTimetableCount = teacherChecks.filter(c => c.hasTimetable).length;
    const teachersWithAcademicWeeksCount = teacherChecks.filter(c => c.hasAcademicWeeks).length;

    return {
      users,
      teachersWithSchedulesCount,
      teachersWithTimetableCount,
      teachersWithAcademicWeeksCount
    };
  } catch (err) {
    console.error('Error fetching system usage overview:', err);
    return {
      users: [],
      teachersWithSchedulesCount: 0,
      teachersWithTimetableCount: 0,
      teachersWithAcademicWeeksCount: 0
    };
  }
}
