import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StatusBadge } from '../../Dashboard/components/StatusBadge';
import contactsData from '../../../db/contacts.json';

export function PurchasesTable({ purchases, currentPage, itemsPerPage, onPageChange, getSupplierName }) {
  const navigate = useNavigate();
  
  const totalPages = Math.ceil(purchases.length / itemsPerPage);
  const paginatedPurchases = purchases.slice(
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

  const getCompany = (supplierId) => {
    if (!supplierId) return '';
    const digit = supplierId.split('-')[1];
    const c = contactsData.find(c => c.id === `CONT-${digit}`);
    return c?.companyName || '';
  };

  return (
    <>
      <div className="overflow-x-auto bg-white/40">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-slate-50/80 text-slate-500 font-medium border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 uppercase tracking-wider text-xs font-bold">PO No</th>
              <th className="px-6 py-4 uppercase tracking-wider text-xs font-bold">Supplier</th>
              <th className="px-6 py-4 uppercase tracking-wider text-xs font-bold">Date</th>
              <th className="px-6 py-4 uppercase tracking-wider text-xs font-bold text-right">Amount</th>
              <th className="px-6 py-4 uppercase tracking-wider text-xs font-bold text-right">Balance</th>
              <th className="px-6 py-4 uppercase tracking-wider text-xs font-bold text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {paginatedPurchases.length > 0 ? (
              paginatedPurchases.map((purchase) => {
                const company = getCompany(purchase.supplierId);
                const supplierName = getSupplierName(purchase.supplierId);
                return (
                <tr 
                  key={purchase.id} 
                  onClick={() => navigate(`/purchases/${purchase.ref}`)}
                  className="hover:bg-white/80 transition-colors cursor-pointer group border-b border-slate-50 last:border-0"
                >
                  <td className="px-6 py-4 font-bold text-orange-600">{purchase.ref}</td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-800">{supplierName}</div>
                    {company && <div className="text-xs text-slate-500 mt-0.5">{company}</div>}
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-medium">{purchase.date}</td>
                  <td className="px-6 py-4 font-bold text-slate-800 text-right">{formatCurrency(purchase.total)}</td>
                  <td className="px-6 py-4 font-bold text-rose-600 text-right">{purchase.balance > 0 ? formatCurrency(purchase.balance) : ''}</td>
                  <td className="px-6 py-4 text-center">
                    <StatusBadge status={purchase.status || 'DRAFT'} />
                  </td>
                </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                  No purchases found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="p-4 border-t border-slate-100 bg-white/60 flex items-center justify-between text-sm text-slate-500">
        <span>Showing {paginatedPurchases.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, purchases.length)} of {purchases.length} records</span>
        
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
