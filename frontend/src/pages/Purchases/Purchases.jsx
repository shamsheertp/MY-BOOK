import { useState, useEffect, useCallback } from 'react';
import { PurchasesHeader } from './components/PurchasesHeader';
import { PurchasesFilters } from './components/PurchasesFilters';
import { PurchasesTable } from './components/PurchasesTable';
import { PurchasesSkeleton } from './components/PurchasesSkeleton';
import { purchasesService, contactsService } from '../../services/api';

export default function Purchases() {
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [purchases, setPurchases] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [pagination, setPagination] = useState({ totalPages: 1, totalItems: 0 });
  const itemsPerPage = 10;

  // Load contacts for supplier lookup fallback
  useEffect(() => {
    let isMounted = true;
    contactsService.list({ limit: 100 }).then((res) => {
      if (isMounted) {
        const rawContacts = res?.data?.contacts || res?.data || res || [];
        const contactList = Array.isArray(rawContacts) ? rawContacts : [];
        setContacts(contactList);
      }
    }).catch((err) => console.error('Failed to load contacts for purchases:', err));

    return () => { isMounted = false; };
  }, []);

  const loadPurchases = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await purchasesService.list({
        search: searchTerm,
        status: statusFilter,
        page: currentPage,
        limit: itemsPerPage,
      });

      if (res?.success && Array.isArray(res.data)) {
        setPurchases(res.data);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      } else if (Array.isArray(res)) {
        setPurchases(res);
      }
    } catch (error) {
      console.error('Failed to load purchases:', error);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, statusFilter, currentPage]);

  useEffect(() => {
    loadPurchases();
  }, [loadPurchases]);

  const getSupplierName = (supplierId, purchaseSupplierName) => {
    if (purchaseSupplierName) return purchaseSupplierName;
    if (!supplierId) return 'Unknown Supplier';
    const c = contacts.find(c => c.id === supplierId || String(c.id).includes(String(supplierId)));
    return c?.contactName || c?.companyName || supplierId;
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  if (isLoading && purchases.length === 0) return <PurchasesSkeleton />;

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
          purchases={purchases}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          onPageChange={setCurrentPage}
          getSupplierName={getSupplierName}
          contacts={contacts}
          onRefresh={loadPurchases}
        />
      </div>
    </div>
  );
}
