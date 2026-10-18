import { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, Save, IndianRupee, Calendar, FileText } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { purchasesService } from '../../services/api';
import purchasesData from '../../db/purchases.json';

export default function CreatePurchasePayment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const poRef = searchParams.get('po');

  const [purchase, setPurchase] = useState(() => {
    return purchasesData.find(p => p.ref === poRef) || purchasesData[0] || {};
  });
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState('Bank Transfer');
  const [reference, setReference] = useState('');
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [selectedBillId, setSelectedBillId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!poRef) return;
    let isMounted = true;
    purchasesService.getById(poRef)
      .then((res) => {
        if (isMounted && res?.data) {
          setPurchase(res.data);
          const outstanding = Number(res.data.balance ?? 0);
          setPaymentAmount(outstanding);
          // If there is an unpaid bill, preselect it
          const bills = res.data.bills || [];
          const unpaid = bills.find((b) => Number(b.balance) > 0 || (b.status || '').toUpperCase() === 'UNPAID');
          if (unpaid) {
            setSelectedBillId(unpaid.id);
          }
        }
      })
      .catch((err) => {
        console.warn('Falling back to local cache for PO:', err);
        const p = purchasesData.find(item => item.ref === poRef) || purchasesData[0];
        setPurchase(p);
      });

    return () => { isMounted = false; };
  }, [poRef]);

  const supplier = purchase.supplier || {
    contactName: purchase.supplierName || 'Supplier',
    companyName: purchase.supplierCompany || '',
    email: purchase.supplierEmail || '',
  };

  const allBills = (purchase.bills || []).filter(b => b.status !== 'Voided');
  const allPayments = (purchase.payments || []).filter(p => p.status !== 'Voided');

  const { billsWithBalance, unpaidBills, totalPayable } = useMemo(() => {
    const totalBalanceFromPurchase = Number(purchase.balance ?? 0);

    const _billsWithBalance = allBills.map(b => {
      const billAmount = Number(b.amount || 0);
      const billPaid = Number(b.paid || 0);
      const owed = Math.max(0, billAmount - billPaid);
      return { ...b, balance: owed };
    });

    const _unpaidBills = _billsWithBalance.filter(b => b.balance > 0);
    const sumFromBills = _unpaidBills.reduce((acc, b) => acc + b.balance, 0);

    const payable = sumFromBills > 0 ? sumFromBills : totalBalanceFromPurchase;

    return {
      billsWithBalance: _billsWithBalance,
      unpaidBills: _unpaidBills,
      totalPayable: payable,
    };
  }, [allBills, purchase.balance]);

  // Sync default selectedBillId if unset
  useEffect(() => {
    if (!selectedBillId && unpaidBills.length > 0) {
      setSelectedBillId(unpaidBills[0].id);
    }
  }, [unpaidBills, selectedBillId]);

  // Sync default payment amount if totalPayable updates
  useEffect(() => {
    if (paymentAmount === 0 && totalPayable > 0) {
      setPaymentAmount(totalPayable);
    }
  }, [totalPayable, paymentAmount]);

  const handleConfirm = async () => {
    setErrorMsg('');
    const amt = Number(paymentAmount);
    if (!amt || amt <= 0) {
      setErrorMsg("Please enter a payment amount greater than 0.");
      return;
    }

    setIsSubmitting(true);
    try {
      const targetBillId = selectedBillId || (unpaidBills.length > 0 ? unpaidBills[0].id : undefined);

      const payload = {
        amount: amt,
        method: paymentMode,
        ref: reference.trim() || undefined,
        date: paymentDate,
        billId: targetBillId || undefined,
      };

      const res = await purchasesService.recordPayment(purchase.id || purchase.ref, payload);
      if (res?.success) {
        navigate(`/purchases/${purchase.ref || purchase.id}`);
      } else {
        setErrorMsg(res?.message || 'Failed to record outgoing payment');
      }
    } catch (err) {
      console.error('Error recording outgoing payment:', err);
      setErrorMsg(err?.response?.data?.message || err?.message || 'Failed to save payment to database');
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

  return (
    <div className="max-w-4xl mx-auto fade-in px-4 sm:px-0 pb-12">
      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 font-semibold flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="text-red-500 hover:text-red-700 font-bold">&times;</button>
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate(-1)} className="p-2.5 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-colors shadow-sm text-slate-600 hover:text-emerald-600">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Record Payment Out</h1>
            <p className="text-sm text-slate-500 mt-1 font-medium">Record an outgoing supplier payment for {purchase.ref} & reduce payables</p>
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
            onClick={handleConfirm}
            disabled={isSubmitting || totalPayable === 0}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-sm shadow-emerald-200 transition-colors flex items-center"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Recording...' : 'Save Payment Out'}
          </button>
        </div>
      </div>

      <div className="glass-card bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        
        <div className="p-8 border-b border-slate-100 bg-emerald-50/30">
          <div className="flex flex-col md:flex-row justify-between gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Payment To Supplier</label>
              <h3 className="font-bold text-slate-800 text-xl">{supplier.companyName || supplier.company || purchase.supplierCompany || purchase.supplierName}</h3>
              <p className="text-sm text-slate-600">{supplier.email || purchase.supplierEmail || ''}</p>
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
                <label className="block text-sm font-bold text-slate-700 mb-2">Payment Amount (₹)</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <IndianRupee className="w-5 h-5 text-slate-400 group-focus-within:text-emerald-500" />
                  </div>
                  <input 
                    type="number" 
                    step="any"
                    min="0.01"
                    max={totalPayable > 0 ? totalPayable : undefined}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
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
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
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
                    <option>UPI</option>
                    <option>Cheque</option>
                    <option>Credit Card</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Transaction Reference / UTR</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FileText className="w-4 h-4 text-slate-400 group-focus-within:text-emerald-500" />
                  </div>
                  <input 
                    type="text" 
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="e.g. UTR-990234 or Check #1029" 
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-sm" 
                  />
                </div>
              </div>
            </div>

            {/* Bills Breakdown */}
            <div className="bg-slate-50/70 rounded-2xl p-6 border border-slate-100 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-slate-800 text-sm mb-4 uppercase tracking-wider">Purchase Bills to Settle</h4>
                <div className="space-y-3">
                  {billsWithBalance.length > 0 ? (
                    billsWithBalance.map((bill) => {
                      const isSelected = selectedBillId === bill.id;
                      return (
                        <div
                          key={bill.id}
                          onClick={() => {
                            setSelectedBillId(bill.id);
                            if (bill.balance > 0) {
                              setPaymentAmount(bill.balance);
                            }
                          }}
                          className={`flex justify-between items-center text-sm p-3.5 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-500/20 shadow-sm'
                              : 'bg-white border-slate-100 hover:border-slate-200 shadow-sm'
                          }`}
                        >
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className={`font-bold ${isSelected ? 'text-emerald-800' : 'text-slate-800'}`}>
                                {bill.ref || bill.id}
                              </span>
                              {isSelected && (
                                <span className="px-2 py-0.5 text-[10px] font-extrabold bg-emerald-600 text-white rounded-md uppercase">
                                  Selected
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">{bill.date}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-slate-800">{formatCurrency(bill.amount)}</div>
                            <div className={`text-xs font-semibold ${bill.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                              {bill.balance > 0 ? `Balance: ${formatCurrency(bill.balance)}` : 'Fully Paid'}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-sm text-slate-500 italic p-3 bg-white rounded-xl border border-slate-100">
                      Direct PO payment against total order amount ({formatCurrency(purchase.balance || purchase.total)}).
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-200 mt-6 space-y-2">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Current Balance:</span>
                  <span className="font-bold text-slate-800">{formatCurrency(totalPayable)}</span>
                </div>
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>Payment to Apply:</span>
                  <span className="font-bold">-{formatCurrency(paymentAmount)}</span>
                </div>
                <div className="flex justify-between text-base font-black text-slate-800 pt-2 border-t border-slate-100">
                  <span>Remaining Balance:</span>
                  <span>{formatCurrency(Math.max(0, totalPayable - (Number(paymentAmount) || 0)))}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
