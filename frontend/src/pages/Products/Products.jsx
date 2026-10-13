import { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Package, Weight, IndianRupee, AlertTriangle, TrendingUp, RefreshCw, 
  Plus, CheckCircle2, XCircle, Search 
} from 'lucide-react';
import { productsService } from '../../services/api';
import CreateProduct from './components/CreateProduct';
import ProductTable from './components/ProductTable';
import ProductFilters from './components/ProductFilters';
import EditProductModal from './components/EditProductModal';
import AdjustStockModal from './components/AdjustStockModal';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [summary, setSummary] = useState({
    totalProducts: 0,
    totalStockKg: 0,
    totalStockValue: 0,
    totalPotentialRevenue: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    inStockCount: 0,
  });
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedProductForEdit, setSelectedProductForEdit] = useState(null);
  const [selectedProductForAdjust, setSelectedProductForAdjust] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState(null);

  const itemsPerPage = 8;

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await productsService.list({
        search: searchQuery,
        category: categoryFilter,
        status: statusFilter,
        limit: 100, // fetch full active batch for smooth client-side filtering/pagination
      });

      if (response && response.data) {
        setProducts(response.data);
        if (response.summary) {
          setSummary(response.summary);
        }
        if (response.categories && response.categories.length > 0) {
          setCategories(response.categories);
        }
      }
    } catch (err) {
      console.error('Failed to load products from DB:', err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, categoryFilter, statusFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const allCategories = useMemo(() => {
    const set = new Set(['All', ...categories, ...products.map(p => p.category).filter(Boolean)]);
    return Array.from(set);
  }, [categories, products]);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const name = product.name?.toLowerCase() || '';
      const sku = product.sku?.toLowerCase() || '';
      const query = searchQuery.toLowerCase();
      const matchesSearch = name.includes(query) || sku.includes(query);
      const matchesStatus = statusFilter === 'All' || product.status === statusFilter;
      const matchesCategory = categoryFilter === 'All' || product.category === categoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [searchQuery, statusFilter, categoryFilter, products]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginatedProducts = useMemo(() => {
    return filteredProducts.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredProducts, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, categoryFilter]);

  const handleProductCreated = (newProduct) => {
    setFeedbackMessage({
      type: 'success',
      text: `Product "${newProduct.name}" added to inventory!`,
    });
    fetchProducts();
    setShowCreateForm(false);
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const handleProductUpdated = (updatedProduct) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    setFeedbackMessage({
      type: 'success',
      text: `Product "${updatedProduct.name}" updated successfully!`,
    });
    fetchProducts();
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const handleStockAdjusted = (updatedProduct) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    setFeedbackMessage({
      type: 'success',
      text: `Stock for "${updatedProduct.name}" updated to ${updatedProduct.stockKg} kg!`,
    });
    fetchProducts();
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const handleDeleteProduct = async (product) => {
    if (!window.confirm(`Are you sure you want to delete "${product.name}" (${product.sku}) from the inventory database?`)) {
      return;
    }

    try {
      await productsService.delete(product.id);
      setProducts(prev => prev.filter(p => p.id !== product.id));
      setFeedbackMessage({
        type: 'success',
        text: `Product "${product.name}" removed from inventory.`,
      });
      fetchProducts();
      setTimeout(() => setFeedbackMessage(null), 4000);
    } catch (err) {
      alert(err.message || 'Failed to delete product');
    }
  };

  return (
    <div className="max-w-7xl mx-auto fade-in pb-12">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Products & Inventory</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Manage metal & raw material stock in kilograms (kg) with live cost and selling valuations.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={fetchProducts}
            disabled={isLoading}
            className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 rounded-xl hover:bg-slate-50 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
            title="Refresh database records"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setShowCreateForm(prev => !prev)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-semibold shadow-md shadow-indigo-100 hover:shadow-indigo-200 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            {showCreateForm ? 'Hide Add Form' : 'Add Product / Material'}
          </button>
        </div>
      </div>

      {feedbackMessage && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-sm font-medium flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Stock in kg */}
        <div className="glass-card bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Stock (kg)</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Weight className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-800">
              {summary.totalStockKg.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
            </span>
            <span className="text-sm font-bold text-slate-400">kg</span>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Across {summary.totalProducts} cataloged items
          </p>
        </div>

        {/* Total Cost Valuation */}
        <div className="glass-card bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Inventory Cost Value</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800">
            ₹{summary.totalStockValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Based on cost price / kg
          </p>
        </div>

        {/* Potential Selling Revenue */}
        <div className="glass-card bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Potential Revenue</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800">
            ₹{summary.totalPotentialRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-emerald-600 mt-1 font-bold">
            +₹{(summary.totalPotentialRevenue - summary.totalStockValue).toLocaleString(undefined, { maximumFractionDigits: 0 })} potential gross margin
          </p>
        </div>

        {/* Stock Health */}
        <div className="glass-card bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Inventory Health</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-lg font-bold text-emerald-600">{summary.inStockCount}</span>
              <span className="text-[10px] uppercase font-bold text-slate-400">In Stock</span>
            </div>
            <div className="h-8 w-px bg-slate-200"></div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-amber-600">{summary.lowStockCount}</span>
              <span className="text-[10px] uppercase font-bold text-slate-400">Low Stock</span>
            </div>
            <div className="h-8 w-px bg-slate-200"></div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-rose-600">{summary.outOfStockCount}</span>
              <span className="text-[10px] uppercase font-bold text-slate-400">Out</span>
            </div>
          </div>
        </div>
      </div>

      {/* Collapsible / Expandable Create Product Form */}
      {showCreateForm && (
        <div className="mb-8 relative z-20">
          <CreateProduct 
            onSave={handleProductCreated} 
            existingCategories={categories}
          />
        </div>
      )}

      {/* Main Table Card */}
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
          onEditProduct={(p) => setSelectedProductForEdit(p)}
          onAdjustStock={(p) => setSelectedProductForAdjust(p)}
          onDeleteProduct={handleDeleteProduct}
        />
      </div>

      {/* Edit Product Modal */}
      <EditProductModal
        product={selectedProductForEdit}
        isOpen={Boolean(selectedProductForEdit)}
        onClose={() => setSelectedProductForEdit(null)}
        onSave={handleProductUpdated}
      />

      {/* Adjust Stock Modal (in kg) */}
      <AdjustStockModal
        product={selectedProductForAdjust}
        isOpen={Boolean(selectedProductForAdjust)}
        onClose={() => setSelectedProductForAdjust(null)}
        onSave={handleStockAdjusted}
      />
    </div>
  );
}
