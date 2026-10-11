import { useState, useRef, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Truck, Package,
  ShoppingCart, Receipt, CreditCard, BookOpen, Book,
  FileText, Settings, Menu, X, Bell, User as UserIcon, Search, Building2, MessageCircle,
  Shield, LogOut, LogIn
} from 'lucide-react';
import { SidebarItem, SidebarSection } from './SidebarItem';
import { GlobalSearch } from './GlobalSearch';
import BackendStatusBadge from '../BackendStatusBadge';
import { useCompanyProfile } from '../../hooks/useCompanyProfile';
import { useAuth } from '../../context/AuthContext';

export default function Layout({ children }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const company = useCompanyProfile();
  const { user, isAuthenticated, logout } = useAuth();

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
    }
    if (isProfileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileDropdownOpen]);

  const navigation = [
    { type: 'link', to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { type: 'section', title: 'Entities' },
    { type: 'link', to: '/contacts', icon: Users, label: 'Contacts' },
    { type: 'link', to: '/products', icon: Package, label: 'Products' },
    { type: 'section', title: 'Transactions' },
    { type: 'link', to: '/sales', icon: ShoppingCart, label: 'Sales', isChild: true },
    { type: 'link', to: '/purchases', icon: Receipt, label: 'Purchases', isChild: true },
    { type: 'link', to: '/expenses', icon: CreditCard, label: 'Expenses', isChild: true },
    { type: 'section', title: 'Accounting & Reports' },
    { type: 'link', to: '/journal', icon: BookOpen, label: 'Journal', isChild: true },
    { type: 'link', to: '/ledger', icon: Book, label: 'General Ledger', isChild: true },
    { type: 'link', to: '/reports', icon: FileText, label: 'Reports', isChild: true },
    { type: 'section', title: 'Settings' },
    { type: 'link', to: '/settings/users', icon: Shield, label: 'User Management', isChild: true },
    { type: 'link', to: '/settings/company', icon: Building2, label: 'Company Profile', isChild: true },
    { type: 'link', to: '/settings/connect/whatsapp', icon: MessageCircle, label: 'WhatsApp Connect', isChild: true },
  ];

  return (
    <div className="flex h-screen bg-transparent overflow-hidden font-sans">
      {/* Mobile sidebar overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-20 bg-slate-900/40 lg:hidden backdrop-blur-md transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 glass-panel transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto print:hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-white/40">
          <div className="flex items-center space-x-3">
            {company.logo ? (
              <img src={company.logo} alt={company.companyName} className="w-9 h-9 rounded-xl object-contain bg-white shadow" />
            ) : (
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <span className="text-white font-bold text-lg">{(company.companyName || 'M')[0].toUpperCase()}</span>
              </div>
            )}
            <span className="text-xl font-bold animated-gradient-text tracking-tight truncate max-w-[140px]">{company.companyName || 'My Book'}</span>
          </div>
          <button onClick={toggleMobileMenu} className="lg:hidden text-slate-500 hover:text-slate-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="p-4 h-[calc(100vh-4rem)] overflow-y-auto custom-scrollbar">
          {navigation.map((item, index) =>
            item.type === 'section' ? (
              <SidebarSection key={index} title={item.title} />
            ) : (
              <SidebarItem
                key={index}
                icon={item.icon}
                label={item.label}
                to={item.to}
                isChild={item.isChild}
                isActive={item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to)}
              />
            )
          )}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10 print:overflow-visible">
        {/* Top Header */}
        <header className="relative z-40 flex items-center justify-between h-16 px-4 glass-panel border-b border-white/40 sm:px-6 lg:px-8 print:hidden">
          <button
            onClick={toggleMobileMenu}
            className="p-2 text-slate-500 rounded-md lg:hidden hover:bg-slate-100/50 focus:outline-none"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex items-center max-w-md">
              <GlobalSearch />
            </div>

            <div className="flex items-center ml-4 space-x-3 sm:space-x-4">
              <BackendStatusBadge />

              <button className="p-2 text-slate-400 rounded-full hover:text-slate-500 hover:bg-slate-100 relative">
                <Bell className="w-6 h-6" />
                <span className="absolute top-1.5 right-1.5 block w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
              </button>

              {/* User Profile / Auth State */}
              {isAuthenticated && user ? (
                <div className="relative" ref={profileDropdownRef}>
                  <button
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    className="flex items-center space-x-3 cursor-pointer p-1 rounded-xl hover:bg-slate-100/60 transition-colors"
                  >
                    <div className="w-9 h-9 bg-gradient-to-tr from-indigo-600 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm overflow-hidden">
                      {(user.name || 'U')[0].toUpperCase()}
                    </div>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-semibold text-slate-700 leading-tight truncate max-w-[120px]">
                        {user.name}
                      </p>
                      <p className="text-[11px] text-indigo-600 font-medium">
                        {user.role} ▼
                      </p>
                    </div>
                  </button>

                  {/* Dropdown Menu */}
                  {isProfileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200/80 p-2 z-50 animate-in fade-in zoom-in-95">
                      <div className="p-2.5 border-b border-slate-100">
                        <p className="text-xs font-semibold text-slate-800">{user.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                        <span className="inline-block mt-1 text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-semibold border border-indigo-100">
                          {user.role}
                        </span>
                      </div>

                      <div className="py-1">
                        <Link
                          to="/settings/users"
                          onClick={() => setIsProfileDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-colors"
                        >
                          <Shield className="w-4 h-4" />
                          <span>User Management</span>
                        </Link>
                      </div>

                      <div className="pt-1 border-t border-slate-100">
                        <button
                          onClick={async () => {
                            setIsProfileDropdownOpen(false);
                            await logout();
                            navigate('/login');
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-2 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </Link>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto custom-scrollbar print:overflow-visible">
          <div className="max-w-8xl mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 print:p-0 print:m-0 print:animate-none">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
