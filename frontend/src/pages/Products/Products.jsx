import { useState, useMemo, useEffect } from 'react';
import productsData from '../../db/products.json';
import CreateProduct from './components/CreateProduct';
import ProductTable from './components/ProductTable';
import ProductFilters from './components/ProductFilters';

export default function Products() {
  const [products, setProducts] = useState(productsData);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const itemsPerPage = 5;

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const allCategories = ['All', ...new Set(products.map(p => p.category))];

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            product.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' || product.status === statusFilter;
      const matchesCategory = categoryFilter === 'All' || product.category === categoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [searchQuery, statusFilter, categoryFilter, products]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    return filteredProducts.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredProducts, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, categoryFilter]);

  return (
    <div className="max-w-7xl mx-auto fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Products & Services</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">Manage your inventory and service catalog</p>
        </div>
      </div>

      <div className="mb-8 relative z-20">
        <CreateProduct 
          onSave={(newProduct) => {
            setProducts(prev => [newProduct, ...prev]);
          }} 
        />
      </div>

      <div className="glass-card bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <ProductFilters 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          allCategories={allCategories}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />

        <ProductTable 
          paginatedProducts={paginatedProducts}
          filteredProducts={filteredProducts}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          itemsPerPage={itemsPerPage}
          totalPages={totalPages}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
