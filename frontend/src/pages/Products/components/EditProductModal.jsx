import { useState, useEffect } from 'react';
import { Package, Tag, Layers, X, Save, AlertCircle, Weight, IndianRupee } from 'lucide-react';
import { productsService } from '../../../services/api';

export function EditProductModal({ product, isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    costPricePerKg: '',
    sellingPricePerKg: '',
    minStockKg: '10',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        sku: product.sku || '',
        category: product.category || '',
        costPricePerKg: (product.costPricePerKg ?? product.costPrice ?? '').toString(),
        sellingPricePerKg: (product.sellingPricePerKg ?? product.price ?? '').toString(),
        minStockKg: (product.minStockKg ?? '10').toString(),
        description: product.description || '',
      });
      setError('');
    }
  }, [product, isOpen]);

  if (!isOpen || !product) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.sku.trim()) {
      setError('Product Name and SKU are required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const payload = {
        name: formData.name.trim(),
        sku: formData.sku.trim(),
        category: formData.category.trim() || 'General',
        costPricePerKg: parseFloat(formData.costPricePerKg) || 0,
        sellingPricePerKg: parseFloat(formData.sellingPricePerKg) || 0,
        minStockKg: parseFloat(formData.minStockKg) || 10,
        description: formData.description.trim() || null,
      };

      const response = await productsService.update(product.id, payload);
      const updated = response.data || response;

      if (onSave) {
        onSave(updated);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update product');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden scale-in border border-slate-100">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/70">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-600" />
              Edit Product / Material
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Update product details, pricing per kg, and thresholds.</p>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-full transition-colors cursor-pointer"
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-slate-400" /> Name *
              </label>
              <input 
                type="text" 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                required 
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" 
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-400" /> SKU *
              </label>
              <input 
                type="text" 
                name="sku" 
                value={formData.sku} 
                onChange={handleChange} 
                required 
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" 
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-400" /> Category
              </label>
              <input 
                type="text" 
                name="category" 
                value={formData.category} 
                onChange={handleChange} 
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" 
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500" /> Low Stock Alert (kg)
              </label>
              <input 
                type="number" 
                step="0.01" 
                name="minStockKg" 
                value={formData.minStockKg} 
                onChange={handleChange} 
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" 
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <IndianRupee className="w-3.5 h-3.5 text-slate-400" /> Cost Price (₹ / kg)
              </label>
              <div className="relative">
                <input 
                  type="number" 
                  step="0.01" 
                  min="0"
                  name="costPricePerKg" 
                  value={formData.costPricePerKg} 
                  onChange={handleChange} 
                  required 
                  className="w-full px-3.5 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" 
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">/ kg</div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <IndianRupee className="w-3.5 h-3.5 text-indigo-500" /> Selling Price (₹ / kg)
              </label>
              <div className="relative">
                <input 
                  type="number" 
                  step="0.01" 
                  min="0"
                  name="sellingPricePerKg" 
                  value={formData.sellingPricePerKg} 
                  onChange={handleChange} 
                  required 
                  className="w-full px-3.5 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" 
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">/ kg</div>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Description / Specs
            </label>
            <textarea 
              name="description" 
              rows="2"
              value={formData.description} 
              onChange={handleChange} 
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" 
            />
          </div>
          
          <div className="pt-3 border-t border-slate-100 flex justify-end gap-3">
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
              className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-md shadow-indigo-100 cursor-pointer disabled:opacity-70"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
export default EditProductModal;
