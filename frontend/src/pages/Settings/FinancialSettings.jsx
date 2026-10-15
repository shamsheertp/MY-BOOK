import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Wallet,
  Tag,
  Plus,
  Search,
  Edit2,
  Trash2,
  Check,
  AlertCircle,
  X,
  Loader2,
  CheckCircle2,
  RefreshCw,
  Building,
  CreditCard,
  Banknote,
  Smartphone,
  FileCheck,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { expensesService, paymentMethodsService } from '../../services/api';

const COLOR_PALETTES = [
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Slate', value: '#64748b' },
];

const METHOD_TYPES = [
  { value: 'BANK', label: 'Bank Transfer / Wire', icon: Building },
  { value: 'CASH', label: 'Cash', icon: Banknote },
  { value: 'CARD', label: 'Credit / Debit Card', icon: CreditCard },
  { value: 'UPI', label: 'UPI / QR Payment', icon: Smartphone },
  { value: 'CHEQUE', label: 'Cheque', icon: FileCheck },
  { value: 'OTHER', label: 'Other Method', icon: Wallet },
];

export default function FinancialSettings() {
  const [activeTab, setActiveTab] = useState('categories'); // 'categories' | 'payments'
  
  // Data states
  const [categories, setCategories] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Alerts
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message: '' }
  
  // Category Modal State
  const [categoryModal, setCategoryModal] = useState({
    isOpen: false,
    mode: 'create', // 'create' | 'edit'
    id: null,
    name: '',
    description: '',
    color: '#6366f1',
    loading: false,
  });

  // Payment Method Modal State
  const [paymentModal, setPaymentModal] = useState({
    isOpen: false,
    mode: 'create', // 'create' | 'edit'
    id: null,
    name: '',
    code: '',
    type: 'BANK',
    description: '',
    isDefault: false,
    isActive: true,
    loading: false,
  });

  // Delete Confirm State
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    targetType: 'category', // 'category' | 'payment'
    item: null,
    loading: false,
  });

  const showToast = useCallback((type, message) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  }, []);

  // Fetch all categories and payment methods
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [catRes, payRes] = await Promise.all([
        expensesService.getCategories(),
        paymentMethodsService.getAll(),
      ]);

      if (catRes?.success && Array.isArray(catRes.data)) {
        setCategories(catRes.data);
      }
      if (payRes?.success && Array.isArray(payRes.data)) {
        setPaymentMethods(payRes.data);
      }
    } catch (err) {
      console.error('Failed to load financial settings:', err);
      showToast('error', 'Failed to load settings data. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered Categories
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase();
    return categories.filter(c => 
      c.name.toLowerCase().includes(q) || 
      (c.description && c.description.toLowerCase().includes(q))
    );
  }, [categories, searchQuery]);

  // Filtered Payment Methods
  const filteredPaymentMethods = useMemo(() => {
    if (!searchQuery.trim()) return paymentMethods;
    const q = searchQuery.toLowerCase();
    return paymentMethods.filter(p => 
      p.name.toLowerCase().includes(q) || 
      (p.code && p.code.toLowerCase().includes(q)) ||
      (p.type && p.type.toLowerCase().includes(q)) ||
      (p.description && p.description.toLowerCase().includes(q))
    );
  }, [paymentMethods, searchQuery]);

  // ---------------- CATEGORY ACTIONS ----------------
  const handleOpenAddCategory = () => {
    setCategoryModal({
      isOpen: true,
      mode: 'create',
      id: null,
      name: '',
      description: '',
      color: '#6366f1',
      loading: false,
    });
  };

  const handleOpenEditCategory = (cat) => {
    setCategoryModal({
      isOpen: true,
      mode: 'edit',
      id: cat.id,
      name: cat.name,
      description: cat.description || '',
      color: cat.color || '#6366f1',
      loading: false,
    });
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryModal.name.trim()) {
      showToast('error', 'Category name is required.');
      return;
    }

    setCategoryModal(prev => ({ ...prev, loading: true }));
    try {
      if (categoryModal.mode === 'create') {
        const res = await expensesService.createCategory({
          name: categoryModal.name.trim(),
          description: categoryModal.description.trim() || null,
          color: categoryModal.color,
        });
        if (res?.success) {
          showToast('success', `Category "${categoryModal.name.trim()}" added to database!`);
          setCategoryModal(prev => ({ ...prev, isOpen: false }));
          loadData();
        }
      } else {
        const res = await expensesService.updateCategory(categoryModal.id, {
          name: categoryModal.name.trim(),
          description: categoryModal.description.trim() || null,
          color: categoryModal.color,
        });
        if (res?.success) {
          showToast('success', `Category "${categoryModal.name.trim()}" updated successfully!`);
          setCategoryModal(prev => ({ ...prev, isOpen: false }));
          loadData();
        }
      }
    } catch (err) {
      console.error('Category save error:', err);
      showToast('error', err.response?.data?.message || 'Failed to save category.');
    } finally {
      setCategoryModal(prev => ({ ...prev, loading: false }));
    }
  };

  // ---------------- PAYMENT METHOD ACTIONS ----------------
  const handleOpenAddPayment = () => {
    setPaymentModal({
      isOpen: true,
      mode: 'create',
      id: null,
      name: '',
      code: '',
      type: 'BANK',
      description: '',
      isDefault: false,
      isActive: true,
      loading: false,
    });
  };

  const handleOpenEditPayment = (pm) => {
    setPaymentModal({
      isOpen: true,
      mode: 'edit',
      id: pm.id,
      name: pm.name,
      code: pm.code || '',
      type: pm.type || 'BANK',
      description: pm.description || '',
      isDefault: Boolean(pm.isDefault),
      isActive: Boolean(pm.isActive),
      loading: false,
    });
  };

  const handleSavePaymentMethod = async (e) => {
    e.preventDefault();
    if (!paymentModal.name.trim()) {
      showToast('error', 'Payment method name is required.');
      return;
    }

    setPaymentModal(prev => ({ ...prev, loading: true }));
    try {
      const payload = {
        name: paymentModal.name.trim(),
        code: paymentModal.code.trim().toUpperCase() || null,
        type: paymentModal.type,
        description: paymentModal.description.trim() || null,
        isDefault: Boolean(paymentModal.isDefault),
        isActive: Boolean(paymentModal.isActive),
      };

      if (paymentModal.mode === 'create') {
        const res = await paymentMethodsService.create(payload);
        if (res?.success) {
          showToast('success', `Payment method "${paymentModal.name.trim()}" saved to database!`);
          setPaymentModal(prev => ({ ...prev, isOpen: false }));
          loadData();
        }
      } else {
        const res = await paymentMethodsService.update(paymentModal.id, payload);
        if (res?.success) {
          showToast('success', `Payment method "${paymentModal.name.trim()}" updated!`);
          setPaymentModal(prev => ({ ...prev, isOpen: false }));
          loadData();
        }
      }
    } catch (err) {
      console.error('Payment method save error:', err);
      showToast('error', err.response?.data?.message || 'Failed to save payment method.');
    } finally {
      setPaymentModal(prev => ({ ...prev, loading: false }));
    }
  };

  // Quick toggle default / active for payment method
  const handleToggleDefaultPayment = async (pm) => {
    if (pm.isDefault) return; // already default
    try {
      const res = await paymentMethodsService.update(pm.id, { isDefault: true, isActive: true });
      if (res?.success) {
        showToast('success', `"${pm.name}" set as the default payment method.`);
        loadData();
      }
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to update default payment method.');
    }
  };

  // ---------------- DELETE ACTIONS ----------------
  const handleOpenDeleteConfirm = (targetType, item) => {
    setDeleteConfirm({
      isOpen: true,
      targetType,
      item,
      loading: false,
    });
  };

  const handleConfirmDelete = async () => {
    const { targetType, item } = deleteConfirm;
    if (!item) return;

    setDeleteConfirm(prev => ({ ...prev, loading: true }));
    try {
      if (targetType === 'category') {
        const res = await expensesService.deleteCategory(item.id);
        if (res?.success) {
          showToast('success', `Expense category "${item.name}" deleted.`);
          setDeleteConfirm(prev => ({ ...prev, isOpen: false }));
          loadData();
        }
      } else {
        const res = await paymentMethodsService.delete(item.id);
        if (res?.success) {
          showToast('success', `Payment method "${item.name}" deleted.`);
          setDeleteConfirm(prev => ({ ...prev, isOpen: false }));
          loadData();
        }
      }
    } catch (err) {
      console.error('Delete error:', err);
      showToast('error', err.response?.data?.message || 'Failed to delete item.');
    } finally {
      setDeleteConfirm(prev => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Notification Toast */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl backdrop-blur-md border animate-in slide-in-from-top-4 duration-200 ${
            toast.type === 'success'
              ? 'bg-emerald-50/95 border-emerald-200 text-emerald-800'
              : 'bg-rose-50/95 border-rose-200 text-rose-800'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span className="text-sm font-semibold">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="p-1 rounded-lg hover:bg-black/5 text-slate-500 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Financial Settings</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Manage custom expense categories and payment methods saved directly to your database.
            </p>
          </div>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm transition-all"
          title="Refresh database records"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Modern Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200/80">
        <button
          onClick={() => { setActiveTab('categories'); setSearchQuery(''); }}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'categories'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Tag className="w-4 h-4" />
          Expense Categories
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            activeTab === 'categories' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'bg-slate-100 text-slate-600'
          }`}>
            {categories.length}
          </span>
        </button>

        <button
          onClick={() => { setActiveTab('payments'); setSearchQuery(''); }}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'payments'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Payment Methods
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            activeTab === 'payments' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'bg-slate-100 text-slate-600'
          }`}>
            {paymentMethods.length}
          </span>
        </button>
      </div>

      {/* Control Bar: Search + Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder={activeTab === 'categories' ? "Search expense categories..." : "Search payment methods..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div>
          {activeTab === 'categories' ? (
            <button
              onClick={handleOpenAddCategory}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-2xl shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <Plus className="w-4 h-4" />
              Add Expense Category
            </button>
          ) : (
            <button
              onClick={handleOpenAddPayment}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-2xl shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <Plus className="w-4 h-4" />
              Add Payment Method
            </button>
          )}
        </div>
      </div>

      {/* TAB CONTENT */}
      {loading ? (
        <div className="glass-card rounded-3xl p-16 flex flex-col items-center justify-center text-slate-400 gap-3 border border-slate-100">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <span className="text-sm font-medium">Loading settings from database...</span>
        </div>
      ) : activeTab === 'categories' ? (
        /* ================= EXPENSE CATEGORIES TABLE ================= */
        <div className="glass-card rounded-3xl border border-slate-100 shadow-sm overflow-hidden bg-white/70">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-6">Category Name</th>
                  <th className="py-3.5 px-6">Description</th>
                  <th className="py-3.5 px-6 text-center">Expenses Count</th>
                  <th className="py-3.5 px-6 text-center">Type</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredCategories.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-slate-400 text-sm">
                      {searchQuery ? `No categories matching "${searchQuery}"` : 'No expense categories found.'}
                    </td>
                  </tr>
                ) : (
                  filteredCategories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <span
                            className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm ring-2 ring-white"
                            style={{ backgroundColor: cat.color || '#6366f1' }}
                          />
                          <span className="font-semibold text-slate-800">{cat.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-500 text-xs max-w-xs truncate">
                        {cat.description || <span className="text-slate-300 italic">No description</span>}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                          {cat._count?.expenses ?? 0} expenses
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        {cat.isDefault ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-600">
                            System Default
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-600">
                            Custom
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditCategory(cat)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Edit Category"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenDeleteConfirm('category', cat)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Category"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ================= PAYMENT METHODS TABLE ================= */
        <div className="glass-card rounded-3xl border border-slate-100 shadow-sm overflow-hidden bg-white/70">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-6">Payment Method</th>
                  <th className="py-3.5 px-6">Code</th>
                  <th className="py-3.5 px-6">Type</th>
                  <th className="py-3.5 px-6 text-center">Default</th>
                  <th className="py-3.5 px-6 text-center">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredPaymentMethods.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-400 text-sm">
                      {searchQuery ? `No payment methods matching "${searchQuery}"` : 'No payment methods found.'}
                    </td>
                  </tr>
                ) : (
                  filteredPaymentMethods.map((pm) => {
                    const typeDef = METHOD_TYPES.find(t => t.value === pm.type) || METHOD_TYPES[5];
                    const TypeIcon = typeDef.icon;
                    return (
                      <tr key={pm.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                              <TypeIcon className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-semibold text-slate-800">{pm.name}</div>
                              {pm.description && (
                                <div className="text-xs text-slate-400 max-w-xs truncate">{pm.description}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 font-mono text-xs font-semibold text-slate-600">
                          {pm.code ? (
                            <span className="px-2 py-0.5 bg-slate-100 rounded-md border border-slate-200">
                              {pm.code}
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700">
                            {typeDef.label}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          {pm.isDefault ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              Default
                            </span>
                          ) : (
                            <button
                              onClick={() => handleToggleDefaultPayment(pm)}
                              className="text-xs text-slate-400 hover:text-indigo-600 hover:underline transition-colors"
                            >
                              Set as Default
                            </button>
                          )}
                        </td>
                        <td className="py-4 px-6 text-center">
                          {pm.isActive ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-500">
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEditPayment(pm)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Edit Payment Method"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenDeleteConfirm('payment', pm)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete Payment Method"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD / EDIT CATEGORY ================= */}
      {categoryModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">
                  {categoryModal.mode === 'create' ? 'Add Expense Category' : 'Edit Expense Category'}
                </h3>
              </div>
              <button
                onClick={() => setCategoryModal(prev => ({ ...prev, isOpen: false }))}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Category Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Office Supplies, Travel, Software"
                  value={categoryModal.name}
                  onChange={(e) => setCategoryModal(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                  Color Tag
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {COLOR_PALETTES.map((palette) => (
                    <button
                      type="button"
                      key={palette.value}
                      onClick={() => setCategoryModal(prev => ({ ...prev, color: palette.value }))}
                      className={`w-8 h-8 rounded-full transition-transform flex items-center justify-center ${
                        categoryModal.color === palette.value
                          ? 'scale-110 ring-2 ring-offset-2 ring-indigo-500 shadow-sm'
                          : 'hover:scale-105 opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: palette.value }}
                      title={palette.name}
                    >
                      {categoryModal.color === palette.value && (
                        <Check className="w-4 h-4 text-white stroke-[3]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Description <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows="3"
                  placeholder="Brief description of this expense category..."
                  value={categoryModal.description}
                  onChange={(e) => setCategoryModal(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCategoryModal(prev => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={categoryModal.loading}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-600/20 disabled:opacity-50"
                >
                  {categoryModal.loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {categoryModal.mode === 'create' ? 'Save Category' : 'Update Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD / EDIT PAYMENT METHOD ================= */}
      {paymentModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">
                  {paymentModal.mode === 'create' ? 'Add Payment Method' : 'Edit Payment Method'}
                </h3>
              </div>
              <button
                onClick={() => setPaymentModal(prev => ({ ...prev, isOpen: false }))}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePaymentMethod} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    Method Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bank Transfer, Google Pay"
                    value={paymentModal.name}
                    onChange={(e) => setPaymentModal(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    Code <span className="text-slate-400 font-normal">(e.g. CASH, HDFC)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. UPI, WIRE"
                    value={paymentModal.code}
                    onChange={(e) => setPaymentModal(prev => ({ ...prev, code: e.target.value }))}
                    className="w-full px-3.5 py-2.5 text-sm uppercase font-mono bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Payment Type
                </label>
                <select
                  value={paymentModal.type}
                  onChange={(e) => setPaymentModal(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {METHOD_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Description <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows="2"
                  placeholder="Notes or instructions for this payment method..."
                  value={paymentModal.description}
                  onChange={(e) => setPaymentModal(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-between gap-4 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={paymentModal.isDefault}
                    onChange={(e) => setPaymentModal(prev => ({ ...prev, isDefault: e.target.checked }))}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  Set as default method
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={paymentModal.isActive}
                    onChange={(e) => setPaymentModal(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  Active
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPaymentModal(prev => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paymentModal.loading}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-600/20 disabled:opacity-50"
                >
                  {paymentModal.loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {paymentModal.mode === 'create' ? 'Save Payment Method' : 'Update Method'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: DELETE CONFIRMATION ================= */}
      {deleteConfirm.isOpen && deleteConfirm.item && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-sm w-full p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Delete {deleteConfirm.targetType === 'category' ? 'Category' : 'Payment Method'}?
            </h3>
            <p className="text-xs text-slate-500 mt-2">
              Are you sure you want to delete{' '}
              <strong className="text-slate-800">"{deleteConfirm.item.name}"</strong>? Existing records in the database will safely retain their historical records.
            </p>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirm(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteConfirm.loading}
                className="inline-flex items-center gap-2 px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-rose-600/20 disabled:opacity-50"
              >
                {deleteConfirm.loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
