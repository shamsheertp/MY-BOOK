import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StatusBadge } from '../../Dashboard/components/StatusBadge';

export const CustomerSalesTable = ({ 
  paginatedSales, 
  filteredSalesLength, 
  currentPage, 
  setCurrentPage, 
  totalPages, 
  recordsPerPage 
}) => {
  const navigate = useNavigate();

  return (
    <>
      <div className="overflow-x-auto bg-white/40">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-xs border-b border-slate-100">
            <tr>
              <th className="px-6 py-4">Reference</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4 text-right">Amount</th>
              <th className="px-6 py-4 text-right">Received</th>
              <th className="px-6 py-4 text-right">Balance</th>
              <th className="px-6 py-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {paginatedSales.length > 0 ? (
              paginatedSales.map((row) => (
                <tr 
                  key={row.id} 
                  className="hover:bg-white/80 transition-colors cursor-pointer group border-b border-slate-50 last:border-0"
                  onClick={() => navigate(`/sales/${row.ref}`)}
                >
                  <td className="px-6 py-4 font-bold text-indigo-600">{row.ref}</td>
                  <td className="px-6 py-4 font-medium text-slate-500">{row.date}</td>
                  <td className="px-6 py-4 font-bold text-slate-900 text-right">{row.amount}</td>
                  <td className="px-6 py-4 font-medium text-emerald-600 text-right">{row.received}</td>
                  <td className="px-6 py-4 font-bold text-rose-600 text-right">{row.balance}</td>
                  <td className="px-6 py-4 text-center"><StatusBadge status={row.status} /></td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                  No sales found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-slate-100 bg-white/60 flex items-center justify-between text-sm text-slate-500">
        <span>Showing {paginatedSales.length > 0 ? (currentPage - 1) * recordsPerPage + 1 : 0} to {Math.min(currentPage * recordsPerPage, filteredSalesLength)} of {filteredSalesLength} records</span>
        
        <div className="flex items-center space-x-2">
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="px-3 font-medium text-slate-700">Page {currentPage} of {totalPages || 1}</span>
          <button 
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </>
  );
};
