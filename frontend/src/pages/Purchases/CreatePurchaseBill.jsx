import { useState } from 'react';
import { ArrowLeft, Save, FileText, Calendar } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import purchasesData from '../../db/purchases.json';
import contactsData from '../../db/contacts.json';

export default function CreatePurchaseBill() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const poRef = searchParams.get('po');

  const purchase = purchasesData.find(p => p.ref === poRef) || purchasesData[0];
  
  const getCompany = (supplierId) => {
    if (!supplierId) return null;
    const digit = supplierId.split('-')[1];
    return contactsData.find(c => c.id === `CONT-${digit}`);
  };
  const supplier = getCompany(purchase.supplierId) || contactsData[0];

  const [items, setItems] = useState(() => 
    (purchase.items || []).map(item => ({
      ...item,
      toBill: Math.max(0, item.received - item.billed)
    }))
  );

  const handleBillChange = (id, val) => {
    let num = Number(val) || 0;
    const item = items.find(i => i.id === id);
    const unbilled = item.received - item.billed;
    
    if (num > unbilled) num = unbilled;
    if (num < 0) num = 0;

    setItems(items.map(i => i.id === id ? { ...i, toBill: num } : i));
  };

  const handleConfirm = () => {
    let billedAnything = false;
    
    items.forEach(item => {
      if (item.toBill > 0) {
        billedAnything = true;
      }
    });

    if (!billedAnything) {
      alert("Please enter a billing quantity greater than 0 for at least one item.");
      return;
    }

    let totalBilledNow = 0;

    items.forEach(item => {
      if (item.toBill > 0) {
        const poItem = purchase.items.find(i => i.id === item.id);
        if (poItem) {
          poItem.billed += item.toBill;
          totalBilledNow += (item.toBill * item.price);
        }
      }
    });

    if (totalBilledNow > 0) {
      if (!purchase.bills) purchase.bills = [];
      
      // Initialize past mock bill if needed
      if (purchase.bills.length === 0 && purchase.items.some(i => i.billed > 0) && purchase.items.some(i => i.billed - (items.find(it => it.id === i.id)?.toBill || 0) > 0)) {
        const pastBilled = purchase.items.reduce((acc, i) => acc + ((i.billed - (items.find(it => it.id === i.id)?.toBill || 0)) * i.price), 0);
        purchase.bills.push({
          id: `BILL-${purchase.ref.split('-').pop()}-01`,
          date: purchase.date,
          amount: pastBilled * 1.05,
          status: 'Unpaid'
        });
      }

      purchase.bills.push({
        id: `BILL-${purchase.ref.split('-').pop()}-${String(purchase.bills.length + 1).padStart(2, '0')}`,
        date: new Date().toISOString().split('T')[0],
        amount: totalBilledNow * 1.05,
        status: 'Unpaid'
      });

      const allBilled = purchase.items.every(i => i.billed >= i.ordered);
      const allReceived = purchase.items.every(i => i.received >= i.ordered);
      
      if (allBilled && allReceived) {
          purchase.status = 'CLOSED';
      }
    }

    navigate(`/purchases/${purchase.ref}`);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const currentSubtotal = items.reduce((acc, item) => acc + (item.toBill * item.price), 0);
  const tax = currentSubtotal * 0.05;
  const currentTotal = currentSubtotal + tax;

  return (
    <div className="max-w-6xl mx-auto fade-in px-4 sm:px-0 pb-12">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate(-1)} className="p-2.5 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-colors shadow-sm text-slate-600 hover:text-indigo-600">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Create Purchase Bill</h1>
            <p className="text-sm text-slate-500 mt-1 font-medium">Record a supplier invoice against {purchase.ref}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl shadow-sm transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleConfirm}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm shadow-indigo-200 transition-colors flex items-center"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Bill
          </button>
        </div>
      </div>

      <div className="glass-card bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-indigo-50/30">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Supplier Details</label>
              <h3 className="font-bold text-slate-800 text-lg">{supplier.companyName || supplier.company}</h3>
              <p className="text-sm text-slate-600">{supplier.contactName || supplier.name}</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Supplier Invoice Number</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FileText className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-500" />
                </div>
                <input type="text" placeholder="e.g. INV-9902" className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Bill Date</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-500" />
                </div>
                <input type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm" />
              </div>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="pb-4 font-bold text-slate-500 uppercase tracking-wider">Product</th>
                  <th className="pb-4 font-bold text-slate-500 uppercase tracking-wider text-center">Received</th>
                  <th className="pb-4 font-bold text-slate-500 uppercase tracking-wider text-center">Prev. Billed</th>
                  <th className="pb-4 font-bold text-slate-500 uppercase tracking-wider text-center">Unbilled</th>
                  <th className="pb-4 font-bold text-slate-500 uppercase tracking-wider text-right">Unit Price</th>
                  <th className="pb-4 font-bold text-indigo-600 uppercase tracking-wider text-center w-32">Billing Qty</th>
                  <th className="pb-4 font-bold text-indigo-600 uppercase tracking-wider text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => {
                  const unbilled = item.received - item.billed;
                  return (
                  <tr key={item.id} className="group hover:bg-slate-50 transition-colors">
                    <td className="py-4 pr-4">
                      <div className="font-bold text-slate-800">{item.name}</div>
                    </td>
                    <td className="py-4 px-2 text-center font-bold text-slate-600">{item.received}</td>
                    <td className="py-4 px-2 text-center font-bold text-slate-600">{item.billed}</td>
                    <td className="py-4 px-2 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${unbilled === 0 ? 'bg-slate-100 text-slate-500' : 'bg-indigo-100 text-indigo-700'}`}>
                        {unbilled}
                      </span>
                    </td>
                    <td className="py-4 px-2 text-right font-bold text-slate-800">{formatCurrency(item.price)}</td>
                    <td className="py-4 px-2 text-center">
                      {unbilled > 0 ? (
                        <input 
                          type="number" 
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
                      {formatCurrency(item.toBill * item.price)}
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
                <span className="font-medium">VAT (5%)</span>
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
