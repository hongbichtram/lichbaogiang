/**
 * Cấu hình UID tài khoản Quản trị viên (Admin).
 * 
 * HƯỚNG DẪN LẤY UID TÀI KHOẢN GOOGLE HIỆN TẠI:
 * 1. Đăng nhập ứng dụng bằng tài khoản Google của bạn.
 * 2. Mở Developer Tools (bấm F12 hoặc Chuột phải -> Inspect) -> chọn tab Console.
 * 3. Quan sát dòng log có dạng:
 *    AUTH USER
 *    UID: <chuỗi_uid_của_bạn>
 *    EMAIL: <email_của_bạn>
 *    ROLE: teacher
 *    STATUS: active
 * 4. Copy chuỗi UID đó và dán vào biến ADMIN_UID dưới đây.
 */
export const ADMIN_UID = "dUppwv43zEgXLqetfoClHDWUpFD2";

/**
 * Cấu hình mặc định hệ thống khi chưa có dữ liệu trong Firestore
 */
export const DEFAULT_SYSTEM_SETTINGS = {
  appName: 'Lịch báo giảng Tiểu học',
  schoolName: 'Trường Tiểu học',
  defaultAcademicYear: '2026-2027',
  supportEmail: 'hongbichtram13@gmail.com',
  supportPhone: '0973474027',
  systemAnnouncement: 'Hệ thống Quản lý Lịch báo giảng Tiểu học vận hành chính thức.'
};

/**
 * Kiểm tra xem UID có phải là Admin được cấu hình hay không.
 */
export function isConfiguredAdminUid(uid?: string | null): boolean {
  if (!uid) return false;
  return uid === ADMIN_UID;
}
