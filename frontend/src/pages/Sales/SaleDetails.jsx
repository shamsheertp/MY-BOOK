import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { salesService, uploadService } from '../../services/api';

import { SaleDetailsHeader } from './components/SaleDetailsHeader';
import { PaymentSummary } from './components/PaymentSummary';
import { InvoiceDocument } from './components/InvoiceDocument';
import { ReceivePaymentModal } from './components/ReceivePaymentModal';
import { PinModal } from './components/PinModal';
import { ReceiptModal } from './components/ReceiptModal';
import { ProofModal } from './components/ProofModal';
import { WhatsAppPreviewModal } from './components/WhatsAppPreviewModal';
import { VoidInvoiceModal } from './components/VoidInvoiceModal';
import { FileText, ArrowLeft, RefreshCw } from 'lucide-react';

export default function SaleDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [sale, setSale] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Payment form & modals state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ 
    amount: '', 
    date: new Date().toISOString().split('T')[0], 
    method: 'Bank Transfer', 
    ref: '', 
    image: null 
  });
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pendingVoidId, setPendingVoidId] = useState(null);
  
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);
  const [selectedProof, setSelectedProof] = useState(null);

  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);

  // Void Invoice modal state
  const [isVoidInvoiceModalOpen, setIsVoidInvoiceModalOpen] = useState(false);
  const [isSubmittingVoid, setIsSubmittingVoid] = useState(false);
  const [uploadingPaymentId, setUploadingPaymentId] = useState(null);

  const fetchSaleDetails = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const response = await salesService.getById(id);
      if (response && response.data) {
        setSale(response.data);
      } else if (response) {
        setSale(response);
      }
    } catch (err) {
      console.error('Failed to fetch sale details:', err);
      setErrorMessage(err.message || 'Invoice not found');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchSaleDetails();
    }
  }, [id, fetchSaleDetails]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(Number(amount) || 0);
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto p-8 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-48 mb-6"></div>
        <div className="glass-card h-48 rounded-3xl bg-slate-50 mb-6"></div>
        <div className="glass-card h-96 rounded-3xl bg-slate-50"></div>
      </div>
    );
  }

  if (!sale || errorMessage) {
    return (
      <div className="max-w-5xl mx-auto text-center py-20">
        <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-800">Invoice Not Found</h2>
        <p className="text-slate-500 mt-2">{errorMessage || "The sales invoice you requested doesn't exist."}</p>
        <button 
          onClick={() => navigate('/sales')}
          className="mt-6 px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold transition-colors cursor-pointer"
        >
          Back to Invoices
        </button>
      </div>
    );
  }

  // Derived customer object
  const customer = sale.contact || {
    id: sale.customerId,
    name: sale.customerName,
    company: sale.customerCompany,
    companyName: sale.customerCompany,
    phone: sale.customerPhone,
    email: sale.customerEmail,
    address: sale.customerAddress,
  };

  const paymentsList = sale.payments || [];
  const subtotal = Number(sale.subtotal || 0);
  const discount = Number(sale.discount || 0);
  const tax = Number(sale.tax || 0);
  const total = Number(sale.total || 0);
  const received = Number(sale.received || 0);
  const balance = Number(sale.balance || 0);

  const handlePrint = () => window.print();
  const handlePdf = () => {
    alert('Please select "Save as PDF" in the print dialog.');
    window.print();
  };

  const handleViewReceipt = (payment) => {
    setSelectedReceipt(payment);
    setIsReceiptModalOpen(true);
  };

  const handleViewProof = (payment) => {
    setSelectedProof(payment);
    setIsProofModalOpen(true);
  };

  const handleUploadProof = async (paymentId, file) => {
    if (!file) return;
    setUploadingPaymentId(paymentId);
    try {
      const res = await salesService.uploadPaymentProof(sale.id, paymentId, file);
      const uploadedUrl = res.url || res.data?.image;

      setSale(prev => ({
        ...prev,
        payments: (prev.payments || []).map(p => 
          (p.id === paymentId || p.ref === paymentId) ? { ...p, image: uploadedUrl } : p
        ),
      }));
    } catch (err) {
      alert(err.message || 'Failed to upload proof document to storage');
    } finally {
      setUploadingPaymentId(null);
    }
  };

  const handleVoidPayment = (paymentId) => {
    setPendingVoidId(paymentId);
    setIsPinModalOpen(true);
  };

  const handleVoidConfirm = async (pin) => {
    if (pin === "1234") {
      try {
        const response = await salesService.voidPayment(sale.id, pendingVoidId);
        if (response && response.data) {
          setSale(response.data);
        } else {
          fetchSaleDetails();
        }
        setIsPinModalOpen(false);
        setPendingVoidId(null);
        return null;
      } catch (err) {
        return err.message || 'Failed to void payment';
      }
    } else {
      return "Incorrect PIN. Access Denied.";
    }
  };

  const handleReceivePayment = async () => {
    const amt = parseFloat(paymentForm.amount);
    if (isNaN(amt) || amt <= 0) return;

    setIsSubmittingPayment(true);
    try {
      let uploadedProofUrl = null;
      if (paymentForm.image) {
        try {
          const upRes = await uploadService.uploadFile(paymentForm.image, 'payments');
          uploadedProofUrl = upRes?.data?.url || null;
        } catch (upErr) {
          console.warn('Payment proof upload warning:', upErr);
        }
      }

      const response = await salesService.recordPayment(sale.id, {
        amount: amt,
        date: paymentForm.date,
        method: paymentForm.method,
        ref: paymentForm.ref || undefined,
        image: uploadedProofUrl,
        notes: paymentForm.image ? `Proof: ${paymentForm.image.name}` : undefined,
      });

      if (response && response.data) {
        setSale(response.data);
      } else {
        fetchSaleDetails();
      }

      setIsPaymentModalOpen(false);
      setPaymentForm({ amount: '', date: new Date().toISOString().split('T')[0], method: 'Bank Transfer', ref: '', image: null });
    } catch (err) {
      alert(err.message || 'Failed to record payment');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleVoidInvoice = async (reason) => {
    setIsSubmittingVoid(true);
    try {
      const response = await salesService.void(sale.id, { reason });
      if (response && response.data) {
        setSale(response.data);
      } else {
        await fetchSaleDetails();
      }
      setIsVoidInvoiceModalOpen(false);
    } catch (err) {
      alert(err.message || 'Failed to void invoice');
    } finally {
      setIsSubmittingVoid(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16 print:pb-0 print:m-0 print:space-y-0">
      {/* Back button */}
      <div className="flex items-center justify-between print:hidden">
        <button 
          onClick={() => navigate('/sales')}
          className="flex items-center text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
          Back to Sales Invoices
        </button>

        <button
          type="button"
          onClick={fetchSaleDetails}
          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          title="Refresh invoice"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Main Content Wrapper - Hidden when Receipt Modal is open to prevent overlapping prints */}
      <div className={isReceiptModalOpen ? 'print:hidden' : ''}>
        <SaleDetailsHeader 
          customer={customer}
          sale={sale}
          onPrint={handlePrint} 
          onPdf={handlePdf} 
          onReceivePayment={() => setIsPaymentModalOpen(true)}
          onWhatsApp={() => setIsWhatsAppModalOpen(true)}
          onVoidInvoice={() => setIsVoidInvoiceModalOpen(true)}
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
          uploadingPaymentId={uploadingPaymentId}
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
      </div>

      <ReceivePaymentModal 
        isOpen={isPaymentModalOpen} 
        onClose={() => setIsPaymentModalOpen(false)} 
        balance={balance} 
        paymentForm={paymentForm} 
        setPaymentForm={setPaymentForm} 
        onSave={handleReceivePayment} 
        isSubmitting={isSubmittingPayment}
      />

      <PinModal 
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onConfirm={handleVoidConfirm}
        message="Please enter Admin PIN to void this payment. (Default PIN: 1234)"
      />

      <ReceiptModal 
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        payment={selectedReceipt}
        saleRef={sale.ref}
        customerName={customer.name || customer.contactName}
        customerPhone={customer.phone}
        formatCurrency={formatCurrency}
        balance={balance}
      />

      <ProofModal
        isOpen={isProofModalOpen}
        onClose={() => setIsProofModalOpen(false)}
        payment={selectedProof}
      />

      <WhatsAppPreviewModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        customer={customer}
        sale={sale}
      />

      <VoidInvoiceModal
        isOpen={isVoidInvoiceModalOpen}
        onClose={() => setIsVoidInvoiceModalOpen(false)}
        onConfirm={handleVoidInvoice}
        sale={sale}
        isSubmitting={isSubmittingVoid}
      />
    </div>
  );
}
