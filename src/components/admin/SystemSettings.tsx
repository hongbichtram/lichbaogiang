import React, { useState, useEffect } from 'react';
import { SystemConfig } from '../../types';
import { fetchSystemConfig, saveSystemConfig } from '../../services/adminService';
import { 
  Settings, 
  Building2, 
  Mail, 
  Phone, 
  Calendar, 
  Megaphone, 
  Save, 
  RotateCcw,
  Loader2, 
  CheckCircle2, 
  Globe,
  AlertCircle,
  Info
} from 'lucide-react';

interface SystemSettingsProps {
  currentUser: any;
}

export const SystemSettings: React.FC<SystemSettingsProps> = ({ currentUser }) => {
  const [initialConfig, setInitialConfig] = useState<SystemConfig>({
    appName: 'Lịch báo giảng Tiểu học',
    schoolName: 'Trường Tiểu học',
    defaultAcademicYear: '2026-2027',
    supportEmail: 'admin@truongtieuhoc.edu.vn',
    supportPhone: '0901234567',
    systemAnnouncement: 'Hệ thống Quản lý Lịch báo giảng Tiểu học vận hành chính thức.',
  });

  const [config, setConfig] = useState<SystemConfig>(initialConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchSystemConfig()
      .then(res => {
        const loaded: SystemConfig = {
          appName: res.appName || 'Lịch báo giảng Tiểu học',
          schoolName: res.schoolName || 'Trường Tiểu học',
          defaultAcademicYear: res.defaultAcademicYear || '2026-2027',
          supportEmail: res.supportEmail || res.contactEmail || '',
          supportPhone: res.supportPhone || res.contactPhone || '',
          systemAnnouncement: res.systemAnnouncement !== undefined ? res.systemAnnouncement : (res.announcement || ''),
          updatedAt: res.updatedAt,
          updatedBy: res.updatedBy
        };
        setInitialConfig(loaded);
        setConfig(loaded);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleReset = () => {
    setConfig(initialConfig);
    setErrorMessage(null);
    setSaveSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSaveSuccess(false);

    // Validation
    if (!config.appName.trim()) {
      setErrorMessage('Vui lòng nhập Tên ứng dụng.');
      return;
    }
    if (!config.schoolName.trim()) {
      setErrorMessage('Vui lòng nhập Tên trường / đơn vị.');
      return;
    }
    if (!config.defaultAcademicYear.trim()) {
      setErrorMessage('Vui lòng nhập Năm học mặc định.');
      return;
    }

    const emailToValidate = (config.supportEmail || config.contactEmail || '').trim();
    if (emailToValidate) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailToValidate)) {
        setErrorMessage('Địa chỉ Email hỗ trợ không hợp lệ.');
        return;
      }
    }

    setSaving(true);

    try {
      const res = await saveSystemConfig(
        {
          ...config,
          appName: config.appName.trim(),
          schoolName: config.schoolName.trim(),
          defaultAcademicYear: config.defaultAcademicYear.trim(),
          supportEmail: emailToValidate,
          supportPhone: (config.supportPhone || config.contactPhone || '').trim(),
          systemAnnouncement: (config.systemAnnouncement !== undefined ? config.systemAnnouncement : (config.announcement || '')).trim()
        },
        {
          uid: currentUser?.uid || 'admin',
          displayName: currentUser?.displayName || 'Admin',
          email: currentUser?.email || ''
        }
      );

      if (res.success) {
        setInitialConfig(config);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        setErrorMessage(res.message || 'Không thể lưu cấu hình hệ thống.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Đã xảy ra lỗi khi lưu cấu hình.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 space-x-2">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
        <span className="text-xs">Đang tải cấu hình hệ thống...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      
      {/* Header */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-indigo-500/20 shadow-xl flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white uppercase tracking-wide">
              CẤU HÌNH HỆ THỐNG
            </h2>
            <p className="text-xs text-indigo-300/80">
              Cấu hình thông tin ứng dụng, năm học mặc định, hỗ trợ và thông báo chung
            </p>
          </div>
        </div>
        {config.updatedAt && (
          <div className="hidden sm:block text-right text-[11px] text-slate-400">
            <span>Cập nhật lần cuối: </span>
            <span className="text-slate-300 font-medium">
              {new Date(config.updatedAt).toLocaleString('vi-VN')}
            </span>
          </div>
        )}
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Success Banner */}
        {saveSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center space-x-2.5 shadow-lg animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>Đã lưu cấu hình hệ thống</span>
          </div>
        )}

        {/* Error Banner */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center space-x-2.5 shadow-lg animate-fadeIn">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* SECTION A: THÔNG TIN ỨNG DỤNG */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
            <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
            <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
              A. THÔNG TIN ỨNG DỤNG
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* App Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                <Globe className="w-4 h-4 text-indigo-400" />
                <span>Tên ứng dụng</span>
                <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={config.appName}
                onChange={e => setConfig({ ...config, appName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-white placeholder-slate-500 outline-hidden transition-all"
                placeholder="VD: Lịch báo giảng Tiểu học"
              />
            </div>

            {/* School Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                <Building2 className="w-4 h-4 text-blue-400" />
                <span>Tên trường</span>
                <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={config.schoolName}
                onChange={e => setConfig({ ...config, schoolName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-white placeholder-slate-500 outline-hidden transition-all"
                placeholder="VD: Trường Tiểu học Nguyễn Du"
              />
            </div>
          </div>
        </div>

        {/* SECTION B: CẤU HÌNH NĂM HỌC */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
              B. CẤU HÌNH NĂM HỌC
            </h3>
          </div>

          <div className="space-y-3">
            {/* Default Academic Year */}
            <div className="space-y-1.5 max-w-md">
              <label className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span>Năm học mặc định</span>
                <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={config.defaultAcademicYear}
                onChange={e => setConfig({ ...config, defaultAcademicYear: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-white placeholder-slate-500 outline-hidden transition-all"
                placeholder="VD: 2026-2027"
              />
            </div>

            {/* Note banner */}
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start space-x-2.5 leading-relaxed">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-300">LƯU Ý:</strong> Cấu hình này chỉ là năm học mặc định của hệ thống. KHÔNG được ghi đè hoặc thay đổi AcademicYearConfig riêng của từng giáo viên.
              </div>
            </div>
          </div>
        </div>

        {/* SECTION C: THÔNG TIN HỖ TRỢ */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
            <h3 className="text-xs font-bold text-purple-300 uppercase tracking-wider">
              C. THÔNG TIN HỖ TRỢ
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Support Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                <Mail className="w-4 h-4 text-purple-400" />
                <span>Email</span>
              </label>
              <input
                type="email"
                value={config.supportEmail || config.contactEmail || ''}
                onChange={e => setConfig({ ...config, supportEmail: e.target.value, contactEmail: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-white placeholder-slate-500 outline-hidden transition-all"
                placeholder="admin@truongtieuhoc.edu.vn"
              />
            </div>

            {/* Support Phone */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                <Phone className="w-4 h-4 text-cyan-400" />
                <span>Hotline</span>
              </label>
              <input
                type="text"
                value={config.supportPhone || config.contactPhone || ''}
                onChange={e => setConfig({ ...config, supportPhone: e.target.value, contactPhone: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-white placeholder-slate-500 outline-hidden transition-all"
                placeholder="0901234567"
              />
            </div>
          </div>
        </div>

        {/* SECTION D: THÔNG BÁO HỆ THỐNG */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
            <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
              D. THÔNG BÁO HỆ THỐNG
            </h3>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
              <Megaphone className="w-4 h-4 text-amber-400" />
              <span>Nội dung thông báo</span>
            </label>
            <textarea
              rows={3}
              value={config.systemAnnouncement !== undefined ? config.systemAnnouncement : (config.announcement || '')}
              onChange={e => setConfig({ ...config, systemAnnouncement: e.target.value, announcement: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-white placeholder-slate-500 outline-hidden transition-all resize-none"
              placeholder="Nhập thông báo gửi đến tất cả giáo viên... (Để trống nếu muốn ẩn thông báo)"
            />
            <p className="text-[11px] text-slate-400">
              * Cho phép Admin cập nhật thông báo hiển thị trên giao diện Giáo viên. Nếu xóa rỗng nội dung thông báo, banner thông báo sẽ tự động ẩn.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            disabled={saving}
            className="flex items-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all disabled:opacity-50 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Hủy thay đổi</span>
          </button>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center space-x-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{saving ? 'Đang lưu...' : 'Lưu cấu hình'}</span>
          </button>
        </div>

      </form>

    </div>
  );
};
