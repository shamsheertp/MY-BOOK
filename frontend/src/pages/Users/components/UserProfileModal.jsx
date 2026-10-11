import { useState, useEffect, useCallback } from 'react';
import {
  X,
  Mail,
  Phone,
  Shield,
  Clock,
  Calendar,
  Key,
  Edit2,
  Copy,
  Check,
  Fingerprint,
} from 'lucide-react';
import { usersService } from '../../../services/api';

const ROLE_THEMES = {
  ADMIN: {
    badge: 'bg-purple-100 text-purple-800 border-purple-200',
    gradient: 'from-purple-600 to-indigo-600',
    description: 'Full administrative access: User management, system settings, financial controls, and logs.',
  },
  MANAGER: {
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
    gradient: 'from-blue-600 to-cyan-600',
    description: 'Managerial permissions: Operational dashboards, approvals, staff records, and sales summaries.',
  },
  ACCOUNTANT: {
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    gradient: 'from-emerald-600 to-teal-600',
    description: 'Financial controls: Invoices, ledgers, transaction records, tax reporting, and balance sheets.',
  },
  USER: {
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    gradient: 'from-slate-600 to-slate-800',
    description: 'Standard access: View assigned workspaces, update personal information, and basic entry.',
  },
};

const STATUS_THEMES = {
  ACTIVE: {
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
    label: 'Active Account',
  },
  INACTIVE: {
    bg: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
    label: 'Inactive',
  },
  SUSPENDED: {
    bg: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
    label: 'Suspended',
  },
};

const formatDate = (dateString) => {
  if (!dateString) return 'Never';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
};

export default function UserProfileModal({
  user,
  currentUser,
  isOpen,
  onClose,
  onEdit,
  onChangePassword,
}) {
  const [copiedId, setCopiedId] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [profileData, setProfileData] = useState(user);

  // Handle ESC key and background scroll locking
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Fetch updated user data if needed with race condition protection
  useEffect(() => {
    if (!user || !isOpen) return;
    setProfileData(user);

    let active = true;
    if (user.id && (!user.createdAt || !user.updatedAt)) {
      usersService
        .getById(user.id)
        .then((res) => {
          if (active && res?.data?.user) {
            setProfileData(res.data.user);
          }
        })
        .catch((err) => {
          console.warn('Failed to fetch full user profile:', err);
        });
    }

    return () => {
      active = false;
    };
  }, [user, isOpen]);

  if (!isOpen || !profileData) return null;

  const isCurrent = currentUser?.id === profileData.id;
  const roleTheme = ROLE_THEMES[profileData.role] || ROLE_THEMES.USER;
  const statusTheme = STATUS_THEMES[profileData.status] || {
    bg: 'bg-slate-50 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
    label: profileData.status || 'Unknown',
  };

  const handleCopy = (text, type) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      if (type === 'id') {
        setCopiedId(true);
        setTimeout(() => setCopiedId(false), 2000);
      } else if (type === 'email') {
        setCopiedEmail(true);
        setTimeout(() => setCopiedEmail(false), 2000);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden relative flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner Header with Role Gradient */}
        <div className={`h-28 bg-gradient-to-r ${roleTheme.gradient} p-6 relative flex items-start justify-between`}>
          <div className="flex items-center gap-2 text-white/90 text-xs font-medium tracking-wide uppercase">
            <Shield className="w-4 h-4" />
            <span>Profile Overview</span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Avatar & Core Header Info */}
        <div className="px-6 sm:px-8 -mt-12 relative flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-1 shadow-xl shadow-indigo-500/20 bg-white">
                <div className="w-full h-full rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center text-white text-3xl font-bold shadow-inner">
                  {(profileData.name || 'U')[0].toUpperCase()}
                </div>
              </div>
              <span
                className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${statusTheme.dot}`}
                title={`Status: ${profileData.status}`}
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                  {profileData.name}
                </h2>
                {isCurrent && (
                  <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-mono font-bold border border-indigo-200">
                    YOU
                  </span>
                )}
              </div>

              <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-slate-500">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{profileData.email}</span>
                <button
                  onClick={() => handleCopy(profileData.email, 'email')}
                  className="p-1 hover:text-indigo-600 transition-colors"
                  title="Copy email"
                >
                  {copiedEmail ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-center sm:self-end">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border ${roleTheme.badge}`}
            >
              {profileData.role}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusTheme.bg}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusTheme.dot}`} />
              {profileData.status}
            </span>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1">
          {/* Quick Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Phone */}
            <div className="p-4 bg-slate-50/70 border border-slate-100 rounded-2xl flex items-start gap-3">
              <div className="p-2.5 bg-white border border-slate-200/60 rounded-xl text-slate-600 shadow-xs">
                <Phone className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Phone Number
                </p>
                <p className="text-sm font-medium text-slate-800 mt-0.5 truncate">
                  {profileData.phone || <span className="text-slate-400 italic">Not provided</span>}
                </p>
              </div>
            </div>

            {/* Account ID */}
            <div className="p-4 bg-slate-50/70 border border-slate-100 rounded-2xl flex items-start gap-3">
              <div className="p-2.5 bg-white border border-slate-200/60 rounded-xl text-slate-600 shadow-xs">
                <Fingerprint className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  User ID
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <p className="text-xs font-mono text-slate-700 truncate max-w-[140px]">
                    {profileData.id}
                  </p>
                  <button
                    onClick={() => handleCopy(profileData.id, 'id')}
                    className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                    title="Copy User ID"
                  >
                    {copiedId ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Created At / Join Date */}
            <div className="p-4 bg-slate-50/70 border border-slate-100 rounded-2xl flex items-start gap-3">
              <div className="p-2.5 bg-white border border-slate-200/60 rounded-xl text-slate-600 shadow-xs">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Registered On
                </p>
                <p className="text-xs font-medium text-slate-800 mt-0.5">
                  {formatDate(profileData.createdAt)}
                </p>
              </div>
            </div>

            {/* Last Login */}
            <div className="p-4 bg-slate-50/70 border border-slate-100 rounded-2xl flex items-start gap-3">
              <div className="p-2.5 bg-white border border-slate-200/60 rounded-xl text-slate-600 shadow-xs">
                <Clock className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Last Login
                </p>
                <p className="text-xs font-medium text-slate-800 mt-0.5">
                  {formatDate(profileData.lastLoginAt)}
                </p>
              </div>
            </div>
          </div>

          {/* Role & Permissions Scope Card */}
          <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-2">
            <div className="flex items-center gap-2 text-indigo-900 font-semibold text-xs">
              <Shield className="w-4 h-4 text-indigo-600" />
              <span>Role Permissions: {profileData.role}</span>
            </div>
            <p className="text-xs text-indigo-700/90 leading-relaxed">
              {roleTheme.description}
            </p>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:px-8 border-t border-slate-100 bg-slate-50/60 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            {onChangePassword && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onChangePassword(profileData);
                }}
                className="flex items-center gap-1.5 px-3 py-2 border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                <Key className="w-3.5 h-3.5" />
                <span>Change Password</span>
              </button>
            )}

            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(profileData);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-700 hover:to-cyan-600 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
