import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Printer, 
  Download, 
  RefreshCw, 
  Calendar, 
  PieChart as PieIcon, 
  ShieldCheck, 
  ArrowUpRight, 
  ArrowDownRight,
  Info
} from 'lucide-react';
import { reportsService } from '../../../services/api';

export function ProfitAndLossReport() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pnlData, setPnlData] = useState(null);
  const [periodType, setPeriodType] = useState('year'); // 'month', 'quarter', 'year', 'custom'
  const [customDates, setCustomDates] = useState({ dateFrom: '', dateTo: '' });

  const fetchPnL = async () => {
    setLoading(true);
    setError(null);
    try {
      const now = new Date();
      let params = {};

      if (periodType === 'month') {
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        params = { dateFrom: firstDay, dateTo: lastDay };
      } else if (periodType === 'quarter') {
        const quarter = Math.floor(now.getMonth() / 3);
        const firstDay = new Date(now.getFullYear(), quarter * 3, 1).toISOString().split('T')[0];
        const lastDay = new Date(now.getFullYear(), quarter * 3 + 3, 0).toISOString().split('T')[0];
        params = { dateFrom: firstDay, dateTo: lastDay };
      } else if (periodType === 'year') {
        params = { year: now.getFullYear() };
      } else if (periodType === 'custom') {
        if (customDates.dateFrom) params.dateFrom = customDates.dateFrom;
        if (customDates.dateTo) params.dateTo = customDates.dateTo;
      }

      const res = await reportsService.getProfitAndLoss(params);
      const payload = res?.data || res;
      if (res?.success && res?.data) {
        setPnlData(res.data);
      } else if (payload?.revenue) {
        setPnlData(payload);
      } else {
        setError('Failed to load Profit & Loss report');
      }
    } catch (err) {
      console.error('Error fetching P&L data:', err);
      setError(err.response?.data?.message || 'Error connecting to accounting reports server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPnL();
  }, [periodType]);

  const handleCustomApply = (e) => {
    e.preventDefault();
    fetchPnL();
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(val) || 0);
  };

  const handlePrint = () => window.print();

  const handleExportCSV = () => {
    if (!pnlData) return;
    const { revenue, costOfGoodsSold, grossProfit, operatingExpenses, netIncome } = pnlData;
    
    const lines = [
      ['PROFIT & LOSS STATEMENT', 'AMOUNT (INR)'],
      ['', ''],
      ['OPERATING REVENUE', ''],
      ['Gross Sales Revenue', revenue.grossSales],
      ['Less: Sales Discounts', -revenue.discounts],
      ['NET SALES REVENUE', revenue.netSales],
      ['', ''],
      ['COST OF GOODS SOLD', ''],
      ['Product & Inventory Purchases', costOfGoodsSold.total],
      ['TOTAL COST OF GOODS SOLD', costOfGoodsSold.total],
      ['', ''],
      ['GROSS PROFIT', grossProfit.amount],
      ['Gross Profit Margin (%)', `${grossProfit.marginPercent}%`],
      ['', ''],
      ['OPERATING EXPENSES', ''],
      ...operatingExpenses.breakdown.map(b => [b.category, b.amount]),
      ['TOTAL OPERATING EXPENSES', operatingExpenses.total],
      ['', ''],
      ['NET INCOME / (NET LOSS)', netIncome.amount],
      ['Net Profit Margin (%)', `${netIncome.marginPercent}%`],
    ];

    const csvContent = lines.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Profit_and_Loss_Statement_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const revenue = pnlData?.revenue || { grossSales: 0, discounts: 0, netSales: 0, invoicesCount: 0 };
  const cogs = pnlData?.costOfGoodsSold || { total: 0, ordersCount: 0 };
  const grossProfit = pnlData?.grossProfit || { amount: 0, marginPercent: 0 };
  const operatingExpenses = pnlData?.operatingExpenses || { total: 0, expensesCount: 0, breakdown: [] };
  const netIncome = pnlData?.netIncome || { amount: 0, marginPercent: 0 };

  const isProfitable = netIncome.amount >= 0;

  return (
    <div className="space-y-6 fade-in">
      
      {/* Top Filter and Actions Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-indigo-600" />
            Income Statement / Profit & Loss
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Real-time financial performance calculated directly from live sales, purchases, and operating expenses.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Period selector */}
          <div className="flex bg-white rounded-xl border border-slate-200 shadow-sm p-1 text-xs font-semibold">
            <button
              onClick={() => setPeriodType('month')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                periodType === 'month' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setPeriodType('quarter')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                periodType === 'quarter' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              This Quarter
            </button>
            <button
              onClick={() => setPeriodType('year')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                periodType === 'year' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Full Year
            </button>
            <button
              onClick={() => setPeriodType('custom')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                periodType === 'custom' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Custom
            </button>
          </div>

          <button
            onClick={fetchPnL}
            className="p-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
            title="Refresh Report"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>

          <button
            onClick={handleExportCSV}
            disabled={loading || !pnlData}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors shadow-sm text-xs cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm text-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Print P&L
          </button>
        </div>
      </div>

      {/* Custom Date Form (visible only when 'custom' is active) */}
      {periodType === 'custom' && (
        <form onSubmit={handleCustomApply} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-wrap items-center gap-3 text-xs print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-600">From:</span>
            <input
              type="date"
              value={customDates.dateFrom}
              onChange={(e) => setCustomDates(prev => ({ ...prev, dateFrom: e.target.value }))}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              required
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-600">To:</span>
            <input
              type="date"
              value={customDates.dateTo}
              onChange={(e) => setCustomDates(prev => ({ ...prev, dateTo: e.target.value }))}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              required
            />
          </div>
          <button
            type="submit"
            className="px-4 py-1.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer shadow-sm"
          >
            Apply Range
          </button>
        </form>
      )}

      {loading ? (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 bg-slate-100 rounded-2xl border border-slate-200" />
            ))}
          </div>
          <div className="h-96 bg-slate-100 rounded-3xl border border-slate-200" />
        </div>
      ) : error ? (
        <div className="glass-card bg-rose-50/80 border border-rose-200 rounded-3xl p-8 text-center">
          <p className="text-rose-700 font-bold mb-2">Error Generating Profit & Loss Report</p>
          <p className="text-xs text-rose-500 mb-4">{error}</p>
          <button
            onClick={fetchPnL}
            className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 cursor-pointer shadow-sm"
          >
            Retry Connection
          </button>
        </div>
      ) : (
        <>
          {/* 4 Summary Scorecards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4 print:gap-2">
            
            {/* Net Revenue */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Net Revenue</span>
                <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                  <TrendingUp className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900">
                {formatCurrency(revenue.netSales)}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">
                From {revenue.invoicesCount} settled & open invoice{revenue.invoicesCount !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Cost of Goods Sold */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Cost of Goods (COGS)</span>
                <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                  <TrendingDown className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900">
                {formatCurrency(cogs.total)}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">
                From {cogs.ordersCount} direct inventory order{cogs.ordersCount !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Operating Expenses */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Operating Expenses</span>
                <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                  <PieIcon className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900">
                {formatCurrency(operatingExpenses.total)}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Across {operatingExpenses.expensesCount} expense disbursement{operatingExpenses.expensesCount !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Net Income */}
            <div className={`rounded-2xl p-5 border shadow-sm ${
              isProfitable 
                ? 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200' 
                : 'bg-gradient-to-br from-rose-50 to-rose-100/50 border-rose-200'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[11px] font-bold uppercase tracking-wider ${
                  isProfitable ? 'text-emerald-700' : 'text-rose-700'
                }`}>
                  Net Income (Profit)
                </span>
                <span className={`p-1.5 rounded-lg ${
                  isProfitable ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                }`}>
                  {isProfitable ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                </span>
              </div>
              <div className={`text-2xl font-black ${
                isProfitable ? 'text-emerald-900' : 'text-rose-900'
              }`}>
                {formatCurrency(netIncome.amount)}
              </div>
              <p className={`text-xs font-bold mt-1 ${
                isProfitable ? 'text-emerald-700' : 'text-rose-700'
              }`}>
                {netIncome.marginPercent}% Net Profit Margin
              </p>
            </div>

          </div>

          {/* Formal Income Statement Table */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden print:shadow-none print:border-0 print:rounded-none">
            
            {/* Statement Header */}
            <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/50">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">
                    Statement of Profit and Loss
                  </h3>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">
                    For the period {periodType.toUpperCase()} • All figures in INR (₹) • Accrual Basis
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100/60 w-max">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  Double-Entry Reconciled
                </div>
              </div>
            </div>

            {/* Income Statement Detailed Table */}
            <div className="p-6 md:p-8">
              <table className="w-full text-sm border-collapse">
                <tbody>
                  
                  {/* --- 1. OPERATING REVENUE --- */}
                  <tr className="border-b border-slate-200">
                    <td colSpan="2" className="pt-2 pb-3 font-black text-slate-900 uppercase tracking-wider text-xs">
                      1. Operating Revenue
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 pl-6 text-slate-700 font-medium">Gross Invoiced Sales</td>
                    <td className="py-2.5 pr-6 text-right font-medium text-slate-800 tabular-nums">
                      {formatCurrency(revenue.grossSales)}
                    </td>
                  </tr>
                  {revenue.discounts > 0 && (
                    <tr className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 pl-6 text-slate-500 font-medium">Less: Customer Discounts Allowed</td>
                      <td className="py-2.5 pr-6 text-right font-medium text-rose-600 tabular-nums">
                        - {formatCurrency(revenue.discounts)}
                      </td>
                    </tr>
                  )}
                  <tr className="border-b-2 border-slate-200 bg-slate-50/40 font-bold">
                    <td className="py-3 pl-6 text-slate-800 uppercase tracking-wider text-xs">Total Net Revenue</td>
                    <td className="py-3 pr-6 text-right font-black text-indigo-900 text-base tabular-nums">
                      {formatCurrency(revenue.netSales)}
                    </td>
                  </tr>

                  {/* Spacer */}
                  <tr><td colSpan="2" className="py-3"></td></tr>

                  {/* --- 2. COST OF GOODS SOLD --- */}
                  <tr className="border-b border-slate-200">
                    <td colSpan="2" className="pt-2 pb-3 font-black text-slate-900 uppercase tracking-wider text-xs">
                      2. Cost of Goods Sold (COGS)
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 pl-6 text-slate-700 font-medium">Direct Inventory Purchases & Cost of Goods</td>
                    <td className="py-2.5 pr-6 text-right font-medium text-slate-800 tabular-nums">
                      {formatCurrency(cogs.total)}
                    </td>
                  </tr>
                  <tr className="border-b-2 border-slate-200 bg-slate-50/40 font-bold">
                    <td className="py-3 pl-6 text-slate-800 uppercase tracking-wider text-xs">Total Cost of Goods Sold</td>
                    <td className="py-3 pr-6 text-right font-black text-slate-900 text-base tabular-nums">
                      {formatCurrency(cogs.total)}
                    </td>
                  </tr>

                  {/* Spacer */}
                  <tr><td colSpan="2" className="py-3"></td></tr>

                  {/* --- GROSS PROFIT HIGHLIGHT --- */}
                  <tr className="border-y-2 border-indigo-200 bg-indigo-50/40 font-black">
                    <td className="py-4 pl-6 text-indigo-950 uppercase tracking-wider text-sm flex items-center gap-2">
                      GROSS PROFIT (Margin: {grossProfit.marginPercent}%)
                    </td>
                    <td className="py-4 pr-6 text-right font-black text-indigo-950 text-lg tabular-nums">
                      {formatCurrency(grossProfit.amount)}
                    </td>
                  </tr>

                  {/* Spacer */}
                  <tr><td colSpan="2" className="py-4"></td></tr>

                  {/* --- 3. OPERATING EXPENSES --- */}
                  <tr className="border-b border-slate-200">
                    <td colSpan="2" className="pt-2 pb-3 font-black text-slate-900 uppercase tracking-wider text-xs">
                      3. Operating Expenses (OPEX)
                    </td>
                  </tr>
                  {operatingExpenses.breakdown.length > 0 ? (
                    operatingExpenses.breakdown.map((exp, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2.5 pl-6 text-slate-700 font-medium">
                          {exp.category}
                        </td>
                        <td className="py-2.5 pr-6 text-right font-medium text-slate-800 tabular-nums">
                          {formatCurrency(exp.amount)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="2" className="py-3 pl-6 text-xs text-slate-400 italic">
                        No operating expenses recorded for this period.
                      </td>
                    </tr>
                  )}
                  <tr className="border-b-2 border-slate-200 bg-slate-50/40 font-bold">
                    <td className="py-3 pl-6 text-slate-800 uppercase tracking-wider text-xs">Total Operating Expenses</td>
                    <td className="py-3 pr-6 text-right font-black text-rose-700 text-base tabular-nums">
                      {formatCurrency(operatingExpenses.total)}
                    </td>
                  </tr>

                  {/* Spacer */}
                  <tr><td colSpan="2" className="py-4"></td></tr>

                  {/* --- NET INCOME FINAL SUMMARY --- */}
                  <tr className={`border-y-2 font-black ${
                    isProfitable 
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-950' 
                      : 'border-rose-300 bg-rose-50 text-rose-950'
                  }`}>
                    <td className="py-5 pl-6 uppercase tracking-wider text-base">
                      <div className="flex items-center gap-2">
                        <span>NET INCOME / (NET LOSS)</span>
                        <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                          isProfitable ? 'bg-emerald-200 text-emerald-900' : 'bg-rose-200 text-rose-900'
                        }`}>
                          {netIncome.marginPercent}% Margin
                        </span>
                      </div>
                    </td>
                    <td className="py-5 pr-6 text-right font-black text-2xl tabular-nums">
                      {formatCurrency(netIncome.amount)}
                    </td>
                  </tr>

                </tbody>
              </table>
            </div>

            {/* Footer note */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
              <Info className="w-4 h-4 text-slate-400 shrink-0" />
              <span>
                Generated from verified General Ledger & Double-Entry Journal transactions. Voided sales, purchases, and expenses are excluded from this audit report.
              </span>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
