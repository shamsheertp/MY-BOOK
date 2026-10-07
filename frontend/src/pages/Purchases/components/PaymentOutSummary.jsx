import { StatusBadge } from '../../Dashboard/components/StatusBadge';

export function PaymentOutSummary({ purchase, paymentsList, balance, paid, total, formatCurrency }) {
  return (
    <div className="glass-card bg-white/95 rounded-xl shadow-md overflow-hidden border border-white print:hidden mb-6">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Payment Summary</h3>
          <StatusBadge status={balance <= 0 ? 'PAID' : paid > 0 ? 'PARTIAL' : purchase.status} />
        </div>
        
        <div className="p-6 flex flex-col gap-6">
          <div className="w-full">
            {paymentsList.length > 0 ? (
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b-2 border-slate-200 font-bold text-slate-800 uppercase tracking-wider text-xs">
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2 px-4">Method & Ref</th>
                    <th className="py-2 px-4 text-center">Receipt</th>
                    <th className="py-2 pl-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="text-slate-700">
                  {paymentsList.map((pay, idx) => (
                    <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                      <td className="py-2 pr-4 font-medium">{pay.date}</td>
                      <td className="py-2 px-4 text-slate-500">
                        {pay.method} <span className="text-xs ml-1">({pay.ref})</span>
                      </td>
                      <td className="py-2 px-4 text-center">
                        {pay.image ? (
                          <button className="text-indigo-600 hover:text-indigo-800 text-[10px] font-bold uppercase tracking-wider bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded transition-colors">View</button>
                        ) : (
                          <button className="text-slate-400 hover:text-slate-600 text-[10px] font-bold uppercase tracking-wider bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2 py-1 rounded transition-colors">Upload</button>
                        )}
                      </td>
                      <td className="py-2 pl-4 text-right font-bold text-emerald-600">{formatCurrency(pay.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-slate-500 border-2 border-dashed border-slate-200 rounded-lg text-sm">
                <p>No payments recorded.</p>
              </div>
            )}
          </div>

          <div className="w-full border-t border-slate-100 pt-6 flex flex-col md:flex-row items-center justify-end gap-8 md:gap-12 text-sm">
            <div className="flex items-center gap-3">
              <span className="font-bold text-slate-600 uppercase tracking-wider text-xs">PO Total</span>
              <span className="text-lg font-black text-slate-900">{formatCurrency(total)}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-bold text-slate-500 uppercase tracking-wider text-xs">Amount Paid</span>
              <span className="text-lg font-bold text-emerald-600">{formatCurrency(paid)}</span>
            </div>
            <div className="flex items-center gap-3 bg-indigo-50 px-5 py-2 rounded-xl border border-indigo-100 shadow-sm">
              <span className="font-bold text-indigo-900 uppercase tracking-wider text-xs">Balance Due</span>
              <span className="text-xl font-black text-indigo-600">{formatCurrency(balance)}</span>
            </div>
          </div>
        </div>
      </div>
  );
}
