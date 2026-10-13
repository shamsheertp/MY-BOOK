import { useState } from 'react';
import { Package, Tag, Layers, CheckCircle2, AlertCircle, Weight, IndianRupee, ArrowUpRight } from 'lucide-react';
import { productsService } from '../../../services/api';

export default function CreateProduct({ onSave, existingCategories = [] }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [apiError, setApiError] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  
  const generateSKU = () => `PRD-${Math.floor(100 + Math.random() * 900)}`;

  const [formData, setFormData] = useState({
    name: '',
    sku: generateSKU(),
    category: '',
    costPricePerKg: '',
    sellingPricePerKg: '',
    stockKg: '',
    minStockKg: '10',
    description: '',
  });
  
  const [errors, setErrors] = useState({});

  const defaultCategories = [
    'Stainless Steel',
    'Aluminium',
    'Copper',
    'Brass',
    'Mild Steel',
    'Galvanized Iron',
    'Special Alloys',
    'General',
    ...existingCategories
  ];

  const uniqueCategories = Array.from(new Set(defaultCategories)).filter(Boolean);

  const costVal = parseFloat(formData.costPricePerKg) || 0;
  const sellVal = parseFloat(formData.sellingPricePerKg) || 0;
  const marginPerKg = sellVal - costVal;
  const marginPercent = costVal > 0 ? Math.round((marginPerKg / costVal) * 100) : 0;

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (!formData.sku.trim()) newErrors.sku = 'SKU is required';
    if (!formData.category.trim()) newErrors.category = 'Category is required';
    
    if (formData.costPricePerKg === '' || isNaN(formData.costPricePerKg) || Number(formData.costPricePerKg) < 0) {
      newErrors.costPricePerKg = 'Cost price per kg is required (≥ 0)';
    }

    if (formData.sellingPricePerKg === '' || isNaN(formData.sellingPricePerKg) || Number(formData.sellingPricePerKg) < 0) {
      newErrors.sellingPricePerKg = 'Selling price per kg is required (≥ 0)';
    }

    if (formData.stockKg === '' || isNaN(formData.stockKg) || Number(formData.stockKg) < 0) {
      newErrors.stockKg = 'Initial stock in kg is required (≥ 0)';
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
    if (apiError) setApiError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setApiError('');

    try {
      const payload = {
        name: formData.name.trim(),
        sku: formData.sku.trim(),
        category: formData.category.trim(),
        costPricePerKg: parseFloat(formData.costPricePerKg),
        sellingPricePerKg: parseFloat(formData.sellingPricePerKg),
        stockKg: parseFloat(formData.stockKg),
        minStockKg: parseFloat(formData.minStockKg) || 10,
        unit: 'kg',
        description: formData.description.trim() || null,
      };

      const response = await productsService.create(payload);
      const created = response.data || response;

      setShowSuccess(true);
      setFormData({
        name: '',
        sku: generateSKU(),
        category: '',
        costPricePerKg: '',
        sellingPricePerKg: '',
        stockKg: '',
        minStockKg: '10',
        description: '',
      });

      if (onSave) {
        onSave(created);
      }

      setTimeout(() => setShowSuccess(false), 3500);
    } catch (err) {
      setApiError(err.message || 'Failed to create product in database');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full fade-in">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="glass-card p-6 rounded-3xl border border-slate-100 shadow-sm relative bg-white">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-600" />
                Add New Product / Material
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Track inventory measured in kilograms (kg) with cost and selling price per kg.
              </p>
            </div>
            {costVal > 0 && sellVal > 0 && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700">
                <span>Profit Margin:</span>
                <span className={`flex items-center gap-0.5 font-bold ${marginPerKg >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {marginPerKg >= 0 ? '+' : ''}₹{marginPerKg.toFixed(2)}/kg ({marginPercent}%)
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>
            )}
          </div>

          {apiError && (
            <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{apiError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Name, SKU, Category, Description */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-slate-400" />
                    Product Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    placeholder="e.g. Stainless Steel 304 Sheet"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-3.5 py-2.5 bg-slate-50/70 border rounded-xl text-sm focus:ring-2 focus:outline-none transition-all ${
                      errors.name ? 'border-red-300 focus:ring-red-500/20 bg-red-50/20' : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500'
                    }`}
                  />
                  {errors.name && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.name}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-slate-400" />
                      SKU / Code *
                    </label>
                    <button
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, sku: generateSKU() }))}
                      className="text-[11px] text-indigo-600 hover:text-indigo-700 font-semibold"
                    >
                      Regenerate
                    </button>
                  </div>
                  <input
                    type="text"
                    name="sku"
                    placeholder="e.g. PRD-001"
                    value={formData.sku}
                    onChange={handleChange}
                    className={`w-full px-3.5 py-2.5 bg-slate-50/70 border rounded-xl text-sm font-mono focus:ring-2 focus:outline-none transition-all ${
                      errors.sku ? 'border-red-300 focus:ring-red-500/20 bg-red-50/20' : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500'
                    }`}
                  />
                  {errors.sku && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.sku}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  Category *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="category"
                    placeholder="Select or enter category (e.g. Stainless Steel)..."
                    value={formData.category}
                    onChange={handleChange}
                    onFocus={() => setShowCategoryDropdown(true)}
                    onBlur={() => setTimeout(() => setShowCategoryDropdown(false), 250)}
                    autoComplete="off"
                    className={`w-full px-3.5 py-2.5 bg-slate-50/70 border rounded-xl text-sm focus:ring-2 focus:outline-none transition-all pr-10 ${
                      errors.category ? 'border-red-300 focus:ring-red-500/20 bg-red-50/20' : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500'
                    }`}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </div>

                  {showCategoryDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-56 overflow-y-auto">
                      {uniqueCategories.filter(c => c.toLowerCase().includes(formData.category.toLowerCase())).length > 0 ? (
                        uniqueCategories
                          .filter(c => c.toLowerCase().includes(formData.category.toLowerCase()))
                          .map(c => (
                            <div 
                              key={c} 
                              onMouseDown={() => {
                                setFormData(prev => ({ ...prev, category: c }));
                                setShowCategoryDropdown(false);
                              }}
                              className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm text-slate-700 font-medium border-b border-slate-50 last:border-0"
                            >
                              {c}
                            </div>
                          ))
                      ) : (
                        <div className="px-4 py-2.5 text-xs text-slate-500 italic bg-slate-50">
                          "{formData.category}" will be created as a new category.
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {errors.category && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.category}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Description / Specifications (Optional)
                </label>
                <input
                  type="text"
                  name="description"
                  placeholder="e.g. Grade 304, 2B cold rolled, thickness 1.5mm"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>
            </div>

            {/* Right Column: Cost Price/kg, Selling Price/kg, Stock (kg), Min Stock Alert (kg) */}
            <div className="space-y-4 flex flex-col justify-between">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <IndianRupee className="w-3.5 h-3.5 text-slate-400" />
                    Cost Price (₹ / kg) *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-slate-500 font-medium text-xs">₹</span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      name="costPricePerKg"
                      placeholder="0.00"
                      value={formData.costPricePerKg}
                      onChange={handleChange}
                      className={`w-full pl-7 pr-12 py-2.5 bg-slate-50/70 border rounded-xl text-sm font-semibold focus:ring-2 focus:outline-none transition-all ${
                        errors.costPricePerKg ? 'border-red-300 focus:ring-red-500/20 bg-red-50/20' : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500'
                      }`}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-slate-400 text-xs font-medium">/ kg</span>
                    </div>
                  </div>
                  {errors.costPricePerKg && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.costPricePerKg}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <IndianRupee className="w-3.5 h-3.5 text-indigo-500" />
                    Selling Price (₹ / kg) *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-indigo-600 font-medium text-xs">₹</span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      name="sellingPricePerKg"
                      placeholder="0.00"
                      value={formData.sellingPricePerKg}
                      onChange={handleChange}
                      className={`w-full pl-7 pr-12 py-2.5 bg-slate-50/70 border rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:outline-none transition-all ${
                        errors.sellingPricePerKg ? 'border-red-300 focus:ring-red-500/20 bg-red-50/20' : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500'
                      }`}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-slate-400 text-xs font-medium">/ kg</span>
                    </div>
                  </div>
                  {errors.sellingPricePerKg && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.sellingPricePerKg}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <Weight className="w-3.5 h-3.5 text-slate-400" />
                    Initial Stock (Total kg) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      name="stockKg"
                      placeholder="0.00"
                      value={formData.stockKg}
                      onChange={handleChange}
                      className={`w-full px-3.5 pr-10 py-2.5 bg-slate-50/70 border rounded-xl text-sm font-semibold focus:ring-2 focus:outline-none transition-all ${
                        errors.stockKg ? 'border-red-300 focus:ring-red-500/20 bg-red-50/20' : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500'
                      }`}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-slate-400 text-xs font-medium">kg</span>
                    </div>
                  </div>
                  {errors.stockKg && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.stockKg}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                    Low Stock Alert (kg)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      name="minStockKg"
                      placeholder="10.00"
                      value={formData.minStockKg}
                      onChange={handleChange}
                      className="w-full px-3.5 pr-10 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-slate-400 text-xs font-medium">kg</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="pt-3 mt-auto flex items-center justify-between">
                <div>
                  {showSuccess && (
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl flex items-center gap-1.5 animate-in fade-in">
                      <CheckCircle2 className="w-4 h-4" /> Product added successfully to database!
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 text-white text-sm rounded-xl hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-500/20 transition-all font-semibold shadow-md shadow-indigo-100 hover:shadow-indigo-200 disabled:opacity-70 cursor-pointer"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Package className="w-4 h-4" />
                      Add Product to DB
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
