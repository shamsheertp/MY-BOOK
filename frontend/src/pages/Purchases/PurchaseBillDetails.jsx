import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Printer, FileText } from 'lucide-react';
import purchasesData from '../../db/purchases.json';
import contactsData from '../../db/contacts.json';
import { useCompanyProfile } from '../../hooks/useCompanyProfile';

export default function PurchaseBillDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const company = useCompanyProfile();

  let bill = null;
  let purchase = null;

  for (const p of purchasesData) {
    if (p.bills) {
      const found = p.bills.find(b => b.id === id);
      if (found) {
        bill = found;
        purchase = p;
        break;
      }
    }
  }

  if (!bill) {
    // If we have a mock bill from the initial state
    purchase = purchasesData.find(p => p.ref === `PO-2026-${id.split('-')[1]}`) || purchasesData[0];
    bill = {
      id: id,
      date: purchase.date,
      amount: (purchase.items || []).reduce((acc, item) => acc + (item.billed * item.price), 0) * 1.05 || 0,
      status: 'Unpaid'
    };
  }

  const supplier = contactsData.find(c => c.id === `CONT-${purchase.supplierId.split('-')[1]}`) || contactsData[0];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(amount);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 print:pb-0 print:m-0 print:space-y-0 fade-in px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate(-1)} className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm text-slate-500">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">{bill.id}</h1>
            <p className="text-sm font-medium text-slate-500">Purchase Bill against <Link to={`/purchases/${purchase.ref}`} className="text-indigo-600 hover:underline">{purchase.ref}</Link></p>
          </div>
        </div>
        
        <button onClick={() => window.print()} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-sm flex items-center">
          <Printer className="w-4 h-4 mr-2" />
          Print
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden print:shadow-none print:border-0 print:rounded-none">
        <div className="p-8 md:p-12 border-b border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">Purchase Bill</h2>
              <div className="text-slate-500 font-medium mt-1"># {bill.id}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Company Details</div>
              <h3 className="font-bold text-slate-800 text-lg">{company?.companyName}</h3>
              <p className="text-slate-500 text-sm mt-1">{company?.address}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
            <div>
              <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Billed From</div>
              <h4 className="font-bold text-slate-800 text-lg">{supplier.companyName || supplier.company}</h4>
              <p className="text-slate-500 text-sm mt-1">{supplier.contactName || supplier.name}</p>
            </div>

            <div>
              <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Bill Details</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Date:</span>
                  <span className="font-bold text-slate-800">{bill.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className="font-bold text-amber-600">{bill.status}</span>
                </div>
                <div className="flex justify-between mt-4 pt-4 border-t border-slate-100">
                  <span className="text-slate-800 font-bold text-base">Total Amount:</span>
                  <span className="font-black text-slate-800 text-xl">{formatCurrency(bill.amount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

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
