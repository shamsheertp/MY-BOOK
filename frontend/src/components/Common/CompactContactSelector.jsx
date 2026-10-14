import { useState, useRef, useEffect, useMemo } from 'react';
import { Search, Plus, X, ChevronDown, Check } from 'lucide-react';

export function CompactContactSelector({
  label = 'Contact *',
  contacts = [],
  selectedContact = null,
  onSelect,
  onClear,
  onAddNew,
  theme = 'indigo', // 'indigo' or 'orange'
  placeholder = 'Search contact by name, phone, company...',
  isLoading = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const isIndigo = theme === 'indigo';

  // Filter contacts by query
  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts.slice(0, 50);
    const q = searchQuery.toLowerCase().trim();
    return contacts.filter(c =>
      (c.contactName || c.name || '').toLowerCase().includes(q) ||
      (c.companyName || c.company || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.code || '').toLowerCase().includes(q)
    ).slice(0, 50);
  }, [contacts, searchQuery]);

  // Handle clicking outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpenSearch = () => {
    setIsOpen(true);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 50);
  };

  const handleSelect = (contact) => {
    onSelect(contact);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    if (onClear) onClear();
    setSearchQuery('');
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'Enter' && filteredContacts.length > 0) {
      e.preventDefault();
      handleSelect(filteredContacts[0]);
    }
  };

  return (
    <div ref={containerRef} className="space-y-1.5 w-full relative">
      {/* Hidden native select for form serialization, accessibility, and automated testing */}
      <select
        aria-hidden="true"
        tabIndex={-1}
        className="sr-only"
        value={selectedContact?.id || selectedContact?.code || ''}
        onChange={(e) => {
          const found = contacts.find(c => c.id === e.target.value || c.code === e.target.value);
          if (found) handleSelect(found);
          else if (onClear) onClear();
        }}
      >
        <option value="">Select contact...</option>
        {contacts.map((c) => {
          const name = c.contactName || c.name || 'Unnamed';
          const company = c.companyName || c.company;
          const labelText = `${name}${company ? ` (${company})` : ''}`;
          return (
            <option key={c.id || c.code} value={c.id || c.code}>
              {labelText}
            </option>
          );
        })}
      </select>

      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
          {label}
        </label>
        {selectedContact && (
          <button
            type="button"
            onClick={handleOpenSearch}
            className={`text-xs font-semibold ${isIndigo ? 'text-indigo-600 hover:text-indigo-700' : 'text-orange-600 hover:text-orange-700'} hover:underline cursor-pointer`}
          >
            Change
          </button>
        )}
      </div>

      {/* When a contact is selected, show small compact card */}
      {selectedContact && !isOpen ? (
        <div
          onClick={handleOpenSearch}
          className="flex items-center justify-between p-2.5 bg-slate-50/90 border border-slate-200/90 rounded-xl hover:border-slate-300 hover:bg-slate-100/70 transition-all shadow-sm group cursor-pointer"
          title="Click to change contact"
        >
          <div className="flex items-center space-x-2.5 min-w-0 pr-2">
            <div className={`w-8 h-8 rounded-lg ${isIndigo ? 'bg-indigo-100 text-indigo-700' : 'bg-orange-100 text-orange-700'} flex items-center justify-center font-bold text-xs shrink-0`}>
              {(selectedContact.contactName || selectedContact.name || 'C').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-800 text-sm truncate">
                  {selectedContact.contactName || selectedContact.name || 'Unnamed'}
                </span>
                {(selectedContact.companyName || selectedContact.company) && (
                  <span className="text-xs text-slate-500 font-medium truncate hidden sm:inline">
                    • {selectedContact.companyName || selectedContact.company}
                  </span>
                )}
                {selectedContact.code && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 bg-white border border-slate-200 text-slate-500 rounded">
                    {selectedContact.code}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5">
                {selectedContact.phone && (
                  <span className="truncate">{selectedContact.phone}</span>
                )}
                {selectedContact.email && (
                  <span className="truncate hidden sm:inline">• {selectedContact.email}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-1 shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenSearch();
              }}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-colors cursor-pointer text-xs font-semibold"
              title="Search and change contact"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        /* Search Combobox Input */
        <div className="flex gap-2">
          <div className="relative flex-1 group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className={`w-4 h-4 ${isIndigo ? 'text-indigo-400 group-focus-within:text-indigo-600' : 'text-orange-400 group-focus-within:text-orange-600'} transition-colors`} />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder={isLoading ? 'Loading contacts from DB...' : placeholder}
              className={`w-full pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 outline-none focus:ring-2 ${isIndigo ? 'focus:ring-indigo-500/20 focus:border-indigo-500' : 'focus:ring-orange-500/20 focus:border-orange-500'} transition-all shadow-sm`}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsOpen(prev => !prev)}
                  className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
              )}
            </div>
          </div>

          {onAddNew && (
            <button
              type="button"
              onClick={onAddNew}
              className={`flex items-center justify-center w-[42px] h-[42px] ${isIndigo ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-indigo-100' : 'bg-orange-50 text-orange-600 hover:bg-orange-100 border-orange-100'} rounded-xl transition-colors border shrink-0 shadow-sm cursor-pointer`}
              title="Add New Contact"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Floating Dropdown List */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200/90 rounded-2xl shadow-2xl z-[100] max-h-60 overflow-y-auto divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 sticky top-0 flex justify-between items-center z-10 backdrop-blur-sm">
            <span>Contacts ({filteredContacts.length})</span>
            <span className="text-[10px] text-slate-400 font-normal">Click to select</span>
          </div>

          {filteredContacts.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500">
              <p>No contacts found matching &ldquo;{searchQuery}&rdquo;</p>
              {onAddNew && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onAddNew();
                  }}
                  className={`mt-2 font-bold ${isIndigo ? 'text-indigo-600 hover:text-indigo-800' : 'text-orange-600 hover:text-orange-800'} text-xs underline cursor-pointer`}
                >
                  + Add New Contact
                </button>
              )}
            </div>
          ) : (
            filteredContacts.map((c) => {
              const name = c.contactName || c.name || 'Unnamed';
              const company = c.companyName || c.company;
              const isSelected = selectedContact && (selectedContact.id === c.id || selectedContact.code === c.code);

              return (
                <button
                  key={c.id || c.code}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(c)}
                  className={`w-full px-3.5 py-2.5 text-left transition-colors flex items-center justify-between group cursor-pointer ${
                    isSelected ? (isIndigo ? 'bg-indigo-50/80' : 'bg-orange-50/80') : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center space-x-1.5">
                      <span className={`font-bold text-xs truncate ${isSelected ? (isIndigo ? 'text-indigo-700' : 'text-orange-700') : 'text-slate-800 group-hover:text-slate-900'}`}>
                        {name} {company ? `(${company})` : ''}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-0.5">
                      {c.phone && <span className="truncate">{c.phone}</span>}
                      {c.email && <span className="truncate hidden sm:inline">• {c.email}</span>}
                      {c.code && <span className="font-mono bg-slate-100 text-slate-600 px-1 rounded">{c.code}</span>}
                    </div>
                  </div>

                  {isSelected && (
                    <Check className={`w-3.5 h-3.5 ${isIndigo ? 'text-indigo-600' : 'text-orange-600'} shrink-0`} />
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default CompactContactSelector;
