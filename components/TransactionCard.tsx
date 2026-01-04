
import React, { useState } from 'react';
import { Transaction, PartnerSettings, CATEGORIES } from '../types';
import { User, Users, Calendar, Tag, Trash2, ChevronDown, UserPlus, Check, X } from 'lucide-react';

interface TransactionCardProps {
  transaction: Transaction;
  settings: PartnerSettings;
  onUpdate: (id: string, updates: Partial<Transaction>) => void;
  onDelete: (id: string) => void;
}

export const TransactionCard: React.FC<TransactionCardProps> = ({ transaction, settings, onUpdate, onDelete }) => {
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customName, setCustomName] = useState('');
  const currency = settings.currency;

  const isStandard = ['Partner1', 'Partner2', 'Partner3', 'Shared'].includes(transaction.payer);
  
  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customName.trim()) {
      onUpdate(transaction.id, { payer: customName.trim() });
      setIsCustomMode(false);
    }
  };

  const getPayerColor = (payer: string) => {
    if (payer === 'Partner1') return 'bg-indigo-500/60';
    if (payer === 'Partner2') return 'bg-pink-500/60';
    if (payer === 'Partner3') return 'bg-emerald-500/60';
    if (payer === 'Shared') return 'bg-slate-500/60';
    return 'bg-amber-500/60';
  };

  return (
    <div className="glass-card rounded-[2rem] p-5 hover:scale-[1.02] transition-all duration-300 group relative">
      <div className={`absolute left-4 top-1/2 -translate-y-1/2 w-1.5 h-12 rounded-full blur-[1px] ${getPayerColor(transaction.payer)}`} />

      <div className="flex justify-between items-start mb-6 pl-6">
        <div className="flex-1 min-w-0 pr-4">
          <h4 className="font-black text-slate-800 truncate text-lg tracking-tight">
            {transaction.description}
          </h4>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="flex items-center gap-1.5 text-[9px] font-black text-slate-500 bg-white/40 px-3 py-1.5 rounded-full border border-white uppercase tracking-widest">
              <Calendar size={10} strokeWidth={3} />
              {transaction.date}
            </span>
            <div className="relative group/category">
              <span className="flex items-center gap-1.5 text-[9px] font-black text-indigo-600 bg-indigo-50/50 px-3 py-1.5 rounded-full border border-indigo-100 uppercase tracking-widest cursor-pointer hover:bg-indigo-100 transition-all">
                <Tag size={10} strokeWidth={3} />
                {transaction.category}
                <ChevronDown size={10} strokeWidth={3} />
              </span>
              <div className="absolute top-full left-0 mt-2 bg-slate-900/95 backdrop-blur-xl shadow-2xl rounded-[1.5rem] py-3 hidden group-hover/category:block z-20 w-44 border border-white/10 animate-in fade-in slide-in-from-top-2 duration-200">
                {CATEGORIES.map(cat => (
                  <button key={cat} onClick={() => onUpdate(transaction.id, { category: cat })} className="w-full text-left px-5 py-2 text-[10px] font-black text-white/70 hover:text-white hover:bg-white/10 transition-all uppercase tracking-widest">
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            {!isStandard && (
              <span className="text-[9px] font-black text-amber-600 bg-amber-50/50 px-3 py-1.5 rounded-full border border-amber-100 uppercase tracking-widest">
                Paid by: {transaction.payer}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end shrink-0">
          <span className="text-xl font-black text-slate-900 tracking-tighter">{currency}{transaction.amount.toFixed(2)}</span>
          <button onClick={() => onDelete(transaction.id)} className="mt-3 p-2 bg-rose-50/50 text-rose-400 hover:text-rose-600 hover:bg-rose-100 rounded-xl transition-all border border-rose-100/50 sm:opacity-0 sm:group-hover:opacity-100">
            <Trash2 size={14} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className={`grid gap-3 ${settings.p3Enabled ? 'grid-cols-4' : 'grid-cols-3'}`}>
          <button onClick={() => onUpdate(transaction.id, { payer: 'Partner1' })} className={`flex flex-col items-center gap-1.5 py-3 rounded-[1.25rem] text-[8px] font-black uppercase tracking-[0.1em] transition-all border ${transaction.payer === 'Partner1' ? 'bg-indigo-600 text-white border-indigo-500 shadow-xl shadow-indigo-100' : 'bg-white/40 text-slate-400 border-white/50 hover:bg-white/60'}`}>
            <User size={12} strokeWidth={3} />
            {settings.p1Name.split(' ')[0]}
          </button>
          
          <button onClick={() => onUpdate(transaction.id, { payer: 'Shared' })} className={`flex flex-col items-center gap-1.5 py-3 rounded-[1.25rem] text-[8px] font-black uppercase tracking-[0.1em] transition-all border ${transaction.payer === 'Shared' ? 'bg-slate-700 text-white border-slate-600 shadow-xl shadow-slate-100' : 'bg-white/40 text-slate-400 border-white/50 hover:bg-white/60'}`}>
            <Users size={12} strokeWidth={3} />
            Split
          </button>

          <button onClick={() => onUpdate(transaction.id, { payer: 'Partner2' })} className={`flex flex-col items-center gap-1.5 py-3 rounded-[1.25rem] text-[8px] font-black uppercase tracking-[0.1em] transition-all border ${transaction.payer === 'Partner2' ? 'bg-pink-500 text-white border-pink-500 shadow-xl shadow-pink-100' : 'bg-white/40 text-slate-400 border-white/50 hover:bg-white/60'}`}>
            <User size={12} strokeWidth={3} />
            {settings.p2Name.split(' ')[0]}
          </button>

          {settings.p3Enabled && (
            <button onClick={() => onUpdate(transaction.id, { payer: 'Partner3' })} className={`flex flex-col items-center gap-1.5 py-3 rounded-[1.25rem] text-[8px] font-black uppercase tracking-[0.1em] transition-all border ${transaction.payer === 'Partner3' ? 'bg-emerald-600 text-white border-emerald-500 shadow-xl shadow-emerald-100' : 'bg-white/40 text-slate-400 border-white/50 hover:bg-white/60'}`}>
              <User size={12} strokeWidth={3} />
              {settings.p3Name?.split(' ')[0] || 'P3'}
            </button>
          )}
        </div>

        {isCustomMode ? (
          <form onSubmit={handleCustomSubmit} className="flex gap-2 animate-in slide-in-from-top-2 duration-300">
            <input 
              autoFocus
              type="text" 
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Enter name..."
              className="flex-1 px-4 py-2 bg-white/60 border-white/80 border rounded-xl outline-none text-[10px] font-black uppercase tracking-widest text-slate-700"
            />
            <button type="submit" className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg">
              <Check size={14} />
            </button>
            <button type="button" onClick={() => setIsCustomMode(false)} className="p-2 bg-slate-200 text-slate-600 rounded-xl">
              <X size={14} />
            </button>
          </form>
        ) : (
          <button 
            onClick={() => setIsCustomMode(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-slate-300 text-[9px] font-black text-slate-400 uppercase tracking-widest hover:border-slate-400 hover:text-slate-500 transition-all bg-white/20"
          >
            <UserPlus size={12} />
            Add Custom Payer
          </button>
        )}
      </div>
    </div>
  );
};
