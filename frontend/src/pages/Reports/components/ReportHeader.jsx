import { Printer, Download, Share2, FileText } from 'lucide-react';

export function ReportHeader({ title }) {
  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    // In a real app, generate CSV from the active tab's data
    alert('Exporting data to CSV...');
  };

  const handleExportPDF = () => {
    // Typically requires a library like jspdf, using alert for demo
    alert('Generating PDF report...');
  };

  const handleShare = () => {
    alert('Share link generated!');
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">{title}</h1>
        <p className="text-slate-500 mt-2">Generate, view, and export your business analytics.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-semibold transition-all shadow-sm"
        >
          <Printer className="w-4 h-4" />
          <span className="hidden sm:inline">Print</span>
        </button>

        <div className="flex bg-white rounded-xl border border-slate-200 shadow-sm p-1">
          <button 
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-semibold transition-colors"
          >
            <FileText className="w-4 h-4 text-rose-500" />
            PDF
          </button>
          <div className="w-px bg-slate-200 my-2"></div>
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-semibold transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-500" />
            CSV
          </button>
        </div>

        <button 
          onClick={handleShare}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl hover:bg-indigo-100 font-semibold transition-all"
        >
          <Share2 className="w-4 h-4" />
          <span className="hidden sm:inline">Share</span>
        </button>
      </div>
    </div>
  );
}
