import { useState, useMemo, useCallback, useEffect, useRef, memo } from 'react';
import { ArrowLeft, Plus, Trash2, Calendar, FileText, User, Phone, Mail, MapPin, Receipt, Building2, Search, X, Package, ChevronDown, Sparkles, Edit3, Loader2 } from 'lucide-react';
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import { contactsService, productsService, purchasesService, tokenStorage } from '../../services/api';
import { CustomerModal } from '../Contacts/components/CustomerModal';
import { CompactContactSelector } from '../../components/Common/CompactContactSelector';

// Strip commas and non-digits/decimal dots
const sanitizeDecimalInput = (val) => {
  if (val === undefined || val === null) return '';
  let str = String(val).replace(/,/g, '');
  str = str.replace(/[^0-9.]/g, '');
  const parts = str.split('.');
  if (parts.length > 2) {
    str = parts[0] + '.' + parts.slice(1).join('');
  }
  return str;
};

// Format a number with Indian commas, preserving decimals
const formatWithCommas = (val) => {
  if (val === undefined || val === null || val === '') return '';
  const str = String(val).replace(/,/g, '').trim();
  if (!str || isNaN(str)) return val;
  const parts = str.split('.');
  const integerPart = parts[0] ? Number(parts[0]).toLocaleString('en-IN') : '0';
  if (parts.length > 1) {
    return `${integerPart}.${parts[1]}`;
  }
  return integerPart;
};

