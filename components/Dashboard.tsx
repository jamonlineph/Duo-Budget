
import React, { useState, useMemo } from 'react';
import { Transaction, PartnerSettings, CATEGORIES } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ArrowLeftRight, TrendingUp, Users, Wallet, BarChart3, ChevronDown, Sparkles, UserCircle } from 'lucide-react';

interface DashboardProps {
  transactions: Transaction[];
  settings: PartnerSettings;
}

type TimePeriod = 'Weekly' | 'Monthly';

export const Dashboard: React.FC<DashboardProps> = ({ transactions, settings }) => {
  const [trendPeriod, setTrendPeriod] = useState<TimePeriod>('Weekly');
  const [trendCategory, setTrendCategory] = useState<string>('All');

  const currency = settings.currency;

  const stats = useMemo(() => {
    const totals: Record<string, number> = {
      Partner1: 0,
      Partner2: 0,
      Partner3: 0,
      Shared: 0,
    };
    
    const custom: Record<string, number> = {};

    transactions.forEach(t => {
      const payerKey = t.payer as string;
      if (['Partner1', 'Partner2', 'Partner3', 'Shared'].includes(payerKey)) {
        totals[payerKey] += t.amount;
      } else {
        custom[payerKey] = (custom[payerKey] || 0) + t.amount;
      }
    });

    return { totals, custom };
  }, [transactions]);

  const reconciliationValue = useMemo(() => {
    const p1 = stats.totals.Partner1;
    const p2 = stats.totals.Partner2;
    const p3 = settings.p3Enabled ? stats.totals.Partner3 : null;
    
    const activeValues = [p1, p2];
    if (p3 !== null) activeValues.push(p3);
    
    const max = Math.max(...activeValues);
    const min = Math.min(...activeValues);
    return (max - min).toFixed(2);
  }, [stats.totals, settings.p3Enabled, settings.p3Name]);

  const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#06b6d4', '#8b5cf6'];

  const categoryData = useMemo(() => {
    return Object.entries(
      transactions.reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>)
    ).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  const trendData = useMemo(() => {
    const filtered = trendCategory === 'All' 
      ? transactions 
      : transactions.filter(t => t.category === trendCategory);
    const groups: Record<string, number> = {};
    filtered.forEach(t => {
      const date = new Date(t.date);
      let key = trendPeriod === 'Monthly' 
        ? date.toLocaleString('default', { month: 'short', year: '2-digit' })
        : `W/O ${new Date(date.setDate(date.getDate() - date.getDay())).toLocaleDateString('default', { month: 'short', day: 'numeric' })}`;
      groups[key] = (groups[key] || 0) + t.amount;
    });
    return Object.entries(groups).map(([name, amount]) => ({ name, amount })).reverse();
  }, [transactions, trendPeriod, trendCategory]);

  return (
    <div className="space-y-6 pb-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="glass-card p-6 rounded-[2.5rem] relative overflow-hidden flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-indigo-100/50 rounded-xl text-indigo-600 backdrop-blur-md">
              <Wallet size={20} />
            </div>
            <span className="text-slate-800 font-black tracking-tight">Budget Breakdown</span>
          </div>
          <div className="space-y-4 flex-1">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest block">{settings.p1Name}</span>
                <span className="font-black text-indigo-600 text-xl">{currency}{stats.totals.Partner1.toFixed(2)}</span>
              </div>
              <div className="w-12 h-1 bg-indigo-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: '40%' }} />
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest block">{settings.p2Name}</span>
                <span className="font-black text-pink-500 text-xl">{currency}{stats.totals.Partner2.toFixed(2)}</span>
              </div>
              <div className="w-12 h-1 bg-pink-100 rounded-full overflow-hidden">
                <div className="h-full bg-pink-500 rounded-full" style={{ width: '30%' }} />
              </div>
            </div>
            {settings.p3Enabled && (
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest block">{settings.p3Name}</span>
                  <span className="font-black text-emerald-600 text-xl">{currency}{stats.totals.Partner3.toFixed(2)}</span>
                </div>
                <div className="w-12 h-1 bg-emerald-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '20%' }} />
                </div>
              </div>
            )}
            
            {Object.keys(stats.custom).length > 0 && (
              <div className="pt-3 border-t border-white/20 mt-2">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-2">Other Contributors</span>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(stats.custom).map(([name, amount]) => (
                    <div key={name} className="bg-white/40 px-3 py-1.5 rounded-xl border border-white/50 flex items-center gap-2">
                      <UserCircle size={10} className="text-amber-500" />
                      <span className="text-[10px] font-black text-slate-700">{name}: {currency}{amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="pt-4 border-t border-white/40 mt-auto">
            <div className="flex justify-between items-center">
              <span className="text-slate-800 font-black text-xs uppercase tracking-tight">Shared Pool</span>
              <span className="font-black text-slate-600 text-lg leading-none">{currency}{stats.totals.Shared.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/90 p-6 rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden backdrop-blur-xl border border-white/10 flex flex-col justify-between">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md border border-white/10">
                <ArrowLeftRight size={20} />
              </div>
              <span className="font-black text-white/90 tracking-tight">Reconciliation</span>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={16} className="text-indigo-400" />
                <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Net Imbalance</span>
              </div>
              <h4 className="text-4xl font-black mb-3 tracking-tighter">
                {currency}{reconciliationValue}
              </h4>
              <p className="text-white/50 text-[10px] font-medium leading-relaxed italic">
                *Comparison based on permanent partners only.
              </p>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-white/10 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/30">
            <TrendingUp size={14} />
            <span>Multi-Partner Financial Sync</span>
          </div>
          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-indigo-500/20 rounded-full blur-[60px]" />
          <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/10 rounded-full blur-[40px]" />
        </div>
      </div>

      <div className="glass-card p-6 rounded-[2.5rem]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-100/50 rounded-xl text-slate-600 backdrop-blur-md">
              <BarChart3 size={20} />
            </div>
            <span className="text-slate-800 font-black tracking-tight">Spending Flow</span>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex bg-white/40 p-1 rounded-2xl border border-white/50 backdrop-blur-md">
              {(['Weekly', 'Monthly'] as TimePeriod[]).map(p => (
                <button key={p} onClick={() => setTrendPeriod(p)} className={`px-5 py-2.5 text-[10px] font-black rounded-[1.25rem] transition-all uppercase tracking-widest ${trendPeriod === p ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200' : 'text-slate-400 hover:text-slate-600'}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="h-[280px] w-full">
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="rgba(0,0,0,0.03)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} dy={15} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} />
                <Tooltip cursor={{ fill: 'rgba(99, 102, 241, 0.05)', radius: 10 }} contentStyle={{ borderRadius: '20px', border: 'none', background: 'rgba(15, 23, 42, 0.95)', color: 'white', backdropFilter: 'blur(8px)', padding: '12px 16px', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} formatter={(value: number) => [`${currency}${value.toFixed(2)}`, 'Spend']} />
                <Bar dataKey="amount" fill="#6366f1" radius={[8, 8, 8, 8]} barSize={trendPeriod === 'Weekly' ? 32 : 56} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-300">
              <p className="text-sm font-black uppercase tracking-widest">Awaiting Data Points</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
