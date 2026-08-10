import { 
  db 
} from '../lib/firebase';
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
  contactEmail: 'admin@truongtieuhoc.edu.vn',
  contactPhone: '0901234567',
  announcement: 'Hệ thống Quản lý Lịch báo giảng Tiểu học vận hành chính thức. Chúc Quý Thầy Cô một năm học mới nhiều thành công!',
  updatedAt: new Date().toISOString()
};

/**
 * Lấy danh sách tất cả người dùng trong hệ thống (chỉ Admin)
 */
export async function getAllUsers(): Promise<AppUser[]> {
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    const list: AppUser[] = [];

    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      list.push({
        uid: docSnap.id,
        displayName: data.displayName || data.email || 'Giáo viên',
        email: data.email || '',
        role: (data.role as UserRole) || 'teacher',
        status: (data.status as UserStatus) || 'active',
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
        lastLoginAt: data.lastLoginAt?.toDate ? data.lastLoginAt.toDate().toISOString() : data.lastLoginAt
      });
    });

    // Sắp xếp người dùng mới nhất lên đầu
    list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    return list;
  } catch (err) {
    console.error('Error fetching users list:', err);
    return [];
  }
}

/**
 * Lấy thống kê chi tiết sử dụng dữ liệu của một Giáo viên (Read-Only)
 */
export async function getTeacherUsageStats(teacherUid: string): Promise<TeacherUsageStats> {
  try {
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
 * Khóa hoặc Mở khóa tài khoản giáo viên
 */
export async function toggleUserStatus(
  targetUser: AppUser,
  newStatus: UserStatus,
  performer: { uid: string; displayName?: string; email?: string }
): Promise<boolean> {
  try {
    const userRef = doc(db, 'users', targetUser.uid);
    await updateDoc(userRef, {
      status: newStatus,
      updatedAt: serverTimestamp()
    });

    // Ghi nhật ký hệ thống
    const action = newStatus === 'disabled' ? 'lock_user' : 'unlock_user';
    const actionLabel = newStatus === 'disabled' ? 'Khóa tài khoản' : 'Mở khóa tài khoản';
    await logSystemActivity({
      uid: performer.uid,
      performerName: performer.displayName || performer.email || 'Admin',
      performerEmail: performer.email || '',
      action,
      actionLabel,
      targetUserId: targetUser.uid,
      targetUserName: targetUser.displayName,
      targetUserEmail: targetUser.email,
      details: `${actionLabel}: ${targetUser.displayName} (${targetUser.email})`,
      timestamp: new Date().toISOString()
    });

    return true;
  } catch (err) {
    console.error('Error toggling user status:', err);
    return false;
  }
}

/**
 * Thay đổi Vai trò người dùng (Chỉ Admin)
 */
export async function updateUserRole(
  targetUser: AppUser,
  newRole: UserRole,
  performer: { uid: string; displayName?: string; email?: string }
): Promise<boolean> {
  try {
    const userRef = doc(db, 'users', targetUser.uid);
    await updateDoc(userRef, {
      role: newRole,
      updatedAt: serverTimestamp()
    });

    await logSystemActivity({
      uid: performer.uid,
      performerName: performer.displayName || performer.email || 'Admin',
      performerEmail: performer.email || '',
      action: 'change_role',
      actionLabel: 'Phân quyền tài khoản',
      targetUserId: targetUser.uid,
      targetUserName: targetUser.displayName,
      targetUserEmail: targetUser.email,
      details: `Đổi vai trò người dùng ${targetUser.displayName} thành ${newRole.toUpperCase()}`,
      timestamp: new Date().toISOString()
    });

    return true;
  } catch (err) {
    console.error('Error updating user role:', err);
    return false;
  }
}

/**
 * Lấy cấu hình chung hệ thống
 */
export async function fetchSystemConfig(): Promise<SystemConfig> {
  try {
    const configRef = doc(db, 'systemConfig', 'default');
    const docSnap = await getDoc(configRef);
    if (docSnap.exists()) {
      return {
        ...DEFAULT_SYSTEM_CONFIG,
        ...docSnap.data()
      } as SystemConfig;
    }
  } catch (err) {
    console.error('Error fetching system config:', err);
  }
  return DEFAULT_SYSTEM_CONFIG;
}

/**
 * Lưu cấu hình chung hệ thống (Chỉ Admin)
 */
export async function saveSystemConfig(
  config: SystemConfig,
  performer: { uid: string; displayName?: string; email?: string }
): Promise<boolean> {
  try {
    const configRef = doc(db, 'systemConfig', 'default');
    const updated = {
      ...config,
      updatedAt: new Date().toISOString(),
      updatedBy: performer.uid
    };
    await setDoc(configRef, updated, { merge: true });

    await logSystemActivity({
      uid: performer.uid,
      performerName: performer.displayName || performer.email || 'Admin',
      performerEmail: performer.email || '',
      action: 'update_system_config',
      actionLabel: 'Cập nhật Cấu hình Hệ thống',
      details: `Cập nhật thông tin ứng dụng: ${config.appName} - ${config.schoolName}`,
      timestamp: new Date().toISOString()
    });

    return true;
  } catch (err) {
    console.error('Error saving system config:', err);
    return false;
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
export async function fetchSystemLogs(): Promise<SystemLog[]> {
  try {
    const logsRef = collection(db, 'systemLogs');
    const q = query(logsRef, orderBy('createdAt', 'desc'), limit(150));
    const snapshot = await getDocs(q);
    const logs: SystemLog[] = [];

    snapshot.forEach(docSnap => {
      const d = docSnap.data();
      logs.push({
        id: docSnap.id,
        uid: d.uid || '',
        performerName: d.performerName || 'Hệ thống',
        performerEmail: d.performerEmail || '',
        action: d.action || 'login',
        actionLabel: d.actionLabel || d.action,
        targetUserId: d.targetUserId,
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
