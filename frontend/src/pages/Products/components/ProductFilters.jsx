import { Search } from 'lucide-react';

export default function ProductFilters({ 
  searchQuery, setSearchQuery, 
  categoryFilter, setCategoryFilter, allCategories, 
  statusFilter, setStatusFilter 
}) {
  return (
    <div className="p-6 border-b border-slate-100 bg-white/50 flex flex-col sm:flex-row gap-4 items-center">
      <div className="relative flex-1 max-w-md w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name or SKU..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm"
        />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 custom-scrollbar w-full sm:w-auto">
        <select 
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 rounded-xl text-sm font-medium bg-white border border-slate-200 text-slate-600 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all appearance-none pr-8 cursor-pointer shrink-0"
          style={{ backgroundImage: "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1em 1em' }}
        >
          {allCategories.map(cat => (
            <option key={cat} value={cat}>{cat === 'All' ? 'All Categories' : cat}</option>
          ))}
        </select>
        {['All', 'In Stock', 'Low Stock', 'Out of Stock'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all shrink-0 ${
              statusFilter === status
                ? 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {status}
          </button>
        ))}
      </div>
    </div>
  );
}
