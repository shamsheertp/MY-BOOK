import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Filter, ChevronLeft, ChevronRight, TrendingDown } from 'lucide-react';
import expensesData from '../../../db/expenses.json';

export function ExpensesReport() {
  const [isLoading, setIsLoading] = useState(true);
  const [chartData, setChartData] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [dateRange, setDateRange] = useState('month'); 
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Colors for chart bars
  const colors = ['#f43f5e', '#ef4444', '#f97316', '#f59e0b', '#8b5cf6', '#6366f1'];

  useEffect(() => {
    setIsLoading(true);
    // Simulate API fetch and data processing
    setTimeout(() => {
      // Process chart data (aggregate by category)
      const aggregated = expensesData.reduce((acc, expense) => {
        if (!acc[expense.category]) acc[expense.category] = 0;
        acc[expense.category] += expense.amount;
        return acc;
      }, {});

      const formattedChartData = Object.keys(aggregated).map(category => ({
        name: category,
        amount: aggregated[category]
      })).sort((a, b) => b.amount - a.amount); // Sort by highest expense

      setChartData(formattedChartData);
      setTableData(expensesData);
      setIsLoading(false);
    }, 800);
  }, [dateRange]);

  const totalPages = Math.ceil(tableData.length / itemsPerPage);
  const paginatedData = tableData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
        <h2 className="text-xl font-bold text-slate-800">Expenses Breakdown</h2>
        
        <div className="flex bg-white rounded-xl border border-slate-200 shadow-sm p-1">
          <button onClick={() => setDateRange('week')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${dateRange === 'week' ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>This Week</button>
          <button onClick={() => setDateRange('month')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${dateRange === 'month' ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>This Month</button>
          <button onClick={() => setDateRange('year')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${dateRange === 'year' ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>This Year</button>
        </div>
      </div>

      {/* Chart */}
      <div className="glass-card bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-rose-500" /> Spending by Category
        </h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 25, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={15} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} tickFormatter={(value) => `₹${value}`} dx={-10} />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                cursor={{fill: '#f8fafc'}}
                formatter={(value) => [`₹${value.toFixed(2)}`, 'Total Amount']}
              />
              <Bar dataKey="amount" radius={[8, 8, 0, 0]} maxBarSize={60}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-800">Detailed Expense Register</h3>
          <button className="flex items-center gap-1.5 text-sm font-semibold text-rose-600 hover:text-rose-700 transition-colors">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead className="bg-slate-50/80 text-slate-500 font-medium border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 uppercase tracking-wider text-xs font-bold">Date & ID</th>
                <th className="px-6 py-4 uppercase tracking-wider text-xs font-bold">Description</th>
                <th className="px-6 py-4 uppercase tracking-wider text-xs font-bold">Category</th>
                <th className="px-6 py-4 uppercase tracking-wider text-xs font-bold text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedData.map((expense) => (
                <tr key={expense.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-sm text-slate-800">{new Date(expense.date).toLocaleDateString()}</div>
                    <div className="text-[11px] text-slate-400 font-medium mt-0.5">{expense.id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-slate-700">{expense.description}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">
                      {expense.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-rose-600">
                    ₹{expense.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-sm font-medium text-slate-500">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, tableData.length)} of {tableData.length} records
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
