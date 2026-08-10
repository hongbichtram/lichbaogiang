import React, { useState, useEffect } from 'react';
import { AppUser, UserRole, UserStatus } from '../../types';
import { getAllUsers, toggleUserStatus, updateUserRole } from '../../services/adminService';
import { TeacherDetailModal } from './TeacherDetailModal';
import { 
  Users, 
  Search, 
  Filter, 
  RefreshCw, 
  Lock, 
  Unlock, 
  Shield, 
  UserCheck, 
  Eye, 
  Loader2, 
  AlertTriangle,
  CheckCircle2,
  Ban,
  UserX
} from 'lucide-react';

interface TeacherManagementProps {
  currentUser: any;
}

export const TeacherManagement: React.FC<TeacherManagementProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'teacher'>('all');

  // Modal states
  const [selectedUserForDetail, setSelectedUserForDetail] = useState<AppUser | null>(null);
  const [userToToggleStatus, setUserToToggleStatus] = useState<AppUser | null>(null);
  const [userToChangeRole, setUserToChangeRole] = useState<{ user: AppUser; newRole: UserRole } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const list = await getAllUsers();
      setUsers(list);
    } catch (err) {
      console.error('Failed to load users list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Filtered Users
  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || 
      (user.displayName && user.displayName.toLowerCase().includes(query)) ||
      (user.email && user.email.toLowerCase().includes(query));

    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;

    return matchesSearch && matchesStatus && matchesRole;
  });

  // Handle Confirm Lock / Unlock
  const handleConfirmToggleStatus = async () => {
    if (!userToToggleStatus) return;
    setIsProcessing(true);
    const newStatus: UserStatus = userToToggleStatus.status === 'active' ? 'disabled' : 'active';
    
    const success = await toggleUserStatus(userToToggleStatus, newStatus, {
      uid: currentUser?.uid || 'admin',
      displayName: currentUser?.displayName || 'Admin',
      email: currentUser?.email || ''
    });

    if (success) {
      setUsers(prev => prev.map(u => u.uid === userToToggleStatus.uid ? { ...u, status: newStatus } : u));
    }
    setIsProcessing(false);
    setUserToToggleStatus(null);
  };

  // Handle Confirm Role Change
  const handleConfirmChangeRole = async () => {
    if (!userToChangeRole) return;
    setIsProcessing(true);

    const success = await updateUserRole(userToChangeRole.user, userToChangeRole.newRole, {
      uid: currentUser?.uid || 'admin',
      displayName: currentUser?.displayName || 'Admin',
      email: currentUser?.email || ''
    });

    if (success) {
      setUsers(prev => prev.map(u => u.uid === userToChangeRole.user.uid ? { ...u, role: userToChangeRole.newRole } : u));
    }
    setIsProcessing(false);
    setUserToChangeRole(null);
  };

  const formatDate = (isoStr?: string) => {
    if (!isoStr) return '-';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-indigo-500/20 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white tracking-wide uppercase">
              QUẢN LÝ TÀI KHOẢN GIÁO VIÊN
            </h2>
            <p className="text-xs text-indigo-300/80">
              Danh sách tài khoản hệ thống, trạng thái khóa/mở và phân quyền người dùng
            </p>
          </div>
        </div>

        <button
          onClick={loadUsers}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          <span>Làm mới danh sách</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        
        {/* Search */}
        <div className="md:col-span-6 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên giáo viên, email..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-white placeholder-slate-500 outline-hidden transition-all"
          />
        </div>

        {/* Status Filter */}
        <div className="md:col-span-3 flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1">
          <Filter className="w-4 h-4 text-indigo-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="w-full bg-transparent text-xs text-slate-200 font-medium outline-hidden cursor-pointer py-1.5"
          >
            <option value="all" className="bg-slate-900 text-white">Tất cả trạng thái</option>
            <option value="active" className="bg-slate-900 text-emerald-400">Đang hoạt động</option>
            <option value="disabled" className="bg-slate-900 text-rose-400">Đã bị khóa</option>
          </select>
        </div>

        {/* Role Filter */}
        <div className="md:col-span-3 flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1">
          <Shield className="w-4 h-4 text-purple-400 shrink-0" />
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value as any)}
            className="w-full bg-transparent text-xs text-slate-200 font-medium outline-hidden cursor-pointer py-1.5"
          >
            <option value="all" className="bg-slate-900 text-white">Tất cả vai trò</option>
            <option value="teacher" className="bg-slate-900 text-blue-400">Giáo viên</option>
            <option value="admin" className="bg-slate-900 text-purple-400">Quản trị viên (Admin)</option>
          </select>
        </div>

      </div>

      {/* Users Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 space-y-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
            <span className="text-xs">Đang tải danh sách tài khoản...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 space-y-3 text-center">
            <div className="p-3 bg-slate-800 rounded-full text-slate-400">
              <UserX className="w-8 h-8" />
            </div>
            <h4 className="text-sm font-bold text-slate-300">Không tìm thấy tài khoản nào</h4>
            <p className="text-xs text-slate-500 max-w-sm">
              Thử thay đổi từ khóa tìm kiếm hoặc bỏ bộ lọc để xem đầy đủ danh sách.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-bold text-indigo-300 uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-12 text-center">STT</th>
                  <th className="py-3.5 px-4">Họ và tên</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4 text-center">Vai trò</th>
                  <th className="py-3.5 px-4 text-center">Trạng thái</th>
                  <th className="py-3.5 px-4 text-center">Ngày tạo</th>
                  <th className="py-3.5 px-4 text-center">Lần đăng nhập cuối</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs text-slate-200">
                {filteredUsers.map((user, idx) => (
                  <tr key={user.uid} className="hover:bg-slate-800/40 transition-colors">
                    
                    {/* STT */}
                    <td className="py-3.5 px-4 text-center text-slate-500 font-mono">
                      {idx + 1}
                    </td>

                    {/* Full Name */}
                    <td className="py-3.5 px-4 font-bold text-white">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xs font-black">
                          {(user.displayName || user.email || 'G').charAt(0).toUpperCase()}
                        </div>
                        <span>{user.displayName || 'Chưa đặt tên'}</span>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-3.5 px-4 text-slate-300 font-mono text-[11px]">
                      {user.email}
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center space-x-1">
                        <select
                          value={user.role}
                          onChange={(e) => setUserToChangeRole({ user, newRole: e.target.value as UserRole })}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer outline-hidden transition-all ${
                            user.role === 'admin'
                              ? 'bg-purple-500/10 text-purple-300 border-purple-500/30 hover:bg-purple-500/20'
                              : 'bg-blue-500/10 text-blue-300 border-blue-500/30 hover:bg-blue-500/20'
                          }`}
                        >
                          <option value="teacher" className="bg-slate-900 text-blue-300">Giáo viên</option>
                          <option value="admin" className="bg-slate-900 text-purple-300">Admin</option>
                        </select>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                        user.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                      }`}>
                        {user.status === 'active' ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>Hoạt động</span>
                          </>
                        ) : (
                          <>
                            <Ban className="w-3 h-3 text-rose-400" />
                            <span>Bị khóa</span>
                          </>
                        )}
                      </span>
                    </td>

                    {/* Created Date */}
                    <td className="py-3.5 px-4 text-center text-slate-400 text-[11px]">
                      {formatDate(user.createdAt)}
                    </td>

                    {/* Last Login */}
                    <td className="py-3.5 px-4 text-center text-slate-400 text-[11px]">
                      {formatDate(user.lastLoginAt)}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        
                        {/* View Stats Button */}
                        <button
                          onClick={() => setSelectedUserForDetail(user)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600/30 text-indigo-300 hover:text-white border border-slate-700 transition-colors"
                          title="Xem thống kê sử dụng"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Lock / Unlock Button */}
                        {user.status === 'active' ? (
                          <button
                            onClick={() => setUserToToggleStatus(user)}
                            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 transition-all font-semibold text-[11px]"
                            title="Khóa tài khoản"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Khóa</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => setUserToToggleStatus(user)}
                            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 transition-all font-semibold text-[11px]"
                            title="Mở khóa tài khoản"
                          >
                            <Unlock className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Mở khóa</span>
                          </button>
                        )}

                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Teacher Usage Detail Modal */}
      <TeacherDetailModal
        user={selectedUserForDetail}
        isOpen={!!selectedUserForDetail}
        onClose={() => setSelectedUserForDetail(null)}
      />

      {/* Lock/Unlock Confirmation Modal */}
      {userToToggleStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md p-6 bg-slate-900 border border-amber-500/40 rounded-2xl shadow-2xl text-white space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-amber-300">
                {userToToggleStatus.status === 'active' ? 'XÁC NHẬN KHÓA TÀI KHOẢN' : 'XÁC NHẬN MỞ KHÓA TÀI KHOẢN'}
              </h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {userToToggleStatus.status === 'active' ? (
                <>
                  Bạn có chắc chắn muốn <strong>KHÓA</strong> tài khoản giáo viên <strong>{userToToggleStatus.displayName}</strong> ({userToToggleStatus.email})?
                  <br />
                  <span className="text-amber-400 block mt-2">
                    * Lưu ý: Tài khoản bị khóa sẽ không thể truy cập ứng dụng. Dữ liệu chuyên môn cá nhân của giáo viên được giữ nguyên và không bị xóa.
                  </span>
                </>
              ) : (
                <>
                  Bạn có chắc chắn muốn <strong>MỞ KHÓA</strong> tài khoản cho giáo viên <strong>{userToToggleStatus.displayName}</strong> ({userToToggleStatus.email})?
                </>
              )}
            </p>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setUserToToggleStatus(null)}
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmToggleStatus}
                disabled={isProcessing}
                className={`px-5 py-2 rounded-xl text-white text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  userToToggleStatus.status === 'active'
                    ? 'bg-rose-600 hover:bg-rose-500'
                    : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                {isProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{userToToggleStatus.status === 'active' ? 'Đồng ý Khóa' : 'Đồng ý Mở khóa'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Change Confirmation Modal */}
      {userToChangeRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md p-6 bg-slate-900 border border-purple-500/40 rounded-2xl shadow-2xl text-white space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-purple-500/20 text-purple-400 rounded-xl border border-purple-500/30">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-purple-300">
                XÁC NHẬN THAY ĐỔI VAI TRÒ
              </h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Bạn có chắc chắn muốn đổi vai trò tài khoản <strong>{userToChangeRole.user.displayName}</strong> ({userToChangeRole.user.email}) thành{' '}
              <strong className="text-purple-300 uppercase">{userToChangeRole.newRole === 'admin' ? 'Quản trị viên (Admin)' : 'Giáo viên'}</strong>?
            </p>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setUserToChangeRole(null)}
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmChangeRole}
                disabled={isProcessing}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all flex items-center space-x-1.5"
              >
                {isProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Xác nhận Phân quyền</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
