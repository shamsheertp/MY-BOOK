import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Receipt,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Search,
  Plus,
  FileText,
  ShoppingBag,
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  RefreshCw,
  Eye,
  Calendar,
  X,
  Building,
  Phone,
  Mail,
  MapPin,
  Hash,
  Edit,
  CheckCircle2,
  Clock,
  ArrowDown,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import { StatusBadge } from '../Dashboard/components/StatusBadge';
import { CustomerModal } from './components/CustomerModal';
import { contactsService, salesService, purchasesService } from '../../services/api';

export default function ContactProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [contact, setContact] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Quick Record Payment Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState('ALL'); // ALL, INVOICES, PAYMENTS, PURCHASES
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(amount) || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const fetchContactData = useCallback(async (isRefreshAction = false) => {
    if (!id) return;
    if (isRefreshAction) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      // 1. Fetch live transactions & contact details from backend
      try {
        const res = await contactsService.getTransactions(id);
        if (res?.data) {
          if (res.data.contact) {
            setContact(res.data.contact);
          }
          if (Array.isArray(res.data.transactions)) {
            setTransactions(res.data.transactions);
          }
          if (res.data.summary) {
            setSummary(res.data.summary);
          }
          return;
        }
      } catch (txErr) {
        console.warn('Direct transactions endpoint error, falling back:', txErr);
      }

      // 2. Fallback: Query individual endpoints
      const contactRes = await contactsService.getById(id);
      const c = contactRes?.data?.contact || contactRes?.data || null;
      setContact(c);

      if (c) {
        const [salesRes, purchasesRes] = await Promise.allSettled([
          salesService.list({ customerId: c.id, limit: 100 }),
          purchasesService.list({ supplierId: c.id, limit: 100 }),
        ]);

        const salesList =
          salesRes.status === 'fulfilled' && Array.isArray(salesRes.value?.data)
            ? salesRes.value.data
            : [];
        const purchasesList =
          purchasesRes.status === 'fulfilled' && Array.isArray(purchasesRes.value?.data)
            ? purchasesRes.value.data
            : [];

        const unified = [];

        salesList.forEach((s) => {
          unified.push({
            id: s.id,
            ref: s.ref,
            type: 'Sale',
            category: 'Sale',
            date: s.date,
            dueDate: s.dueDate,
            amount: Number(s.total || 0),
            received: Number(s.received || 0),
            balance: Number(s.balance || 0),
            status: s.status,
            paymentMethod: '-',
            notes: s.notes || '',
            link: `/sales/${s.ref}`,
          });

          (s.payments || []).forEach((p) => {
            unified.push({
              id: p.id,
              ref: p.ref,
              parentRef: s.ref,
              type: 'Payment Received',
              category: 'Payment',
              date: p.date,
              amount: Number(p.amount || 0),
              received: Number(p.amount || 0),
              balance: 0,
              status: p.voided ? 'VOID' : 'PAID',
              paymentMethod: p.method || 'Bank Transfer',
              notes: `Payment for Invoice ${s.ref}`,
              link: `/sales/${s.ref}`,
            });
          });
        });

        purchasesList.forEach((p) => {
          unified.push({
            id: p.id,
            ref: p.ref,
            type: 'Purchase',
            category: 'Purchase',
            date: p.date,
            dueDate: p.expectedDeliveryDate,
            amount: Number(p.total || 0),
            received: Number(p.paid || 0),
            balance: Number(p.balance || 0),
            status: p.status,
            paymentMethod: '-',
            notes: p.notes || '',
            link: `/purchases/${p.ref}`,
          });

          (p.payments || []).forEach((pay) => {
            unified.push({
              id: pay.id,
              ref: pay.ref,
              parentRef: p.ref,
              type: 'Payment Sent',
              category: 'Payment',
              date: pay.date,
              amount: Number(pay.amount || 0),
              received: Number(pay.amount || 0),
              balance: 0,
              status: pay.voided ? 'VOID' : 'PAID',
              paymentMethod: pay.method || 'Bank Transfer',
              notes: `Payment for Purchase ${p.ref}`,
              link: `/purchases/payments/${pay.id}`,
            });
          });
        });

        unified.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setTransactions(unified);

        const activeSalesList = salesList.filter(s => s.status !== 'VOID');
        const activePurchasesList = purchasesList.filter(p => p.status !== 'VOID');
        const salesVol = activeSalesList.reduce((acc, s) => acc + Number(s.total || 0), 0);
        const purchaseVol = activePurchasesList.reduce((acc, p) => acc + Number(p.total || 0), 0);
        const toRec = activeSalesList.reduce((acc, s) => acc + Number(s.balance || 0), 0);
        const toPay = activePurchasesList.reduce((acc, p) => acc + Number(p.balance || 0), 0);

        setSummary({
          totalSalesVolume: salesVol,
          totalPurchasesVolume: purchaseVol,
          totalExpensesVolume: 0,
          totalToReceive: salesList.length > 0 ? toRec : Number(c.receivables || 0),
          totalToPay: purchasesList.length > 0 ? toPay : Number(c.payables || 0),
          netBalance: (salesList.length > 0 ? toRec : Number(c.receivables || 0)) - (purchasesList.length > 0 ? toPay : Number(c.payables || 0)),
          totalReceived: activeSalesList.reduce((acc, s) => acc + Number(s.received || 0), 0),
          totalPaid: activePurchasesList.reduce((acc, p) => acc + Number(p.paid || 0), 0),
          salesCount: salesList.length,
          purchasesCount: purchasesList.length,
          expensesCount: 0,
          paymentsCount: unified.filter((u) => u.category === 'Payment').length,
          totalCount: unified.length,
        });
      }
    } catch (err) {
      console.error('Failed to load contact profile:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchContactData();
  }, [fetchContactData]);

  // Tab counts
  const counts = useMemo(() => {
    const res = {
      INVOICES: 0,
      PAYMENTS: 0,
      PURCHASES: 0,
      ALL: transactions.length,
    };
    transactions.forEach((t) => {
      if (t.category === 'Sale' || t.type === 'Sale') res.INVOICES++;
      else if (t.category === 'Payment' || t.type.includes('Payment')) res.PAYMENTS++;
      else if (t.category === 'Purchase' || t.type === 'Purchase' || t.category === 'Bill' || t.type.includes('Bill')) res.PURCHASES++;
    });
    return res;
  }, [transactions]);

  // Outstanding sales invoices eligible for recording payment
  const unpaidInvoices = useMemo(() => {
    return transactions.filter(
      (t) => (t.category === 'Sale' || t.type === 'Sale') && Number(t.balance || 0) > 0
    );
  }, [transactions]);

  const openRecordPaymentModal = (defaultInvoice = null) => {
    const target = defaultInvoice || unpaidInvoices[0] || null;
    if (target) {
      setSelectedInvoiceId(target.id || target.ref);
      setPaymentAmount(String(target.balance || ''));
    } else {
      setSelectedInvoiceId('');
      setPaymentAmount('');
    }
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('Bank Transfer');
    setPaymentRef('');
    setPaymentNotes('');
    setIsPaymentModalOpen(true);
  };

  const handleRecordPaymentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedInvoiceId) {
      alert('Please select an invoice to apply payment.');
      return;
    }
    const amt = parseFloat(paymentAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }

    setIsSubmittingPayment(true);
    try {
      await salesService.recordPayment(selectedInvoiceId, {
        amount: amt,
        date: paymentDate,
        method: paymentMethod,
        ref: paymentRef || undefined,
        notes: paymentNotes || undefined,
      });

      setIsPaymentModalOpen(false);
      await fetchContactData(true);
    } catch (err) {
      alert(err?.response?.data?.message || err.message || 'Failed to record payment');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // 1. Tab filter
      if (filterTab === 'INVOICES' && t.category !== 'Sale' && t.type !== 'Sale') return false;
      if (filterTab === 'PAYMENTS' && t.category !== 'Payment' && !t.type.includes('Payment')) return false;
      if (
        filterTab === 'PURCHASES' &&
        t.category !== 'Purchase' &&
        t.type !== 'Purchase' &&
        t.category !== 'Bill' &&
        !t.type.includes('Bill')
      ) {
        return false;
      }

      // 2. Status filter
      if (filterStatus !== 'ALL') {
        const s = (t.status || '').toUpperCase();
        if (filterStatus === 'PAID' && s !== 'PAID' && s !== 'COMPLETED') return false;
        if (filterStatus === 'PARTIAL' && !s.includes('PARTIAL')) return false;
        if (filterStatus === 'UNPAID' && s !== 'UNPAID' && s !== 'PENDING') return false;
        if (filterStatus === 'OVERDUE' && s !== 'OVERDUE') return false;
        if (filterStatus === 'VOID' && s !== 'VOID' && s !== 'CANCELLED') return false;
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesRef = (t.ref || '').toLowerCase().includes(q);
        const matchesParentRef = (t.parentRef || '').toLowerCase().includes(q);
        const matchesType = (t.type || '').toLowerCase().includes(q);
        const matchesMethod = (t.paymentMethod || '').toLowerCase().includes(q);
        const matchesNotes = (t.notes || '').toLowerCase().includes(q);
        if (!matchesRef && !matchesParentRef && !matchesType && !matchesMethod && !matchesNotes) {
          return false;
        }
      }

      // 4. Date range filter
      if (dateFrom) {
        const itemDate = t.date ? new Date(t.date).toISOString().split('T')[0] : '';
        if (itemDate && itemDate < dateFrom) return false;
      }
      if (dateTo) {
        const itemDate = t.date ? new Date(t.date).toISOString().split('T')[0] : '';
        if (itemDate && itemDate > dateTo) return false;
      }

      return true;
    });
  }, [transactions, filterTab, filterStatus, searchQuery, dateFrom, dateTo]);

  const totalPages = Math.ceil(filteredTransactions.length / recordsPerPage) || 1;
  const paginatedTransactions = useMemo(() => {
    return filteredTransactions.slice(
      (currentPage - 1) * recordsPerPage,
      currentPage * recordsPerPage
    );
  }, [filteredTransactions, currentPage, recordsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterTab, filterStatus, dateFrom, dateTo]);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    start = Math.max(1, end - maxVisible + 1);
    for (let p = start; p <= end; p++) pages.push(p);
    return pages;
  };

  const getTransactionBadge = (type) => {
    switch (type) {
      case 'Sale':
        return {
          icon: FileText,
          label: 'Sale Invoice',
          className: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        };
      case 'Purchase':
        return {
          icon: ShoppingBag,
          label: 'Purchase Order',
          className: 'bg-amber-50 text-amber-700 border-amber-200',
        };
      case 'Payment Received':
        return {
          icon: ArrowDownLeft,
          label: 'Payment In',
          className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
      case 'Payment Sent':
        return {
          icon: ArrowUpRight,
          label: 'Payment Out',
          className: 'bg-purple-50 text-purple-700 border-purple-200',
        };
      case 'Purchase Bill':
        return {
          icon: Receipt,
          label: 'Purchase Bill',
          className: 'bg-sky-50 text-sky-700 border-sky-200',
        };
      case 'Expense':
        return {
          icon: CreditCard,
          label: 'Expense',
          className: 'bg-rose-50 text-rose-700 border-rose-200',
        };
      default:
        return {
          icon: FileText,
          label: type,
          className: 'bg-slate-50 text-slate-700 border-slate-200',
        };
    }
  };

  const initials =
    contact?.contactName
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase() || 'CO';

  const toReceiveAmount = summary?.totalToReceive ?? Number(contact?.receivables || 0);
  const toPayAmount = summary?.totalToPay ?? Number(contact?.payables || 0);
  const salesVolumeAmount = summary?.totalSalesVolume ?? 0;
  const purchaseVolumeAmount = summary?.totalPurchasesVolume ?? 0;
  const totalReceivedAmount = summary?.totalReceived ?? Math.max(0, salesVolumeAmount - toReceiveAmount);

  const hasPurchases = purchaseVolumeAmount > 0 || counts.PURCHASES > 0 || toPayAmount > 0;
  const hasSales = salesVolumeAmount > 0 || counts.INVOICES > 0 || toReceiveAmount > 0;

  if (isLoading && !contact) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto pb-12 fade-in">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/contacts')}
            className="flex items-center space-x-2 text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer text-sm font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Contacts</span>
          </button>
        </div>
        <div className="h-32 bg-white rounded-3xl border border-slate-100 shadow-sm animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-white rounded-2xl border border-slate-100 shadow-sm animate-pulse"></div>
          ))}
        </div>
        <div className="h-96 bg-white rounded-3xl border border-slate-100 shadow-sm animate-pulse"></div>
      </div>
    );
  }

  if (!isLoading && !contact) {
    return (
      <div className="max-w-md mx-auto py-16 text-center fade-in">
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h2 className="text-xl font-bold text-slate-800 mb-2">Contact Not Found</h2>
          <p className="text-slate-500 text-sm mb-6">
            The contact does not exist or may have been deleted.
          </p>
          <button
            onClick={() => navigate('/contacts')}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer"
          >
            Back to Contacts
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 fade-in">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/contacts')}
          className="flex items-center space-x-2 text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Contacts</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchContactData(true)}
            disabled={isRefreshing}
            className="flex items-center px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-indigo-600 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
            Refresh
          </button>

          {toReceiveAmount > 0 && unpaidInvoices.length > 0 && (
            <button
              onClick={() => openRecordPaymentModal()}
              className="flex items-center px-3.5 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-100 transition-all cursor-pointer"
            >
              <DollarSign className="w-3.5 h-3.5 mr-1" />
              Record Payment
            </button>
          )}

          <button
            onClick={() => navigate('/sales/new', { state: { preselectedContact: contact } })}
            className="flex items-center px-3.5 py-1.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-100 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            New Invoice
          </button>

          {hasPurchases && (
            <button
              onClick={() => navigate('/purchases/new', { state: { preselectedSupplier: contact } })}
              className="flex items-center px-3.5 py-1.5 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              New Purchase
            </button>
          )}
        </div>
      </div>

      {/* Clean Contact Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 shrink-0 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl flex items-center justify-center font-black text-2xl text-white shadow-md shadow-indigo-500/20">
              {initials}
            </div>
            <div>
              <div className="flex items-center space-x-2.5 flex-wrap">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  {contact?.contactName}
                </h1>
                <span className="px-2 py-0.5 text-xs font-bold bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100/60 flex items-center">
                  <Hash className="w-3 h-3 mr-0.5 text-indigo-500" />
                  {contact?.code || contact?.id}
                </span>
                <span className="px-2 py-0.5 text-[11px] font-bold bg-slate-100 text-slate-600 rounded-md uppercase">
                  {hasSales && hasPurchases ? 'Customer & Supplier' : hasPurchases ? 'Supplier' : 'Customer'}
                </span>
              </div>

              <div className="flex flex-wrap items-center mt-2 text-xs font-medium text-slate-500 gap-x-4 gap-y-1.5">
                {contact?.companyName && contact.companyName !== contact.contactName && (
                  <span className="flex items-center text-slate-700 font-semibold">
                    <Building className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    {contact.companyName}
                  </span>
                )}
                {contact?.phone && (
                  <span className="flex items-center">
                    <Phone className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    {contact.phone}
                  </span>
                )}
                {contact?.email && (
                  <span className="flex items-center">
                    <Mail className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    {contact.email}
                  </span>
                )}
                {contact?.address && (
                  <span className="flex items-center w-full sm:w-auto">
                    <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    {contact.address}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center self-start sm:self-auto text-xs font-semibold text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 px-3.5 py-2 rounded-xl transition-all cursor-pointer"
          >
            <Edit className="w-3.5 h-3.5 mr-1.5" />
            Edit Profile
          </button>
        </div>
      </div>

      {/* Simplified, Purpose-Driven Stat Cards (Clean 3-Card Summary, No Clutter, No 0s) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Balance Due (Most Important!) */}
        <div
          className={`p-5 rounded-2xl border transition-all ${
            toReceiveAmount > 0
              ? 'bg-rose-50/40 border-rose-200 shadow-2xs'
              : 'bg-emerald-50/30 border-emerald-200 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Total To Receive
            </span>
            <Clock className={`w-4 h-4 ${toReceiveAmount > 0 ? 'text-rose-500' : 'text-emerald-500'}`} />
          </div>
          <div className={`text-2xl font-black ${toReceiveAmount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {formatCurrency(toReceiveAmount)}
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className={`text-xs font-medium ${toReceiveAmount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {toReceiveAmount > 0 ? 'Customer balance pending' : 'All accounts settled (₹0.00)'}
            </span>
            {toReceiveAmount > 0 && unpaidInvoices.length > 0 && (
              <button
                onClick={() => openRecordPaymentModal()}
                className="text-[11px] font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-2 py-0.5 rounded cursor-pointer"
              >
                + Collect
              </button>
            )}
          </div>
        </div>

        {/* Card 2: Total Billed */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs hover:shadow-sm transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Sales Volume
            </span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {formatCurrency(salesVolumeAmount)}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Total invoices billed to customer
          </div>
        </div>

        {/* Card 3: Total Received */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs hover:shadow-sm transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Total Received
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600">
            {formatCurrency(totalReceivedAmount)}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Confirmed payments collected
          </div>
        </div>
      </div>

      {/* If this contact has Purchases/Payables, show Supplier Stats compactly */}
      {hasPurchases && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between shadow-2xs">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Purchase Volume
              </span>
              <div className="text-xl font-black text-slate-800 mt-0.5">
                {formatCurrency(purchaseVolumeAmount)}
              </div>
            </div>
            <ShoppingBag className="w-5 h-5 text-amber-500" />
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between shadow-2xs">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Total To Pay
              </span>
              <div className={`text-xl font-black mt-0.5 ${toPayAmount > 0 ? 'text-amber-600' : 'text-slate-800'}`}>
                {formatCurrency(toPayAmount)}
              </div>
            </div>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
        </div>
      )}

      {/* Main Transactions Container */}
      <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm">
        {/* Navigation Tabs Bar */}
        <div className="px-6 pt-4 pb-0 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto">
            {[
              { key: 'INVOICES', label: 'Invoices', count: counts.INVOICES },
              { key: 'PAYMENTS', label: 'Payments Received', count: counts.PAYMENTS },
              { key: 'ALL', label: 'All Activity (Ledger)', count: counts.ALL },
              ...(hasPurchases ? [{ key: 'PURCHASES', label: 'Purchases', count: counts.PURCHASES }] : []),
            ].map((tab) => {
              const isActive = filterTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setFilterTab(tab.key)}
                  className={`flex items-center space-x-2 px-3.5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-200'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[11px] font-bold ${
                      isActive
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search & Filter Controls */}
          <div className="flex items-center space-x-2.5 pb-3 md:pb-0">
            <div className="relative w-48 sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ref #..."
                className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-xl bg-slate-50 text-xs text-slate-700 font-medium outline-none cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="PAID">Paid</option>
              <option value="PARTIAL">Partial</option>
              <option value="UNPAID">Unpaid</option>
              <option value="VOID">Void</option>
            </select>

            <button
              onClick={() => setShowDateFilter(!showDateFilter)}
              className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                showDateFilter || dateFrom || dateTo
                  ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
                  : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
              }`}
              title="Filter by Date"
            >
              <Calendar className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Date Filter Drawer */}
        {showDateFilter && (
          <div className="px-6 py-3 bg-slate-50/80 border-b border-slate-100 flex flex-wrap items-center gap-3 text-xs">
            <span className="font-semibold text-slate-500">Date Range:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 outline-none"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 outline-none"
            />
            {(dateFrom || dateTo) && (
              <button
                onClick={() => {
                  setDateFrom('');
                  setDateTo('');
                }}
                className="text-xs font-semibold text-rose-600 hover:underline cursor-pointer ml-2"
              >
                Clear
              </button>
            )}
          </div>
        )}

        {/* TAB SPECIFIC SIMPLE TABLES */}
        <div className="overflow-x-auto">
          {filterTab === 'INVOICES' ? (
            /* =================== TAB 1: INVOICES TABLE =================== */
            <table className="w-full text-xs sm:text-sm text-left">
              <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Invoice #</th>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5">Due Date</th>
                  <th className="px-6 py-3.5 text-right">Invoice Total</th>
                  <th className="px-6 py-3.5 text-right">Amount Paid</th>
                  <th className="px-6 py-3.5 text-right">Balance Due</th>
                  <th className="px-6 py-3.5 text-center">Status</th>
                  <th className="px-6 py-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paginatedTransactions.length > 0 ? (
                  paginatedTransactions.map((t) => {
                    const isVoid = t.status === 'VOID' || t.status === 'CANCELLED';
                    const balanceNum = Number(t.balance || 0);
                    return (
                      <tr
                        key={t.id || t.ref}
                        className={`hover:bg-slate-50/70 transition-colors group cursor-pointer ${isVoid ? 'bg-stone-50/50' : ''}`}
                        onClick={() => t.link && navigate(t.link)}
                      >
                        <td className="px-6 py-4 font-bold text-indigo-600 hover:underline">
                          {t.ref}
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-medium">
                          {formatDate(t.date)}
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {formatDate(t.dueDate)}
                        </td>
                        <td className={`px-6 py-4 text-right font-bold ${isVoid ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                          {formatCurrency(t.amount)}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-emerald-600">
                          {Number(t.received) > 0 ? formatCurrency(t.received) : '—'}
                        </td>
                        <td className="px-6 py-4 text-right font-extrabold">
                          {isVoid ? (
                            <span className="text-stone-400 font-semibold">— (Void)</span>
                          ) : balanceNum > 0 ? (
                            <span className="text-rose-600">{formatCurrency(balanceNum)}</span>
                          ) : (
                            <span className="text-emerald-600 font-semibold flex items-center justify-end">
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Paid
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <StatusBadge status={t.status} />
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center space-x-1" onClick={(e) => e.stopPropagation()}>
                            {balanceNum > 0 && (
                              <button
                                onClick={() => openRecordPaymentModal(t)}
                                className="px-2 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 transition-colors cursor-pointer"
                                title="Record payment for this invoice"
                              >
                                Pay
                              </button>
                            )}
                            <button
                              onClick={() => t.link && navigate(t.link)}
                              className="p-1 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                              title="View Invoice"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center text-slate-400">
                      <Receipt className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-600 text-sm">No sales invoices found</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Click "+ New Invoice" to bill this customer.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : filterTab === 'PAYMENTS' ? (
            /* =================== TAB 2: PAYMENTS TABLE =================== */
            <table className="w-full text-xs sm:text-sm text-left">
              <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Payment Ref</th>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5">Invoice Ref</th>
                  <th className="px-6 py-3.5">Payment Method</th>
                  <th className="px-6 py-3.5 text-right">Amount Received</th>
                  <th className="px-6 py-3.5 text-center">Status</th>
                  <th className="px-6 py-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paginatedTransactions.length > 0 ? (
                  paginatedTransactions.map((t) => (
                    <tr
                      key={t.id || t.ref}
                      className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                      onClick={() => t.link && navigate(t.link)}
                    >
                      <td className="px-6 py-4 font-bold text-indigo-600 hover:underline">
                        {t.ref}
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-medium">
                        {formatDate(t.date)}
                      </td>
                      <td className="px-6 py-4">
                        {t.parentRef ? (
                          <span className="font-semibold text-slate-700">{t.parentRef}</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                          {t.paymentMethod || 'Bank Transfer'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-black text-emerald-600">
                        {formatCurrency(t.amount)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <StatusBadge status={t.status} />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (t.link) navigate(t.link);
                          }}
                          className="p-1 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                      <CreditCard className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-600 text-sm">No payments recorded yet</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Use "Record Payment" to log money received from this customer.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            /* =================== TAB 3 & 4: ALL ACTIVITY / PURCHASES TABLE =================== */
            <table className="w-full text-xs sm:text-sm text-left">
              <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Ref No</th>
                  <th className="px-6 py-3.5">Type</th>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5 text-right">Billed (+)</th>
                  <th className="px-6 py-3.5 text-right">Paid (-)</th>
                  <th className="px-6 py-3.5 text-right">Balance Due</th>
                  <th className="px-6 py-3.5 text-center">Status</th>
                  <th className="px-4 py-3.5 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paginatedTransactions.length > 0 ? (
                  paginatedTransactions.map((t) => {
                    const badge = getTransactionBadge(t.type);
                    const isPayment = t.category === 'Payment' || t.type.includes('Payment');
                    const isSale = t.category === 'Sale' || t.type === 'Sale';
                    const balanceNum = Number(t.balance || 0);
                    const isVoid = t.status === 'VOID' || t.status === 'CANCELLED';

                    return (
                      <tr
                        key={t.id || t.ref}
                        className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                        onClick={() => t.link && navigate(t.link)}
                      >
                        {/* Ref No */}
                        <td className="px-6 py-4">
                          <div className="font-bold text-indigo-600 hover:underline">
                            {t.ref}
                          </div>
                          {t.parentRef && (
                            <div className="text-[11px] text-slate-400">
                              for {t.parentRef}
                            </div>
                          )}
                        </td>

                        {/* Type */}
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 text-[11px] font-bold uppercase rounded-md border ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="px-6 py-4 text-slate-500 whitespace-nowrap font-medium">
                          {formatDate(t.date)}
                        </td>

                        {/* Billed (+) */}
                        <td className={`px-6 py-4 text-right font-bold whitespace-nowrap ${isVoid ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                          {isSale || (!isPayment && !isSale) ? (
                            formatCurrency(t.amount)
                          ) : (
                            <span className="text-slate-300 font-normal">—</span>
                          )}
                        </td>

                        {/* Paid (-) */}
                        <td className="px-6 py-4 text-right font-medium whitespace-nowrap">
                          {isPayment ? (
                            <span className={`font-bold flex items-center justify-end ${isVoid ? 'text-slate-400 line-through' : 'text-emerald-600'}`}>
                              <ArrowDown className="w-3 h-3 mr-0.5" />
                              {formatCurrency(t.amount)}
                            </span>
                          ) : (
                            <span className="text-slate-300 font-normal">—</span>
                          )}
                        </td>

                        {/* Balance Due */}
                        <td className="px-6 py-4 text-right whitespace-nowrap font-bold">
                          {isVoid ? (
                            <span className="text-stone-400 font-normal">—</span>
                          ) : isSale ? (
                            balanceNum > 0 ? (
                              <span className="text-rose-600 font-extrabold">{formatCurrency(balanceNum)}</span>
                            ) : (
                              <span className="text-emerald-600 font-semibold flex items-center justify-end">
                                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Paid
                              </span>
                            )
                          ) : isPayment ? (
                            <span className="text-slate-300 font-normal">—</span>
                          ) : balanceNum > 0 ? (
                            <span className="text-amber-600 font-bold">{formatCurrency(balanceNum)}</span>
                          ) : (
                            <span className="text-slate-400 font-normal">—</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4 text-center">
                          <StatusBadge status={t.status} />
                        </td>

                        {/* Action */}
                        <td className="px-4 py-4 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (t.link) navigate(t.link);
                            }}
                            className="p-1 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center text-slate-400">
                      <Receipt className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-600 text-sm">No transactions found</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {transactions.length === 0
                          ? 'No invoices or payments have been recorded yet.'
                          : 'No records match your search filter.'}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Minimal Pagination */}
        {filteredTransactions.length > recordsPerPage && (
          <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {(currentPage - 1) * recordsPerPage + 1} -{' '}
              {Math.min(currentPage * recordsPerPage, filteredTransactions.length)} of{' '}
              {filteredTransactions.length}
            </span>

            <div className="flex items-center space-x-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              {getPageNumbers().map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`min-w-[28px] h-7 px-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    p === currentPage
                      ? 'bg-indigo-600 text-white'
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {p}
                </button>
              ))}

              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* QUICK RECORD PAYMENT MODAL */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-slate-100 relative">
            <button
              onClick={() => setIsPaymentModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Record Payment</h3>
                <p className="text-xs text-slate-500">{contact?.contactName}</p>
              </div>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Select Unpaid Invoice *
                </label>
                <select
                  value={selectedInvoiceId}
                  onChange={(e) => {
                    setSelectedInvoiceId(e.target.value);
                    const inv = unpaidInvoices.find((i) => (i.id || i.ref) === e.target.value);
                    if (inv) setPaymentAmount(String(inv.balance || ''));
                  }}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
                >
                  <option value="">-- Choose Invoice --</option>
                  {unpaidInvoices.map((inv) => (
                    <option key={inv.id || inv.ref} value={inv.id || inv.ref}>
                      {inv.ref} (Balance: {formatCurrency(inv.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Payment Amount (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 bg-slate-50 focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 bg-slate-50 focus:bg-white outline-none cursor-pointer"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Reference / Transaction ID
                </label>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="e.g. UTR / Cheque #"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 bg-slate-50 focus:bg-white outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPayment}
                  className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingPayment ? 'Saving...' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Customer / Contact Modal */}
      <CustomerModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        contact={contact}
        onSaved={() => fetchContactData(true)}
      />
    </div>
  );
}
