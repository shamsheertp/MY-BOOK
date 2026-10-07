import { ArrowLeft, Printer, FileText, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export function PurchaseDetailsHeader({ supplierId, onPrint, onPdf, onMakePayment }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <Link to={`/suppliers/${supplierId}`} className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors bg-white/50 px-4 py-2 rounded-xl border border-white/60 shadow-sm backdrop-blur-sm self-start sm:self-auto">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Supplier
      </Link>
      
      <div className="flex space-x-3">
        <button onClick={onPrint} className="flex items-center justify-center text-sm font-medium text-slate-600 hover:text-indigo-600 bg-white border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 px-4 py-2.5 rounded-xl transition-all shadow-sm flex-1 sm:flex-none">
          <Printer className="w-4 h-4 mr-2" />
          Print
        </button>
        <button onClick={onPdf} className="flex items-center justify-center text-sm font-medium text-slate-600 hover:text-indigo-600 bg-white border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 px-4 py-2.5 rounded-xl transition-all shadow-sm flex-1 sm:flex-none">
          <FileText className="w-4 h-4 mr-2" />
          PDF
        </button>
        <button onClick={onMakePayment} className="flex items-center justify-center text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 rounded-xl transition-all shadow-sm shadow-indigo-200 flex-1 sm:flex-none whitespace-nowrap">
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Make Payment
        </button>
      </div>
    </div>
  );
}
