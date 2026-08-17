import React, { useState } from 'react';
import { AppUser } from '../../types';
import { DEFAULT_SYSTEM_SETTINGS } from '../../config/adminConfig';
import { 
  Clock, 
  XCircle, 
  Ban, 
  LogOut, 
  RefreshCw, 
  Copy, 
  Check, 
  Mail, 
  Phone, 
  ShieldAlert, 
  GraduationCap,
  Calendar
} from 'lucide-react';

interface ScreenProps {
  appUser: AppUser;
  onLogout: () => void;
  onRefreshStatus?: () => Promise<void>;
  supportEmail?: string;
  supportPhone?: string;
  schoolName?: string;
}

export const PendingApprovalScreen: React.FC<ScreenProps> = ({
  appUser,
  onLogout,
  onRefreshStatus,
  supportEmail = DEFAULT_SYSTEM_SETTINGS.supportEmail,
  supportPhone = DEFAULT_SYSTEM_SETTINGS.supportPhone,
  schoolName = DEFAULT_SYSTEM_SETTINGS.schoolName
}) => {
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);

  const handleCopyUid = () => {
    navigator.clipboard.writeText(appUser.uid);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCheckNow = async () => {
    if (!onRefreshStatus) return;
    setChecking(true);
    try {
      await onRefreshStatus();
    } finally {
      setTimeout(() => setChecking(false), 400);
    }
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col justify-between p-4 sm:p-6 font-sans">
      <div className="max-w-xl w-full mx-auto my-auto space-y-6 pt-4 pb-8">
        
        {/* Branding */}
        <div className="flex items-center justify-center space-x-3 text-center">
          <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-lg shadow-indigo-500/10">
            <Calendar className="w-7 h-7" />
          </div>
          <div className="text-left">
            <h1 className="text-sm font-black text-white uppercase tracking-wider">
              LỊCH BÁO GIẢNG TIỂU HỌC
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">
              {schoolName} • Cổng phân quyền giáo viên
            </p>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-slate-900/90 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-amber-500/5 backdrop-blur-sm space-y-6">
          
          {/* Status Badge & Icon */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
              <Clock className="w-8 h-8 animate-pulse" />
            </div>
            
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] font-bold tracking-wide uppercase">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>Chờ Quản trị viên phê duyệt</span>
            </div>

            <h2 className="text-lg sm:text-xl font-black text-white tracking-wide">
              ĐĂNG NHẬP THÀNH CÔNG
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-md leading-relaxed">
              Tài khoản Google của thầy/cô đã xác thực thành công. Tuy nhiên, hệ thống yêu cầu 
              <strong className="text-amber-300"> Quản trị viên (Admin/BGH) phê duyệt</strong> trước khi truy cập dữ liệu giảng dạy.
            </p>
          </div>

          {/* Account Detail Box */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-2.5 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
              <span className="text-slate-400">Giáo viên:</span>
              <span className="font-bold text-white">{appUser.displayName || 'Giáo viên'}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
              <span className="text-slate-400">Email Google:</span>
              <span className="font-mono text-indigo-300">{appUser.email}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
              <span className="text-slate-400">Trạng thái:</span>
              <span className="font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
                Chờ xét duyệt (Pending)
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pt-1">
              <span className="text-slate-400">Mã UID xác thực:</span>
              <div className="flex items-center space-x-1.5 font-mono text-[11px] text-slate-300 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
                <span className="truncate max-w-[170px] sm:max-w-[220px]">{appUser.uid}</span>
                <button
                  onClick={handleCopyUid}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer p-0.5"
                  title="Sao chép UID gửi Quản trị viên"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Help Box */}
          <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-2xl p-4 text-xs space-y-2">
            <div className="flex items-center space-x-2 text-indigo-300 font-bold">
              <GraduationCap className="w-4 h-4" />
              <span>Hướng dẫn kích hoạt tài khoản:</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Vui lòng báo cho Tổ trưởng chuyên môn hoặc Ban Giám hiệu để cấp quyền phê duyệt tài khoản của thầy/cô trên phân hệ Quản trị.
            </p>
            {(supportEmail || supportPhone) && (
              <div className="pt-1 flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                {supportPhone && (
                  <span className="inline-flex items-center space-x-1">
                    <Phone className="w-3 h-3 text-indigo-400" />
                    <span>Hotline: <strong className="text-slate-200">{supportPhone}</strong></span>
                  </span>
                )}
                {supportEmail && (
                  <span className="inline-flex items-center space-x-1">
                    <Mail className="w-3 h-3 text-indigo-400" />
                    <span>Email: <strong className="text-slate-200">{supportEmail}</strong></span>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              onClick={handleCheckNow}
              disabled={checking}
              className="w-full sm:flex-1 flex items-center justify-center space-x-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
              <span>{checking ? 'Đang kiểm tra...' : 'Kiểm tra lại quyền truy cập'}</span>
            </button>

            <button
              onClick={onLogout}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-rose-400" />
              <span>Đăng xuất</span>
            </button>
          </div>

        </div>

        <p className="text-center text-[11px] text-slate-500">
          Chỉ những tài khoản đã được phê duyệt mới có quyền đọc và chỉnh sửa Lịch báo giảng.
        </p>

      </div>
    </div>
  );
};

export const RejectedScreen: React.FC<ScreenProps> = ({
  appUser,
  onLogout,
  supportEmail = DEFAULT_SYSTEM_SETTINGS.supportEmail,
  supportPhone = DEFAULT_SYSTEM_SETTINGS.supportPhone,
  schoolName = DEFAULT_SYSTEM_SETTINGS.schoolName
}) => {
  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col justify-between p-4 sm:p-6 font-sans">
      <div className="max-w-md w-full mx-auto my-auto space-y-6 pt-4 pb-8">
        
        {/* Branding */}
        <div className="flex items-center justify-center space-x-3 text-center">
          <div className="p-2.5 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-lg shadow-rose-500/10">
            <Calendar className="w-7 h-7" />
          </div>
          <div className="text-left">
            <h1 className="text-sm font-black text-white uppercase tracking-wider">
              LỊCH BÁO GIẢNG TIỂU HỌC
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">{schoolName}</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-slate-900/90 border border-rose-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto shadow-inner">
            <XCircle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-black text-rose-300 uppercase tracking-wide">
              TÀI KHOẢN BỊ TỪ CHỐI
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Tài khoản <strong className="text-white font-mono">{appUser.email}</strong> đã bị Quản trị viên từ chối cấp quyền truy cập ứng dụng.
            </p>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 text-xs text-left space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Họ và tên:</span>
              <span className="font-bold text-white">{appUser.displayName || 'Giáo viên'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Trạng thái:</span>
              <span className="font-bold text-rose-400">Bị từ chối (Rejected)</span>
            </div>
            {(supportEmail || supportPhone) && (
              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
                <p>Nếu có sự nhầm lẫn, vui lòng liên hệ:</p>
                {supportPhone && <p className="text-slate-300">Điện thoại: {supportPhone}</p>}
                {supportEmail && <p className="text-slate-300">Email: {supportEmail}</p>}
              </div>
            )}
          </div>

          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center space-x-2 px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all shadow-lg shadow-rose-600/30 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng xuất khỏi hệ thống</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export const SuspendedScreen: React.FC<ScreenProps> = ({
  appUser,
  onLogout,
  supportEmail = DEFAULT_SYSTEM_SETTINGS.supportEmail,
  supportPhone = DEFAULT_SYSTEM_SETTINGS.supportPhone,
  schoolName = DEFAULT_SYSTEM_SETTINGS.schoolName
}) => {
  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col justify-between p-4 sm:p-6 font-sans">
      <div className="max-w-md w-full mx-auto my-auto space-y-6 pt-4 pb-8">
        
        {/* Branding */}
        <div className="flex items-center justify-center space-x-3 text-center">
          <div className="p-2.5 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-lg shadow-rose-500/10">
            <Calendar className="w-7 h-7" />
          </div>
          <div className="text-left">
            <h1 className="text-sm font-black text-white uppercase tracking-wider">
              LỊCH BÁO GIẢNG TIỂU HỌC
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">{schoolName}</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-slate-900/90 border border-rose-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto shadow-inner">
            <Ban className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-black text-rose-300 uppercase tracking-wide">
              TÀI KHOẢN ĐANG BỊ TẠM KHÓA
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Tài khoản <strong className="text-white font-mono">{appUser.email}</strong> hiện đang bị tạm khóa bởi Quản trị viên. Toàn bộ dữ liệu chuyên môn của thầy/cô vẫn được bảo lưu an toàn.
            </p>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 text-xs text-left space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Họ và tên:</span>
              <span className="font-bold text-white">{appUser.displayName || 'Giáo viên'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Trạng thái:</span>
              <span className="font-bold text-rose-400">Tạm khóa (Suspended)</span>
            </div>
            {(supportEmail || supportPhone) && (
              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
                <p>Vui lòng liên hệ Quản trị viên để mở khóa:</p>
                {supportPhone && <p className="text-slate-300">Điện thoại: {supportPhone}</p>}
                {supportEmail && <p className="text-slate-300">Email: {supportEmail}</p>}
              </div>
            )}
          </div>

          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center space-x-2 px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all shadow-lg shadow-rose-600/30 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng xuất khỏi hệ thống</span>
          </button>
        </div>

      </div>
    </div>
  );
};
