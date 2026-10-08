import { useState } from 'react';
import { Search, Plus, Filter, ChevronLeft, ChevronRight, Mail, Download, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CustomerModal } from './components/CustomerModal';
import contactsData from '../../db/contacts.json';
import salesData from '../../db/sales.json';
import purchasesData from '../../db/purchases.json';

export default function Contacts() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    status: 'All',
    type: 'All'
  });

  const recordsPerPage = 20;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Map db data
  const allContacts = contactsData.map((c, i) => {
    const suffix = c.id && c.id.includes('-') ? c.id.substring(c.id.indexOf('-') + 1) : c.id;
    const customerId = `CUST-${suffix}`;
    const supplierId = `SUP-${suffix}`;
    
    const calculatedReceivables = salesData.filter(s => s.customerId === customerId).reduce((sum, s) => sum + (s.balance || 0), 0);
    const calculatedPayables = purchasesData.filter(p => p.supplierId === supplierId).reduce((sum, p) => sum + (p.balance || 0), 0);

    return {
      id: c.id,
      name: c.contactName,
      company: c.companyName,
      email: c.email,
      phone: c.phone,
      type: c.type,
      status: c.status,
      receivables: formatCurrency(calculatedReceivables),
      payables: formatCurrency(calculatedPayables),
      rawReceivables: calculatedReceivables,
      rawPayables: calculatedPayables,
      avatar: c.avatar,
      initials: c.contactName.split(' ').map(n => n[0]).join('') || 'CO',
      color: ['bg-emerald-100 text-emerald-700', 'bg-blue-100 text-blue-700', 'bg-purple-100 text-purple-700', 'bg-amber-100 text-amber-700'][i % 4]
    };
  });

  const filteredContacts = allContacts.filter(contact => {
    const matchesName = contact.name.toLowerCase().includes(filters.name.toLowerCase());
    const matchesCompany = contact.company.toLowerCase().includes(filters.company.toLowerCase());
    const matchesEmail = contact.email.toLowerCase().includes(filters.email.toLowerCase());
    const matchesPhone = contact.phone.includes(filters.phone);
    const matchesType = filters.type === 'All' || contact.type === filters.type;
    
    let matchesStatus = true;
    if (filters.status === 'With Outstanding') {
      matchesStatus = contact.rawReceivables > 0 || contact.rawPayables > 0;
    } else if (filters.status === 'Fully Paid') {
      matchesStatus = contact.rawReceivables === 0 && contact.rawPayables === 0;
    }

    return matchesName && matchesCompany && matchesEmail && matchesPhone && matchesType && matchesStatus;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredContacts.length / recordsPerPage);
  const paginatedContacts = filteredContacts.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  );

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setCurrentPage(1);
  };

  const handleTypeChange = (typeStr) => {
    setFilters({ ...filters, type: typeStr });
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Contacts</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your clients and their balances</p>
        </div>
        <div className="flex space-x-3">
          <button className="flex items-center justify-center text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 px-4 py-2.5 rounded-xl transition-all shadow-sm w-full sm:w-auto">
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 rounded-xl transition-all shadow-sm shadow-indigo-200 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Customer
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="glass-card rounded-3xl border border-white/50 shadow-lg shadow-slate-200/50 overflow-hidden flex flex-col">
        {/* Toolbar & Filters */}
        <div className="p-6 border-b border-slate-100 bg-white/50">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Quick Search */}
            <div className="flex-1 w-full max-w-md">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <input 
                  type="text" 
                  name="name"
                  value={filters.name}
                  onChange={handleFilterChange}
                  placeholder="Quick search by name..." 
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200/60 rounded-xl bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none text-sm"
                />
              </div>
              
              {/* Type Filter Radio Buttons */}
              <div className="flex items-center space-x-4 mt-3 ml-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Type:</span>
                <label className="flex items-center space-x-2 cursor-pointer group">
                  <input type="radio" name="contactType" checked={filters.type === 'All'} onChange={() => handleTypeChange('All')} className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500" />
                  <span className="text-sm text-slate-600 group-hover:text-indigo-600 transition-colors">All</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer group">
                  <input type="radio" name="contactType" checked={filters.type === 'Customer'} onChange={() => handleTypeChange('Customer')} className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500" />
                  <span className="text-sm text-slate-600 group-hover:text-indigo-600 transition-colors">Customer</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer group">
                  <input type="radio" name="contactType" checked={filters.type === 'Supplier'} onChange={() => handleTypeChange('Supplier')} className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500" />
                  <span className="text-sm text-slate-600 group-hover:text-indigo-600 transition-colors">Supplier</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer group">
                  <input type="radio" name="contactType" checked={filters.type === 'Both'} onChange={() => handleTypeChange('Both')} className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500" />
                  <span className="text-sm text-slate-600 group-hover:text-indigo-600 transition-colors">Both</span>
                </label>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 self-start">
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-xl border transition-all ${showFilters ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
              >
                <Filter className="w-4 h-4 mr-2" />
                Advanced Filters
              </button>
              <select 
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="bg-white border border-slate-200/60 text-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none cursor-pointer"
              >
                <option>Status: All</option>
                <option>With Outstanding</option>
                <option>Fully Paid</option>
              </select>
            </div>
          </div>

          {/* Advanced Filters Drawer */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in slide-in-from-top-2 duration-200">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Company Name</label>
                <input type="text" name="company" value={filters.company} onChange={handleFilterChange} placeholder="Filter by company" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Email Address</label>
                <input type="text" name="email" value={filters.email} onChange={handleFilterChange} placeholder="Filter by email" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Mobile Number</label>
                <input type="text" name="phone" value={filters.phone} onChange={handleFilterChange} placeholder="Filter by mobile" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto bg-white/40">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-slate-50/80 text-slate-500 font-medium border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 uppercase tracking-wider text-xs font-bold">Contact</th>
                <th className="px-6 py-4 uppercase tracking-wider text-xs font-bold whitespace-nowrap">Company Name</th>
                <th className="px-6 py-4 uppercase tracking-wider text-xs font-bold whitespace-nowrap">Contact Number</th>
                <th className="px-6 py-4 uppercase tracking-wider text-xs font-bold text-center whitespace-nowrap">Type</th>

                <th className="px-6 py-4 uppercase tracking-wider text-xs font-bold whitespace-nowrap text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              
              {paginatedContacts.length > 0 ? (
                paginatedContacts.map((row, i) => (
                  <tr key={row.id} className="hover:bg-white/80 transition-colors group border-b border-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        {row.avatar ? (
                          <img src={row.avatar} alt={row.name} className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200" />
                        ) : (
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${row.color}`}>
                            {row.initials}
                          </div>
                        )}
                        <div>
                          <span className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors block">{row.name}</span>
                          <span className="text-xs text-slate-500 flex items-center mt-0.5"><Mail className="w-3 h-3 mr-1" /> {row.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-600 whitespace-nowrap">{row.company}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {row.phone ? (
                        <a href={`tel:${row.phone.replace(/\s/g, '')}`} className="inline-flex items-center font-medium text-slate-600 hover:text-indigo-600 transition-colors">
                          <Phone className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                          {row.phone}
                        </a>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border ${
                        row.type === 'Customer' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 
                        row.type === 'Supplier' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                        'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200'
                      }`}>
                        {row.type}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <Link to={`/contacts/${row.id}`} className="text-indigo-600 hover:text-indigo-800 font-semibold text-sm bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors">
                        View Profile
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                    No customers found.
                  </td>
                </tr>
              )}

            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-100 bg-white/60 flex items-center justify-between text-sm text-slate-500">
          <span>Showing {paginatedContacts.length > 0 ? (currentPage - 1) * recordsPerPage + 1 : 0} to {Math.min(currentPage * recordsPerPage, allContacts.length)} of {allContacts.length} records</span>
          
          <div className="flex items-center space-x-2">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="px-3 font-medium text-slate-700">Page {currentPage} of {totalPages || 1}</span>
            <button 
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <CustomerModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
