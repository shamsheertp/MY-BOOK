import { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, Filter, ChevronLeft, ChevronRight, BarChart3 } from 'lucide-react';
import salesData from '../../../db/sales.json';

export function SalesReport() {
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState('month'); // 'week', 'month', 'year'
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [dateRange]);

  const chartData = useMemo(() => {
    const aggregated = salesData.reduce((acc, sale) => {
      const dateObj = new Date(sale.date);
      const dateStr = !isNaN(dateObj) ? dateObj.toISOString().split('T')[0] : sale.date;
      if (!acc[dateStr]) acc[dateStr] = 0;
      acc[dateStr] += (sale.total || 0);
      return acc;
    }, {});

    return Object.keys(aggregated).map(date => ({
      date,
      amount: aggregated[date]
    })).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [salesData, dateRange]);

  const totalPages = Math.ceil(salesData.length / itemsPerPage);
  
  const paginatedData = useMemo(() => {
    return salesData.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [salesData, currentPage, itemsPerPage]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex justify-between">
          <div className="h-10 bg-slate-200 rounded-xl w-48"></div>
          <div className="h-10 bg-slate-200 rounded-xl w-32"></div>
        </div>
        <div className="glass-card h-80 rounded-3xl bg-slate-50 border border-slate-100"></div>
        <div className="glass-card h-64 rounded-3xl bg-slate-50 border border-slate-100"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 fade-in">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold text-slate-800">Sales Overview</h2>
        
        <div className="flex bg-white rounded-xl border border-slate-200 shadow-sm p-1">
          <button onClick={() => setDateRange('week')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${dateRange === 'week' ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>This Week</button>
          <button onClick={() => setDateRange('month')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${dateRange === 'month' ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>This Month</button>
          <button onClick={() => setDateRange('year')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${dateRange === 'year' ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>This Year</button>
        </div>
      </div>

      {/* Chart */}
      <div className="glass-card bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-500" /> Revenue Trend
        </h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} tickFormatter={(value) => `₹${value}`} dx={-10} />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                cursor={{stroke: '#e2e8f0', strokeWidth: 2}}
              />
              <Line type="monotone" dataKey="amount" stroke="#4f46e5" strokeWidth={3} dot={{r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-800">Detailed Sales Register</h3>
          <button className="flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-slate-50/80 text-slate-500 font-medium border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 uppercase tracking-wider text-xs font-bold">Date & Invoice</th>
                <th className="px-6 py-4 uppercase tracking-wider text-xs font-bold">Customer</th>
                <th className="px-6 py-4 uppercase tracking-wider text-xs font-bold">Payment</th>
                <th className="px-6 py-4 uppercase tracking-wider text-xs font-bold text-right">Subtotal</th>
                <th className="px-6 py-4 uppercase tracking-wider text-xs font-bold text-right">Tax</th>
                <th className="px-6 py-4 uppercase tracking-wider text-xs font-bold text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedData.map((sale) => {
                const pMethod = sale.payments && sale.payments.length > 0 ? sale.payments[0].method : 'Unpaid';
                return (
                  <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800 text-sm">{sale.date}</div>
                      <div className="text-[11px] text-slate-400 font-medium mt-0.5">{sale.ref}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-700">{sale.customerName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        pMethod === 'Cash' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100/50' :
                        pMethod === 'Unpaid' ? 'bg-rose-50 text-rose-600 border border-rose-100/50' :
                        'bg-blue-50 text-blue-600 border border-blue-100/50'
                      }`}>
                        {pMethod}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-slate-600">
                      ₹{(sale.subtotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-slate-400">
                      ₹{(sale.tax || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-slate-800">
                      ₹{(sale.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-sm font-medium text-slate-500">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, salesData.length)} of {salesData.length} records
          </span>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-slate-700 min-w-[4rem] text-center">
              Page {currentPage} of {totalPages}
            </span>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
