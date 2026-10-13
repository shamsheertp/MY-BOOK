import { useState, useEffect } from 'react';
import { ArrowLeft, Save, FileText, Calendar } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { purchasesService } from '../../services/api';
import purchasesData from '../../db/purchases.json';

export default function CreatePurchaseBill() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const poRef = searchParams.get('po');

  const [purchase, setPurchase] = useState(() => {
    return purchasesData.find(p => p.ref === poRef) || purchasesData[0] || {};
  });
  const [items, setItems] = useState([]);
  const [supplierInvoiceNo, setSupplierInvoiceNo] = useState('');
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!poRef) return;
    let isMounted = true;
    purchasesService.getById(poRef)
      .then((res) => {
        if (isMounted && res?.data) {
          const p = res.data;
          setPurchase(p);
          const mappedItems = (p.items || []).map((item) => {
            const received = Number(item.receivedKg ?? item.received ?? 0);
            const billed = Number(item.billedKg ?? item.billed ?? 0);
            const unbilled = Math.max(0, received - billed);
            return {
              ...item,
              received,
              billed,
              price: Number(item.unitPrice ?? item.price ?? 0),
              toBill: unbilled, // default suggest all unbilled received items
            };
          });
          setItems(mappedItems);
        }
      })
      .catch((err) => {
        console.warn('Falling back to local cache for PO:', err);
        const p = purchasesData.find(item => item.ref === poRef) || purchasesData[0];
        setPurchase(p);
        setItems((p.items || []).map(i => ({
          ...i,
          received: Number(i.received || 0),
          billed: Number(i.billed || 0),
          price: Number(i.price || 0),
          toBill: Math.max(0, Number(i.received || 0) - Number(i.billed || 0)),
        })));
      });

    return () => { isMounted = false; };
  }, [poRef]);

  const supplier = purchase.supplier || {
    contactName: purchase.supplierName || 'Supplier',
    companyName: purchase.supplierCompany || '',
  };

  const handleBillChange = (id, val) => {
    let num = Number(val) || 0;
    const item = items.find(i => i.id === id);
    if (!item) return;
    const unbilled = Math.max(0, item.received - item.billed);
    
    if (num > unbilled) num = unbilled;
    if (num < 0) num = 0;

    setItems(items.map(i => i.id === id ? { ...i, toBill: num } : i));
  };

  const handleConfirm = async () => {
    setErrorMsg('');
    const toBillItems = items.filter(i => (Number(i.toBill) || 0) > 0);

    if (toBillItems.length === 0) {
      setErrorMsg("Please enter a billing quantity greater than 0 for at least one received item.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ref: supplierInvoiceNo.trim() || undefined,
        date: billDate,
        dueDate: dueDate || null,
        items: toBillItems.map(i => ({
          id: i.id,
          name: i.name,
          currentBillKg: Number(i.toBill),
        })),
      };

      const res = await purchasesService.createBill(purchase.id || purchase.ref, payload);
      if (res?.success) {
        navigate(`/purchases/${purchase.ref || purchase.id}`);
      } else {
        setErrorMsg(res?.message || 'Failed to record purchase bill');
      }
    } catch (err) {
      console.error('Error creating purchase bill:', err);
      setErrorMsg(err?.response?.data?.message || err?.message || 'Failed to save Purchase Bill to database');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const currentSubtotal = items.reduce((acc, item) => acc + ((Number(item.toBill) || 0) * (Number(item.price) || 0)), 0);
  const taxRate = Number(purchase.taxPercent || 5) / 100;
  const tax = currentSubtotal * taxRate;
  const currentTotal = currentSubtotal + tax;

  return (
    <div className="max-w-6xl mx-auto fade-in px-4 sm:px-0 pb-12">
      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 font-semibold flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="text-red-500 hover:text-red-700 font-bold">&times;</button>
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate(-1)} className="p-2.5 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-colors shadow-sm text-slate-600 hover:text-indigo-600">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Create Purchase Bill</h1>
            <p className="text-sm text-slate-500 mt-1 font-medium">Record a supplier bill against {purchase.ref} & increment accounts payable</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button 
            disabled={isSubmitting}
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl shadow-sm transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            disabled={isSubmitting}
            onClick={handleConfirm}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm shadow-indigo-200 transition-colors flex items-center disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Saving...' : 'Save Bill to Ledger'}
          </button>
        </div>
      </div>

      <div className="glass-card bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-indigo-50/30">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Supplier Details</label>
              <h3 className="font-bold text-slate-800 text-lg">{supplier.companyName || supplier.company || purchase.supplierCompany || purchase.supplierName}</h3>
              <p className="text-sm text-slate-600">{supplier.contactName || supplier.name || purchase.supplierName}</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Supplier Invoice Number</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FileText className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-500" />
                </div>
                <input 
                  type="text" 
                  value={supplierInvoiceNo}
                  onChange={(e) => setSupplierInvoiceNo(e.target.value)}
                  placeholder="e.g. BILL-001 or INV-9902" 
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm" 
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Bill Date</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-500" />
                </div>
                <input 
                  type="date" 
                  value={billDate} 
                  onChange={(e) => setBillDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm" 
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="pb-4 font-bold text-slate-500 uppercase tracking-wider">Product / Material</th>
                  <th className="pb-4 font-bold text-slate-500 uppercase tracking-wider text-center">Received (Kg)</th>
                  <th className="pb-4 font-bold text-slate-500 uppercase tracking-wider text-center">Prev. Billed (Kg)</th>
                  <th className="pb-4 font-bold text-slate-500 uppercase tracking-wider text-center">Unbilled (Kg)</th>
                  <th className="pb-4 font-bold text-slate-500 uppercase tracking-wider text-right">Unit Price</th>
                  <th className="pb-4 font-bold text-indigo-600 uppercase tracking-wider text-center w-36">Billing Qty (Kg)</th>
                  <th className="pb-4 font-bold text-indigo-600 uppercase tracking-wider text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => {
                  const unbilled = Math.max(0, item.received - item.billed);
                  return (
                  <tr key={item.id} className="group hover:bg-slate-50 transition-colors">
                    <td className="py-4 pr-4">
                      <div className="font-bold text-slate-800">{item.name}</div>
                    </td>
                    <td className="py-4 px-2 text-center font-bold text-slate-600">{item.received} kg</td>
                    <td className="py-4 px-2 text-center font-bold text-slate-600">{item.billed} kg</td>
                    <td className="py-4 px-2 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${unbilled === 0 ? 'bg-slate-100 text-slate-500' : 'bg-indigo-100 text-indigo-700'}`}>
                        {unbilled} kg
                      </span>
                    </td>
                    <td className="py-4 px-2 text-right font-bold text-slate-800">{formatCurrency(item.price)}</td>
                    <td className="py-4 px-2 text-center">
                      {unbilled > 0 ? (
                        <input 
                          type="number" 
                          step="any"
                          min="0"
                          max={unbilled}
                          value={item.toBill}
                          onChange={(e) => handleBillChange(item.id, e.target.value)}
                          className="w-full px-2 py-2 bg-white border border-slate-200 focus:border-indigo-500 rounded-xl outline-none transition-all font-bold text-center text-slate-800 shadow-sm"
                        />
                      ) : (
                        <span className="text-xs font-bold text-slate-400 uppercase">Fully Billed</span>
                      )}
                    </td>
                    <td className="py-4 pl-4 text-right font-bold text-indigo-600">
                      {formatCurrency((Number(item.toBill) || 0) * item.price)}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-8 flex flex-col md:flex-row justify-end items-start gap-8 border-t border-slate-100 pt-8">
            <div className="w-full md:w-80 space-y-3">
              <div className="flex justify-between text-slate-600">
                <span className="font-medium">Subtotal</span>
                <span className="font-bold text-slate-800">{formatCurrency(currentSubtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span className="font-medium">Tax ({Number(purchase.taxPercent || 5)}%)</span>
                <span className="font-bold text-slate-800">{formatCurrency(tax)}</span>
              </div>
              <div className="pt-3 border-t-2 border-slate-200 flex justify-between items-center">
                <span className="text-lg font-black text-slate-800">Bill Total</span>
                <span className="text-2xl font-black text-indigo-600">{formatCurrency(currentTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
