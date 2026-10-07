import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard/Dashboard';
import Contacts from './pages/Contacts/Contacts';
import ContactProfile from './pages/Contacts/ContactProfile';
import Sales from './pages/Sales/Sales';
import SaleDetails from './pages/Sales/SaleDetails';
import CreateInvoice from './pages/Sales/CreateInvoice';
import PurchaseDetails from './pages/Purchases/PurchaseDetails';
import CompanyProfile from './pages/Settings/CompanyProfile';

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
          <Route path="/purchases/:id" element={<PurchaseDetails />} />
          <Route path="/settings" element={<CompanyProfile />} />
          <Route path="/settings/company" element={<CompanyProfile />} />
          <Route path="*" element={<div className="text-center py-20"><h2 className="text-2xl font-bold text-slate-800">Under Construction</h2><p className="text-slate-500 mt-2">This page is part of the specs and will be built soon.</p></div>} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App;
