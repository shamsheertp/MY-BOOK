import { useState, useEffect } from 'react';
import { PurchasesHeader } from './components/PurchasesHeader';
import { PurchasesFilters } from './components/PurchasesFilters';
import { PurchasesTable } from './components/PurchasesTable';
import { PurchasesSkeleton } from './components/PurchasesSkeleton';
import purchasesData from '../../db/purchases.json';
import contactsData from '../../db/contacts.json';

export default function Purchases() {
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const getSupplierName = (supplierId) => {
    if (!supplierId) return '';
    const digit = supplierId.split('-')[1];
    const c = contactsData.find(c => c.id === `CONT-${digit}`);
    return c?.contactName || c?.companyName || supplierId;
  };

  const filteredPurchases = purchasesData.filter(purchase => {
    const supplierName = getSupplierName(purchase.supplierId);
    const matchesSearch = purchase.ref.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          supplierName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || (purchase.status || '').toUpperCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  if (isLoading) return <PurchasesSkeleton />;

  return (
    <div className="max-w-7xl mx-auto fade-in px-4 sm:px-0">
      <PurchasesHeader />
      
      <div className="glass-card bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <PurchasesFilters 
          searchTerm={searchTerm} 
          setSearchTerm={setSearchTerm} 
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />
        
        <PurchasesTable 
          purchases={filteredPurchases}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          getSupplierName={getSupplierName}
        />
      </div>
    </div>
  );
}
