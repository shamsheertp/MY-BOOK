import { ChevronLeft, ChevronRight, Edit3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StatusBadge } from '../../Dashboard/components/StatusBadge';

export function PurchasesTable({
  purchases = [],
  currentPage = 1,
  itemsPerPage = 10,
  totalPages: propTotalPages,
  totalItems: propTotalItems,
  onPageChange,
  getSupplierName,
  contacts = [],
}) {
  const navigate = useNavigate();
  
  const totalPages = propTotalPages !== undefined ? propTotalPages : Math.ceil(purchases.length / itemsPerPage);
  const totalRecords = propTotalItems !== undefined ? propTotalItems : purchases.length;
  
  // If backend already paginated, purchases will be the page slice; otherwise slice locally
  const displayPurchases = purchases.length > itemsPerPage
    ? purchases.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : purchases;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const getCompany = (purchase) => {
    if (purchase.supplierCompany) return purchase.supplierCompany;
    if (purchase.supplier?.companyName) return purchase.supplier.companyName;
    if (!purchase.supplierId) return '';
    const c = contacts.find(c => c.id === purchase.supplierId || String(c.id).includes(String(purchase.supplierId)));
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
              <th className="px-6 py-4 uppercase tracking-wider text-xs font-bold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {displayPurchases.length > 0 ? (
              displayPurchases.map((purchase) => {
                const company = getCompany(purchase);
                const supplierName = purchase.supplierName || (getSupplierName ? getSupplierName(purchase.supplierId, purchase.supplierName) : (purchase.supplier?.contactName || 'Supplier'));
                const displayAmount = purchase.total ?? purchase.amount ?? 0;
                const displayBalance = purchase.balance ?? 0;
                const displayStatus = purchase.status || 'ORDERED';

                return (
                <tr 
                  key={purchase.id || purchase.ref} 
                  onClick={() => navigate(`/purchases/${purchase.ref || purchase.id}`)}
                  className="hover:bg-white/80 transition-colors cursor-pointer group border-b border-slate-50 last:border-0"
                >
                  <td className="px-6 py-4 font-bold text-orange-600">{purchase.ref}</td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-800">{supplierName}</div>
                    {company && <div className="text-xs text-slate-500 mt-0.5">{company}</div>}
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-medium">{purchase.date}</td>
                  <td className="px-6 py-4 font-bold text-slate-800 text-right">{formatCurrency(displayAmount)}</td>
                  <td className="px-6 py-4 font-bold text-rose-600 text-right">{displayBalance > 0 ? formatCurrency(displayBalance) : '-'}</td>
                  <td className="px-6 py-4 text-center">
                    <StatusBadge status={displayStatus} />
                  </td>
                  <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                    {displayStatus !== 'VOID' && displayStatus !== 'CANCELLED' && (
                      <button 
                        type="button"
                        onClick={() => navigate(`/purchases/${purchase.ref || purchase.id}/edit`)}
                        className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center"
                        title="Edit purchase order"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                  No purchases found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="p-4 border-t border-slate-100 bg-white/60 flex items-center justify-between text-sm text-slate-500">
        <span>Showing {displayPurchases.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, totalRecords)} of {totalRecords} records</span>
        
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
