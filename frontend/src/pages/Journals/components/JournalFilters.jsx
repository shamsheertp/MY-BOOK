import { Plus, Search, Calendar, User, FileText, Download } from 'lucide-react';
import { useState } from 'react';

export function JournalFilters({ 
  searchQuery, 
  setSearchQuery, 
  dateFilter, 
  setDateFilter, 
  userFilter, 
  setUserFilter, 
  usersList 
}) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 print:hidden">
      <div className="flex-1 w-full md:w-auto">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-slate-400 group-focus-within:text-indigo-500" />
          </div>
          <input
            type="text"
            className="w-full md:max-w-md pl-10 pr-4 py-2.5 bg-white/60 border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm backdrop-blur-xl"
            placeholder="Search by journal ref or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Calendar className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-500" />
          </div>
          <select
            className="w-full pl-9 pr-8 py-2.5 bg-white/60 border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none cursor-pointer transition-all shadow-sm backdrop-blur-xl text-sm font-medium text-slate-700"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="All Time">All Time</option>
            <option value="Today">Today</option>
            <option value="This Week">This Week</option>
            <option value="This Month">This Month</option>
          </select>
        </div>

        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <User className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-500" />
          </div>
          <select
            className="w-full pl-9 pr-8 py-2.5 bg-white/60 border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none cursor-pointer transition-all shadow-sm backdrop-blur-xl text-sm font-medium text-slate-700"
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
          >
            <option value="All">All Users</option>
            {usersList.map((u, idx) => (
              <option key={idx} value={u}>{u}</option>
            ))}
          </select>
        </div>

        <button className="flex items-center px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-sm text-sm">
          <Download className="w-4 h-4 mr-2" />
          Export
        </button>

        <button 
          onClick={() => alert("Create Journal Entry not implemented yet")}
          className="flex items-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm shadow-indigo-200 transition-all text-sm group"
        >
          <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform duration-300" />
          New Entry
        </button>
      </div>
    </div>
  );
}
