import { useState, useMemo } from 'react';
import { X, Plus, Trash2, CheckCircle2, AlertCircle, Loader2, BookOpen } from 'lucide-react';
import { journalsService } from '../../../services/api';

const STANDARD_ACCOUNTS = [
  { code: '1010', name: 'Cash on Hand', type: 'Asset' },
  { code: '1020', name: 'Bank Accounts', type: 'Asset' },
  { code: '1200', name: 'Accounts Receivable', type: 'Asset' },
  { code: '1500', name: 'Merchandise Inventory', type: 'Asset' },
  { code: '1700', name: 'Equipment & Fixtures', type: 'Asset' },
  { code: '2000', name: 'Accounts Payable', type: 'Liability' },
  { code: '2100', name: 'Sales Tax / GST Payable', type: 'Liability' },
  { code: '3000', name: "Owner's Capital", type: 'Equity' },
  { code: '3900', name: 'Retained Earnings', type: 'Equity' },
  { code: '4000', name: 'Sales Revenue', type: 'Revenue' },
  { code: '4100', name: 'Service Income', type: 'Revenue' },
  { code: '5000', name: 'Cost of Goods Sold (COGS)', type: 'Expense' },
  { code: '5100', name: 'Salaries & Wages', type: 'Expense' },
  { code: '5200', name: 'Rent & Lease', type: 'Expense' },
  { code: '5300', name: 'Utilities & Telecom', type: 'Expense' },
  { code: '5400', name: 'Office Supplies', type: 'Expense' },
  { code: '5500', name: 'Marketing & Advertising', type: 'Expense' },
  { code: '5600', name: 'Travel & Transportation', type: 'Expense' },
  { code: '5900', name: 'Miscellaneous Expenses', type: 'Expense' },
];

