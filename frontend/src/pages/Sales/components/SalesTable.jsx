import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StatusBadge } from '../../Dashboard/components/StatusBadge';
import contactsData from '../../../db/contacts.json';

export function SalesTable({ sales, currentPage, itemsPerPage, onPageChange }) {
  const navigate = useNavigate();
  
  const totalPages = Math.ceil(sales.length / itemsPerPage);
  const paginatedSales = sales.slice(
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

  const getCompany = (customerId) => {
    const c = contactsData.find(c => c.customerId === customerId);
    return c ? c.company : '';
  };

  return (
    <>
      <div className="overflow-x-auto bg-white/40">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-slate-50/80 text-slate-500 font-medium border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 uppercase tracking-wider text-xs font-bold">Ref No</th>
              <th className="px-6 py-4 uppercase tracking-wider text-xs font-bold">Customer</th>
              <th className="px-6 py-4 uppercase tracking-wider text-xs font-bold">Date</th>
              <th className="px-6 py-4 uppercase tracking-wider text-xs font-bold text-right">Amount</th>
              <th className="px-6 py-4 uppercase tracking-wider text-xs font-bold text-right">Balance</th>
              <th className="px-6 py-4 uppercase tracking-wider text-xs font-bold text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {paginatedSales.length > 0 ? (
              paginatedSales.map((sale) => (
                <tr 
                  key={sale.id} 
                  onClick={() => navigate(`/sales/${sale.ref}`)}
                  className="hover:bg-white/80 transition-colors cursor-pointer group border-b border-slate-50 last:border-0"
                >
                  <td className="px-6 py-4 font-bold text-indigo-600">{sale.ref}</td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-800">{sale.customerName}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{getCompany(sale.customerId)}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-medium">{sale.date}</td>
                  <td className="px-6 py-4 font-bold text-slate-800 text-right">{formatCurrency(sale.total)}</td>
                  <td className="px-6 py-4 font-bold text-rose-600 text-right">{sale.balance > 0 ? formatCurrency(sale.balance) : ''}</td>
                  <td className="px-6 py-4 text-center">
                    <StatusBadge status={sale.status} />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                  No sales found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="p-4 border-t border-slate-100 bg-white/60 flex items-center justify-between text-sm text-slate-500">
        <span>Showing {paginatedSales.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, sales.length)} of {sales.length} records</span>
        
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
    </>
  );
}
