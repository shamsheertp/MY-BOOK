import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Truck, Package,
  ShoppingCart, Receipt, CreditCard, BookOpen,
  FileText, Settings, Menu, X, Bell, User as UserIcon, Search, Building2
} from 'lucide-react';
import { SidebarItem, SidebarSection } from './SidebarItem';
import { GlobalSearch } from './GlobalSearch';
import { useCompanyProfile } from '../../hooks/useCompanyProfile';

export default function Layout({ children }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const company = useCompanyProfile();

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

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
    { type: 'link', to: '/reports', icon: FileText, label: 'Reports', isChild: true },
    { type: 'section', title: 'Settings' },
    { type: 'link', to: '/settings/company', icon: Building2, label: 'Company Profile', isChild: true },
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
                isActive={location.pathname === item.to}
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

            <div className="flex items-center ml-4 space-x-4">
              <button className="p-2 text-slate-400 rounded-full hover:text-slate-500 hover:bg-slate-100 relative">
                <Bell className="w-6 h-6" />
                <span className="absolute top-1.5 right-1.5 block w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
              </button>

              <div className="flex items-center space-x-3 cursor-pointer">
                <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200 overflow-hidden">
                  <UserIcon className="w-5 h-5 text-slate-500" />
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-slate-700">Admin User</p>
                  <p className="text-xs text-slate-500">View Profile ▼</p>
                </div>
              </div>
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
