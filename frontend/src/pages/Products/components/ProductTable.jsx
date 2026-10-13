import { CheckCircle2, AlertTriangle, XCircle, Edit3, Trash2, Weight, TrendingUp, IndianRupee } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ProductTable({ 
  paginatedProducts = [], 
  filteredProducts = [], 
  currentPage = 1, 
  setCurrentPage, 
  itemsPerPage = 10, 
  totalPages = 1, 
  isLoading = false,
  onEditProduct,
  onAdjustStock,
  onDeleteProduct,
}) {
  const navigate = useNavigate();

  return (
    <div className="w-full relative bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[850px]">
          <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Item & SKU</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4 text-right">Cost Price / kg</th>
              <th className="px-6 py-4 text-right">Selling Price / kg</th>
              <th className="px-6 py-4 text-center">Total Stock (kg)</th>
              <th className="px-6 py-4 text-center">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={index} className="animate-pulse">
                  <td className="py-4 px-6">
                    <div className="h-4 bg-slate-200 rounded w-36 mb-2"></div>
                    <div className="h-3 bg-slate-100 rounded w-20"></div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="h-6 bg-slate-200 rounded-lg w-24"></div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="h-4 bg-slate-200 rounded w-16 ml-auto"></div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="h-4 bg-slate-200 rounded w-20 ml-auto mb-1"></div>
                    <div className="h-3 bg-slate-100 rounded w-12 ml-auto"></div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <div className="h-5 bg-slate-200 rounded w-16 mx-auto"></div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <div className="h-6 bg-slate-200 rounded-full w-24 mx-auto"></div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="h-7 bg-slate-200 rounded-lg w-20 ml-auto"></div>
                  </td>
                </tr>
              ))
            ) : paginatedProducts.length > 0 ? (
              paginatedProducts.map((product) => {
                const stockKg = Number(product.stockKg ?? product.stock ?? 0);
                const costPricePerKg = Number(product.costPricePerKg ?? product.costPrice ?? 0);
                const sellingPricePerKg = Number(product.sellingPricePerKg ?? product.price ?? 0);
                const marginPerKg = sellingPricePerKg - costPricePerKg;
                const marginPct = costPricePerKg > 0 ? Math.round((marginPerKg / costPricePerKg) * 100) : 0;
                const status = product.status || (stockKg <= 0 ? 'Out of Stock' : stockKg <= 10 ? 'Low Stock' : 'In Stock');

                return (
                  <tr 
                    key={product.id} 
                    onClick={() => navigate(`/products/${product.id}`)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group border-b border-slate-50 last:border-0"
                  >
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                        {product.name}
                      </div>
                      <div className="text-xs font-mono text-slate-400 mt-0.5">{product.sku}</div>
                    </td>

                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 whitespace-nowrap">
                        {product.category || 'General'}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right font-medium text-slate-600">
                      <div>₹{costPricePerKg.toFixed(2)}</div>
                      <div className="text-[10px] text-slate-400">per kg</div>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="font-bold text-slate-900">₹{sellingPricePerKg.toFixed(2)}</div>
                      <div className="text-xs mt-0.5 font-medium flex items-center justify-end gap-1">
                        {costPricePerKg > 0 && (
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold leading-none ${
                            marginPerKg >= 0 
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                              : 'bg-rose-50 text-rose-600 border border-rose-100'
                          }`}>
                            {marginPerKg >= 0 ? '+' : ''}{marginPct}%
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400">/ kg</span>
                      </div>
                    </td>

                    <td className="py-4 px-6 text-center font-bold text-slate-800">
                      <div className="inline-flex items-center gap-1">
                        <Weight className="w-3.5 h-3.5 text-slate-400" />
                        <span>{stockKg.toFixed(2)}</span>
                        <span className="text-xs text-slate-400 font-semibold">kg</span>
                      </div>
                      {product.stockValue !== undefined && (
                        <div className="text-[11px] text-slate-400 font-normal">
                          Val: ₹{Number(product.stockValue || 0).toLocaleString()}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 text-center">
                      {status === 'In Stock' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          In Stock
                        </span>
                      ) : status === 'Low Stock' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-100">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-100">
                          <XCircle className="w-3.5 h-3.5" />
                          Out of Stock
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onAdjustStock && onAdjustStock(product)}
                          title="Adjust Stock (kg)"
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/50 transition-colors cursor-pointer"
                        >
                          <Weight className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onEditProduct && onEditProduct(product)}
                          title="Edit Product"
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/50 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteProduct && onDeleteProduct(product)}
                          title="Delete Product"
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50/50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="py-12 text-center text-slate-500">
                  No products or materials found matching your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {!isLoading && filteredProducts.length > 0 && (
        <div className="p-4 border-t border-slate-100 bg-slate-50/40 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length} items
          </span>
          <div className="flex items-center space-x-2">
            <button 
              type="button"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            <span className="px-3 font-semibold text-slate-700">Page {currentPage} of {totalPages || 1}</span>
            <button 
              type="button"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
