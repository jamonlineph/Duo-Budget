
import React, { useState } from 'react';
import { Transaction, PartnerSettings } from '../types';
import { Calendar, CheckCircle2, FileText, Download, ListFilter, Sparkles } from 'lucide-react';

interface ExportTabProps {
  transactions: Transaction[];
  settings: PartnerSettings;
}

export const ExportTab: React.FC<ExportTabProps> = ({ transactions, settings }) => {
  const [startDate, setStartDate] = useState<string>(
    new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  const [includeSummary, setIncludeSummary] = useState(true);
  const [columns, setColumns] = useState({
    date: true,
    description: true,
    amount: true,
    category: true,
    payer: true
  });

  const handleExport = () => {
    const filtered = transactions.filter(t => {
      const d = new Date(t.date);
      return d >= new Date(startDate) && d <= new Date(endDate);
    });

    if (filtered.length === 0) {
      alert("No data found for the selected date range.");
      return;
    }

    const headers: string[] = [];
    if (columns.date) headers.push('Date');
    if (columns.description) headers.push('Description');
    if (columns.amount) headers.push(`Amount (${settings.currency})`);
    if (columns.category) headers.push('Category');
    if (columns.payer) headers.push('Payer');

    const rows: any[] = [];
    const payerTotals: Record<string, number> = {};

    filtered.forEach(t => {
      const row: string[] = [];
      const payerName = t.payer === 'Partner1' ? settings.p1Name : 
                        t.payer === 'Partner2' ? settings.p2Name : 
                        t.payer === 'Partner3' ? (settings.p3Name || 'Partner 3') :
                        t.payer === 'Shared' ? 'Shared' : t.payer;

      if (columns.date) row.push(t.date);
      if (columns.description) row.push(`"${t.description.replace(/"/g, '""')}"`);
      if (columns.amount) row.push(t.amount.toFixed(2));
      if (columns.category) row.push(t.category);
      if (columns.payer) row.push(payerName);
      
      rows.push(row.join(','));

      payerTotals[payerName] = (payerTotals[payerName] || 0) + t.amount;
    });

    if (includeSummary) {
      rows.push('', '--- SUMMARY ---');
      Object.entries(payerTotals).forEach(([name, total]) => {
        rows.push(`${name},${total.toFixed(2)}`);
      });
    }

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `duobudget_report_${startDate}_to_${endDate}.csv`;
    link.click();
  };

  const toggleColumn = (col: keyof typeof columns) => {
    setColumns(prev => ({ ...prev, [col]: !prev[col] }));
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">Data Export</h2>
        <p className="text-slate-500 font-medium">Configure your report parameters for external tools.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Date Selection */}
        <div className="glass-card p-6 rounded-[2.5rem] space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-indigo-100 rounded-xl text-indigo-600">
              <Calendar size={20} />
            </div>
            <span className="font-black text-slate-800 uppercase tracking-widest text-[11px]">Date Range</span>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Start Date</label>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-5 py-4 bg-white/50 border-white/60 border rounded-2xl outline-none font-bold text-slate-700 focus:ring-4 focus:ring-indigo-100 transition-all"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">End Date</label>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-5 py-4 bg-white/50 border-white/60 border rounded-2xl outline-none font-bold text-slate-700 focus:ring-4 focus:ring-indigo-100 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Column Selection */}
        <div className="glass-card p-6 rounded-[2.5rem] space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-emerald-100 rounded-xl text-emerald-600">
              <ListFilter size={20} />
            </div>
            <span className="font-black text-slate-800 uppercase tracking-widest text-[11px]">Columns & Data</span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {(Object.keys(columns) as Array<keyof typeof columns>).map(col => (
              <button 
                key={col}
                onClick={() => toggleColumn(col)}
                className={`flex items-center justify-between px-5 py-4 rounded-2xl border transition-all ${
                  columns[col] 
                    ? 'bg-indigo-600/10 border-indigo-200 text-indigo-700 shadow-sm' 
                    : 'bg-white/40 border-white/60 text-slate-400 opacity-60'
                }`}
              >
                <span className="text-xs font-black uppercase tracking-widest">{col}</span>
                <CheckCircle2 size={18} className={columns[col] ? 'text-indigo-600' : 'text-slate-200'} />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-card p-8 rounded-[3rem] flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <div className="p-5 bg-slate-800 text-white rounded-[2rem] shadow-2xl">
            <FileText size={32} />
          </div>
          <div>
            <h4 className="text-xl font-black text-slate-800">CSV Spreadsheet</h4>
            <label className="flex items-center gap-2 mt-2 cursor-pointer group">
              <div className={`w-10 h-6 rounded-full p-1 transition-all ${includeSummary ? 'bg-indigo-600' : 'bg-slate-200'}`} onClick={() => setIncludeSummary(!includeSummary)}>
                <div className={`w-4 h-4 bg-white rounded-full transition-all transform ${includeSummary ? 'translate-x-4' : 'translate-x-0'}`} />
              </div>
              <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Include Summary Totals</span>
            </label>
          </div>
        </div>
        
        <button 
          onClick={handleExport}
          className="w-full md:w-auto flex items-center justify-center gap-3 px-12 py-6 bg-indigo-600 text-white rounded-[2rem] font-black shadow-2xl shadow-indigo-200 hover:scale-105 active:scale-95 transition-all text-sm uppercase tracking-[0.2em]"
        >
          <Download size={20} strokeWidth={3} />
          Generate CSV
        </button>
      </div>
    </div>
  );
};
