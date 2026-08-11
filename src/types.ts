export type LessonStatus = 'completed' | 'preparing' | 'unprepared';

export type UserRole = 'admin' | 'teacher';
export type UserStatus = 'active' | 'disabled';

export interface AppUser {
  uid: string;
  displayName: string;
  email: string;
  teacherCode?: string;
  role: UserRole;
  status: UserStatus;
  createdAt?: string | any;
  updatedAt?: string | any;
  lastLoginAt?: string | any;
}

export interface SystemConfig {
  appName: string;
  schoolName: string;
  logoUrl?: string;
  defaultAcademicYear: string;
  supportEmail?: string;
  supportPhone?: string;
  contactEmail?: string;
  contactPhone?: string;
  systemAnnouncement?: string;
  announcement?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface SystemLog {
  id: string;
  uid: string;
  performerName?: string;
  performerEmail?: string;
  action: 'login' | 'logout' | 'lock_user' | 'unlock_user' | 'change_role' | 'update_system_config' | 'UPDATE_SYSTEM_CONFIG' | 'CREATE_TEACHER' | 'UPDATE_TEACHER' | 'DISABLE_TEACHER' | 'ENABLE_TEACHER' | 'CHANGE_ROLE';
  actionLabel?: string;
  adminUid?: string;
  targetUid?: string;
  targetUserId?: string;
  targetUserName?: string;
  targetUserEmail?: string;
  details?: string;
  timestamp: string;
  metadata?: any;
}

export interface TeacherUsageStats {
  teacherUid: string;
  teacherCode?: string;
  academicYearInUse?: string;
  timetableVersionsCount: number;
  academicWeeksConfiguredCount: number;
  scheduleItemsCount: number;
  ppctCurriculumsCount: number;
}

export interface TeacherProfile {
  uid: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  schoolName: string;
  teacherCode: string;
  subjects: string[];
  grades: string[];
  assignedClasses?: string[]; // e.g. ["3A1", "3A2", "4A1", "4A2", "5A1"]
  academicYear: string;
  semester: string;
}

export interface AcademicYearConfig {
  academicYear: string;
  week1StartDate: string; // YYYY-MM-DD
  totalWeeks: number; // default 35
  customWeekMap?: Record<number, { startDate: string; endDate: string }>; // YYYY-MM-DD
  updatedAt?: string;
}

export interface PPCTItem {
  id: string;
  week: number;
  periodNumber: number; // Tiết theo PPCT (1..70)
  title: string;
  topic?: string;
  requirements?: string;
  note?: string;
}

export interface PPCTCurriculum {
  id: string;
  teacherId: string;
  grade: string; // e.g. "Khối 3", "Khối 4"
  subject: string; // e.g. "Tin học"
  textbook: string; // e.g. "Chân trời sáng tạo"
  academicYear: string;
  semester: string;
  items: PPCTItem[];
  updatedAt: string;
}

export interface ActivityStep {
  phase: string; // Khởi động, Khám phá, Luyện tập, Vận dụng
  teacherActivity: string;
  studentActivity: string;
}

export interface ScheduleItem {
  id: string;
  teacherId: string;
  curriculumId?: string;
  lessonId?: string;
  academicYear: string;
  semester: string;
  weekNumber: number;
  dayOfWeek: 'Thứ 2' | 'Thứ 3' | 'Thứ 4' | 'Thứ 5' | 'Thứ 6';
  session?: 'Sáng' | 'Chiều';
  period: number; // 1..5 sáng, 6..10 chiều
  className: string; // e.g. "4A1"
  subject: string;
  subjectId?: string;
  subjectName?: string;
  grade: string;
  lessonTitle: string;
  topic?: string;
  ppctPeriod?: number; // Tiết PPCT
  status: LessonStatus;
  objectives?: string; // Mục tiêu
  requirements?: string; // Yêu cầu cần đạt
  methods?: string; // Phương pháp dạy học
  equipment?: string; // Thiết bị dạy học
  content?: string; // Nội dung
  activities?: ActivityStep[] | string; // Hoạt động
  assessment?: string; // Đánh giá
  gameIdeas?: string; // Gợi ý trò chơi
  notes?: string; // Ghi chú
  date?: string; // YYYY-MM-DD
  generatedFromTKB?: boolean; // True if auto-generated from TimetableVersion
  source?: 'timetable' | 'manual'; // Origin of schedule item
  updatedAt: string;
}

// --- SHARED CURRICULUM & TEACHER-SPECIFIC DATA TYPES ---

export interface SharedCurriculum {
  id: string; // e.g. "2026-2027_TinHoc_Khoi4"
  academicYear: string;
  subject: string;
  grade: string;
  name: string;
  items: PPCTItem[];
  version: number;
  createdAt?: string | any;
  updatedAt?: string | any;
  updatedBy: string;
}

export interface TeacherCurriculumSelection {
  curriculumId: string;
  selectedAt: string | any;
}

export interface TeacherLessonProgress {
  curriculumId: string;
  lessonId: string;
  status: string;
  taughtAt?: string | any | null;
}

export interface TeacherCustomLesson {
  curriculumId: string;
  sourceLessonId: string | null;
  title: string;
  content: string;
  note: string;
  createdAt?: string | any;
  updatedAt?: string | any;
}

export interface TeacherCurriculumNote {
  curriculumId: string;
  lessonId: string;
  note: string;
}

export interface TeacherCurriculumData {
  uid: string;
  curriculumSelections: TeacherCurriculumSelection[];
  lessonProgress: TeacherLessonProgress[];
  customLessons: TeacherCustomLesson[];
  notes: TeacherCurriculumNote[];
  updatedAt?: string | any;
}

export interface ClassTimetableRule {
  id: string;
  className: string;
  grade: string;
  subject: string;
  subjectId?: string;
  subjectName?: string;
  dayOfWeek: 'Thứ 2' | 'Thứ 3' | 'Thứ 4' | 'Thứ 5' | 'Thứ 6';
  session?: 'Sáng' | 'Chiều';
  period: number; // 1..10
}

export interface TimetableVersion {
  id: string;
  uid: string;
  academicYear: string;
  versionName: string;
  fromWeek: number;
  toWeek: number;
  rules: ClassTimetableRule[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface ScheduleFilter {
  weekNumber: number | 'all';
  month: number | 'all';
  semester: string | 'all';
  academicYear: string;
  grade: string | 'all';
  className: string | 'all';
  subject: string | 'all';
  status: LessonStatus | 'all';
  searchQuery: string;
}

export interface PrintSettings {
  // Header info
  showSchoolName: boolean;
  schoolName: string;
  showTeacherName: boolean;
  teacherName: string;
  showTeacherCode: boolean;
  teacherCode: string;
  showAcademicYear: boolean;
  academicYear: string;
  showSemester: boolean;
  semester: string;
  customTitle: string; // e.g. "LỊCH BÁO GIẢNG TUẦN {week}"

  // Schedule Table Column Toggles
  showColDay: boolean; // Thứ, ngày tháng năm
  showColPeriod: boolean; // Tiết
  showColSession: boolean; // Buổi
  showColClass: boolean; // Lớp
  showColPpctPeriod: boolean; // Tiết PPCT
  showColLessonTitle: boolean; // Tên bài dạy
  showColNotes: boolean; // Ghi chú

  // Typography
  fontFamily: 'Times New Roman' | 'Arial' | 'Roboto' | 'Calibri' | 'Aptos' | 'Segoe UI';
  titleFontSize: number; // pt
  contentFontSize: number; // pt
  tableFontSize: number; // pt
  isTitleBold: boolean;
  isLessonTitleBold: boolean;

  // Layout & Margins
  paperSize: 'A4' | 'A3' | 'Letter';
  orientation: 'portrait' | 'landscape'; // Dọc / Ngang
  marginTop: number; // mm
  marginBottom: number; // mm
  marginLeft: number; // mm
  marginRight: number; // mm
  contentAlign: 'left' | 'center' | 'right';

  // Footer Signatures
  showSigCreator: boolean; // Người lập
  sigCreatorTitle: string;
  showSigTeacher: boolean; // Giáo viên
  sigTeacherTitle: string;
  showSigDepartmentHead: boolean; // Tổ trưởng
  sigDepartmentHeadTitle: string;
  showSigBoard: boolean; // Ban giám hiệu
  sigBoardTitle: string;
}

export const DEFAULT_PRINT_SETTINGS: PrintSettings = {
  showSchoolName: true,
  schoolName: '',
  showTeacherName: true,
  teacherName: '',
  showTeacherCode: true,
  teacherCode: '',
  showAcademicYear: true,
  academicYear: '',
  showSemester: true,
  semester: '',
  customTitle: 'LỊCH BÁO GIẢNG TUẦN {week}',

  showColDay: true,
  showColPeriod: true,
  showColSession: false,
  showColClass: true,
  showColPpctPeriod: true,
  showColLessonTitle: true,
  showColNotes: true,

  fontFamily: 'Times New Roman',
  titleFontSize: 16,
  contentFontSize: 13,
  tableFontSize: 12,
  isTitleBold: true,
  isLessonTitleBold: false,

  paperSize: 'A4',
  orientation: 'portrait',
  marginTop: 15,
  marginBottom: 15,
  marginLeft: 15,
  marginRight: 15,
  contentAlign: 'left',

  showSigCreator: false,
  sigCreatorTitle: 'NGƯỜI LẬP LỊCH',
  showSigTeacher: true,
  sigTeacherTitle: 'GIÁO VIÊN BÁO GIẢNG',
  showSigDepartmentHead: true,
  sigDepartmentHeadTitle: 'TỔ TRƯỞNG CHUYÊN MÔN',
  showSigBoard: true,
  sigBoardTitle: 'BAN GIÁM HIỆU DUYỆT',
};

