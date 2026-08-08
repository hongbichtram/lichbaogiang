export type LessonStatus = 'completed' | 'preparing' | 'unprepared';

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
  academicYear: string;
  semester: string;
  weekNumber: number;
  dayOfWeek: 'Thứ 2' | 'Thứ 3' | 'Thứ 4' | 'Thứ 5' | 'Thứ 6';
  period: number; // 1..5 sáng, 6..10 chiều
  className: string; // e.g. "4A1"
  subject: string;
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
  updatedAt: string;
}

export interface ClassTimetableRule {
  id: string;
  className: string;
  grade: string;
  subject: string;
  dayOfWeek: 'Thứ 2' | 'Thứ 3' | 'Thứ 4' | 'Thứ 5' | 'Thứ 6';
  period: number; // 1..10
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
