import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Key,
  Shield,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Clock,
  Phone,
  Mail,
  Eye,
} from 'lucide-react';
import { usersService, tokenStorage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import CreateUserModal from './components/CreateUserModal';
import EditUserModal from './components/EditUserModal';
import ChangePasswordModal from './components/ChangePasswordModal';
import DeleteUserModal from './components/DeleteUserModal';
import UserProfileModal from './components/UserProfileModal';

const ROLES = ['ADMIN', 'MANAGER', 'ACCOUNTANT', 'USER'];
const STATUSES = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];

const ROLE_BADGES = {
  ADMIN: 'bg-purple-100 text-purple-800 border-purple-200',
  MANAGER: 'bg-blue-100 text-blue-800 border-blue-200',
  ACCOUNTANT: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  USER: 'bg-slate-100 text-slate-700 border-slate-200',
};

const STATUS_BADGES = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  INACTIVE: 'bg-amber-50 text-amber-700 border-amber-200',
  SUSPENDED: 'bg-rose-50 text-rose-700 border-rose-200',
};

const getRoleBadge = (role) => ROLE_BADGES[role] || ROLE_BADGES.USER;
const getStatusBadge = (status) => STATUS_BADGES[status] || 'bg-slate-50 text-slate-700 border-slate-200';

export default function UserManagement() {
  const { user: currentUser, isAuthenticated, login } = useAuth();
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState('');

  // Filters with 300ms debounce on search input
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewingProfileUser, setViewingProfileUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [passwordTargetUser, setPasswordTargetUser] = useState(null);
  const [deleteTargetUser, setDeleteTargetUser] = useState(null);

  // Debounce search to prevent excessive backend queries
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch users from backend DB with race condition guard
  const fetchUsers = useCallback(async (page = 1) => {
    setIsLoading(true);
    setError(null);
    let active = true;

    try {
      const res = await usersService.list({
        page,
        limit: pagination.limit,
        search: debouncedSearch,
        role: roleFilter,
        status: statusFilter,
      });

      if (active && res?.data?.users) {
        setUsers(res.data.users);
        if (res.data.pagination) {
          setPagination(res.data.pagination);
        }
      }
    } catch (err) {
      if (active) {
        setError(err.message || 'Failed to load users from database.');
      }
    } finally {
      if (active) {
        setIsLoading(false);
      }
    }

    return () => {
      active = false;
    };
  }, [debouncedSearch, roleFilter, statusFilter, pagination.limit]);

  useEffect(() => {
    fetchUsers(1);
  }, [fetchUsers]);

  const showNotification = (msg) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(''), 4000);
  };

  // Status Change Handler
  const handleStatusChange = async (userId, newStatus) => {
    try {
      await usersService.updateStatus(userId, newStatus);
      showNotification(`User status changed to ${newStatus}.`);
      fetchUsers(pagination.page);
    } catch (err) {
      alert(`Error updating status: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-white/40 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-tr from-indigo-600 to-cyan-500 rounded-xl text-white shadow-md shadow-indigo-500/20">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">User Management</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Create, manage and control access roles stored directly in your PostgreSQL database.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchUsers(pagination.page)}
            disabled={isLoading}
            className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-2xl shadow-sm transition-all flex items-center justify-center cursor-pointer"
            title="Refresh Users"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-700 hover:to-cyan-600 text-white font-medium rounded-2xl shadow-lg shadow-indigo-500/25 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New User</span>
          </button>
        </div>
      </div>

      {/* Unauthenticated Alert Banner */}
      {!isAuthenticated && (
        <div className="p-6 bg-gradient-to-r from-indigo-50/90 to-cyan-50/90 border border-indigo-200/80 rounded-3xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-indigo-600 rounded-2xl text-white shadow-md shadow-indigo-500/25 shrink-0 mt-0.5 sm:mt-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Authentication Notice</h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Logged in as guest. Click below to authenticate as Administrator if needed.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              onClick={async () => {
                const res = await login('admin', 'admin123');
                if (res.success) {
                  showNotification('Signed in as Admin!');
                  fetchUsers(1);
                } else {
                  setError(res.error);
                }
              }}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-700 hover:to-cyan-600 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
            >
              1-Click Sign In (admin)
            </button>
          </div>
        </div>
      )}

      {/* Notifications */}
      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-sm flex items-center gap-2 shadow-sm">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-sm flex items-start gap-3 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-rose-900">Notice</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Filters Toolbar */}
      <div className="glass-panel p-4 rounded-2xl border border-white/40 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, phone..."
            className="w-full pl-10 pr-4 py-2 bg-white/80 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 bg-white/80 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-auto cursor-pointer"
            >
              <option value="">All Roles</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white/80 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-auto cursor-pointer"
            >
              <option value="">All Statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="glass-panel rounded-3xl border border-white/40 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/60 bg-slate-50/50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-6">User</th>
                <th className="py-3.5 px-6">Contact</th>
                <th className="py-3.5 px-6">Role</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6">Last Login</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading && users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <div className="inline-flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
                      <span>Loading users from database...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <p className="font-medium text-slate-600">No users found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {search || roleFilter || statusFilter
                        ? 'Try clearing your filters'
                        : 'Click "Add New User" to create your first user in PostgreSQL'}
                    </p>
                  </td>
                </tr>
              ) : (
                users.map((item) => {
                  const isCurrent = currentUser?.id === item.id;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6">
                        <button
                          type="button"
                          onClick={() => setViewingProfileUser(item)}
                          className="flex items-center gap-3 text-left group cursor-pointer w-full focus:outline-none"
                          title="Click to view full user profile"
                        >
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0 group-hover:scale-105 group-hover:shadow-indigo-500/25 transition-all">
                            {(item.name || 'U')[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-slate-800 flex items-center gap-1.5 group-hover:text-indigo-600 transition-colors">
                              <span>{item.name}</span>
                              {isCurrent && (
                                <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-mono font-semibold">
                                  YOU
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              <span>{item.email}</span>
                            </div>
                          </div>
                        </button>
                      </td>

                      <td className="py-4 px-6 text-xs text-slate-600">
                        {item.phone ? (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{item.phone}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No phone</span>
                        )}
                      </td>

                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getRoleBadge(item.role)}`}>
                          {item.role}
                        </span>
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <select
                            value={item.status}
                            disabled={isCurrent}
                            onChange={(e) => handleStatusChange(item.id, e.target.value)}
                            className={`text-xs font-medium px-2 py-1 rounded-lg border focus:outline-none cursor-pointer ${getStatusBadge(item.status)} disabled:opacity-60 disabled:cursor-not-allowed`}
                          >
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="INACTIVE">INACTIVE</option>
                            <option value="SUSPENDED">SUSPENDED</option>
                          </select>
                        </div>
                      </td>

                      <td className="py-4 px-6 text-xs text-slate-500">
                        {item.lastLoginAt ? (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{new Date(item.lastLoginAt).toLocaleDateString()}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Never</span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => setViewingProfileUser(item)}
                            title="View full profile"
                            className="p-1.5 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setEditingUser(item)}
                            title="Edit user details"
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setPasswordTargetUser(item)}
                            title="Change password"
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Key className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setDeleteTargetUser(item)}
                            disabled={isCurrent}
                            title={isCurrent ? "You cannot delete yourself" : "Delete user"}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {users.length} of {pagination.total} users
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchUsers(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Previous
              </button>
              <span className="font-semibold text-slate-700">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => fetchUsers(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ISOLATED MODALS */}
      {isCreateOpen && (
        <CreateUserModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onSuccess={(msg) => {
            showNotification(msg);
            fetchUsers(1);
          }}
        />
      )}

      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSuccess={(msg) => {
            showNotification(msg);
            fetchUsers(pagination.page);
          }}
        />
      )}

      {passwordTargetUser && (
        <ChangePasswordModal
          user={passwordTargetUser}
          currentUser={currentUser}
          onClose={() => setPasswordTargetUser(null)}
          onSuccess={(msg) => showNotification(msg)}
        />
      )}

      {deleteTargetUser && (
        <DeleteUserModal
          user={deleteTargetUser}
          onClose={() => setDeleteTargetUser(null)}
          onSuccess={(msg) => {
            showNotification(msg);
            fetchUsers(pagination.page);
          }}
        />
      )}

      {viewingProfileUser && (
        <UserProfileModal
          isOpen={Boolean(viewingProfileUser)}
          user={viewingProfileUser}
          currentUser={currentUser}
          onClose={() => setViewingProfileUser(null)}
          onEdit={(usr) => setEditingUser(usr)}
          onChangePassword={(usr) => setPasswordTargetUser(usr)}
        />
      )}
    </div>
  );
}
