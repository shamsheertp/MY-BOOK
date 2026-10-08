import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Edit3, Trash2, Package, Tag, DollarSign, Layers, 
  CheckCircle2, AlertTriangle, XCircle, TrendingUp, TrendingDown 
} from 'lucide-react';
import productsData from '../../db/products.json';
import salesData from '../../db/sales.json';
import purchasesData from '../../db/purchases.json';
import { EditProductModal } from './components/EditProductModal';
import { AdjustStockModal } from './components/AdjustStockModal';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('sales'); // 'sales' or 'purchases'

  useEffect(() => {
    // Simulate API fetch
    const timer = setTimeout(() => {
      const found = productsData.find(p => p.id === id);
      setProduct(found || null);
      setIsLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [id]);

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto p-8 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-48 mb-8"></div>
        <div className="glass-card h-64 rounded-3xl bg-slate-50 mb-8"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-5xl mx-auto text-center py-20">
        <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-800">Product Not Found</h2>
        <p className="text-slate-500 mt-2">The product you're looking for doesn't exist or has been removed.</p>
        <button 
          onClick={() => navigate('/products')}
          className="mt-6 px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium transition-colors"
        >
          Back to Products
        </button>
      </div>
    );
  }

  // Calculate product metrics
  const productSales = salesData.filter(sale => sale.items?.some(item => item.productId === id));
  const productPurchases = purchasesData.filter(purchase => purchase.items?.some(item => item.productId === id));
  
  const totalUnitsSold = productSales.reduce((acc, sale) => {
    const item = sale.items?.find(i => i.productId === id);
    return acc + (item ? item.quantity : 0);
  }, 0);

  const totalUnitsBought = productPurchases.reduce((acc, purchase) => {
    const item = purchase.items?.find(i => i.productId === id);
    return acc + (item ? item.ordered : 0);
  }, 0);

  const StatusIcon = product.status === 'In Stock' ? CheckCircle2 : product.status === 'Low Stock' ? AlertTriangle : XCircle;
  const statusColor = product.status === 'In Stock' ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 
                      product.status === 'Low Stock' ? 'text-amber-600 bg-amber-50 border-amber-100' : 
                      'text-rose-600 bg-rose-50 border-rose-100';

  return (
    <div className="max-w-5xl mx-auto fade-in">
      <button 
        onClick={() => navigate('/products')}
        className="flex items-center text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors mb-6 group"
      >
        <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
        Back to Products
      </button>

      <div className="glass-card bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mb-8">
        <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
          {/* Decorative background element */}
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-black text-slate-800">{product.name}</h1>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusColor}`}>
                <StatusIcon className="w-3.5 h-3.5" />
                {product.status}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
              <span className="flex items-center gap-1.5"><Tag className="w-4 h-4" /> SKU: {product.sku}</span>
              <span className="flex items-center gap-1.5"><Layers className="w-4 h-4" /> Category: {product.category}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 relative z-10 w-full md:w-auto">
            <button 
              onClick={() => setIsEditModalOpen(true)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-semibold transition-all"
            >
              <Edit3 className="w-4 h-4" />
              Edit
            </button>
            <button 
              onClick={() => setIsStockModalOpen(true)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl hover:bg-indigo-100 font-semibold transition-all"
            >
              <Package className="w-4 h-4" />
              Adjust Stock
            </button>
            <button className="flex items-center justify-center p-2.5 bg-white border border-rose-200 text-rose-600 rounded-xl hover:bg-rose-50 transition-all" title="Delete Product">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-100 border-b border-slate-100 bg-slate-50/30">
          <div className="p-6">
            <p className="text-sm font-medium text-slate-500 mb-1 flex items-center gap-1.5"><DollarSign className="w-4 h-4" /> Selling Price</p>
            <p className="text-2xl font-bold text-slate-800">₹{product.price.toFixed(2)}</p>
          </div>
          <div className="p-6">
            <p className="text-sm font-medium text-slate-500 mb-1 flex items-center gap-1.5"><Package className="w-4 h-4" /> Current Stock</p>
            <p className="text-2xl font-bold text-slate-800">{product.stock} <span className="text-sm font-medium text-slate-400 ml-1">units</span></p>
          </div>
          <div className="p-6">
            <p className="text-sm font-medium text-slate-500 mb-1 flex items-center gap-1.5"><TrendingUp className="w-4 h-4 text-emerald-500" /> Total Sold</p>
            <p className="text-2xl font-bold text-emerald-600">{totalUnitsSold} <span className="text-sm font-medium text-emerald-400/70 ml-1">units</span></p>
          </div>
          <div className="p-6">
            <p className="text-sm font-medium text-slate-500 mb-1 flex items-center gap-1.5"><TrendingDown className="w-4 h-4 text-indigo-500" /> Total Bought</p>
            <p className="text-2xl font-bold text-indigo-600">{totalUnitsBought} <span className="text-sm font-medium text-indigo-400/70 ml-1">units</span></p>
          </div>
        </div>
      </div>
      
      {/* Transaction History */}
      <div className="glass-card bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mb-12">
        <div className="px-8 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-lg font-bold text-slate-800">Transaction History</h3>
          <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            <button 
              onClick={() => setActiveTab('sales')}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'sales' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              Sales
            </button>
            <button 
              onClick={() => setActiveTab('purchases')}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'purchases' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              Purchases
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead className="bg-slate-50/80 text-slate-500 font-medium border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 uppercase tracking-wider text-xs font-bold">Date & Ref</th>
                <th className="px-6 py-4 uppercase tracking-wider text-xs font-bold">Customer/Supplier</th>
                <th className="px-6 py-4 uppercase tracking-wider text-xs font-bold text-right">Qty</th>
                <th className="px-6 py-4 uppercase tracking-wider text-xs font-bold text-right">Price</th>
                <th className="px-6 py-4 uppercase tracking-wider text-xs font-bold text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {activeTab === 'sales' ? (
                productSales.length > 0 ? (
                  productSales.map(sale => {
                    const item = sale.items.find(i => i.productId === id);
                    return (
                      <tr key={sale.id} onClick={() => navigate(`/sales/${sale.id}`)} className="hover:bg-slate-50 cursor-pointer transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-800">{sale.date}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{sale.id}</div>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-700">{sale.customerName}</td>
                        <td className="px-6 py-4 text-right font-medium text-slate-600">{item.quantity}</td>
                        <td className="px-6 py-4 text-right text-slate-600">₹{item.price.toFixed(2)}</td>
                        <td className="px-6 py-4 text-right font-bold text-slate-800">₹{(item.quantity * item.price).toFixed(2)}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">No sales history found.</td></tr>
                )
              ) : (
                productPurchases.length > 0 ? (
                  productPurchases.map(purchase => {
                    const item = purchase.items.find(i => i.productId === id);
                    return (
                      <tr key={purchase.id} onClick={() => navigate(`/purchases/${purchase.ref}`)} className="hover:bg-slate-50 cursor-pointer transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-800">{purchase.date}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{purchase.ref}</div>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-700">{purchase.supplierId}</td>
                        <td className="px-6 py-4 text-right font-medium text-slate-600">{item.ordered}</td>
                        <td className="px-6 py-4 text-right text-slate-600">₹{item.price.toFixed(2)}</td>
                        <td className="px-6 py-4 text-right font-bold text-slate-800">₹{(item.ordered * item.price).toFixed(2)}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">No purchase history found.</td></tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <EditProductModal 
        product={product} 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        onSave={setProduct} 
      />
      
      <AdjustStockModal 
        product={product} 
        isOpen={isStockModalOpen} 
        onClose={() => setIsStockModalOpen(false)} 
        onSave={setProduct} 
      />
    </div>
  );
}
