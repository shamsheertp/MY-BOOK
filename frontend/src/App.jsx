import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard/Dashboard';
import Contacts from './pages/Contacts/Contacts';
import ContactProfile from './pages/Contacts/ContactProfile';
import Sales from './pages/Sales/Sales';
import SaleDetails from './pages/Sales/SaleDetails';
import CreateInvoice from './pages/Sales/CreateInvoice';
import PurchaseDetails from './pages/Purchases/PurchaseDetails';
import Purchases from './pages/Purchases/Purchases';
import CreatePurchase from './pages/Purchases/CreatePurchase';
import CreateGRN from './pages/Purchases/CreateGRN';
import GRNDetails from './pages/Purchases/GRNDetails';
import CreatePurchaseBill from './pages/Purchases/CreatePurchaseBill';
import PurchaseBillDetails from './pages/Purchases/PurchaseBillDetails';
import CreatePurchasePayment from './pages/Purchases/CreatePurchasePayment';
import PurchasePaymentDetails from './pages/Purchases/PurchasePaymentDetails';
import CompanyProfile from './pages/Settings/CompanyProfile';
import Journals from './pages/Journals/Journals';
import JournalDetails from './pages/Journals/JournalDetails';
import Ledgers from './pages/Ledgers/Ledgers';
import LedgerDetails from './pages/Ledgers/LedgerDetails';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/contacts/:id" element={<ContactProfile />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/sales/new" element={<CreateInvoice />} />
          <Route path="/sales/:id" element={<SaleDetails />} />
          <Route path="/purchases" element={<Purchases />} />
          <Route path="/purchases/new" element={<CreatePurchase />} />
          <Route path="/purchases/receipts/new" element={<CreateGRN />} />
          <Route path="/purchases/receipts/:id" element={<GRNDetails />} />
          <Route path="/purchases/bills/new" element={<CreatePurchaseBill />} />
          <Route path="/purchases/bills/:id" element={<PurchaseBillDetails />} />
          <Route path="/purchases/payments/new" element={<CreatePurchasePayment />} />
          <Route path="/purchases/payments/:id" element={<PurchasePaymentDetails />} />
          <Route path="/purchases/:id" element={<PurchaseDetails />} />
          <Route path="/journal" element={<Journals />} />
          <Route path="/journal/:id" element={<JournalDetails />} />
          <Route path="/ledger" element={<Ledgers />} />
          <Route path="/ledgers/:id" element={<LedgerDetails />} />
          <Route path="/settings" element={<CompanyProfile />} />
          <Route path="/settings/company" element={<CompanyProfile />} />
          <Route path="*" element={<div className="text-center py-20"><h2 className="text-2xl font-bold text-slate-800">Under Construction</h2><p className="text-slate-500 mt-2">This page is part of the specs and will be built soon.</p></div>} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App;
