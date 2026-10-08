import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Book, Filter } from 'lucide-react';
import accountsData from '../../db/accounts.json';

export default function Ledgers() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  // Extract unique account types
  const uniqueTypes = Array.from(new Set(accountsData.map(a => a.type)));

  const filteredAccounts = accountsData.filter(account => {
    const searchMatch = account.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        account.code.includes(searchQuery);
    const typeMatch = typeFilter === 'All' || account.type === typeFilter;
    return searchMatch && typeMatch;
  });

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [searchQuery, typeFilter]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="max-w-7xl mx-auto fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">General Ledger</h1>
        <p className="text-sm text-slate-500 mt-1 font-medium">Chart of Accounts and ledger balances</p>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 print:hidden">
        <div className="flex-1 w-full md:w-auto relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-slate-400 group-focus-within:text-indigo-500" />
          </div>
          <input
            type="text"
            className="w-full md:max-w-md pl-10 pr-4 py-2.5 bg-white/60 border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm backdrop-blur-xl"
            placeholder="Search by account name or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Filter className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-500" />
          </div>
          <select
            className="w-full md:w-48 pl-9 pr-8 py-2.5 bg-white/60 border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none cursor-pointer transition-all shadow-sm backdrop-blur-xl text-sm font-medium text-slate-700"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="All">All Types</option>
            {uniqueTypes.map((type, idx) => (
              <option key={idx} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="glass-card rounded-3xl overflow-hidden border border-slate-100 shadow-sm relative">
        <div className="overflow-x-auto bg-white/40">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-slate-50/80 text-slate-500 font-medium border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 uppercase tracking-wider text-xs font-bold">Code</th>
                <th className="px-6 py-4 uppercase tracking-wider text-xs font-bold">Account Name</th>
                <th className="px-6 py-4 uppercase tracking-wider text-xs font-bold">Type</th>
                <th className="px-6 py-4 uppercase tracking-wider text-xs font-bold text-center">Status</th>
                <th className="px-6 py-4 uppercase tracking-wider text-xs font-bold text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={`sk-${i}`}>
                    <td className="px-6 py-4"><div className="h-4 w-12 bg-slate-200 rounded animate-pulse" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-48 bg-slate-200 rounded animate-pulse" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-24 bg-slate-200 rounded animate-pulse" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-16 mx-auto bg-slate-200 rounded animate-pulse" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-24 bg-slate-200 rounded animate-pulse ml-auto" /></td>
                  </tr>
                ))
              ) : filteredAccounts.length > 0 ? (
                filteredAccounts.map((account) => (
                  <tr 
                    key={account.id} 
                    onClick={() => navigate(`/ledgers/${account.id}`)}
                    className="hover:bg-white/80 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4 font-bold text-slate-500">{account.code}</td>
                    <td className="px-6 py-4 font-bold text-indigo-600 group-hover:text-indigo-800 transition-colors">
                      <div className="flex items-center">
                        <Book className="w-4 h-4 mr-2 text-indigo-400 group-hover:text-indigo-600 transition-colors" />
                        {account.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-600">{account.type}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-700">
                        {account.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-black text-slate-800 text-right">{formatCurrency(account.balance)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                        <Book className="w-6 h-6 text-slate-400" />
                      </div>
                      <p className="text-slate-500 font-medium">No accounts found matching your search.</p>
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
