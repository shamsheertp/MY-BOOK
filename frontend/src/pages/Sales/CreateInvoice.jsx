import { useState, useMemo, useCallback, useEffect, useRef, memo } from 'react';
import { ArrowLeft, Plus, Trash2, Calendar, FileText, User, Package, AlertCircle, Save, X, ChevronDown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { contactsService, productsService, salesService, tokenStorage } from '../../services/api';
import { CustomerModal } from '../Contacts/components/CustomerModal';

const SaleProductSelectorInput = memo(function SaleProductSelectorInput({
  value,
  item,
  products = [],
  onChange,
  onProductSelect,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    if (!value || value.trim() === '') return products.slice(0, 8);
    const search = value.toLowerCase().trim();
    return products.filter(
      p => (p.name || '').toLowerCase().includes(search) || (p.sku && p.sku.toLowerCase().includes(search))
    ).slice(0, 8);
  }, [products, value]);

  const selectedProduct = useMemo(() => {
    if (item.productId) return products.find(p => p.id === item.productId);
    return products.find(p => (p.name || '').toLowerCase() === (value || '').toLowerCase().trim());
  }, [products, item.productId, value]);

  return (
    <div ref={containerRef} className="relative w-full space-y-1.5">
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Package className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
        </div>
        <input
          type="text"
          value={value}
          placeholder="Type item description or select material..."
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
          onFocus={() => setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setIsOpen(false);
          }}
          onChange={(e) => {
            onChange(item.id, 'name', e.target.value);
            setIsOpen(true);
          }}
          className="w-full pl-9 pr-9 py-2.5 bg-white border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl outline-none transition-all font-medium text-slate-800 text-sm shadow-sm"
        />
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center">
          {value ? (
            <button
              type="button"
              onClick={() => {
                onChange(item.id, 'name', '');
                onChange(item.id, 'productId', null);
                setIsOpen(true);
              }}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsOpen(prev => !prev)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
              title="Browse catalog"
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180 text-indigo-500' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Selected Product Context Badge */}
      {selectedProduct && (
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 font-medium px-1">
          {selectedProduct.sku && (
            <span className="font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-bold border border-slate-200/60">
              {selectedProduct.sku}
            </span>
          )}
          <span>Stock: <strong className="text-slate-700">{selectedProduct.stockKg ?? selectedProduct.stock ?? 0} kg</strong></span>
          <span className="text-slate-300">•</span>
          <span>Price: <strong className="text-indigo-600 font-bold">₹{Number(selectedProduct.sellingPricePerKg || selectedProduct.price || 0).toLocaleString('en-IN')}/kg</strong></span>
        </div>
      )}

      {/* Custom Autocomplete Dropdown Menu */}
      {isOpen && filtered.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200/90 rounded-2xl shadow-xl z-50 max-h-60 overflow-y-auto divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/90 sticky top-0 backdrop-blur-sm flex justify-between items-center">
            <span>Catalog Items ({filtered.length})</span>
            <span className="text-[10px] text-slate-400 font-normal">Click to apply</span>
          </div>
          {filtered.map((p) => {
            const price = Number(p.sellingPricePerKg || p.price || 0);
            const stock = p.stockKg ?? p.stock ?? 0;
            const isSelected = item.productId === p.id || (value && p.name.toLowerCase() === value.toLowerCase());
            return (
              <button
                key={p.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onProductSelect(item.id, p);
                  setIsOpen(false);
                }}
                className={`w-full px-3.5 py-2.5 text-left transition-colors flex items-center justify-between group cursor-pointer ${
                  isSelected ? 'bg-indigo-50/80' : 'hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className={`font-bold text-sm transition-colors ${
                    isSelected ? 'text-indigo-600' : 'text-slate-800 group-hover:text-indigo-600'
                  }`}>
                    {p.name}
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-slate-500 mt-0.5">
                    {p.sku && <span className="font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-semibold">{p.sku}</span>}
                    {p.category && <span>{p.category}</span>}
                    <span className="text-slate-300">•</span>
                    <span>{stock} kg in stock</span>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <div className="font-black text-slate-900 text-sm group-hover:text-indigo-600">
                    ₹{price.toLocaleString('en-IN')}<span className="text-xs font-normal text-slate-500">/kg</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Quick Suggestion Pills */}
      {!value && products.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">Quick:</span>
          {products.slice(0, 3).map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onProductSelect(item.id, p)}
              className="text-[11px] px-2 py-0.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-md text-slate-600 font-medium whitespace-nowrap transition-colors cursor-pointer"
            >
              + {p.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

const LineItemRow = memo(function LineItemRow({ 
  item, 
  index, 
  totalItems, 
  products = [], 
  onChange, 
  onProductSelect, 
  onRemove 
}) {
  return (
    <tr className="group border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
      <td className="py-3 px-3 align-top">
        <SaleProductSelectorInput
          value={item.name}
          item={item}
          products={products}
          onChange={onChange}
          onProductSelect={onProductSelect}
        />
      </td>
      <td className="py-3 px-3 align-top">
        <div className="relative">
          <input
            type="number"
            step="0.01"
            min="0.01"
            placeholder="1.00"
            value={item.qty}
            onChange={(e) => onChange(item.id, 'qty', e.target.value)}
            className="w-full pr-8 pl-3 py-2.5 bg-white border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl outline-none transition-all font-bold text-center text-slate-800 text-sm shadow-sm"
          />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none">
            kg
          </span>
        </div>
      </td>
      <td className="py-3 px-3 align-top">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium pointer-events-none text-xs">₹</span>
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={item.price}
            onChange={(e) => onChange(item.id, 'price', e.target.value)}
            className="w-full pl-7 pr-12 py-2.5 bg-white border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl outline-none transition-all font-bold text-right text-slate-800 text-sm shadow-sm"
          />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-medium text-slate-400 pointer-events-none">
            /kg
          </span>
        </div>
      </td>
      <td className="py-3 px-3 align-top text-right">
        <div className="py-2.5 px-3 font-bold text-slate-900 bg-slate-50/70 rounded-xl border border-slate-100 text-sm">
          ₹{((Number(item.qty) || 0) * (Number(item.price) || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </div>
      </td>
      <td className="py-3 pl-2 align-top text-right">
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          className="p-2.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
          disabled={totalItems === 1}
          title="Remove row"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
});

export default function CreateInvoice() {
  const navigate = useNavigate();
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [products, setProducts] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const generateInvoiceRef = () => {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(100 + Math.random() * 900);
    return `SALE-${year}${randomNum}`;
  };

  const [invoice, setInvoice] = useState(() => ({
    customerId: '',
    customerName: '',
    customerCompany: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    ref: generateInvoiceRef(),
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: 'Payment is due within 14 days of invoice date. Thank you for your business!',
  }));

  const [items, setItems] = useState([
    { id: 1, productId: null, name: '', qty: 1, price: 0 }
  ]);

  const [discount, setDiscount] = useState(0);
  const [taxPercent, setTaxPercent] = useState(0);

  const loadData = useCallback(async () => {
    // Avoid making unauthenticated calls if token is missing
    if (typeof tokenStorage?.getAccessToken === 'function' && !tokenStorage.getAccessToken()) {
      return;
    }

    try {
      const [contactsRes, productsRes] = await Promise.all([
        contactsService.list({ limit: 100 }),
        productsService.list({ limit: 100 }),
      ]);

      const loadedContacts = Array.isArray(contactsRes?.data?.contacts)
        ? contactsRes.data.contacts
        : Array.isArray(contactsRes?.data)
          ? contactsRes.data
          : Array.isArray(contactsRes)
            ? contactsRes
            : [];
      setContacts(loadedContacts);

      const loadedProducts = Array.isArray(productsRes?.data)
        ? productsRes.data
        : Array.isArray(productsRes?.data?.products)
          ? productsRes.data.products
          : Array.isArray(productsRes)
            ? productsRes
            : [];
      setProducts(loadedProducts);
    } catch (err) {
      if (err?.status !== 401 && err?.status !== 403) {
        console.error('Failed to load initial invoice resources:', err);
      }
      setContacts([]);
      setProducts([]);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCustomerSelect = (e) => {
    const custId = e.target.value;
    const safeContacts = Array.isArray(contacts) ? contacts : [];
    const selected = safeContacts.find(c => c.id === custId || c.code === custId);
    if (selected) {
      setInvoice(prev => ({
        ...prev,
        customerId: selected.id,
        customerName: selected.contactName || selected.name || '',
        customerCompany: selected.companyName || selected.company || '',
        customerEmail: selected.email || '',
        customerPhone: selected.phone || '',
        customerAddress: selected.address || '',
      }));
    } else {
      setInvoice(prev => ({ ...prev, customerId: custId }));
    }
  };

  const handleItemChange = useCallback((id, field, value) => {
    setItems(prevItems => prevItems.map(item => {
      if (item.id === id) {
        return { 
          ...item, 
          [field]: field === 'qty' || field === 'price' ? (value === '' ? '' : Number(value)) : value 
        };
      }
      return item;
    }));
  }, []);

  const handleProductSelect = useCallback((itemId, product) => {
    setItems(prevItems => prevItems.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          productId: product.id,
          name: product.name,
          price: Number(product.sellingPricePerKg || 0),
        };
      }
      return item;
    }));
  }, []);

  const addItem = useCallback(() => {
    setItems(prev => [...prev, { id: Date.now(), productId: null, name: '', qty: 1, price: 0 }]);
  }, []);

  const removeItem = useCallback((id) => {
    setItems(prev => prev.length > 1 ? prev.filter(item => item.id !== id) : prev);
  }, []);

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + ((Number(item.qty) || 0) * (Number(item.price) || 0)), 0);
  }, [items]);

  const taxAmount = useMemo(() => {
    return Math.max(0, subtotal - discount) * (taxPercent / 100);
  }, [subtotal, discount, taxPercent]);

  const total = useMemo(() => {
    return Math.max(0, subtotal - discount) + taxAmount;
  }, [subtotal, discount, taxAmount]);

  const handleSaveInvoice = async (status = 'UNPAID') => {
    if (!invoice.customerName.trim()) {
      setErrorMessage('Please select a customer or enter customer name');
      return;
    }

    const validItems = items.filter(it => it.name.trim() !== '');
    if (validItems.length === 0) {
      setErrorMessage('Please add at least one line item with a description');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const payload = {
        ref: invoice.ref.trim(),
        date: invoice.date,
        dueDate: invoice.dueDate || null,
        customerId: invoice.customerId || null,
        customerName: invoice.customerName.trim(),
        customerCompany: invoice.customerCompany?.trim() || null,
        customerEmail: invoice.customerEmail?.trim() || null,
        customerPhone: invoice.customerPhone?.trim() || null,
        customerAddress: invoice.customerAddress?.trim() || null,
        status,
        discount: Number(discount) || 0,
        taxPercent: Number(taxPercent) || 0,
        notes: invoice.notes?.trim() || null,
        items: validItems.map(it => ({
          productId: it.productId || null,
          name: it.name.trim(),
          quantityKg: parseFloat(it.qty) || 1,
          unitPrice: parseFloat(it.price) || 0,
        })),
      };

      const response = await salesService.create(payload);
      const createdSale = response.data || response;

      navigate(`/sales/${createdSale.ref || createdSale.id}`);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to create sales invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto fade-in px-4 sm:px-0 pb-16">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div className="flex items-center space-x-4">
          <Link to="/sales" className="p-2.5 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-colors shadow-sm text-slate-600 hover:text-indigo-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">New Invoice</h1>
            <p className="text-sm text-slate-500 mt-1 font-medium">Issue a new sales invoice with automatic inventory deduction</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => navigate('/sales')}
            disabled={isSubmitting}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-xl shadow-sm transition-colors cursor-pointer text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleSaveInvoice('DRAFT')}
            disabled={isSubmitting}
            className="flex-1 sm:flex-none px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl shadow-sm transition-colors cursor-pointer text-sm disabled:opacity-50"
          >
            Save as Draft
          </button>
          <button
            type="button"
            onClick={() => handleSaveInvoice('UNPAID')}
            disabled={isSubmitting}
            className="flex-1 sm:flex-none px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md shadow-indigo-100 hover:shadow-indigo-200 transition-all cursor-pointer text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save & Issue
              </>
            )}
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm font-semibold flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="glass-card bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        {/* Top Details Section */}
        <div className="p-8 border-b border-slate-100 bg-white">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:items-start">
            {/* Customer Details */}
            <div className="lg:col-span-5 space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Billed To (Customer) *
              </label>
              <div className="flex gap-2">
                <div className="relative group flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <User className="w-4 h-4 text-indigo-400 group-focus-within:text-indigo-600 transition-colors" />
                  </div>
                  <select
                    value={invoice.customerId}
                    onChange={handleCustomerSelect}
                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer shadow-sm appearance-none text-sm"
                  >
                    <option value="" disabled className="font-normal text-slate-400">Select a customer from contacts...</option>
                    {(Array.isArray(contacts) ? contacts : []).map(c => {
                      const name = c.contactName || c.name || 'Unnamed';
                      const company = c.companyName || c.company;
                      return (
                        <option key={c.id || c.code} value={c.id || c.code}>
                          {name} {company ? `(${company})` : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCustomerModal(true)}
                  className="flex items-center justify-center w-[42px] h-[42px] bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 rounded-xl transition-colors border border-indigo-100 shrink-0 shadow-sm cursor-pointer"
                  title="Add New Customer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {invoice.customerId && (
                <div className="mt-2 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <p className="font-bold text-slate-700">{invoice.customerName} {invoice.customerCompany && `• ${invoice.customerCompany}`}</p>
                  {invoice.customerAddress && <p className="mt-0.5">{invoice.customerAddress}</p>}
                  {invoice.customerPhone && <p className="mt-0.5 font-mono">{invoice.customerPhone}</p>}
                </div>
              )}
            </div>

            {/* Invoice Meta */}
            <div className="lg:col-span-3 space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Invoice Ref</label>
              <div className="flex items-center text-slate-800 font-bold font-mono h-[42px] px-3 bg-slate-50 rounded-xl border border-slate-200/70 text-sm">
                <FileText className="w-4 h-4 text-indigo-500 mr-2" />
                {invoice.ref}
              </div>
            </div>

            <div className="lg:col-span-2 space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Issue Date</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="w-4 h-4 text-slate-400" />
                </div>
                <input 
                  type="date" 
                  value={invoice.date} 
                  onChange={(e) => setInvoice({ ...invoice, date: e.target.value })} 
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm" 
                />
              </div>
            </div>

            <div className="lg:col-span-2 space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Due Date</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="w-4 h-4 text-rose-400" />
                </div>
                <input 
                  type="date" 
                  value={invoice.dueDate} 
                  onChange={(e) => setInvoice({ ...invoice, dueDate: e.target.value })} 
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 shadow-sm" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="p-8">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b-2 border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-3 w-1/2">Material Description / Catalog Item</th>
                  <th className="py-3 px-3 w-32 text-center">Weight (kg)</th>
                  <th className="py-3 px-3 w-40 text-right">Selling Price / kg</th>
                  <th className="py-3 px-3 w-36 text-right">Amount</th>
                  <th className="py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, index) => (
                  <LineItemRow
                    key={item.id}
                    item={item}
                    index={index}
                    totalItems={items.length}
                    products={products}
                    onChange={handleItemChange}
                    onProductSelect={handleProductSelect}
                    onRemove={removeItem}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={addItem}
            className="mt-4 flex items-center text-sm font-bold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Another Item
          </button>
        </div>

        {/* Totals Section */}
        <div className="p-8 bg-slate-50/70 border-t border-slate-100 flex flex-col md:flex-row justify-between items-start gap-8">
          <div className="w-full md:w-1/2 space-y-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Notes & Payment Terms</label>
            <textarea
              rows="3"
              placeholder="Add payment instructions, bank details, or terms for the customer..."
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none shadow-sm"
              value={invoice.notes}
              onChange={(e) => setInvoice({ ...invoice, notes: e.target.value })}
            ></textarea>
          </div>

          <div className="w-full md:w-80 space-y-3.5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center text-slate-600 text-sm">
              <span className="font-medium">Subtotal</span>
              <span className="font-bold text-slate-800">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>

            <div className="flex justify-between items-center text-slate-600 text-sm">
              <span className="font-medium">Discount (₹)</span>
              <div className="relative w-32">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium pointer-events-none text-xs">₹</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discount}
                  onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
                  className="w-full pl-7 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-right font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>
            </div>

            <div className="flex justify-between items-center text-slate-600 text-sm">
              <span className="font-medium">Tax (%)</span>
              <div className="relative w-32">
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium pointer-events-none text-xs">%</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={taxPercent}
                  onChange={(e) => setTaxPercent(Math.max(0, Number(e.target.value)))}
                  className="w-full pr-7 pl-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-right font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>
            </div>

            <div className="pt-3 border-t-2 border-slate-100 flex justify-between items-center">
              <span className="text-base font-black text-slate-800">Total Invoice</span>
              <span className="text-2xl font-black text-indigo-600">₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>

      {showCustomerModal && (
        <CustomerModal 
          isOpen={showCustomerModal} 
          onClose={() => {
            setShowCustomerModal(false);
            loadData();
          }} 
          onSave={() => {
            setShowCustomerModal(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}
