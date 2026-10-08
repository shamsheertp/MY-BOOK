import { ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function JournalTable({ journals, currentPage, itemsPerPage, onPageChange, isLoading }) {
  const navigate = useNavigate();
  const totalPages = Math.ceil(journals.length / itemsPerPage);
  const paginatedJournals = journals.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <>
      <div className="overflow-x-auto bg-white/40">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-slate-50/80 text-slate-500 font-medium border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 uppercase tracking-wider text-xs font-bold">Date</th>
              <th className="px-6 py-4 uppercase tracking-wider text-xs font-bold">Journal Ref</th>
              <th className="px-6 py-4 uppercase tracking-wider text-xs font-bold">Notes</th>
              <th className="px-6 py-4 uppercase tracking-wider text-xs font-bold">Created By</th>
              <th className="px-6 py-4 uppercase tracking-wider text-xs font-bold text-right">Debit</th>
              <th className="px-6 py-4 uppercase tracking-wider text-xs font-bold text-right">Credit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {isLoading ? (
              Array.from({ length: itemsPerPage }).map((_, i) => (
                <tr key={`sk-${i}`}>
                  <td className="px-6 py-4"><div className="h-4 w-24 bg-slate-200 rounded animate-pulse" /></td>
                  <td className="px-6 py-4"><div className="h-4 w-28 bg-slate-200 rounded animate-pulse" /></td>
                  <td className="px-6 py-4"><div className="h-4 w-48 bg-slate-200 rounded animate-pulse" /></td>
                  <td className="px-6 py-4"><div className="h-4 w-24 bg-slate-200 rounded animate-pulse" /></td>
                  <td className="px-6 py-4"><div className="h-4 w-24 bg-slate-200 rounded animate-pulse ml-auto" /></td>
                  <td className="px-6 py-4"><div className="h-4 w-24 bg-slate-200 rounded animate-pulse ml-auto" /></td>
                </tr>
              ))
            ) : paginatedJournals.length > 0 ? (
              paginatedJournals.map((journal) => (
                <tr 
                  key={journal.id} 
                  onClick={() => navigate(journal.url)}
                  className="hover:bg-white/80 transition-colors cursor-pointer group"
                >
                  <td className="px-6 py-4 font-medium text-slate-500">{journal.date}</td>
                  <td className="px-6 py-4 font-bold text-indigo-600">{journal.ref}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-800">{journal.notes}</div>
                    <div className="text-xs text-slate-400 mt-1">
                      {journal.isManual ? `${journal.entries?.length} entries` : 'System generated'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium">{journal.createdBy}</td>
                  <td className="px-6 py-4 font-bold text-slate-800 text-right">
                    {journal.isDebit || journal.isManual ? formatCurrency(journal.total) : <span className="text-slate-300">-</span>}
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-800 text-right">
                    {journal.isCredit || journal.isManual ? formatCurrency(journal.total) : <span className="text-slate-300">-</span>}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                      <FileText className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-slate-500 font-medium">No journal entries found matching your criteria.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {!isLoading && (
        <div className="p-4 border-t border-slate-100 bg-white/60 flex items-center justify-between text-sm text-slate-500">
          <span>Showing {paginatedJournals.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, journals.length)} of {journals.length} entries</span>
          
          <div className="flex items-center space-x-2">
            <button 
              disabled={currentPage === 1}
              onClick={() => onPageChange(prev => Math.max(1, prev - 1))}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="px-3 font-medium text-slate-700">Page {currentPage} of {totalPages || 1}</span>
            <button 
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => onPageChange(prev => Math.min(totalPages, prev + 1))}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
