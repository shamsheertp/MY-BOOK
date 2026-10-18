import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Outlet, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ErrorBoundary } from './components/Common/ErrorBoundary';
import Layout from './components/Layout/Layout';

// Core routes
const Login = lazy(() => import('./pages/Auth/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard'));

// Lazy-loaded application pages
const UserManagement = lazy(() => import('./pages/Users/UserManagement'));
const Contacts = lazy(() => import('./pages/Contacts/Contacts'));
const ContactProfile = lazy(() => import('./pages/Contacts/ContactProfile'));
const Sales = lazy(() => import('./pages/Sales/Sales'));
const SaleDetails = lazy(() => import('./pages/Sales/SaleDetails'));
const CreateInvoice = lazy(() => import('./pages/Sales/CreateInvoice'));
const Purchases = lazy(() => import('./pages/Purchases/Purchases'));
const PurchaseDetails = lazy(() => import('./pages/Purchases/PurchaseDetails'));
const CreatePurchase = lazy(() => import('./pages/Purchases/CreatePurchase'));
const CreateGRN = lazy(() => import('./pages/Purchases/CreateGRN'));
const GRNDetails = lazy(() => import('./pages/Purchases/GRNDetails'));
const CreatePurchaseBill = lazy(() => import('./pages/Purchases/CreatePurchaseBill'));
const PurchaseBillDetails = lazy(() => import('./pages/Purchases/PurchaseBillDetails'));
const CreatePurchasePayment = lazy(() => import('./pages/Purchases/CreatePurchasePayment'));
const PurchasePaymentDetails = lazy(() => import('./pages/Purchases/PurchasePaymentDetails'));
const CompanyProfile = lazy(() => import('./pages/Settings/CompanyProfile'));
const Expenses = lazy(() => import('./pages/Expenses/Expenses'));
const CreateExpense = lazy(() => import('./pages/Expenses/CreateExpense'));
const ExpenseDetails = lazy(() => import('./pages/Expenses/ExpenseDetails'));
const Journals = lazy(() => import('./pages/Journals/Journals'));
const JournalDetails = lazy(() => import('./pages/Journals/JournalDetails'));
const Ledgers = lazy(() => import('./pages/Ledgers/Ledgers'));
const LedgerDetails = lazy(() => import('./pages/Ledgers/LedgerDetails'));
const Products = lazy(() => import('./pages/Products/Products'));
const ProductDetails = lazy(() => import('./pages/Products/ProductDetails'));
const Reports = lazy(() => import('./pages/Reports/Reports'));
const WhatsAppSettings = lazy(() => import('./pages/Settings/Connect/WhatsApp/WhatsAppSettings'));
const FinancialSettings = lazy(() => import('./pages/Settings/FinancialSettings'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Loading...</span>
      </div>
    </div>
  );
}

function ProtectedAppLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium text-sm">Verifying session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <Layout>
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
    </Layout>
  );
}

function PublicRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Authentication Route */}
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                }
              />

              {/* Protected App Routes with Layout */}
              <Route element={<ProtectedAppLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/users" element={<UserManagement />} />
                <Route path="/contacts" element={<Contacts />} />
                <Route path="/contacts/:id" element={<ContactProfile />} />
                <Route path="/sales" element={<Sales />} />
                <Route path="/sales/new" element={<CreateInvoice />} />
                <Route path="/sales/:id" element={<SaleDetails />} />
                <Route path="/purchases" element={<Purchases />} />
                <Route path="/purchases/new" element={<CreatePurchase />} />
                <Route path="/purchases/:id/edit" element={<CreatePurchase />} />
                <Route path="/purchases/receipts/new" element={<CreateGRN />} />
                <Route path="/purchases/receipts/:id" element={<GRNDetails />} />
                <Route path="/purchases/bills/new" element={<CreatePurchaseBill />} />
                <Route path="/purchases/bills/:id" element={<PurchaseBillDetails />} />
                <Route path="/purchases/payments/new" element={<CreatePurchasePayment />} />
                <Route path="/purchases/payments/:id" element={<PurchasePaymentDetails />} />
                <Route path="/purchases/:id" element={<PurchaseDetails />} />
                <Route path="/expenses" element={<Expenses />} />
                <Route path="/expenses/new" element={<CreateExpense />} />
                <Route path="/expenses/:id" element={<ExpenseDetails />} />
                <Route path="/journal" element={<Journals />} />
                <Route path="/journal/:id" element={<JournalDetails />} />
                <Route path="/ledger" element={<Ledgers />} />
                <Route path="/ledger/:id" element={<LedgerDetails />} />
                <Route path="/ledgers/:id" element={<LedgerDetails />} />
                <Route path="/products" element={<Products />} />
                <Route path="/products/:id" element={<ProductDetails />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<CompanyProfile />} />
                <Route path="/settings/company" element={<CompanyProfile />} />
                <Route path="/settings/users" element={<UserManagement />} />
                <Route path="/settings/finance" element={<FinancialSettings />} />
                <Route path="/settings/financial" element={<FinancialSettings />} />
                <Route path="/settings/connect/whatsapp" element={<WhatsAppSettings />} />
                <Route
                  path="*"
                  element={
                    <div className="text-center py-20">
                      <h2 className="text-2xl font-bold text-slate-800">Under Construction</h2>
                      <p className="text-slate-500 mt-2">This page is part of the specs and will be built soon.</p>
                    </div>
                  }
                />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
