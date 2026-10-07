import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export const SummaryCard = ({ title, amount, icon: Icon, trend, trendValue, isPositive }) => (
  <div className="glass-card rounded-3xl p-6 relative overflow-hidden group">
    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
    <div className="flex items-center justify-between mb-4 relative z-10">
      <h3 className="text-sm font-semibold text-slate-500 tracking-wide">{title}</h3>
      <div className={`p-2.5 rounded-xl ${isPositive ? 'bg-gradient-to-br from-emerald-400 to-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-gradient-to-br from-rose-400 to-rose-500 text-white shadow-lg shadow-rose-500/30'}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
    <div className="flex items-baseline space-x-2 relative z-10">
      <h2 className="text-2xl font-bold text-slate-800 tracking-tight truncate">{amount}</h2>
    </div>
    {trend && (
      <div className="mt-4 flex items-center text-sm">
        {isPositive ? (
          <ArrowUpRight className="w-4 h-4 text-emerald-500 mr-1" />
        ) : (
          <ArrowDownRight className="w-4 h-4 text-rose-500 mr-1" />
        )}
        <span className={isPositive ? 'text-emerald-600 font-medium' : 'text-rose-600 font-medium'}>
          {trendValue}
        </span>
        <span className="text-slate-400 ml-2">vs last month</span>
      </div>
    )}
  </div>
);
