import React, { useState } from 'react';
import { Key, Shield, Trash2, Save, Smartphone, Settings2, Loader2, Send, MessageCircle } from 'lucide-react';

export const SecurityConfig = ({ config, isConfigured, isEditing, onChange, onSave, onEdit, onCancel, onDelete, onTest }) => {
  const [testPhone, setTestPhone] = useState('');
  const [isTesting, setIsTesting] = useState(false);

  const handleTestMessage = async () => {
    if (!testPhone) return alert("Please enter a phone number to test.");
    setIsTesting(true);
    try {
      await onTest(testPhone);
      alert("Test message sent successfully via WhatsApp API!");
      setTestPhone('');
    } catch (error) {
      alert("Error sending test message: " + error.message);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="glass-card rounded-3xl border border-slate-100 shadow-sm overflow-visible relative">
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-emerald-100 rounded-full blur-3xl opacity-50 pointer-events-none" />
      
      {/* Header section of the configuration card */}
      <div className="px-6 py-4 border-b border-slate-100 bg-white/50 flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mr-3 shadow-sm shadow-emerald-100">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">Security & Credentials</h2>
            <p className="text-xs text-slate-500">Manage your WhatsApp Business API access</p>
          </div>
        </div>
        {isConfigured && !isEditing && (
          <button 
            onClick={onEdit}
            className="text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            Edit Keys
          </button>
        )}
      </div>
      
      {/* Configuration Form or Active Status */}
      <div className="p-6 bg-white/40 space-y-5">
        {(!isConfigured || isEditing) ? (
          <>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Access Token / API Key <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input 
                    type="password" name="apiKey" value={config.apiKey} onChange={onChange}
                    placeholder="EAA... or similar token" 
                    className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl bg-white/70 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Phone Number ID <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input 
                      type="text" name="phoneNumberId" value={config.phoneNumberId} onChange={onChange}
                      placeholder="e.g. 10423..." 
                      className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl bg-white/70 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Business Account ID</label>
                  <div className="relative">
                    <Settings2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input 
                      type="text" name="businessAccountId" value={config.businessAccountId} onChange={onChange}
                      placeholder="Optional" 
                      className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl bg-white/70 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={onSave}
                disabled={!config.apiKey || !config.phoneNumberId}
                className="flex items-center text-sm font-semibold text-white px-5 py-2.5 rounded-xl transition-all shadow-sm bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4 mr-2" /> Connect & Save
              </button>
              {isEditing && (
                <button
                  onClick={onCancel}
                  className="text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2.5 rounded-xl transition-all shadow-sm"
                >
                  Cancel
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">WhatsApp API Connected</p>
                  <p className="text-xs text-slate-500">Phone ID: {config.phoneNumberId.replace(/.(?=.{4})/g, '*')}</p>
                </div>
              </div>
              <button
                onClick={onDelete}
                className="flex items-center text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 px-4 py-2 rounded-xl transition-colors shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Disconnect API
              </button>
            </div>
            
            {/* Test Connection Form */}
            <div className="mt-2 p-3 bg-white/60 rounded-xl border border-emerald-100 space-y-3">
              <p className="text-xs font-semibold text-slate-600">Test Connection</p>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input 
                    type="text" value={testPhone} onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="Enter phone with country code" 
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                <button
                  onClick={handleTestMessage}
                  disabled={isTesting || !testPhone}
                  className="flex items-center justify-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-sm disabled:opacity-50 transition-colors"
                >
                  {isTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-1.5" />}
                  {isTesting ? '' : 'Send Test'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
