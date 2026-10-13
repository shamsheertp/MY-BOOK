import { useState, useMemo, useCallback, useEffect, useRef, memo } from 'react';
import { ArrowLeft, Plus, Trash2, Calendar, FileText, User, Phone, Mail, MapPin, Receipt, Building2, Search, X, Package, ChevronDown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { contactsService, productsService, purchasesService, tokenStorage } from '../../services/api';
import { CustomerModal } from '../Contacts/components/CustomerModal';

const ProductSelectorInput = memo(function ProductSelectorInput({
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
          <Package className="w-4 h-4 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
        </div>
        <input
          type="text"
          value={value}
          placeholder="Type material name or select..."
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
          className="w-full pl-9 pr-9 py-2.5 bg-white border border-slate-200 hover:border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-xl outline-none transition-all font-medium text-slate-800 text-sm shadow-sm"
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
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180 text-orange-500' : ''}`} />
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
          <span>Cost: <strong className="text-orange-600 font-bold">₹{(selectedProduct.costPricePerKg || selectedProduct.costPrice || selectedProduct.sellingPricePerKg || 0).toLocaleString('en-IN')}/kg</strong></span>
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
            const cost = p.costPricePerKg || p.costPrice || p.sellingPricePerKg || 0;
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
                  isSelected ? 'bg-orange-50/80' : 'hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className={`font-bold text-sm transition-colors ${
                    isSelected ? 'text-orange-600' : 'text-slate-800 group-hover:text-orange-600'
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
                  <div className="font-black text-slate-900 text-sm group-hover:text-orange-600">
                    ₹{cost.toLocaleString('en-IN')}<span className="text-xs font-normal text-slate-500">/kg</span>
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
              className="text-[11px] px-2 py-0.5 bg-slate-100 hover:bg-orange-50 hover:text-orange-600 rounded-md text-slate-600 font-medium whitespace-nowrap transition-colors cursor-pointer"
            >
              + {p.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

const PurchaseItemRow = memo(function PurchaseItemRow({
  item,
  index,
  totalItems,
  products = [],
  onChange,
  onProductSelect,
  onRemove,
}) {
  return (
    <tr className="group border-b border-slate-100 last:border-0 hover:bg-slate-50/40">
      <td className="py-3 px-2 align-top">
        <ProductSelectorInput
          value={item.name}
          item={item}
          products={products}
          onChange={onChange}
          onProductSelect={onProductSelect}
        />
      </td>
      <td className="py-3 px-2 align-top">
        <div className="relative">
          <input 
            type="number" 
            step="any"
            min="0.01"
            placeholder="1.00"
            value={item.qty}
            onChange={(e) => onChange(item.id, 'qty', e.target.value)}
            className="w-full pr-8 pl-3 py-2.5 bg-white border border-slate-200 hover:border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-xl outline-none transition-all font-bold text-center text-slate-800 text-sm shadow-sm"
          />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none">
            kg
          </span>
        </div>
      </td>
      <td className="py-3 px-2 align-top">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium pointer-events-none text-xs">₹</span>
          <input 
            type="number" 
            step="any"
            min="0"
            placeholder="0.00"
            value={item.price}
            onChange={(e) => onChange(item.id, 'price', e.target.value)}
            className="w-full pl-7 pr-9 py-2.5 bg-white border border-slate-200 hover:border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-xl outline-none transition-all font-bold text-right text-slate-800 text-sm shadow-sm"
          />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-medium text-slate-400 pointer-events-none">
            /kg
          </span>
        </div>
      </td>
      <td className="py-3 px-2 align-top text-right">
        <div className="py-2.5 px-4 font-bold text-slate-900 bg-slate-50/80 rounded-xl border border-slate-100 text-sm">
          ₹{((Number(item.qty) || 0) * (Number(item.price) || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </div>
      </td>
      <td className="py-3 pl-2 align-top text-right">
        <button 
          type="button"
          onClick={() => onRemove(item.id)}
          className="p-2.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
          disabled={totalItems === 1}
          title="Remove item"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
});

export default function CreatePurchase() {
  const navigate = useNavigate();
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [products, setProducts] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Contact filter controls
  const [contactSearchQuery, setContactSearchQuery] = useState('');
  
  const [purchase, setPurchase] = useState(() => ({
    supplierId: '',
    supplierName: '',
    supplierCompany: '',
    supplierEmail: '',
    supplierPhone: '',
    supplierAddress: '',
    supplierTaxNumber: '',
    payables: 0,
    receivables: 0,
    ref: `PO-${new Date().getFullYear()}${Math.floor(100 + Math.random() * 900)}`,
    date: new Date().toISOString().split('T')[0],
    expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: ''
  }));

  const [items, setItems] = useState([
    { id: 1, productId: null, name: '', qty: 1, price: 0 }
  ]);

  const [discount, setDiscount] = useState(0);
  const [taxPercent, setTaxPercent] = useState(5);

  const [isLoadingContacts, setIsLoadingContacts] = useState(true);

  const loadData = useCallback(async () => {
    // Avoid making unauthenticated calls if token is missing
    if (typeof tokenStorage?.getAccessToken === 'function' && !tokenStorage.getAccessToken()) {
      setIsLoadingContacts(false);
      return;
    }

    setIsLoadingContacts(true);
    try {
      const [cRes, pRes] = await Promise.all([
        contactsService.list({ limit: 100 }),
        productsService.list({ limit: 100 }).catch(() => ({ data: [] })),
      ]);

      const rawContacts = cRes?.data?.contacts || cRes?.data || cRes || [];
      const contactList = Array.isArray(rawContacts) ? rawContacts : [];

      const rawProducts = pRes?.data?.products || pRes?.data || pRes || [];
      const productList = Array.isArray(rawProducts) ? rawProducts : [];

      setContacts(contactList);
      setProducts(productList);

      // If no supplier selected yet, preselect first contact from DB
      setPurchase(prev => {
        if (!prev.supplierId && contactList.length > 0) {
          const first = contactList[0];
          return {
            ...prev,
            supplierId: first.id,
            supplierName: first.contactName || first.name || '',
            supplierCompany: first.companyName || first.company || '',
            supplierEmail: first.email || '',
            supplierPhone: first.phone || '',
            supplierAddress: first.address || '',
            supplierTaxNumber: first.taxNumber || '',
            payables: Number(first.payables ?? 0),
            receivables: Number(first.receivables ?? 0),
          };
        }
        return prev;
      });
    } catch (err) {
      if (err?.status !== 401 && err?.status !== 403) {
        console.error('Failed to load contacts from DB for PO:', err);
      }
      setContacts([]);
    } finally {
      setIsLoadingContacts(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter contacts by search query
  const filteredContacts = useMemo(() => {
    return contacts.filter(c => {
      const searchLower = contactSearchQuery.toLowerCase().trim();
      return !searchLower ||
        (c.contactName || c.name || '').toLowerCase().includes(searchLower) ||
        (c.companyName || c.company || '').toLowerCase().includes(searchLower) ||
        (c.phone || '').toLowerCase().includes(searchLower) ||
        (c.email || '').toLowerCase().includes(searchLower) ||
        (c.code || '').toLowerCase().includes(searchLower);
    });
  }, [contacts, contactSearchQuery]);

  const handleSelectContact = (contactId) => {
    const selected = contacts.find(c => c.id === contactId || c.code === contactId);
    if (selected) {
      setPurchase(prev => ({
        ...prev,
        supplierId: selected.id,
        supplierName: selected.contactName || selected.name || '',
        supplierCompany: selected.companyName || selected.company || '',
        supplierEmail: selected.email || '',
        supplierPhone: selected.phone || '',
        supplierAddress: selected.address || '',
        supplierTaxNumber: selected.taxNumber || '',
        payables: Number(selected.payables ?? 0),
        receivables: Number(selected.receivables ?? 0),
      }));
    } else {
      setPurchase(prev => ({ ...prev, supplierId: contactId }));
    }
  };

  const selectedContact = useMemo(() => {
    if (!purchase.supplierId) return null;
    return contacts.find(c => c.id === purchase.supplierId || c.code === purchase.supplierId) || {
      contactName: purchase.supplierName,
      companyName: purchase.supplierCompany,
      email: purchase.supplierEmail,
      phone: purchase.supplierPhone,
      address: purchase.supplierAddress,
      taxNumber: purchase.supplierTaxNumber,
      payables: purchase.payables,
      receivables: purchase.receivables,
    };
  }, [purchase, contacts]);

  const handleItemChange = useCallback((id, field, value) => {
    setItems(prevItems => prevItems.map(item => {
      if (item.id === id) {
        return { ...item, [field]: field === 'qty' || field === 'price' ? (value === '' ? '' : Number(value)) : value };
      }
      return item;
    }));
  }, []);

  const handleProductSelect = useCallback((id, product) => {
    setItems(prevItems => prevItems.map(item => {
      if (item.id === id) {
        return {
          ...item,
          productId: product.id,
          name: product.name,
          price: product.costPricePerKg || product.costPrice || product.sellingPricePerKg || item.price || 0,
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

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + ((Number(item.qty) || 0) * (Number(item.price) || 0)), 0), [items]);
  const taxAmount = useMemo(() => Math.max(0, (subtotal - discount) * (taxPercent / 100)), [subtotal, discount, taxPercent]);
  const total = useMemo(() => Math.max(0, subtotal - discount + taxAmount), [subtotal, discount, taxAmount]);

  const handleSubmit = async (status) => {
    setErrorMsg('');
    if (!purchase.supplierId) {
      setErrorMsg("Please select a supplier or contact");
      return;
    }
    if (items.some(i => !i.name.trim())) {
      setErrorMsg("Please ensure all line items have a product or material description");
      return;
    }

    const payload = {
      ref: purchase.ref,
      supplierId: purchase.supplierId,
      supplierName: purchase.supplierName || selectedContact?.contactName || selectedContact?.companyName || 'Supplier',
      supplierCompany: purchase.supplierCompany || selectedContact?.companyName || null,
      supplierEmail: purchase.supplierEmail || selectedContact?.email || null,
      supplierPhone: purchase.supplierPhone || selectedContact?.phone || null,
      supplierAddress: purchase.supplierAddress || selectedContact?.address || null,
      date: purchase.date,
      expectedDeliveryDate: purchase.expectedDeliveryDate || null,
      status: status,
      discount: Number(discount) || 0,
      taxPercent: Number(taxPercent) || 0,
      notes: purchase.notes || null,
      items: items.map(item => ({
        productId: item.productId || null,
        name: item.name,
        orderedKg: Number(item.qty) || 1,
        unitPrice: Number(item.price) || 0,
      })),
    };

    setIsSubmitting(true);
    try {
      const res = await purchasesService.create(payload);
      if (res?.success) {
        navigate(`/purchases/${res.data?.ref || purchase.ref}`);
      } else {
        setErrorMsg(res?.message || 'Failed to create purchase order');
      }
    } catch (error) {
      console.error('Error creating purchase order:', error);
      setErrorMsg(error?.response?.data?.message || error?.message || 'Failed to save purchase order to database');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto fade-in px-4 sm:px-0 pb-12">
      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 font-semibold flex items-center justify-between shadow-sm">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="text-red-500 hover:text-red-700 font-bold">&times;</button>
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link to="/purchases" className="p-2.5 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-colors shadow-sm text-slate-600 hover:text-orange-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">New Purchase Order</h1>
            <p className="text-sm text-slate-500 mt-1 font-medium">Create a new purchase order for any contact/supplier and track inventory</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button 
            disabled={isSubmitting}
            onClick={() => navigate('/purchases')}
            className="px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl shadow-sm transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            disabled={isSubmitting}
            onClick={() => handleSubmit('DRAFT')}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-sm shadow-slate-200 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save as Draft'}
          </button>
          <button 
            disabled={isSubmitting}
            onClick={() => handleSubmit('ORDERED')}
            className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-sm shadow-orange-200 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Confirming...' : 'Confirm Order'}
          </button>
        </div>
      </div>

      <div className="glass-card bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        {/* Top Details Section */}
        <div className="p-8 border-b border-slate-100 bg-white">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:items-start">
            
            {/* Contact / Supplier Selection & Details */}
            <div className="lg:col-span-6 space-y-4">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Contact Details *
              </label>

              {/* Selector & Quick Add Button */}
              <div className="flex gap-2">
                <div className="relative group flex-1">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="w-5 h-5 text-orange-400 group-focus-within:text-orange-600 transition-colors" />
                  </div>
                  <select 
                    value={purchase.supplierId || ''}
                    onChange={(e) => handleSelectContact(e.target.value)}
                    className="w-full pl-12 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all cursor-pointer shadow-sm appearance-none"
                  >
                    <option value="" disabled className="font-normal text-slate-400">
                      {isLoadingContacts 
                        ? 'Loading contacts from DB...' 
                        : filteredContacts.length > 0 
                          ? `Select a contact (${filteredContacts.length} available)...` 
                          : 'No contacts found in DB. Click + to add.'}
                    </option>
                    {filteredContacts.map(c => {
                      const name = c.contactName || c.name || 'Unnamed';
                      const company = c.companyName || c.company;
                      const code = c.code ? ` (${c.code})` : '';
                      return (
                        <option key={c.id} value={c.id}>
                          {name}{company ? ` - ${company}` : ''}{code}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <button 
                  type="button"
                  onClick={() => setShowSupplierModal(true)}
                  className="flex items-center justify-center w-[50px] h-[50px] bg-orange-50 text-orange-600 hover:bg-orange-100 hover:text-orange-700 rounded-xl transition-colors border border-orange-100 flex-shrink-0 shadow-sm cursor-pointer"
                  title="Add New Contact"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {!isLoadingContacts && contacts.length === 0 && (
                <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                  <span>No contacts found in database. Create a contact to link to this purchase order.</span>
                  <button 
                    type="button" 
                    onClick={() => setShowSupplierModal(true)}
                    className="font-bold underline text-amber-900 hover:text-amber-700 ml-2"
                  >
                    + Add Contact
                  </button>
                </div>
              )}

              {/* Optional Contact Quick Search Input */}
              {contacts.length > 5 && (
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={contactSearchQuery}
                    onChange={(e) => setContactSearchQuery(e.target.value)}
                    placeholder="Search contacts by name, company, phone, email..."
                    className="w-full pl-9 pr-8 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all"
                  />
                  {contactSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setContactSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

              {/* Comprehensive Contact Details Card */}
              {selectedContact && (
                <div className="mt-3 bg-gradient-to-br from-slate-50 to-orange-50/30 rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-slate-800 text-base">
                          {selectedContact.contactName || selectedContact.name || 'Unnamed Contact'}
                        </span>
                      </div>
                      {(selectedContact.companyName || selectedContact.company) && (
                        <div className="flex items-center text-xs font-bold text-slate-600 mt-1">
                          <Building2 className="w-3.5 h-3.5 mr-1 text-slate-400" />
                          {selectedContact.companyName || selectedContact.company}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 pt-2 border-t border-slate-200/60">
                    <div className="flex items-center space-x-1.5">
                      <Phone className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                      <span className="font-medium truncate">{selectedContact.phone || 'No phone provided'}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <Mail className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                      <span className="font-medium truncate">{selectedContact.email || 'No email provided'}</span>
                    </div>
                    <div className="flex items-start space-x-1.5 sm:col-span-2">
                      <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0 mt-0.5" />
                      <span className="font-medium">{selectedContact.address || 'No physical address on file'}</span>
                    </div>
                    {selectedContact.taxNumber && (
                      <div className="flex items-center space-x-1.5 sm:col-span-2">
                        <Receipt className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                        <span className="font-bold text-slate-700">TRN/GST: {selectedContact.taxNumber}</span>
                      </div>
                    )}
                  </div>

                  {/* Financial Balance Summary for Contact */}
                  {(selectedContact.payables > 0 || selectedContact.receivables > 0) && (
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                      {selectedContact.payables > 0 && (
                        <span className="font-semibold text-rose-600">
                          We Owe (Payables): ₹{Number(selectedContact.payables).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      )}
                      {selectedContact.receivables > 0 && (
                        <span className="font-semibold text-emerald-600">
                          Owed to Us (Receivables): ₹{Number(selectedContact.receivables).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* PO Metadata Side */}
            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">PO No.</label>
                <div className="flex items-center text-slate-800 font-bold h-[50px] bg-slate-50 px-3 rounded-xl border border-slate-200">
                  <FileText className="w-4 h-4 text-orange-400 mr-2" />
                  <span className="truncate">{purchase.ref}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">PO Date</label>
                <div className="flex items-center text-slate-700 font-medium h-[50px] bg-slate-50 px-3 rounded-xl border border-slate-200">
                  <Calendar className="w-4 h-4 text-slate-400 mr-2" />
                  <span>{purchase.date}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Expected Delivery</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="w-4 h-4 text-orange-400 group-focus-within:text-orange-500" />
                  </div>
                  <input 
                    type="date" 
                    value={purchase.expectedDeliveryDate} 
                    onChange={(e) => setPurchase({...purchase, expectedDeliveryDate: e.target.value})} 
                    className="w-full pl-10 pr-3 h-[50px] bg-white border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all shadow-sm text-sm" 
                  />
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Line Items */}
        <div className="p-8">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="py-3 px-2 text-xs font-bold text-slate-500 uppercase tracking-wider w-1/2">Product / Raw Material (Kg)</th>
                  <th className="py-3 px-2 text-xs font-bold text-slate-500 uppercase tracking-wider w-28 text-center">Qty (Kg)</th>
                  <th className="py-3 px-2 text-xs font-bold text-slate-500 uppercase tracking-wider w-36 text-right">Cost Price / Kg</th>
                  <th className="py-3 px-2 text-xs font-bold text-slate-500 uppercase tracking-wider w-36 text-right">Amount</th>
                  <th className="py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, index) => (
                  <PurchaseItemRow
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
            onClick={addItem}
            className="mt-4 flex items-center text-sm font-bold text-orange-600 hover:text-orange-800 hover:bg-orange-50 px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Another Item
          </button>
        </div>

        {/* Totals Section */}
        <div className="p-8 bg-slate-50 border-t border-slate-100 flex flex-col md:flex-row justify-between items-start gap-8">
          <div className="w-full md:w-1/2 space-y-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Internal Notes / Delivery Instructions</label>
            <textarea 
              rows="3" 
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all resize-none shadow-sm"
              value={purchase.notes}
              onChange={(e) => setPurchase({...purchase, notes: e.target.value})}
              placeholder="e.g. Deliver to Warehouse Bay 3, verify bag seals"
            ></textarea>
          </div>

          <div className="w-full md:w-80 space-y-4">
            <div className="flex justify-between items-center text-slate-600">
              <span className="font-medium">Subtotal</span>
              <span className="font-bold text-slate-800">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            
            <div className="flex justify-between items-center text-slate-600">
              <span className="font-medium">Discount (₹)</span>
              <div className="relative w-32">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium pointer-events-none">₹</span>
                <input 
                  type="number" 
                  step="any"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                  className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-right font-bold focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm transition-all"
                />
              </div>
            </div>

            <div className="flex justify-between items-center text-slate-600">
              <span className="font-medium">Tax (%)</span>
              <div className="relative w-32">
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium pointer-events-none">%</span>
                <input 
                  type="number" 
                  step="any"
                  value={taxPercent}
                  onChange={(e) => setTaxPercent(Number(e.target.value) || 0)}
                  className="w-full pr-8 pl-3 py-2 bg-white border border-slate-200 rounded-xl text-right font-bold focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm transition-all"
                />
              </div>
            </div>

            <div className="pt-4 border-t-2 border-slate-200 flex justify-between items-center">
              <span className="text-lg font-black text-slate-800">Total</span>
              <span className="text-2xl font-black text-orange-600">₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>

      {showSupplierModal && (
        <CustomerModal 
          isOpen={showSupplierModal} 
          onClose={() => {
            setShowSupplierModal(false);
          }} 
          onSaved={() => {
            loadData();
          }}
        />
      )}
    </div>
  );
}
