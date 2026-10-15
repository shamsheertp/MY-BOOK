import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Book, Filter, RefreshCw, Download, ArrowUpRight, ArrowDownRight, Layers } from 'lucide-react';
import { ledgersService } from '../../services/api';
import initialAccountsData from '../../db/accounts.json';

export default function Ledgers() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadAccounts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await ledgersService.getAccounts();
      if (res?.success && Array.isArray(res.data)) {
        setAccounts(res.data);
      } else {
        setAccounts(initialAccountsData);
      }
    } catch (err) {
      console.warn('Live ledgers load failed, using local fallback:', err);
      setAccounts(initialAccountsData);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const uniqueTypes = useMemo(() => {
    return ['All', 'ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];
  }, []);

  const filteredAccounts = useMemo(() => {
    return accounts.filter(account => {
      const q = searchQuery.toLowerCase().trim();
      const searchMatch = !q ||
        account.name.toLowerCase().includes(q) ||
        (account.code && account.code.includes(q)) ||
        (account.description && account.description.toLowerCase().includes(q));

      const typeMatch = typeFilter === 'All' || account.type.toUpperCase() === typeFilter.toUpperCase();
      return searchMatch && typeMatch;
    });
  }, [accounts, searchQuery, typeFilter]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  const handleExportCSV = () => {
    if (filteredAccounts.length === 0) return;
    const headers = ['Account Code', 'Account Name', 'Type', 'Description', 'Total Debits', 'Total Credits', 'Current Balance'];
    const rows = filteredAccounts.map(a => [
      `"${a.code}"`,
      `"${a.name}"`,
      a.type,
      `"${(a.description || '').replace(/"/g, '""')}"`,
      a.totalDebits || 0,
      a.totalCredits || 0,
      a.balance || 0,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Chart_Of_Accounts_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto fade-in pb-12">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">General Ledger</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Live Chart of Accounts, debit/credit aggregates, and continuous balance tracking
          </p>
        </div>

        <button
          onClick={loadAccounts}
          disabled={isLoading}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Ledger
        </button>
      </div>

      {/* Filter and Export Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 print:hidden">
        <div className="flex-1 w-full md:w-auto relative group">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-500" />
          </div>
          <input
            type="text"
            className="w-full md:max-w-md pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all shadow-sm text-sm"
            placeholder="Search by account code, name, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-500" />
            </div>
            <select
              className="w-full md:w-44 pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer shadow-sm text-xs font-semibold text-slate-700"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              {uniqueTypes.map((type) => (
                <option key={type} value={type}>
                  {type === 'All' ? 'All Account Types' : type}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors shadow-sm text-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Ledger Accounts Table */}
      <div className="glass-card rounded-3xl overflow-hidden border border-slate-100 shadow-sm relative bg-white/70">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-slate-50/80 text-slate-400 font-semibold text-xs uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Account Code</th>
                <th className="px-6 py-4">Account Name</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4 text-right">Debits (₹)</th>
                <th className="px-6 py-4 text-right">Credits (₹)</th>
                <th className="px-6 py-4 text-right">Net Balance (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={`sk-${i}`}>
                    <td className="px-6 py-4"><div className="h-4 w-12 bg-slate-200 rounded animate-pulse" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-48 bg-slate-200 rounded animate-pulse" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-24 bg-slate-200 rounded animate-pulse" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-20 bg-slate-200 rounded animate-pulse ml-auto" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-20 bg-slate-200 rounded animate-pulse ml-auto" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-24 bg-slate-200 rounded animate-pulse ml-auto" /></td>
                  </tr>
                ))
              ) : filteredAccounts.length > 0 ? (
                filteredAccounts.map((account) => {
                  const typeUpper = (account.type || '').toUpperCase();
                  const typeBadgeClass =
                    typeUpper === 'ASSET' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    typeUpper === 'LIABILITY' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    typeUpper === 'EQUITY' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                    typeUpper === 'REVENUE' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    'bg-rose-50 text-rose-700 border-rose-200';

                  return (
                    <tr 
                      key={account.code || account.id} 
                      onClick={() => navigate(`/ledgers/${account.code || account.id}`)}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4 font-mono font-bold text-slate-600 text-xs">
                        <span className="px-2 py-1 bg-slate-100 rounded-md border border-slate-200">
                          {account.code}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <Book className="w-4 h-4 mr-2 text-indigo-400 group-hover:text-indigo-600 transition-colors shrink-0" />
                          <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {account.name}
                          </span>
                        </div>
                        {account.description && (
                          <p className="text-xs text-slate-400 mt-0.5 max-w-sm truncate">{account.description}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${typeBadgeClass}`}>
                          {account.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-600 text-right">
                        {Number(account.totalDebits || 0) > 0 ? formatCurrency(account.totalDebits) : '-'}
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-600 text-right">
                        {Number(account.totalCredits || 0) > 0 ? formatCurrency(account.totalCredits) : '-'}
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-slate-900 text-right">
                        <span className={Number(account.balance || 0) < 0 ? 'text-rose-600' : 'text-slate-900'}>
                          {formatCurrency(account.balance || 0)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                        <Layers className="w-6 h-6 text-slate-400" />
                      </div>
                      <p className="text-slate-500 font-medium">No accounts found matching your filter criteria.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
