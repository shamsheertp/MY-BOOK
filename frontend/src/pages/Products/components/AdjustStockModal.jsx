import { useState, useEffect } from 'react';
import { Package, X, ArrowUpCircle, ArrowDownCircle, CheckCircle2 } from 'lucide-react';

export function AdjustStockModal({ product, isOpen, onClose, onSave }) {
  const [adjustmentType, setAdjustmentType] = useState('add'); // 'add', 'subtract', 'set'
  const [quantity, setQuantity] = useState('');

  useEffect(() => {
    if (isOpen) {
      setAdjustmentType('add');
      setQuantity('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 0) return;

    let newStock = product.stock;
    if (adjustmentType === 'add') newStock += qty;
    if (adjustmentType === 'subtract') newStock = Math.max(0, newStock - qty);
    if (adjustmentType === 'set') newStock = qty;

    onSave({
      ...product,
      stock: newStock,
      status: newStock === 0 ? 'Out of Stock' : newStock < 10 ? 'Low Stock' : 'In Stock'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm fade-in">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden scale-in">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-800">Adjust Stock</h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button type="button" onClick={() => setAdjustmentType('add')} className={`flex-1 flex justify-center items-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${adjustmentType === 'add' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}>
              <ArrowUpCircle className="w-4 h-4" /> Add
            </button>
            <button type="button" onClick={() => setAdjustmentType('subtract')} className={`flex-1 flex justify-center items-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${adjustmentType === 'subtract' ? 'bg-white shadow-sm text-rose-600' : 'text-slate-500 hover:text-slate-700'}`}>
              <ArrowDownCircle className="w-4 h-4" /> Reduce
            </button>
            <button type="button" onClick={() => setAdjustmentType('set')} className={`flex-1 flex justify-center items-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${adjustmentType === 'set' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>
              <CheckCircle2 className="w-4 h-4" /> Set
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5"><Package className="w-4 h-4" /> Quantity</label>
            <input type="number" min="0" required value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="0" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-xl font-bold text-center" />
          </div>

          <div className="bg-slate-50 p-4 rounded-xl flex justify-between items-center border border-slate-100">
            <span className="text-sm text-slate-500 font-medium">New Stock Level:</span>
            <span className="text-lg font-bold text-slate-800">
              {adjustmentType === 'add' ? product.stock + (parseInt(quantity) || 0) : 
               adjustmentType === 'subtract' ? Math.max(0, product.stock - (parseInt(quantity) || 0)) : 
               adjustmentType === 'set' && quantity !== '' ? parseInt(quantity) : product.stock}
            </span>
          </div>
          
          <div className="pt-2 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-50 rounded-xl transition-colors">Cancel</button>
            <button type="submit" className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors">Confirm</button>
          </div>
        </form>
      </div>
    </div>
  );
}
