export const StatusBadge = ({ status }) => {
  const getStyles = (s) => {
    const text = (s || '').toUpperCase();
    if (text.includes('PARTIAL')) return 'bg-amber-100 text-amber-700 border-amber-200';
    if (text === 'PAID') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (text === 'PENDING' || text === 'UNPAID') return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    if (text === 'OVERDUE') return 'bg-rose-100 text-rose-700 border-rose-200 shadow-sm font-bold';
    if (text === 'VOID' || text === 'CANCELLED') return 'bg-stone-100 text-stone-500 border-stone-200';
    if (text === 'DRAFT') return 'bg-slate-100 text-slate-600 border-slate-200 border-dashed';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getStyles(status)}`}>
      {status}
    </span>
  );
};
