import { X, Image as ImageIcon, ExternalLink, Download, FileText, CheckCircle2 } from 'lucide-react';

export function ProofModal({ isOpen, onClose, payment }) {
  if (!isOpen || !payment) return null;

  const docUrl = payment.imagePreview || payment.image;
  const isDirectUrl = Boolean(docUrl && (docUrl.startsWith('http://') || docUrl.startsWith('https://') || docUrl.startsWith('/uploads')));
  const isPdf = Boolean(docUrl && docUrl.toLowerCase().includes('.pdf'));
  const isR2 = Boolean(docUrl && docUrl.includes('r2.dev'));

  const fileName = docUrl 
    ? (docUrl.split('/').pop() || `proof_${payment.ref || payment.id}`) 
    : 'Payment Proof';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
              {isPdf ? <FileText className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  Payment Proof Document
                </h2>
                {isR2 && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> Cloudflare R2
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-mono">
                {payment.ref} • {payment.method} • {new Date(payment.date).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isDirectUrl && (
              <a
                href={docUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                title="Open document in a new browser tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Full</span>
              </a>
            )}
            <button 
              onClick={onClose} 
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Content Body */}
        <div className="p-6 bg-slate-100/70 flex-1 overflow-auto flex items-center justify-center min-h-[350px]">
          {isDirectUrl ? (
            isPdf ? (
              <div className="w-full h-[65vh] rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm flex flex-col">
                <iframe 
                  src={docUrl} 
                  title="Payment Proof PDF" 
                  className="w-full flex-1 border-0" 
                />
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <img 
                  src={docUrl} 
                  alt="Payment Proof" 
                  className="max-w-full max-h-[65vh] object-contain rounded-xl shadow-md border border-slate-200 bg-white" 
                />
                <p className="text-xs text-slate-400 mt-2 font-mono truncate max-w-md">{fileName}</p>
              </div>
            )
          ) : (
            <div className="text-center p-8 bg-white rounded-2xl border border-slate-200 shadow-sm max-w-md">
              <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <ImageIcon className="w-7 h-7" />
              </div>
              <p className="font-bold text-slate-800 text-sm mb-1">{payment.image || 'Proof Document'}</p>
              <p className="text-xs text-slate-500 mb-4">
                This record contains a placeholder reference from legacy mock data. Upload an image or PDF to replace it with a Cloudflare R2 verified proof.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-white flex justify-between items-center text-xs text-slate-500">
          <span className="font-mono">Amount: ₹{Number(payment.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
        
      </div>
    </div>
  );
}
