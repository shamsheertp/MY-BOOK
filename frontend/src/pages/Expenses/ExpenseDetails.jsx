import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Receipt, Calendar, Tag, CreditCard, AlignLeft, Paperclip, CheckCircle2, Clock } from 'lucide-react';
import expensesData from '../../db/expenses.json';

export default function ExpenseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const expense = expensesData.find(e => e.id === id);

  if (!expense) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <h2 className="text-2xl font-bold text-slate-800">Expense not found</h2>
        <button onClick={() => navigate('/expenses')} className="mt-4 text-indigo-600 hover:underline">
          Go back to Expenses
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto fade-in pb-12">
      <div className="mb-6 flex justify-between items-center">
        <button
          onClick={() => navigate('/expenses')}
          className="flex items-center text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Expenses
        </button>
        <div className="flex gap-2">
          <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
            <Edit className="w-5 h-5" />
          </button>
          <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="glass-card rounded-3xl p-8 border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <Receipt className="w-32 h-32" />
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-slate-100 pb-8 relative z-10">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">{expense.id}</h1>
            <p className="text-sm text-slate-500 mt-1 font-medium">{expense.category}</p>
          </div>
          <div className="text-left md:text-right">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Amount</p>
            <h2 className="text-4xl font-black text-slate-800">₹{expense.amount.toFixed(2)}</h2>
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
              {expense.status === 'Paid' ? (
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
            {expense.description}
          </p>
        </div>

        <div className="mt-8 border-t border-slate-100 pt-8 relative z-10">
          <p className="text-sm font-semibold text-slate-400 flex items-center gap-1.5 mb-3">
            <Paperclip className="w-4 h-4" /> Attached Proof
          </p>
          <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl max-w-sm">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-800">receipt_{expense.id.toLowerCase()}.pdf</p>
              <p className="text-xs text-slate-500">1.2 MB</p>
            </div>
            <button className="text-indigo-600 text-sm font-medium hover:underline">View</button>
          </div>
        </div>

      </div>
    </div>
  );
}
