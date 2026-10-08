import { useState } from 'react';
import { Package, Tag, DollarSign, Layers, CheckCircle2, AlertCircle } from 'lucide-react';

export default function CreateProduct({ onSave }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  
  const generateSKU = () => `SKU-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

  const [formData, setFormData] = useState({
    name: '',
    sku: generateSKU(),
    category: '',
    costPrice: '',
    price: '',
    stock: '',
    status: 'In Stock'
  });
  
  const [errors, setErrors] = useState({});

  const defaultCategories = [
    'Electronics',
    'Furniture',
    'Office Supplies',
    'Software',
    'Services'
  ];

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.sku.trim()) newErrors.sku = 'SKU is required';
    if (!formData.category.trim()) newErrors.category = 'Category is required';
    
    if (!formData.costPrice) {
      newErrors.costPrice = 'Cost Price is required';
    } else if (isNaN(formData.costPrice) || Number(formData.costPrice) < 0) {
      newErrors.costPrice = 'Must be valid';
    }

    if (!formData.price) {
      newErrors.price = 'Selling Price is required';
    } else if (isNaN(formData.price) || Number(formData.price) < 0) {
      newErrors.price = 'Must be valid';
    }

    if (!formData.stock) {
      newErrors.stock = 'Stock is required';
    } else if (isNaN(formData.stock) || Number(formData.stock) < 0) {
      newErrors.stock = 'Stock must be a valid number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        const newProduct = {
          id: `PRD-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
          ...formData,
          costPrice: parseFloat(formData.costPrice),
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock, 10)
        };

        if (onSave) {
          onSave(newProduct);
          setShowSuccess(true);
          setFormData({
            name: '',
            sku: generateSKU(),
            category: '',
            costPrice: '',
            price: '',
            stock: '',
            status: 'In Stock'
          });
          setTimeout(() => setShowSuccess(false), 3000);
        }
      }, 800);
    }
  };

  return (
    <div className="w-full fade-in">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="glass-card p-5 rounded-2xl border border-slate-100 shadow-sm relative">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-slate-400" />
                    Product Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter product name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:ring-2 focus:outline-none transition-all ${
                      errors.name ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500 bg-red-50/30' : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500'
                    }`}
                  />
                  {errors.name && (
                    <p className="text-xs font-medium text-red-500 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3" /> {errors.name}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-slate-400" />
                    SKU *
                  </label>
                  <input
                    type="text"
                    name="sku"
                    placeholder="e.g. ITEM-001"
                    value={formData.sku}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:ring-2 focus:outline-none transition-all ${
                      errors.sku ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500 bg-red-50/30' : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500'
                    }`}
                  />
                  {errors.sku && (
                    <p className="text-xs font-medium text-red-500 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3" /> {errors.sku}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-slate-400" />
                  Category *
                </label>
                
                <div className="relative">
                  <input
                    type="text"
                    name="category"
                    placeholder="Select or type a category..."
                    value={formData.category}
                    onChange={handleChange}
                    onFocus={() => setShowCategoryDropdown(true)}
                    onBlur={() => setTimeout(() => setShowCategoryDropdown(false), 200)}
                    autoComplete="off"
                    className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:ring-2 focus:outline-none transition-all pr-10 ${
                      errors.category ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500 bg-red-50/30' : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500'
                    }`}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </div>

                  {showCategoryDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto custom-scrollbar overflow-hidden">
                      {defaultCategories.filter(cat => cat.toLowerCase().includes(formData.category.toLowerCase())).length > 0 ? (
                        defaultCategories
                          .filter(cat => cat.toLowerCase().includes(formData.category.toLowerCase()))
                          .map(cat => (
                            <div 
                              key={cat} 
                              onMouseDown={() => {
                                setFormData(prev => ({...prev, category: cat}));
                                setShowCategoryDropdown(false);
                              }}
                              className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer text-sm text-slate-700 font-medium border-b border-slate-50 last:border-0 transition-colors"
                            >
                              {cat}
                            </div>
                          ))
                      ) : (
                        <div className="px-4 py-3 text-sm text-slate-500 italic bg-slate-50">
                          "{formData.category}" will be added as a new category.
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {errors.category && (
                  <p className="text-xs font-medium text-red-500 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3" /> {errors.category}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-5 flex flex-col">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-slate-400" />
                    Cost Price *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-slate-500 font-medium sm:text-sm">₹</span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      name="costPrice"
                      placeholder="0.00"
                      value={formData.costPrice}
                      onChange={handleChange}
                      className={`w-full pl-8 pr-4 py-3 bg-slate-50 border rounded-xl focus:ring-2 focus:outline-none transition-all ${
                        errors.costPrice ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500 bg-red-50/30' : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500'
                      }`}
                    />
                  </div>
                  {errors.costPrice && (
                    <p className="text-xs font-medium text-red-500 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3" /> {errors.costPrice}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-slate-400" />
                    Selling Price *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-slate-500 font-medium sm:text-sm">₹</span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      name="price"
                      placeholder="0.00"
                      value={formData.price}
                      onChange={handleChange}
                      className={`w-full pl-8 pr-4 py-3 bg-slate-50 border rounded-xl focus:ring-2 focus:outline-none transition-all ${
                        errors.price ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500 bg-red-50/30' : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500'
                      }`}
                    />
                  </div>
                  {errors.price && (
                    <p className="text-xs font-medium text-red-500 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3" /> {errors.price}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-slate-400" />
                  Initial Stock *
                </label>
                <input
                  type="number"
                  name="stock"
                  placeholder="0"
                  value={formData.stock}
                  onChange={(e) => {
                    handleChange(e);
                    // Auto update status based on stock
                    const stockVal = parseInt(e.target.value, 10);
                    if (!isNaN(stockVal)) {
                      let newStatus = 'In Stock';
                      if (stockVal === 0) newStatus = 'Out of Stock';
                      else if (stockVal < 10) newStatus = 'Low Stock';
                      setFormData(prev => ({...prev, stock: e.target.value, status: newStatus}));
                    }
                  }}
                  className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:ring-2 focus:outline-none transition-all ${
                    errors.stock ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500 bg-red-50/30' : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500'
                  }`}
                />
                {errors.stock && (
                  <p className="text-xs font-medium text-red-500 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3" /> {errors.stock}
                  </p>
                )}
              </div>

              <div className="mt-auto pt-6">
                <div className="flex justify-end items-center gap-3">
                  {showSuccess && (
                    <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5 mr-auto sm:mr-0 animate-in fade-in slide-in-from-right-4 duration-300">
                      <CheckCircle2 className="w-4 h-4" /> Added Successfully!
                    </span>
                  )}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-500/20 transition-all font-semibold shadow-lg shadow-indigo-200 hover:shadow-indigo-300 disabled:opacity-70"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Package className="w-4 h-4" />
                        Add Product
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
