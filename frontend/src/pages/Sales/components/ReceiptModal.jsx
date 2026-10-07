import { X, Download, Share2, Receipt, Printer } from 'lucide-react';
import { useCompanyProfile, formatAddressLines } from '../../../hooks/useCompanyProfile';

export function ReceiptModal({ isOpen, onClose, payment, saleRef, customerName, formatCurrency, balance }) {
  const company = useCompanyProfile();
  if (!isOpen || !payment) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center space-x-2 text-indigo-600">
            <Receipt className="w-5 h-5" />
            <h2 className="text-sm font-bold uppercase tracking-wider">Payment Receipt</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Thermal Receipt Design */}
        <div className="bg-slate-200 p-4 sm:p-8 flex justify-center">
          <div className="bg-white w-full max-w-xs shadow-md relative" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
            
            {/* Top jagged edge */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-repeat-x" style={{ backgroundImage: 'radial-gradient(circle at 50% 0, transparent 50%, white 51%), radial-gradient(circle at 50% 100%, white 50%, transparent 51%)', backgroundSize: '10px 10px', backgroundPosition: '0 -5px' }}></div>
            
            <div className="p-6 pt-8 pb-8 text-slate-800 text-sm">
              
              {/* Header */}
              <div className="text-center mb-4">
                {company.logo && <img src={company.logo} alt="" className="w-12 h-12 object-contain mx-auto mb-2 grayscale" />}
                <h1 className="text-xl font-black mb-1 uppercase leading-tight">{company.companyName}</h1>
                <div className="text-[10px] leading-snug text-slate-600 space-y-0.5 mb-2">
                  {formatAddressLines(company).map((l, i) => <p key={i}>{l}</p>)}
                  {company.phone && <p>TEL: {company.phone}</p>}
                  {company.gstin && <p className="font-bold">GSTIN: {company.gstin.toUpperCase()}</p>}
                </div>
                <p className="text-xs font-bold">PAYMENT RECEIPT</p>
              </div>
              
              <div className="border-t-2 border-dashed border-slate-300 my-4"></div>
              
              {/* Meta Info */}
              <div className="space-y-1 text-xs font-bold">
                <div className="flex justify-between">
                  <span>DATE:</span>
                  <span>{payment.date}</span>
                </div>
                <div className="flex justify-between">
                  <span>RECEIPT NO:</span>
                  <span>{payment.ref || `RCPT-${Math.floor(Math.random()*10000)}`}</span>
                </div>
                <div className="flex justify-between">
                  <span>INVOICE:</span>
                  <span>{saleRef}</span>
                </div>
              </div>
              
              <div className="border-t-2 border-dashed border-slate-300 my-4"></div>
              
              {/* Customer & Payment Info */}
              <div className="space-y-2 text-xs font-bold">
                <div>
                  <span className="block text-slate-500">RECEIVED FROM:</span>
                  <span className="text-sm">{customerName}</span>
                </div>
                <div>
                  <span className="block text-slate-500">PAYMENT MODE:</span>
                  <span>{payment.method.toUpperCase()}</span>
                </div>
              </div>
              
              <div className="border-t-2 border-dashed border-slate-300 my-4"></div>
              
              {/* Amounts */}
              <div className="space-y-3">
                <div className="text-center">
                  <span className="block text-xs font-bold text-slate-500 mb-1">AMOUNT RECEIVED</span>
                  <span className="text-2xl font-black">{formatCurrency(payment.amount)}</span>
                </div>
                
                <div className="flex justify-between items-center bg-slate-100 p-2 font-bold">
                  <span className="text-xs">BALANCE DUE:</span>
                  <span className="text-sm">{formatCurrency(balance)}</span>
                </div>
              </div>
              
              <div className="border-t-2 border-dashed border-slate-300 my-4"></div>
              
              {/* Footer */}
              <div className="text-center text-xs font-bold space-y-1">
                <p className="uppercase">{company.footerNote || 'Thank you for your business!'}</p>
                {company.email && <p className="text-slate-500 font-normal">{company.email}</p>}
                {company.website && <p className="text-slate-400 font-normal">{company.website}</p>}
              </div>

            </div>
            
            {/* Bottom jagged edge */}
            <div className="absolute bottom-0 left-0 right-0 h-2 bg-repeat-x" style={{ backgroundImage: 'radial-gradient(circle at 50% 100%, transparent 50%, white 51%), radial-gradient(circle at 50% 0, white 50%, transparent 51%)', backgroundSize: '10px 10px', backgroundPosition: '0 5px' }}></div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-2">
          <button 
            onClick={() => window.print()}
            className="flex-1 flex items-center justify-center py-2.5 text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4 mr-1.5 text-slate-500" />
            Print
          </button>
          <button 
            onClick={() => alert('Downloading Receipt PDF...')}
            className="flex-1 flex items-center justify-center py-2.5 text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4 mr-1.5 text-slate-500" />
            PDF
          </button>
          <button 
            onClick={() => alert('Opening share dialog...')}
            className="flex-1 flex items-center justify-center py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
          >
            <Share2 className="w-4 h-4 mr-1.5" />
            Share
          </button>
        </div>
      </div>
    </div>
  );
}
