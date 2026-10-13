import { useState, useEffect, useMemo, useCallback } from 'react';
import { SalesHeader } from './components/SalesHeader';
import { SalesFilters } from './components/SalesFilters';
import { SalesTable } from './components/SalesTable';
import { salesService } from '../../services/api';
import { IndianRupee, TrendingUp, AlertCircle, FileCheck2, Clock } from 'lucide-react';

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [summary, setSummary] = useState({
    totalSalesCount: 0,
    totalAmount: 0,
    totalReceived: 0,
    totalOutstanding: 0,
    paidCount: 0,
    unpaidCount: 0,
    partialCount: 0,
    overdueCount: 0,
    draftCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchSales = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await salesService.list({
        search: searchTerm,
        status: statusFilter,
        limit: 100,
      });

      if (response && response.data) {
        setSales(response.data);
        if (response.summary) {
          setSummary(response.summary);
        }
      }
    } catch (err) {
      console.error('Failed to load sales from database:', err);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const handleExportCSV = () => {
    if (!sales.length) {
      alert('No sales data to export.');
      return;
    }

    const headers = ['Ref No', 'Date', 'Due Date', 'Customer Name', 'Company', 'Status', 'Total (₹)', 'Received (₹)', 'Balance (₹)'];
    const rows = sales.map(s => [
      s.ref,
      s.date,
      s.dueDate || '',
      `"${(s.customerName || '').replace(/"/g, '""')}"`,
      `"${(s.customerCompany || '').replace(/"/g, '""')}"`,
      s.status,
      s.total,
      s.received,
      s.balance
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sales_invoices_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto fade-in px-4 sm:px-0 pb-12">
      <SalesHeader 
        onExport={handleExportCSV} 
        onRefresh={fetchSales} 
        isLoading={isLoading} 
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Invoiced */}
        <div className="glass-card bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Invoiced</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800">
            ₹{summary.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Across {summary.totalSalesCount} total invoices
          </p>
        </div>

        {/* Received / Collected */}
        <div className="glass-card bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Collected</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600">
            ₹{summary.totalReceived.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            {summary.paidCount} fully settled invoices
          </p>
        </div>

        {/* Balance Outstanding */}
        <div className="glass-card bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Outstanding Balance</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600">
            ₹{summary.totalOutstanding.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-rose-500 mt-1 font-medium">
            {summary.unpaidCount + summary.partialCount} pending customer receivables
          </p>
        </div>

        {/* Invoice Health */}
        <div className="glass-card bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Invoice Health</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-lg font-bold text-emerald-600">{summary.paidCount}</span>
              <span className="text-[10px] uppercase font-bold text-slate-400">Paid</span>
            </div>
            <div className="h-8 w-px bg-slate-200"></div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-amber-600">{summary.partialCount}</span>
              <span className="text-[10px] uppercase font-bold text-slate-400">Partial</span>
            </div>
            <div className="h-8 w-px bg-slate-200"></div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-rose-600">{summary.overdueCount}</span>
              <span className="text-[10px] uppercase font-bold text-slate-400">Overdue</span>
            </div>
            <div className="h-8 w-px bg-slate-200"></div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-slate-500">{summary.draftCount}</span>
              <span className="text-[10px] uppercase font-bold text-slate-400">Draft</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Table Card */}
      <div className="glass-card bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <SalesFilters 
          searchTerm={searchTerm} 
          setSearchTerm={setSearchTerm} 
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />
        
        <SalesTable 
          sales={sales}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
