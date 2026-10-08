import { Search } from 'lucide-react';

export function PurchasesFilters({ searchTerm, setSearchTerm, statusFilter, setStatusFilter }) {
  return (
    <div className="p-6 border-b border-slate-100 bg-white/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
      <div className="relative max-w-md w-full group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="w-4 h-4 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
        </div>
        <input 
          type="text" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by PO ref or supplier..." 
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200/60 rounded-xl bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none text-sm"
        />
      </div>
      
      <div className="w-full sm:w-auto min-w-[150px]">
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full py-2.5 px-4 border border-slate-200/60 rounded-xl bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none text-sm font-medium text-slate-700 appearance-none"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}
        >
          <option value="ALL">All Status</option>
          <option value="DRAFT">Draft</option>
          <option value="PENDING APPROVAL">Pending Approval</option>
          <option value="PENDING ACCEPTANCE">Pending Acceptance</option>
          <option value="ACCEPTED">Accepted</option>
          <option value="PARTIALLY RECEIVED">Partially Received</option>
          <option value="PENDING PAYMENT">Pending Payment</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>
    </div>
  );
}
