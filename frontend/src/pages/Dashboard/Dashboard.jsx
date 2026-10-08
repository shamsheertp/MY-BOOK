import { DollarSign, Wallet, CreditCard, PieChart, Clock, AlertCircle } from 'lucide-react';
import { SummaryCard } from './components/SummaryCard';
import { StatusBadge } from './components/StatusBadge';
import salesData from '../../db/sales.json';
import purchasesData from '../../db/purchases.json';
import expensesData from '../../db/expenses.json';
import contactsData from '../../db/contacts.json';

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(amount || 0);

const EXCLUDED = ['VOID', 'CANCELLED', 'DRAFT'];

export default function Dashboard() {
  const validSales = salesData.filter(s => !EXCLUDED.includes((s.status || '').toUpperCase()));
  const totalSales = validSales.reduce((sum, s) => sum + (s.total || 0), 0);
  
  const validPurchases = purchasesData.filter(p => !EXCLUDED.includes((p.status || '').toUpperCase()));
  const totalPurchases = validPurchases.reduce((sum, p) => sum + (p.total || 0), 0);
  
  const validExpenses = expensesData.filter(e => !EXCLUDED.includes((e.status || '').toUpperCase()));
  const totalExpenses = validExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  
  const netProfit = totalSales - totalPurchases - totalExpenses;
  
  const toReceive = validSales.reduce((sum, s) => sum + (s.balance || 0), 0);
  const toPay = validPurchases.reduce((sum, p) => sum + (p.balance || 0), 0);

  const getContactName = (idPrefix, fullId) => {
    if (!fullId) return 'Unknown';
    const suffix = String(fullId).includes('-') ? String(fullId).substring(String(fullId).indexOf('-') + 1) : String(fullId);
    const c = contactsData.find(c => c.id === `CONT-${suffix}`);
    return c ? (c.contactName || c.companyName) : fullId;
  };

  const receivables = validSales
    .filter(s => (s.balance || 0) > 0)
    .map(s => ({
      customer: getContactName('CUST', s.customerId),
      sale: s.invoiceNumber || s.id,
      balance: formatCurrency(s.balance),
      due: s.dueDate || '-',
      status: s.status || 'UNPAID'
    }));

  const payables = validPurchases
    .filter(p => (p.balance || 0) > 0)
    .map(p => ({
      supplier: getContactName('SUP', p.supplierId),
      purchase: p.ref || p.id,
      balance: formatCurrency(p.balance),
      due: p.dueDate || '-',
      status: p.status || 'UNPAID'
    }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Overview of your financial performance</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <select className="bg-white border border-slate-200 text-slate-700 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm outline-none cursor-pointer">
            <option>October 2026</option>
            <option>September 2026</option>
            <option>August 2026</option>
          </select>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm shadow-blue-200">
            + New Sale
          </button>
        </div>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard 
          title="Sales" 
          amount={formatCurrency(totalSales)} 
          icon={DollarSign} 
          trend="up" 
          trendValue="+12.5%" 
          isPositive={true} 
        />
        <SummaryCard 
          title="Purchases" 
          amount={formatCurrency(totalPurchases)} 
          icon={Wallet} 
          trend="up" 
          trendValue="+5.2%" 
          isPositive={false} 
        />
        <SummaryCard 
          title="Expenses" 
          amount={formatCurrency(totalExpenses)} 
          icon={CreditCard} 
          trend="down" 
          trendValue="-2.1%" 
          isPositive={true} 
        />
        <SummaryCard 
          title="Net Profit" 
          amount={formatCurrency(netProfit)} 
          icon={PieChart} 
          trend="up" 
          trendValue="+18.4%" 
          isPositive={netProfit >= 0} 
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card rounded-3xl p-6 bg-gradient-to-br from-indigo-50/50 to-white/30 relative overflow-hidden group">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-colors duration-500"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-sm font-semibold text-indigo-600 mb-1 tracking-wide uppercase">To Receive</p>
              <h3 className="text-2xl font-bold text-slate-800 tracking-tight">{formatCurrency(toReceive)}</h3>
            </div>
            <div className="p-3 bg-white/60 backdrop-blur-md rounded-2xl text-indigo-600 shadow-sm border border-white/50">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>
        <div className="glass-card rounded-3xl p-6 bg-gradient-to-br from-amber-50/50 to-white/30 relative overflow-hidden group">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-colors duration-500"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-sm font-semibold text-amber-600 mb-1 tracking-wide uppercase">To Pay</p>
              <h3 className="text-2xl font-bold text-slate-800 tracking-tight">{formatCurrency(toPay)}</h3>
            </div>
            <div className="p-3 bg-white/60 backdrop-blur-md rounded-2xl text-amber-600 shadow-sm border border-white/50">
              <AlertCircle className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Receivables Table */}
        <div className="glass-card rounded-3xl overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-white/40 bg-white/30">
            <h3 className="text-lg font-bold text-slate-800">Outstanding Receivables</h3>
            <button className="text-sm font-medium text-blue-600 hover:text-blue-700">View All →</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-medium">
                <tr>
                  <th className="px-5 py-3 rounded-tl-lg">Customer</th>
                  <th className="px-5 py-3">Sale</th>
                  <th className="px-5 py-3">Balance</th>
                  <th className="px-5 py-3">Due</th>
                  <th className="px-5 py-3 rounded-tr-lg">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {receivables.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-4 font-medium text-slate-900">{row.customer}</td>
                    <td className="px-5 py-4 text-slate-500">{row.sale}</td>
                    <td className="px-5 py-4 font-medium text-slate-700">{row.balance}</td>
                    <td className="px-5 py-4 text-slate-500">{row.due}</td>
                    <td className="px-5 py-4"><StatusBadge status={row.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payables Table */}
        <div className="glass-card rounded-3xl overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-white/40 bg-white/30">
            <h3 className="text-lg font-bold text-slate-800">Outstanding Payables</h3>
            <button className="text-sm font-medium text-blue-600 hover:text-blue-700">View All →</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-medium">
                <tr>
                  <th className="px-5 py-3 rounded-tl-lg">Supplier</th>
                  <th className="px-5 py-3">Purchase</th>
                  <th className="px-5 py-3">Balance</th>
                  <th className="px-5 py-3">Due</th>
                  <th className="px-5 py-3 rounded-tr-lg">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payables.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-4 font-medium text-slate-900">{row.supplier}</td>
                    <td className="px-5 py-4 text-slate-500">{row.purchase}</td>
                    <td className="px-5 py-4 font-medium text-slate-700">{row.balance}</td>
                    <td className="px-5 py-4 text-slate-500">{row.due}</td>
                    <td className="px-5 py-4"><StatusBadge status={row.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
