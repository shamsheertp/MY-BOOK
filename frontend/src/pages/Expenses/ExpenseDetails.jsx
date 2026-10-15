import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Trash2, 
  Edit, 
  Ban, 
  Receipt, 
  Calendar, 
  Tag, 
  CreditCard, 
  AlignLeft, 
  Paperclip, 
  CheckCircle2, 
  Clock, 
  User, 
  Hash, 
  AlertCircle, 
  AlertOctagon,
  ExternalLink
} from 'lucide-react';
import expensesData from '../../db/expenses.json';
import { expensesService } from '../../services/api';
import { PinModal } from '../../components/Common/PinModal';
import { EditExpenseModal } from './components/EditExpenseModal';

export default function ExpenseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [expense, setExpense] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isVoiding, setIsVoiding] = useState(false);
  
  // Security PIN and Edit Modals
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinModalMessage, setPinModalMessage] = useState('');
  const [pendingAction, setPendingAction] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const loadExpense = async () => {
    setIsLoading(true);
    try {
      const res = await expensesService.getById(id);
      if (res?.data) {
        setExpense(res.data);
      } else {
        const fallback = expensesData.find(e => e.id === id || e.ref === id);
        setExpense(fallback || null);
      }
    } catch (err) {
      console.warn('Failed to fetch expense from backend, falling back:', err);
      const fallback = expensesData.find(e => e.id === id || e.ref === id);
      setExpense(fallback || null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadExpense();
  }, [id]);

  const isVoided = Boolean(expense?.voided || expense?.status === 'Void' || expense?.rawStatus === 'VOID');

  // Trigger PIN check for Edit
  const handleEditClick = () => {
    if (isVoided) {
      alert('This expense has been voided and cannot be edited.');
      return;
    }
    setPendingAction(() => () => {
      setIsEditModalOpen(true);
    });
    setPinModalMessage('Please enter Admin PIN to edit this expense. (Hint: 1234)');
    setIsPinModalOpen(true);
  };

  // Trigger PIN check for Void
  const handleVoidClick = () => {
    if (isVoided) return;
    setPendingAction(() => async (pin) => {
      setIsVoiding(true);
      try {
        const res = await expensesService.void(expense.id || expense.ref, {
          pin,
          reason: 'Voided by administrator',
        });
        if (res?.data) {
          setExpense(res.data);
        } else {
          setExpense(prev => ({
            ...prev,
            status: 'Void',
            voided: true,
            voidedAt: new Date().toISOString(),
          }));
        }
        setFeedback({ type: 'success', text: `Expense ${expense.ref || expense.id} has been voided.` });
      } catch (err) {
        setFeedback({ type: 'error', text: err?.response?.data?.message || err?.message || 'Failed to void expense' });
      } finally {
        setIsVoiding(false);
      }
    });
    setPinModalMessage('Please enter Admin PIN to void this expense. (Hint: 1234)');
    setIsPinModalOpen(true);
  };

  // Verify PIN callback
  const handlePinConfirm = (enteredPin) => {
    if (enteredPin === '1234') {
      setIsPinModalOpen(false);
      if (pendingAction) {
        pendingAction(enteredPin);
      }
      return null;
    }
    return 'Incorrect PIN. Access Denied.';
  };

  // Handle saving edits from modal
  const handleSaveEdit = async (updatedData) => {
    try {
      const res = await expensesService.update(expense.id || expense.ref, {
        ...updatedData,
        pin: '1234',
      });
      if (res?.data) {
        setExpense(res.data);
      } else {
        setExpense(prev => ({ ...prev, ...updatedData }));
      }
      setFeedback({ type: 'success', text: 'Expense updated successfully.' });
    } catch (err) {
      throw err;
    }
  };

  const handleDelete = async () => {
    const expenseIdentifier = expense?.ref || expense?.id || id;
    if (window.confirm(`Are you sure you want to delete expense "${expenseIdentifier}"? This cannot be undone.`)) {
      setIsDeleting(true);
      try {
        await expensesService.delete(expenseIdentifier);
        navigate('/expenses');
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete expense');
        setIsDeleting(false);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto fade-in pb-12 animate-pulse space-y-6">
        <div className="h-8 bg-slate-200 rounded-xl w-36"></div>
        <div className="glass-card rounded-3xl p-8 border border-slate-100 bg-white h-96"></div>
      </div>
    );
  }

  if (!expense) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <h2 className="text-2xl font-bold text-slate-800">Expense not found</h2>
        <p className="text-slate-500 mt-1 text-sm">Could not find any expense record matching &ldquo;{id}&rdquo;</p>
        <button 
          onClick={() => navigate('/expenses')} 
          className="mt-4 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors cursor-pointer"
        >
          Go back to Expenses
        </button>
      </div>
    );
  }

  const amt = Number(expense.amount || 0);

  return (
    <div className="max-w-4xl mx-auto fade-in pb-12">
      {/* Header bar */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <button
          onClick={() => navigate('/expenses')}
          className="flex items-center text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Expenses
        </button>
        <div className="flex items-center gap-2">
          {/* Edit Button (Asks for PIN) */}
          <button 
            type="button"
            onClick={handleEditClick}
            disabled={isVoided}
            title={isVoided ? "Cannot edit voided expense" : "Edit Expense (Requires PIN)"}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
              isVoided 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' 
                : 'bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 border border-slate-200 hover:border-indigo-200 cursor-pointer'
            }`}
          >
            <Edit className="w-4 h-4" />
            <span>Edit</span>
          </button>

          {/* Void Button (Asks for PIN) */}
          {!isVoided && (
            <button 
              type="button"
              onClick={handleVoidClick}
              disabled={isVoiding}
              title="Void Expense (Requires PIN)"
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Ban className="w-4 h-4" />
              <span>{isVoiding ? 'Voiding...' : 'Void'}</span>
            </button>
          )}

          {/* Delete Button */}
          <button 
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            title="Delete Expense"
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer disabled:opacity-50 border border-transparent hover:border-rose-100"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div className={`mb-6 p-4 rounded-2xl flex items-center justify-between text-sm font-semibold animate-in fade-in ${
          feedback.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-rose-600" />}
            <span>{feedback.text}</span>
          </div>
          <button 
            type="button"
            onClick={() => setFeedback(null)} 
            className="text-xs font-bold opacity-70 hover:opacity-100 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* VOID Banner */}
      {isVoided && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-rose-800 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm">This expense has been VOIDED</h4>
              <p className="text-xs text-rose-600 mt-0.5">
                {expense.voidReason ? `Reason: ${expense.voidReason}` : 'Cancelled by administrator'}
                {expense.voidedAt ? ` • ${new Date(expense.voidedAt).toLocaleDateString()}` : ''}
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-rose-600 text-white text-xs font-black rounded-lg tracking-wider">
            VOID
          </span>
        </div>
      )}

      {/* Main Details Card */}
      <div className={`glass-card bg-white rounded-3xl p-8 border shadow-sm relative overflow-hidden ${isVoided ? 'border-rose-100 bg-rose-50/10' : 'border-slate-100'}`}>
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <Receipt className="w-32 h-32" />
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-slate-100 pb-8 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                {expense.ref || expense.id}
              </span>
              {isVoided && (
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-rose-100 text-rose-700 rounded-md border border-rose-200">
                  Voided
                </span>
              )}
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight mt-1">{expense.category}</h1>
            {expense.payee && (
              <p className="text-sm text-slate-500 mt-1 font-medium flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" /> Payee: <span className="text-slate-700 font-semibold">{expense.payee}</span>
              </p>
            )}
          </div>
          <div className="text-left md:text-right">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Amount</p>
            <h2 className={`text-4xl font-black ${isVoided ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
              ₹{amt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10 mb-8">
          <div className="space-y-6">
            <div>
              <p className="text-sm font-semibold text-slate-400 flex items-center gap-1.5 mb-1">
                <Calendar className="w-4 h-4" /> Date
              </p>
              <p className="text-lg font-bold text-slate-800">{expense.date}</p>
            </div>
            
            <div>
              <p className="text-sm font-semibold text-slate-400 flex items-center gap-1.5 mb-1">
                <Tag className="w-4 h-4" /> Category
              </p>
              <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium bg-slate-100 text-slate-700">
                {expense.category}
              </span>
            </div>

            {expense.referenceNo && (
              <div>
                <p className="text-sm font-semibold text-slate-400 flex items-center gap-1.5 mb-1">
                  <Hash className="w-4 h-4" /> Reference / Transaction No.
                </p>
                <p className="text-sm font-mono font-bold text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 inline-block">
                  {expense.referenceNo}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <p className="text-sm font-semibold text-slate-400 flex items-center gap-1.5 mb-1">
                <CreditCard className="w-4 h-4" /> Payment Method
              </p>
              <p className="text-lg font-bold text-slate-800">{expense.paymentMethod}</p>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-400 flex items-center gap-1.5 mb-1">
                 Status
              </p>
              {isVoided ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-rose-50 text-rose-600 border border-rose-200">
                  <Ban className="w-4 h-4" />
                  VOID
                </span>
              ) : expense.status === 'Paid' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <CheckCircle2 className="w-4 h-4" />
                  Paid
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-amber-50 text-amber-600 border border-amber-100">
                  <Clock className="w-4 h-4" />
                  Pending
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-8 relative z-10">
          <p className="text-sm font-semibold text-slate-400 flex items-center gap-1.5 mb-2">
            <AlignLeft className="w-4 h-4" /> Description
          </p>
          <p className="text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
            {expense.description || <span className="text-slate-400 italic">No description provided</span>}
          </p>
        </div>

        {expense.notes && (
          <div className="mt-6 border-t border-slate-100 pt-6 relative z-10">
            <p className="text-sm font-semibold text-slate-400 mb-1">Internal Notes</p>
            <p className="text-slate-600 text-sm bg-slate-50 p-3 rounded-xl border border-slate-100 font-mono">
              {expense.notes}
            </p>
          </div>
        )}

        {expense.receiptImage && (
          <div className="mt-8 border-t border-slate-100 pt-8 relative z-10">
            <p className="text-sm font-semibold text-slate-400 flex items-center gap-1.5 mb-3">
              <Paperclip className="w-4 h-4" /> Attached Proof (Cloudflare R2)
            </p>
            <a 
              href={expense.receiptImage}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 bg-slate-50 hover:bg-indigo-50/60 border border-slate-200 hover:border-indigo-300 rounded-xl max-w-md transition-all group cursor-pointer shadow-sm"
            >
              <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                <Receipt className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 group-hover:text-indigo-600 truncate">
                  {expense.receiptImage.split('/').pop() || `receipt_${expense.ref || expense.id}`}
                </p>
                <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                  <span>✓ Stored on Cloudflare R2</span> • Click to open
                </p>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
            </a>
          </div>
        )}
      </div>

      {/* Security PIN Modal */}
      <PinModal
        isOpen={isPinModalOpen}
        onClose={() => {
          setIsPinModalOpen(false);
          setPendingAction(null);
        }}
        onConfirm={handlePinConfirm}
        message={pinModalMessage}
      />

      {/* Edit Expense Modal */}
      <EditExpenseModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        expense={expense}
        onSave={handleSaveEdit}
      />
    </div>
  );
}
