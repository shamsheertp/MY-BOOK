import { useState, useEffect } from 'react';
import journalsData from '../../db/journals.json';
import salesData from '../../db/sales.json';
import purchasesData from '../../db/purchases.json';
import { JournalFilters } from './components/JournalFilters';
import { JournalTable } from './components/JournalTable';

export default function Journals() {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('All Time');
  const [userFilter, setUserFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const itemsPerPage = 10;

  // Generate system journals
  const salesJournals = salesData.map(sale => ({
    id: `sys-sale-${sale.id}`,
    ref: sale.ref,
    date: sale.date,
    notes: `Sales Invoice to ${sale.customerName}`,
    createdBy: 'System',
    total: sale.total,
    url: `/sales/${sale.ref}`,
    isDebit: true,
    entries: []
  }));

  const purchaseJournals = purchasesData.map(po => ({
    id: `sys-po-${po.id}`,
    ref: po.ref,
    date: po.date,
    notes: `Purchase from Supplier`,
    createdBy: 'System',
    total: po.total,
    url: `/purchases/${po.ref}`,
    isCredit: true,
    entries: []
  }));

  const allJournals = [
    ...journalsData.map(j => ({ ...j, url: `/journal/${j.ref}`, isManual: true })), 
    ...salesJournals, 
    ...purchaseJournals
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  // Extract unique users
  const uniqueUsers = Array.from(new Set(allJournals.map(j => j.createdBy))).filter(Boolean);

  // Filter journals
  const filteredJournals = allJournals.filter(journal => {
    // Search
    const searchMatch = journal.ref.toLowerCase().includes(searchQuery.toLowerCase()) || 
                       journal.notes.toLowerCase().includes(searchQuery.toLowerCase());
    
    // User
    const userMatch = userFilter === 'All' || journal.createdBy === userFilter;
    
    // Date filter (mock logic)
    let dateMatch = true;
    const journalDate = new Date(journal.date);
    const today = new Date();
    
    if (dateFilter === 'Today') {
      dateMatch = journalDate.toDateString() === today.toDateString();
    } else if (dateFilter === 'This Week') {
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      dateMatch = journalDate >= weekAgo;
    } else if (dateFilter === 'This Month') {
      dateMatch = journalDate.getMonth() === today.getMonth() && journalDate.getFullYear() === today.getFullYear();
    }
    
    return searchMatch && userMatch && dateMatch;
  });

  // Simulated loading on filter changes
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 600); // skeleton loading duration
    return () => clearTimeout(timer);
  }, [searchQuery, dateFilter, userFilter, currentPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, dateFilter, userFilter]);

  return (
    <div className="max-w-7xl mx-auto fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Journal Book</h1>
        <p className="text-sm text-slate-500 mt-1 font-medium">Unified ledger containing manual journals and automatic system entries</p>
      </div>

      <JournalFilters 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        userFilter={userFilter}
        setUserFilter={setUserFilter}
        usersList={uniqueUsers}
      />

      <div className="glass-card rounded-3xl overflow-hidden border border-slate-100 shadow-sm relative">
        <JournalTable 
          journals={filteredJournals}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