export function CreateJournalModal({ isOpen, onClose, onSuccess }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [narration, setNarration] = useState('');
  const [lines, setLines] = useState([
    { accountCode: '1020', accountName: 'Bank Accounts', description: '', debit: '', credit: '' },
    { accountCode: '4000', accountName: 'Sales Revenue', description: '', debit: '', credit: '' },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Line calculations
  const totalDebit = useMemo(() => {
    return lines.reduce((sum, l) => sum + (parseFloat(l.debit) || 0), 0);
  }, [lines]);

  const totalCredit = useMemo(() => {
    return lines.reduce((sum, l) => sum + (parseFloat(l.credit) || 0), 0);
  }, [lines]);

  const diff = useMemo(() => {
    return Math.abs(totalDebit - totalCredit);
  }, [totalDebit, totalCredit]);

  const isBalanced = diff < 0.01 && totalDebit > 0;

  const handleLineChange = (index, field, value) => {
    setLines(prev => {
      const copy = [...prev];
      if (field === 'accountCode') {
        const found = STANDARD_ACCOUNTS.find(a => a.code === value);
        copy[index] = {
          ...copy[index],
          accountCode: value,
          accountName: found ? found.name : copy[index].accountName,
        };
      } else if (field === 'debit') {
        // Clear credit if debit is entered
        copy[index] = {
          ...copy[index],
          debit: value,
          credit: value ? '' : copy[index].credit,
        };
      } else if (field === 'credit') {
        // Clear debit if credit is entered
        copy[index] = {
          ...copy[index],
          credit: value,
          debit: value ? '' : copy[index].debit,
        };
      } else {
        copy[index] = { ...copy[index], [field]: value };
      }
      return copy;
    });
  };

  const handleAddLine = () => {
    setLines(prev => [
      ...prev,
      { accountCode: '1010', accountName: 'Cash on Hand', description: '', debit: '', credit: '' },
    ]);
  };

  const handleRemoveLine = (index) => {
    if (lines.length <= 2) {
      setError('A double-entry journal voucher must have at least 2 lines.');
      return;
    }
    setError(null);
    setLines(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isBalanced) {
      setError(`Cannot post journal: Debits (₹${totalDebit.toFixed(2)}) must equal Credits (₹${totalCredit.toFixed(2)}). Difference is ₹${diff.toFixed(2)}.`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        date,
        narration: narration.trim() || null,
        lines: lines.map(l => ({
          accountCode: l.accountCode,
          accountName: l.accountName,
          description: l.description.trim() || null,
          debit: parseFloat(l.debit) || 0,
          credit: parseFloat(l.credit) || 0,
        })),
      };

      const res = await journalsService.create(payload);
      if (res?.success) {
        onSuccess(res.data);
        onClose();
      }
    } catch (err) {
      console.error('Failed to post journal entry:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to post journal entry');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">New Journal Voucher</h2>
              <p className="text-xs text-slate-500">Record a double-entry financial voucher directly to ledger</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-2xl flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Date and Narration Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Voucher Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Narration / General Notes
              </label>
              <input
                type="text"
                placeholder="e.g. Month-end depreciation adjustment, partner equity injection"
                value={narration}
                onChange={(e) => setNarration(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Double Entry Lines Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Voucher Lines (Double-Entry Debit & Credit)
              </span>
              <button
                type="button"
                onClick={handleAddLine}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Line
              </button>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3 w-48">Account</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3 w-32 text-right">Debit (₹)</th>
                    <th className="py-2.5 px-3 w-32 text-right">Credit (₹)</th>
                    <th className="py-2.5 px-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {lines.map((line, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3">
                        <select
                          value={line.accountCode}
                          onChange={(e) => handleLineChange(idx, 'accountCode', e.target.value)}
                          className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-medium"
                        >
                          {STANDARD_ACCOUNTS.map(acct => (
                            <option key={acct.code} value={acct.code}>
                              {acct.code} - {acct.name} ({acct.type})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          placeholder="Line note..."
                          value={line.description}
                          onChange={(e) => handleLineChange(idx, 'description', e.target.value)}
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={line.debit}
                          onChange={(e) => handleLineChange(idx, 'debit', e.target.value)}
                          className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-right font-mono font-bold outline-none focus:ring-1 focus:ring-indigo-500 text-xs text-slate-800"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={line.credit}
                          onChange={(e) => handleLineChange(idx, 'credit', e.target.value)}
                          className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-right font-mono font-bold outline-none focus:ring-1 focus:ring-indigo-500 text-xs text-slate-800"
                        />
                      </td>
                      <td className="py-2 px-2 text-center">
                        <button
                          type="button"
                          disabled={lines.length <= 2}
                          onClick={() => handleRemoveLine(idx)}
                          className="p-1 text-slate-300 hover:text-rose-500 disabled:opacity-20 transition-colors"
                          title="Remove line"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Double-Entry Balancing Bar */}
          <div className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            isBalanced
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
              : 'bg-rose-50/80 border-rose-200 text-rose-900'
          }`}>
            <div className="flex items-center gap-2">
              {isBalanced ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <div>
                <div className="text-xs font-bold">
                  {isBalanced
                    ? 'Double-Entry In Balance'
                    : `Out of Balance by ₹${diff.toFixed(2)}`}
                </div>
                <div className="text-[11px] opacity-80">
                  {isBalanced
                    ? 'Total debits exactly equal total credits. Ready to post.'
                    : 'Debits and credits must be equal before posting to ledger.'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 font-mono text-xs">
              <div>
                <span className="text-[10px] uppercase font-sans text-slate-500 block">Total Debits</span>
                <span className="font-bold text-slate-900">₹{totalDebit.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-sans text-slate-500 block">Total Credits</span>
                <span className="font-bold text-slate-900">₹{totalCredit.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !isBalanced}
              className="inline-flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-md shadow-indigo-600/20 disabled:opacity-40 transition-all cursor-pointer"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Post Journal Voucher
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
