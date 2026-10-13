import { useState } from 'react';
import { Ban, AlertTriangle, X, Package, RotateCcw, CreditCard, Loader2 } from 'lucide-react';

export function VoidInvoiceModal({ isOpen, onClose, onConfirm, sale, isSubmitting = false }) {
  const [reason, setReason] = useState('');

  if (!isOpen || !sale) return null;

  const totalQuantityKg = (sale.items || []).reduce(
    (acc, it) => acc + Number(it.quantityKg || it.qty || 0),
    0
  );
  const balance = Number(sale.balance || 0);
  const paymentsCount = (sale.payments || []).filter(p => !p.voided).length;

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(reason);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4 border-b border-slate-100 flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center border border-rose-100 shrink-0">
              <Ban className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Void Invoice</h2>
              <p className="text-xs text-slate-500 font-medium">Ref: <span className="font-bold text-slate-700">{sale.ref}</span></p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed font-medium">
              Voiding cancels this invoice completely. This action cannot be reversed.
            </div>
          </div>

          {/* Automatic Accounting Effects */}
          <div className="space-y-2.5">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Automatic Adjustments</p>
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 space-y-2 text-xs">
              {totalQuantityKg > 0 && (
                <div className="flex items-center justify-between text-slate-700">
                  <span className="flex items-center space-x-2">
                    <Package className="w-4 h-4 text-indigo-500" />
                    <span>Return items to stock</span>
                  </span>
                  <span className="font-bold text-slate-800">+{totalQuantityKg} kg</span>
                </div>
              )}
              {balance > 0 && (
                <div className="flex items-center justify-between text-slate-700">
                  <span className="flex items-center space-x-2">
                    <RotateCcw className="w-4 h-4 text-emerald-500" />
                    <span>Cancel customer balance due</span>
                  </span>
                  <span className="font-bold text-slate-800">-₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              {paymentsCount > 0 && (
                <div className="flex items-center justify-between text-slate-700">
                  <span className="flex items-center space-x-2">
                    <CreditCard className="w-4 h-4 text-rose-500" />
                    <span>Void recorded payment receipts</span>
                  </span>
                  <span className="font-bold text-slate-800">{paymentsCount} payment{paymentsCount > 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
          </div>

          {/* Reason Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Reason for Voiding <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Order cancelled by customer, duplicate entry, incorrect pricing..."
              disabled={isSubmitting}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-rose-500 focus:bg-white rounded-xl text-sm outline-none transition-all placeholder:text-slate-400 text-slate-800 font-medium"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-4 text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              Keep Invoice
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-4 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl transition-all shadow-md shadow-rose-200 flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Voiding...</span>
                </>
              ) : (
                <>
                  <Ban className="w-4 h-4" />
                  <span>Confirm Void</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
export default VoidInvoiceModal;
