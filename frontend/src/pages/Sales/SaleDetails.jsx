import { useState } from 'react';
import { useParams } from 'react-router-dom';
import salesData from '../../db/sales.json';
import contactsData from '../../db/contacts.json';

import { SaleDetailsHeader } from './components/SaleDetailsHeader';
import { PaymentSummary } from './components/PaymentSummary';
import { InvoiceDocument } from './components/InvoiceDocument';
import { ReceivePaymentModal } from './components/ReceivePaymentModal';
import { PinModal } from './components/PinModal';
import { ReceiptModal } from './components/ReceiptModal';
import { ProofModal } from './components/ProofModal';

export default function SaleDetails() {
  const { id } = useParams();

  // Find the sale by its ref (or ID fallback)
  const sale = salesData.find(s => s.ref === id || s.id.toString() === id) || salesData[0];
  
  // Find associated customer
  const customer = contactsData.find(c => c.customerId === sale.customerId) || contactsData[0];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const subtotal = sale.subtotal;
  const discount = sale.discount || 0;
  const tax = sale.tax || 0;
  const total = sale.total;
  
  // State for receive payment
  const [paymentsList, setPaymentsList] = useState(sale.payments || []);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount: '', date: new Date().toISOString().split('T')[0], method: 'Bank Transfer', ref: '', image: null });

  const received = paymentsList.filter(p => !p.voided).reduce((acc, curr) => acc + curr.amount, 0);
  const balance = Math.max(0, total - received);

  const handlePrint = () => window.print();
  const handlePdf = () => {
    alert('Please select "Save as PDF" in the print dialog.');
    window.print();
  };

  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pendingVoidId, setPendingVoidId] = useState(null);
  
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);
  const [selectedProof, setSelectedProof] = useState(null);

  const handleViewReceipt = (payment) => {
    setSelectedReceipt(payment);
    setIsReceiptModalOpen(true);
  };

  const handleViewProof = (payment) => {
    setSelectedProof(payment);
    setIsProofModalOpen(true);
  };

  const handleUploadProof = (paymentId, file) => {
    setPaymentsList(paymentsList.map((p, i) => 
      (p.id === paymentId || i === paymentId) 
        ? { ...p, image: file.name, imagePreview: URL.createObjectURL(file) } 
        : p
    ));
  };

  const handleVoidPayment = (paymentId) => {
    setPendingVoidId(paymentId);
    setIsPinModalOpen(true);
  };

  const handleVoidConfirm = (pin) => {
    if (pin === "1234") {
      setPaymentsList(paymentsList.map((p, i) => 
        (p.id === pendingVoidId || i === pendingVoidId) ? { ...p, voided: true } : p
      ));
      setIsPinModalOpen(false);
      setPendingVoidId(null);
      return null;
    } else {
      return "Incorrect PIN. Access Denied.";
    }
  };

  const handleReceivePayment = () => {
    if (!paymentForm.amount || isNaN(paymentForm.amount)) return;
    const newPayment = {
      date: paymentForm.date,
      ref: paymentForm.ref || `PAY-${Math.floor(Math.random()*1000)}`,
      method: paymentForm.method,
      amount: parseFloat(paymentForm.amount),
      image: paymentForm.image ? paymentForm.image.name : null,
      imagePreview: paymentForm.image ? URL.createObjectURL(paymentForm.image) : null
    };
    setPaymentsList([...paymentsList, newPayment]);
    setIsPaymentModalOpen(false);
    setPaymentForm({ amount: '', date: new Date().toISOString().split('T')[0], method: 'Bank Transfer', ref: '', image: null });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 print:pb-0 print:m-0 print:space-y-0">
      
      <SaleDetailsHeader 
        customerId={customer.id} 
        onPrint={handlePrint} 
        onPdf={handlePdf} 
        onReceivePayment={() => setIsPaymentModalOpen(true)}
        balance={balance}
        status={sale.status}
      />

      <PaymentSummary 
        sale={sale} 
        paymentsList={paymentsList} 
        balance={balance} 
        received={received} 
        total={total} 
        formatCurrency={formatCurrency}
        onVoidPayment={handleVoidPayment}
        onViewReceipt={handleViewReceipt}
        onViewProof={handleViewProof}
        onUploadProof={handleUploadProof}
      />

      <InvoiceDocument 
        sale={sale} 
        customer={customer} 
        subtotal={subtotal} 
        discount={discount} 
        tax={tax} 
        total={total} 
        formatCurrency={formatCurrency} 
      />

      <ReceivePaymentModal 
        isOpen={isPaymentModalOpen} 
        onClose={() => setIsPaymentModalOpen(false)} 
        balance={balance} 
        paymentForm={paymentForm} 
        setPaymentForm={setPaymentForm} 
        onSave={handleReceivePayment} 
      />

      <PinModal 
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onConfirm={handleVoidConfirm}
        message="Please enter Admin PIN to void this payment. (Hint: 1234)"
      />

      <ReceiptModal 
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        payment={selectedReceipt}
        saleRef={sale.ref}
        customerName={customer.name}
        formatCurrency={formatCurrency}
        balance={balance}
      />

      <ProofModal
        isOpen={isProofModalOpen}
        onClose={() => setIsProofModalOpen(false)}
        payment={selectedProof}
      />
    </div>
  );
}
