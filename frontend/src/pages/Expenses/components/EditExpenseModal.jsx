import { useState, useEffect } from 'react';
import { X, Calendar, Tag, CreditCard, DollarSign, AlignLeft, User, Hash, AlertCircle, Save, Plus, Loader2 } from 'lucide-react';
import { expensesService, paymentMethodsService } from '../../../services/api';

export function EditExpenseModal({ isOpen, onClose, expense, onSave }) {
  if (!isOpen || !expense) return null;

  const [categoriesList, setCategoriesList] = useState([]);
  const [paymentMethodsList, setPaymentMethodsList] = useState([]);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatLoading, setNewCatLoading] = useState(false);

  const [formData, setFormData] = useState({
    date: expense.date ? (expense.date.includes('T') ? expense.date.split('T')[0] : expense.date) : new Date().toISOString().split('T')[0],
    category: expense.category || 'Office Supplies',
    categoryId: expense.categoryId || null,
    amount: expense.amount !== undefined ? expense.amount : '',
    paymentMethod: expense.paymentMethod || 'Credit Card',
    paymentMethodId: expense.paymentMethodId || null,
    status: expense.status === 'Paid' ? 'Paid' : 'Pending',
    payee: expense.payee || '',
    referenceNo: expense.referenceNo || '',
    description: expense.description || '',
    notes: expense.notes || '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    expensesService.getCategories()
      .then((res) => {
        if (res?.success && Array.isArray(res.data)) {
          setCategoriesList(res.data);
        }
      })
      .catch((err) => console.warn('Failed to load categories in EditExpenseModal:', err));

    paymentMethodsService.getAll()
      .then((res) => {
        if (res?.success && Array.isArray(res.data)) {
          setPaymentMethodsList(res.data);
        }
      })
      .catch((err) => console.warn('Failed to load payment methods in EditExpenseModal:', err));
  }, []);

  const handleQuickAddCategory = async () => {
    if (!newCatName.trim()) return;
    setNewCatLoading(true);
    try {
      const res = await expensesService.createCategory({ name: newCatName.trim() });
      if (res?.success && res.data) {
        setCategoriesList(prev => [...prev, res.data]);
        setFormData(prev => ({
          ...prev,
          category: res.data.name,
          categoryId: res.data.id,
        }));
        setNewCatName('');
        setIsAddingCategory(false);
      }
    } catch (err) {
      console.error('Quick add category error:', err);
    } finally {
      setNewCatLoading(false);
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.date) errs.date = 'Date is required';
    if (!formData.category) errs.category = 'Category is required';
    if (!formData.amount || isNaN(formData.amount) || Number(formData.amount) <= 0) {
      errs.amount = 'Amount must be greater than 0';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setErrors({});
    try {
      const payload = {
        date: formData.date,
        category: formData.category,
        categoryId: formData.categoryId || null,
        amount: Number(formData.amount),
        paymentMethod: formData.paymentMethod,
        paymentMethodId: formData.paymentMethodId || null,
        status: formData.status,
        payee: formData.payee.trim() || null,
        referenceNo: formData.referenceNo.trim() || null,
        description: formData.description.trim() || null,
        notes: formData.notes.trim() || null,
      };

      await onSave(payload);
      onClose();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to update expense';
      setErrors({ general: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-xl font-black text-slate-800">Edit Expense</h2>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{expense.ref || expense.id}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {errors.general && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errors.general}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Date */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Date *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              {errors.date && <p className="text-rose-500 text-[10px] font-bold">{errors.date}</p>}
            </div>

            {/* Category */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-slate-400" /> Category *
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(prev => !prev)}
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  {isAddingCategory ? 'Cancel' : 'New'}
                </button>
              </div>

              {isAddingCategory && (
                <div className="p-2 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="New category..."
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="flex-1 px-2.5 py-1 text-xs bg-white border border-indigo-200 rounded-lg outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleQuickAddCategory}
                    disabled={newCatLoading || !newCatName.trim()}
                    className="px-2.5 py-1 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 inline-flex items-center gap-1"
                  >
                    {newCatLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                    Add
                  </button>
                </div>
              )}

              <select
                value={formData.category}
                onChange={(e) => {
                  const val = e.target.value;
                  const matched = categoriesList.find(c => c.name === val);
                  setFormData(prev => ({
                    ...prev,
                    category: val,
                    categoryId: matched ? matched.id : null,
                  }));
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
              >
                {/* Ensure existing category is present even if list is loading */}
                {formData.category && !categoriesList.some(c => c.name === formData.category) && (
                  <option value={formData.category}>{formData.category}</option>
                )}
                {categoriesList.map(cat => (
                  <option key={cat.id || cat.name} value={cat.name}>{cat.name}</option>
                ))}
              </select>
              {errors.category && <p className="text-rose-500 text-[10px] font-bold">{errors.category}</p>}
            </div>

            {/* Amount */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                <span className="font-bold text-slate-400 text-xs">₹</span> Amount *
              </label>
              <input
                type="number"
                step="any"
                min="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              {errors.amount && <p className="text-rose-500 text-[10px] font-bold">{errors.amount}</p>}
            </div>

            {/* Payment Method */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" /> Payment Method
              </label>
              <select
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
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
              >
                {formData.paymentMethod && !paymentMethodsList.some(pm => pm.name === formData.paymentMethod) && (
                  <option value={formData.paymentMethod}>{formData.paymentMethod}</option>
                )}
                {paymentMethodsList.map(m => (
                  <option key={m.id || m.name} value={m.name}>
                    {m.name} {m.code ? `(${m.code})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
              >
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
              </select>
            </div>

            {/* Payee / Vendor */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" /> Payee / Vendor
              </label>
              <input
                type="text"
                placeholder="e.g. Office Depot"
                value={formData.payee}
                onChange={(e) => setFormData(prev => ({ ...prev, payee: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Reference No */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-slate-400" /> Reference / Transaction No.
            </label>
            <input
              type="text"
              placeholder="e.g. TXN-12345 or Check #"
              value={formData.referenceNo}
              onChange={(e) => setFormData(prev => ({ ...prev, referenceNo: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
              <AlignLeft className="w-3.5 h-3.5 text-slate-400" /> Description
            </label>
            <textarea
              rows={2}
              placeholder="Describe the expense details..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md shadow-indigo-100 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditExpenseModal;
