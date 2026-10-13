import { Plus, Download, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

export function SalesHeader({ onExport, onRefresh, isLoading }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Sales Invoices</h1>
        <p className="text-sm text-slate-500 mt-1 font-medium">
          Create invoices, track payments, and manage customer receivables
        </p>
      </div>
      <div className="flex items-center space-x-3">
        {onRefresh && (
          <button 
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 rounded-xl hover:bg-slate-50 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
            title="Refresh database records"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        )}
        {onExport && (
          <button 
            type="button"
            onClick={onExport}
            className="flex items-center justify-center text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4 mr-2 text-slate-500" />
            Export CSV
          </button>
        )}
        <Link 
          to="/sales/new" 
          className="flex items-center justify-center text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-100 hover:shadow-indigo-200"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Invoice
        </Link>
      </div>
    </div>
  );
}
