import React from 'react';

export const WhatsAppHeader = React.memo(({ isConfigured }) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div>
      <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">Connect / Integration</p>
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">WhatsApp API</h1>
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${isConfigured ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
          {isConfigured ? 'Active' : 'Not Connected'}
        </span>
      </div>
      <p className="text-sm text-slate-500 mt-1">
        Connect your WhatsApp Business API to send invoices, receipts, and notifications to clients automatically.
      </p>
    </div>
  </div>
));
