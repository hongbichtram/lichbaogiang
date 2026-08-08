import React, { useState } from 'react';
import { 
  Calendar, 
  BookOpen, 
  Settings as SettingsIcon, 
  Sun, 
  Moon, 
  CheckCircle2, 
  User, 
  LogOut, 
  LayoutDashboard,
  Loader2,
  AlertCircle,
  Clock
} from 'lucide-react';
import { TeacherProfile } from '../types';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  teacher: TeacherProfile;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  autoSaveStatus: 'saved' | 'saving' | 'idle';
  user: any;
  onLogin: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  teacher,
  darkMode,
  setDarkMode,
  autoSaveStatus,
  user,
  onLogin,
  onLogout,
}) => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginErrorModal, setLoginErrorModal] = useState<{ code: string; message: string; hint: string } | null>(null);

  const handleLoginClick = async () => {
    setIsLoggingIn(true);
    setLoginErrorModal(null);
    try {
      await onLogin();
    } catch (err: any) {
      const code = err?.code || 'unknown';
      const rawMsg = err?.message || String(err);
      let hint = 'Vui lòng kiểm tra lại cấu hình Firebase Authentication.';

      if (code === 'auth/unauthorized-domain') {
        hint = `Domain hiện tại (${window.location.hostname}) chưa được thêm vào danh sách "Authorized domains" trong Firebase Console -> Authentication -> Settings -> Authorized domains.`;
      } else if (code === 'auth/operation-not-allowed') {
        hint = 'Phương thức đăng nhập bằng Google chưa được BẬT (Enable) trong Firebase Console -> Authentication -> Sign-in method -> Google.';
      } else if (code === 'auth/popup-blocked') {
        hint = 'Trình duyệt đã chặn cửa sổ bật lên (popup). Vui lòng cho phép popup trên trình duyệt và thử lại.';
      } else if (code === 'auth/popup-closed-by-user') {
        hint = 'Cửa sổ đăng nhập bị đóng trước khi hoàn tất.';
      } else if (code === 'auth/configuration-not-found') {
        hint = 'Cấu hình Google Sign-in provider trong Firebase Project lichbaogiang-20939 chưa hoàn tất.';
      }

      setLoginErrorModal({ code, message: rawMsg, hint });
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-2xl bg-slate-950/85 border-b border-indigo-500/20 shadow-lg shadow-indigo-950/30 text-white transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Brand Logo Left */}
          <div 
            className="flex items-center space-x-3 cursor-pointer group" 
            onClick={() => setCurrentTab('dashboard')}
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 border border-blue-400/30 group-hover:scale-105 transition-transform duration-200">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <span className="font-black text-base sm:text-lg tracking-wider block leading-tight uppercase bg-gradient-to-r from-white via-slate-100 to-blue-200 bg-clip-text text-transparent">
                LỊCH BÁO GIẢNG
              </span>
              <span className="text-[11px] sm:text-xs text-indigo-300/80 font-semibold tracking-wide block">
                {teacher.schoolName || 'Trường Tiểu học'}
              </span>
            </div>
          </div>

          {/* Navigation Links Center */}
          <nav className="hidden md:flex items-center space-x-1.5 bg-slate-900/90 p-1.5 rounded-2xl border border-indigo-500/30 shadow-xl shadow-indigo-950/40 backdrop-blur-md">
            {[
              { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
              { id: 'schedule', label: 'Lịch báo giảng', icon: Calendar },
              { id: 'ppct', label: 'Phân phối CT', icon: BookOpen },
              { id: 'timetable', label: 'Thời khóa biểu', icon: Clock },
              { id: 'settings', label: 'Cài đặt', icon: SettingsIcon },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`relative flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 border border-indigo-400/40'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80 hover:shadow-xs'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-indigo-400'}`} />
                  <span>{item.label}</span>

                  {/* Active Indicator bar */}
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-cyan-300 rounded-full shadow-xs shadow-cyan-400" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Actions Right */}
          <div className="flex items-center space-x-2.5">
            
            {/* Auto Save Status Badge */}
            <div className="hidden lg:flex items-center space-x-1.5 text-xs text-slate-200 px-3 py-1.5 bg-slate-900/90 rounded-full border border-indigo-500/30 shadow-xs">
              <CheckCircle2 className={`w-3.5 h-3.5 ${autoSaveStatus === 'saving' ? 'animate-spin text-amber-400' : 'text-emerald-400'}`} />
              <span className="font-semibold text-[11px]">
                {autoSaveStatus === 'saving' ? 'Đang lưu...' : '✓ Tự động lưu'}
              </span>
            </div>

            {/* Dark/Light Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 sm:p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-indigo-500/30 text-amber-400 hover:text-amber-300 transition-colors shadow-xs"
              title={darkMode ? 'Chuyển sang Chế độ sáng' : 'Chuyển sang Chế độ tối'}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-300" />}
            </button>

            {/* User Profile / Auth */}
            {user ? (
              <div className="flex items-center space-x-2.5 pl-2 border-l border-indigo-500/30">
                <div className="flex items-center space-x-2 bg-slate-900/90 px-2.5 py-1 rounded-xl border border-indigo-500/30">
                  <img
                    src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(teacher.fullName)}&background=6366f1&color=fff`}
                    alt={teacher.fullName}
                    className="w-7 h-7 rounded-lg border border-indigo-400/50 object-cover"
                  />
                  <div className="hidden xl:block text-left pr-1">
                    <span className="text-xs font-bold text-slate-100 block leading-tight">
                      {teacher.fullName || 'Hồng Bích Trâm'}
                    </span>
                    <span className="text-[10px] text-indigo-300 font-medium block">
                      Giáo viên
                    </span>
                  </div>
                </div>

                <button
                  onClick={onLogout}
                  className="p-2 text-slate-400 hover:text-rose-400 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-indigo-500/30 transition-colors"
                  title="Đăng xuất"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleLoginClick}
                disabled={isLoggingIn}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/25 border border-indigo-400/30 transition-all disabled:opacity-50"
              >
                {isLoggingIn ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                ) : (
                  <User className="w-3.5 h-3.5" />
                )}
                <span>{isLoggingIn ? 'Đang kết nối...' : 'Đăng nhập Google'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Glass Bottom Navigation Bar */}
      <div className="md:hidden flex items-center justify-around border-t border-indigo-500/20 bg-slate-950/95 backdrop-blur-2xl py-2 px-2">
        {[
          { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
          { id: 'schedule', label: 'Lịch báo giảng', icon: Calendar },
          { id: 'ppct', label: 'Phân phối CT', icon: BookOpen },
          { id: 'timetable', label: 'Thời khóa biểu', icon: Clock },
          { id: 'settings', label: 'Cài đặt', icon: SettingsIcon },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`flex flex-col items-center space-y-1 text-[10px] font-bold px-3 py-1.5 rounded-xl transition-all ${
                isActive 
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md shadow-indigo-500/30 border border-indigo-400/40' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Google Login Error Modal */}
      {loginErrorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg p-6 bg-slate-900 border border-rose-500/40 rounded-2xl shadow-2xl text-white space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/40">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-rose-300">
                LỖI ĐĂNG NHẬP GOOGLE ({loginErrorModal.code})
              </h3>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 space-y-3">
              <div>
                <span className="text-slate-400 font-semibold block mb-1">Hướng dẫn khắc phục:</span>
                <p className="text-amber-300 font-medium leading-relaxed bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/30">
                  {loginErrorModal.hint}
                </p>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block mb-1">Thông tin chi tiết từ Firebase:</span>
                <p className="font-mono text-[11px] text-slate-400 bg-slate-900 p-2 rounded border border-slate-800 break-words">
                  {loginErrorModal.message}
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setLoginErrorModal(null)}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition-all shadow-md"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
