import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Printer, Download, Plus, Mail, MessageCircle, MoreVertical, Ban, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import domtoimage from 'dom-to-image-more';
import { uploadWhatsAppMedia, sendWhatsAppMessage, openWhatsAppFallback } from '../../../hooks/useWhatsApp';

export function SaleDetailsHeader({ 
  customer, 
  sale, 
  onPrint, 
  onPdf, 
  onReceivePayment, 
  onWhatsApp, 
  onVoidInvoice,
  balance, 
  status 
}) {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const isVoided = status === 'VOID';

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleWhatsAppSend = () => {
    setIsMenuOpen(false);
    if (!customer?.phone) {
      alert("No phone number found for this customer.");
      return;
    }
    if (onWhatsApp) onWhatsApp();
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between print:hidden mb-6">
      <button onClick={() => navigate(-1)} className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back
      </button>
      
      <div className="mt-4 sm:mt-0 flex items-center space-x-3">
        {/* Quick Action Icons */}
        <button onClick={onPrint} className="p-2 text-slate-400 hover:text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm" title="Print Invoice">
          <Printer className="w-5 h-5" />
        </button>
        <button onClick={onPdf} className="p-2 text-slate-400 hover:text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm" title="Download PDF">
          <Download className="w-5 h-5" />
        </button>

        {/* Primary Action */}
        {isVoided ? (
          <div className="flex items-center text-sm font-bold text-rose-600 bg-rose-50 border border-rose-200 px-5 py-2.5 rounded-xl">
            <Ban className="w-4 h-4 mr-1.5" />
            Invoice Voided
          </div>
        ) : status === 'DRAFT' ? (
          <>
            <Link 
              to={`/sales/new?edit=${customer?.id || ''}`}
              className="flex items-center text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 px-5 py-2.5 rounded-xl transition-all shadow-sm mr-3"
            >
              Edit Draft
            </Link>
            <button 
              onClick={() => alert('Invoice issued successfully!')}
              className="flex items-center text-sm font-bold text-white bg-green-600 hover:bg-green-700 px-5 py-2.5 rounded-xl transition-all shadow-sm shadow-green-200"
            >
              Issue Invoice
            </button>
          </>
        ) : (
          <button 
            onClick={onReceivePayment} 
            disabled={balance === 0}
            className={`flex items-center text-sm font-bold text-white px-5 py-2.5 rounded-xl transition-all shadow-sm ${
              balance === 0 
                ? 'bg-slate-300 cursor-not-allowed opacity-80' 
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 cursor-pointer'
            }`}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            {balance === 0 ? 'Fully Paid' : 'Record Payment'}
          </button>
        )}

        {/* More Options Menu */}
        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2.5 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-max min-w-[12rem] bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
              <button 
                onClick={handleWhatsAppSend}
                className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-green-600 flex items-center transition-colors disabled:opacity-50 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 mr-2 shrink-0" />
                <span>
                  WhatsApp PDF ({customer?.phone || 'No Number'})
                </span>
              </button>
              <button 
                onClick={() => { alert('Opening Email composer...'); setIsMenuOpen(false); }}
                className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 flex items-center transition-colors cursor-pointer"
              >
                <Mail className="w-4 h-4 mr-2" />
                Send via Email
              </button>
              <div className="h-px bg-slate-100 my-1"></div>
              {isVoided ? (
                <div className="w-full px-4 py-2 text-xs font-semibold text-slate-400 bg-slate-50 flex items-center space-x-2">
                  <Ban className="w-3.5 h-3.5 text-slate-400" />
                  <span>Invoice is already void</span>
                </div>
              ) : (
                <button 
                  type="button"
                  onClick={() => { 
                    setIsMenuOpen(false);
                    if (onVoidInvoice) onVoidInvoice();
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 flex items-center transition-colors cursor-pointer"
                >
                  <Ban className="w-4 h-4 mr-2 text-rose-500" />
                  Void Invoice
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
