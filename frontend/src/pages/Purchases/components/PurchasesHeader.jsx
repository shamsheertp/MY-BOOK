import { Plus, Download } from 'lucide-react';
import { Link } from 'react-router-dom';

export function PurchasesHeader() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
      <div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Purchase Orders</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your purchase transactions and track payments</p>
      </div>
      <div className="flex space-x-3">
        <button className="flex items-center justify-center text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 px-4 py-2.5 rounded-xl transition-all shadow-sm w-full sm:w-auto">
          <Download className="w-4 h-4 mr-2" />
          Export
        </button>
        <Link to="/purchases/new" className="flex items-center justify-center text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 px-4 py-2.5 rounded-xl transition-all shadow-sm shadow-orange-200 w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Create Purchase
        </Link>
      </div>
    </div>
  );
}
