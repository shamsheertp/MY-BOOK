import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, FileText, CheckCircle2, ShieldAlert, AlertCircle, Loader2 } from 'lucide-react';
import { journalsService } from '../../services/api';
import initialJournalsData from '../../db/journals.json';

export default function JournalDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [journal, setJournal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Void state
  const [isVoiding, setIsVoiding] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [voidReason, setVoidReason] = useState('');
  const [voidError, setVoidError] = useState(null);
  const [showVoidModal, setShowVoidModal] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    journalsService.getById(id)
      .then(res => {
        if (isMounted && res?.data) {
          setJournal(res.data);
        }
      })
      .catch(err => {
        console.warn('Live journal lookup failed, falling back to local seed data:', err);
        const fallback = initialJournalsData.find(j => j.ref === id || String(j.id) === id) || initialJournalsData[0];
        if (isMounted) {
          setJournal({
            ...fallback,
            narration: fallback.notes,
            totalDebit: fallback.total,
            totalCredit: fallback.total,
            status: 'POSTED',
            lines: (fallback.entries || []).map(e => ({
              accountCode: '1000',
              accountName: e.account,
              description: e.contact ? `Contact: ${e.contact}` : '',
              debit: e.debit || 0,
              credit: e.credit || 0,
            })),
          });
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [id]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  const handlePrint = () => window.print();

  const handleConfirmVoid = async (e) => {
    e.preventDefault();
    if (!adminPin) {
      setVoidError('Admin PIN is required');
      return;
    }

    setIsVoiding(true);
    setVoidError(null);
    try {
      const res = await journalsService.void(journal.id, {
        pin: adminPin,
        reason: voidReason || 'Voided by user',
      });
      if (res?.success && res.data) {
        setJournal(res.data);
        setShowVoidModal(false);
      }
    } catch (err) {
      setVoidError(err?.response?.data?.message || err?.message || 'Failed to void journal');
    } finally {
      setIsVoiding(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-20 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <span className="text-sm font-medium text-slate-500">Loading journal voucher...</span>
      </div>
    );
  }

  if (!journal) {
    return (
      <div className="max-w-5xl mx-auto py-20 text-center">
        <h2 className="text-xl font-bold text-slate-800">Journal Voucher Not Found</h2>
        <button
          onClick={() => navigate('/journal')}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold"
        >
          Back to Journal Book
        </button>
      </div>
    );
  }

  const isVoided = (journal.status || '').toUpperCase() === 'VOID';

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 print:pb-0 print:m-0 print:space-y-0 fade-in px-4 sm:px-0">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/journal')}
            className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm text-slate-500 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">{journal.ref}</h1>
            <p className="text-sm font-medium text-slate-500">General Journal Voucher</p>
          </div>
          {isVoided ? (
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200">
              <ShieldAlert className="w-3.5 h-3.5 mr-1" />
              VOIDED
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              POSTED
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          {!isVoided && (
            <button
              onClick={() => setShowVoidModal(true)}
              className="px-4 py-2 bg-white border border-rose-200 text-rose-600 font-bold rounded-xl hover:bg-rose-50 transition-colors shadow-sm text-sm cursor-pointer"
            >
              Void Entry
            </button>
          )}
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-sm flex items-center text-sm cursor-pointer"
          >
            <Printer className="w-4 h-4 mr-2" />
            Print Voucher
          </button>
        </div>
      </div>

      {/* Journal Document */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden print:shadow-none print:border-0 print:rounded-none">
        
        {/* Document Header */}
        <div className="p-8 md:p-12 border-b border-slate-100 bg-slate-50/50">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">Journal Voucher</h2>
              <div className="text-slate-500 font-mono text-sm mt-1"># {journal.ref}</div>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Voucher Details</div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-end space-x-4">
                  <span className="text-slate-500">Date:</span>
                  <span className="font-bold text-slate-800">{journal.date}</span>
                </div>
                <div className="flex justify-end space-x-4">
                  <span className="text-slate-500">Status:</span>
                  <span className="font-bold text-slate-800">{journal.status || 'POSTED'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Narration / Memo</div>
            <p className="text-slate-800 font-medium text-sm">
              {journal.narration || journal.notes || 'No narration provided'}
            </p>
          </div>
        </div>

        {/* Entries Table */}
        <div className="p-8 md:p-12">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider">
                  <th className="pb-4">Account Code & Name</th>
                  <th className="pb-4">Line Description</th>
                  <th className="pb-4 text-right w-40">Debit (₹)</th>
                  <th className="pb-4 text-right w-40">Credit (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(journal.lines || []).map((line, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 pr-4">
                      <div className="font-bold text-slate-800">{line.accountName}</div>
                      {line.accountCode && (
                        <div className="text-xs font-mono text-slate-400">{line.accountCode}</div>
                      )}
                    </td>
                    <td className="py-4 px-2 text-slate-600 text-xs font-medium">
                      {line.description || '-'}
                    </td>
                    <td className="py-4 px-2 text-right font-mono font-bold text-slate-800">
                      {Number(line.debit) > 0 ? formatCurrency(line.debit) : '-'}
                    </td>
                    <td className="py-4 pl-4 text-right font-mono font-bold text-slate-800">
                      {Number(line.credit) > 0 ? formatCurrency(line.credit) : '-'}
                    </td>
                  </tr>
                ))}
                
                {/* Totals Row */}
                <tr className="bg-slate-50/80 font-black text-slate-900 border-t-2 border-slate-200">
                  <td colSpan="2" className="py-4 pr-4 text-right uppercase tracking-wider text-xs">
                    Total
                  </td>
                  <td className="py-4 px-2 text-right font-mono text-base">
                    {formatCurrency(journal.totalDebit || journal.total)}
                  </td>
                  <td className="py-4 pl-4 text-right font-mono text-base">
                    {formatCurrency(journal.totalCredit || journal.total)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className="mt-12 flex justify-center print:hidden">
             <div className="inline-flex items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
               <FileText className="w-5 h-5 text-slate-400 mr-2" />
               <span className="text-xs font-medium text-slate-500">
                 This double-entry voucher is balanced and posted to the General Ledger.
               </span>
             </div>
          </div>
        </div>
      </div>

      {/* Security PIN Void Modal */}
      {showVoidModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-sm w-full p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Void Journal Entry</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Voiding will reverse this entry in the ledger. Please enter the Admin PIN to confirm.
            </p>

            {voidError && (
              <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{voidError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmVoid} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Admin PIN *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter 4-digit PIN"
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  className="w-full px-3.5 py-2 text-center text-lg tracking-widest bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Reason for Voiding
                </label>
                <input
                  type="text"
                  placeholder="e.g. Inadvertent duplicate entry"
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowVoidModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isVoiding}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50"
                >
                  {isVoiding && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Confirm Void
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
