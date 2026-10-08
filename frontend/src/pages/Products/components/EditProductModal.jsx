import { useState, useEffect } from 'react';
import { Package, Tag, DollarSign, Layers, X, Save } from 'lucide-react';

export function EditProductModal({ product, isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({ ...product });

  useEffect(() => {
    if (product) setFormData({ ...product });
  }, [product]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock, 10),
      status: parseInt(formData.stock, 10) === 0 ? 'Out of Stock' : parseInt(formData.stock, 10) < 10 ? 'Low Stock' : 'In Stock'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm fade-in">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden scale-in">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-800">Edit Product</h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5"><Package className="w-4 h-4" /> Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5"><Tag className="w-4 h-4" /> SKU</label>
              <input type="text" name="sku" value={formData.sku} onChange={handleChange} required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5"><Layers className="w-4 h-4" /> Category</label>
              <input type="text" name="category" value={formData.category} onChange={handleChange} required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5"><DollarSign className="w-4 h-4" /> Price</label>
              <input type="number" step="0.01" name="price" value={formData.price} onChange={handleChange} required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none" />
            </div>
          </div>
          
          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-50 rounded-xl transition-colors">Cancel</button>
            <button type="submit" className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2"><Save className="w-4 h-4" /> Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
}
