import { useState, useRef } from 'react';
import {
  Building2, Mail, Phone, Globe, MapPin, FileText, Landmark, Receipt,
  Upload, Trash2, Save, RotateCcw, CheckCircle2, ImageIcon
} from 'lucide-react';
import {
  getCompanyProfile, saveCompanyProfile, resetCompanyProfile,
  defaultCompanyProfile, formatAddressLines
} from '../../hooks/useCompanyProfile';

function Section({ icon: Icon, title, description, children }) {
  return (
    <div className="glass-card rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 bg-white/50 flex items-center">
        <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mr-3">
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-800">{title}</h2>
          {description && <p className="text-xs text-slate-500">{description}</p>}
        </div>
      </div>
      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white/40">{children}</div>
    </div>
  );
}

function Field({ label, name, value, onChange, placeholder, full, type = 'text', textarea, icon: Icon, required, error }) {
  const base = `w-full ${Icon ? 'pl-10' : 'pl-3'} pr-3 py-2.5 border rounded-xl bg-white/70 text-sm outline-none transition-all focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${error ? 'border-rose-300' : 'border-slate-200'}`;
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <label htmlFor={`cp-${name}`} className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <div className="relative">
        {Icon && <Icon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />}
        {textarea ? (
          <textarea id={`cp-${name}`} name={name} value={value} onChange={onChange} placeholder={placeholder} rows={3} className={`${base} resize-none`} />
        ) : (
          <input id={`cp-${name}`} type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} className={base} />
        )}
      </div>
      {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
    </div>
  );
}

