import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Edit3, Trash2, Package, Tag, Layers, 
  CheckCircle2, AlertTriangle, XCircle, TrendingUp, TrendingDown,
  Weight, IndianRupee, AlertCircle
} from 'lucide-react';
import { productsService } from '../../services/api';
import { EditProductModal } from './components/EditProductModal';
import { AdjustStockModal } from './components/AdjustStockModal';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);

  const fetchProduct = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const response = await productsService.getById(id);
      if (response && response.data) {
        setProduct(response.data);
      } else if (response) {
        setProduct(response);
      }
    } catch (err) {
      console.error('Failed to load product details:', err);
      setErrorMessage(err.message || 'Product not found');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const handleDelete = async () => {
    if (!product) return;
    if (!window.confirm(`Are you sure you want to permanently delete "${product.name}" (${product.sku})?`)) {
      return;
    }

    try {
      await productsService.delete(product.id);
      navigate('/products');
    } catch (err) {
      alert(err.message || 'Failed to delete product');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto p-8 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-48 mb-8"></div>
        <div className="glass-card h-64 rounded-3xl bg-slate-50 mb-8"></div>
        <div className="grid grid-cols-4 gap-4 h-32 bg-slate-50 rounded-2xl"></div>
      </div>
    );
  }

  if (!product || errorMessage) {
    return (
      <div className="max-w-5xl mx-auto text-center py-20">
        <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-800">Product Not Found</h2>
        <p className="text-slate-500 mt-2">
          {errorMessage || "The product you're looking for doesn't exist or has been removed."}
        </p>
        <button 
          onClick={() => navigate('/products')}
          className="mt-6 px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold transition-colors cursor-pointer"
        >
          Back to Products
        </button>
      </div>
    );
  }

  const stockKg = Number(product.stockKg ?? product.stock ?? 0);
  const costPricePerKg = Number(product.costPricePerKg ?? product.costPrice ?? 0);
  const sellingPricePerKg = Number(product.sellingPricePerKg ?? product.price ?? 0);
  const minStockKg = Number(product.minStockKg ?? 10);
  const marginPerKg = sellingPricePerKg - costPricePerKg;
  const marginPercent = costPricePerKg > 0 ? Math.round((marginPerKg / costPricePerKg) * 100) : 0;
  const stockValue = stockKg * costPricePerKg;
  const potentialRevenue = stockKg * sellingPricePerKg;

  const status = product.status || (stockKg <= 0 ? 'Out of Stock' : stockKg <= minStockKg ? 'Low Stock' : 'In Stock');
  const StatusIcon = status === 'In Stock' ? CheckCircle2 : status === 'Low Stock' ? AlertTriangle : XCircle;
  const statusColor = status === 'In Stock' ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 
                      status === 'Low Stock' ? 'text-amber-600 bg-amber-50 border-amber-100' : 
                      'text-rose-600 bg-rose-50 border-rose-100';

  return (
    <div className="max-w-5xl mx-auto fade-in pb-16">
      <button 
        onClick={() => navigate('/products')}
        className="flex items-center text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors mb-6 group cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
        Back to Products
      </button>

      {/* Hero Header Card */}
      <div className="glass-card bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mb-8">
        <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-3xl font-black text-slate-800">{product.name}</h1>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusColor}`}>
                <StatusIcon className="w-3.5 h-3.5" />
                {status}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium text-slate-500 flex-wrap">
              <span className="flex items-center gap-1.5 font-mono"><Tag className="w-3.5 h-3.5 text-slate-400" /> SKU: {product.sku}</span>
              <span className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-slate-400" /> Category: {product.category || 'General'}</span>
              <span className="flex items-center gap-1.5"><Weight className="w-3.5 h-3.5 text-slate-400" /> Unit: {product.unit || 'kg'}</span>
            </div>
            {product.description && (
              <p className="mt-3 text-sm text-slate-600 max-w-2xl bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                {product.description}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-2.5 relative z-10 w-full md:w-auto">
            <button 
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-semibold text-sm transition-all shadow-sm cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
              Edit
            </button>
            <button 
              type="button"
              onClick={() => setIsStockModalOpen(true)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl hover:bg-indigo-100 font-semibold text-sm transition-all cursor-pointer"
            >
              <Weight className="w-4 h-4" />
              Adjust Stock (kg)
            </button>
            <button 
              type="button"
              onClick={handleDelete}
              className="flex items-center justify-center p-2.5 bg-white border border-rose-200 text-rose-600 rounded-xl hover:bg-rose-50 transition-all cursor-pointer" 
              title="Delete Product"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Metric Cards Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-100 border-b border-slate-100 bg-slate-50/40">
          {/* Selling Price / kg */}
          <div className="p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
              <IndianRupee className="w-3.5 h-3.5 text-indigo-500" /> Selling Price / kg
            </p>
            <p className="text-2xl font-black text-slate-800">₹{sellingPricePerKg.toFixed(2)}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">per kilogram</p>
          </div>

          {/* Cost Price / kg */}
          <div className="p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
              <IndianRupee className="w-3.5 h-3.5 text-slate-400" /> Cost Price / kg
            </p>
            <p className="text-2xl font-black text-slate-700">₹{costPricePerKg.toFixed(2)}</p>
            <div className="text-[11px] font-semibold mt-0.5 flex items-center gap-1">
              <span className={marginPerKg >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                {marginPerKg >= 0 ? '+' : ''}₹{marginPerKg.toFixed(2)}/kg ({marginPercent}%)
              </span>
            </div>
          </div>

          {/* Current Stock kg */}
          <div className="p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
              <Weight className="w-3.5 h-3.5 text-slate-400" /> In Stock (Total)
            </p>
            <p className="text-2xl font-black text-slate-800">
              {stockKg.toFixed(2)} <span className="text-sm font-bold text-slate-400">kg</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Min alert: {minStockKg} kg</p>
          </div>

          {/* Total Stock Value */}
          <div className="p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> Inventory Valuation
            </p>
            <p className="text-2xl font-black text-emerald-600">
              ₹{stockValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Potential: ₹{potentialRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      <EditProductModal 
        product={product} 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        onSave={(updated) => {
          setProduct(updated);
          setIsEditModalOpen(false);
        }} 
      />
      
      <AdjustStockModal 
        product={product} 
        isOpen={isStockModalOpen} 
        onClose={() => setIsStockModalOpen(false)} 
        onSave={(updated) => {
          setProduct(updated);
          setIsStockModalOpen(false);
        }} 
      />
    </div>
  );
}
