import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Printer, PackageCheck, CheckCircle2 } from 'lucide-react';
import purchasesData from '../../db/purchases.json';
import contactsData from '../../db/contacts.json';
import { useCompanyProfile } from '../../hooks/useCompanyProfile';

export default function GRNDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const company = useCompanyProfile();

  // Mock parsing PO ref from GRN id (e.g. GRN-001-01 -> PO-2026-001)
  const poSuffix = id.split('-')[1];
  const poRef = `PO-2026-${poSuffix}`;
  const purchase = purchasesData.find(p => p.ref === poRef) || purchasesData[0];
  
  const supplierId = purchase.supplierId;
  const supplier = contactsData.find(c => c.id === `CONT-${supplierId.split('-')[1]}`) || contactsData[0];

  // We only show items that have been received
  const receivedItems = (purchase.items || []).filter(i => i.received > 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 print:pb-0 print:m-0 print:space-y-0 fade-in px-4 sm:px-0">
      
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate(-1)} className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm text-slate-500">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">{id}</h1>
            <p className="text-sm font-medium text-slate-500">Goods Receipt Note</p>
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            COMPLETED
          </span>
        </div>
        
        <div className="flex items-center space-x-3">
          <button onClick={handlePrint} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-sm flex items-center">
            <Printer className="w-4 h-4 mr-2" />
            Print GRN
          </button>
        </div>
      </div>

      {/* GRN Document */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden print:shadow-none print:border-0 print:rounded-none">
        
        {/* Document Header */}
        <div className="p-8 md:p-12 border-b border-slate-100 bg-slate-50/30">
          <div className="flex justify-between items-start">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center mr-4 print:hidden">
                <PackageCheck className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">Goods Receipt</h2>
                <div className="text-slate-500 font-medium mt-1"># {id}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Received At</div>
              <h3 className="font-bold text-slate-800 text-lg">{company?.companyName}</h3>
              <p className="text-slate-500 text-sm mt-1">
                {company?.address}<br/>
                {company?.city && company?.country ? `${company.city}, ${company.country}` : ''}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
            <div>
              <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Supplier</div>
              <h4 className="font-bold text-slate-800 text-lg">{supplier.companyName || supplier.company}</h4>
              <p className="text-slate-500 text-sm mt-1">{supplier.contactName || supplier.name}</p>
            </div>

            <div>
              <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Reference</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Related PO:</span>
                  <Link to={`/purchases/${purchase.ref}`} className="font-bold text-orange-600 hover:underline">{purchase.ref}</Link>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Receipt Date:</span>
                  <span className="font-bold text-slate-800">{purchase.date}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Received Items Table */}
        <div className="p-8 md:p-12">
          <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Items Received</div>
          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="py-4 px-6 font-bold text-slate-500 uppercase tracking-wider">Product / Service</th>
                  <th className="py-4 px-6 font-bold text-slate-500 uppercase tracking-wider text-center">Qty Ordered</th>
                  <th className="py-4 px-6 font-bold text-orange-600 uppercase tracking-wider text-center">Qty Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {receivedItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-800">{item.name}</div>
                    </td>
                    <td className="py-4 px-6 text-center font-bold text-slate-500">{item.ordered}</td>
                    <td className="py-4 px-6 text-center font-black text-slate-800 text-lg bg-orange-50/30">
                      {item.received}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
