import React from 'react';
import { Bell, FileText, Image as ImageIcon, Save, CheckCircle2 } from 'lucide-react';

export const NotificationPreferences = ({ isConfigured, preferences, onChange, onSave, saved }) => (
  <div className={`glass-card rounded-3xl border border-slate-100 shadow-sm overflow-hidden transition-opacity duration-300 ${!isConfigured ? 'opacity-50 pointer-events-none grayscale-[50%]' : ''}`}>
    <div className="px-6 py-4 border-b border-slate-100 bg-white/50 flex items-center">
      <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mr-3 shadow-sm shadow-blue-100">
        <Bell className="w-4 h-4" />
      </div>
      <div>
        <h2 className="text-sm font-bold text-slate-800">Notification Preferences</h2>
        <p className="text-xs text-slate-500">What to share with your clients on WhatsApp</p>
      </div>
    </div>
    
    <div className="p-6 bg-white/40">
      <div className="space-y-4">
        {[
          { name: 'sendInvoices', label: 'Send Invoices automatically', desc: 'When a sale is made, automatically send the invoice.' },
          { name: 'sendReceipts', label: 'Send Receipts upon payment', desc: 'When a payment is recorded, send a digital receipt.' },
          { name: 'sendReminders', label: 'Payment Reminders', desc: 'Automatically send a gentle reminder 3 days before due.' }
        ].map((item) => (
          <label key={item.name} className="flex items-start gap-3 cursor-pointer p-3 rounded-xl hover:bg-slate-50/80 transition-colors border border-transparent hover:border-slate-100">
            <div className="pt-0.5">
              <input 
                type="checkbox" name={item.name} checked={preferences[item.name]} onChange={onChange}
                className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500" 
              />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">{item.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
            </div>
          </label>
        ))}
      </div>

      <div className="mt-6 pt-6 border-t border-slate-100">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Attachment Settings</h3>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 cursor-pointer bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-colors">
            <input 
              type="checkbox" name="sharePdf" checked={preferences.sharePdf} onChange={onChange}
              className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500" 
            />
            <FileText className="w-4 h-4 text-indigo-500" />
            <span className="text-sm font-semibold text-slate-700">Attach PDF</span>
          </label>
          
          <label className="flex items-center gap-2 cursor-pointer bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-colors">
            <input 
              type="checkbox" name="sharePictures" checked={preferences.sharePictures} onChange={onChange}
              className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500" 
            />
            <ImageIcon className="w-4 h-4 text-indigo-500" />
            <span className="text-sm font-semibold text-slate-700">Attach Pictures</span>
          </label>
        </div>
        <p className="text-xs text-slate-400 mt-3 ml-1">If enabled, the system will send documents like PDFs or images alongside the notification text.</p>
      </div>

      {isConfigured && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={onSave}
            className={`flex items-center text-sm font-semibold text-white px-5 py-2.5 rounded-xl transition-all shadow-sm ${saved ? 'bg-emerald-600 shadow-emerald-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'}`}
          >
            {saved ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            {saved ? 'Saved' : 'Save Preferences'}
          </button>
        </div>
      )}
    </div>
  </div>
);
