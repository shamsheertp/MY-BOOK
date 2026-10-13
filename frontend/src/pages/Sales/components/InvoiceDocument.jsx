import { Link } from 'react-router-dom';
import { useCompanyProfile, formatAddressLines } from '../../../hooks/useCompanyProfile';

export function InvoiceDocument({ sale, customer, subtotal, discount, tax, total, formatCurrency }) {
  const company = useCompanyProfile();
  const addressLines = formatAddressLines(company);
  const showBank = company.showBankOnInvoice && (company.bankName || company.accountNumber || company.upiId);

  return (
      <div id="invoice-document-capture" className="glass-card bg-white/95 rounded-2xl shadow-xl overflow-hidden border border-white print:border-none print:shadow-none print:bg-white print:rounded-none relative">
        {sale.status === 'VOID' && (
          <div className="bg-rose-500/10 border-b border-rose-200 px-8 py-3 flex items-center justify-between text-rose-700 font-bold text-sm print:bg-transparent print:border-b-2 print:border-rose-300">
            <span className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 bg-rose-600 text-white rounded-md text-xs tracking-widest uppercase font-black shadow-sm">VOID</span>
              <span>This invoice has been cancelled and voided.</span>
            </span>
            <span className="text-xs text-rose-600 font-bold uppercase tracking-wider">No Amount Due</span>
          </div>
        )}
        <div className="p-10 border-b border-slate-100 bg-slate-50/50 print:p-4 print:pb-2 print:border-b-2">
          <div className="flex flex-col md:flex-row justify-between items-start">
            <div className="mb-8 md:mb-0 print:mb-2">
              <div className="flex items-center space-x-3 mb-4 print:mb-2">
                {company.logo ? (
                  <img src={company.logo} alt={company.companyName} className="w-12 h-12 object-contain rounded-lg print:w-10 print:h-10" />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 print:w-8 print:h-8 print:rounded-md">
                    <span className="text-white font-bold text-xl print:text-base">{(company.companyName || 'M')[0].toUpperCase()}</span>
                  </div>
                )}
                <div>
                  <span className="block text-2xl font-bold animated-gradient-text tracking-tight print:text-lg print:text-slate-900">{company.companyName}</span>
                  {company.tagline && <span className="block text-xs text-slate-500 print:text-[10px]">{company.tagline}</span>}
                </div>
              </div>
              <div className="text-sm text-slate-500 space-y-1 print:text-xs print:space-y-0.5">
                {addressLines.map((line, i) => <p key={i}>{line}</p>)}
                {company.gstin && <p className="font-semibold text-slate-600">GSTIN: {company.gstin.toUpperCase()}</p>}
                {company.pan && <p className="text-slate-500">PAN: {company.pan.toUpperCase()}</p>}
                {company.email && <p>{company.email}</p>}
                {company.phone && <p>{company.phone}</p>}
                {company.website && <p>{company.website}</p>}
              </div>
            </div>

            <div className="text-left md:text-right">
              <h1 className={`text-4xl font-black tracking-widest uppercase mb-4 print:text-2xl print:mb-2 ${sale.status === 'VOID' ? 'text-rose-300 line-through' : 'text-slate-200 print:text-slate-400'}`}>
                {sale.status === 'VOID' ? 'VOID' : 'Invoice'}
              </h1>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm text-left md:text-right print:text-xs print:gap-y-1 print:gap-x-4">
                <span className="text-slate-500 font-medium">Invoice No:</span>
                <span className="font-bold text-slate-800">{sale.ref}</span>
                
                <span className="text-slate-500 font-medium">Date:</span>
                <span className="text-slate-800">{sale.date}</span>
                
                <span className="text-slate-500 font-medium">Due Date:</span>
                <span className="text-slate-800 font-medium">{sale.dueDate}</span>
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-slate-200 pt-6 print:mt-4 print:pt-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 print:mb-1 print:text-[10px]">Billed To</h3>
            {customer?.id ? (
              <Link to={`/customers/${customer.id}`} className="text-lg font-bold text-indigo-600 hover:text-indigo-800 transition-colors inline-block mb-1 print:text-base print:text-slate-900">
                {customer.name || customer.contactName || sale.customerName}
              </Link>
            ) : (
              <span className="text-lg font-bold text-slate-800 inline-block mb-1 print:text-base">
                {sale.customerName || 'Walk-in Customer'}
              </span>
            )}
            <div className="text-sm text-slate-600 space-y-1 print:text-xs print:space-y-0">
              <p>{customer?.company || customer?.companyName || sale.customerCompany}</p>
              <p>{customer?.address || sale.customerAddress}</p>
              {(customer?.taxNumber || customer?.gst) && (
                <p className="font-semibold text-slate-700 mt-1">GSTIN: {customer.taxNumber || customer.gst}</p>
              )}
              <p>{customer?.email || sale.customerEmail}</p>
            </div>
          </div>
        </div>

        <div className="p-10 print:p-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-200 text-sm font-bold text-slate-800 uppercase tracking-wider print:text-xs">
                  <th className="py-4 pr-4 print:py-2">Description</th>
                  <th className="py-4 px-4 text-center print:py-2">Weight (kg)</th>
                  <th className="py-4 px-4 text-right print:py-2">Price / kg</th>
                  <th className="py-4 pl-4 text-right print:py-2">Amount</th>
                </tr>
              </thead>
              <tbody className="text-slate-700 print:text-xs">
                {(sale.items || sale.products || []).map((item, idx) => (
                  <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 pr-4 font-medium print:py-2">{item.name}</td>
                    <td className="py-4 px-4 text-center text-slate-500 print:py-2 font-mono">
                      {item.quantityKg ?? item.qty} kg
                    </td>
                    <td className="py-4 px-4 text-right text-slate-500 print:py-2">
                      {formatCurrency(item.unitPrice ?? item.price)}
                    </td>
                    <td className="py-4 pl-4 text-right font-bold text-slate-800 print:py-2">
                      {formatCurrency(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="p-10 bg-slate-50/80 border-t border-slate-100 flex justify-end print:p-4 print:bg-white print:border-t-2">
          <div className="w-full md:w-[350px]">
            <div className="space-y-3 text-sm text-slate-600 print:space-y-1 print:text-xs">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-medium text-slate-800">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Discount</span>
                <span className="font-medium text-slate-800">{formatCurrency(discount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span className="font-medium text-slate-800">{formatCurrency(tax)}</span>
              </div>
            </div>
            
            <div className="my-4 border-t border-slate-200 print:my-2"></div>
            
            <div className="flex justify-between items-end">
              <span className="text-sm font-bold text-slate-800 print:text-xs">Total</span>
              <span className="text-xl font-black text-slate-900 print:text-base">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        {/* Bank details, terms & signature */}
        <div className="p-10 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-8 print:p-4 print:gap-4 print:grid-cols-3">
          <div>
            {showBank && (
              <>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 print:text-[10px] print:mb-1">Bank Details</h3>
                <div className="text-sm text-slate-600 space-y-0.5 print:text-xs">
                  {company.accountHolder && <p><span className="text-slate-400">A/C Name:</span> {company.accountHolder}</p>}
                  {company.bankName && <p><span className="text-slate-400">Bank:</span> {company.bankName}</p>}
                  {company.accountNumber && <p><span className="text-slate-400">A/C No:</span> {company.accountNumber}</p>}
                  {company.ifsc && <p><span className="text-slate-400">IFSC:</span> {company.ifsc.toUpperCase()}</p>}
                  {company.upiId && <p><span className="text-slate-400">UPI:</span> {company.upiId}</p>}
                </div>
              </>
            )}
          </div>
          <div>
            {company.invoiceTerms && (
              <>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 print:text-[10px] print:mb-1">Terms & Conditions</h3>
                <p className="text-xs text-slate-500 whitespace-pre-line leading-relaxed">{company.invoiceTerms}</p>
              </>
            )}
          </div>
          <div className="flex flex-col items-start md:items-end justify-end">
            <p className="text-xs text-slate-500 mb-10 print:mb-6">For <span className="font-semibold text-slate-700">{company.companyName}</span></p>
            <div className="w-40 border-t border-slate-300 pt-1 text-xs text-slate-500 text-center">{company.signatoryName || 'Authorized Signatory'}</div>
          </div>
        </div>

        {company.footerNote && (
          <div className="px-10 py-4 bg-slate-50/80 border-t border-slate-100 text-center text-sm text-slate-500 italic print:py-2 print:text-xs print:bg-white">
            {company.footerNote}
          </div>
        )}
      </div>
  );
}
