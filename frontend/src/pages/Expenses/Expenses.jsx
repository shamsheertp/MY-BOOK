import { useState, useMemo, useEffect, useCallback } from 'react';
import { Plus, Search, ArrowDownToLine, Receipt, CreditCard, Clock, CheckCircle2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import expensesData from '../../db/expenses.json';
import { expensesService } from '../../services/api';
import CreateExpense from './CreateExpense';
import ExpenseTable from './components/ExpenseTable';
import ExpenseFilters from './components/ExpenseFilters';

export default function Expenses() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const itemsPerPage = 8;

  // Fetch all categories from DB or defaults
  useEffect(() => {
    expensesService.getCategories()
      .then((res) => {
        if (res?.data && Array.isArray(res.data)) {
          setCategories(res.data.map(c => c.name));
        }
      })
      .catch(() => {
        // Fallback to static categories
      });
  }, []);

  const loadExpenses = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await expensesService.list({
        page: 1, // retrieve records for client filtering or backend pagination
        limit: 100,
        search: searchQuery,
        category: categoryFilter,
        status: statusFilter,
      });

      if (res?.data?.expenses && Array.isArray(res.data.expenses)) {
        setExpenses(res.data.expenses);
        if (res.data.summary) {
          setSummary(res.data.summary);
        }
      } else {
        setExpenses(expensesData);
      }
    } catch (err) {
      console.warn('Failed to fetch expenses from backend, using local fallback:', err);
      setExpenses(expensesData);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, categoryFilter, statusFilter]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const allCategories = useMemo(() => {
    const list = new Set(['All', ...categories, ...expenses.map(e => e.category)]);
    return Array.from(list);
  }, [categories, expenses]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      const matchesSearch = !searchQuery.trim() || 
        (expense.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (expense.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (expense.ref || expense.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (expense.payee || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'All' || expense.status === statusFilter;
      const matchesCategory = categoryFilter === 'All' || expense.category === categoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [searchQuery, statusFilter, categoryFilter, expenses]);

  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);
  const paginatedExpenses = useMemo(() => {
    return filteredExpenses.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filteredExpenses, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, categoryFilter]);

  const totalExpenses = useMemo(() => {
    return filteredExpenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
  }, [filteredExpenses]);

  const paidExpenses = useMemo(() => {
    return filteredExpenses
      .filter(e => e.status === 'Paid')
      .reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
  }, [filteredExpenses]);

  const pendingExpenses = useMemo(() => {
    return filteredExpenses
      .filter(e => e.status === 'Pending')
      .reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
  }, [filteredExpenses]);

  return (
    <div className="max-w-7xl mx-auto fade-in">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Expenses</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">Track and manage your company expenditures with live database sync</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button 
            type="button"
            onClick={() => {
              const csvContent = "data:text/csv;charset=utf-8," + 
                ["Date,Ref,Category,Description,Amount,Method,Status",
                  ...filteredExpenses.map(e => `"${e.date}","${e.ref || e.id}","${e.category}","${(e.description || '').replace(/"/g, '""')}","${e.amount}","${e.paymentMethod}","${e.status}"`)
                ].join("\n");
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement("a");
              link.setAttribute("href", encodedUri);
              link.setAttribute("download", `expenses_${new Date().toISOString().split('T')[0]}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-slate-700 rounded-xl border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md transition-all font-medium text-sm flex-1 sm:flex-none cursor-pointer"
          >
            <ArrowDownToLine className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Expenses</p>
          <p className="text-2xl font-black text-slate-800 mt-1">₹{totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-xs text-slate-400 mt-1">{filteredExpenses.length} record{filteredExpenses.length === 1 ? '' : 's'}</p>
        </div>
        <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Paid</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">₹{paidExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-xs text-slate-400 mt-1">Settled payments</p>
        </div>
        <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
          <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Pending</p>
          <p className="text-2xl font-black text-amber-600 mt-1">₹{pendingExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-xs text-slate-400 mt-1">Unsettled liabilities</p>
        </div>
      </div>

      {/* Quick Add Form */}
      <div className="mb-8 relative z-20">
        <CreateExpense 
          isInline={true} 
          onSave={(newExpense) => {
            setExpenses(prev => [newExpense, ...prev]);
            loadExpenses();
          }} 
        />
      </div>

      <div className="glass-card bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <ExpenseFilters 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          allCategories={allCategories}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />

        <ExpenseTable 
          paginatedExpenses={paginatedExpenses}
          filteredExpenses={filteredExpenses}
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
