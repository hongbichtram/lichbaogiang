import React, { useState, useEffect, useMemo } from 'react';
import { 
  fetchSystemUsageOverview, 
  fetchSystemLogs 
} from '../../services/adminService';
import { AppUser, SystemLog } from '../../types';
import { 
  BarChart3, 
  Users, 
  UserCheck, 
  UserX, 
  ShieldCheck, 
  Calendar, 
  Loader2, 
  RefreshCw,
  Activity,
  LogIn,
  Key,
  Lock,
  Settings,
  UserPlus,
  Clock,
  Filter,
  CheckCircle2,
  CalendarCheck,
  FileSpreadsheet,
  AlertCircle,
  BarChart2,
  PieChart as PieIcon
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  AreaChart, 
  Area, 
  Legend 
} from 'recharts';

type DateFilterOption = 'all' | '7d' | '30d';

export const SystemStatistics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [filterRange, setFilterRange] = useState<DateFilterOption>('all');

  // Core Data States
  const [users, setUsers] = useState<AppUser[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [teachersWithSchedulesCount, setTeachersWithSchedulesCount] = useState<number>(0);
  const [teachersWithTimetableCount, setTeachersWithTimetableCount] = useState<number>(0);
  const [teachersWithAcademicWeeksCount, setTeachersWithAcademicWeeksCount] = useState<number>(0);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [overviewData, logsData] = await Promise.all([
        fetchSystemUsageOverview(),
        fetchSystemLogs(500)
      ]);

      setUsers(overviewData.users);
      setTeachersWithSchedulesCount(overviewData.teachersWithSchedulesCount);
      setTeachersWithTimetableCount(overviewData.teachersWithTimetableCount);
      setTeachersWithAcademicWeeksCount(overviewData.teachersWithAcademicWeeksCount);
      setSystemLogs(logsData);
    } catch (err) {
      console.error('Failed to load system statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // ----------------------------------------------------
  // 1. THỐNG KÊ TÀI KHOẢN (Account Statistics)
  // ----------------------------------------------------
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'active').length;
  const disabledUsers = users.filter(u => u.status === 'disabled').length;
  const adminCount = users.filter(u => u.role === 'admin').length;
  const teacherUsers = users.filter(u => u.role === 'teacher');
  const totalTeacherCount = teacherUsers.length;
  const activeTeacherCount = teacherUsers.filter(u => u.status === 'active').length;

  const activePercentage = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;
  const disabledPercentage = totalUsers > 0 ? Math.round((disabledUsers / totalUsers) * 100) : 0;

  // ----------------------------------------------------
  // 2. THỐNG KÊ MỨC ĐỘ SỬ DỤNG (Usage Level Statistics)
  // ----------------------------------------------------
  // Giáo viên đã sử dụng: Có record lastLoginAt hoặc có thao tác
  const usedSystemTeachersCount = teacherUsers.filter(u => Boolean(u.lastLoginAt)).length;
  const unusedSystemTeachersCount = totalTeacherCount - usedSystemTeachersCount;

  // ----------------------------------------------------
  // 3. THỐNG KÊ HOẠT ĐỘNG HỆ THỐNG (Filtered System Activity Logs)
  // ----------------------------------------------------
  const filteredLogs = useMemo(() => {
    if (filterRange === 'all') return systemLogs;

    const now = new Date();
    const days = filterRange === '7d' ? 7 : 30;
    const cutoffTime = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).getTime();

    return systemLogs.filter(log => {
      const logTime = new Date(log.timestamp).getTime();
      return logTime >= cutoffTime;
    });
  }, [systemLogs, filterRange]);

  // Breakdown metrics based on filtered logs
  const totalLogsCount = filteredLogs.length;
  const loginLogsCount = filteredLogs.filter(l => l.action === 'login').length;
  const adminActionLogsCount = filteredLogs.filter(l => l.action !== 'login' && l.action !== 'logout').length;
  const accountCreatedLogsCount = filteredLogs.filter(l => l.action === 'CREATE_TEACHER').length;
  const lockUnlockLogsCount = filteredLogs.filter(l => 
    ['DISABLE_TEACHER', 'ENABLE_TEACHER', 'lock_user', 'unlock_user'].includes(l.action)
  ).length;
  const roleChangeLogsCount = filteredLogs.filter(l => 
    ['CHANGE_ROLE', 'change_role'].includes(l.action)
  ).length;
  const configUpdateLogsCount = filteredLogs.filter(l => 
    ['UPDATE_SYSTEM_CONFIG', 'update_system_config'].includes(l.action)
  ).length;

  // ----------------------------------------------------
  // 4. BIỂU ĐỒ DỮ LIỆU (Chart Data Preparations)
  // ----------------------------------------------------

  // Chart 1: Phân bố trạng thái tài khoản
  const accountStatusChartData = useMemo(() => [
    { name: 'Đang hoạt động', value: activeUsers, color: '#10b981' },
    { name: 'Bị khóa', value: disabledUsers, color: '#f43f5e' }
  ], [activeUsers, disabledUsers]);

  // Chart 2: Phân bố vai trò tài khoản
  const roleDistributionChartData = useMemo(() => [
    { name: 'Giáo viên', value: totalTeacherCount, color: '#3b82f6' },
    { name: 'Quản trị viên (Admin)', value: adminCount, color: '#a855f7' }
  ], [totalTeacherCount, adminCount]);

  // Chart 3: Hoạt động hệ thống theo thời gian (Grouped by date)
  const activityTimelineData = useMemo(() => {
    if (filteredLogs.length === 0) return [];

    const map = new Map<string, { date: string; displayDate: string; total: number; logins: number; adminActions: number }>();

    // Sắp xếp log từ cũ đến mới để vẽ biểu đồ
    const sorted = [...filteredLogs].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    sorted.forEach(log => {
      const dt = new Date(log.timestamp);
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
      const displayDate = `${dt.getDate()}/${dt.getMonth() + 1}`;

      if (!map.has(key)) {
        map.set(key, { date: key, displayDate, total: 0, logins: 0, adminActions: 0 });
      }

      const item = map.get(key)!;
      item.total += 1;
      if (log.action === 'login') {
        item.logins += 1;
      } else if (log.action !== 'logout') {
        item.adminActions += 1;
      }
    });

    return Array.from(map.values());
  }, [filteredLogs]);

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header & Filter Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-indigo-500/20 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white uppercase tracking-wide">
              THỐNG KÊ HỆ THỐNG
            </h2>
            <p className="text-xs text-indigo-300/80">
              Tổng quan tài khoản, mức độ sử dụng, nhật ký hoạt động và biểu đồ trực quan
            </p>
          </div>
        </div>

        {/* Time Range Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-2 mr-1" />
            
            <button
              onClick={() => setFilterRange('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterRange === 'all'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Tất cả thời gian
            </button>

            <button
              onClick={() => setFilterRange('30d')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterRange === '30d'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              30 ngày gần nhất
            </button>

            <button
              onClick={() => setFilterRange('7d')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterRange === '7d'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              7 ngày gần nhất
            </button>
          </div>

          <button
            onClick={loadAllData}
            disabled={loading}
            className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all disabled:opacity-50 cursor-pointer"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
            <span className="hidden sm:inline">Cập nhật</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 space-y-3 shadow-xl">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
          <span className="text-xs font-bold">Đang tổng hợp dữ liệu thống kê hệ thống...</span>
        </div>
      ) : (
        <>
          {/* ==================================================== */}
          {/* SECTION 1: THỐNG KÊ TÀI KHOẢN                        */}
          {/* ==================================================== */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
              <h3 className="text-xs font-black text-blue-400 uppercase tracking-wider">
                1. THỐNG KÊ TÀI KHOẢN
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Card 1: Tổng số tài khoản */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-2 relative overflow-hidden group hover:border-blue-500/40 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng số tài khoản</span>
                  <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-3xl font-black text-white">
                  {totalUsers}
                </div>
                <div className="text-[11px] text-slate-400 font-medium flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Toàn bộ người dùng đã khởi tạo</span>
                </div>
                <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-blue-500/5 rounded-full blur-xl group-hover:bg-blue-500/10 transition-all" />
              </div>

              {/* Card 2: Giáo viên đang hoạt động */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-2 relative overflow-hidden group hover:border-emerald-500/40 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Giáo viên đang hoạt động</span>
                  <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <UserCheck className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-3xl font-black text-emerald-300">
                  {activeTeacherCount}
                </div>
                <div className="text-[11px] text-slate-400 font-medium flex items-center space-x-1">
                  <span className="font-bold text-emerald-400">
                    {totalTeacherCount > 0 ? Math.round((activeTeacherCount / totalTeacherCount) * 100) : 0}%
                  </span>
                  <span>tổng số giáo viên</span>
                </div>
                <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-all" />
              </div>

              {/* Card 3: Tài khoản bị khóa */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-2 relative overflow-hidden group hover:border-rose-500/40 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">Tài khoản bị khóa</span>
                  <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
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

              {/* Card 4: Tổng số Admin */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-2 relative overflow-hidden group hover:border-purple-500/40 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Tổng số Admin</span>
                  <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-3xl font-black text-purple-300">
                  {adminCount}
                </div>
                <div className="text-[11px] text-slate-400 font-medium flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                  <span>Tài khoản có quyền Quản trị</span>
                </div>
                <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-purple-500/5 rounded-full blur-xl group-hover:bg-purple-500/10 transition-all" />
              </div>

            </div>
          </div>

          {/* ==================================================== */}
          {/* SECTION 2: THỐNG KÊ MỨC ĐỘ SỬ DỤNG                  */}
          {/* ==================================================== */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                <h3 className="text-xs font-black text-emerald-400 uppercase tracking-wider">
                  2. THỐNG KÊ MỨC ĐỘ SỬ DỤNG DỮ LIỆU
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">
                * Chỉ đếm số lượng, không xem nội dung chuyên môn riêng tư
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              
              {/* Đã sử dụng hệ thống */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-1.5 hover:border-indigo-500/30 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-indigo-300 uppercase">Đã truy cập</span>
                  <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-2xl font-black text-white">
                  {usedSystemTeachersCount}
                </div>
                <div className="text-[10px] text-slate-400">
                  Giáo viên đã từng đăng nhập
                </div>
              </div>

              {/* Chưa sử dụng hệ thống */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-1.5 hover:border-amber-500/30 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-300 uppercase">Chưa truy cập</span>
                  <Clock className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-black text-amber-300">
                  {unusedSystemTeachersCount}
                </div>
                <div className="text-[10px] text-slate-400">
                  Chưa ghi nhận đăng nhập
                </div>
              </div>

              {/* Đã tạo TKB */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-1.5 hover:border-cyan-500/30 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-cyan-300 uppercase">Đã tạo TKB</span>
                  <CalendarCheck className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-2xl font-black text-cyan-300">
                  {teachersWithTimetableCount}
                </div>
                <div className="text-[10px] text-slate-400">
                  Có ít nhất 1 bản Thời khóa biểu
                </div>
              </div>

              {/* Đã cấu hình tuần học */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-1.5 hover:border-teal-500/30 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-teal-300 uppercase">Cấu hình Tuần</span>
                  <Calendar className="w-4 h-4 text-teal-400" />
                </div>
                <div className="text-2xl font-black text-teal-300">
                  {teachersWithAcademicWeeksCount}
                </div>
                <div className="text-[10px] text-slate-400">
                  Đã cấu hình năm học & tuần
                </div>
              </div>

              {/* Đã có Lịch báo giảng */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-1.5 hover:border-purple-500/30 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-purple-300 uppercase">Có Lịch báo giảng</span>
                  <FileSpreadsheet className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-2xl font-black text-purple-300">
                  {teachersWithSchedulesCount}
                </div>
                <div className="text-[10px] text-slate-400">
                  Đã phát sinh dữ liệu LBG
                </div>
              </div>

            </div>
          </div>

          {/* ==================================================== */}
          {/* SECTION 3: THỐNG KÊ HOẠT ĐỘNG HỆ THỐNG             */}
          {/* ==================================================== */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-purple-500"></div>
                <h3 className="text-xs font-black text-purple-400 uppercase tracking-wider">
                  3. HOẠT ĐỘNG HỆ THỐNG GHI NHẬN (NHẬT KÝ systemLogs)
                </h3>
              </div>
              <span className="text-[11px] text-purple-300 font-bold bg-purple-500/10 px-2.5 py-0.5 rounded-md border border-purple-500/20">
                Lọc: {filterRange === 'all' ? 'Tất cả thời gian' : filterRange === '7d' ? '7 ngày gần nhất' : '30 ngày gần nhất'}
              </span>
            </div>

            {totalLogsCount === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-2">
                <AlertCircle className="w-8 h-8 text-slate-500 mx-auto" />
                <p className="text-xs font-bold text-slate-400">Chưa có dữ liệu hoạt động trong khoảng thời gian được chọn</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                
                {/* Tổng số lượt */}
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-1">
                  <Activity className="w-4 h-4 text-indigo-400 mx-auto" />
                  <div className="text-lg font-black text-white">{totalLogsCount}</div>
                  <div className="text-[10px] text-slate-400 font-bold">Tổng lượt ghi nhận</div>
                </div>

                {/* Đăng nhập */}
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-1">
                  <LogIn className="w-4 h-4 text-emerald-400 mx-auto" />
                  <div className="text-lg font-black text-emerald-300">{loginLogsCount}</div>
                  <div className="text-[10px] text-slate-400 font-bold">Lượt đăng nhập</div>
                </div>

                {/* Thao tác Admin */}
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-1">
                  <ShieldCheck className="w-4 h-4 text-purple-400 mx-auto" />
                  <div className="text-lg font-black text-purple-300">{adminActionLogsCount}</div>
                  <div className="text-[10px] text-slate-400 font-bold">Thao tác Admin</div>
                </div>

                {/* Tài khoản được tạo */}
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-1">
                  <UserPlus className="w-4 h-4 text-blue-400 mx-auto" />
                  <div className="text-lg font-black text-blue-300">{accountCreatedLogsCount}</div>
                  <div className="text-[10px] text-slate-400 font-bold">Tài khoản được tạo</div>
                </div>

                {/* Khóa / Mở khóa */}
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-1">
                  <Lock className="w-4 h-4 text-rose-400 mx-auto" />
                  <div className="text-lg font-black text-rose-300">{lockUnlockLogsCount}</div>
                  <div className="text-[10px] text-slate-400 font-bold">Khóa / Mở khóa</div>
                </div>

                {/* Phân quyền */}
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-1">
                  <Key className="w-4 h-4 text-amber-400 mx-auto" />
                  <div className="text-lg font-black text-amber-300">{roleChangeLogsCount}</div>
                  <div className="text-[10px] text-slate-400 font-bold">Thay đổi quyền</div>
                </div>

                {/* Cập nhật Cấu hình */}
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-1">
                  <Settings className="w-4 h-4 text-cyan-400 mx-auto" />
                  <div className="text-lg font-black text-cyan-300">{configUpdateLogsCount}</div>
                  <div className="text-[10px] text-slate-400 font-bold">Sửa Cấu hình</div>
                </div>

              </div>
            )}
          </div>

          {/* ==================================================== */}
          {/* SECTION 4: BIỂU ĐỒ TRỰC QUAN (MAX 3 BIỂU ĐỒ)       */}
          {/* ==================================================== */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center space-x-2">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
              <h3 className="text-xs font-black text-amber-400 uppercase tracking-wider">
                4. BIỂU ĐỒ THỐNG KÊ TRỰC QUAN
              </h3>
            </div>

            {/* Row 1: Biểu đồ Trạng thái Tài khoản & Phân bố Vai trò */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Biểu đồ 1: Trạng thái tài khoản */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <PieIcon className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      1. Phân bố Trạng thái Tài khoản
                    </h4>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {totalUsers} Tài khoản
                  </span>
                </div>

                {totalUsers === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500">Chưa có dữ liệu</div>
                ) : (
                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={accountStatusChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {accountStatusChartData.map((entry, index) => (
                            <Cell key={`cell-status-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
                        />
                        <Legend
                          verticalAlign="bottom"
                          height={36}
                          wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Biểu đồ 2: Phân bố vai trò tài khoản */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <BarChart2 className="w-4 h-4 text-purple-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      2. Phân bố Vai trò Tài khoản
                    </h4>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Giáo viên vs Admin
                  </span>
                </div>

                {totalUsers === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500">Chưa có dữ liệu</div>
                ) : (
                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={roleDistributionChartData} margin={{ top: 20, right: 20, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
                        />
                        <Bar dataKey="value" name="Số lượng" radius={[8, 8, 0, 0]}>
                          {roleDistributionChartData.map((entry, index) => (
                            <Cell key={`cell-role-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

            </div>

            {/* Row 2: Biểu đồ 3 - Hoạt động hệ thống theo thời gian */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-indigo-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    3. Hoạt động Hệ thống theo Thời gian (Dựa trên systemLogs thực tế)
                  </h4>
                </div>
                <span className="text-[11px] text-indigo-300 font-bold">
                  {filterRange === 'all' ? 'Tất cả lịch sử' : filterRange === '7d' ? '7 ngày gần đây' : '30 ngày gần đây'}
                </span>
              </div>

              {activityTimelineData.length === 0 ? (
                <div className="py-16 text-center text-xs text-slate-500">
                  Chưa có nhật ký hoạt động nào được ghi nhận trong thời gian này
                </div>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={activityTimelineData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorLogins" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="displayDate" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
                      />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                      <Area type="monotone" dataKey="total" name="Tổng hoạt động" stroke="#6366f1" fillOpacity={1} fill="url(#colorTotal)" />
                      <Area type="monotone" dataKey="logins" name="Đăng nhập" stroke="#10b981" fillOpacity={1} fill="url(#colorLogins)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

          </div>
        </>
      )}

    </div>
  );
};
