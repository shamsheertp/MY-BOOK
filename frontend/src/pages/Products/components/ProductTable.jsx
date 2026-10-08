import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ProductTable({ paginatedProducts, filteredProducts, currentPage, setCurrentPage, itemsPerPage, totalPages, isLoading }) {
  const navigate = useNavigate();

  return (
    <div className="w-full relative bg-white/40">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead className="bg-slate-50/80 text-slate-500 font-medium border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 uppercase tracking-wider text-xs font-bold">Item & SKU</th>
              <th className="px-6 py-4 uppercase tracking-wider text-xs font-bold">Category</th>
              <th className="px-6 py-4 uppercase tracking-wider text-xs font-bold text-right">Price</th>
              <th className="px-6 py-4 uppercase tracking-wider text-xs font-bold text-center">Stock</th>
              <th className="px-6 py-4 uppercase tracking-wider text-xs font-bold text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/80">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={index} className="animate-pulse">
                  <td className="py-4 px-6">
                    <div className="h-4 bg-slate-200 rounded w-32 mb-2"></div>
                    <div className="h-3 bg-slate-100 rounded w-16"></div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="h-6 bg-slate-200 rounded-lg w-24"></div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex flex-col items-end justify-center">
                      <div className="h-4 bg-slate-200 rounded w-16 mb-1.5"></div>
                      <div className="h-3 bg-slate-100 rounded w-24"></div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="h-5 bg-slate-200 rounded w-10 mx-auto"></div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="h-6 bg-slate-200 rounded-full w-24 mx-auto"></div>
                  </td>
                </tr>
              ))
            ) : paginatedProducts.length > 0 ? (
              paginatedProducts.map((product) => (
                <tr 
                  key={product.id} 
                  onClick={() => navigate(`/products/${product.id}`)}
                  className="hover:bg-white/80 transition-colors cursor-pointer group border-b border-slate-50 last:border-0"
                >
                  <td className="py-4 px-6">
                    <div className="font-semibold text-slate-900">{product.name}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{product.sku}</div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 whitespace-nowrap">
                      {product.category}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="font-bold text-slate-800">₹{(product.price || 0).toFixed(2)}</div>
                    <div className="text-xs mt-1 font-medium flex items-center justify-end gap-1.5">
                      <span className="text-slate-400">Cost: ₹{(product.costPrice || 0).toFixed(2)}</span>
                      {product.price > 0 && product.costPrice > 0 && (
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold leading-none ${
                          product.price > product.costPrice 
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100/50' 
                            : product.price < product.costPrice 
                              ? 'bg-rose-50 text-rose-600 border border-rose-100/50'
                              : 'bg-slate-50 text-slate-500 border border-slate-100/50'
                        }`}>
                          {product.price > product.costPrice ? '+' : ''}{Math.round(((product.price - product.costPrice) / product.costPrice) * 100)}%
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center font-medium text-slate-600">
                    {product.stock}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {product.status === 'In Stock' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600 border border-emerald-100">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        In Stock
                      </span>
                    ) : product.status === 'Low Stock' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-600 border border-amber-100">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Low Stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-600 border border-rose-100">
                        <XCircle className="w-3.5 h-3.5" />
                        Out of Stock
                      </span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="py-12 text-center text-slate-500">
                  No products found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {!isLoading && (
        <div className="p-4 border-t border-slate-100 bg-white/60 flex items-center justify-between text-sm text-slate-500">
          <span>
            Showing {paginatedProducts.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length} records
          </span>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            <span className="px-3 font-medium text-slate-700">Page {currentPage} of {totalPages || 1}</span>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
