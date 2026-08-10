import React, { useEffect, useState } from 'react';
import { AppUser, TeacherUsageStats } from '../../types';
import { getTeacherUsageStats } from '../../services/adminService';
import { 
  X, 
  User, 
  Mail, 
  Shield, 
  CheckCircle2, 
  Ban, 
  Calendar, 
  Clock, 
  FileText, 
  Layers, 
  Loader2,
  Info
} from 'lucide-react';

interface TeacherDetailModalProps {
  user: AppUser | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TeacherDetailModal: React.FC<TeacherDetailModalProps> = ({ user, isOpen, onClose }) => {
  const [stats, setStats] = useState<TeacherUsageStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      setLoading(true);
      getTeacherUsageStats(user.uid)
        .then(res => setStats(res))
        .finally(() => setLoading(false));
    } else {
      setStats(null);
    }
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  const formatDate = (isoStr?: string) => {
    if (!isoStr) return 'Chưa ghi nhận';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-2xl bg-slate-900 border border-indigo-500/30 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/80 border-b border-indigo-500/20">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider">
                THÔNG TIN CHI TIẾT GIÁO VIÊN
              </h3>
              <p className="text-xs text-indigo-300">
                Thống kê mức độ sử dụng tài khoản hệ thống
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* User Profile Card */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-md">
                  {(user.displayName || user.email || 'G').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">
                    {user.displayName || 'Giáo viên chưa cập nhật tên'}
                  </h4>
                  <div className="flex items-center space-x-1.5 text-xs text-slate-400 mt-0.5">
                    <Mail className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{user.email}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold border ${
                  user.role === 'admin' 
                    ? 'bg-purple-500/10 text-purple-300 border-purple-500/30' 
                    : 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                }`}>
                  <Shield className="w-3.5 h-3.5" />
                  <span>{user.role === 'admin' ? 'Quản trị viên' : 'Giáo viên'}</span>
                </span>

                <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold border ${
                  user.status === 'active' 
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' 
                    : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                }`}>
                  {user.status === 'active' ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Hoạt động</span>
                    </>
                  ) : (
                    <>
                      <Ban className="w-3.5 h-3.5" />
                      <span>Đã bị khóa</span>
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Account info details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300 pt-1">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                <span>Mã giáo viên: <strong className="text-white font-mono">{user.teacherCode || stats?.teacherCode || 'Chưa cập nhật'}</strong></span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-purple-400" />
                <span>Năm học đang dùng: <strong className="text-white">{stats?.academicYearInUse || '2026-2027'}</strong></span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-indigo-400" />
                <span>Ngày tạo tài khoản: <strong>{formatDate(user.createdAt)}</strong></span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>Đăng nhập gần nhất: <strong>{formatDate(user.lastLoginAt)}</strong></span>
              </div>
            </div>
          </div>

          {/* Usage Statistics Section (Read-Only) */}
          <div>
            <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-3 flex items-center space-x-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Thống kê sử dụng ứng dụng (Chỉ xem)</span>
            </h4>

            {loading ? (
              <div className="flex items-center justify-center p-8 bg-slate-950/40 rounded-xl border border-slate-800 text-slate-400 space-x-2">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                <span className="text-xs">Đang tải số liệu thống kê từ Firestore...</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-black text-blue-400">
                    {stats?.timetableVersionsCount ?? 0}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium mt-1">
                    Phiên bản TKB
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-black text-indigo-400">
                    {stats?.academicWeeksConfiguredCount ?? 0}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium mt-1">
                    Tuần đã cấu hình
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-black text-emerald-400">
                    {stats?.scheduleItemsCount ?? 0}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium mt-1">
                    Lịch báo giảng
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-black text-purple-400">
                    {stats?.ppctCurriculumsCount ?? 0}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium mt-1">
                    Bộ PPCT đã lưu
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Privacy Note */}
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start space-x-2.5">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Bảo mật dữ liệu chuyên môn:</strong> Quản trị viên chỉ quản lý hệ thống và tài khoản. Toàn bộ nội dung Lịch báo giảng, Thời khóa biểu và PPCT của giáo viên là dữ liệu cá nhân, không thể chỉnh sửa hoặc xem chi tiết nội dung từ Admin.
            </p>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-950/80 border-t border-indigo-500/20 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
};
