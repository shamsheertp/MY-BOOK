import React from 'react';
import { MessageCircle, Shield, FileText } from 'lucide-react';

export const MessagePreview = React.memo(({ preferences }) => (
  <div className="xl:col-span-1 space-y-6">
    <div className="glass-card rounded-3xl p-5 border border-slate-100 shadow-sm bg-gradient-to-br from-emerald-500 to-teal-600 text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-20">
        <MessageCircle className="w-24 h-24" />
      </div>
      <div className="relative z-10">
        <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
          <Shield className="w-5 h-5" /> Enterprise Security
        </h3>
        <p className="text-sm text-emerald-50 leading-relaxed">
          Your API keys are encrypted and stored securely. We only use them to send transactional messages like invoices and receipts to your clients on your behalf.
        </p>
      </div>
    </div>

    <div className="xl:sticky xl:top-6 space-y-3">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Message Preview</p>
      <div className="bg-[#E5DDD5] rounded-2xl shadow-inner border border-slate-200 overflow-hidden h-[400px] flex flex-col relative">
        <div className="bg-[#075E54] text-white px-4 py-3 flex items-center gap-3 shrink-0 shadow-md z-10">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-sm font-bold">C</span>
          </div>
          <div>
            <p className="text-sm font-semibold">Client Name</p>
            <p className="text-[10px] text-white/80">online</p>
          </div>
        </div>
        
        <div className="absolute inset-0 opacity-10 bg-[url('https://i.pinimg.com/736x/8c/98/99/8c98994518b575bfd8c949e91d20548b.jpg')] bg-repeat z-0" style={{backgroundSize: '300px'}} />

        <div className="flex-1 p-4 overflow-y-auto space-y-4 z-10 custom-scrollbar flex flex-col">
          <div className="bg-[#DCF8C6] p-3 rounded-lg rounded-tr-none self-end max-w-[85%] shadow-sm relative">
            <p className="text-sm text-slate-800">Hello! Here is your invoice INV-2026-042 for $1,250.00.</p>
            <div className="text-[10px] text-emerald-700/60 text-right mt-1 font-medium">10:42 AM</div>
          </div>
          
          {preferences?.sharePdf && (
            <div className="bg-[#DCF8C6] p-2 rounded-lg rounded-tr-none self-end max-w-[85%] shadow-sm relative w-48">
              <div className="bg-black/5 rounded-md p-2 flex items-center gap-3 mb-1">
                <div className="w-8 h-8 bg-rose-500 rounded flex items-center justify-center">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-800 truncate">INV-2026-042.pdf</p>
                  <p className="text-[10px] text-slate-500">1.2 MB</p>
                </div>
              </div>
              <div className="text-[10px] text-emerald-700/60 text-right mt-1 font-medium">10:42 AM</div>
            </div>
          )}
          
          {preferences?.sharePictures && (
            <div className="bg-[#DCF8C6] p-1 rounded-lg rounded-tr-none self-end max-w-[85%] shadow-sm relative w-48">
              <div className="h-32 bg-slate-200 rounded flex items-center justify-center overflow-hidden">
                <img src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=300&h=200" alt="Receipt" className="w-full h-full object-cover" />
              </div>
              <div className="text-[10px] text-emerald-700/60 text-right mt-1 px-1 font-medium pb-0.5">10:43 AM</div>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
));
