import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, ShoppingCart, Receipt, X, CornerDownLeft } from 'lucide-react';
import contactsData from '../../db/contacts.json';
import salesData from '../../db/sales.json';
import purchasesData from '../../db/purchases.json';

const MAX_PER_GROUP = 5;

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);

// Map CUST-00X / SUP-00X -> contact name (same digit mapping used elsewhere)
const contactNameByDigit = (prefixedId) => {
  if (!prefixedId) return '';
  const digit = prefixedId.split('-')[1];
  return contactsData.find(c => c.id === `CONT-${digit}`)?.contactName || '';
};

function Highlight({ text, query }) {
  if (!query || !text) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-indigo-100 text-indigo-700 rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export function GlobalSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  const q = query.trim().toLowerCase();

  const groups = useMemo(() => {
    if (!q) return [];
    const digitsQ = q.replace(/\D/g, '');

    const contacts = contactsData
      .filter(c =>
        c.contactName?.toLowerCase().includes(q) ||
        c.companyName?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        (digitsQ.length >= 3 && c.phone?.replace(/\D/g, '').includes(digitsQ))
      )
      .slice(0, MAX_PER_GROUP)
      .map(c => ({
        key: `c-${c.id}`,
        title: c.contactName,
        subtitle: `${c.companyName} · ${c.phone}`,
        badge: c.type,
        path: `/contacts/${c.id}`,
      }));

    const sales = salesData
      .filter(s => s.ref?.toLowerCase().includes(q) || s.customerName?.toLowerCase().includes(q))
      .slice(0, MAX_PER_GROUP)
      .map(s => ({
        key: `s-${s.id}`,
        title: s.ref,
        subtitle: `${s.customerName} · ${s.date}`,
        badge: formatCurrency(s.total),
        path: `/sales/${s.ref}`,
      }));

    const purchases = purchasesData
      .map(p => ({ ...p, supplierName: contactNameByDigit(p.supplierId) }))
      .filter(p => p.ref?.toLowerCase().includes(q) || p.supplierName.toLowerCase().includes(q))
      .slice(0, MAX_PER_GROUP)
      .map(p => ({
        key: `p-${p.id}`,
        title: p.ref,
        subtitle: `${p.supplierName || p.supplierId} · ${p.date}`,
        badge: formatCurrency(p.total),
        path: `/purchases/${p.ref}`,
      }));

    return [
      { label: 'Contacts', icon: Users, color: 'text-emerald-600 bg-emerald-50', items: contacts },
      { label: 'Sales', icon: ShoppingCart, color: 'text-indigo-600 bg-indigo-50', items: sales },
      { label: 'Purchases', icon: Receipt, color: 'text-orange-600 bg-orange-50', items: purchases },
    ].filter(g => g.items.length > 0);
  }, [q]);

  const flatResults = useMemo(() => groups.flatMap(g => g.items), [groups]);

  useEffect(() => setActiveIndex(0), [q]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Ctrl/Cmd + K to focus
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const goTo = (item) => {
    navigate(item.path);
    setQuery('');
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (!flatResults.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => (i + 1) % flatResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => (i - 1 + flatResults.length) % flatResults.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      goTo(flatResults[activeIndex]);
    }
  };

  let runningIndex = -1;

  return (
    <div ref={wrapperRef} className="relative w-full group">
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <Search className="w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
      </div>
      <input
        id="global-search-input"
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        className="block w-full py-2 pl-10 pr-16 text-sm border border-slate-200/60 rounded-xl bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white/80 transition-all outline-none shadow-sm"
        placeholder="Search contacts, phone, sales, purchases..."
        autoComplete="off"
      />
      <div className="absolute inset-y-0 right-0 flex items-center pr-2 space-x-1">
        {query ? (
          <button
            onClick={() => { setQuery(''); inputRef.current?.focus(); }}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        ) : (
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 border border-slate-200 rounded-md bg-white">
            ⌘K
          </kbd>
        )}
      </div>

      {isOpen && q && (
        <div className="absolute left-0 right-0 mt-2 z-50 bg-white/95 backdrop-blur-xl border border-slate-200/70 rounded-2xl shadow-2xl shadow-slate-300/40 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="max-h-[420px] overflow-y-auto custom-scrollbar py-2">
            {groups.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Search className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-medium text-slate-600">No results for “{query}”</p>
                <p className="text-xs text-slate-400 mt-1">Try a name, company, phone or invoice number</p>
              </div>
            ) : (
              groups.map(group => (
                <div key={group.label} className="mb-1">
                  <div className="px-4 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {group.label}
                  </div>
                  {group.items.map(item => {
                    runningIndex += 1;
                    const idx = runningIndex;
                    const isActive = idx === activeIndex;
                    const Icon = group.icon;
                    return (
                      <button
                        key={item.key}
                        onMouseEnter={() => setActiveIndex(idx)}
                        onClick={() => goTo(item)}
                        className={`w-full flex items-center px-4 py-2.5 text-left transition-colors ${isActive ? 'bg-indigo-50/80' : 'hover:bg-slate-50'}`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 shrink-0 ${group.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">
                            <Highlight text={item.title} query={query.trim()} />
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            <Highlight text={item.subtitle} query={query.trim()} />
                          </p>
                        </div>
                        <span className="ml-3 text-[11px] font-semibold text-slate-500 whitespace-nowrap">{item.badge}</span>
                        {isActive && <CornerDownLeft className="w-3.5 h-3.5 ml-2 text-indigo-400" />}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>
          {groups.length > 0 && (
            <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between text-[11px] text-slate-400">
              <span>{flatResults.length} result{flatResults.length !== 1 && 's'}</span>
              <span>↑↓ navigate · ↵ open · esc close</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
