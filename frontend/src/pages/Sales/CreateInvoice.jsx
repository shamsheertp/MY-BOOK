import { useState } from 'react';
import { ArrowLeft, Plus, Trash2, Calendar, FileText, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import contactsData from '../../db/contacts.json';
import { CustomerModal } from '../Contacts/components/CustomerModal';

export default function CreateInvoice() {
  const navigate = useNavigate();
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  
  const [invoice, setInvoice] = useState(() => ({
    customerId: '',
    ref: `SALE-${new Date().getFullYear()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
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

  return (
    <div className="max-w-7xl mx-auto fade-in px-4 sm:px-0 pb-12">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link to="/sales" className="p-2.5 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-colors shadow-sm text-slate-600 hover:text-indigo-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">New Invoice</h1>
            <p className="text-sm text-slate-500 mt-1 font-medium">Create and issue a new sales invoice</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => navigate('/sales')}
            className="px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl shadow-sm transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => navigate('/sales/6')}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-sm shadow-slate-200 transition-colors"
          >
            Save as Draft
          </button>
          <button 
            onClick={() => navigate('/sales/5')}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm shadow-indigo-200 transition-colors"
          >
            Save & Issue
          </button>
        </div>
      </div>

      <div className="glass-card bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        {/* Top Details Section */}
        <div className="p-8 border-b border-slate-100 bg-white">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:items-start">
            {/* Customer Details */}
            <div className="lg:col-span-5 space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Billed To</label>
              <div className="flex gap-2">
                <div className="relative group flex-1">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="w-5 h-5 text-indigo-400 group-focus-within:text-indigo-600 transition-colors" />
                  </div>
                  <select 
                    value={invoice.customerId}
                    onChange={(e) => setInvoice({...invoice, customerId: e.target.value})}
                    className="w-full pl-12 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer shadow-sm appearance-none"
                  >
                    <option value="" disabled className="font-normal text-slate-400">Select a customer...</option>
                    {contactsData.map(c => (
                      <option key={c.id} value={c.customerId}>{c.name} ({c.company})</option>
                    ))}
                  </select>
                </div>
                <button 
                  onClick={() => setShowCustomerModal(true)}
                  className="flex items-center justify-center w-[50px] h-[50px] bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 rounded-xl transition-colors border border-indigo-100 flex-shrink-0 shadow-sm"
                  title="Add New Customer"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Invoice Meta */}
            <div className="lg:col-span-3 space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Invoice No.</label>
              <div className="flex items-center text-slate-800 font-bold h-[50px]">
                <FileText className="w-4 h-4 text-indigo-400 mr-2.5" />
                {invoice.ref}
              </div>
            </div>
            
            <div className="lg:col-span-2 space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Issue Date</label>
              <div className="flex items-center text-slate-700 font-medium h-[50px]">
                <Calendar className="w-4 h-4 text-slate-400 mr-2.5" />
                {invoice.date}
              </div>
            </div>

            <div className="lg:col-span-2 space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Due Date</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="w-4 h-4 text-rose-400 group-focus-within:text-rose-500" />
                </div>
                <input type="date" value={invoice.dueDate} onChange={(e) => setInvoice({...invoice, dueDate: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all shadow-sm" />
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
                  <th className="py-3 px-2 text-xs font-bold text-slate-500 uppercase tracking-wider w-1/2">Description</th>
                  <th className="py-3 px-2 text-xs font-bold text-slate-500 uppercase tracking-wider w-24 text-center">Qty</th>
                  <th className="py-3 px-2 text-xs font-bold text-slate-500 uppercase tracking-wider w-32 text-right">Price</th>
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
                        placeholder="Item description..."
                        value={item.name}
                        onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                        className="w-full px-4 py-2.5 bg-transparent border border-transparent hover:bg-slate-50 hover:border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl outline-none transition-all font-medium text-slate-800"
                      />
                    </td>
                    <td className="py-3 px-2">
                      <input 
                        type="number" 
                        min="1"
                        value={item.qty}
                        onChange={(e) => handleItemChange(item.id, 'qty', e.target.value)}
                        className="w-full px-2 py-2.5 bg-transparent border border-transparent hover:bg-slate-50 hover:border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl outline-none transition-all font-medium text-center text-slate-800"
                      />
                    </td>
                    <td className="py-3 px-2 relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium pointer-events-none">₹</span>
                      <input 
                        type="number" 
                        min="0"
                        value={item.price}
                        onChange={(e) => handleItemChange(item.id, 'price', e.target.value)}
                        className="w-full pl-8 pr-2 py-2.5 bg-transparent border border-transparent hover:bg-slate-50 hover:border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl outline-none transition-all font-medium text-right text-slate-800"
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
            className="mt-4 flex items-center text-sm font-bold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-4 py-2.5 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Another Item
          </button>
        </div>

        {/* Totals Section */}
        <div className="p-8 bg-slate-50 border-t border-slate-100 flex flex-col md:flex-row justify-between items-start gap-8">
          <div className="w-full md:w-1/2 space-y-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Notes / Terms</label>
            <textarea 
              rows="3" 
              placeholder="Add payment instructions or notes for the customer..."
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none shadow-sm"
              value={invoice.notes}
              onChange={(e) => setInvoice({...invoice, notes: e.target.value})}
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
                  className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-right font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all"
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
                  className="w-full pr-8 pl-3 py-2 bg-white border border-slate-200 rounded-xl text-right font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all"
                />
              </div>
            </div>

            <div className="pt-4 border-t-2 border-slate-200 flex justify-between items-center">
              <span className="text-lg font-black text-slate-800">Total</span>
              <span className="text-2xl font-black text-indigo-600">₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>

      {showCustomerModal && (
        <CustomerModal isOpen={showCustomerModal} onClose={() => setShowCustomerModal(false)} />
      )}
    </div>
  );
}
