import React, { useState, useEffect } from 'react';
import { SystemLog } from '../../types';
import { fetchSystemLogs } from '../../services/adminService';
import { 
  History, 
  Search, 
  Filter, 
  RefreshCw, 
  Loader2, 
  ShieldAlert, 
  LogIn, 
  LogOut, 
  Lock, 
  Unlock, 
  Shield, 
  Settings,
  Clock
} from 'lucide-react';

export const ActivityLogs: React.FC = () => {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await fetchSystemLogs();
      setLogs(data);
    } catch (err) {
      console.error('Failed to load system activity logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery = !query ||
      (log.performerName && log.performerName.toLowerCase().includes(query)) ||
      (log.performerEmail && log.performerEmail.toLowerCase().includes(query)) ||
      (log.targetUserName && log.targetUserName.toLowerCase().includes(query)) ||
      (log.details && log.details.toLowerCase().includes(query));

    const matchesAction = actionFilter === 'all' || log.action === actionFilter;

    return matchesQuery && matchesAction;
  });

  const getActionBadge = (action: string, label?: string) => {
    switch (action) {
      case 'login':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
            <LogIn className="w-3 h-3 text-emerald-400" />
            <span>Đăng nhập</span>
          </span>
        );
      case 'logout':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-500/10 text-slate-300 border border-slate-500/30 text-[11px] font-bold">
            <LogOut className="w-3 h-3 text-slate-400" />
            <span>Đăng xuất</span>
          </span>
        );
      case 'lock_user':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/30 text-[11px] font-bold">
            <Lock className="w-3 h-3 text-rose-400" />
            <span>Khóa tài khoản</span>
          </span>
        );
      case 'unlock_user':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
            <Unlock className="w-3 h-3 text-emerald-400" />
            <span>Mở khóa tài khoản</span>
          </span>
        );
      case 'change_role':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/30 text-[11px] font-bold">
            <Shield className="w-3 h-3 text-purple-400" />
            <span>Phân quyền</span>
          </span>
        );
      case 'update_system_config':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 text-[11px] font-bold">
            <Settings className="w-3 h-3 text-indigo-400" />
            <span>Cấu hình hệ thống</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/30 text-[11px] font-bold">
            <span>{label || action}</span>
          </span>
        );
    }
  };

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-indigo-500/20 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white uppercase tracking-wide">
              NHẬT KÝ HOẠT ĐỘNG HỆ THỐNG
            </h2>
            <p className="text-xs text-indigo-300/80">
              Lịch sử ghi nhận thao tác đăng nhập, đăng xuất, phân quyền và khóa tài khoản
            </p>
          </div>
        </div>

        <button
          onClick={loadLogs}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all self-start sm:self-auto disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          <span>Làm mới nhật ký</span>
        </button>
      </div>

      {/* Search & Filter */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        
        {/* Search */}
        <div className="md:col-span-8 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tìm nhật ký theo tên người thực hiện, target user, chi tiết..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-white placeholder-slate-500 outline-hidden transition-all"
          />
        </div>

        {/* Action Filter */}
        <div className="md:col-span-4 flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1">
          <Filter className="w-4 h-4 text-indigo-400 shrink-0" />
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="w-full bg-transparent text-xs text-slate-200 font-medium outline-hidden cursor-pointer py-1.5"
          >
            <option value="all" className="bg-slate-900 text-white">Tất cả hành động</option>
            <option value="login" className="bg-slate-900 text-emerald-400">Đăng nhập</option>
            <option value="logout" className="bg-slate-900 text-slate-400">Đăng xuất</option>
            <option value="lock_user" className="bg-slate-900 text-rose-400">Khóa tài khoản</option>
            <option value="unlock_user" className="bg-slate-900 text-emerald-400">Mở khóa tài khoản</option>
            <option value="change_role" className="bg-slate-900 text-purple-400">Phân quyền</option>
            <option value="update_system_config" className="bg-slate-900 text-indigo-400">Cấu hình hệ thống</option>
          </select>
        </div>

      </div>

      {/* Logs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 space-y-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
            <span className="text-xs">Đang tải nhật ký hoạt động hệ thống...</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 space-y-3 text-center">
            <div className="p-3 bg-slate-800 rounded-full text-slate-400">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h4 className="text-sm font-bold text-slate-300">Chưa có bản ghi nhật ký phù hợp</h4>
            <p className="text-xs text-slate-500 max-w-sm">
              Nhật ký sẽ tự động được ghi nhận khi có thao tác tài khoản hoặc thay đổi cấu hình.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-bold text-indigo-300 uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-44">Thời gian</th>
                  <th className="py-3.5 px-4">Người thực hiện</th>
                  <th className="py-3.5 px-4 text-center">Hành động</th>
                  <th className="py-3.5 px-4">Chi tiết thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs text-slate-200">
                {filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    
                    {/* Timestamp */}
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span>{formatDate(log.timestamp)}</span>
                      </div>
                    </td>

                    {/* Performer */}
                    <td className="py-3.5 px-4 font-bold text-white">
                      <div>
                        <span className="block leading-tight">{log.performerName || 'Hệ thống'}</span>
                        <span className="text-[10px] text-slate-400 font-mono block">{log.performerEmail}</span>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {getActionBadge(log.action, log.actionLabel)}
                    </td>

                    {/* Details */}
                    <td className="py-3.5 px-4 text-slate-300 leading-relaxed">
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
