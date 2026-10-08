import { useState, useMemo, useEffect } from 'react';
import { Plus, Search, ArrowDownToLine, Receipt, CreditCard, Clock, CheckCircle2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import expensesData from '../../db/expenses.json';
import CreateExpense from './CreateExpense';
import ExpenseTable from './components/ExpenseTable';
import ExpenseFilters from './components/ExpenseFilters';

export default function Expenses() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [expenses, setExpenses] = useState(expensesData);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const itemsPerPage = 5;

  useEffect(() => {
    // Simulate initial data fetching to show skeleton loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const allCategories = ['All', ...new Set(expenses.map(e => e.category))];

  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      const matchesSearch = expense.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            expense.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' || expense.status === statusFilter;
      const matchesCategory = categoryFilter === 'All' || expense.category === categoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [searchQuery, statusFilter, categoryFilter, expenses]);

  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);
  const paginatedExpenses = useMemo(() => {
    return filteredExpenses.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filteredExpenses, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, categoryFilter]);

  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div className="max-w-7xl mx-auto fade-in">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Expenses</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">Track and manage your company expenditures</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-slate-700 rounded-xl border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md transition-all font-medium text-sm flex-1 sm:flex-none">
            <ArrowDownToLine className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Quick Add Form */}
      <div className="mb-8 relative z-20">
        <CreateExpense 
          isInline={true} 
          onSave={(newExpense) => {
            setExpenses(prev => [newExpense, ...prev]);
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
