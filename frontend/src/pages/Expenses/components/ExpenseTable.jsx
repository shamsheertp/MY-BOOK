import { CheckCircle2, Clock, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ExpenseTable({ paginatedExpenses, filteredExpenses, currentPage, setCurrentPage, itemsPerPage, totalPages, isLoading }) {
  const navigate = useNavigate();

  return (
    <div className="w-full relative bg-white/40">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead className="bg-slate-50/80 text-slate-500 font-medium border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 uppercase tracking-wider text-xs font-bold">Date & ID</th>
              <th className="px-6 py-4 uppercase tracking-wider text-xs font-bold">Category</th>
              <th className="px-6 py-4 uppercase tracking-wider text-xs font-bold">Description</th>
              <th className="px-6 py-4 uppercase tracking-wider text-xs font-bold">Amount</th>
              <th className="px-6 py-4 uppercase tracking-wider text-xs font-bold text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/80">
            {isLoading ? (
              // Skeleton loading rows
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={index} className="animate-pulse">
                  <td className="py-4 px-6">
                    <div className="h-4 bg-slate-200 rounded w-24 mb-2"></div>
                    <div className="h-3 bg-slate-100 rounded w-16"></div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="h-6 bg-slate-200 rounded-lg w-28"></div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="h-4 bg-slate-200 rounded w-48 mb-2"></div>
                    <div className="h-3 bg-slate-100 rounded w-24"></div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="h-5 bg-slate-200 rounded w-20"></div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="h-6 bg-slate-200 rounded-full w-20"></div>
                  </td>
                </tr>
              ))
            ) : paginatedExpenses.length > 0 ? (
              paginatedExpenses.map((expense) => (
                <tr 
                  key={expense.id} 
                  onClick={() => navigate(`/expenses/${expense.id}`)}
                  className="hover:bg-white/80 transition-colors cursor-pointer group border-b border-slate-50 last:border-0"
                >
                  <td className="py-4 px-6">
                    <div className="font-medium text-slate-900">{expense.date}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{expense.id}</div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 whitespace-nowrap">
                      {expense.category}
                    </span>
                    <div className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
                      <CreditCard className="w-3 h-3" />
                      {expense.paymentMethod}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-sm text-slate-700 max-w-xs truncate">{expense.description || <span className="text-slate-400 italic">No description</span>}</div>
                  </td>
                  <td className="py-4 px-6 font-bold text-slate-800">
                    ₹{expense.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {expense.status === 'Paid' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600 border border-emerald-100">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Paid
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-600 border border-amber-100">
                        <Clock className="w-3.5 h-3.5" />
                        Pending
                      </span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="py-12 text-center text-slate-500">
                  No expenses found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {!isLoading && (
        <div className="p-4 border-t border-slate-100 bg-white/60 flex items-center justify-between text-sm text-slate-500">
          <span>
            Showing {paginatedExpenses.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, filteredExpenses.length)} of {filteredExpenses.length} records
          </span>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            <span className="px-3 font-medium text-slate-700">Page {currentPage} of {totalPages || 1}</span>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
