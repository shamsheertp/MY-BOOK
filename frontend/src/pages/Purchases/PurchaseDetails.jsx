import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Printer, Send, PackagePlus, FileText, CheckCircle2, AlertCircle, IndianRupee, Ban } from 'lucide-react';
import purchasesData from '../../db/purchases.json';
import contactsData from '../../db/contacts.json';
import { StatusBadge } from '../Dashboard/components/StatusBadge';
import { useCompanyProfile } from '../../hooks/useCompanyProfile';
import { ChevronRight } from 'lucide-react';
import { PinModal } from '../Sales/components/PinModal';

export default function PurchaseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const company = useCompanyProfile();
  const [showSendMenu, setShowSendMenu] = useState(false);
  const [, setForceUpdate] = useState(0);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [pinModalMessage, setPinModalMessage] = useState("Please enter Admin PIN to verify this action. (Hint: 1234)");
  const [expandedBills, setExpandedBills] = useState({});

  // Find the purchase by its ref (or ID fallback)
  let purchase = purchasesData.find(p => p.ref === id || p.id.toString() === id) || purchasesData[0];
  
  // Try to load from localStorage to persist mock data across reloads
  const savedPurchase = localStorage.getItem(`mock_purchase_${purchase.ref}`);
  if (savedPurchase) {
    try {
      purchase = JSON.parse(savedPurchase);
    } catch (e) {
      console.error(e);
    }
  }
  
  // Find associated supplier
  const getCompany = (supplierId) => {
    if (!supplierId) return null;
    const digit = supplierId.split('-')[1];
    return contactsData.find(c => c.id === `CONT-${digit}`);
  };
  const supplier = getCompany(purchase.supplierId) || contactsData[0];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const poItems = purchase.items || [];

  const subtotal = poItems.reduce((acc, item) => {
    const activeQuantity = item.ordered - (item.canceled || 0);
    return acc + (activeQuantity * item.price);
  }, 0);
  const tax = subtotal * 0.05;
  const total = subtotal + tax;

  const handlePrint = () => {
    window.print();
  };

  const handleReceiveGoods = () => {
    navigate(`/purchases/receipts/new?po=${purchase.ref}`);
  };

  const handleCreateBill = () => {
    navigate(`/purchases/bills/new?po=${purchase.ref}`);
  };

  const handleVoidReceipt = (receiptId, e) => {
    e.stopPropagation();
    setPendingDelete(() => () => {
      purchase.items.forEach(i => i.received = 0);
      const receipt = purchase.receipts?.find(r => r.id === receiptId);
      if (receipt) receipt.status = 'Voided';
      else {
        // Fallback mock receipt logic
        purchase.receipts = [{ id: receiptId, date: purchase.date, itemsReceived: 0, status: 'Voided' }];
      }
      localStorage.setItem(`mock_purchase_${purchase.ref}`, JSON.stringify(purchase));
      setForceUpdate(n => n + 1);
    });
    setPinModalMessage("Please enter Admin PIN to void this receipt. (Hint: 1234)");
    setIsPinModalOpen(true);
  };

  const handleVoidBill = (billId, e) => {
    e.stopPropagation();
    setPendingDelete(() => () => {
      purchase.items.forEach(i => i.billed = 0);
      const bill = purchase.bills?.find(b => b.id === billId);
      if (bill) bill.status = 'Voided';
      else {
        // Fallback mock bill logic
        purchase.bills = [{ id: billId, date: purchase.date, amount: 0, status: 'Voided' }];
      }
      localStorage.setItem(`mock_purchase_${purchase.ref}`, JSON.stringify(purchase));
      setForceUpdate(n => n + 1);
    });
    setPinModalMessage("Please enter Admin PIN to void this bill. (Hint: 1234)");
    setIsPinModalOpen(true);
  };

  const handleVoidPayment = (paymentId, e) => {
    e.stopPropagation();
    setPendingDelete(() => () => {
      const payment = purchase.payments?.find(p => p.id === paymentId);
      if (payment) payment.status = 'Voided';
      if (purchase.bills) purchase.bills.forEach(b => { 
        if (b.status !== 'Voided') {
          b.status = 'Unpaid'; 
          delete b.paymentDate; 
        }
      });
      localStorage.setItem(`mock_purchase_${purchase.ref}`, JSON.stringify(purchase));
      setForceUpdate(n => n + 1);
    });
    setPinModalMessage("Please enter Admin PIN to void this payment. (Hint: 1234)");
    setIsPinModalOpen(true);
  };

  const handleShortClose = () => {
    setPendingDelete(() => () => {
      purchase.items.forEach(item => {
        if (item.ordered > item.received) {
          item.canceled = item.ordered - item.received;
        }
      });
      
      const validBills = (purchase.bills || []).filter(b => b.status !== 'Voided');
      const allBillsPaid = validBills.length > 0 && validBills.every(b => b.status === 'Paid');
      
      if (allBillsPaid) {
        purchase.status = 'COMPLETED';
      } else {
        purchase.status = 'PENDING PAYMENT';
      }
      
      localStorage.setItem(`mock_purchase_${purchase.ref}`, JSON.stringify(purchase));
      setForceUpdate(n => n + 1);
    });
    setPinModalMessage("Please enter Admin PIN to short-close this order. Unreceived items will be canceled. (Hint: 1234)");
    setIsPinModalOpen(true);
  };

  const handlePinConfirm = (pin) => {
    if (pin === "1234") {
      if (pendingDelete) pendingDelete();
      setIsPinModalOpen(false);
      setPendingDelete(null);
      return "";
    }
    return "Incorrect PIN. Access Denied.";
  };

  // Determine pipeline steps
  const steps = [
    { label: 'Order', targetId: 'po-document-section', active: ['DRAFT', 'ORDERED', 'PENDING APPROVAL', 'PENDING ACCEPTANCE', 'ACCEPTED'].includes(purchase.status), completed: ['PARTIALLY RECEIVED', 'PENDING PAYMENT', 'COMPLETED'].includes(purchase.status) },
    { label: 'Received', targetId: 'goods-receipt-section', active: ['PARTIALLY RECEIVED', 'PENDING PAYMENT'].includes(purchase.status), completed: ['COMPLETED'].includes(purchase.status) },
    { label: 'Completed', targetId: 'purchase-bills-section', active: ['COMPLETED'].includes(purchase.status), completed: ['COMPLETED'].includes(purchase.status) },
  ];

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      const top = element.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top, behavior: 'smooth' });
    } else {
      alert("This section isn't available yet because the purchase order hasn't reached this stage.");
    }
  };

  const isApprovedOrBeyond = !['DRAFT'].includes(purchase.status);
  const canReceive = isApprovedOrBeyond && poItems.some(item => item.received < item.ordered);
  const canBill = isApprovedOrBeyond && poItems.some(item => item.billed < item.ordered);

  let receiptsList = purchase.receipts || [];
  if (receiptsList.length === 0 && poItems.some(item => item.received > 0)) {
    receiptsList = [{
      id: `GRN-${purchase.ref.split('-').pop()}-01`,
      date: purchase.date,
      itemsReceived: poItems.reduce((acc, item) => acc + item.received, 0),
      status: 'Completed'
    }];
  }
  const hasReceipts = receiptsList.length > 0;
  const mockReceipts = receiptsList;

  let billsList = purchase.bills || [];
  if (billsList.length === 0 && poItems.some(item => item.billed > 0)) {
    billsList = [{
      id: `BILL-${purchase.ref.split('-').pop()}-01`,
      date: purchase.date,
      amount: poItems.reduce((acc, item) => acc + (item.billed * item.price), 0) * 1.05,
      status: 'Unpaid'
    }];
  }
  const hasBills = billsList.length > 0;
  const mockBills = billsList;

  const unpaidBills = billsList.filter(b => b.status === 'Unpaid' || b.status === 'Partially Paid');
  const canPay = unpaidBills.length > 0;
  let paymentsList = purchase.payments || [];
  if (paymentsList.length === 0 && purchase.paid > 0) {
    paymentsList = [{
      id: `PAY-${purchase.ref.split('-').pop()}-01`,
      date: purchase.date,
      mode: 'Bank Transfer',
      reference: 'Legacy Payment',
      amount: purchase.paid,
      status: 'Completed'
    }];
  }
  const hasPayments = paymentsList.length > 0;
  const mockPayments = paymentsList;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 print:pb-0 print:m-0 print:space-y-0 fade-in px-4 sm:px-0">
      
      {/* Header Actions (Not printed) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center space-x-4">
          <Link to="/purchases" className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm text-slate-500">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">{purchase.ref}</h1>
            <p className="text-sm font-medium text-slate-500">Purchase Order</p>
          </div>
          <StatusBadge status={purchase.status || 'APPROVED'} />
        </div>
        
        <div className="flex items-center space-x-3">
          {purchase.status === 'PARTIALLY RECEIVED' && (
            <button 
              onClick={handleShortClose}
              className="px-4 py-2 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition-colors shadow-sm flex items-center text-sm"
            >
              Short Close Order
            </button>
          )}
          <button onClick={handlePrint} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-sm flex items-center text-sm">
            <Printer className="w-4 h-4 mr-2" />
            PDF / Print
          </button>
          <div className="relative">
            <button 
              onClick={() => setShowSendMenu(!showSendMenu)}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-sm flex items-center"
            >
              <Send className="w-4 h-4 mr-2 text-indigo-500" />
              Send to Supplier
            </button>
            {showSendMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50">
                <a 
                  href={`https://wa.me/${supplier.phone || ''}?text=Hello,%20please%20find%20attached%20Purchase%20Order%20${purchase.ref}.`}
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 border-b border-slate-100 transition-colors"
                  onClick={() => setShowSendMenu(false)}
                >
                  <span className="w-8 h-8 mr-3 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  </span>
                  <div>
                    <div className="text-slate-800 font-bold">WhatsApp</div>
                    <div className="text-xs text-slate-500">Send PDF via WhatsApp</div>
                  </div>
                </a>
                <a 
                  href={`mailto:${supplier.email || ''}?subject=Purchase Order ${purchase.ref}&body=Hello,%0D%0A%0D%0APlease find attached the Purchase Order ${purchase.ref}.`}
                  className="flex items-center px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  onClick={() => setShowSendMenu(false)}
                >
                  <span className="w-8 h-8 mr-3 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                  </span>
                  <div>
                    <div className="text-slate-800 font-bold">Email</div>
                    <div className="text-xs text-slate-500">Send PDF via Email</div>
                  </div>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Visual Pipeline */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex items-center justify-between overflow-x-auto print:hidden">
        {steps.map((step, idx) => (
          <div key={step.label} className="flex items-center">
            <button 
              onClick={() => scrollToSection(step.targetId)}
              className={`flex items-center justify-center px-4 py-2 rounded-xl font-bold text-sm transition-all hover:scale-105 cursor-pointer ${
              step.completed 
                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                : step.active
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-200 hover:bg-orange-700'
                  : 'bg-slate-50 text-slate-400 border border-slate-100 hover:bg-slate-100 hover:text-slate-600'
            }`}>
              {step.completed && <CheckCircle2 className="w-4 h-4 mr-1.5" />}
              {step.label}
            </button>
            {idx < steps.length - 1 && (
              <ChevronRight className={`w-5 h-5 mx-2 ${step.completed ? 'text-emerald-400' : 'text-slate-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Action Prompts based on PO status */}
      {/* We removed the Bill action card and will put its button in the Bills History header just like GRN */}

      {/* Receipt History */}
      {(hasReceipts || canReceive) && (
        <div id="goods-receipt-section" className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden print:hidden mb-6 scroll-mt-6">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight">Goods Receipt History</h3>
              <p className="text-sm text-slate-500 font-medium">Log of deliveries against this purchase order</p>
            </div>
            {canReceive && (
              <button onClick={handleReceiveGoods} className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-sm shadow-orange-200 transition-colors text-sm flex items-center whitespace-nowrap">
                <PackagePlus className="w-4 h-4 mr-2" />
                Receive Goods
              </button>
            )}
          </div>
          {hasReceipts ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-white border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-6 font-bold text-slate-500 uppercase tracking-wider">Receipt #</th>
                    <th className="py-3 px-6 font-bold text-slate-500 uppercase tracking-wider">Date</th>
                    <th className="py-3 px-6 font-bold text-slate-500 uppercase tracking-wider text-center">Total Items</th>
                    <th className="py-3 px-6 font-bold text-slate-500 uppercase tracking-wider text-right">Status</th>
                    <th className="py-3 px-6 font-bold text-slate-500 uppercase tracking-wider text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 bg-white">
                  {mockReceipts.map((receipt) => (
                    <tr key={receipt.id} className={`hover:bg-slate-50 transition-colors ${receipt.status === 'Voided' ? 'opacity-50 grayscale' : ''}`}>
                      <td className="py-3 px-6 font-bold text-orange-600 hover:text-orange-700 cursor-pointer" onClick={() => navigate(`/purchases/receipts/${receipt.id}`)}>{receipt.id}</td>
                      <td className="py-3 px-6 text-slate-600 font-medium">{receipt.date}</td>
                      <td className="py-3 px-6 text-center font-bold text-slate-800">{receipt.itemsReceived}</td>
                      <td className="py-3 px-6 text-right">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold ${receipt.status === 'Voided' ? 'bg-slate-100 text-slate-500' : 'bg-emerald-100 text-emerald-700'}`}>
                          {receipt.status !== 'Voided' && <CheckCircle2 className="w-3.5 h-3.5 mr-1" />}
                          {receipt.status}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-right">
                        {receipt.status !== 'Voided' && (
                          <button onClick={(e) => handleVoidReceipt(receipt.id, e)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Void Receipt">
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center bg-white">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-50 mb-3">
                <PackagePlus className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-slate-500 font-medium">No goods have been received yet.</p>
            </div>
          )}
        </div>
      )}

      {/* Financial Ledger (Bills & Payments) */}
      {(hasBills || canBill || hasPayments || canPay) && (
        <div id="purchase-bills-section" className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden print:hidden mb-6 scroll-mt-6">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight">Financial Ledger</h3>
              <p className="text-sm text-slate-500 font-medium">Bills and payments against this purchase order</p>
            </div>
            <div className="flex items-center space-x-3">
              {canBill && (
                <button onClick={handleCreateBill} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm shadow-indigo-200 transition-colors text-sm flex items-center whitespace-nowrap">
                  <FileText className="w-4 h-4 mr-2" />
                  Create Bill
                </button>
              )}
              {canPay && (
                <button onClick={() => navigate(`/purchases/payments/new?po=${purchase.ref}`)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm shadow-emerald-200 transition-colors text-sm flex items-center whitespace-nowrap">
                  <IndianRupee className="w-4 h-4 mr-2" />
                  Record Payment
                </button>
              )}
            </div>
          </div>

          {(hasBills || hasPayments) ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-white border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-6 font-bold text-slate-500 uppercase tracking-wider">Date</th>
                    <th className="py-3 px-6 font-bold text-slate-500 uppercase tracking-wider">Type</th>
                    <th className="py-3 px-6 font-bold text-slate-500 uppercase tracking-wider">Ref #</th>
                    <th className="py-3 px-6 font-bold text-slate-500 uppercase tracking-wider text-right">Amount</th>
                    <th className="py-3 px-6 font-bold text-slate-500 uppercase tracking-wider text-right">Status / Info</th>
                    <th className="py-3 px-6 font-bold text-slate-500 uppercase tracking-wider text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 bg-white">
                  {(() => {
                    // Group payments under bills
                    const unallocatedPayments = [...mockPayments].map(p => ({ ...p, usedAmount: 0 }));
                    
                    const rows = [];
                    
                    mockBills.sort((a, b) => new Date(a.date) - new Date(b.date)).forEach(bill => {
                      const billRow = { ...bill, itemType: 'Bill', isChild: false };
                      rows.push(billRow);
                      
                      const billPayments = [];
                      let owed = bill.amount;
                      
                      unallocatedPayments.forEach(payment => {
                        if (owed > 0 && payment.status !== 'Voided') {
                          const availableAmount = payment.amount - payment.usedAmount;
                          if (availableAmount > 0) {
                            const applied = Math.min(owed, availableAmount);
                            billPayments.push({
                              ...payment,
                              itemType: 'Payment',
                              isChild: true,
                              parentId: bill.id,
                              appliedAmount: applied
                            });
                            payment.usedAmount += applied;
                            owed -= applied;
                          }
                        }
                      });

                      billRow.balance = owed;
                      billRow.hasChildren = billPayments.length > 0;

                      if (expandedBills[bill.id]) {
                        rows.push(...billPayments);
                      }
                    });

                    // Add any fully unallocated payments (advances, overpayments) at the end
                    unallocatedPayments.forEach(payment => {
                      if (payment.usedAmount === 0 && payment.status !== 'Voided') {
                        rows.push({ ...payment, itemType: 'Payment', isChild: false, appliedAmount: payment.amount });
                      }
                      if (payment.status === 'Voided') {
                        rows.push({ ...payment, itemType: 'Payment', isChild: false, appliedAmount: payment.amount });
                      }
                    });

                    return rows.map((item, idx) => (
                      <tr key={`${item.id}-${idx}`} className={`hover:bg-slate-50 transition-colors ${item.status === 'Voided' ? 'opacity-50' : ''}`}>
                        <td className="py-4 px-6 text-slate-600 font-medium">
                          {item.isChild ? (
                            <div className="flex items-center text-slate-400">
                              <div className="w-4 h-4 border-l-2 border-b-2 border-slate-300 rounded-bl-lg mr-3 ml-4"></div>
                              {item.date}
                            </div>
                          ) : item.hasChildren ? (
                            <button 
                              onClick={() => setExpandedBills(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                              className="flex items-center text-indigo-600 hover:text-indigo-800 transition-colors"
                            >
                              <svg className={`w-4 h-4 mr-2 transform transition-transform ${expandedBills[item.id] ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                              {item.date}
                            </button>
                          ) : (
                            item.date
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold ${
                            item.itemType === 'Bill' ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            {item.itemType}
                          </span>
                        </td>
                        <td 
                          className={`py-4 px-6 font-bold cursor-pointer hover:underline ${item.itemType === 'Bill' ? 'text-indigo-600' : 'text-emerald-600'}`}
                          onClick={() => navigate(`/purchases/${item.itemType.toLowerCase()}s/${item.id}`)}
                        >
                          {item.id}
                        </td>
                        <td className={`py-4 px-6 text-right font-black text-slate-800 ${item.status === 'Voided' ? 'line-through text-slate-400' : ''}`}>
                          {item.isChild ? (
                            <div className="flex flex-col items-end">
                              <span>{formatCurrency(item.appliedAmount)}</span>
                              {item.appliedAmount < item.amount && <span className="text-xs text-slate-400 font-medium font-normal">(from {formatCurrency(item.amount)})</span>}
                            </div>
                          ) : item.itemType === 'Bill' && item.balance > 0 && item.balance < item.amount ? (
                            <div className="flex flex-col items-end">
                              <span>{formatCurrency(item.amount)}</span>
                              <span className="text-xs text-amber-600 font-medium mt-0.5">Bal: {formatCurrency(item.balance)}</span>
                            </div>
                          ) : (
                            formatCurrency(item.amount)
                          )}
                        </td>
                        <td className="py-4 px-6 text-right">
                          {item.itemType === 'Bill' ? (
                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold ${
                              item.status === 'Voided' ? 'bg-slate-100 text-slate-500' :
                              item.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' :
                              item.status === 'Partially Paid' ? 'bg-indigo-100 text-indigo-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {item.status || 'Unpaid'}
                            </span>
                          ) : (
                            <span className="text-slate-500 font-medium text-xs">
                              {item.mode}
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right">
                          {!item.isChild && item.status !== 'Voided' && (
                            <button 
                              onClick={(e) => item.itemType === 'Bill' ? handleVoidBill(item.id, e) : handleVoidPayment(item.id, e)} 
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" 
                              title={`Void ${item.itemType}`}
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center bg-white">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-50 mb-3">
                <FileText className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-slate-500 font-medium">No financials recorded yet.</p>
            </div>
          )}
        </div>
      )}

      {/* PO Document */}
      <div id="po-document-section" className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden print:shadow-none print:border-0 print:rounded-none scroll-mt-6">
        
        {/* Document Header */}
        <div className="p-8 md:p-12 border-b border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">Purchase Order</h2>
              <div className="text-slate-500 font-medium mt-1"># {purchase.ref}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Company Details</div>
              <h3 className="font-bold text-slate-800 text-lg">{company?.companyName}</h3>
              <p className="text-slate-500 text-sm mt-1">
                {company?.address}<br/>
                {company?.city && company?.country ? `${company.city}, ${company.country}` : ''}<br/>
                {company?.taxNumber && `TRN: ${company.taxNumber}`}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div>
              <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Supplier</div>
              <h4 className="font-bold text-slate-800 text-lg">{supplier.companyName || supplier.company}</h4>
              <p className="text-slate-500 text-sm mt-1">{supplier.contactName || supplier.name}</p>
              <p className="text-slate-500 text-sm">{supplier.email}</p>
            </div>

            <div>
              <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Order Details</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">PO Date:</span>
                  <span className="font-bold text-slate-800">{purchase.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Expected Delivery:</span>
                  <span className="font-bold text-slate-800">{purchase.expectedDeliveryDate || '15-Oct-2026'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Terms:</span>
                  <span className="font-bold text-slate-800">{purchase.paymentTerms || '30 Days'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PO Items Table */}
        <div className="p-8 md:p-12">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="pb-4 font-bold text-slate-500 uppercase tracking-wider">Product / Service</th>
                  <th className="pb-4 font-bold text-slate-500 uppercase tracking-wider text-center">Ordered</th>
                  {poItems.some(i => i.canceled > 0) && (
                    <th className="pb-4 font-bold text-red-500 uppercase tracking-wider text-center">Canceled</th>
                  )}
                  <th className="pb-4 font-bold text-slate-500 uppercase tracking-wider text-center">Received</th>
                  <th className="pb-4 font-bold text-slate-500 uppercase tracking-wider text-center">Billed</th>
                  <th className="pb-4 font-bold text-slate-500 uppercase tracking-wider text-right">Unit Price</th>
                  <th className="pb-4 font-bold text-slate-500 uppercase tracking-wider text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {poItems.map((item, idx) => (
                  <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                    <td className="py-4 pr-4">
                      <div className="font-bold text-slate-800">{item.name}</div>
                      {item.canceled > 0 && <div className="text-xs text-red-500 font-semibold mt-1">Short Closed</div>}
                    </td>
                    <td className="py-4 px-2 text-center font-bold text-slate-800">{item.ordered}</td>
                    {poItems.some(i => i.canceled > 0) && (
                      <td className="py-4 px-2 text-center">
                        {item.canceled > 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-600">
                            {item.canceled}
                          </span>
                        ) : '-'}
                      </td>
                    )}
                    <td className="py-4 px-2 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${item.received === item.ordered ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {item.received}
                      </span>
                    </td>
                    <td className="py-4 px-2 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${item.billed === item.ordered ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {item.billed}
                      </span>
                    </td>
                    <td className="py-4 pl-4 text-right font-bold text-slate-800">{formatCurrency(item.price)}</td>
                    <td className="py-4 pl-4 text-right font-black text-slate-800">{formatCurrency((item.ordered - (item.canceled || 0)) * item.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 flex flex-col md:flex-row justify-between items-start gap-8">
            <div className="w-full md:w-1/2">
              <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Internal Notes</div>
              <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">
                {purchase.notes || 'Please ensure items are delivered to the main warehouse.'}
              </p>
            </div>
            
            <div className="w-full md:w-80 space-y-3">
              <div className="flex justify-between text-slate-600">
                <span className="font-medium">Subtotal</span>
                <span className="font-bold text-slate-800">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span className="font-medium">VAT (5%)</span>
                <span className="font-bold text-slate-800">{formatCurrency(tax)}</span>
              </div>
              <div className="pt-3 border-t-2 border-slate-200 flex justify-between items-center">
                <span className="text-lg font-black text-slate-800">Total</span>
                <span className="text-2xl font-black text-orange-600">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
      <PinModal 
        isOpen={isPinModalOpen} 
        onClose={() => { setIsPinModalOpen(false); setPendingDelete(null); }} 
        onConfirm={handlePinConfirm} 
        message={pinModalMessage}
      />
    </div>
  );
}