// Parse formatted string back to float
const parseNum = (val) => {
  if (!val) return 0;
  const cleaned = String(val).replace(/,/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

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

  const trimmedValue = (value || '').trim();

  const filtered = useMemo(() => {
    if (!trimmedValue) return products.slice(0, 8);
    const search = trimmedValue.toLowerCase();
    return products.filter(
      p => (p.name || '').toLowerCase().includes(search) || (p.sku && p.sku.toLowerCase().includes(search))
    ).slice(0, 8);
  }, [products, trimmedValue]);

  const selectedProduct = useMemo(() => {
    if (item.productId) return products.find(p => p.id === item.productId);
    return products.find(p => (p.name || '').toLowerCase() === trimmedValue.toLowerCase());
  }, [products, item.productId, trimmedValue]);

  const isExactMatch = useMemo(() => {
    if (!trimmedValue) return false;
    return products.some(p => (p.name || '').toLowerCase() === trimmedValue.toLowerCase());
  }, [products, trimmedValue]);

  const isNewProduct = Boolean(trimmedValue && !selectedProduct && !isExactMatch);

  return (
    <div ref={containerRef} className={`relative w-full space-y-1.5 ${isOpen ? 'z-50' : 'z-10'}`}>
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
            const typed = e.target.value;
            onChange(item.id, 'name', typed);
            const matched = products.find(p => (p.name || '').toLowerCase() === typed.trim().toLowerCase());
            if (matched) {
              onChange(item.id, 'productId', matched.id);
              const cost = matched.costPricePerKg ?? matched.costPrice ?? matched.sellingPricePerKg;
              if (cost !== undefined && cost !== null && !item.price) {
                onChange(item.id, 'price', formatWithCommas(cost));
              }
            } else {
              onChange(item.id, 'productId', null);
            }
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

      {/* Selected Product Context Badge or Auto-Save New Product Notice */}
      {selectedProduct ? (
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
      ) : isNewProduct ? (
        <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200/80 rounded-lg px-2.5 py-1 font-medium animate-in fade-in">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>✨ <strong>&ldquo;{trimmedValue}&rdquo;</strong> not in catalog — will automatically save to product DB</span>
        </div>
      ) : null}

      {/* Custom Autocomplete Dropdown Menu */}
      {isOpen && (filtered.length > 0 || isNewProduct) && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200/90 rounded-2xl shadow-2xl z-50 max-h-72 overflow-y-auto divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
          
          {/* Option to Add New Product to DB if not found */}
          {isNewProduct && (
            <div
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(item.id, 'productId', null);
                setIsOpen(false);
              }}
              className="p-3 bg-gradient-to-r from-emerald-50/90 to-teal-50/70 border-b border-emerald-100 flex items-center justify-between cursor-pointer hover:bg-emerald-100/60 transition-colors"
            >
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
                  +
                </div>
                <div>
                  <div className="font-bold text-sm text-emerald-950">
                    Add &ldquo;{trimmedValue}&rdquo; as New Product
                  </div>
                  <div className="text-[11px] text-emerald-700 font-medium">
                    Will automatically save to database catalog upon saving PO
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-200/90 text-emerald-900 px-2 py-0.5 rounded-full shrink-0">
                Auto-Create DB
              </span>
            </div>
          )}

          {filtered.length > 0 && (
            <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/90 sticky top-0 backdrop-blur-sm flex justify-between items-center">
              <span>Catalog Items ({filtered.length})</span>
              <span className="text-[10px] text-slate-400 font-normal">Click to apply</span>
            </div>
          )}

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
    <tr 
      style={{ position: 'relative', zIndex: totalItems - index }}
      className="group border-b border-slate-100 last:border-0 hover:bg-slate-50/40"
    >
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
            type="text"
            inputMode="decimal"
            placeholder="0"
            value={item.qty}
            onChange={(e) => {
              const sanitized = sanitizeDecimalInput(e.target.value);
              onChange(item.id, 'qty', sanitized);
            }}
            onBlur={() => {
              if (item.qty) {
                onChange(item.id, 'qty', formatWithCommas(item.qty));
              }
            }}
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
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={item.price}
            onChange={(e) => {
              const sanitized = sanitizeDecimalInput(e.target.value);
              onChange(item.id, 'price', sanitized);
            }}
            onBlur={() => {
              if (item.price) {
                onChange(item.id, 'price', formatWithCommas(item.price));
              }
            }}
            className="w-full pl-7 pr-9 py-2.5 bg-white border border-slate-200 hover:border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-xl outline-none transition-all font-bold text-right text-slate-800 text-sm shadow-sm"
          />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-medium text-slate-400 pointer-events-none">
            /kg
          </span>
        </div>
      </td>
      <td className="py-3 px-2 align-top text-right">
        <div className="py-2.5 px-4 font-bold text-slate-900 bg-slate-50/80 rounded-xl border border-slate-100 text-sm">
          ₹{((parseNum(item.qty)) * (parseNum(item.price))).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
  const location = useLocation();
  const { id: editId } = useParams();
  const isEditMode = Boolean(editId);

  const preselectedSupplier = location.state?.preselectedSupplier;

  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingPO, setIsLoadingPO] = useState(isEditMode);
  const [contacts, setContacts] = useState([]);
  const [products, setProducts] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [purchase, setPurchase] = useState(() => ({
    supplierId: preselectedSupplier?.id || '',
    supplierName: preselectedSupplier?.contactName || '',
    supplierCompany: preselectedSupplier?.companyName || '',
    supplierEmail: preselectedSupplier?.email || '',
    supplierPhone: preselectedSupplier?.phone || '',
    supplierAddress: preselectedSupplier?.address || '',
    supplierTaxNumber: preselectedSupplier?.taxNumber || '',
    payables: Number(preselectedSupplier?.payables || 0),
    receivables: Number(preselectedSupplier?.receivables || 0),
    ref: `PO-${new Date().getFullYear()}${Math.floor(100 + Math.random() * 900)}`,
    date: new Date().toISOString().split('T')[0],
    expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: '',
    status: 'ORDERED',
  }));

  const [items, setItems] = useState([
    { id: 1, productId: null, name: '', qty: '', price: '' }
  ]);

  const [discount, setDiscount] = useState('');
  const [taxPercent, setTaxPercent] = useState('');

  const [isLoadingContacts, setIsLoadingContacts] = useState(true);

  // Load Contacts and Products catalogs
  const loadData = useCallback(async () => {
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

  // Load PO for edit mode
  useEffect(() => {
    if (!editId) return;

    let isMounted = true;
    const fetchPOForEdit = async () => {
      setIsLoadingPO(true);
      setErrorMsg('');
      try {
        const res = await purchasesService.getById(editId);
        const po = res?.data || res;
        if (!po || (!po.id && !po.ref)) {
          setErrorMsg(`Purchase order "${editId}" could not be found`);
          return;
        }

        if (po.status === 'VOID' || po.status === 'CANCELLED') {
          setErrorMsg(`Purchase order ${po.ref} has been marked as ${po.status} and cannot be modified.`);
          return;
        }

        if (!isMounted) return;

        setPurchase({
          supplierId: po.supplierId || po.supplier?.id || '',
          supplierName: po.supplierName || po.supplier?.contactName || '',
          supplierCompany: po.supplierCompany || po.supplier?.companyName || '',
          supplierEmail: po.supplierEmail || po.supplier?.email || '',
          supplierPhone: po.supplierPhone || po.supplier?.phone || '',
          supplierAddress: po.supplierAddress || po.supplier?.address || '',
          supplierTaxNumber: po.supplierTaxNumber || po.supplier?.taxNumber || '',
          payables: Number(po.supplier?.payables ?? 0),
          receivables: Number(po.supplier?.receivables ?? 0),
          ref: po.ref,
          date: po.date ? String(po.date).split('T')[0] : new Date().toISOString().split('T')[0],
          expectedDeliveryDate: po.expectedDeliveryDate ? String(po.expectedDeliveryDate).split('T')[0] : '',
          notes: po.notes || '',
          status: po.status || 'ORDERED',
        });

        if (Array.isArray(po.items) && po.items.length > 0) {
          setItems(po.items.map((item, idx) => ({
            id: item.id || `item-${idx}-${Date.now()}`,
            dbId: item.id,
            productId: item.productId || null,
            name: item.name || item.product?.name || '',
            qty: formatWithCommas(item.orderedKg ?? item.qty ?? item.ordered ?? 1),
            price: formatWithCommas(item.unitPrice ?? item.price ?? 0),
          })));
        }

        setDiscount(po.discount ? formatWithCommas(po.discount) : '');
        setTaxPercent(po.taxPercent !== undefined && po.taxPercent !== null ? String(po.taxPercent) : '');
      } catch (err) {
        console.error('Failed to load purchase order for editing:', err);
        setErrorMsg(err?.response?.data?.message || err?.message || 'Failed to load purchase order details');
      } finally {
        if (isMounted) setIsLoadingPO(false);
      }
    };

    fetchPOForEdit();
    return () => { isMounted = false; };
  }, [editId]);

  const handleSelectContact = (target) => {
    if (!target) {
      setPurchase(prev => ({
        ...prev,
        supplierId: '',
        supplierName: '',
        supplierCompany: '',
        supplierEmail: '',
        supplierPhone: '',
        supplierAddress: '',
        supplierTaxNumber: '',
        payables: 0,
        receivables: 0,
      }));
      return;
    }

    const contactId = target?.id || target?.code || target?.target?.value || (typeof target === 'string' ? target : null);
    const selected = (typeof target === 'object' && target?.id) ? target : contacts.find(c => c.id === contactId || c.code === contactId);
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
        return { ...item, [field]: value };
      }
      return item;
    }));
  }, []);

  const handleProductSelect = useCallback((id, product) => {
    setItems(prevItems => prevItems.map(item => {
      if (item.id === id) {
        const cost = product.costPricePerKg ?? product.costPrice ?? product.sellingPricePerKg ?? '';
        return {
          ...item,
          productId: product.id,
          name: product.name,
          price: cost !== '' && cost !== null ? formatWithCommas(cost) : item.price,
        };
      }
      return item;
    }));
  }, []);

  const addItem = useCallback(() => {
    setItems(prev => [...prev, { id: Date.now(), productId: null, name: '', qty: '', price: '' }]);
  }, []);

  const removeItem = useCallback((id) => {
    setItems(prev => prev.length > 1 ? prev.filter(item => item.id !== id) : prev);
  }, []);

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const q = parseNum(item.qty);
      const p = parseNum(item.price);
      return sum + (q * p);
    }, 0);
  }, [items]);

  const discVal = parseNum(discount);
  const taxVal = parseNum(taxPercent);
  const taxAmount = useMemo(() => Math.max(0, (subtotal - discVal) * (taxVal / 100)), [subtotal, discVal, taxVal]);
  const total = useMemo(() => Math.max(0, subtotal - discVal + taxAmount), [subtotal, discVal, taxAmount]);

  const handleSubmit = async (targetStatus) => {
    setErrorMsg('');
    if (!purchase.supplierId && !purchase.supplierName) {
      setErrorMsg("Please select a supplier or contact");
      return;
    }
    if (items.some(i => !i.name || !i.name.trim())) {
      setErrorMsg("Please ensure all line items have a product or material description");
      return;
    }

    const payload = {
      ref: purchase.ref,
      supplierId: purchase.supplierId || null,
      supplierName: purchase.supplierName || selectedContact?.contactName || selectedContact?.companyName || 'Supplier',
      supplierCompany: purchase.supplierCompany || selectedContact?.companyName || null,
      supplierEmail: purchase.supplierEmail || selectedContact?.email || null,
      supplierPhone: purchase.supplierPhone || selectedContact?.phone || null,
      supplierAddress: purchase.supplierAddress || selectedContact?.address || null,
      date: purchase.date,
      expectedDeliveryDate: purchase.expectedDeliveryDate || null,
      status: targetStatus || purchase.status || 'ORDERED',
      discount: parseNum(discount),
      taxPercent: parseNum(taxPercent),
      notes: purchase.notes || null,
      items: items.map(item => ({
        id: item.dbId || (typeof item.id === 'string' && !item.id.startsWith('item-') ? item.id : undefined),
        productId: item.productId || null,
        name: item.name.trim(),
        orderedKg: parseNum(item.qty) || 1,
        unitPrice: parseNum(item.price) || 0,
      })),
    };

    setIsSubmitting(true);
    try {
      let res;
      if (isEditMode) {
        res = await purchasesService.update(editId, payload);
      } else {
        res = await purchasesService.create(payload);
      }

      if (res?.success) {
        navigate(`/purchases/${res.data?.ref || purchase.ref || editId}`);
      } else {
        setErrorMsg(res?.message || `Failed to ${isEditMode ? 'update' : 'create'} purchase order`);
      }
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} purchase order:`, error);
      setErrorMsg(error?.response?.data?.message || error?.message || 'Failed to save purchase order to database');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isEditMode && isLoadingPO) {
    return (
      <div className="max-w-7xl mx-auto py-24 text-center">
        <div className="inline-flex items-center justify-center p-4 bg-orange-50 text-orange-600 rounded-2xl mb-4 shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
        <h3 className="text-xl font-bold text-slate-800">Loading Purchase Order...</h3>
        <p className="text-sm text-slate-500 mt-1 font-medium">Retrieving order details for {editId}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto fade-in px-4 sm:px-0 pb-12">
      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 font-semibold flex items-center justify-between shadow-sm">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="text-red-500 hover:text-red-700 font-bold text-lg">&times;</button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center space-x-4">
          <Link 
            to={isEditMode ? `/purchases/${purchase.ref || editId}` : "/purchases"} 
            className="p-2.5 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-colors shadow-sm text-slate-600 hover:text-orange-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                {isEditMode ? 'Edit Purchase Order' : 'New Purchase Order'}
              </h1>
              {isEditMode && (
                <span className="font-mono text-orange-600 bg-orange-50 border border-orange-200/80 px-2.5 py-1 rounded-xl text-sm font-black shadow-xs">
                  {purchase.ref}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-1 font-medium">
              {isEditMode 
                ? 'Update purchase order details, supplier, items, pricing, or delivery dates'
                : 'Create a new purchase order for any contact/supplier and track inventory'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button 
            type="button"
            disabled={isSubmitting}
            onClick={() => navigate(isEditMode ? `/purchases/${purchase.ref || editId}` : '/purchases')}
            className="px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          
          {isEditMode ? (
            purchase.status === 'DRAFT' ? (
              <>
                <button 
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSubmit('DRAFT')}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : 'Update Draft'}
                </button>
                <button 
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSubmit('ORDERED')}
                  className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-sm shadow-orange-200 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Confirming...' : 'Confirm Order'}
                </button>
              </>
            ) : (
              <button 
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSubmit(purchase.status || 'ORDERED')}
                className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-sm shadow-orange-200 transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                <Edit3 className="w-4 h-4" />
                <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
              </button>
            )
          ) : (
            <>
              <button 
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSubmit('DRAFT')}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-sm shadow-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Saving...' : 'Save as Draft'}
              </button>
              <button 
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSubmit('ORDERED')}
                className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-sm shadow-orange-200 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Confirming...' : 'Confirm Order'}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="glass-card bg-white rounded-3xl shadow-xl border border-slate-100">
        {/* Top Details Section */}
        <div className="p-8 border-b border-slate-100 bg-white">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:items-start">
            
            {/* Contact / Supplier Selection & Details */}
            <div className="lg:col-span-6">
              <CompactContactSelector
                label="Supplier / Contact *"
                contacts={contacts}
                selectedContact={selectedContact}
                onSelect={handleSelectContact}
                onClear={() => handleSelectContact(null)}
                onAddNew={() => setShowSupplierModal(true)}
                theme="orange"
                placeholder="Search supplier by name, company, phone..."
                isLoading={isLoadingContacts}
              />
            </div>

            {/* PO Metadata Side */}
            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">PO No.</label>
                <div className="flex items-center text-slate-800 font-bold h-[50px] bg-slate-50 px-3 rounded-xl border border-slate-200">
                  <FileText className="w-4 h-4 text-orange-400 mr-2 shrink-0" />
                  <span className="truncate">{purchase.ref}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">PO Date</label>
                <div className="flex items-center text-slate-700 font-medium h-[50px] bg-slate-50 px-3 rounded-xl border border-slate-200">
                  <Calendar className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
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
          <div className="overflow-visible min-h-[260px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="py-3 px-2 text-xs font-bold text-slate-500 uppercase tracking-wider w-1/2">Product / Raw Material (Kg)</th>
                  <th className="py-3 px-2 text-xs font-bold text-slate-500 uppercase tracking-wider w-32 text-center">Qty (Kg)</th>
                  <th className="py-3 px-2 text-xs font-bold text-slate-500 uppercase tracking-wider w-40 text-right">Cost Price / Kg</th>
                  <th className="py-3 px-2 text-xs font-bold text-slate-500 uppercase tracking-wider w-40 text-right">Amount</th>
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
            type="button"
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
              <span className="font-bold text-slate-800">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            
            <div className="flex justify-between items-center text-slate-600">
              <span className="font-medium">Discount (₹)</span>
              <div className="relative w-36">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium pointer-events-none text-xs">₹</span>
                <input 
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={discount}
                  onChange={(e) => {
                    const sanitized = sanitizeDecimalInput(e.target.value);
                    setDiscount(sanitized);
                  }}
                  onBlur={() => {
                    if (discount) setDiscount(formatWithCommas(discount));
                  }}
                  className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-right font-bold focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm transition-all"
                />
              </div>
            </div>

            <div className="flex justify-between items-center text-slate-600">
              <span className="font-medium">Tax (%)</span>
              <div className="relative w-36">
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium pointer-events-none text-xs">%</span>
                <input 
                  type="text"
                  inputMode="decimal"
                  placeholder="0"
                  value={taxPercent}
                  onChange={(e) => {
                    const sanitized = sanitizeDecimalInput(e.target.value);
                    setTaxPercent(sanitized);
                  }}
                  className="w-full pr-7 pl-3 py-1.5 bg-white border border-slate-200 rounded-xl text-right font-bold focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm transition-all"
                />
              </div>
            </div>

            <div className="pt-4 border-t-2 border-slate-200 flex justify-between items-center">
              <span className="text-lg font-black text-slate-800">Total</span>
              <span className="text-2xl font-black text-orange-600">₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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
