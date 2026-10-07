import { X, Upload, CheckCircle2 } from 'lucide-react';

export function ReceivePaymentModal({ isOpen, onClose, balance, paymentForm, setPaymentForm, onSave }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-800">Receive Payment</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-5">
          <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex justify-between items-center">
            <span className="text-sm font-bold text-indigo-800">Balance Due</span>
            <span className="text-xl font-black text-indigo-700">₹{balance.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Amount Receiving (₹)</label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-slate-400 font-medium">₹</span>
              <input 
                type="text" 
                value={paymentForm.amount ? Number(paymentForm.amount).toLocaleString('en-IN') : ''}
                onChange={(e) => {
                  const rawValue = e.target.value.replace(/,/g, '').replace(/[^0-9.]/g, '');
                  setPaymentForm({...paymentForm, amount: rawValue});
                }}
                className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-lg font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                placeholder={balance.toLocaleString('en-IN')}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Date</label>
              <input 
                type="date" 
                value={paymentForm.date}
                onChange={(e) => setPaymentForm({...paymentForm, date: e.target.value})}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Method</label>
              <select 
                value={paymentForm.method}
                onChange={(e) => setPaymentForm({...paymentForm, method: e.target.value})}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
              >
                <option>Bank Transfer</option>
                <option>Cash</option>
                <option>UPI</option>
                <option>Cheque</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Reference No.</label>
            <input 
              type="text" 
              value={paymentForm.ref}
              onChange={(e) => setPaymentForm({...paymentForm, ref: e.target.value})}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              placeholder="e.g. TRN-987654321"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Payment Receipt</label>
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative">
              <input 
                type="file" 
                accept="image/*"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={(e) => setPaymentForm({...paymentForm, image: e.target.files[0]})}
              />
              <Upload className="w-6 h-6 text-slate-400 mb-2" />
              {paymentForm.image ? (
                <span className="text-sm font-bold text-indigo-600 truncate w-full px-4">{paymentForm.image.name}</span>
              ) : (
                <>
                  <span className="text-sm font-bold text-slate-600">Upload receipt image</span>
                  <span className="text-xs text-slate-400 mt-1">PNG, JPG up to 5MB</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          >
            Cancel
          </button>
          <button 
            onClick={onSave}
            disabled={!paymentForm.amount}
            className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Save Payment
          </button>
        </div>
      </div>
    </div>
  );
}
