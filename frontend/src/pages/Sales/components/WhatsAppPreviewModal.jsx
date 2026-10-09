import { useState } from 'react';
import { X, Send, Loader2, CheckCircle, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import domtoimage from 'dom-to-image-more';
import { uploadWhatsAppMedia, sendWhatsAppMessage, openWhatsAppFallback } from '../../../hooks/useWhatsApp';

export function WhatsAppPreviewModal({ isOpen, onClose, customer, sale }) {
  const [isSending, setIsSending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [additionalText, setAdditionalText] = useState("");

  if (!isOpen) return null;

  const handleSend = async () => {
    const phone = customer?.phone;
    if (!phone) {
      alert("No phone number found for this customer.");
      return;
    }

    setIsSending(true);
    try {
      const element = document.getElementById('invoice-document-capture');
      if (!element) {
        throw new Error("Invoice document element not found.");
      }

      // Capture the element using dom-to-image-more
      const imgData = await domtoimage.toPng(element, {
        quality: 1.0,
        bgcolor: '#ffffff'
      });

      // Create PDF and add image
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (element.clientHeight * pdfWidth) / element.clientWidth;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      const pdfBlob = pdf.output('blob');

      // Upload to WhatsApp
      const filename = `Invoice_${sale.ref}.pdf`;
      const mediaId = await uploadWhatsAppMedia(pdfBlob, filename);

      // Construct message
      const defaultMessage = `Hello ${customer.name}! Here is your invoice ${sale.ref}.`;
      const finalMessage = additionalText.trim() ? `${defaultMessage}\n\n${additionalText}` : defaultMessage;

      // Send message with the uploaded media ID
      await sendWhatsAppMessage(phone, finalMessage, 'document', mediaId, filename);
      
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
        setAdditionalText("");
      }, 2500);

    } catch (error) {
      console.warn("API failed, falling back to wa.me link:", error);
      const fallbackMessage = `Hello ${customer.name}! Here is your invoice link for ${sale.ref}: ${window.location.href}`;
      openWhatsAppFallback(phone, fallbackMessage);
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center space-x-2 text-indigo-600">
            <Send className="w-5 h-5" />
            <h2 className="text-sm font-bold uppercase tracking-wider">Send via WhatsApp</h2>
          </div>
          <button 
            onClick={onClose} 
            disabled={isSending || isSuccess}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center animate-in zoom-in">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Sent Successfully!</h3>
            <p className="text-slate-500">The invoice has been sent to {customer?.name}.</p>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            
            {/* Invoice Preview Mockup */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start space-x-4">
              <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-100 text-red-500">
                <FileText className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-slate-800">Invoice_{sale?.ref}.pdf</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Will be generated from the exact invoice design displayed on the screen.
                </p>
                <div className="mt-3 px-3 py-2 bg-indigo-50 text-indigo-700 text-xs rounded-lg inline-flex items-center">
                  Sending to: <strong className="ml-1">{customer?.phone || 'No phone number'}</strong>
                </div>
              </div>
            </div>

            {/* Additional Text */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">
                Add Note <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea
                value={additionalText}
                onChange={(e) => setAdditionalText(e.target.value)}
                placeholder="Type any additional instructions or thank you note here..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none text-sm"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                disabled={isSending}
                className="flex-1 py-3 px-4 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={isSending || !customer?.phone}
                className="flex-[2] py-3 px-4 bg-green-600 text-white text-sm font-bold rounded-xl shadow-sm shadow-green-200 hover:bg-green-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending PDF...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Invoice
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
