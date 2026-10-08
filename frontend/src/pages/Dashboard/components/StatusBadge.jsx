export const StatusBadge = ({ status }) => {
  const getStyles = (s) => {
    const text = (s || '').toUpperCase();
    if (text.includes('PARTIAL')) return 'bg-amber-100 text-amber-700 border-amber-200';
    if (text === 'PAID' || text === 'COMPLETED') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (text.includes('PENDING') || text === 'UNPAID') return 'bg-rose-100 text-rose-700 border-rose-200 shadow-sm';
    if (text === 'ORDERED' || text === 'CONFIRMED') return 'bg-blue-100 text-blue-700 border-blue-200';
    if (text === 'OVERDUE') return 'bg-red-100 text-red-700 border-red-200 shadow-sm font-bold';
    if (text === 'VOID' || text === 'CANCELLED') return 'bg-stone-100 text-stone-500 border-stone-200 line-through';
    if (text === 'DRAFT') return 'bg-slate-100 text-slate-600 border-slate-200 border-dashed';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getStyles(status)}`}>
      {status}
    </span>
  );
};
