export function SalesSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-0 space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <div className="h-8 bg-slate-200 rounded w-48 mb-2 animate-pulse"></div>
          <div className="h-4 bg-slate-200 rounded w-64 animate-pulse"></div>
        </div>
        <div className="flex space-x-3">
          <div className="h-10 bg-slate-200 rounded w-24 animate-pulse"></div>
          <div className="h-10 bg-indigo-200 rounded w-32 animate-pulse"></div>
        </div>
      </div>
      <div className="glass-card bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="h-10 bg-slate-200 rounded max-w-md w-full animate-pulse"></div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="flex justify-between items-center py-4 border-b border-slate-50">
                <div className="h-4 bg-slate-200 rounded w-32 animate-pulse"></div>
                <div className="h-4 bg-slate-200 rounded w-24 animate-pulse"></div>
                <div className="h-4 bg-slate-200 rounded w-24 animate-pulse"></div>
                <div className="h-4 bg-slate-200 rounded w-16 animate-pulse"></div>
                <div className="h-4 bg-slate-200 rounded w-20 animate-pulse"></div>
                <div className="h-6 bg-slate-200 rounded-full w-16 animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
