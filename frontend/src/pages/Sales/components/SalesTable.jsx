import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StatusBadge } from '../../Dashboard/components/StatusBadge';

export function SalesTable({ sales = [], currentPage = 1, itemsPerPage = 10, onPageChange, isLoading = false }) {
  const navigate = useNavigate();
  
  const totalPages = Math.ceil(sales.length / itemsPerPage) || 1;
  const paginatedSales = sales.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(Number(amount) || 0);
  };

  return (
    <>
      <div className="overflow-x-auto bg-white/40">
        <table className="w-full text-sm text-left border-collapse min-w-[750px]">
          <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Ref No</th>
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4 text-right">Amount</th>
              <th className="px-6 py-4 text-right">Balance Due</th>
              <th className="px-6 py-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={index} className="animate-pulse">
                  <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-24"></div></td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-slate-200 rounded w-32 mb-1.5"></div>
                    <div className="h-3 bg-slate-100 rounded w-20"></div>
                  </td>
                  <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-20"></div></td>
                  <td className="px-6 py-4 text-right"><div className="h-4 bg-slate-200 rounded w-20 ml-auto"></div></td>
                  <td className="px-6 py-4 text-right"><div className="h-4 bg-slate-200 rounded w-20 ml-auto"></div></td>
                  <td className="px-6 py-4 text-center"><div className="h-6 bg-slate-200 rounded-full w-20 mx-auto"></div></td>
                </tr>
              ))
            ) : paginatedSales.length > 0 ? (
              paginatedSales.map((sale) => {
                const company = sale.customerCompany || (sale.contact && sale.contact.companyName);
                return (
                  <tr 
                    key={sale.id} 
                    onClick={() => navigate(`/sales/${sale.ref || sale.id}`)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group border-b border-slate-50 last:border-0"
                  >
                    <td className="px-6 py-4 font-bold text-indigo-600 font-mono group-hover:underline">
                      {sale.ref}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{sale.customerName}</div>
                      {company && <div className="text-xs text-slate-400 mt-0.5">{company}</div>}
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-medium whitespace-nowrap">
                      {sale.date}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900 text-right">
                      {formatCurrency(sale.total)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {sale.balance > 0 ? (
                        <span className="font-bold text-rose-600">
                          {formatCurrency(sale.balance)}
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                          Settled
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge status={sale.status} />
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                  No sales invoices found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {!isLoading && sales.length > 0 && (
        <div className="p-4 border-t border-slate-100 bg-slate-50/40 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, sales.length)} of {sales.length} invoices
          </span>
          
          <div className="flex items-center space-x-2">
            <button 
              type="button"
              disabled={currentPage === 1}
              onClick={() => onPageChange(prev => Math.max(1, prev - 1))}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 font-semibold text-slate-700">Page {currentPage} of {totalPages || 1}</span>
            <button 
              type="button"
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => onPageChange(prev => Math.min(totalPages, prev + 1))}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
export default SalesTable;
