import { useState } from 'react';
import { ArrowLeft, CheckCircle2, Save, Package } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import purchasesData from '../../db/purchases.json';
import contactsData from '../../db/contacts.json';

export default function CreateGRN() {
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
      currentReceive: 0 // Default to 0, user decides
    }))
  );

  const handleReceiveChange = (id, val) => {
    let num = Number(val) || 0;
    const item = items.find(i => i.id === id);
    const remaining = item.ordered - item.received;
    
    if (num > remaining) num = remaining;
    if (num < 0) num = 0;

    setItems(items.map(i => i.id === id ? { ...i, currentReceive: num } : i));
  };

  const handleConfirm = () => {
    // In-memory mutation for the prototype
    let receivedAnything = false;
    
    items.forEach(item => {
      if (item.currentReceive > 0) {
        receivedAnything = true;
      }
    });

    if (!receivedAnything) {
      alert("Please enter a receiving quantity greater than 0 for at least one item.");
      return;
    }

    let totalReceivedNow = 0;
    
    items.forEach(item => {
      if (item.currentReceive > 0) {
        const poItem = purchase.items.find(i => i.id === item.id);
        if (poItem) {
          poItem.received += item.currentReceive;
          totalReceivedNow += item.currentReceive;
        }
      }
    });

    if (totalReceivedNow > 0) {
      if (!purchase.receipts) purchase.receipts = [];
      
      // If there's already mock received data but no receipts array, initialize it first
      if (purchase.receipts.length === 0 && purchase.items.some(i => i.received > 0) && purchase.items.some(i => i.received - (items.find(it => it.id === i.id)?.currentReceive || 0) > 0)) {
        const pastReceived = purchase.items.reduce((acc, i) => acc + (i.received - (items.find(it => it.id === i.id)?.currentReceive || 0)), 0);
        purchase.receipts.push({
          id: `GRN-${purchase.ref.split('-').pop()}-01`,
          date: purchase.date,
          itemsReceived: pastReceived,
          status: 'Completed'
        });
      }

      purchase.receipts.push({
        id: `GRN-${purchase.ref.split('-').pop()}-${String(purchase.receipts.length + 1).padStart(2, '0')}`,
        date: new Date().toISOString().split('T')[0],
        itemsReceived: totalReceivedNow,
        status: 'Completed'
      });
    }

    if (receivedAnything) {
      const allReceived = purchase.items.every(i => i.received >= i.ordered);
      if (allReceived && purchase.status !== 'COMPLETED') {
          purchase.status = 'PENDING PAYMENT';
      } else if (purchase.status !== 'COMPLETED' && purchase.status !== 'PENDING PAYMENT') {
          purchase.status = 'PARTIALLY RECEIVED';
      }
    }

    navigate(`/purchases/${purchase.ref}`);
  };

  return (
    <div className="max-w-5xl mx-auto fade-in px-4 sm:px-0 pb-12">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate(-1)} className="p-2.5 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-colors shadow-sm text-slate-600 hover:text-orange-600">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Receive Goods</h1>
            <p className="text-sm text-slate-500 mt-1 font-medium">Create a Goods Receipt Note (GRN) for {purchase.ref}</p>
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
            className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-sm shadow-orange-200 transition-colors flex items-center"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Confirm Receipt
          </button>
        </div>
      </div>

      <div className="glass-card bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-orange-50/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Supplier Details</label>
              <h3 className="font-bold text-slate-800 text-lg">{supplier.companyName || supplier.company}</h3>
              <p className="text-sm text-slate-600">{supplier.contactName || supplier.name}</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Delivery Note / Reference</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Package className="w-4 h-4 text-slate-400 group-focus-within:text-orange-500" />
                </div>
                <input type="text" placeholder="Enter supplier's delivery note number" className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all shadow-sm" />
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
                  <th className="pb-4 font-bold text-slate-500 uppercase tracking-wider text-center">Ordered</th>
                  <th className="pb-4 font-bold text-slate-400 uppercase tracking-wider text-center text-xs">Prev. Rec'd</th>
                  <th className="pb-4 font-bold text-slate-400 uppercase tracking-wider text-center text-xs">Remaining</th>
                  <th className="pb-4 font-bold text-orange-600 uppercase tracking-wider text-center w-32">Receiving Now</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => {
                  const remaining = item.ordered - item.received;
                  return (
                  <tr key={item.id} className="group hover:bg-slate-50 transition-colors">
                    <td className="py-4 pr-4">
                      <div className="font-bold text-slate-800">{item.name}</div>
                    </td>
                    <td className="py-4 px-2 text-center font-bold text-slate-800">{item.ordered}</td>
                    <td className="py-4 px-2 text-center text-slate-400 font-medium">{item.received}</td>
                    <td className="py-4 px-2 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold ${remaining === 0 ? 'bg-slate-100 text-slate-400' : 'bg-orange-50 text-orange-600'}`}>
                        {remaining}
                      </span>
                    </td>
                    <td className="py-4 pl-2 text-center">
                      <input 
                        type="number" 
                        min="0"
                        max={remaining}
                        value={item.currentReceive}
                        onChange={(e) => handleReceiveChange(item.id, e.target.value)}
                        disabled={remaining === 0}
                        className="w-full px-2 py-2 bg-white border border-slate-200 focus:border-orange-500 rounded-xl outline-none transition-all font-bold text-center text-slate-800 shadow-sm disabled:bg-slate-50 disabled:text-slate-400"
                      />
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
