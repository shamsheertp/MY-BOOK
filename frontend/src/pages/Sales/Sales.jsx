import { useState, useEffect } from 'react';
import { SalesHeader } from './components/SalesHeader';
import { SalesFilters } from './components/SalesFilters';
import { SalesTable } from './components/SalesTable';
import { SalesSkeleton } from './components/SalesSkeleton';
import salesData from '../../db/sales.json';

export default function Sales() {
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const filteredSales = salesData.filter(sale => {
    const matchesSearch = sale.ref.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          sale.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || sale.status.toUpperCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  if (isLoading) return <SalesSkeleton />;

  return (
    <div className="max-w-7xl mx-auto fade-in px-4 sm:px-0">
      <SalesHeader />
      
      <div className="glass-card bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <SalesFilters 
          searchTerm={searchTerm} 
          setSearchTerm={setSearchTerm} 
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />
        
        <SalesTable 
          sales={filteredSales}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
