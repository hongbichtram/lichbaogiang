import React, { useState } from 'react';
import { UserRole, UserStatus } from '../../types';
import { createTeacherAccount } from '../../services/adminService';
import { 
  X, 
  UserPlus, 
  User, 
  Mail, 
  KeyRound, 
  BadgeCheck, 
  Shield, 
  AlertCircle, 
  Loader2,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';

interface CreateTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentUser: any;
}

export const CreateTeacherModal: React.FC<CreateTeacherModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentUser
}) => {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [teacherCode, setTeacherCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('teacher');
  const [status, setStatus] = useState<UserStatus>('active');

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Form Validations
    if (!displayName.trim()) {
      setErrorMessage('Vui lòng nhập Họ và tên giáo viên.');
      return;
    }
    if (!email.trim()) {
      setErrorMessage('Vui lòng nhập Địa chỉ email.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMessage('Địa chỉ email không hợp lệ (ví dụ: giaovien@school.edu.vn).');
      return;
    }
    if (!password) {
      setErrorMessage('Vui lòng nhập Mật khẩu tạm thời.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Mật khẩu tạm thời phải có ít nhất 6 ký tự.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp với Mật khẩu tạm thời.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await createTeacherAccount(
        {
          displayName: displayName.trim(),
          email: email.trim(),
          teacherCode: teacherCode.trim(),
          password,
          role,
          status
        },
        {
          uid: currentUser?.uid || 'admin',
          displayName: currentUser?.displayName || 'Admin',
          email: currentUser?.email || ''
        }
      );

      if (res.success) {
        // Reset Form
        setDisplayName('');
        setEmail('');
        setTeacherCode('');
        setPassword('');
        setConfirmPassword('');
        setRole('teacher');
        setStatus('active');
        onSuccess();
        onClose();
      } else {
        setErrorMessage(res.message || 'Không thể tạo tài khoản giáo viên.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Đã xảy ra lỗi không xác định.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg bg-slate-900 border border-indigo-500/30 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/80 border-b border-indigo-500/20">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider">
                THÊM TÀI KHOẢN GIÁO VIÊN MỚI
              </h3>
              <p className="text-xs text-indigo-300">
                Tạo tài khoản sử dụng độc lập cho Giáo viên Tiểu học
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-start space-x-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed font-medium">{errorMessage}</div>
            </div>
          )}

          {/* Display Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center space-x-1">
              <span>Họ và tên</span>
              <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Ví dụ: Nguyễn Văn An"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-white placeholder-slate-500 outline-hidden transition-all"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center space-x-1">
              <span>Địa chỉ Email</span>
              <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Ví dụ: nguyenvanan@truongtieuhoc.edu.vn"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-white placeholder-slate-500 outline-hidden transition-all"
              />
            </div>
          </div>

          {/* Teacher Code */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>Mã Giáo viên</span>
              <span className="text-[10px] text-slate-400 font-normal">(Tùy chọn)</span>
            </label>
            <div className="relative">
              <BadgeCheck className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={teacherCode}
                onChange={e => setTeacherCode(e.target.value)}
                placeholder="Ví dụ: GV-TH-012"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-white placeholder-slate-500 outline-hidden transition-all"
              />
            </div>
          </div>

          {/* Password & Confirm Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            
            {/* Temporary Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center space-x-1">
                <span>Mật khẩu tạm thời</span>
                <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Ít nhất 6 ký tự"
                  required
                  className="w-full pl-10 pr-9 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-white placeholder-slate-500 outline-hidden transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center space-x-1">
                <span>Xác nhận Mật khẩu</span>
                <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-white placeholder-slate-500 outline-hidden transition-all"
                />
              </div>
            </div>

          </div>

          {/* Role & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            
            {/* Role */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center space-x-1">
                <Shield className="w-3.5 h-3.5 text-purple-400" />
                <span>Vai trò</span>
              </label>
              <select
                value={role}
                onChange={e => setRole(e.target.value as UserRole)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-slate-200 outline-hidden cursor-pointer"
              >
                <option value="teacher">Giáo viên (Mặc định)</option>
                <option value="admin">Quản trị viên (Admin)</option>
              </select>
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center space-x-1">
                <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Trạng thái</span>
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as UserStatus)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-slate-200 outline-hidden cursor-pointer"
              >
                <option value="active">Đang hoạt động</option>
                <option value="disabled">Khóa tài khoản</option>
              </select>
            </div>

          </div>

          {/* Data Note */}
          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-[11px] text-slate-400 leading-relaxed">
            * <strong className="text-slate-300">Khởi tạo dữ liệu:</strong> Tài khoản mới sẽ chỉ được tạo Teacher Profile cơ bản. Thời khóa biểu, Lịch báo giảng và PPCT cá nhân sẽ không tạo dữ liệu giả, mà khởi tạo trống để giáo viên bắt đầu sử dụng độc lập.
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all flex items-center space-x-1.5 shadow-lg shadow-indigo-600/30 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang tạo tài khoản...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Tạo tài khoản</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