export default function CompanyProfile() {
  const [form, setForm] = useState(getCompanyProfile);
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const fileRef = useRef(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
    setErrors(er => ({ ...er, [name]: undefined }));
    setIsDirty(true);
    setSaved(false);
  };

  const handleLogo = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) {
      setErrors(er => ({ ...er, logo: 'Logo must be under 500 KB' }));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setForm(f => ({ ...f, logo: reader.result }));
      setErrors(er => ({ ...er, logo: undefined }));
      setIsDirty(true);
      setSaved(false);
    };
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const er = {};
    if (!form.companyName.trim()) er.companyName = 'Company name is required';
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) er.email = 'Enter a valid email';
    if (form.gstin && !/^[0-9A-Z]{15}$/i.test(form.gstin)) er.gstin = 'GSTIN must be 15 characters';
    if (form.pan && !/^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(form.pan)) er.pan = 'Invalid PAN format';
    if (form.ifsc && !/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(form.ifsc)) er.ifsc = 'Invalid IFSC code';
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    saveCompanyProfile(form);
    setSaved(true);
    setIsDirty(false);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleReset = () => {
    if (!window.confirm('Reset company profile to default values?')) return;
    resetCompanyProfile();
    setForm(defaultCompanyProfile);
    setErrors({});
    setIsDirty(false);
  };

  const addressLines = formatAddressLines(form);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">Settings</p>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Company Profile</h1>
          <p className="text-sm text-slate-500 mt-1">These details appear on your invoices and payment receipts</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            id="cp-reset-btn"
            onClick={handleReset}
            className="flex items-center text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2.5 rounded-xl transition-all shadow-sm"
          >
            <RotateCcw className="w-4 h-4 mr-2" /> Reset
          </button>
          <button
            id="cp-save-btn"
            onClick={handleSave}
            className={`flex items-center text-sm font-semibold text-white px-5 py-2.5 rounded-xl transition-all shadow-sm ${saved ? 'bg-emerald-600 shadow-emerald-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'}`}
          >
            {saved ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            {saved ? 'Saved' : 'Save Changes'}
          </button>
        </div>
      </div>

      {isDirty && (
        <div className="px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm">
          You have unsaved changes.
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Form */}
        <div className="xl:col-span-2 space-y-6">
          <Section icon={Building2} title="Business Identity" description="Logo, name and tagline">
            <div className="sm:col-span-2 flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                {form.logo ? (
                  <img src={form.logo} alt="Company logo" className="w-full h-full object-contain" />
                ) : (
                  <ImageIcon className="w-7 h-7 text-slate-300" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">Company Logo</p>
                <p className="text-xs text-slate-500 mb-2">PNG or JPG, max 500 KB</p>
                <div className="flex gap-2">
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleLogo} className="hidden" id="cp-logo-input" />
                  <button onClick={() => fileRef.current?.click()} className="flex items-center text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors">
                    <Upload className="w-3.5 h-3.5 mr-1.5" /> Upload
                  </button>
                  {form.logo && (
                    <button onClick={() => { setForm(f => ({ ...f, logo: '' })); setIsDirty(true); }} className="flex items-center text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition-colors">
                      <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Remove
                    </button>
                  )}
                </div>
                {errors.logo && <p className="text-xs text-rose-500 mt-1">{errors.logo}</p>}
              </div>
            </div>
            <Field label="Company Name" name="companyName" value={form.companyName} onChange={handleChange} required error={errors.companyName} icon={Building2} />
            <Field label="Tagline" name="tagline" value={form.tagline} onChange={handleChange} placeholder="Optional" />
          </Section>

          <Section icon={Phone} title="Contact Details">
            <Field label="Email" name="email" type="email" value={form.email} onChange={handleChange} icon={Mail} error={errors.email} />
            <Field label="Phone" name="phone" value={form.phone} onChange={handleChange} icon={Phone} />
            <Field label="Website" name="website" value={form.website} onChange={handleChange} icon={Globe} full />
          </Section>

          <Section icon={MapPin} title="Business Address">
            <Field label="Address Line 1" name="addressLine1" value={form.addressLine1} onChange={handleChange} full />
            <Field label="Address Line 2" name="addressLine2" value={form.addressLine2} onChange={handleChange} full />
            <Field label="City" name="city" value={form.city} onChange={handleChange} />
            <Field label="State" name="state" value={form.state} onChange={handleChange} />
            <Field label="Pincode" name="pincode" value={form.pincode} onChange={handleChange} />
            <Field label="Country" name="country" value={form.country} onChange={handleChange} />
          </Section>

          <Section icon={FileText} title="Tax & Legal">
            <Field label="GSTIN" name="gstin" value={form.gstin} onChange={handleChange} error={errors.gstin} placeholder="15-character GSTIN" />
            <Field label="PAN" name="pan" value={form.pan} onChange={handleChange} error={errors.pan} />
          </Section>

          <Section icon={Landmark} title="Bank Details" description="Shown on invoices for customer payments">
            <Field label="Bank Name" name="bankName" value={form.bankName} onChange={handleChange} />
            <Field label="Account Holder" name="accountHolder" value={form.accountHolder} onChange={handleChange} />
            <Field label="Account Number" name="accountNumber" value={form.accountNumber} onChange={handleChange} />
            <Field label="IFSC Code" name="ifsc" value={form.ifsc} onChange={handleChange} error={errors.ifsc} />
            <Field label="UPI ID" name="upiId" value={form.upiId} onChange={handleChange} full />
            <label className="sm:col-span-2 flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" name="showBankOnInvoice" checked={form.showBankOnInvoice} onChange={handleChange} className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500" />
              <span className="text-sm text-slate-600">Show bank details on invoices</span>
            </label>
          </Section>

          <Section icon={Receipt} title="Invoice & Receipt Settings">
            <Field label="Terms & Conditions" name="invoiceTerms" value={form.invoiceTerms} onChange={handleChange} textarea full />
            <Field label="Footer Note" name="footerNote" value={form.footerNote} onChange={handleChange} placeholder="e.g. Thank you for your business!" />
            <Field label="Signatory Name" name="signatoryName" value={form.signatoryName} onChange={handleChange} />
          </Section>
        </div>

        {/* Live Preview */}
        <div className="xl:col-span-1">
          <div className="xl:sticky xl:top-6 space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Live Invoice Header Preview</p>
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
              <div className="p-6 bg-slate-50/60 border-b border-slate-100">
                <div className="flex items-center gap-3 mb-3">
                  {form.logo ? (
                    <img src={form.logo} alt="" className="w-10 h-10 object-contain rounded-lg" />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                      <span className="text-white font-bold text-lg">{(form.companyName || 'C')[0].toUpperCase()}</span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-lg font-bold text-slate-900 truncate">{form.companyName || 'Company Name'}</p>
                    {form.tagline && <p className="text-[11px] text-slate-500 truncate">{form.tagline}</p>}
                  </div>
                </div>
                <div className="text-xs text-slate-500 space-y-0.5">
                  {addressLines.map((l, i) => <p key={i}>{l}</p>)}
                  {form.gstin && <p className="font-semibold text-slate-600 pt-1">GSTIN: {form.gstin.toUpperCase()}</p>}
                  {form.email && <p>{form.email}</p>}
                  {form.phone && <p>{form.phone}</p>}
                </div>
              </div>
              {form.showBankOnInvoice && form.bankName && (
                <div className="p-6 border-b border-slate-100 text-xs text-slate-600 space-y-0.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Bank Details</p>
                  <p><span className="text-slate-400">Bank:</span> {form.bankName}</p>
                  <p><span className="text-slate-400">A/C:</span> {form.accountNumber}</p>
                  <p><span className="text-slate-400">IFSC:</span> {form.ifsc?.toUpperCase()}</p>
                  {form.upiId && <p><span className="text-slate-400">UPI:</span> {form.upiId}</p>}
                </div>
              )}
              <div className="p-6 text-center text-xs text-slate-500 italic">{form.footerNote}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
