import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  Filter,
  ChevronLeft,
  ChevronRight,
  Mail,
  Download,
  Phone,
  Edit2,
  Trash2,
  Loader2,
  AlertCircle,
  Building,
  DollarSign,
  Users,
  Briefcase,
  Truck,
  CheckCircle,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { CustomerModal } from './components/CustomerModal';
import { contactsService } from '../../services/api';
import salesData from '../../db/sales.json';
import purchasesData from '../../db/purchases.json';

export default function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [contactToDelete, setContactToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Pagination & Filters
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const recordsPerPage = 15;

  const [filters, setFilters] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(Number(amount) || 0);
  };

  // Fetch contacts from PostgreSQL DB
  const loadContacts = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const res = await contactsService.list({ limit: 100 });
      if (res?.data?.contacts && Array.isArray(res.data.contacts)) {
        setContacts(res.data.contacts);
      } else if (Array.isArray(res?.data)) {
        setContacts(res.data);
      } else {
        setContacts([]);
      }
    } catch (err) {
      console.error('API fetch error for contacts:', err);
      setFetchError(err.message || 'Could not connect to database.');
      setContacts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  // Compute calculated values and normalize list
  const normalizedContacts = useMemo(() => {
    return contacts.map((c, i) => {
      const idOrCode = c.code || c.id || `CONT-${i + 1}`;
      const suffix = idOrCode.includes('-') ? idOrCode.substring(idOrCode.indexOf('-') + 1) : idOrCode;
      const customerId = `CUST-${suffix}`;
      const supplierId = `SUP-${suffix}`;

      // Calculated from linked sales / purchases if available, otherwise from stored DB values
      const linkedReceivables = salesData.filter((s) => s.customerId === customerId).reduce((sum, s) => sum + (s.balance || 0), 0);
      const linkedPayables = purchasesData.filter((p) => p.supplierId === supplierId).reduce((sum, p) => sum + (p.balance || 0), 0);

      const receivablesNum = linkedReceivables > 0 ? linkedReceivables : Number(c.receivables || 0);
      const payablesNum = linkedPayables > 0 ? linkedPayables : Number(c.payables || 0);

      const contactName = c.contactName || c.name || 'Unnamed Contact';

      return {
        id: c.id,
        code: c.code || c.id,
        name: contactName,
        contactName,
        company: c.companyName || c.company || '',
        companyName: c.companyName || c.company || '',
        email: c.email || '',
        phone: c.phone || '',
        receivables: formatCurrency(receivablesNum),
        payables: formatCurrency(payablesNum),
        rawReceivables: receivablesNum,
        rawPayables: payablesNum,
        avatar: c.avatar,
        address: c.address || '',
        taxNumber: c.taxNumber || '',
        notes: c.notes || '',
        initials: contactName.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase() || 'CO',
        color: ['bg-emerald-100 text-emerald-700', 'bg-indigo-100 text-indigo-700', 'bg-purple-100 text-purple-700', 'bg-amber-100 text-amber-700'][i % 4],
      };
    });
  }, [contacts]);

  // Overall Statistics
  const stats = useMemo(() => {
    let totalRec = 0;
    let totalPay = 0;

    normalizedContacts.forEach((c) => {
      totalRec += c.rawReceivables;
      totalPay += c.rawPayables;
    });

    return {
      total: normalizedContacts.length,
      receivables: totalRec,
      payables: totalPay,
      net: totalRec - totalPay,
    };
  }, [normalizedContacts]);

  // Filtered contacts based on UI search & filter inputs
  const filteredContacts = useMemo(() => {
    const qName = filters.name.toLowerCase().trim();
    const qCompany = filters.company.toLowerCase().trim();
    const qEmail = filters.email.toLowerCase().trim();
    const qPhone = filters.phone.trim();

    return normalizedContacts.filter((contact) => {
      const matchesName =
        !qName ||
        contact.name.toLowerCase().includes(qName) ||
        contact.code.toLowerCase().includes(qName);
      const matchesCompany = !qCompany || contact.company.toLowerCase().includes(qCompany);
      const matchesEmail = !qEmail || contact.email.toLowerCase().includes(qEmail);
      const matchesPhone = !qPhone || contact.phone.includes(qPhone);

      return matchesName && matchesCompany && matchesEmail && matchesPhone;
    });
  }, [normalizedContacts, filters]);

  // Pagination
  const totalPages = Math.ceil(filteredContacts.length / recordsPerPage) || 1;
  const paginatedContacts = filteredContacts.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  );

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setCurrentPage(1);
  };

  // Delete contact handler
  const confirmDelete = async () => {
    if (!contactToDelete) return;
    setIsDeleting(true);
    try {
      await contactsService.delete(contactToDelete.id || contactToDelete.code);
      setContactToDelete(null);
      await loadContacts();
    } catch (err) {
      alert(`Failed to delete contact: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // CSV Export handler
  const handleExportCSV = () => {
    if (!filteredContacts.length) return;
    const headers = ['ID/Code', 'Contact Name', 'Company Name', 'Phone', 'Email', 'Receivables (INR)', 'Payables (INR)', 'Address'];
    const rows = filteredContacts.map((c) => [
      `"${c.code}"`,
      `"${c.name}"`,
      `"${c.company}"`,
      `"${c.phone}"`,
      `"${c.email}"`,
      c.rawReceivables,
      c.rawPayables,
      `"${c.address.replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MY-BOOK-Contacts-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">Contacts</h1>
            <span className="px-2.5 py-1 text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60 rounded-full">
              PostgreSQL Connected
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Manage your customers, suppliers, receivables, and payables with real-time database sync.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadContacts}
            disabled={isLoading}
            className="p-2.5 text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
            title="Refresh from Database"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4 mr-2 text-slate-500" />
            Export CSV
          </button>

          <button
            onClick={() => {
              setSelectedContact(null);
              setIsModalOpen(true);
            }}
            className="flex items-center text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 px-4 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-100 cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Contact
          </button>
        </div>
      </div>

      {/* Error alert if any */}
      {fetchError && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{fetchError}</span>
          </div>
          <button
            onClick={loadContacts}
            className="underline font-semibold hover:text-amber-950 cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Contacts</p>
            <p className="text-xl font-bold text-slate-800 mt-0.5">{stats.total}</p>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-emerald-100/70 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">Total Receivables</p>
            <p className="text-base sm:text-lg font-extrabold text-emerald-700 mt-0.5">{formatCurrency(stats.receivables)}</p>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-rose-100/70 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-rose-700">Total Payables</p>
            <p className="text-base sm:text-lg font-extrabold text-rose-700 mt-0.5">{formatCurrency(stats.payables)}</p>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3.5">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${stats.net >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Net Balance</p>
            <p className={`text-base sm:text-lg font-extrabold mt-0.5 ${stats.net >= 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
              {formatCurrency(stats.net)}
            </p>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar & Filters */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Quick Search */}
            <div className="flex-1 w-full max-w-lg">
              <div className="relative group">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 group-focus-within:text-indigo-600 transition-colors pointer-events-none" />
                <input
                  type="text"
                  name="name"
                  value={filters.name}
                  onChange={handleFilterChange}
                  placeholder="Search by name, company, or CONT code..."
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all text-sm"
                />
              </div>
            </div>

            {/* Filter controls */}
            <div className="flex items-center space-x-3 self-start lg:self-center">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center px-4 py-2.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                  showFilters
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Filter className="w-3.5 h-3.5 mr-2" />
                Advanced Filters
              </button>
            </div>
          </div>

          {/* Advanced Filters Drawer */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-slate-200/60 grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in slide-in-from-top-2 duration-200">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">
                  Company Name
                </label>
                <input
                  type="text"
                  name="company"
                  value={filters.company}
                  onChange={handleFilterChange}
                  placeholder="Filter by company"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">
                  Email Address
                </label>
                <input
                  type="text"
                  name="email"
                  value={filters.email}
                  onChange={handleFilterChange}
                  placeholder="Filter by email"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">
                  Phone Number
                </label>
                <input
                  type="text"
                  name="phone"
                  value={filters.phone}
                  onChange={handleFilterChange}
                  placeholder="Filter by phone"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 uppercase tracking-wider text-xs font-bold">Contact</th>
                <th className="px-6 py-4 uppercase tracking-wider text-xs font-bold whitespace-nowrap">Company</th>
                <th className="px-6 py-4 uppercase tracking-wider text-xs font-bold whitespace-nowrap">Phone</th>
                <th className="px-6 py-4 uppercase tracking-wider text-xs font-bold text-right whitespace-nowrap">Receivables</th>
                <th className="px-6 py-4 uppercase tracking-wider text-xs font-bold text-right whitespace-nowrap">Payables</th>
                <th className="px-6 py-4 uppercase tracking-wider text-xs font-bold text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                      <p className="text-xs font-medium">Loading contacts from database...</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedContacts.length > 0 ? (
                paginatedContacts.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/60 transition-colors group">
                    {/* Contact Info */}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        {row.avatar ? (
                          <img
                            src={row.avatar}
                            alt={row.name}
                            className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${row.color}`}
                          >
                            {row.initials}
                          </div>
                        )}
                        <div>
                          <Link
                            to={`/contacts/${row.code || row.id}`}
                            className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors block"
                          >
                            {row.name}
                          </Link>
                          {row.email && (
                            <div className="flex items-center text-xs text-slate-400 mt-0.5">
                              <span className="flex items-center truncate max-w-[180px]">
                                <Mail className="w-3 h-3 mr-1 shrink-0" /> {row.email}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Company */}
                    <td className="px-6 py-4 font-medium text-slate-600 whitespace-nowrap">
                      {row.company ? (
                        <div className="flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          <span>{row.company}</span>
                        </div>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    {/* Phone */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {row.phone ? (
                        <a
                          href={`tel:${row.phone.replace(/\s/g, '')}`}
                          className="inline-flex items-center font-medium text-slate-600 hover:text-indigo-600 transition-colors text-xs"
                        >
                          <Phone className="w-3 h-3 mr-1 text-slate-400" />
                          {row.phone}
                        </a>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    {/* Receivables */}
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <span
                        className={`font-semibold text-xs ${
                          row.rawReceivables > 0 ? 'text-emerald-600' : 'text-slate-400'
                        }`}
                      >
                        {row.receivables}
                      </span>
                    </td>

                    {/* Payables */}
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <span
                        className={`font-semibold text-xs ${
                          row.rawPayables > 0 ? 'text-rose-600' : 'text-slate-400'
                        }`}
                      >
                        {row.payables}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/contacts/${row.code || row.id}`}
                          className="px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                        >
                          Profile
                        </Link>

                        <button
                          onClick={() => {
                            setSelectedContact(row);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Contact"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setContactToDelete(row)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Contact"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center text-slate-400">
                    <p className="font-semibold text-slate-600">No contacts match the filter</p>
                    <p className="text-xs text-slate-400 mt-1">Try resetting the search filters or add a new contact.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span>
            Showing {filteredContacts.length > 0 ? (currentPage - 1) * recordsPerPage + 1 : 0} to{' '}
            {Math.min(currentPage * recordsPerPage, filteredContacts.length)} of {filteredContacts.length} contacts
          </span>

          <div className="flex items-center space-x-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 font-semibold text-slate-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Contact Modal */}
      <CustomerModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedContact(null);
        }}
        contact={selectedContact}
        onSaved={loadContacts}
      />

      {/* Delete Confirmation Modal */}
      {contactToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-slate-100">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Delete Contact</h3>
            </div>
            <p className="text-sm text-slate-600 mb-6">
              Are you sure you want to delete{' '}
              <strong className="text-slate-800">{contactToDelete.name}</strong> ({contactToDelete.code})? This action
              will remove the contact from the database.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setContactToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-md shadow-rose-100 flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
