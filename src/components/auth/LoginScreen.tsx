import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2, 
  AlertCircle, 
  ShieldCheck, 
  Sparkles,
  Phone
} from 'lucide-react';
import { loginWithEmailAndPassword, signInWithGoogle } from '../../lib/firebase';
import { fetchSystemConfig } from '../../services/adminService';
import { SystemConfig } from '../../types';
import { Footer } from '../Footer';

interface LoginScreenProps {
  onLoginSuccess?: () => void;
  darkMode?: boolean;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ darkMode = true }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sysConfig, setSysConfig] = useState<SystemConfig | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetchSystemConfig().then(cfg => {
      if (isMounted && cfg) {
        setSysConfig(cfg);
      }
    }).catch(err => {
      console.warn('LoginScreen: Could not load system config', err);
    });
    return () => { isMounted = false; };
  }, []);

  // Determine support email and phone with fallbacks as required
  const rawEmail = sysConfig?.supportEmail?.trim() || sysConfig?.contactEmail?.trim() || '';
  const supportEmail = (!rawEmail || rawEmail.includes('truongtieuhoc.edu.vn') || rawEmail === 'admin@truongtieuhoc.edu.vn')
    ? 'hongbichtram13@gmail.com'
    : rawEmail;

  const rawPhone = sysConfig?.supportPhone?.trim() || sysConfig?.contactPhone?.trim() || '';
  const supportPhone = (!rawPhone || rawPhone === '0901234567')
    ? '0973474027'
    : rawPhone;

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage('Vui lòng nhập địa chỉ Email');
      return;
    }
    if (!password) {
      setErrorMessage('Vui lòng nhập mật khẩu');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      await loginWithEmailAndPassword(email.trim(), password);
      // Success will trigger onAuthStateChanged in App.tsx
    } catch (err: any) {
      console.error('Login failed:', err);
      const code = err?.code;
      if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
        setErrorMessage('Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại!');
      } else if (code === 'auth/invalid-email') {
        setErrorMessage('Định dạng Email không hợp lệ.');
      } else if (code === 'auth/user-disabled') {
        setErrorMessage('Tài khoản này đã bị tạm khóa bởi Quản trị viên.');
      } else if (code === 'auth/too-many-requests') {
        setErrorMessage('Đăng nhập thất bại quá nhiều lần. Vui lòng thử lại sau ít phút.');
      } else {
        setErrorMessage(err?.message || 'Đã xảy ra lỗi đăng nhập. Vui lòng thử lại!');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setErrorMessage(null);
    try {
      await signInWithGoogle();
      // Success will trigger onAuthStateChanged in App.tsx
    } catch (err: any) {
      console.error('Google Login failed:', err);
      if (err?.code !== 'auth/popup-closed-by-user') {
        setErrorMessage('Đăng nhập bằng Google không thành công. Vui lòng thử lại!');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen sm:h-screen bg-[#090D16] text-slate-100 flex flex-col justify-between relative overflow-x-hidden overflow-y-auto sm:overflow-hidden font-sans selection:bg-indigo-500 selection:text-white">
      {/* Dynamic Ambient Background Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-indigo-600/15 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[450px] h-[450px] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-1/3 left-0 w-[350px] h-[350px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Grid Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }}
      />

      {/* Header Branding */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-tr from-indigo-600 to-blue-500 text-white shadow-sm shadow-indigo-500/20 border border-indigo-400/30">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <span className="font-black text-xs sm:text-sm tracking-wider uppercase text-white block leading-tight">LỊCH BÁO GIẢNG</span>
            <span className="text-[9px] sm:text-[10px] text-indigo-400 font-bold uppercase tracking-widest block leading-none">TIỂU HỌC</span>
          </div>
        </div>

        <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-[10px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Hệ thống Quản lý Chuyên môn An toàn</span>
        </div>
      </header>

      {/* Main Login Form Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-3 sm:p-4 my-auto shrink-0">
        <div className="w-full max-w-[400px] space-y-2">
          
          {/* Main Card */}
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xl shadow-black/80 relative overflow-hidden">
            
            {/* Top Decorative Highlight */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-80" />

            {/* Login Banner Section */}
            <div className="mb-3.5 rounded-xl bg-gradient-to-br from-indigo-950/80 via-slate-900 to-blue-950/80 border border-indigo-500/25 p-3 sm:p-3.5 shadow-inner text-center space-y-1.5">
              
              {/* Main Title & Subtitle */}
              <div className="space-y-0.5">
                <h1 className="text-lg sm:text-xl font-black uppercase tracking-wide text-white drop-shadow-sm leading-tight">
                  LỊCH BÁO GIẢNG TIỂU HỌC
                </h1>
                <p className="text-[11px] text-slate-300 font-medium">
                  Quản lý thời khóa biểu và lịch báo giảng cá nhân
                </p>
              </div>

              {/* Support Info */}
              <div className="pt-2 border-t border-indigo-500/15 flex flex-row items-center justify-center gap-2 sm:gap-3 text-[11px] text-slate-400 font-medium">
                <div className="flex items-center space-x-1 hover:text-slate-300 transition-colors">
                  <Mail className="w-3 h-3 text-purple-400 shrink-0" />
                  <span>Email: <strong className="text-slate-200">{supportEmail}</strong></span>
                </div>
                <span className="text-slate-700">|</span>
                <div className="flex items-center space-x-1 hover:text-slate-300 transition-colors">
                  <Phone className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span>Hotline: <strong className="text-slate-200">{supportPhone}</strong></span>
                </div>
              </div>
            </div>

            {/* Error Message Box */}
            {errorMessage && (
              <div className="mb-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2 animate-shake">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <div className="flex-1 font-medium">{errorMessage}</div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleEmailLogin} className="space-y-3">
              
              {/* Email Input */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">
                  Địa chỉ Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vd: giaovien@example.com"
                    disabled={loading || googleLoading}
                    required
                    className="w-full pl-9 pr-3.5 h-[40px] bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl text-xs text-white placeholder-slate-600 transition-all outline-none"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">
                    Mật khẩu
                  </label>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={loading || googleLoading}
                    required
                    className="w-full pl-9 pr-10 h-[40px] bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl text-xs text-white placeholder-slate-600 transition-all outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || googleLoading}
                className="w-full h-[40px] px-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 active:from-indigo-700 active:to-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-indigo-600/25 border border-indigo-500/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer pt-0.5"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang đăng nhập...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Đăng nhập hệ thống</span>
                  </>
                )}
              </button>

            </form>

            {/* Divider */}
            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold">
                <span className="bg-slate-900 px-2.5 text-slate-500">Hoặc tiếp tục với</span>
              </div>
            </div>

            {/* Google Sign In Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading || googleLoading}
              className="w-full h-[40px] px-4 bg-slate-950 hover:bg-slate-800 text-slate-200 font-bold text-xs rounded-xl border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-center space-x-2.5 disabled:opacity-50 cursor-pointer"
            >
              {googleLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.2 9 5 12 5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 10.8 0 12.5s.7 2.8 1.9 5.2l3.7-2.9z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.2-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
                  />
                </svg>
              )}
              <span>Đăng nhập bằng Google</span>
            </button>

          </div>

          {/* Bottom Help Text */}
          <div className="text-center text-[10px] text-slate-500 pt-0.5">
            <p>Tài khoản do Nhà trường / Quản trị viên cấp.</p>
          </div>

        </div>
      </main>

      {/* Unified Global Footer */}
      <Footer />
    </div>
  );
};

