import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { usersService } from '../../../services/api';

export default function DeleteUserModal({ user, onClose, onSuccess }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user) return null;

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      await usersService.delete(user.id);
      onSuccess('User removed from database.');
      onClose();
    } catch (err) {
      alert(`Failed to delete user: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-8">
        <div className="flex items-center gap-3 text-rose-600 mb-3">
          <AlertTriangle className="w-6 h-6" />
          <h3 className="font-bold text-lg text-slate-800">Confirm Deletion</h3>
        </div>

        <p className="text-sm text-slate-600">
          Are you sure you want to permanently delete user{' '}
          <strong className="text-slate-900">{user.name}</strong> ({user.email}) from the PostgreSQL database? This action cannot be undone.
        </p>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-xl shadow transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? 'Deleting...' : 'Delete Permanently'}
          </button>
        </div>
      </div>
    </div>
  );
}
