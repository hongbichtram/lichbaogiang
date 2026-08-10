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
  Loader2, 
  CheckCircle2, 
  Globe 
} from 'lucide-react';

interface SystemSettingsProps {
  currentUser: any;
}

export const SystemSettings: React.FC<SystemSettingsProps> = ({ currentUser }) => {
  const [config, setConfig] = useState<SystemConfig>({
    appName: 'Lịch báo giảng Tiểu học',
    schoolName: 'Trường Tiểu học',
    defaultAcademicYear: '2026-2027',
    contactEmail: 'admin@truongtieuhoc.edu.vn',
    contactPhone: '0901234567',
    announcement: 'Hệ thống Quản lý Lịch báo giảng Tiểu học vận hành chính thức.',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchSystemConfig()
      .then(res => setConfig(res))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    const success = await saveSystemConfig(config, {
      uid: currentUser?.uid || 'admin',
      displayName: currentUser?.displayName || 'Admin',
      email: currentUser?.email || ''
    });

    setSaving(false);
    if (success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
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
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-indigo-500/20 shadow-xl flex items-center space-x-3">
        <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-black text-white uppercase tracking-wide">
            CẤU HÌNH HỆ THỐNG
          </h2>
          <p className="text-xs text-indigo-300/80">
            Quản lý tên ứng dụng, đơn vị trường học, năm học mặc định và thông báo chung
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
        
        {saveSuccess && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center space-x-2 animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>Đã lưu cấu hình chung hệ thống thành công!</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* App Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
              <Globe className="w-4 h-4 text-indigo-400" />
              <span>Tên ứng dụng</span>
            </label>
            <input
              type="text"
              required
              value={config.appName}
              onChange={e => setConfig({ ...config, appName: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-white outline-hidden transition-all"
              placeholder="VD: Lịch báo giảng Tiểu học"
            />
          </div>

          {/* School Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
              <Building2 className="w-4 h-4 text-blue-400" />
              <span>Tên trường / Đơn vị</span>
            </label>
            <input
              type="text"
              required
              value={config.schoolName}
              onChange={e => setConfig({ ...config, schoolName: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-white outline-hidden transition-all"
              placeholder="VD: Trường Tiểu học Nguyễn Du"
            />
          </div>

          {/* Default Academic Year */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>Năm học mặc định</span>
            </label>
            <input
              type="text"
              required
              value={config.defaultAcademicYear}
              onChange={e => setConfig({ ...config, defaultAcademicYear: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-white outline-hidden transition-all"
              placeholder="VD: 2026-2027"
            />
          </div>

          {/* Contact Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
              <Mail className="w-4 h-4 text-purple-400" />
              <span>Email liên hệ hỗ trợ</span>
            </label>
            <input
              type="email"
              value={config.contactEmail || ''}
              onChange={e => setConfig({ ...config, contactEmail: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-white outline-hidden transition-all"
              placeholder="admin@truongtieuhoc.edu.vn"
            />
          </div>

          {/* Contact Phone */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
              <Phone className="w-4 h-4 text-cyan-400" />
              <span>Số điện thoại liên hệ</span>
            </label>
            <input
              type="text"
              value={config.contactPhone || ''}
              onChange={e => setConfig({ ...config, contactPhone: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-white outline-hidden transition-all"
              placeholder="0901234567"
            />
          </div>

          {/* System Announcement */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
              <Megaphone className="w-4 h-4 text-amber-400" />
              <span>Thông báo chung hệ thống (Hiển thị cho Giáo viên)</span>
            </label>
            <textarea
              rows={3}
              value={config.announcement || ''}
              onChange={e => setConfig({ ...config, announcement: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-white outline-hidden transition-all resize-none"
              placeholder="Nhập thông báo gửi đến toàn thể thầy cô giáo..."
            />
          </div>

        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4 border-t border-slate-800">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{saving ? 'Đang lưu cấu hình...' : 'Lưu cấu hình hệ thống'}</span>
          </button>
        </div>

      </form>

    </div>
  );
};
