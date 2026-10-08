import { useState } from 'react';
import { ReportHeader } from './components/ReportHeader';
import { SalesReport } from './components/SalesReport';
import { ExpensesReport } from './components/ExpensesReport';
import { BarChart3, TrendingDown, DollarSign } from 'lucide-react';

export default function Reports() {
  const [activeTab, setActiveTab] = useState('sales');

  const tabs = [
    { id: 'sales', label: 'Sales & Revenue', icon: BarChart3 },
    { id: 'expenses', label: 'Expenses & Costs', icon: TrendingDown },
    { id: 'profit', label: 'Profit & Loss', icon: DollarSign },
  ];

  return (
    <div className="max-w-7xl mx-auto fade-in pb-20">
      <ReportHeader title="Business Reports" />
      
      <div className="flex gap-2 p-1.5 bg-white border border-slate-200 rounded-2xl w-max mb-8 shadow-sm">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="report-content-area">
        {activeTab === 'sales' && <SalesReport />}
        {activeTab === 'expenses' && <ExpensesReport />}
        {activeTab === 'profit' && (
          <div className="glass-card bg-white rounded-3xl p-12 text-center border border-slate-100">
            <h3 className="text-xl font-bold text-slate-800 mb-2">Profit & Loss Report</h3>
            <p className="text-slate-500">This report combines your Sales and Expenses to show net profit margins. (Coming Soon)</p>
          </div>
        )}
      </div>
    </div>
  );
}
