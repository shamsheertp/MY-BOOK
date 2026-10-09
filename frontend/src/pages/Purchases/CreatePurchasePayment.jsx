import { useState, useMemo } from 'react';
import { ArrowLeft, Save, IndianRupee, Calendar, FileText } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import purchasesData from '../../db/purchases.json';
import contactsData from '../../db/contacts.json';

export default function CreatePurchasePayment() {
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

  // Mock one unpaid bill if none exist in the array but there is billed data
  let allBills = purchase.bills || [];
  if (allBills.length === 0) {
    const totalBilled = (purchase.items || []).reduce((acc, item) => acc + (item.billed * item.price), 0);
    if (totalBilled > 0) {
      allBills = [{
        id: `BILL-${purchase.ref.split('-').pop()}-01`,
        date: purchase.date,
        amount: totalBilled * 1.05,
        status: 'Unpaid'
      }];
    }
  }

  const allPayments = (purchase.payments || []).filter(p => p.status !== 'Voided');
  
  const { billsWithBalance, unpaidBills, totalPayable } = useMemo(() => {
    let pastPaymentTotal = allPayments.reduce((acc, p) => acc + p.amount, 0);
    if (pastPaymentTotal === 0 && purchase.paid > 0) {
      pastPaymentTotal = purchase.paid; // Legacy fallback
    }

    const _billsWithBalance = allBills.map(b => {
      let owed = b.amount;
      if (pastPaymentTotal > 0) {
        if (pastPaymentTotal >= owed) {
          pastPaymentTotal -= owed;
          owed = 0;
        } else {
          owed -= pastPaymentTotal;
          pastPaymentTotal = 0;
        }
      }
      return { ...b, balance: owed };
    });

    const _unpaidBills = _billsWithBalance.filter(b => b.balance > 0);
    const _totalPayable = _unpaidBills.reduce((acc, b) => acc + b.balance, 0);

    return { 
      billsWithBalance: _billsWithBalance, 
      unpaidBills: _unpaidBills, 
      totalPayable: _totalPayable 
    };
  }, [allBills, allPayments, purchase.paid]);
  const [paymentAmount, setPaymentAmount] = useState(totalPayable);
  const [paymentMode, setPaymentMode] = useState('Bank Transfer');
  const [reference, setReference] = useState('');

  const handleConfirm = () => {
    // Clone purchase to avoid mutating imported data directly in React render cycle
    const updatedPurchase = JSON.parse(JSON.stringify(purchase));

    if (!updatedPurchase.payments) {
      updatedPurchase.payments = [];
    }
    updatedPurchase.payments.push({
      id: `PAY-${updatedPurchase.ref.split('-').pop()}-${String(updatedPurchase.payments.length + 1).padStart(2, '0')}`,
      date: new Date().toISOString().split('T')[0],
      amount: Number(paymentAmount),
      mode: paymentMode,
      reference: reference || '-'
    });

    if (!updatedPurchase.bills || updatedPurchase.bills.length === 0) {
      updatedPurchase.bills = unpaidBills.map(b => ({...b}));
    }

    let remainingPayment = Number(paymentAmount);
    updatedPurchase.bills.forEach(bill => {
      const currentBalance = billsWithBalance.find(b => b.id === bill.id)?.balance || 0;
      if (currentBalance > 0) {
        if (remainingPayment >= currentBalance) {
          bill.status = 'Paid';
          bill.paymentDate = new Date().toISOString().split('T')[0];
          remainingPayment -= currentBalance;
        } else if (remainingPayment > 0) {
          bill.status = 'Partially Paid';
          bill.paymentDate = new Date().toISOString().split('T')[0];
          remainingPayment = 0;
        }
      }
    });

    const allBillsPaid = updatedPurchase.bills.every(b => b.status === 'Paid');
    const allReceived = updatedPurchase.items.every(i => i.received >= i.ordered);
    if (allBillsPaid && allReceived && updatedPurchase.bills.length > 0) {
      updatedPurchase.status = 'COMPLETED';
    }

    localStorage.setItem(`mock_purchase_${updatedPurchase.ref}`, JSON.stringify(updatedPurchase));

    console.log("Mock saved data:", updatedPurchase);
    navigate(`/purchases/${updatedPurchase.ref}`);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="max-w-4xl mx-auto fade-in px-4 sm:px-0 pb-12">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate(-1)} className="p-2.5 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-colors shadow-sm text-slate-600 hover:text-emerald-600">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Record Payment</h1>
            <p className="text-sm text-slate-500 mt-1 font-medium">Record an outgoing payment for {purchase.ref}</p>
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
            disabled={totalPayable === 0}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-sm shadow-emerald-200 transition-colors flex items-center"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Payment
          </button>
        </div>
      </div>

      <div className="glass-card bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        
        <div className="p-8 border-b border-slate-100 bg-emerald-50/30">
          <div className="flex flex-col md:flex-row justify-between gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Payment To</label>
              <h3 className="font-bold text-slate-800 text-xl">{supplier.companyName || supplier.company}</h3>
              <p className="text-sm text-slate-600">{supplier.email}</p>
            </div>
            <div className="text-left md:text-right">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Total Outstanding (This PO)</label>
              <h3 className="font-black text-slate-800 text-3xl text-emerald-600">{formatCurrency(totalPayable)}</h3>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Payment Details Form */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Payment Amount</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <IndianRupee className="w-5 h-5 text-slate-400 group-focus-within:text-emerald-500" />
                  </div>
                  <input 
                    type="number" 
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    max={totalPayable}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-800 text-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-sm" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Payment Date</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="w-4 h-4 text-slate-400 group-focus-within:text-emerald-500" />
                    </div>
                    <input 
                      type="date" 
                      defaultValue={new Date().toISOString().split('T')[0]} 
                      className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-sm" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Payment Mode</label>
                  <select 
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-sm appearance-none"
                  >
                    <option>Bank Transfer</option>
                    <option>Cash</option>
                    <option>Cheque</option>
                    <option>Credit Card</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Reference / Transaction ID</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FileText className="w-4 h-4 text-slate-400 group-focus-within:text-emerald-500" />
                  </div>
                  <input 
                    type="text" 
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="e.g. TRN-998822" 
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-sm" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Payment Proof (Optional)</label>
                <div className="flex items-center justify-center w-full">
                  <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-200 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 hover:border-emerald-300 transition-all group">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-8 h-8 mb-3 text-slate-400 group-hover:text-emerald-500 transition-colors" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                      </svg>
                      <p className="mb-1 text-sm text-slate-500 font-medium"><span className="font-bold text-emerald-600">Click to upload</span> or drag and drop</p>
                      <p className="text-xs text-slate-400">PDF, JPG, or PNG (MAX. 5MB)</p>
                    </div>
                    <input id="dropzone-file" type="file" className="hidden" />
                  </label>
                </div>
              </div>
            </div>

            {/* Context / Info Panel */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6">
              <h4 className="font-bold text-slate-800 mb-4">Applying to Purchase Bills</h4>
              {unpaidBills.length > 0 ? (
                <div className="space-y-4">
                  {unpaidBills.map(bill => (
                    <div key={bill.id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                      <div>
                        <div className="font-bold text-slate-700 text-sm">{bill.id}</div>
                        <div className="text-xs text-slate-500">Dated {bill.date}</div>
                      </div>
                      <div className="font-bold text-slate-800">
                        <div className="text-right">{formatCurrency(bill.balance)}</div>
                        {bill.amount > bill.balance && (
                          <div className="text-xs text-slate-400 font-medium line-through">{formatCurrency(bill.amount)}</div>
                        )}
                      </div>
                    </div>
                  ))}
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">
                    This payment will be automatically applied to the oldest open bills for this Purchase Order first.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-amber-600 font-bold bg-amber-50 p-4 rounded-xl border border-amber-100">
                  There are no open bills to pay for this Purchase Order. You must create a Purchase Bill first before recording a payment.
                </p>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
