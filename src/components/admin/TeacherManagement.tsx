import React, { useState, useEffect } from 'react';
import { AppUser, UserRole, UserStatus } from '../../types';
import { getAllUsers, toggleUserStatus, updateUserRole, approveUser, rejectUser } from '../../services/adminService';
import { TeacherDetailModal } from './TeacherDetailModal';
import { CreateTeacherModal } from './CreateTeacherModal';
import { 
  Users, 
  Search, 
  Filter, 
  RefreshCw, 
  Lock, 
  Unlock, 
  Shield, 
  Eye, 
  Loader2, 
  AlertTriangle,
  CheckCircle2,
  Ban,
  UserX,
  UserPlus,
  AlertCircle,
  Clock,
  Check,
  X,
  UserCheck
} from 'lucide-react';

interface TeacherManagementProps {
  currentUser: any;
}

export const TeacherManagement: React.FC<TeacherManagementProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'suspended'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'teacher'>('all');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedUserForDetail, setSelectedUserForDetail] = useState<AppUser | null>(null);
  const [userToToggleStatus, setUserToToggleStatus] = useState<AppUser | null>(null);
  const [userToApprove, setUserToApprove] = useState<AppUser | null>(null);
  const [userToReject, setUserToReject] = useState<AppUser | null>(null);
  const [userToChangeRole, setUserToChangeRole] = useState<{ user: AppUser; newRole: UserRole } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

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

  const pendingCount = users.filter(u => u.status === 'pending').length;

  // Filtered Users
  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || 
      (user.displayName && user.displayName.toLowerCase().includes(query)) ||
      (user.email && user.email.toLowerCase().includes(query)) ||
      (user.teacherCode && user.teacherCode.toLowerCase().includes(query));

    let matchesStatus = true;
    if (statusFilter === 'pending') matchesStatus = user.status === 'pending';
    else if (statusFilter === 'approved') matchesStatus = user.status === 'approved' || user.status === 'active';
    else if (statusFilter === 'rejected') matchesStatus = user.status === 'rejected';
    else if (statusFilter === 'suspended') matchesStatus = user.status === 'suspended' || user.status === 'disabled';

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;

    return matchesSearch && matchesStatus && matchesRole;
  });

  // Handle Approve User
  const handleConfirmApprove = async () => {
    if (!userToApprove) return;
    setIsProcessing(true);
    setActionError(null);

    const res = await approveUser(userToApprove, {
      uid: currentUser?.uid || 'admin',
      displayName: currentUser?.displayName || 'Admin',
      email: currentUser?.email || ''
    });

    if (res.success) {
      setUsers(prev => prev.map(u => u.uid === userToApprove.uid ? { ...u, status: 'approved' } : u));
      setUserToApprove(null);
    } else {
      setActionError(res.message || 'Không thể phê duyệt tài khoản.');
    }
    setIsProcessing(false);
  };

  // Handle Reject User
  const handleConfirmReject = async () => {
    if (!userToReject) return;
    setIsProcessing(true);
    setActionError(null);

    const res = await rejectUser(userToReject, {
      uid: currentUser?.uid || 'admin',
      displayName: currentUser?.displayName || 'Admin',
      email: currentUser?.email || ''
    });

    if (res.success) {
      setUsers(prev => prev.map(u => u.uid === userToReject.uid ? { ...u, status: 'rejected' } : u));
      setUserToReject(null);
    } else {
      setActionError(res.message || 'Không thể từ chối tài khoản.');
    }
    setIsProcessing(false);
  };

  // Handle Confirm Lock / Unlock
  const handleConfirmToggleStatus = async () => {
    if (!userToToggleStatus) return;
    setIsProcessing(true);
    setActionError(null);

    const isCurrentlyActive = userToToggleStatus.status === 'active' || userToToggleStatus.status === 'approved';
    const newStatus: UserStatus = isCurrentlyActive ? 'suspended' : 'approved';
    
    const res = await toggleUserStatus(userToToggleStatus, newStatus, {
      uid: currentUser?.uid || 'admin',
      displayName: currentUser?.displayName || 'Admin',
      email: currentUser?.email || ''
    });

    if (res.success) {
      setUsers(prev => prev.map(u => u.uid === userToToggleStatus.uid ? { ...u, status: newStatus } : u));
      setUserToToggleStatus(null);
    } else {
      setActionError(res.message || 'Không thể thay đổi trạng thái tài khoản.');
    }
    setIsProcessing(false);
  };

  // Handle Confirm Role Change
  const handleConfirmChangeRole = async () => {
    if (!userToChangeRole) return;
    setIsProcessing(true);
    setActionError(null);

    const res = await updateUserRole(userToChangeRole.user, userToChangeRole.newRole, {
      uid: currentUser?.uid || 'admin',
      displayName: currentUser?.displayName || 'Admin',
      email: currentUser?.email || ''
    });

    if (res.success) {
      setUsers(prev => prev.map(u => u.uid === userToChangeRole.user.uid ? { ...u, role: userToChangeRole.newRole } : u));
      setUserToChangeRole(null);
    } else {
      setActionError(res.message || 'Không thể thay đổi vai trò tài khoản.');
    }
    setIsProcessing(false);
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
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-black text-white tracking-wide uppercase">
                QUẢN LÝ TÀI KHOẢN & PHÂN QUYỀN
              </h2>
              {pendingCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] animate-pulse">
                  {pendingCount} chờ duyệt
                </span>
              )}
            </div>
            <p className="text-xs text-indigo-300/80">
              Phê duyệt tài khoản mới, phân quyền Admin/Giáo viên và kiểm soát truy cập
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 self-start sm:self-auto">
          <button
            onClick={loadUsers}
            disabled={loading}
            className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
            <span className="hidden sm:inline">Làm mới</span>
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-lg shadow-indigo-600/30 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Thêm giáo viên</span>
          </button>
        </div>
      </div>

      {/* Global Action Error Alert */}
      {actionError && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/40 rounded-2xl text-rose-300 text-xs flex items-center justify-between space-x-3 shadow-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span className="font-semibold">{actionError}</span>
          </div>
          <button 
            onClick={() => setActionError(null)}
            className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 rounded-lg text-[11px] font-bold"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Pending Banner Alert if any pending users */}
      {pendingCount > 0 && statusFilter !== 'pending' && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between gap-3 text-amber-200 text-xs">
          <div className="flex items-center space-x-2.5">
            <Clock className="w-5 h-5 text-amber-400 shrink-0" />
            <span>
              Có <strong>{pendingCount}</strong> tài khoản giáo viên mới đang <strong>Chờ Quản trị viên phê duyệt</strong> để truy cập hệ thống.
            </span>
          </div>
          <button
            onClick={() => setStatusFilter('pending')}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] transition-all cursor-pointer shrink-0"
          >
            Xem danh sách chờ duyệt
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        
        {/* Search */}
        <div className="md:col-span-6 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên giáo viên, email, mã GV..."
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
            <option value="pending" className="bg-slate-900 text-amber-400">⏳ Chờ phê duyệt {pendingCount > 0 ? `(${pendingCount})` : ''}</option>
            <option value="approved" className="bg-slate-900 text-emerald-400">✓ Đã phê duyệt / Hoạt động</option>
            <option value="rejected" className="bg-slate-900 text-slate-400">✕ Bị từ chối</option>
            <option value="suspended" className="bg-slate-900 text-rose-400">⊘ Đã bị khóa</option>
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
              Thử thay đổi từ khóa tìm kiếm hoặc bấm <strong>"+ Thêm giáo viên"</strong> để tạo tài khoản mới.
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
                  <th className="py-3.5 px-4 text-center">Mã GV</th>
                  <th className="py-3.5 px-4 text-center">Vai trò</th>
                  <th className="py-3.5 px-4 text-center">Trạng thái</th>
                  <th className="py-3.5 px-4 text-center">Ngày tạo</th>
                  <th className="py-3.5 px-4 text-center">Lần đăng nhập cuối</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs text-slate-200">
                {filteredUsers.map((user, idx) => {
                  const isPending = user.status === 'pending';
                  const isApproved = user.status === 'approved' || user.status === 'active';
                  const isRejected = user.status === 'rejected';
                  const isSuspended = user.status === 'suspended' || user.status === 'disabled';

                  return (
                    <tr key={user.uid} className={`transition-colors ${isPending ? 'bg-amber-500/5 hover:bg-amber-500/10' : 'hover:bg-slate-800/40'}`}>
                      
                      {/* STT */}
                      <td className="py-3.5 px-4 text-center text-slate-500 font-mono">
                        {idx + 1}
                      </td>

                      {/* Full Name */}
                      <td className="py-3.5 px-4 font-bold text-white">
                        <div className="flex items-center space-x-2.5">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-black shrink-0 ${
                            isPending 
                              ? 'bg-amber-500 text-slate-950 font-bold' 
                              : isApproved
                              ? 'bg-gradient-to-tr from-blue-600 to-indigo-600'
                              : 'bg-slate-700 text-slate-300'
                          }`}>
                            {(user.displayName || user.email || 'G').charAt(0).toUpperCase()}
                          </div>
                          <span className="truncate max-w-[150px] sm:max-w-none">{user.displayName || 'Chưa đặt tên'}</span>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3.5 px-4 text-slate-300 font-mono text-[11px]">
                        {user.email}
                      </td>

                      {/* Teacher Code */}
                      <td className="py-3.5 px-4 text-center font-mono text-[11px] text-indigo-300 font-semibold">
                        {user.teacherCode || '-'}
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center space-x-1">
                          <select
                            value={user.role}
                            onChange={(e) => {
                              setActionError(null);
                              setUserToChangeRole({ user, newRole: e.target.value as UserRole });
                            }}
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
                        {isPending ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            <Clock className="w-3 h-3 text-amber-400 animate-pulse" />
                            <span>Chờ duyệt</span>
                          </span>
                        ) : isApproved ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>Đã duyệt</span>
                          </span>
                        ) : isRejected ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                            <X className="w-3 h-3 text-slate-400" />
                            <span>Bị từ chối</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-300 border border-rose-500/30">
                            <Ban className="w-3 h-3 text-rose-400" />
                            <span>Đã khóa</span>
                          </span>
                        )}
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
                          
                          {/* View Details Modal Button */}
                          <button
                            onClick={() => setSelectedUserForDetail(user)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600/30 text-indigo-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                            title="Xem chi tiết & Thống kê giáo viên"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Specific Actions based on status */}
                          {isPending ? (
                            <>
                              <button
                                onClick={() => {
                                  setActionError(null);
                                  setUserToApprove(user);
                                }}
                                className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                                title="Phê duyệt cho phép vào hệ thống"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Phê duyệt</span>
                              </button>

                              <button
                                onClick={() => {
                                  setActionError(null);
                                  setUserToReject(user);
                                }}
                                className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white border border-slate-700 font-semibold text-[11px] transition-all cursor-pointer"
                                title="Từ chối yêu cầu truy cập"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Từ chối</span>
                              </button>
                            </>
                          ) : isRejected ? (
                            <button
                              onClick={() => {
                                setActionError(null);
                                setUserToApprove(user);
                              }}
                              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 transition-all font-semibold text-[11px] cursor-pointer"
                              title="Phê duyệt lại tài khoản"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Duyệt lại</span>
                            </button>
                          ) : isSuspended ? (
                            <button
                              onClick={() => {
                                setActionError(null);
                                setUserToToggleStatus(user);
                              }}
                              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 transition-all font-semibold text-[11px] cursor-pointer"
                              title="Mở khóa tài khoản"
                            >
                              <Unlock className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Mở khóa</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setActionError(null);
                                setUserToToggleStatus(user);
                              }}
                              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 transition-all font-semibold text-[11px] cursor-pointer"
                              title="Khóa tài khoản"
                            >
                              <Lock className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Khóa</span>
                            </button>
                          )}

                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Teacher Modal */}
      <CreateTeacherModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={loadUsers}
        currentUser={currentUser}
      />

      {/* Teacher Usage Detail Modal */}
      <TeacherDetailModal
        user={selectedUserForDetail}
        isOpen={!!selectedUserForDetail}
        onClose={() => setSelectedUserForDetail(null)}
      />

      {/* Approve Confirmation Modal */}
      {userToApprove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md p-6 bg-slate-900 border border-emerald-500/40 rounded-2xl shadow-2xl text-white space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                <UserCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-emerald-300">
                XÁC NHẬN PHÊ DUYỆT TÀI KHOẢN
              </h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Bạn có chắc chắn muốn <strong>PHÊ DUYỆT</strong> quyền truy cập hệ thống cho giáo viên <strong>{userToApprove.displayName}</strong> ({userToApprove.email})?
              <br />
              <span className="text-emerald-400 block mt-2">
                * Sau khi phê duyệt, giáo viên có thể vào sử dụng Lịch báo giảng, Thời khóa biểu và Phân phối chương trình.
              </span>
            </p>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setUserToApprove(null)}
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmApprove}
                disabled={isProcessing}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-lg shadow-emerald-600/30"
              >
                {isProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Đồng ý Phê duyệt</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Confirmation Modal */}
      {userToReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md p-6 bg-slate-900 border border-rose-500/40 rounded-2xl shadow-2xl text-white space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30">
                <Ban className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-rose-300">
                XÁC NHẬN TỪ CHỐI TÀI KHOẢN
              </h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Bạn có chắc chắn muốn <strong>TỪ CHỐI</strong> cấp quyền cho tài khoản <strong>{userToReject.displayName}</strong> ({userToReject.email})?
              <br />
              <span className="text-rose-400 block mt-2">
                * Giáo viên sẽ nhận được thông báo từ chối và không thể truy cập hệ thống.
              </span>
            </p>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setUserToReject(null)}
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={isProcessing}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-lg shadow-rose-600/30"
              >
                {isProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Xác nhận Từ chối</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lock/Unlock Confirmation Modal */}
      {userToToggleStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md p-6 bg-slate-900 border border-amber-500/40 rounded-2xl shadow-2xl text-white space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-amber-300">
                {userToToggleStatus.status === 'active' || userToToggleStatus.status === 'approved' ? 'XÁC NHẬN KHÓA TÀI KHOẢN' : 'XÁC NHẬN MỞ KHÓA TÀI KHOẢN'}
              </h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {userToToggleStatus.status === 'active' || userToToggleStatus.status === 'approved' ? (
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
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmToggleStatus}
                disabled={isProcessing}
                className={`px-5 py-2 rounded-xl text-white text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                  userToToggleStatus.status === 'active' || userToToggleStatus.status === 'approved'
                    ? 'bg-rose-600 hover:bg-rose-500'
                    : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                {isProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{userToToggleStatus.status === 'active' || userToToggleStatus.status === 'approved' ? 'Đồng ý Khóa' : 'Đồng ý Mở khóa'}</span>
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
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmChangeRole}
                disabled={isProcessing}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
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


