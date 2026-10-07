import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Receipt, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { ContactProfileHeader } from './components/ContactProfileHeader';
import { ProfileStatCard } from './components/ProfileStatCard';
import { StatusBadge } from '../Dashboard/components/StatusBadge';
import contactsData from '../../db/contacts.json';
import salesData from '../../db/sales.json';
import purchasesData from '../../db/purchases.json';

export default function ContactProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const recordsPerPage = 10;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const contact = contactsData.find(c => c.id === (id || 'CONT-001')) || contactsData[0];

  // Match sales based on previous mapping (CUST-00X matches CONT-00X digit)
  const contactDigit = contact.id.split('-')[1];
  const customerId = `CUST-${contactDigit}`;
  const supplierId = `SUP-${contactDigit}`;

  const allSales = salesData
    .filter(sale => sale.customerId === customerId)
    .map(sale => ({
      ...sale,
      type: 'Sale',
      amount: formatCurrency(sale.total),
      received: formatCurrency(sale.received || sale.paid || 0),
      balance: sale.balance > 0 ? formatCurrency(sale.balance) : ''
    }));

  const allPurchases = purchasesData
    .filter(purchase => purchase.supplierId === supplierId)
    .map(purchase => ({
      ...purchase,
      type: 'Purchase',
      amount: formatCurrency(purchase.total),
      received: formatCurrency(purchase.paid || purchase.received || 0),
      balance: purchase.balance > 0 ? formatCurrency(purchase.balance) : ''
    }));

  const allTransactions = [...allSales, ...allPurchases].sort((a, b) => new Date(b.date) - new Date(a.date));

  const filteredTransactions = allTransactions.filter(t => {
    const matchesSearch = t.ref.toLowerCase().includes(searchQuery.toLowerCase()) || t.date.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'All' || t.status.toUpperCase() === filterStatus.toUpperCase();
    const matchesType = filterType === 'All' || t.type.toUpperCase() === filterType.toUpperCase();
    return matchesSearch && matchesStatus && matchesType;
  });

  const totalPages = Math.ceil(filteredTransactions.length / recordsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus, filterType, id]);

  // Simulated loading for skeleton on mount / filter / page change
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [searchQuery, filterStatus, filterType, currentPage, id]);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    start = Math.max(1, end - maxVisible + 1);
    for (let p = start; p <= end; p++) pages.push(p);
    return pages;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 fade-in">
      <div className="flex items-center space-x-2 text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer mb-2 w-fit" onClick={() => navigate('/contacts')}>
        <ArrowLeft className="w-4 h-4" />
        <span className="font-medium text-sm">Back to Contacts</span>
      </div>

      <ContactProfileHeader contact={contact} />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <ProfileStatCard 
          label="Total To Receive" 
          amount={formatCurrency(salesData.filter(s => s.customerId === customerId).reduce((sum, s) => sum + (s.balance || 0), 0))} 
          isHighlight={true} 
        />
        <ProfileStatCard 
          label="Total To Pay" 
          amount={formatCurrency(purchasesData.filter(p => p.supplierId === supplierId).reduce((sum, p) => sum + (p.balance || 0), 0))} 
          isHighlight={false} 
        />
        <ProfileStatCard 
          label="Sales Volume" 
          amount={formatCurrency(salesData.filter(s => s.customerId === customerId).reduce((sum, s) => sum + (s.total || 0), 0))} 
        />
        <ProfileStatCard 
          label="Purchase Volume" 
          amount={formatCurrency(purchasesData.filter(p => p.supplierId === supplierId).reduce((sum, p) => sum + (p.total || 0), 0))} 
        />
      </div>

      {/* Main Content Area */}
      <div className="glass-card rounded-3xl overflow-hidden flex flex-col border border-slate-100 shadow-sm">
        <div className="border-b border-slate-100 bg-white/50 flex px-8 py-5 justify-between items-center">
          <div className="flex items-center">
            <Receipt className="w-5 h-5 text-indigo-600 mr-2" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">Transaction History</h2>
          </div>
          
          <div className="flex items-center space-x-3">
             <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search invoice or ref no..." 
                className="w-full sm:w-64 px-4 py-2 border border-slate-200/60 rounded-xl bg-white/50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none text-sm"
              />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border border-slate-200/60 rounded-xl bg-white/50 focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-slate-700 cursor-pointer"
              >
                <option value="All">Type: All</option>
                <option value="Sale">Sales Only</option>
                <option value="Purchase">Purchases Only</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-slate-200/60 rounded-xl bg-white/50 focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-slate-700 cursor-pointer"
              >
                <option value="All">Status: All</option>
                <option value="Paid">Paid</option>
                <option value="Partial">Partial</option>
                <option value="Partially Paid">Partially Paid</option>
                <option value="Pending">Pending</option>
              </select>
          </div>
        </div>

        <div className="overflow-x-auto bg-white/40">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-slate-50/80 text-slate-500 font-medium border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 uppercase tracking-wider text-xs font-bold">Ref No</th>
                <th className="px-6 py-4 uppercase tracking-wider text-xs font-bold">Type</th>
                <th className="px-6 py-4 uppercase tracking-wider text-xs font-bold">Date</th>
                <th className="px-6 py-4 uppercase tracking-wider text-xs font-bold text-right">Amount</th>
                <th className="px-6 py-4 uppercase tracking-wider text-xs font-bold text-right">Balance</th>
                <th className="px-6 py-4 uppercase tracking-wider text-xs font-bold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                Array.from({ length: Math.min(recordsPerPage, Math.max(filteredTransactions.length, 5)) }).map((_, i) => (
                  <tr key={`sk-${i}`}>
                    <td className="px-6 py-4"><div className="h-4 w-28 bg-slate-200 rounded animate-pulse" /></td>
                    <td className="px-6 py-4"><div className="h-5 w-16 bg-slate-200 rounded-md animate-pulse" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-24 bg-slate-200 rounded animate-pulse" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-20 bg-slate-200 rounded animate-pulse ml-auto" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-20 bg-slate-200 rounded animate-pulse ml-auto" /></td>
                    <td className="px-6 py-4"><div className="h-6 w-16 bg-slate-200 rounded-full animate-pulse mx-auto" /></td>
                  </tr>
                ))
              ) : paginatedTransactions.length > 0 ? (
                paginatedTransactions.map((t, i) => (
                  <tr key={i} className="hover:bg-white/80 transition-colors group">
                    <td className="px-6 py-4 font-bold text-indigo-600 cursor-pointer hover:underline" onClick={() => navigate(`/${t.type === 'Sale' ? 'sales' : 'purchases'}/${t.ref}`)}>{t.ref}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border ${t.type === 'Sale' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                        {t.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-medium">{t.date}</td>
                    <td className="px-6 py-4 font-bold text-slate-800 text-right">{t.amount}</td>
                    <td className="px-6 py-4 font-bold text-rose-600 text-right">{t.balance}</td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge status={t.status} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                    No transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-slate-100 bg-white/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-500">
          <span>
            Showing{' '}
            <span className="font-semibold text-slate-700">
              {filteredTransactions.length > 0 ? (currentPage - 1) * recordsPerPage + 1 : 0}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-slate-700">
              {Math.min(currentPage * recordsPerPage, filteredTransactions.length)}
            </span>{' '}
            of <span className="font-semibold text-slate-700">{filteredTransactions.length}</span> records
          </span>

          <div className="flex items-center space-x-1.5">
            <button
              disabled={currentPage === 1 || isLoading}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {getPageNumbers().map(p => (
              <button
                key={p}
                disabled={isLoading}
                onClick={() => setCurrentPage(p)}
                className={`min-w-[36px] h-9 px-2 rounded-lg text-sm font-semibold transition-all ${
                  p === currentPage
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'
                }`}
              >
                {p}
              </button>
            ))}

            <button
              disabled={currentPage >= totalPages || totalPages === 0 || isLoading}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
