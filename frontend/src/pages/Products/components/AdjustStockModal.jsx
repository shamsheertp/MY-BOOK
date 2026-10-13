import { useState, useEffect } from 'react';
import { Package, X, ArrowUpCircle, ArrowDownCircle, CheckCircle2, Weight, AlertCircle } from 'lucide-react';
import { productsService } from '../../../services/api';

export function AdjustStockModal({ product, isOpen, onClose, onSave }) {
  const [adjustmentType, setAdjustmentType] = useState('add'); // 'add', 'subtract', 'set'
  const [quantity, setQuantity] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setAdjustmentType('add');
      setQuantity('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen || !product) return null;

  const currentStock = Number(product.stockKg ?? product.stock ?? 0);
  const qtyNum = parseFloat(quantity) || 0;

  let projectedStock = currentStock;
  if (adjustmentType === 'add') {
    projectedStock = currentStock + qtyNum;
  } else if (adjustmentType === 'subtract') {
    projectedStock = Math.max(0, currentStock - qtyNum);
  } else if (adjustmentType === 'set') {
    projectedStock = Math.max(0, qtyNum);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (quantity === '' || isNaN(qtyNum) || qtyNum < 0) {
      setError('Please enter a valid positive quantity in kg');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await productsService.adjustStock(product.id, {
        type: adjustmentType.toUpperCase(),
        quantityKg: qtyNum,
      });

      const updatedProduct = response.data || response;
      if (onSave) {
        onSave(updatedProduct);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to adjust stock');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden scale-in border border-slate-100">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/70">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Weight className="w-5 h-5 text-indigo-600" />
              Adjust Stock (kg)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">{product.name} ({product.sku})</p>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
            <button 
              type="button" 
              onClick={() => setAdjustmentType('add')} 
              className={`flex-1 flex justify-center items-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                adjustmentType === 'add' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowUpCircle className="w-4 h-4" /> Add kg
            </button>
            <button 
              type="button" 
              onClick={() => setAdjustmentType('subtract')} 
              className={`flex-1 flex justify-center items-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                adjustmentType === 'subtract' ? 'bg-white shadow-sm text-rose-600' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowDownCircle className="w-4 h-4" /> Reduce kg
            </button>
            <button 
              type="button" 
              onClick={() => setAdjustmentType('set')} 
              className={`flex-1 flex justify-center items-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                adjustmentType === 'set' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" /> Set Exact kg
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center justify-between">
              <span className="flex items-center gap-1.5"><Weight className="w-3.5 h-3.5 text-slate-400" /> Quantity to Adjust</span>
              <span className="text-slate-400 font-normal">Current: {currentStock.toFixed(2)} kg</span>
            </label>
            <div className="relative">
              <input 
                type="number" 
                step="0.01"
                min="0" 
                required 
                value={quantity} 
                onChange={(e) => setQuantity(e.target.value)} 
                placeholder="0.00" 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-2xl font-bold text-center text-slate-800" 
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-sm font-semibold text-slate-400">
                kg
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl flex justify-between items-center border border-slate-100">
            <div>
              <p className="text-xs text-slate-500 font-medium">New Projected Stock</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {adjustmentType === 'add' ? `+${qtyNum} kg added` : adjustmentType === 'subtract' ? `-${qtyNum} kg reduced` : `Reset to ${qtyNum} kg`}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xl font-black text-slate-800">
                {projectedStock.toFixed(2)}
              </span>
              <span className="text-sm font-bold text-slate-500 ml-1">kg</span>
            </div>
          </div>
          
          <div className="pt-2 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose} 
              disabled={isSubmitting}
              className="px-5 py-2.5 text-slate-600 text-sm font-semibold hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-100 cursor-pointer disabled:opacity-70 flex items-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Confirm Adjustment'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
export default AdjustStockModal;
