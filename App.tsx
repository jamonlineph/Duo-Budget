
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Transaction, PartnerSettings, Payer, CATEGORIES, CURRENCIES } from './types';
import { extractTransactionsFromImage } from './services/geminiService';
import { FileUpload, FileUploadHandle } from './components/FileUpload';
import { Dashboard } from './components/Dashboard';
import { TransactionCard } from './components/TransactionCard';
import { ExportTab } from './components/ExportTab';
import { 
  ReceiptText, 
  Heart, 
  Download, 
  Settings2, 
  X, 
  Sparkles, 
  LayoutDashboard, 
  Plus, 
  Camera, 
  Image as ImageIcon 
} from 'lucide-react';

const App: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'export'>('dashboard');
  const [showSettings, setShowSettings] = useState(false);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  
  const fileUploadRef = useRef<FileUploadHandle>(null);

  const [settings, setSettings] = useState<PartnerSettings>({
    p1Name: 'Partner 1',
    p2Name: 'Partner 2',
    p3Name: 'Partner 3',
    p3Enabled: false,
    currency: '$'
  });

  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterPayer, setFilterPayer] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('duobudget_transactions');
    const savedSettings = localStorage.getItem('duobudget_settings');
    if (saved) setTransactions(JSON.parse(saved));
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setSettings({ 
        ...parsed, 
        currency: parsed.currency || '$',
        p3Enabled: !!parsed.p3Enabled,
        p3Name: parsed.p3Name || 'Partner 3'
      });
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('duobudget_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('duobudget_settings', JSON.stringify(settings));
  }, [settings]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesCategory = filterCategory === 'All' || t.category === filterCategory;
      const matchesPayer = filterPayer === 'All' || t.payer === filterPayer;
      const matchesSearch = t.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesPayer && matchesSearch;
    });
  }, [transactions, filterCategory, filterPayer, searchQuery]);

  const dynamicPayers = useMemo(() => {
    const standard = ['Partner1', 'Partner2', 'Partner3', 'Shared'];
    const set = new Set<string>();
    transactions.forEach(t => {
      if (!standard.includes(t.payer)) {
        set.add(t.payer);
      }
    });
    return Array.from(set);
  }, [transactions]);

  const handleFileUpload = async (base64: string) => {
    setIsLoading(true);
    setIsActionMenuOpen(false);
    try {
      const extracted = await extractTransactionsFromImage(base64);
      const newTransactions: Transaction[] = extracted.map((t) => ({
        id: crypto.randomUUID(),
        date: t.date || new Date().toISOString().split('T')[0],
        description: t.description || 'Unknown Expense',
        amount: t.amount || 0,
        category: t.category || 'Other',
        payer: 'Shared',
        originalImage: base64
      }));
      setTransactions(prev => [...newTransactions, ...prev]);
      setActiveTab('transactions');
    } catch (error) {
      alert("Failed to extract data. Please check the image quality.");
    } finally {
      setIsLoading(false);
    }
  };

  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="min-h-screen flex flex-col relative bg-[#F8FAFC]">
      {/* Invisible handler for file/camera inputs */}
      <FileUpload ref={fileUploadRef} onUpload={handleFileUpload} isLoading={isLoading} />

      <header className="sticky top-0 z-40 px-4 py-4 backdrop-blur-md bg-white/40 border-b border-slate-200/50">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <Heart className="text-white" size={20} fill="currentColor" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none">DuoBudget</h1>
              <div className="flex items-center gap-1 mt-1">
                <Sparkles size={10} className="text-indigo-500" />
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">AI Tracker</span>
              </div>
            </div>
          </div>
          
          <button onClick={() => setShowSettings(true)} className="p-2.5 text-slate-600 hover:text-indigo-600 bg-white border border-slate-200 rounded-xl transition-all shadow-sm">
            <Settings2 size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 pt-8 pb-40">
        {activeTab === 'dashboard' ? (
          <div className="space-y-8 animate-in fade-in duration-500">
            <Dashboard transactions={transactions} settings={settings} />
            {transactions.length === 0 && !isLoading && (
              <div className="glass-card rounded-[3rem] p-12 text-center border-dashed border-2 border-slate-300">
                <Plus className="mx-auto w-12 h-12 text-slate-300 mb-4" />
                <h3 className="text-xl font-black text-slate-800 mb-2">No expenses yet</h3>
                <p className="text-slate-500 font-medium mb-6">Click the Plus button below to scan your first receipt!</p>
              </div>
            )}
          </div>
        ) : activeTab === 'transactions' ? (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col gap-5">
              <h2 className="text-2xl font-black text-slate-800">History</h2>
              <div className="glass-card p-4 rounded-[2rem] space-y-4">
                <input 
                  type="text" 
                  placeholder="Search merchant..." 
                  className="w-full px-5 py-3 bg-white/50 border-slate-200 border rounded-2xl text-sm outline-none font-medium"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="flex gap-2">
                  <select value={filterPayer} onChange={(e) => setFilterPayer(e.target.value)} className="text-[11px] font-black bg-white/50 border-slate-200 rounded-xl px-4 py-2 border outline-none flex-1">
                    <option value="All">All Payers</option>
                    <option value="Partner1">{settings.p1Name}</option>
                    <option value="Partner2">{settings.p2Name}</option>
                    <option value="Shared">Shared</option>
                  </select>
                  <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="text-[11px] font-black bg-white/50 border-slate-200 rounded-xl px-4 py-2 border outline-none flex-1">
                    <option value="All">All Categories</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredTransactions.map(t => (
                <TransactionCard key={t.id} transaction={t} settings={settings} onUpdate={updateTransaction} onDelete={deleteTransaction} />
              ))}
            </div>
          </div>
        ) : (
          <ExportTab transactions={transactions} settings={settings} />
        )}
      </main>

      {/* Action Menu Overlay */}
      {isActionMenuOpen && (
        <div 
          className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsActionMenuOpen(false)}
        >
          <div 
            className="absolute bottom-32 left-1/2 -translate-x-1/2 w-[90%] max-w-sm glass-card rounded-[2.5rem] p-6 shadow-2xl animate-in slide-in-from-bottom-8 duration-300"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest text-center mb-2">New Transaction</h3>
              <button 
                onClick={() => fileUploadRef.current?.openCamera()}
                className="flex items-center gap-4 w-full p-4 bg-indigo-600 text-white rounded-[1.5rem] font-black hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-100"
              >
                <div className="p-3 bg-white/20 rounded-xl"><Camera size={20} /></div>
                <div className="text-left">
                  <div className="text-sm">Scan Receipt</div>
                  <div className="text-[10px] text-white/60 font-medium">Use Camera</div>
                </div>
              </button>
              <button 
                onClick={() => fileUploadRef.current?.openGallery()}
                className="flex items-center gap-4 w-full p-4 bg-white border border-slate-200 text-slate-800 rounded-[1.5rem] font-black hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
              >
                <div className="p-3 bg-slate-100 rounded-xl text-slate-600"><ImageIcon size={20} /></div>
                <div className="text-left">
                  <div className="text-sm">Upload Screenshot</div>
                  <div className="text-[10px] text-slate-400 font-medium">From Gallery</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Progress Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-[100] bg-white/80 backdrop-blur-md flex flex-col items-center justify-center p-8">
          <div className="relative mb-8">
            <div className="w-20 h-20 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
            <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-400" size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 text-center mb-2">AI is working...</h2>
          <p className="text-slate-500 font-medium text-center max-w-xs">Extracting date, merchant, and totals from your image.</p>
        </div>
      )}

      {/* Fixed Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 px-6 pb-8 pt-4 pointer-events-none">
        <div className="max-w-md mx-auto glass-card rounded-[2.5rem] shadow-2xl flex items-center justify-between p-2 pointer-events-auto border-slate-200">
          <button onClick={() => setActiveTab('dashboard')} className={`flex-1 flex flex-col items-center gap-1.5 py-4 rounded-3xl transition-all ${activeTab === 'dashboard' ? 'text-indigo-600 bg-indigo-50/50' : 'text-slate-400 hover:text-slate-600'}`}>
            <LayoutDashboard size={22} />
            <span className="text-[9px] font-black uppercase tracking-widest">Stats</span>
          </button>
          <button onClick={() => setActiveTab('transactions')} className={`flex-1 flex flex-col items-center gap-1.5 py-4 rounded-3xl transition-all ${activeTab === 'transactions' ? 'text-indigo-600 bg-indigo-50/50' : 'text-slate-400 hover:text-slate-600'}`}>
            <ReceiptText size={22} />
            <span className="text-[9px] font-black uppercase tracking-widest">History</span>
          </button>
          
          {/* Main Action Plus Button */}
          <div className="px-4 relative -top-6">
            <button 
              onClick={() => setIsActionMenuOpen(!isActionMenuOpen)}
              className={`w-16 h-16 rounded-full flex items-center justify-center shadow-xl shadow-indigo-200 transition-all active:scale-90 border-4 border-white ${isActionMenuOpen ? 'bg-slate-800 rotate-45' : 'bg-indigo-600 rotate-0'}`}
            >
              <Plus size={32} className="text-white" strokeWidth={3} />
            </button>
          </div>

          <button onClick={() => setActiveTab('export')} className={`flex-1 flex flex-col items-center gap-1.5 py-4 rounded-3xl transition-all ${activeTab === 'export' ? 'text-indigo-600 bg-indigo-50/50' : 'text-slate-400 hover:text-slate-600'}`}>
            <Download size={22} />
            <span className="text-[9px] font-black uppercase tracking-widest">Export</span>
          </button>
          <button onClick={() => setShowSettings(true)} className={`flex-1 flex flex-col items-center gap-1.5 py-4 rounded-3xl transition-all text-slate-400 hover:text-slate-600`}>
            <Settings2 size={22} />
            <span className="text-[9px] font-black uppercase tracking-widest">Setup</span>
          </button>
        </div>
      </nav>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] bg-slate-900/30 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-sm rounded-[3rem] p-8 relative animate-in zoom-in-95 duration-300">
            <button onClick={() => setShowSettings(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full"><X size={20} /></button>
            <h3 className="text-2xl font-black text-slate-800 mb-8">Settings</h3>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Partner 1</label>
                <input type="text" value={settings.p1Name} onChange={(e) => setSettings({...settings, p1Name: e.target.value})} className="w-full px-5 py-4 bg-white/50 border-slate-200 border rounded-2xl outline-none font-bold"/>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Partner 2</label>
                <input type="text" value={settings.p2Name} onChange={(e) => setSettings({...settings, p2Name: e.target.value})} className="w-full px-5 py-4 bg-white/50 border-slate-200 border rounded-2xl outline-none font-bold"/>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">Currency</label>
                <div className="grid grid-cols-4 gap-2">
                  {CURRENCIES.map(curr => (
                    <button key={curr.symbol} onClick={() => setSettings({...settings, currency: curr.symbol})} className={`py-3 text-sm font-black rounded-2xl transition-all border ${settings.currency === curr.symbol ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-white text-slate-600 border-slate-200'}`}>
                      {curr.symbol}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={() => setShowSettings(false)} className="w-full mt-10 py-5 bg-slate-800 text-white rounded-[1.5rem] font-black shadow-lg">Save Settings</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
