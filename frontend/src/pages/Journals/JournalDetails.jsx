import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, FileText, CheckCircle2 } from 'lucide-react';
import journalsData from '../../db/journals.json';

export default function JournalDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Find the journal by ref or id
  const journal = journalsData.find(j => j.ref === id || j.id.toString() === id) || journalsData[0];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const handlePrint = () => window.print();

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 print:pb-0 print:m-0 print:space-y-0 fade-in px-4 sm:px-0">
      
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate(-1)} className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm text-slate-500">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">{journal.ref}</h1>
            <p className="text-sm font-medium text-slate-500">Manual Journal</p>
          </div>
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            POSTED
          </span>
        </div>
        
        <div className="flex items-center space-x-3">
          <button onClick={handlePrint} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-sm flex items-center text-sm">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </button>
        </div>
      </div>

      {/* Journal Document */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden print:shadow-none print:border-0 print:rounded-none">
        
        {/* Document Header */}
        <div className="p-8 md:p-12 border-b border-slate-100 bg-slate-50/50">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">Journal Entry</h2>
              <div className="text-slate-500 font-medium mt-1"># {journal.ref}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Details</div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-end space-x-4">
                  <span className="text-slate-500">Date:</span>
                  <span className="font-bold text-slate-800 w-24">{journal.date}</span>
                </div>
                <div className="flex justify-end space-x-4">
                  <span className="text-slate-500">Created By:</span>
                  <span className="font-bold text-slate-800 w-24">{journal.createdBy}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Notes / Memo</div>
            <p className="text-slate-800 font-medium">{journal.notes}</p>
          </div>
        </div>

        {/* Entries Table */}
        <div className="p-8 md:p-12">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="pb-4 font-bold text-slate-500 uppercase tracking-wider">Account</th>
                  <th className="pb-4 font-bold text-slate-500 uppercase tracking-wider text-center">Contact</th>
                  <th className="pb-4 font-bold text-slate-500 uppercase tracking-wider text-right w-40">Debit</th>
                  <th className="pb-4 font-bold text-slate-500 uppercase tracking-wider text-right w-40">Credit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {journal.entries.map((entry, idx) => (
                  <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                    <td className="py-4 pr-4">
                      <div className="font-bold text-slate-800">{entry.account}</div>
                    </td>
                    <td className="py-4 px-2 text-center text-slate-500 font-medium">
                      {entry.contact || '-'}
                    </td>
                    <td className="py-4 px-2 text-right font-medium text-slate-800">
                      {entry.debit > 0 ? formatCurrency(entry.debit) : ''}
                    </td>
                    <td className="py-4 pl-4 text-right font-medium text-slate-800">
                      {entry.credit > 0 ? formatCurrency(entry.credit) : ''}
                    </td>
                  </tr>
                ))}
                
                {/* Totals Row */}
                <tr className="bg-slate-50/80">
                  <td colSpan="2" className="py-4 pr-4 text-right font-black text-slate-800 uppercase tracking-wider">
                    Total
                  </td>
                  <td className="py-4 px-2 text-right font-black text-slate-800">
                    {formatCurrency(journal.total)}
                  </td>
                  <td className="py-4 pl-4 text-right font-black text-slate-800">
                    {formatCurrency(journal.total)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className="mt-12 flex justify-center print:hidden">
             <div className="inline-flex items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
               <FileText className="w-5 h-5 text-slate-400 mr-2" />
               <span className="text-sm font-medium text-slate-500">This journal entry is balanced and posted to the general ledger.</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
