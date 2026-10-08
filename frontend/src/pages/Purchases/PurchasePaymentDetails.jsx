import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import purchasesData from '../../db/purchases.json';
import contactsData from '../../db/contacts.json';
import { useCompanyProfile } from '../../hooks/useCompanyProfile';

export default function PurchasePaymentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const company = useCompanyProfile();

  let payment = null;
  let purchase = null;

  for (const p of purchasesData) {
    if (p.payments) {
      const found = p.payments.find(pm => pm.id === id);
      if (found) {
        payment = found;
        purchase = p;
        break;
      }
    }
  }

  if (!payment) {
    // Attempt fallback logic for mock data if needed
    purchase = purchasesData.find(p => p.payments?.some(pm => pm.id === id)) || purchasesData[0];
    payment = purchase.payments?.find(pm => pm.id === id) || {
      id: id,
      date: purchase.date,
      mode: 'Bank Transfer',
      reference: 'MOCK-123',
      amount: purchase.paid || 0
    };
  }

  const supplier = contactsData.find(c => c.id === `CONT-${purchase.supplierId.split('-')[1]}`) || contactsData[0];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(amount);
  };

  // Reconstruct allocation to see what bills THIS payment paid
  const appliedBills = [];
  if (purchase && payment && payment.status !== 'Voided') {
    const mockBills = purchase.bills || [];
    const mockPayments = (purchase.payments || []).filter(p => p.status !== 'Voided').sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const unallocatedPayments = [...mockPayments].map(p => ({ ...p, usedAmount: 0 }));
    
    mockBills.sort((a, b) => new Date(a.date) - new Date(b.date)).forEach(bill => {
      let owed = bill.amount;
      unallocatedPayments.forEach(pay => {
        if (owed > 0) {
          const availableAmount = pay.amount - pay.usedAmount;
          if (availableAmount > 0) {
            const applied = Math.min(owed, availableAmount);
            if (pay.id === payment.id) {
              appliedBills.push({
                billId: bill.id,
                date: bill.date,
                appliedAmount: applied,
                billTotal: bill.amount
              });
            }
            pay.usedAmount += applied;
            owed -= applied;
          }
        }
      });
    });
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 print:pb-0 print:m-0 print:space-y-0 fade-in px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate(-1)} className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm text-slate-500">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">{payment.id}</h1>
            <p className="text-sm font-medium text-slate-500">Payment made against <Link to={`/purchases/${purchase.ref}`} className="text-emerald-600 hover:underline">{purchase.ref}</Link></p>
          </div>
        </div>
        
        <button onClick={() => window.print()} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-sm flex items-center">
          <Printer className="w-4 h-4 mr-2" />
          Print Receipt
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden print:shadow-none print:border-0 print:rounded-none">
        <div className="p-8 md:p-12 border-b border-slate-100 bg-emerald-50/30">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-black text-emerald-800 tracking-tighter uppercase">Payment Receipt</h2>
              <div className="text-emerald-600 font-medium mt-1"># {payment.id}</div>
            </div>
            <div className="text-right">
              <h3 className="font-bold text-slate-800 text-lg">{company?.companyName}</h3>
              <p className="text-slate-500 text-sm mt-1">{company?.address}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
            <div>
              <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Paid To</div>
              <h4 className="font-bold text-slate-800 text-lg">{supplier.companyName || supplier.company}</h4>
              <p className="text-slate-500 text-sm mt-1">{supplier.contactName || supplier.name}</p>
            </div>

            <div>
              <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Payment Details</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Date:</span>
                  <span className="font-bold text-slate-800">{payment.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Mode:</span>
                  <span className="font-bold text-slate-800">{payment.mode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Reference:</span>
                  <span className="font-bold text-slate-800">{payment.reference}</span>
                </div>
                <div className="flex justify-between mt-4 pt-4 border-t border-slate-200">
                  <span className="text-slate-600 font-medium text-base">Amount Paid:</span>
                  <span className="font-black text-emerald-600 text-2xl">{formatCurrency(payment.amount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Applied Bills Table */}
        {appliedBills.length > 0 ? (
          <div className="p-8 md:p-12 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Payment Application</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4 font-bold text-slate-500 uppercase tracking-wider rounded-tl-lg">Bill #</th>
                    <th className="py-3 px-4 font-bold text-slate-500 uppercase tracking-wider">Bill Date</th>
                    <th className="py-3 px-4 font-bold text-slate-500 uppercase tracking-wider text-right">Bill Total</th>
                    <th className="py-3 px-4 font-bold text-emerald-600 uppercase tracking-wider text-right rounded-tr-lg">Amount Applied</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {appliedBills.map((b, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-bold text-indigo-600 cursor-pointer hover:underline" onClick={() => navigate(`/purchases/bills/${b.billId}`)}>{b.billId}</td>
                      <td className="py-3 px-4 text-slate-600 font-medium">{b.date}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-600">{formatCurrency(b.billTotal)}</td>
                      <td className="py-3 px-4 text-right font-black text-slate-800">{formatCurrency(b.appliedAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : payment.status !== 'Voided' ? (
          <div className="p-8 md:p-12 border-t border-slate-100">
            <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl">
              <p className="text-amber-700 text-sm font-bold">Unapplied Payment</p>
              <p className="text-amber-600 text-xs font-medium mt-1">This payment is currently unapplied. It acts as an advance or overpayment on this Purchase Order, or belongs to legacy data.</p>
            </div>
          </div>
        ) : null}

        {/* Items Summary (For context) */}
        {purchase && purchase.items && purchase.items.length > 0 && (
          <div className="p-8 md:p-12 border-t border-slate-100 bg-slate-50/30">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Items Summary</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-white border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 font-bold text-slate-500 uppercase tracking-wider rounded-tl-lg">Item</th>
                    <th className="py-3 px-4 font-bold text-slate-500 uppercase tracking-wider text-right">Qty Billed</th>
                    <th className="py-3 px-4 font-bold text-slate-500 uppercase tracking-wider text-right">Price</th>
                    <th className="py-3 px-4 font-bold text-slate-500 uppercase tracking-wider text-right rounded-tr-lg">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {purchase.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-700">{item.name}</td>
                      <td className="py-3 px-4 text-right text-slate-600">{item.billed || item.ordered}</td>
                      <td className="py-3 px-4 text-right text-slate-600">{formatCurrency(item.price)}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-800">{formatCurrency((item.billed || item.ordered) * item.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
