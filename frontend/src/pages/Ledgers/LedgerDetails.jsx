import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Printer, 
  FileText, 
  Download, 
  Search, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown,
  BookOpen,
  Calendar,
  Layers
} from 'lucide-react';
import { ledgersService } from '../../services/api';

export default function LedgerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accountData, setAccountData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState({ from: '', to: '' });

  const fetchLedger = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ledgersService.getAccountDetails(id);
      const payload = res?.data || res;
      if (res?.success && res?.data) {
        setAccountData(res.data);
      } else if (payload?.account) {
        setAccountData(payload);
      } else {
        setError('Failed to load ledger details');
      }
    } catch (err) {
      console.error('Error fetching ledger details:', err);
      setError(err.response?.data?.message || 'Error connecting to accounting server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchLedger();
    }
  }, [id]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(Number(amount) || 0);
  };

  const handlePrint = () => window.print();

  const transactions = accountData?.transactions || [];
  const account = accountData?.account || { code: id, name: `Account ${id}`, type: 'ASSET' };
  const summary = accountData?.summary || { totalDebits: 0, totalCredits: 0, finalBalance: 0, transactionCount: 0 };

  // Filter transactions
  const filteredTransactions = transactions.filter(txn => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      !query ||
      txn.ref?.toLowerCase().includes(query) ||
      txn.narration?.toLowerCase().includes(query) ||
      txn.partyName?.toLowerCase().includes(query) ||
      txn.type?.toLowerCase().includes(query);

    const matchesFrom = !dateFilter.from || (txn.date && txn.date >= dateFilter.from);
    const matchesTo = !dateFilter.to || (txn.date && txn.date <= dateFilter.to);

    return matchesSearch && matchesFrom && matchesTo;
  });

  const handleExportCSV = () => {
    if (!filteredTransactions.length) return;
    const headers = ['Date', 'Reference', 'Type', 'Party', 'Narration', 'Debit (INR)', 'Credit (INR)', 'Running Balance (INR)'];
    const rows = filteredTransactions.map(t => [
      t.date || '',
      `"${(t.ref || '').replace(/"/g, '""')}"`,
      t.type || '',
      `"${(t.partyName || '').replace(/"/g, '""')}"`,
      `"${(t.narration || '').replace(/"/g, '""')}"`,
      t.debit || 0,
      t.credit || 0,
      t.runningBalance || 0
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Ledger_${account.code}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const typeUpper = (account.type || '').toUpperCase();
  const typeBadgeClass =
    typeUpper === 'ASSET' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
    typeUpper === 'LIABILITY' ? 'bg-amber-50 text-amber-700 border-amber-200' :
    typeUpper === 'EQUITY' ? 'bg-purple-50 text-purple-700 border-purple-200' :
    typeUpper === 'REVENUE' ? 'bg-blue-50 text-blue-700 border-blue-200' :
    'bg-rose-50 text-rose-700 border-rose-200';

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 pb-12 px-4 sm:px-0">
        <div className="flex items-center space-x-4 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm text-slate-500">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
        </div>
        <div className="bg-white rounded-3xl p-12 border border-slate-100 flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-slate-500 font-medium">Reconciling general ledger entries from database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 print:pb-0 print:m-0 print:space-y-4 fade-in px-4 sm:px-0">
      
      {/* Top Header / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate('/ledger')} 
            className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm text-slate-600 cursor-pointer"
            title="Back to General Ledger"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{account.name}</h1>
              <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${typeBadgeClass}`}>
                {account.type}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              General Ledger Account Statement • Code: <span className="font-mono font-bold text-slate-700">{account.code}</span>
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button 
            onClick={fetchLedger} 
            className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
            title="Refresh Account Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button 
            onClick={handleExportCSV} 
            disabled={!filteredTransactions.length}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors shadow-sm flex items-center text-sm disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </button>
          <button 
            onClick={handlePrint} 
            className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm flex items-center text-sm cursor-pointer"
          >
            <Printer className="w-4 h-4 mr-2" />
            Print Ledger
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 print:grid-cols-4 print:gap-2">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Normal Balance</span>
            <BookOpen className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-bold text-slate-800">
            {typeUpper === 'ASSET' || typeUpper === 'EXPENSE' ? 'Debit Normal (Dr)' : 'Credit Normal (Cr)'}
          </div>
          <p className="text-xs text-slate-500 mt-1">Classification: {account.type}</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Debits</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-black text-emerald-600">
            {formatCurrency(summary.totalDebits)}
          </div>
          <p className="text-xs text-slate-500 mt-1">Inflow to debit balances</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Credits</span>
            <TrendingDown className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl font-black text-rose-600">
            {formatCurrency(summary.totalCredits)}
          </div>
          <p className="text-xs text-slate-500 mt-1">Inflow to credit balances</p>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-2xl p-5 border border-indigo-200/60 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">Closing Balance</span>
            <Layers className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-900">
            {formatCurrency(summary.finalBalance)}
          </div>
          <p className="text-xs text-indigo-600 font-semibold mt-1">
            {summary.transactionCount} posted transaction{summary.transactionCount !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Main Ledger Sheet */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden print:shadow-none print:border-0 print:rounded-none">
        
        {/* Printable Letterhead header */}
        <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">{account.name}</h2>
              <span className="font-mono text-xs px-2 py-0.5 bg-slate-200 font-bold rounded text-slate-700">
                A/C #{account.code}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {account.description || 'General Ledger Account Activity'} • Showing {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Quick Filters - Hidden on print */}
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search ref, party, memo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <input
                type="date"
                value={dateFilter.from}
                onChange={(e) => setDateFilter(prev => ({ ...prev, from: e.target.value }))}
                className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                title="From Date"
              />
              <span>to</span>
              <input
                type="date"
                value={dateFilter.to}
                onChange={(e) => setDateFilter(prev => ({ ...prev, to: e.target.value }))}
                className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                title="To Date"
              />
              {(dateFilter.from || dateFilter.to || searchQuery) && (
                <button
                  onClick={() => { setSearchQuery(''); setDateFilter({ from: '', to: '' }); }}
                  className="px-2 py-1 text-xs text-indigo-600 hover:underline"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Ledger Transactions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/40 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-6">Date</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Party / Payee</th>
                <th className="py-3 px-4">Narration / Memo</th>
                <th className="py-3 px-4 text-right">Debit (₹)</th>
                <th className="py-3 px-4 text-right">Credit (₹)</th>
                <th className="py-3 px-6 text-right">Running Balance (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((txn, idx) => {
                  const typeBadge = 
                    txn.type === 'SALE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    txn.type === 'PURCHASE' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    txn.type === 'EXPENSE' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-purple-50 text-purple-700 border-purple-200';

                  return (
                    <tr key={txn.id || idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-6 font-medium text-slate-600 whitespace-nowrap">
                        {txn.date || '-'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${typeBadge}`}>
                          {txn.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-indigo-600 whitespace-nowrap">
                        {txn.ref || '-'}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800 whitespace-nowrap">
                        {txn.partyName || '-'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={txn.narration}>
                        {txn.narration || '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-800 tabular-nums">
                        {txn.debit > 0 ? formatCurrency(txn.debit) : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-800 tabular-nums">
                        {txn.credit > 0 ? formatCurrency(txn.credit) : '-'}
                      </td>
                      <td className="py-3 px-6 text-right font-black text-slate-900 tabular-nums whitespace-nowrap">
                        {formatCurrency(txn.runningBalance)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                        <FileText className="w-6 h-6 text-slate-400" />
                      </div>
                      <p className="font-bold text-slate-700 text-sm">No transactions found</p>
                      <p className="text-xs text-slate-400 mt-1">
                        There are no matching transaction entries posted to account {account.code}.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
            {filteredTransactions.length > 0 && (
              <tfoot>
                <tr className="bg-slate-50 font-bold border-t-2 border-slate-200 text-xs text-slate-800">
                  <td colSpan="5" className="py-3 px-6 text-right uppercase tracking-wider text-slate-500">
                    Total
                  </td>
                  <td className="py-3 px-4 text-right font-black text-emerald-700 tabular-nums">
                    {formatCurrency(summary.totalDebits)}
                  </td>
                  <td className="py-3 px-4 text-right font-black text-rose-700 tabular-nums">
                    {formatCurrency(summary.totalCredits)}
                  </td>
                  <td className="py-3 px-6 text-right font-black text-indigo-700 tabular-nums">
                    {formatCurrency(summary.finalBalance)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
