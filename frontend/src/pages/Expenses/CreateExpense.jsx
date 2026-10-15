import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, AlertCircle, Receipt, DollarSign, Calendar, Tag, CreditCard, AlignLeft, UploadCloud, X, CheckCircle2, Plus, Loader2, Settings } from 'lucide-react';
import { expensesService, paymentMethodsService, uploadService } from '../../services/api';

export default function CreateExpense({ isModal = false, isInline = false, onClose, onSave }) {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  
  const [categoriesList, setCategoriesList] = useState([]);
  const [paymentMethodsList, setPaymentMethodsList] = useState([]);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatLoading, setNewCatLoading] = useState(false);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: '',
    categoryId: null,
    amount: '',
    description: '',
    paymentMethod: 'Cash',
    paymentMethodId: null,
    status: 'Paid',
  });
  const [proofFile, setProofFile] = useState(null);
  const [errors, setErrors] = useState({});

  const statuses = ['Paid', 'Pending'];

  // Fetch categories and payment methods from DB
  useEffect(() => {
    expensesService.getCategories()
      .then((res) => {
        if (res?.success && Array.isArray(res.data)) {
          setCategoriesList(res.data);
        }
      })
      .catch((err) => console.warn('Failed to fetch categories:', err));

    paymentMethodsService.getAll()
      .then((res) => {
        if (res?.success && Array.isArray(res.data)) {
          setPaymentMethodsList(res.data);
          const defaultPm = res.data.find(p => p.isDefault) || res.data[0];
          if (defaultPm) {
            setFormData(prev => ({
              ...prev,
              paymentMethod: defaultPm.name,
              paymentMethodId: defaultPm.id,
            }));
          }
        }
      })
      .catch((err) => console.warn('Failed to fetch payment methods:', err));
  }, []);

  const handleQuickAddCategory = async () => {
    if (!newCatName.trim()) return;
    setNewCatLoading(true);
    try {
      const res = await expensesService.createCategory({
        name: newCatName.trim(),
      });
      if (res?.success && res.data) {
        setCategoriesList(prev => [...prev, res.data]);
        setFormData(prev => ({
          ...prev,
          category: res.data.name,
          categoryId: res.data.id,
        }));
        setNewCatName('');
        setIsAddingCategory(false);
        setShowCategoryDropdown(false);
      }
    } catch (err) {
      console.error('Failed to create category:', err);
      setErrors(prev => ({ ...prev, category: err.response?.data?.message || 'Failed to add category' }));
    } finally {
      setNewCatLoading(false);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.date) newErrors.date = 'Date is required';
    if (!formData.category) newErrors.category = 'Category is required';
    
    if (!formData.amount) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(formData.amount) || Number(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be a positive number';
    }

    if (formData.description.trim() && formData.description.length < 3) {
      newErrors.description = 'Description must be at least 3 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validate()) {
      setIsSubmitting(true);
      setErrors({});
      
      try {
        let receiptImageUrl = null;
        if (proofFile) {
          try {
            const uploadRes = await uploadService.uploadFile(proofFile, 'expenses');
            receiptImageUrl = uploadRes?.data?.url || null;
          } catch (uploadErr) {
            console.warn('File upload failed, proceeding with expense creation:', uploadErr);
          }
        }

        const payload = {
          date: formData.date,
          category: formData.category,
          categoryId: formData.categoryId || null,
          amount: parseFloat(formData.amount),
          description: formData.description || null,
          paymentMethod: formData.paymentMethod || 'Cash',
          paymentMethodId: formData.paymentMethodId || null,
          status: formData.status || 'Paid',
          receiptImage: receiptImageUrl,
        };

        const res = await expensesService.create(payload);
        const newExpense = res?.data || {
          id: `EXP-${Date.now()}`,
          ...formData,
          amount: parseFloat(formData.amount),
        };

        if (onSave) {
          onSave(newExpense);
        }
        setShowSuccess(true);
        // Reset form
        setFormData({
          date: new Date().toISOString().split('T')[0],
          category: '',
          categoryId: null,
          amount: '',
          description: '',
          paymentMethod: paymentMethodsList[0]?.name || 'Cash',
          paymentMethodId: paymentMethodsList[0]?.id || null,
          status: 'Paid',
        });
        setProofFile(null);
        setTimeout(() => setShowSuccess(false), 3000);

        if (isModal && onClose) {
          onClose();
        } else if (!isInline) {
          navigate('/expenses');
        }
      } catch (err) {
        console.error('Failed to create expense:', err);
        const apiErrors = err.response?.data?.errors;
        if (Array.isArray(apiErrors)) {
          const mapped = {};
          apiErrors.forEach(errItem => {
            mapped[errItem.field] = errItem.message;
          });
          setErrors(mapped);
        } else {
          setErrors({ general: err.response?.data?.message || err.message || 'Failed to record expense' });
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setProofFile(e.target.files[0]);
    }
  };

  return (
    <div className={`${isInline ? 'w-full' : 'max-w-4xl mx-auto'} fade-in ${isModal || isInline ? '' : 'pb-12'}`}>
      {!isModal && !isInline && (
        <div className="mb-6">
          <button
            onClick={() => navigate('/expenses')}
            className="flex items-center text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Expenses
          </button>
        </div>
      )}

      {!isInline && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Record Expense</h1>
            <p className="text-sm text-slate-500 mt-1 font-medium">Add a new expense transaction with validation</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className={isInline ? 'space-y-4' : 'space-y-6'}>
        {errors.general && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errors.general}</span>
          </div>
        )}
        <div className={`glass-card ${isInline ? 'p-5 rounded-2xl' : 'p-8 rounded-3xl'} border border-slate-100 shadow-sm relative`}>
          {!isInline && (
            <>
              <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                <Receipt className="w-32 h-32" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                Expense Details
              </h2>
            </>
          )}

          <div className={`grid grid-cols-1 md:grid-cols-2 ${isInline ? 'gap-6' : 'gap-8'} relative z-10`}>
            {/* --- Left Column --- */}
            <div className="space-y-5">
            {/* Date */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                Date *
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:ring-2 focus:outline-none transition-all ${
                  errors.date ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500 bg-red-50/30' : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500'
                }`}
              />
              {errors.date && (
                <p className="text-xs font-medium text-red-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3" /> {errors.date}
                </p>
              )}
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-slate-400" />
                Amount *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-slate-400 font-medium">₹</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  name="amount"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={handleChange}
                  className={`w-full pl-8 pr-4 py-3 bg-slate-50 border rounded-xl focus:ring-2 focus:outline-none transition-all ${
                    errors.amount ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500 bg-red-50/30' : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500'
                  }`}
                />
              </div>
              {errors.amount && (
                <p className="text-xs font-medium text-red-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3" /> {errors.amount}
                </p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-slate-400" />
                  Category *
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(prev => !prev)}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {isAddingCategory ? 'Cancel' : 'New Category'}
                </button>
              </div>

              {/* Inline Quick Add Category Form */}
              {isAddingCategory && (
                <div className="p-2.5 bg-indigo-50/70 border border-indigo-200/80 rounded-xl flex items-center gap-2 animate-in fade-in duration-150">
                  <input
                    type="text"
                    placeholder="Type new category name..."
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleQuickAddCategory();
                      }
                    }}
                    className="flex-1 px-3 py-1.5 text-xs bg-white border border-indigo-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleQuickAddCategory}
                    disabled={newCatLoading || !newCatName.trim()}
                    className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 inline-flex items-center gap-1 shrink-0 transition-colors"
                  >
                    {newCatLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                    Save to DB
                  </button>
                </div>
              )}
              
              <div className="relative">
                <input
                  type="text"
                  name="category"
                  placeholder="Select or type a category..."
                  value={formData.category}
                  onChange={(e) => {
                    const typed = e.target.value;
                    const matched = categoriesList.find(c => c.name.toLowerCase() === typed.toLowerCase());
                    setFormData(prev => ({
                      ...prev,
                      category: typed,
                      categoryId: matched ? matched.id : null,
                    }));
                  }}
                  onFocus={() => setShowCategoryDropdown(true)}
                  onBlur={() => setTimeout(() => setShowCategoryDropdown(false), 250)}
                  autoComplete="off"
                  className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:ring-2 focus:outline-none transition-all pr-10 ${
                    errors.category ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500 bg-red-50/30' : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500'
                  }`}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>

                {showCategoryDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto custom-scrollbar overflow-hidden divide-y divide-slate-100">
                    {categoriesList.filter(cat => cat.name.toLowerCase().includes(formData.category.toLowerCase())).length > 0 ? (
                      categoriesList
                        .filter(cat => cat.name.toLowerCase().includes(formData.category.toLowerCase()))
                        .map(cat => (
                          <div 
                            key={cat.id || cat.name} 
                            onMouseDown={() => {
                              setFormData(prev => ({
                                ...prev,
                                category: cat.name,
                                categoryId: cat.id,
                              }));
                              setShowCategoryDropdown(false);
                            }}
                            className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer text-sm text-slate-700 font-medium flex items-center justify-between transition-colors"
                          >
                            <div className="flex items-center gap-2.5">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: cat.color || '#6366f1' }}
                              />
                              <span>{cat.name}</span>
                            </div>
                            {cat.isDefault && (
                              <span className="text-[10px] text-slate-400 uppercase font-semibold">Standard</span>
                            )}
                          </div>
                        ))
                    ) : (
                      <div className="p-3 text-xs text-slate-500 bg-slate-50 flex items-center justify-between">
                        <span>"{formData.category}" will be saved as new.</span>
                        <button
                          type="button"
                          onMouseDown={() => {
                            setNewCatName(formData.category);
                            handleQuickAddCategory();
                          }}
                          className="text-indigo-600 font-semibold hover:underline"
                        >
                          Save now
                        </button>
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

            {/* Payment Method */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-slate-400" />
                  Payment Method *
                </label>
                <Link
                  to="/settings/finance"
                  target="_blank"
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 transition-colors"
                  title="Configure payment methods in Settings"
                >
                  <Settings className="w-3 h-3" />
                  Manage
                </Link>
              </div>
              <select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={(e) => {
                  const val = e.target.value;
                  const matched = paymentMethodsList.find(pm => pm.name === val);
                  setFormData(prev => ({
                    ...prev,
                    paymentMethod: val,
                    paymentMethodId: matched ? matched.id : null,
                  }));
                }}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-all appearance-none cursor-pointer"
              >
                {paymentMethodsList.length === 0 ? (
                  <option value="Cash">Cash</option>
                ) : (
                  paymentMethodsList.map(method => (
                    <option key={method.id} value={method.name}>
                      {method.name} {method.code ? `(${method.code})` : ''}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Status */}
            <div className={`space-y-2 ${isInline ? 'md:col-span-2' : 'lg:col-span-1'}`}>
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                Status *
              </label>
              <div className="flex gap-4 mt-1">
                {statuses.map((status) => (
                  <label key={status} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value={status}
                      checked={formData.status === status}
                      onChange={handleChange}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
                    />
                    <span className="text-sm font-medium text-slate-700">{status}</span>
                  </label>
                ))}
              </div>
            </div>
            </div>

            {/* --- Right Column --- */}
            <div className="space-y-5 flex flex-col">
            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                <AlignLeft className="w-4 h-4 text-slate-400" />
                Description
              </label>
              <textarea
                name="description"
                rows="3"
                placeholder="What was this expense for?"
                value={formData.description}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:ring-2 focus:outline-none transition-all resize-none ${
                  errors.description ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500 bg-red-50/30' : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500'
                }`}
              ></textarea>
              {errors.description && (
                <p className="text-xs font-medium text-red-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3" /> {errors.description}
                </p>
              )}
            </div>

            {/* Proof of Expense (Receipt) */}
            <div className="space-y-2 flex-1 flex flex-col">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                <UploadCloud className="w-4 h-4 text-slate-400" />
                Proof of Expense (Receipt/Invoice)
              </label>
              <div className="mt-2 flex-1 flex flex-col justify-center px-6 py-6 border-2 border-slate-200 border-dashed rounded-xl hover:border-indigo-400 transition-colors bg-slate-50 relative group min-h-[140px]">
                <div className="space-y-1 text-center">
                  {proofFile ? (
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div className="text-sm font-medium text-slate-700">{proofFile.name}</div>
                      <div className="text-xs text-slate-500 mt-1">{(proofFile.size / 1024 / 1024).toFixed(2)} MB</div>
                      <button 
                        type="button" 
                        onClick={(e) => { e.preventDefault(); setProofFile(null); }}
                        className="mt-3 text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1"
                      >
                        <X className="w-3 h-3" /> Remove File
                      </button>
                    </div>
                  ) : (
                    <>
                      <UploadCloud className="mx-auto h-10 w-10 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                      <div className="flex text-sm text-slate-600 justify-center mt-3">
                        <label className="relative cursor-pointer rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none">
                          <span>Upload a file</span>
                          <input type="file" className="sr-only" onChange={handleFileChange} accept="image/*,.pdf" />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">PNG, JPG, PDF up to 10MB</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

        <div className={`flex justify-end items-center gap-3 ${isInline ? 'mt-2' : ''}`}>
          {showSuccess && (
            <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5 mr-auto sm:mr-0 animate-in fade-in slide-in-from-right-4 duration-300">
              <CheckCircle2 className="w-4 h-4" /> Saved Successfully!
            </span>
          )}
          {(!isInline || isModal) && (
            <button
              type="button"
              onClick={() => {
                if (isModal && onClose) onClose();
                else navigate('/expenses');
              }}
              className="px-6 py-3 bg-white text-slate-700 rounded-xl border border-slate-200 hover:bg-slate-50 font-semibold transition-all"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`flex justify-center items-center gap-2 ${isInline ? 'px-8 py-2.5 text-sm' : 'px-6 py-3'} bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200 font-semibold transition-all ${
              isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:-translate-y-0.5 hover:shadow-indigo-300 hover:bg-indigo-700'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Expense
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
