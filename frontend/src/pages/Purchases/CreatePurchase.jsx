import { useState } from 'react';
import { ArrowLeft, Plus, Trash2, Calendar, FileText, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import contactsData from '../../db/contacts.json';
import purchasesData from '../../db/purchases.json';
import { CustomerModal } from '../Contacts/components/CustomerModal';

export default function CreatePurchase() {
  const navigate = useNavigate();
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  
  const [purchase, setPurchase] = useState(() => ({
    supplierId: '',
    ref: `PO-${new Date().getFullYear()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
    date: new Date().toISOString().split('T')[0],
    expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: ''
  }));

  const [items, setItems] = useState([
    { id: 1, name: '', qty: 1, price: 0 }
  ]);

  const [discount, setDiscount] = useState(0);
  const [taxPercent, setTaxPercent] = useState(0);

  const handleItemChange = (id, field, value) => {
    setItems(items.map(item => {
      if (item.id === id) {
        return { ...item, [field]: field === 'qty' || field === 'price' ? Number(value) : value };
      }
      return item;
    }));
  };

  const addItem = () => {
    setItems([...items, { id: Date.now(), name: '', qty: 1, price: 0 }]);
  };

  const removeItem = (id) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const subtotal = items.reduce((sum, item) => sum + (item.qty * item.price), 0);
  const taxAmount = (subtotal - discount) * (taxPercent / 100);
  const total = subtotal - discount + taxAmount;

  const handleSubmit = (status) => {
    // Basic validation
    if (!purchase.supplierId) {
      alert("Please select a supplier");
      return;
    }
    if (items.some(i => !i.name.trim())) {
      alert("Please ensure all items have a name");
      return;
    }

    const newPO = {
      id: Date.now(),
      ref: purchase.ref,
      supplierId: purchase.supplierId,
      date: purchase.date,
      expectedDeliveryDate: purchase.expectedDeliveryDate,
      status: status,
      amount: total,
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        ordered: item.qty,
        price: item.price,
        received: 0,
        billed: 0
      })),
      notes: purchase.notes,
      receipts: [],
      bills: [],
      payments: []
    };
    
    // Add to the front of the list
    purchasesData.unshift(newPO);
    
    navigate('/purchases');
  };

  return (
    <div className="max-w-7xl mx-auto fade-in px-4 sm:px-0 pb-12">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link to="/purchases" className="p-2.5 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-colors shadow-sm text-slate-600 hover:text-orange-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">New Purchase Order</h1>
            <p className="text-sm text-slate-500 mt-1 font-medium">Create a new purchase order for a supplier</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => navigate('/purchases')}
            className="px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl shadow-sm transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => handleSubmit('DRAFT')}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-sm shadow-slate-200 transition-colors"
          >
            Save as Draft
          </button>
          <button 
            onClick={() => handleSubmit('ORDERED')}
            className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-sm shadow-orange-200 transition-colors"
          >
            Confirm Order
          </button>
        </div>
      </div>

      <div className="glass-card bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        {/* Top Details Section */}
        <div className="p-8 border-b border-slate-100 bg-white">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:items-start">
            {/* Supplier Details */}
            <div className="lg:col-span-5 space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Supplier</label>
              <div className="flex gap-2">
                <div className="relative group flex-1">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="w-5 h-5 text-orange-400 group-focus-within:text-orange-600 transition-colors" />
                  </div>
                  <select 
                    value={purchase.supplierId}
                    onChange={(e) => setPurchase({...purchase, supplierId: e.target.value})}
                    className="w-full pl-12 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all cursor-pointer shadow-sm appearance-none"
                  >
                    <option value="" disabled className="font-normal text-slate-400">Select a supplier...</option>
                    {contactsData.map(c => (
                      <option key={c.id} value={`CONT-${c.id.split('-')[1]}`}>{c.contactName || c.name} ({c.companyName || c.company})</option>
                    ))}
                  </select>
                </div>
                <button 
                  onClick={() => setShowSupplierModal(true)}
                  className="flex items-center justify-center w-[50px] h-[50px] bg-orange-50 text-orange-600 hover:bg-orange-100 hover:text-orange-700 rounded-xl transition-colors border border-orange-100 flex-shrink-0 shadow-sm"
                  title="Add New Supplier"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* PO Meta */}
            <div className="lg:col-span-3 space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">PO No.</label>
              <div className="flex items-center text-slate-800 font-bold h-[50px]">
                <FileText className="w-4 h-4 text-orange-400 mr-2.5" />
                {purchase.ref}
              </div>
            </div>
            
            <div className="lg:col-span-2 space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">PO Date</label>
              <div className="flex items-center text-slate-700 font-medium h-[50px]">
                <Calendar className="w-4 h-4 text-slate-400 mr-2.5" />
                {purchase.date}
              </div>
            </div>

            <div className="lg:col-span-2 space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Expected Delivery</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="w-4 h-4 text-orange-400 group-focus-within:text-orange-500" />
                </div>
                <input type="date" value={purchase.expectedDeliveryDate} onChange={(e) => setPurchase({...purchase, expectedDeliveryDate: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all shadow-sm" />
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
                  <th className="py-3 px-2 text-xs font-bold text-slate-500 uppercase tracking-wider w-1/2">Product / Service</th>
                  <th className="py-3 px-2 text-xs font-bold text-slate-500 uppercase tracking-wider w-24 text-center">Qty</th>
                  <th className="py-3 px-2 text-xs font-bold text-slate-500 uppercase tracking-wider w-32 text-right">Unit Price</th>
                  <th className="py-3 px-2 text-xs font-bold text-slate-500 uppercase tracking-wider w-32 text-right">Amount</th>
                  <th className="py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item.id} className="group">
                    <td className="py-3 px-2">
                      <input 
                        type="text" 
                        value={item.name}
                        onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                        className="w-full px-4 py-2.5 bg-transparent border border-transparent hover:bg-slate-50 hover:border-slate-200 focus:bg-white focus:border-orange-500 rounded-xl outline-none transition-all font-medium text-slate-800"
                      />
                    </td>
                    <td className="py-3 px-2">
                      <input 
                        type="number" 
                        min="1"
                        value={item.qty}
                        onChange={(e) => handleItemChange(item.id, 'qty', e.target.value)}
                        className="w-full px-2 py-2.5 bg-transparent border border-transparent hover:bg-slate-50 hover:border-slate-200 focus:bg-white focus:border-orange-500 rounded-xl outline-none transition-all font-medium text-center text-slate-800"
                      />
                    </td>
                    <td className="py-3 px-2 relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium pointer-events-none">₹</span>
                      <input 
                        type="number" 
                        min="0"
                        value={item.price}
                        onChange={(e) => handleItemChange(item.id, 'price', e.target.value)}
                        className="w-full pl-8 pr-2 py-2.5 bg-transparent border border-transparent hover:bg-slate-50 hover:border-slate-200 focus:bg-white focus:border-orange-500 rounded-xl outline-none transition-all font-medium text-right text-slate-800"
                      />
                    </td>
                    <td className="py-3 px-2 text-right">
                      <div className="py-2.5 px-4 font-bold text-slate-800 bg-slate-50/50 rounded-xl border border-slate-100">
                        ₹{(item.qty * item.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                    </td>
                    <td className="py-3 pl-2 text-right">
                      <button 
                        onClick={() => removeItem(item.id)}
                        className="p-2.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                        disabled={items.length === 1}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button 
            onClick={addItem}
            className="mt-4 flex items-center text-sm font-bold text-orange-600 hover:text-orange-800 hover:bg-orange-50 px-4 py-2.5 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Another Item
          </button>
        </div>

        {/* Totals Section */}
        <div className="p-8 bg-slate-50 border-t border-slate-100 flex flex-col md:flex-row justify-between items-start gap-8">
          <div className="w-full md:w-1/2 space-y-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Internal Notes / Terms</label>
            <textarea 
              rows="3" 
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all resize-none shadow-sm"
              value={purchase.notes}
              onChange={(e) => setPurchase({...purchase, notes: e.target.value})}
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
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
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
                  value={taxPercent}
                  onChange={(e) => setTaxPercent(Number(e.target.value))}
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
        <CustomerModal isOpen={showSupplierModal} onClose={() => setShowSupplierModal(false)} />
      )}
    </div>
  );
}
