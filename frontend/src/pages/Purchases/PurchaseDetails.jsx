import { useState } from 'react';
import { useParams } from 'react-router-dom';
import purchasesData from '../../db/purchases.json';
import contactsData from '../../db/contacts.json';

import { PurchaseDetailsHeader } from './components/PurchaseDetailsHeader';
import { PaymentOutSummary } from './components/PaymentOutSummary';
import { PurchaseDocument } from './components/PurchaseDocument';
import { MakePaymentModal } from './components/MakePaymentModal';

export default function PurchaseDetails() {
  const { id } = useParams();

  // Find the purchase by its ref (or ID fallback)
  const purchase = purchasesData.find(p => p.ref === id || p.id.toString() === id) || purchasesData[0];
  
  // Find associated supplier
  const supplier = contactsData.find(s => s.supplierId === purchase.supplierId) || contactsData[0];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const subtotal = purchase.total; // simplifying for mock data
  const discount = 0;
  const tax = 0;
  const total = purchase.total;
  
  // State for making payments
  const [paymentsList, setPaymentsList] = useState(purchase.payments || []);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount: '', date: new Date().toISOString().split('T')[0], method: 'Bank Transfer', ref: '', image: null });

  const paidOut = purchase.paid + paymentsList.reduce((acc, curr) => acc + curr.amount, 0);
  const balance = Math.max(0, total - paidOut);

  const handlePrint = () => window.print();
  const handlePdf = () => {
    alert('Please select "Save as PDF" in the print dialog.');
    window.print();
  };

  const handleMakePayment = () => {
    if (!paymentForm.amount || isNaN(paymentForm.amount)) return;
    const newPayment = {
      date: paymentForm.date,
      ref: paymentForm.ref || `PAYOUT-${Math.floor(Math.random()*1000)}`,
      method: paymentForm.method,
      amount: parseFloat(paymentForm.amount),
      image: paymentForm.image ? paymentForm.image.name : null
    };
    setPaymentsList([...paymentsList, newPayment]);
    setIsPaymentModalOpen(false);
    setPaymentForm({ amount: '', date: new Date().toISOString().split('T')[0], method: 'Bank Transfer', ref: '', image: null });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 print:pb-0 print:m-0 print:space-y-0 fade-in px-4 sm:px-0">
      
      <PurchaseDetailsHeader 
        supplierId={supplier.id} 
        onPrint={handlePrint} 
        onPdf={handlePdf} 
        onMakePayment={() => setIsPaymentModalOpen(true)} 
      />

      <PaymentOutSummary 
        purchase={purchase} 
        paymentsList={paymentsList} 
        balance={balance} 
        paid={paidOut} 
        total={total} 
        formatCurrency={formatCurrency} 
      />

      <PurchaseDocument 
        purchase={purchase} 
        supplier={supplier} 
        subtotal={subtotal} 
        discount={discount} 
        tax={tax} 
        total={total} 
        formatCurrency={formatCurrency} 
      />

      <MakePaymentModal 
        isOpen={isPaymentModalOpen} 
        onClose={() => setIsPaymentModalOpen(false)} 
        balance={balance} 
        paymentForm={paymentForm} 
        setPaymentForm={setPaymentForm} 
        onSave={handleMakePayment} 
      />

    </div>
  );
}
