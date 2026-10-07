import { X, Lock } from 'lucide-react';
import { useState } from 'react';

export function PinModal({ isOpen, onClose, onConfirm }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const errMsg = onConfirm(pin);
    if (errMsg) {
      setError(errMsg);
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
        <div className="p-6 text-center space-y-4">
          <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-2">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Security Check</h2>
          <p className="text-sm text-slate-500">Please enter Admin PIN to void this payment. (Hint: 1234)</p>
          
          <form onSubmit={handleSubmit} className="mt-4">
            <input 
              type="password" 
              value={pin}
              onChange={(e) => { setPin(e.target.value); setError(''); }}
              autoFocus
              className="w-full text-center tracking-[0.5em] text-2xl font-black text-slate-800 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
              placeholder="••••"
              maxLength={4}
            />
            {error && <p className="text-rose-500 text-xs font-bold mt-2">{error}</p>}
            
            <div className="flex gap-3 mt-6">
              <button type="button" onClick={() => { onClose(); setPin(''); setError(''); }} className="flex-1 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button type="submit" className="flex-1 py-2.5 text-sm font-bold text-white bg-rose-600 rounded-xl hover:bg-rose-700 transition-colors shadow-sm shadow-rose-200">
                Confirm
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
