import { useState, useEffect, useMemo, useCallback } from 'react';
import { journalsService, salesService, purchasesService } from '../../services/api';
import { JournalFilters } from './components/JournalFilters';
import { JournalTable } from './components/JournalTable';
import { CreateJournalModal } from './components/CreateJournalModal';
import { CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export default function Journals() {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('All Time');
  const [typeFilter, setTypeFilter] = useState('All'); // 'All' | 'Manual' | 'Sales' | 'Purchases'
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const [dbJournals, setDbJournals] = useState([]);
  const [salesJournals, setSalesJournals] = useState([]);
  const [purchaseJournals, setPurchaseJournals] = useState([]);

  const itemsPerPage = 10;

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [jRes, sRes, pRes] = await Promise.allSettled([
        journalsService.list({ limit: 100 }),
        salesService.list({ limit: 100 }),
        purchasesService.list({ limit: 100 }),
      ]);

      // Manual DB Journals
      if (jRes.status === 'fulfilled' && jRes.value?.data?.journals) {
        setDbJournals(jRes.value.data.journals.map(j => ({
          ...j,
          url: `/journal/${j.ref || j.id}`,
          isManual: true,
          total: Number(j.totalDebit || 0),
          notes: j.narration || 'Manual Journal Voucher',
          createdBy: 'Accountant',
        })));
      }

      // Sales Invoices System Journals
      if (sRes.status === 'fulfilled' && sRes.value?.data && Array.isArray(sRes.value.data)) {
        const nonVoid = sRes.value.data.filter(s => (s.status || '').toUpperCase() !== 'VOID');
        setSalesJournals(nonVoid.map(s => ({
          id: `sys-sale-${s.id}`,
          ref: s.ref,
          date: s.date ? String(s.date).split('T')[0] : '',
          notes: `Sales Invoice - ${s.customerName || s.customerCompany || 'Customer'}`,
          createdBy: 'System (Billing)',
          total: Number(s.total || 0),
          url: `/sales/${s.id}`,
          isDebit: true,
          isManual: false,
          voucherType: 'Sales',
          entries: s.items || [],
        })));
      }

      // Purchases System Journals
      if (pRes.status === 'fulfilled' && pRes.value?.data && Array.isArray(pRes.value.data)) {
        const nonVoid = pRes.value.data.filter(p => (p.status || '').toUpperCase() !== 'VOID');
        setPurchaseJournals(nonVoid.map(p => ({
          id: `sys-po-${p.id}`,
          ref: p.ref,
          date: p.date ? String(p.date).split('T')[0] : '',
          notes: `Purchase Order - ${p.supplierName || p.supplierCompany || 'Supplier'}`,
          createdBy: 'System (Procurement)',
          total: Number(p.total || 0),
          url: `/purchases/${p.id}`,
          isCredit: true,
          isManual: false,
          voucherType: 'Purchases',
          entries: p.items || [],
        })));
      }
    } catch (err) {
      console.error('Failed to load journals:', err);
      showToast('error', 'Failed to load journal book.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Combine and sort
  const allJournals = useMemo(() => {
    let combined = [];
    if (typeFilter === 'Manual') {
      combined = [...dbJournals];
    } else if (typeFilter === 'Sales') {
      combined = [...salesJournals];
    } else if (typeFilter === 'Purchases') {
      combined = [...purchaseJournals];
    } else {
      combined = [...dbJournals, ...salesJournals, ...purchaseJournals];
    }

    return combined.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }, [dbJournals, salesJournals, purchaseJournals, typeFilter]);

  // Filter journals
  const filteredJournals = useMemo(() => {
    return allJournals.filter(journal => {
      const q = searchQuery.toLowerCase().trim();
      const searchMatch = !q ||
        (journal.ref && journal.ref.toLowerCase().includes(q)) ||
        (journal.notes && journal.notes.toLowerCase().includes(q));

      let dateMatch = true;
      if (dateFilter !== 'All Time' && journal.date) {
        const jDate = new Date(journal.date);
        const today = new Date();
        if (dateFilter === 'Today') {
          dateMatch = jDate.toDateString() === today.toDateString();
        } else if (dateFilter === 'This Week') {
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          dateMatch = jDate >= weekAgo;
        } else if (dateFilter === 'This Month') {
          dateMatch = jDate.getMonth() === today.getMonth() && jDate.getFullYear() === today.getFullYear();
        }
      }

      return searchMatch && dateMatch;
    });
  }, [allJournals, searchQuery, dateFilter]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, dateFilter, typeFilter]);

  const handleExportCSV = () => {
    if (filteredJournals.length === 0) return;
    const headers = ['Date', 'Journal Ref', 'Narration', 'Created By', 'Total Amount', 'Type'];
    const rows = filteredJournals.map(j => [
      j.date,
      `"${j.ref}"`,
      `"${(j.notes || '').replace(/"/g, '""')}"`,
      `"${j.createdBy}"`,
      j.total,
      j.isManual ? 'Manual Journal' : (j.voucherType || 'System'),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Journal_Book_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto fade-in pb-12">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl backdrop-blur-md border ${
          toast.type === 'success'
            ? 'bg-emerald-50/95 border-emerald-200 text-emerald-800'
            : 'bg-rose-50/95 border-rose-200 text-rose-800'
        }`}>
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600" />
          )}
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      )}

      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Journal Book</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Double-entry financial journal vouchers and automated sub-ledger transactions
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={isLoading}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <JournalFilters 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        onNewEntry={() => setIsModalOpen(true)}
        onExport={handleExportCSV}
      />

      <div className="glass-card rounded-3xl overflow-hidden border border-slate-100 shadow-sm relative">
        <JournalTable 
          journals={filteredJournals}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          isLoading={isLoading}
        />
      </div>

      {/* Modal: New Double-Entry Journal Entry */}
      <CreateJournalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={(created) => {
          showToast('success', `Journal voucher "${created.ref}" posted to ledger!`);
          loadData();
        }}
      />
    </div>
  );
}
