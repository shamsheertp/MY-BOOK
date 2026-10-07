import { X, Image as ImageIcon } from 'lucide-react';

export function ProofModal({ isOpen, onClose, payment }) {
  if (!isOpen || !payment) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center space-x-2 text-emerald-600">
            <ImageIcon className="w-5 h-5" />
            <h2 className="text-sm font-bold uppercase tracking-wider">Payment Proof</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Image Content */}
        <div className="p-6 bg-slate-100 flex items-center justify-center min-h-[300px]">
          {payment.imagePreview ? (
            <img 
              src={payment.imagePreview} 
              alt="Payment Proof" 
              className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-sm border border-slate-200" 
            />
          ) : (
            <div className="text-center text-slate-500">
              <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-bold">{payment.image}</p>
              <p className="text-xs mt-1">Image mock placeholder (no file attached)</p>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}
