import React, { useEffect, useState } from 'react';
import { getAllUsers, fetchSystemLogs } from '../../services/adminService';
import { AppUser, SystemLog } from '../../types';
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  UserX, 
  UserPlus, 
  Clock, 
  History, 
  Shield, 
  ArrowRight, 
  Loader2,
  RefreshCw,
  Settings,
  BarChart3
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigateTab: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateTab }) => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [recentLogs, setRecentLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [userList, logList] = await Promise.all([
        getAllUsers(),
        fetchSystemLogs()
      ]);
      setUsers(userList);
      setRecentLogs(logList.slice(0, 8)); // Top 8 recent activity
    } catch (err) {
      console.error('Error loading Admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'active').length;
  const disabledUsers = users.filter(u => u.status === 'disabled').length;

  // New teachers in last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const newTeachersCount = users.filter(u => u.createdAt && new Date(u.createdAt) >= thirtyDaysAgo).length;

  // Most recent login timestamp
  const lastLoginUser = [...users].sort((a, b) => {
    const tA = a.lastLoginAt ? new Date(a.lastLoginAt).getTime() : 0;
    const tB = b.lastLoginAt ? new Date(b.lastLoginAt).getTime() : 0;
    return tB - tA;
  })[0];

  const formatDate = (isoStr?: string) => {
    if (!isoStr) return 'Chưa ghi nhận';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 border border-indigo-400/40">
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white uppercase tracking-wider bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
              TỔNG QUAN QUẢN TRỊ HỆ THỐNG
            </h1>
            <p className="text-xs text-indigo-300 font-medium mt-0.5">
              Hệ thống Quản lý Lịch báo giảng & Tài khoản Giáo viên
            </p>
          </div>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 font-bold text-xs border border-indigo-500/30 transition-all self-start md:self-auto disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          <span>Tải lại dữ liệu</span>
        </button>
      </div>

      {/* Metrics Cards Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
          <span className="text-xs">Đang tải số liệu thống kê hệ thống...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          
          {/* Total Users */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
              <span>Tổng người dùng</span>
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-black text-white">{totalUsers}</div>
            <div className="text-[10px] text-slate-400">Tất cả tài khoản</div>
          </div>

          {/* Active Users */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
            <div className="flex items-center justify-between text-emerald-400 text-xs font-bold uppercase">
              <span>Đang hoạt động</span>
              <UserCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-300">{activeUsers}</div>
            <div className="text-[10px] text-emerald-400/80 font-medium">Tài khoản hợp lệ</div>
          </div>

          {/* Locked Users */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
            <div className="flex items-center justify-between text-rose-400 text-xs font-bold uppercase">
              <span>Tài khoản bị khóa</span>
              <UserX className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-black text-rose-300">{disabledUsers}</div>
            <div className="text-[10px] text-rose-400/80 font-medium">Đã vô hiệu hóa</div>
          </div>

          {/* New Teachers */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
            <div className="flex items-center justify-between text-purple-400 text-xs font-bold uppercase">
              <span>Giáo viên mới</span>
              <UserPlus className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-purple-300">{newTeachersCount}</div>
            <div className="text-[10px] text-purple-400/80 font-medium">Đăng ký trong 30 ngày</div>
          </div>

          {/* Last Login */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-2 col-span-1 sm:col-span-2 xl:col-span-2">
            <div className="flex items-center justify-between text-indigo-400 text-xs font-bold uppercase">
              <span>Lần đăng nhập gần nhất</span>
              <Clock className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-sm font-bold text-slate-200 truncate">
              {lastLoginUser ? (lastLoginUser.displayName || lastLoginUser.email) : 'Chưa có dữ liệu'}
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              {lastLoginUser ? formatDate(lastLoginUser.lastLoginAt) : '-'}
            </div>
          </div>

        </div>
      )}

      {/* Quick Access Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <button
          onClick={() => onNavigateTab('teachers')}
          className="p-5 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500/40 shadow-xl text-left transition-all group flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:bg-blue-600 group-hover:text-white transition-all">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                Quản lý Giáo viên
              </h3>
              <p className="text-[11px] text-slate-400">Khóa / Mở khóa & phân quyền</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
        </button>

        <button
          onClick={() => onNavigateTab('stats')}
          className="p-5 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500/40 shadow-xl text-left transition-all group flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 group-hover:bg-purple-600 group-hover:text-white transition-all">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                Thống kê Hệ thống
              </h3>
              <p className="text-[11px] text-slate-400">Báo cáo tổng quan số liệu</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
        </button>

        <button
          onClick={() => onNavigateTab('settings')}
          className="p-5 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500/40 shadow-xl text-left transition-all group flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:bg-emerald-600 group-hover:text-white transition-all">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                Cấu hình Hệ thống
              </h3>
              <p className="text-[11px] text-slate-400">Thông tin ứng dụng & đơn vị</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
        </button>

      </div>

      {/* Recent Activity Table */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <History className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Hoạt động gần đây trên hệ thống
            </h3>
          </div>
          <button
            onClick={() => onNavigateTab('logs')}
            className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 transition-colors cursor-pointer"
          >
            <span>Xem tất cả nhật ký</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentLogs.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">Chưa ghi nhận hoạt động gần đây.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[11px] font-bold text-indigo-300 uppercase border-b border-slate-800">
                  <th className="py-2.5 px-3">Thời gian</th>
                  <th className="py-2.5 px-3">Người thực hiện</th>
                  <th className="py-2.5 px-3">Hành động</th>
                  <th className="py-2.5 px-3">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-xs text-slate-300">
                {recentLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {formatDate(log.timestamp)}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-white">
                      {log.performerName || log.performerEmail || 'Hệ thống'}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-indigo-300">
                      {log.actionLabel || log.action}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">
                      {log.details || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
