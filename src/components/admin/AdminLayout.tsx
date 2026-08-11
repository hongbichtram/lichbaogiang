import React, { useState } from 'react';
import { AdminDashboard } from './AdminDashboard';
import { TeacherManagement } from './TeacherManagement';
import { SystemStatistics } from './SystemStatistics';
import { SystemSettings } from './SystemSettings';
import { ActivityLogs } from './ActivityLogs';
import { Footer } from '../Footer';
import { 
  Shield, 
  LayoutDashboard, 
  Users, 
  BarChart3, 
  Settings, 
  History, 
  ArrowLeft, 
  LogOut, 
  Sun, 
  Moon,
  Building2
} from 'lucide-react';

interface AdminLayoutProps {
  currentUser: any;
  onBackToMain: () => void;
  onLogout: () => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentUser,
  onBackToMain,
  onLogout,
  darkMode,
  setDarkMode,
}) => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  const menuItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'teachers', label: 'Quản lý Giáo viên', icon: Users },
    { id: 'stats', label: 'Thống kê', icon: BarChart3 },
    { id: 'settings', label: 'Cấu hình Hệ thống', icon: Settings },
    { id: 'logs', label: 'Nhật ký hoạt động', icon: History },
  ];

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 font-sans flex flex-col">
      
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-2xl bg-slate-950/90 border-b border-purple-500/30 shadow-xl shadow-purple-950/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          
          {/* Left Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/30 border border-purple-400/40">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black text-base sm:text-lg tracking-wider uppercase bg-gradient-to-r from-purple-200 via-white to-indigo-200 bg-clip-text text-transparent">
                  QUẢN TRỊ HỆ THỐNG
                </span>
                <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold">
                  ADMIN
                </span>
              </div>
              <span className="text-[11px] text-purple-300/80 font-medium block">
                Lịch báo giảng Tiểu học - Phân hệ Admin
              </span>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-3">
            
            {/* Theme Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 sm:p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-purple-500/30 text-amber-400 transition-colors shadow-xs"
              title="Đổi Chế độ sáng/tối"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-purple-300" />}
            </button>

            {/* Back to Teacher App Button */}
            <button
              onClick={onBackToMain}
              className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Quay lại Giao diện chính</span>
            </button>

            {/* Admin Profile */}
            {currentUser && (
              <div className="flex items-center space-x-2 pl-2 border-l border-purple-500/30">
                <div className="flex items-center space-x-2 bg-slate-900 px-2.5 py-1.5 rounded-xl border border-purple-500/30">
                  <div className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center text-white font-bold text-xs">
                    {(currentUser.displayName || currentUser.email || 'A').charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden xl:block text-left pr-1">
                    <span className="text-xs font-bold text-white block leading-tight">
                      {currentUser.displayName || 'Admin'}
                    </span>
                    <span className="text-[10px] text-purple-300 font-semibold block">
                      Quản trị viên
                    </span>
                  </div>
                </div>

                <button
                  onClick={onLogout}
                  className="p-2 text-slate-400 hover:text-rose-400 rounded-xl bg-slate-900 hover:bg-slate-800 border border-purple-500/30 transition-colors"
                  title="Đăng xuất"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

          </div>

        </div>
      </header>

      {/* Main Container with Sidebar + Content */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row gap-6">
        
        {/* Admin Navigation Sidebar */}
        <aside className="w-full md:w-64 shrink-0">
          <div className="sticky top-24 bg-slate-950/80 border border-purple-500/20 rounded-2xl p-3 shadow-xl space-y-1 backdrop-blur-md">
            
            <div className="px-3 py-2 text-[10px] font-black uppercase text-purple-400 tracking-wider">
              DANH MỤC QUẢN TRỊ
            </div>

            {menuItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white shadow-lg shadow-purple-500/25 border border-purple-400/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-purple-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}

            <div className="pt-3 border-t border-slate-900 mt-2">
              <button
                onClick={onBackToMain}
                className="w-full flex items-center space-x-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-indigo-300 hover:bg-slate-900/80 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-indigo-400" />
                <span>Trở về Lịch báo giảng</span>
              </button>
            </div>

          </div>
        </aside>

        {/* Admin Content Area */}
        <main className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            {activeTab === 'dashboard' && <AdminDashboard onNavigateTab={setActiveTab} />}
            {activeTab === 'teachers' && <TeacherManagement currentUser={currentUser} />}
            {activeTab === 'stats' && <SystemStatistics />}
            {activeTab === 'settings' && <SystemSettings currentUser={currentUser} />}
            {activeTab === 'logs' && <ActivityLogs />}
          </div>
          <Footer />
        </main>

      </div>

    </div>
  );
};
