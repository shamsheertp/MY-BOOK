import React from 'react';
import { Search, Filter } from 'lucide-react';

export const CustomerSalesFilters = ({ 
  searchQuery, setSearchQuery, 
  showFilters, setShowFilters, 
  filterStatus, setFilterStatus, 
  dateFrom, setDateFrom, 
  dateTo, setDateTo 
}) => {
  return (
    <div className="p-5 border-b border-white/40 bg-white/20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative max-w-sm w-full group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          </div>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by invoice number or date..." 
            className="w-full pl-11 pr-4 py-2.5 border border-slate-200/60 rounded-xl bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none text-sm shadow-sm"
          />
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-xl border transition-all ${showFilters ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
          >
            <Filter className="w-4 h-4 mr-2" />
            Advanced Filters
          </button>
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-white border border-slate-200/60 text-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
          >
            <option value="All">Status: All</option>
            <option value="PAID">Paid</option>
            <option value="PARTIAL">Partial</option>
            <option value="OVERDUE">Overdue</option>
          </select>
        </div>
      </div>

      {showFilters && (
        <div className="mt-4 pt-4 border-t border-slate-100/50 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Date From</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full px-3 py-2 border border-slate-200/60 bg-white/50 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Date To</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full px-3 py-2 border border-slate-200/60 bg-white/50 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
      )}
    </div>
  );
};
