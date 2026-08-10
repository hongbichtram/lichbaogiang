import React, { useState, useEffect } from 'react';
import { getAllUsers } from '../../services/adminService';
import { AppUser } from '../../types';
import { 
  BarChart3, 
  Users, 
  UserCheck, 
  UserX, 
  ShieldCheck, 
  Calendar, 
  Loader2, 
  RefreshCw,
  TrendingUp,
  Clock
} from 'lucide-react';

export const SystemStatistics: React.FC = () => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to fetch system statistics:', err);
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
  const teacherCount = users.filter(u => u.role === 'teacher').length;
  const adminCount = users.filter(u => u.role === 'admin').length;

  // New users in last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const newUsers30Days = users.filter(u => {
    if (!u.createdAt) return false;
    return new Date(u.createdAt) >= thirtyDaysAgo;
  }).length;

  const activePercentage = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;
  const disabledPercentage = totalUsers > 0 ? Math.round((disabledUsers / totalUsers) * 100) : 0;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-indigo-500/20 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white uppercase tracking-wide">
              THỐNG KÊ SỬ DỤNG HỆ THỐNG
            </h2>
            <p className="text-xs text-indigo-300/80">
              Tổng quan về số lượng người dùng, trạng thái tài khoản và phân bố vai trò
            </p>
          </div>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all self-start sm:self-auto disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          <span>Cập nhật số liệu</span>
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
          <span className="text-xs">Đang tổng hợp dữ liệu thống kê...</span>
        </div>
      ) : (
        <>
          {/* Main Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Total Users */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-2 relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng người dùng</span>
                <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-black text-white">
                {totalUsers}
              </div>
              <div className="text-[11px] text-slate-400 font-medium flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>Toàn bộ tài khoản đã đăng ký</span>
              </div>
              <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-blue-500/5 rounded-full blur-xl group-hover:bg-blue-500/10 transition-all" />
            </div>

            {/* Active Users */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-2 relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Đang hoạt động</span>
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <UserCheck className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-black text-emerald-300">
                {activeUsers}
              </div>
              <div className="text-[11px] text-slate-400 font-medium flex items-center space-x-1">
                <span className="font-bold text-emerald-400">{activePercentage}%</span>
                <span>tổng tài khoản hệ thống</span>
              </div>
              <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-all" />
            </div>

            {/* Disabled Users */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-2 relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">Đã bị khóa</span>
                <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  <UserX className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-black text-rose-300">
                {disabledUsers}
              </div>
              <div className="text-[11px] text-slate-400 font-medium flex items-center space-x-1">
                <span className="font-bold text-rose-400">{disabledPercentage}%</span>
                <span>tài khoản bị vô hiệu hóa</span>
              </div>
              <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-rose-500/5 rounded-full blur-xl group-hover:bg-rose-500/10 transition-all" />
            </div>

            {/* New Users (30 days) */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-2 relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Tài khoản mới (30 ngày)</span>
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-black text-purple-300">
                {newUsers30Days}
              </div>
              <div className="text-[11px] text-slate-400 font-medium flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-purple-400" />
                <span>Gia nhập trong tháng này</span>
              </div>
              <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-purple-500/5 rounded-full blur-xl group-hover:bg-purple-500/10 transition-all" />
            </div>

          </div>

          {/* Detailed Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Status Breakdown */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <span>Tỷ lệ trạng thái tài khoản</span>
              </h3>

              <div className="space-y-3 pt-2">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-emerald-400">Đang hoạt động</span>
                    <span className="text-slate-300">{activeUsers} ({activePercentage}%)</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                      style={{ width: `${activePercentage}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-rose-400">Đã bị khóa</span>
                    <span className="text-slate-300">{disabledUsers} ({disabledPercentage}%)</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                    <div 
                      className="h-full bg-gradient-to-r from-rose-500 to-red-400 rounded-full transition-all duration-500"
                      style={{ width: `${disabledPercentage}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Role Breakdown */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span>Phân bố vai trò tài khoản</span>
              </h3>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-black text-blue-400">{teacherCount}</span>
                  <span className="text-xs text-slate-400 font-bold mt-1">Giáo viên</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-black text-purple-400">{adminCount}</span>
                  <span className="text-xs text-slate-400 font-bold mt-1">Quản trị viên (Admin)</span>
                </div>
              </div>
            </div>

          </div>
        </>
      )}

    </div>
  );
};
