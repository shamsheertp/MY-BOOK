import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Printer, Send, PackagePlus, FileText, CheckCircle2, IndianRupee, Ban, AlertCircle } from 'lucide-react';
import { purchasesService } from '../../services/api';
import purchasesData from '../../db/purchases.json';
import { StatusBadge } from '../Dashboard/components/StatusBadge';
import { useCompanyProfile } from '../../hooks/useCompanyProfile';
import { ChevronRight } from 'lucide-react';
import { PinModal } from '../Sales/components/PinModal';
import { WhatsAppPOPreviewModal } from './components/WhatsAppPOPreviewModal';

export default function PurchaseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const company = useCompanyProfile();
  const [showSendMenu, setShowSendMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [pinModalMessage, setPinModalMessage] = useState("Please enter Admin PIN to verify this action. (Hint: 1234)");
  const [expandedBills, setExpandedBills] = useState({});
  const [feedback, setFeedback] = useState(null);

  // Initial purchase state fallback
  const [purchase, setPurchase] = useState(() => {
    return purchasesData.find(p => p.ref === id || p.id?.toString() === id) || purchasesData[0] || {};
  });

  const loadPurchase = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const res = await purchasesService.getById(id);
      if (res?.success && res.data) {
        setPurchase(res.data);
      }
    } catch (err) {
      console.warn('Failed to load purchase from API, checking local data:', err);
      const fallback = purchasesData.find(p => p.ref === id || p.id?.toString() === id);
      if (fallback) setPurchase(fallback);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPurchase();
  }, [loadPurchase]);

  // Supplier info
  const supplier = purchase.supplier || {
    contactName: purchase.supplierName || 'Supplier',
    companyName: purchase.supplierCompany || '',
    email: purchase.supplierEmail || '',
    phone: purchase.supplierPhone || '',
    address: purchase.supplierAddress || '',
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const poItems = purchase.items || [];
  const subtotal = Number(purchase.subtotal ?? poItems.reduce((acc, item) => {
    const qty = Number(item.orderedKg ?? item.ordered ?? item.qty ?? 0) - Number(item.canceled ?? 0);
    const price = Number(item.unitPrice ?? item.price ?? 0);
    return acc + (qty * price);
  }, 0));
  const tax = Number(purchase.tax ?? (subtotal * 0.05));
  const total = Number(purchase.total ?? purchase.amount ?? (subtotal + tax));

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
    setPendingAction(() => async () => {
      try {
        const res = await purchasesService.voidReceipt(purchase.id || purchase.ref, receiptId);
        if (res?.success) {
          setFeedback({ type: 'success', text: 'Receipt voided successfully and inventory reverted.' });
          loadPurchase();
        }
      } catch (err) {
        setFeedback({ type: 'error', text: err?.response?.data?.message || err?.message || 'Failed to void receipt' });
      }
    });
    setPinModalMessage("Please enter Admin PIN to void this receipt and revert inventory. (Hint: 1234)");
    setIsPinModalOpen(true);
  };

  const handleVoidBill = (billId, e) => {
    e.stopPropagation();
    setPendingAction(() => async () => {
      try {
        const res = await purchasesService.voidBill(purchase.id || purchase.ref, billId);
        if (res?.success) {
          setFeedback({ type: 'success', text: 'Bill voided successfully and payables adjusted.' });
          loadPurchase();
        }
      } catch (err) {
        setFeedback({ type: 'error', text: err?.response?.data?.message || err?.message || 'Failed to void bill' });
      }
    });
    setPinModalMessage("Please enter Admin PIN to void this bill and reverse accounts payable. (Hint: 1234)");
    setIsPinModalOpen(true);
  };

  const handleVoidPayment = (paymentId, e) => {
    e.stopPropagation();
    setPendingAction(() => async () => {
      try {
        const res = await purchasesService.voidPayment(purchase.id || purchase.ref, paymentId);
        if (res?.success) {
          setFeedback({ type: 'success', text: 'Payment voided successfully.' });
          loadPurchase();
        }
      } catch (err) {
        setFeedback({ type: 'error', text: err?.response?.data?.message || err?.message || 'Failed to void payment' });
      }
    });
    setPinModalMessage("Please enter Admin PIN to void this outgoing payment. (Hint: 1234)");
    setIsPinModalOpen(true);
  };

  const handleVoidPurchase = () => {
    setPendingAction(() => async () => {
      try {
        const res = await purchasesService.void(purchase.id || purchase.ref, { reason: 'Voided by authorized manager' });
        if (res?.success) {
          setFeedback({ type: 'success', text: 'Purchase order voided. All received stock and payables have been reversed.' });
          loadPurchase();
        }
      } catch (err) {
        setFeedback({ type: 'error', text: err?.response?.data?.message || err?.message || 'Failed to void purchase order' });
      }
    });
    setPinModalMessage("Please enter Admin PIN to VOID this entire purchase order. All stock and payables will be reversed. (Hint: 1234)");
    setIsPinModalOpen(true);
  };

  const handlePinConfirm = (pin) => {
    if (pin === "1234") {
      if (pendingAction) {
        pendingAction();
      }
      setIsPinModalOpen(false);
      setPendingAction(null);
      return "";
    }
    return "Incorrect PIN. Access Denied.";
  };

  const isVoid = purchase.status === 'VOID' || purchase.status === 'CANCELLED';

  const steps = [
    { label: 'Order', targetId: 'po-document-section', active: ['DRAFT', 'ORDERED', 'PENDING APPROVAL', 'PENDING ACCEPTANCE', 'ACCEPTED'].includes(purchase.status), completed: ['PARTIALLY_RECEIVED', 'PARTIALLY RECEIVED', 'RECEIVED', 'PENDING PAYMENT', 'COMPLETED'].includes(purchase.status) },
    { label: 'Received', targetId: 'goods-receipt-section', active: ['PARTIALLY_RECEIVED', 'PARTIALLY RECEIVED', 'RECEIVED', 'PENDING PAYMENT'].includes(purchase.status), completed: ['COMPLETED'].includes(purchase.status) },
    { label: 'Completed', targetId: 'purchase-bills-section', active: ['COMPLETED'].includes(purchase.status), completed: ['COMPLETED'].includes(purchase.status) },
  ];

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const top = element.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top, behavior: 'smooth' });
    } else {
      alert("This section isn't available yet because the purchase order hasn't reached this stage.");
    }
  };

  const isApprovedOrBeyond = !['DRAFT', 'VOID', 'CANCELLED'].includes(purchase.status);
  const canReceive = isApprovedOrBeyond && poItems.some(item => Number(item.receivedKg ?? item.received ?? 0) < Number(item.orderedKg ?? item.ordered ?? 0));
  const canBill = isApprovedOrBeyond && poItems.some(item => Number(item.billedKg ?? item.billed ?? 0) < Number(item.receivedKg ?? item.received ?? 0));

  const receiptsList = purchase.receipts || [];
  const hasReceipts = receiptsList.length > 0;

  const billsList = purchase.bills || [];
  const hasBills = billsList.length > 0;

  const unpaidBills = billsList.filter(b => b.status === 'Unpaid' || b.status === 'Partially Paid' || (b.balance > 0));
  const canPay = !isVoid && (unpaidBills.length > 0 || Number(purchase.balance ?? 0) > 0);
  const paymentsList = purchase.payments || [];
  const hasPayments = paymentsList.length > 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 print:pb-0 print:m-0 print:space-y-0 fade-in px-4 sm:px-0">
      
      {feedback && (
        <div className={`p-4 rounded-xl flex items-center justify-between font-semibold ${
          feedback.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
        }`}>
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="font-bold ml-4">&times;</button>
        </div>
      )}

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
          <StatusBadge status={purchase.status || 'ORDERED'} />
        </div>
        
        <div className="flex items-center space-x-3">
          {!isVoid && (
            <button 
              onClick={handleVoidPurchase}
              className="px-4 py-2 bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 font-bold rounded-xl transition-colors shadow-sm flex items-center text-sm"
              title="Void this purchase order"
            >
              <Ban className="w-4 h-4 mr-1.5" />
              Void PO
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
                <button 
                  className="w-full flex items-center px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 border-b border-slate-100 transition-colors text-left"
                  onClick={() => {
                    setShowSendMenu(false);
                    setIsWhatsAppModalOpen(true);
                  }}
                >
                  <span className="w-8 h-8 mr-3 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  </span>
                  <div>
                    <div className="text-slate-800 font-bold">WhatsApp</div>
                    <div className="text-xs text-slate-500">Send PDF via WhatsApp</div>
                  </div>
                </button>
                <a 
                  href={`mailto:${supplier.email || ''}?subject=Purchase Order ${purchase.ref}&body=Hello,%0D%0A%0D%0APlease find attached the Purchase Order ${purchase.ref}.`}
                  className="flex items-center px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  onClick={() => setShowSendMenu(false)}
                >
                  <span className="w-8 h-8 mr-3 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
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

      {/* Receipt History */}
      {(hasReceipts || canReceive) && (
        <div id="goods-receipt-section" className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden print:hidden mb-6 scroll-mt-6">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight">Goods Receipt History (GRN)</h3>
              <p className="text-sm text-slate-500 font-medium">Log of warehouse deliveries against this purchase order (adds stock in kg)</p>
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
                    <th className="py-3 px-6 font-bold text-slate-500 uppercase tracking-wider text-center">Items Received (Kg)</th>
                    <th className="py-3 px-6 font-bold text-slate-500 uppercase tracking-wider text-right">Status</th>
                    <th className="py-3 px-6 font-bold text-slate-500 uppercase tracking-wider text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 bg-white">
                  {receiptsList.map((receipt) => (
                    <tr key={receipt.id} className={`hover:bg-slate-50 transition-colors ${receipt.status === 'Voided' ? 'opacity-50 grayscale' : ''}`}>
                      <td className="py-3 px-6 font-bold text-orange-600 hover:text-orange-700">{receipt.ref || receipt.id}</td>
                      <td className="py-3 px-6 text-slate-600 font-medium">{receipt.date}</td>
                      <td className="py-3 px-6 text-center font-bold text-slate-800">{receipt.itemsReceived} kg</td>
                      <td className="py-3 px-6 text-right">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold ${receipt.status === 'Voided' ? 'bg-slate-100 text-slate-500' : 'bg-emerald-100 text-emerald-700'}`}>
                          {receipt.status !== 'Voided' && <CheckCircle2 className="w-3.5 h-3.5 mr-1" />}
                          {receipt.status}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-right">
                        {receipt.status !== 'Voided' && !isVoid && (
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
              <h3 className="text-lg font-black text-slate-800 tracking-tight">Financial Ledger (Bills & Payments)</h3>
              <p className="text-sm text-slate-500 font-medium">Supplier bills and accounts payable settlements</p>
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
                    <th className="py-3 px-6 font-bold text-slate-500 uppercase tracking-wider text-right">Status / Mode</th>
                    <th className="py-3 px-6 font-bold text-slate-500 uppercase tracking-wider text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 bg-white">
                  {billsList.map((bill) => (
                    <tr key={bill.id} className={`hover:bg-slate-50 transition-colors ${bill.status === 'Voided' ? 'opacity-50 line-through' : ''}`}>
                      <td className="py-4 px-6 text-slate-600 font-medium">{bill.date}</td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-indigo-50 text-indigo-700">
                          Bill
                        </span>
                      </td>
                      <td className="py-4 px-6 font-bold text-indigo-600">{bill.ref || bill.id}</td>
                      <td className="py-4 px-6 text-right font-black text-slate-800">
                        {formatCurrency(bill.amount)}
                        {bill.balance > 0 && bill.balance < bill.amount && (
                          <div className="text-xs text-rose-500 font-semibold">Bal: {formatCurrency(bill.balance)}</div>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold ${
                          bill.status === 'Voided' ? 'bg-slate-100 text-slate-500' :
                          bill.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' :
                          bill.status === 'Partially Paid' ? 'bg-amber-100 text-amber-700' :
                          'bg-amber-50 text-amber-700'
                        }`}>
                          {bill.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        {bill.status !== 'Voided' && !isVoid && (
                          <button onClick={(e) => handleVoidBill(bill.id, e)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Void Bill">
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}

                  {paymentsList.map((payment) => (
                    <tr key={payment.id} className={`hover:bg-slate-50 transition-colors bg-emerald-50/20 ${payment.status === 'Voided' ? 'opacity-50 line-through' : ''}`}>
                      <td className="py-4 px-6 text-slate-600 font-medium">{payment.date}</td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-emerald-50 text-emerald-700">
                          Payment Out
                        </span>
                      </td>
                      <td className="py-4 px-6 font-bold text-emerald-600">{payment.ref || payment.id}</td>
                      <td className="py-4 px-6 text-right font-black text-emerald-700">
                        -{formatCurrency(payment.amount)}
                      </td>
                      <td className="py-4 px-6 text-right text-xs font-medium text-slate-600">
                        {payment.status === 'Voided' ? 'Voided' : (payment.method || payment.mode || 'Paid')}
                      </td>
                      <td className="py-4 px-6 text-right">
                        {payment.status !== 'Voided' && !isVoid && (
                          <button onClick={(e) => handleVoidPayment(payment.id, e)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Void Payment">
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
                <FileText className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-slate-500 font-medium">No bills or payments recorded yet.</p>
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
              {isVoid && (
                <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-700 uppercase">
                  <AlertCircle className="w-3.5 h-3.5 mr-1" />
                  VOID ORDER
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Company Details</div>
              <h3 className="font-bold text-slate-800 text-lg">{company?.companyName || 'My ERP Company'}</h3>
              <p className="text-slate-500 text-sm mt-1">
                {company?.address || 'Industrial Area'}<br/>
                {company?.city && company?.country ? `${company.city}, ${company.country}` : 'India'}<br/>
                {company?.taxNumber && `GST/TRN: ${company.taxNumber}`}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 pt-8 border-t border-slate-100">
            <div>
              <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Vendor / Supplier</div>
              <h4 className="font-bold text-slate-800 text-base">{supplier.companyName || supplier.company || purchase.supplierCompany || purchase.supplierName}</h4>
              <p className="text-slate-500 text-sm mt-0.5">
                {supplier.contactName || supplier.name || purchase.supplierName}<br/>
                {supplier.address || purchase.supplierAddress || ''}<br/>
                {supplier.phone || purchase.supplierPhone || ''}<br/>
                {supplier.email || purchase.supplierEmail || ''}
              </p>
            </div>
            
            <div className="flex md:justify-end">
              <div className="space-y-1.5 text-sm md:text-right w-full md:w-auto">
                <div className="flex justify-between md:justify-end md:space-x-8">
                  <span className="text-slate-500">Order Date:</span>
                  <span className="font-bold text-slate-800">{purchase.date}</span>
                </div>
                <div className="flex justify-between md:justify-end md:space-x-8">
                  <span className="text-slate-500">Expected Delivery:</span>
                  <span className="font-bold text-slate-800">{purchase.expectedDeliveryDate || 'N/A'}</span>
                </div>
                <div className="flex justify-between md:justify-end md:space-x-8">
                  <span className="text-slate-500">Balance Owed:</span>
                  <span className="font-bold text-rose-600">{formatCurrency(purchase.balance || 0)}</span>
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
                  <th className="pb-4 font-bold text-slate-500 uppercase tracking-wider">Product / Material</th>
                  <th className="pb-4 font-bold text-slate-500 uppercase tracking-wider text-center">Ordered (Kg)</th>
                  <th className="pb-4 font-bold text-slate-500 uppercase tracking-wider text-center export-hide print:hidden">Received (Kg)</th>
                  <th className="pb-4 font-bold text-slate-500 uppercase tracking-wider text-center export-hide print:hidden">Billed (Kg)</th>
                  <th className="pb-4 font-bold text-slate-500 uppercase tracking-wider text-right">Cost Price / Kg</th>
                  <th className="pb-4 font-bold text-slate-500 uppercase tracking-wider text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {poItems.map((item, idx) => {
                  const orderedKg = Number(item.orderedKg ?? item.ordered ?? 0);
                  const receivedKg = Number(item.receivedKg ?? item.received ?? 0);
                  const billedKg = Number(item.billedKg ?? item.billed ?? 0);
                  const unitPrice = Number(item.unitPrice ?? item.price ?? 0);
                  const lineTotal = orderedKg * unitPrice;

                  return (
                    <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                      <td className="py-4 pr-4">
                        <div className="font-bold text-slate-800">{item.name}</div>
                        {item.product?.sku && <div className="text-xs text-slate-400 font-mono">{item.product.sku}</div>}
                      </td>
                      <td className="py-4 px-2 text-center font-bold text-slate-800">{orderedKg} kg</td>
                      <td className="py-4 px-2 text-center export-hide print:hidden">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${receivedKg >= orderedKg ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {receivedKg} kg
                        </span>
                      </td>
                      <td className="py-4 px-2 text-center export-hide print:hidden">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${billedKg >= orderedKg ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {billedKg} kg
                        </span>
                      </td>
                      <td className="py-4 pl-4 text-right font-bold text-slate-800">{formatCurrency(unitPrice)}/kg</td>
                      <td className="py-4 pl-4 text-right font-black text-slate-800">{formatCurrency(lineTotal)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-8 flex flex-col md:flex-row justify-between items-start gap-8">
            <div className="w-full md:w-1/2">
              <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Internal Notes</div>
              <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">
                {purchase.notes || 'No special instructions recorded.'}
              </p>
            </div>
            
            <div className="w-full md:w-80 space-y-3">
              <div className="flex justify-between text-slate-600">
                <span className="font-medium">Subtotal</span>
                <span className="font-bold text-slate-800">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span className="font-medium">Tax ({Number(purchase.taxPercent || 5)}%)</span>
                <span className="font-bold text-slate-800">{formatCurrency(tax)}</span>
              </div>
              <div className="pt-3 border-t-2 border-slate-200 flex justify-between items-center">
                <span className="text-lg font-black text-slate-800">Total</span>
                <span className="text-2xl font-black text-orange-600">{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-600 pt-2 border-t border-slate-100">
                <span>Amount Paid:</span>
                <span className="font-bold text-emerald-600">{formatCurrency(purchase.paid || 0)}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-600">
                <span>Balance Due:</span>
                <span className="font-bold text-rose-600">{formatCurrency(purchase.balance || 0)}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      <PinModal 
        isOpen={isPinModalOpen} 
        onClose={() => { setIsPinModalOpen(false); setPendingAction(null); }} 
        onConfirm={handlePinConfirm} 
        message={pinModalMessage}
      />
      <WhatsAppPOPreviewModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        supplier={supplier}
        purchase={purchase}
      />
    </div>
  );
}
