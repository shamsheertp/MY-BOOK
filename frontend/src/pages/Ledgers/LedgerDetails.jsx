import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, FileText } from 'lucide-react';
import accountsData from '../../db/accounts.json';
import ledgersData from '../../db/ledgers.json';

export default function LedgerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const account = accountsData.find(a => a.id === id) || accountsData[0];
  const ledger = ledgersData.find(l => l.accountId === id) || { transactions: [] };

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
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate(-1)} className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm text-slate-500">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">{account.name}</h1>
            <p className="text-sm font-medium text-slate-500">Account Ledger • {account.code}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button onClick={handlePrint} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-sm flex items-center text-sm">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden print:shadow-none print:border-0 print:rounded-none">
        
        <div className="p-8 md:p-12 border-b border-slate-100 bg-slate-50/50">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">{account.name}</h2>
              <div className="text-slate-500 font-medium mt-1">Code: {account.code} • {account.type}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Current Balance</div>
              <div className="text-3xl font-black text-indigo-600">
                {formatCurrency(account.balance)}
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 md:p-12">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="pb-4 font-bold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="pb-4 font-bold text-slate-500 uppercase tracking-wider">Reference</th>
                  <th className="pb-4 font-bold text-slate-500 uppercase tracking-wider">Description</th>
                  <th className="pb-4 font-bold text-slate-500 uppercase tracking-wider text-right w-32">Debit</th>
                  <th className="pb-4 font-bold text-slate-500 uppercase tracking-wider text-right w-32">Credit</th>
                  <th className="pb-4 font-bold text-slate-500 uppercase tracking-wider text-right w-40">Running Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ledger.transactions.length > 0 ? (
                  ledger.transactions.map((txn, idx) => (
                    <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                      <td className="py-4 pr-4 font-medium text-slate-500">{txn.date}</td>
                      <td className="py-4 px-2 font-bold text-indigo-600">{txn.ref}</td>
                      <td className="py-4 px-2 text-slate-700">{txn.description}</td>
                      <td className="py-4 px-2 text-right font-medium text-slate-800">
                        {txn.debit > 0 ? formatCurrency(txn.debit) : '-'}
                      </td>
                      <td className="py-4 px-2 text-right font-medium text-slate-800">
                        {txn.credit > 0 ? formatCurrency(txn.credit) : '-'}
                      </td>
                      <td className="py-4 pl-4 text-right font-black text-slate-800">
                        {formatCurrency(txn.balance)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                          <FileText className="w-6 h-6 text-slate-400" />
                        </div>
                        <p className="font-medium">No transactions recorded for this account yet.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
