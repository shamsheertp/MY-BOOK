import React from 'react';

import { TrendingUp, TrendingDown, ShoppingCart, Package } from 'lucide-react';

export const ProfileStatCard = ({ label, amount, isHighlight }) => {
  let Icon = TrendingUp;
  let colorClass = 'text-slate-500 bg-slate-50 border-slate-100';
  let iconColor = 'text-slate-400';
  
  if (label.includes('Receive') || label.includes('Sales')) {
    Icon = label.includes('Sales') ? ShoppingCart : TrendingUp;
    colorClass = 'text-emerald-700 bg-gradient-to-br from-emerald-50 to-white border-emerald-100/50';
    iconColor = 'text-emerald-500 bg-emerald-100/50';
  } else if (label.includes('Pay') || label.includes('Purchase')) {
    Icon = label.includes('Purchase') ? Package : TrendingDown;
    colorClass = 'text-rose-700 bg-gradient-to-br from-rose-50 to-white border-rose-100/50';
    iconColor = 'text-rose-500 bg-rose-100/50';
  }

  if (isHighlight) {
    colorClass = 'text-indigo-700 bg-gradient-to-br from-indigo-50 to-white border-indigo-100/50 shadow-indigo-100/50 shadow-lg';
    iconColor = 'text-indigo-600 bg-indigo-100';
  }

  return (
    <div className={`p-6 rounded-3xl relative overflow-hidden group border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${colorClass}`}>
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-2xl ${iconColor}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <p className="text-xs font-bold mb-1 tracking-wider uppercase opacity-70 relative z-10">{label}</p>
      <h3 className="text-3xl font-black tracking-tight relative z-10">{amount}</h3>
      
      {/* Decorative background element */}
      <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white/40 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
    </div>
  );
};
