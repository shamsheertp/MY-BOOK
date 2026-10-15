import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  DollarSign,
  Wallet,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertCircle,
  Plus,
  RefreshCw,
  BarChart3,
  Calendar,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  ShoppingCart,
  CheckCircle2,
  Loader2,
  Users
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

import { SummaryCard } from './components/SummaryCard';
import { StatusBadge } from './components/StatusBadge';
import { salesService, purchasesService, expensesService, contactsService } from '../../services/api';

// Fallback seed data in case backend is offline
import initialSales from '../../db/sales.json';
import initialPurchases from '../../db/purchases.json';
import initialExpenses from '../../db/expenses.json';
import initialContacts from '../../db/contacts.json';

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0);

const formatCurrencyExact = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);

const EXCLUDED_STATUSES = ['VOID', 'CANCELLED'];

export default function Dashboard() {
  const navigate = useNavigate();

  // Live Data States
  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [contacts, setContacts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [periodFilter, setPeriodFilter] = useState('all'); // 'all' | 'this_month' | 'last_30' | 'this_year'
  const [activeTableTab, setActiveTableTab] = useState('receivables'); // 'receivables' | 'payables' | 'recent_sales'

  // Load all live database records
  const loadDashboardData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [salesRes, purchasesRes, expensesRes, contactsRes] = await Promise.allSettled([
        salesService.list({ limit: 100 }),
        purchasesService.list({ limit: 100 }),
        expensesService.list({ limit: 100 }),
        contactsService.list({ limit: 100 }),
      ]);

      // Sales
      if (salesRes.status === 'fulfilled' && salesRes.value?.data && Array.isArray(salesRes.value.data)) {
        setSales(salesRes.value.data);
      } else {
        setSales(initialSales);
      }

      // Purchases
      if (purchasesRes.status === 'fulfilled' && purchasesRes.value?.data && Array.isArray(purchasesRes.value.data)) {
        setPurchases(purchasesRes.value.data);
      } else {
        setPurchases(initialPurchases);
      }

      // Expenses
      if (expensesRes.status === 'fulfilled' && expensesRes.value?.data?.expenses && Array.isArray(expensesRes.value.data.expenses)) {
        setExpenses(expensesRes.value.data.expenses);
      } else if (expensesRes.status === 'fulfilled' && Array.isArray(expensesRes.value?.data)) {
        setExpenses(expensesRes.value.data);
      } else {
        setExpenses(initialExpenses);
      }

      // Contacts
      if (contactsRes.status === 'fulfilled' && contactsRes.value?.data && Array.isArray(contactsRes.value.data)) {
        setContacts(contactsRes.value.data);
      } else {
        setContacts(initialContacts);
      }
    } catch (err) {
      console.warn('Dashboard live fetch error, using local fallback:', err);
      setSales(initialSales);
      setPurchases(initialPurchases);
      setExpenses(initialExpenses);
      setContacts(initialContacts);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Date Filtering helper
  const isInPeriod = useCallback((dateStr) => {
    if (periodFilter === 'all' || !dateStr) return true;
    const itemDate = new Date(dateStr);
    if (isNaN(itemDate.getTime())) return true;

    const now = new Date();
    if (periodFilter === 'this_month') {
      return (
        itemDate.getFullYear() === now.getFullYear() &&
        itemDate.getMonth() === now.getMonth()
      );
    }
    if (periodFilter === 'last_30') {
      const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return itemDate >= past30 && itemDate <= now;
    }
    if (periodFilter === 'this_year') {
      return itemDate.getFullYear() === now.getFullYear();
    }
    return true;
  }, [periodFilter]);

  // Filtered dataset for metrics
  const filteredSales = useMemo(() => {
    return sales.filter(s => !EXCLUDED_STATUSES.includes((s.status || '').toUpperCase()) && isInPeriod(s.date));
  }, [sales, isInPeriod]);

  const filteredPurchases = useMemo(() => {
    return purchases.filter(p => !EXCLUDED_STATUSES.includes((p.status || '').toUpperCase()) && isInPeriod(p.date));
  }, [purchases, isInPeriod]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => !EXCLUDED_STATUSES.includes((e.status || e.rawStatus || '').toUpperCase()) && isInPeriod(e.date));
  }, [expenses, isInPeriod]);

  // Key KPI Calculations
  const totalSales = useMemo(() => {
    return filteredSales.reduce((sum, s) => sum + Number(s.total || 0), 0);
  }, [filteredSales]);

  const totalPurchases = useMemo(() => {
    return filteredPurchases.reduce((sum, p) => sum + Number(p.total || 0), 0);
  }, [filteredPurchases]);

  const totalExpenses = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  }, [filteredExpenses]);

  const netProfit = useMemo(() => {
    return totalSales - (totalPurchases + totalExpenses);
  }, [totalSales, totalPurchases, totalExpenses]);

  // Receivables & Payables (unpaid/partial balances)
  const toReceive = useMemo(() => {
    return sales
      .filter(s => !EXCLUDED_STATUSES.includes((s.status || '').toUpperCase()))
      .reduce((sum, s) => sum + Number(s.balance || 0), 0);
  }, [sales]);

  const toPay = useMemo(() => {
    return purchases
      .filter(p => !EXCLUDED_STATUSES.includes((p.status || '').toUpperCase()))
      .reduce((sum, p) => sum + Number(p.balance || 0), 0);
  }, [purchases]);

  // Outstanding Receivables List
  const receivablesList = useMemo(() => {
    return sales
      .filter(s => !EXCLUDED_STATUSES.includes((s.status || '').toUpperCase()) && Number(s.balance || 0) > 0)
      .slice(0, 5)
      .map(s => ({
        id: s.id,
        customer: s.customerName || s.customerCompany || 'Customer',
        ref: s.ref || s.invoiceNumber || s.id,
        balance: Number(s.balance || 0),
        due: s.dueDate ? String(s.dueDate).split('T')[0] : '-',
        status: s.status || 'UNPAID',
      }));
  }, [sales]);

  // Outstanding Payables List
  const payablesList = useMemo(() => {
    return purchases
      .filter(p => !EXCLUDED_STATUSES.includes((p.status || '').toUpperCase()) && Number(p.balance || 0) > 0)
      .slice(0, 5)
      .map(p => ({
        id: p.id,
        supplier: p.supplierName || p.supplierCompany || 'Supplier',
        ref: p.ref || p.id,
        balance: Number(p.balance || 0),
        due: p.dueDate ? String(p.dueDate).split('T')[0] : '-',
        status: p.status || 'ORDERED',
      }));
  }, [purchases]);

  // Recent Sales List
  const recentSalesList = useMemo(() => {
    return [...sales]
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
      .slice(0, 5)
      .map(s => ({
        id: s.id,
        customer: s.customerName || s.customerCompany || 'Customer',
        ref: s.ref || s.id,
        total: Number(s.total || 0),
        date: s.date ? String(s.date).split('T')[0] : '-',
        status: s.status || 'PAID',
      }));
  }, [sales]);

  // ---------------- CHART DATA GENERATION ----------------
  // Builds a clean 6-month comparison: Sales, Purchases, Expenses
  const chartData = useMemo(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const months = [];

    // Last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `${monthNames[d.getMonth()]}`;
      months.push({ key, label, Sales: 0, Purchases: 0, Expenses: 0 });
    }

    const monthMap = new Map();
    months.forEach(m => monthMap.set(m.key, m));

    // Aggregate Sales
    sales.forEach(s => {
      if (EXCLUDED_STATUSES.includes((s.status || '').toUpperCase()) || !s.date) return;
      const d = new Date(s.date);
      if (isNaN(d.getTime())) return;
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (monthMap.has(k)) {
        monthMap.get(k).Sales += Number(s.total || 0);
      }
    });

    // Aggregate Purchases
    purchases.forEach(p => {
      if (EXCLUDED_STATUSES.includes((p.status || '').toUpperCase()) || !p.date) return;
      const d = new Date(p.date);
      if (isNaN(d.getTime())) return;
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (monthMap.has(k)) {
        monthMap.get(k).Purchases += Number(p.total || 0);
      }
    });

    // Aggregate Expenses
    expenses.forEach(e => {
      if (EXCLUDED_STATUSES.includes((e.status || e.rawStatus || '').toUpperCase()) || !e.date) return;
      const d = new Date(e.date);
      if (isNaN(d.getTime())) return;
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (monthMap.has(k)) {
        monthMap.get(k).Expenses += Number(e.amount || 0);
      }
    });

    return months;
  }, [sales, purchases, expenses]);

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/90 backdrop-blur-md text-white p-3 rounded-2xl shadow-xl text-xs space-y-1.5 border border-slate-700 min-w-[150px]">
          <p className="font-bold text-slate-300 pb-1 border-b border-slate-700/60">{label}</p>
          {payload.map((entry, index) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.name}:
              </span>
              <span className="font-semibold">{formatCurrencyExact(entry.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time financial summary, cash flow, and outstanding balances.
          </p>
        </div>

        {/* Period Selector & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
            className="bg-white border border-slate-200 text-slate-700 rounded-xl px-3.5 py-2 text-xs font-semibold shadow-sm outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="all">All Time</option>
            <option value="this_month">This Month</option>
            <option value="last_30">Last 30 Days</option>
            <option value="this_year">This Year</option>
          </select>

          <button
            onClick={() => loadDashboardData(true)}
            disabled={refreshing || loading}
            className="p-2 text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm transition-colors cursor-pointer"
            title="Refresh database numbers"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-600' : ''}`} />
          </button>

          <Link
            to="/sales/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            New Sale
          </Link>
          <Link
            to="/expenses/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            New Expense
          </Link>
        </div>
      </div>

      {/* Main KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <SummaryCard
          title="Total Sales"
          amount={loading ? '...' : formatCurrency(totalSales)}
          icon={DollarSign}
          trend="up"
          trendValue={`${filteredSales.length} Invoices`}
          isPositive={true}
        />
        <SummaryCard
          title="Total Purchases"
          amount={loading ? '...' : formatCurrency(totalPurchases)}
          icon={Wallet}
          trend="up"
          trendValue={`${filteredPurchases.length} Orders`}
          isPositive={false}
        />
        <SummaryCard
          title="Total Expenses"
          amount={loading ? '...' : formatCurrency(totalExpenses)}
          icon={CreditCard}
          trend="down"
          trendValue={`${filteredExpenses.length} Expenses`}
          isPositive={true}
        />
        <SummaryCard
          title="Net Profit"
          amount={loading ? '...' : formatCurrency(netProfit)}
          icon={TrendingUp}
          trend={netProfit >= 0 ? 'up' : 'down'}
          trendValue={netProfit >= 0 ? 'Positive Margin' : 'Negative Margin'}
          isPositive={netProfit >= 0}
        />
      </div>

      {/* Secondary Metrics: To Receive vs To Pay */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div className="glass-card rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-indigo-50/50 to-white/60 relative overflow-hidden group border border-slate-100 shadow-sm">
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-xs font-bold text-indigo-600 tracking-wider uppercase mb-1">
                Outstanding To Receive (Receivables)
              </p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {loading ? '...' : formatCurrencyExact(toReceive)}
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Uncollected balance across unpaid sales invoices
              </p>
            </div>
            <div className="p-3 bg-white/80 rounded-2xl text-indigo-600 shadow-sm border border-indigo-100 shrink-0">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="glass-card rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-amber-50/50 to-white/60 relative overflow-hidden group border border-slate-100 shadow-sm">
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-xs font-bold text-amber-700 tracking-wider uppercase mb-1">
                Outstanding To Pay (Payables)
              </p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {loading ? '...' : formatCurrencyExact(toPay)}
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Pending balance owed to suppliers across purchase orders
              </p>
            </div>
            <div className="p-3 bg-white/80 rounded-2xl text-amber-600 shadow-sm border border-amber-100 shrink-0">
              <AlertCircle className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Financial Performance Chart (Simple, clean, responsive) */}
      <div className="glass-card rounded-3xl p-6 border border-slate-100 shadow-sm bg-white/70">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 gap-2 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Financial Overview (Last 6 Months)</h2>
              <p className="text-xs text-slate-500">Monthly breakdown of Sales, Purchases, and Operational Expenses</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Sales
            </span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Purchases
            </span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400" /> Expenses
            </span>
          </div>
        </div>

        <div className="pt-6 w-full h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => (v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="Sales" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={30} />
              <Bar dataKey="Purchases" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={30} />
              <Bar dataKey="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Simple, Functional Tables Row: Receivables & Payables */}
      <div className="glass-card rounded-3xl overflow-hidden border border-slate-100 shadow-sm bg-white/70">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-100 bg-slate-50/40">
          {/* Table Tab Selector */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTableTab('receivables')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTableTab === 'receivables'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Pending Receivables ({receivablesList.length})
            </button>
            <button
              onClick={() => setActiveTableTab('payables')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTableTab === 'payables'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Pending Payables ({payablesList.length})
            </button>
            <button
              onClick={() => setActiveTableTab('recent_sales')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTableTab === 'recent_sales'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Recent Invoices
            </button>
          </div>

          <Link
            to={
              activeTableTab === 'receivables' || activeTableTab === 'recent_sales'
                ? '/sales'
                : '/purchases'
            }
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 transition-colors"
          >
            View All
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          {activeTableTab === 'receivables' ? (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/60 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-6">Customer</th>
                  <th className="py-3 px-6">Invoice Ref</th>
                  <th className="py-3 px-6">Due Date</th>
                  <th className="py-3 px-6 text-right">Outstanding Balance</th>
                  <th className="py-3 px-6 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {receivablesList.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-10 text-center text-slate-400 text-xs">
                      No outstanding receivables. All invoices are settled!
                    </td>
                  </tr>
                ) : (
                  receivablesList.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => navigate(`/sales/${row.id}`)}
                      className="hover:bg-slate-50/70 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-6 font-semibold text-slate-800">{row.customer}</td>
                      <td className="py-3.5 px-6 font-mono text-xs text-slate-500">{row.ref}</td>
                      <td className="py-3.5 px-6 text-slate-500 text-xs">{row.due}</td>
                      <td className="py-3.5 px-6 text-right font-bold text-rose-600">
                        {formatCurrencyExact(row.balance)}
                      </td>
                      <td className="py-3.5 px-6 text-center">
                        <StatusBadge status={row.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : activeTableTab === 'payables' ? (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/60 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-6">Supplier</th>
                  <th className="py-3 px-6">Purchase Ref</th>
                  <th className="py-3 px-6">Due Date</th>
                  <th className="py-3 px-6 text-right">Owed Balance</th>
                  <th className="py-3 px-6 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payablesList.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-10 text-center text-slate-400 text-xs">
                      No outstanding payables. All supplier bills are cleared!
                    </td>
                  </tr>
                ) : (
                  payablesList.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => navigate(`/purchases/${row.id}`)}
                      className="hover:bg-slate-50/70 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-6 font-semibold text-slate-800">{row.supplier}</td>
                      <td className="py-3.5 px-6 font-mono text-xs text-slate-500">{row.ref}</td>
                      <td className="py-3.5 px-6 text-slate-500 text-xs">{row.due}</td>
                      <td className="py-3.5 px-6 text-right font-bold text-amber-600">
                        {formatCurrencyExact(row.balance)}
                      </td>
                      <td className="py-3.5 px-6 text-center">
                        <StatusBadge status={row.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/60 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-6">Customer</th>
                  <th className="py-3 px-6">Invoice Ref</th>
                  <th className="py-3 px-6">Date</th>
                  <th className="py-3 px-6 text-right">Total Amount</th>
                  <th className="py-3 px-6 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentSalesList.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-10 text-center text-slate-400 text-xs">
                      No invoices recorded yet.
                    </td>
                  </tr>
                ) : (
                  recentSalesList.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => navigate(`/sales/${row.id}`)}
                      className="hover:bg-slate-50/70 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-6 font-semibold text-slate-800">{row.customer}</td>
                      <td className="py-3.5 px-6 font-mono text-xs text-slate-500">{row.ref}</td>
                      <td className="py-3.5 px-6 text-slate-500 text-xs">{row.date}</td>
                      <td className="py-3.5 px-6 text-right font-bold text-slate-900">
                        {formatCurrencyExact(row.total)}
                      </td>
                      <td className="py-3.5 px-6 text-center">
                        <StatusBadge status={row.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
