import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Transaction, PartnerSettings, CATEGORIES, CURRENCIES } from './types';
import { extractTransactionsFromImage } from './services/geminiService';
import { FileUpload, FileUploadHandle } from './components/FileUpload';
import { Dashboard } from './components/Dashboard';
import { TransactionCard } from './components/TransactionCard';
import { ExportTab } from './components/ExportTab';
import { auth, db, loginWithGoogle, logoutUser, isFirebaseEnabled } from './services/firebase';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  setDoc,
  getDoc
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
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
  Image as ImageIcon,
  LogOut,
  CloudCheck,
  CloudOff,
  WifiOff,
  AlertCircle
} from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'export'>('dashboard');
  const [showSettings, setShowSettings] = useState(false);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const fileUploadRef = useRef<FileUploadHandle>(null);

  const [settings, setSettings] = useState<PartnerSettings>({
    p1Name: 'Partner A',
    p2Name: 'Partner B',
    p3Enabled: false,
    currency: '$'
  });

  // Init Auth
  useEffect(() => {
    if (isFirebaseEnabled && auth) {
      const unsubscribe = onAuthStateChanged(auth, (u) => {
        setUser(u);
        setAuthLoading(false);
      });
      return () => unsubscribe();
    } else {
      const local = localStorage.getItem('duo_local_user');
      if (local) setUser(JSON.parse(local));
      setAuthLoading(false);
    }
  }, []);

  // Sync Logic
  useEffect(() => {
    if (!user) return;

    if (isFirebaseEnabled && db) {
      // Cloud Settings
      const settingsRef = doc(db, 'users', user.uid, 'config', 'settings');
      getDoc(settingsRef).then(snap => {
        if (snap.exists()) setSettings(snap.data() as PartnerSettings);
      });

      // Cloud Transactions
      setIsSyncing(true);
      const q = query(collection(db, 'users', user.uid, 'transactions'), orderBy('date', 'desc'));
      const unsub = onSnapshot(q, (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Transaction[];
        setTransactions(data);
        setIsSyncing(false);
      });
      return () => unsub();
    } else {
      // Local Mode
      const storedTrans = localStorage.getItem(`duo_trans_${user.uid}`);
      if (storedTrans) setTransactions(JSON.parse(storedTrans));
      const storedSets = localStorage.getItem(`duo_settings_${user.uid}`);
      if (storedSets) setSettings(JSON.parse(storedSets));
    }
  }, [user]);

  // Persist Local data
  useEffect(() => {
    if (user && !isFirebaseEnabled) {
      localStorage.setItem(`duo_trans_${user.uid}`, JSON.stringify(transactions));
      localStorage.setItem(`duo_settings_${user.uid}`, JSON.stringify(settings));
    }
  }, [transactions, settings, user]);

  const handleFileUpload = async (base64: string) => {
    if (!user) return;
    setIsLoading(true);
    setIsActionMenuOpen(false);
    try {
      const extracted = await extractTransactionsFromImage(base64);
      for (const t of extracted) {
        const newTrans = {
          date: t.date || new Date().toISOString().split('T')[0],
          description: t.description || 'Unknown Item',
          amount: t.amount || 0,
          category: t.category || 'Other',
          payer: 'Shared',
          originalImage: base64
        };

        if (isFirebaseEnabled && db) {
          await addDoc(collection(db, 'users', user.uid, 'transactions'), newTrans);
        } else {
          setTransactions(prev => [{ ...newTrans, id: Date.now().toString() + Math.random() } as Transaction, ...prev]);
        }
      }
    } catch (error) {
      console.error("Error processing receipt:", error);
      alert("Could not extract data from receipt.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTransaction = async (id: string, updates: Partial<Transaction>) => {
    if (!user) return;
    if (isFirebaseEnabled && db) {
      await updateDoc(doc(db, 'users', user.uid, 'transactions', id), updates);
    } else {
      setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!user) return;
    if (confirm('Are you sure you want to delete this transaction?')) {
      if (isFirebaseEnabled && db) {
        await deleteDoc(doc(db, 'users', user.uid, 'transactions', id));
      } else {
        setTransactions(prev => prev.filter(t => t.id !== id));
      }
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (isFirebaseEnabled && db) {
      await setDoc(doc(db, 'users', user.uid, 'config', 'settings'), settings);
    } else {
      // Local state already updated
    }
    setShowSettings(false);
  };

  if (authLoading) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(79,70,229,0.15),transparent_50%)]" />
        <div className="z-10 text-center space-y-8 max-w-md w-full glass-card p-8 rounded-[3rem]">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-tr from-indigo-500 to-pink-500 rounded-3xl flex items-center justify-center shadow-2xl rotate-3">
              <Heart className="text-white w-10 h-10 fill-white/20" />
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tighter mb-2">DuoBudget</h1>
            <p className="text-slate-500 font-medium">Financial harmony for couples.</p>
          </div>
          
          <button 
            onClick={loginWithGoogle}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
          >
            <Sparkles size={20} className="text-amber-400" />
            Continue with Google
          </button>
          
          {!isFirebaseEnabled && (
            <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-100 flex items-center gap-2">
              <AlertCircle size={14} />
              Demo Mode: Data saved locally to device.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F8FC] pb-24 sm:pb-0">
      <div className="max-w-4xl mx-auto min-h-screen flex flex-col">
        {/* Header */}
        <header className="px-6 py-6 flex justify-between items-center sticky top-0 z-30 bg-[#F6F8FC]/80 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <Heart size={20} className="text-white fill-white/20" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-800 leading-none tracking-tight">DuoBudget</h1>
              <div className="flex items-center gap-1.5 mt-1">
                {isFirebaseEnabled ? (
                  isSyncing ? (
                    <span className="flex items-center gap-1 text-[9px] font-black text-indigo-500 uppercase tracking-widest">
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping" />
                      Syncing...
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                      <CloudCheck size={10} />
                      Cloud Active
                    </span>
                  )
                ) : (
                  <span className="flex items-center gap-1 text-[9px] font-black text-amber-500 uppercase tracking-widest">
                    <CloudOff size={10} />
                    Local Mode
                  </span>
                )}
              </div>
            </div>
          </div>
          <button 
            onClick={() => setShowSettings(true)}
            className="p-3 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all"
          >
            <Settings2 size={20} />
          </button>
        </header>

        {/* Content */}
        <main className="flex-1 px-4 sm:px-6">
          {activeTab === 'dashboard' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Dashboard transactions={transactions} settings={settings} />
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Transactions</h2>
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{transactions.length} entries</span>
              </div>
              {transactions.length === 0 ? (
                <div className="text-center py-20 opacity-50">
                  <ReceiptText size={48} className="mx-auto mb-4 text-slate-300" />
                  <p className="font-bold text-slate-400">No transactions yet</p>
                </div>
              ) : (
                transactions.map(t => (
                  <TransactionCard 
                    key={t.id} 
                    transaction={t} 
                    settings={settings}
                    onUpdate={handleUpdateTransaction}
                    onDelete={handleDeleteTransaction}
                  />
                ))
              )}
            </div>
          )}

          {activeTab === 'export' && (
             <ExportTab transactions={transactions} settings={settings} />
          )}
        </main>

        {/* Navigation / FAB */}
        <div className="fixed bottom-6 left-6 right-6 sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-sm z-40">
          <div className="glass-card p-2 rounded-[2rem] shadow-2xl flex items-center justify-between relative">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`p-4 rounded-[1.5rem] transition-all duration-300 ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <LayoutDashboard size={24} strokeWidth={activeTab === 'dashboard' ? 3 : 2} />
            </button>
            
            <div className="relative -top-8">
              <button 
                onClick={() => setIsActionMenuOpen(!isActionMenuOpen)}
                className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${isActionMenuOpen ? 'bg-slate-800 rotate-45' : 'bg-gradient-to-tr from-indigo-500 to-pink-500 hover:scale-110'}`}
              >
                <Plus size={32} className="text-white" strokeWidth={3} />
              </button>
              
              {/* Action Menu */}
              {isActionMenuOpen && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 flex flex-col gap-3 animate-in slide-in-from-bottom-4 fade-in duration-200">
                  <button 
                    onClick={() => fileUploadRef.current?.openCamera()}
                    className="flex items-center gap-3 px-5 py-3 bg-white text-slate-700 rounded-2xl shadow-xl font-bold whitespace-nowrap hover:scale-105 transition-all"
                  >
                    <Camera size={18} className="text-indigo-500" />
                    <span>Scan Receipt</span>
                  </button>
                  <button 
                    onClick={() => fileUploadRef.current?.openGallery()}
                    className="flex items-center gap-3 px-5 py-3 bg-white text-slate-700 rounded-2xl shadow-xl font-bold whitespace-nowrap hover:scale-105 transition-all"
                  >
                    <ImageIcon size={18} className="text-pink-500" />
                    <span>Upload Image</span>
                  </button>
                </div>
              )}
            </div>

            <button 
              onClick={() => setActiveTab('transactions')}
              className={`p-4 rounded-[1.5rem] transition-all duration-300 ${activeTab === 'transactions' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <ReceiptText size={24} strokeWidth={activeTab === 'transactions' ? 3 : 2} />
            </button>

            <button 
              onClick={() => setActiveTab('export')}
              className={`p-4 rounded-[1.5rem] transition-all duration-300 ${activeTab === 'export' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Download size={24} strokeWidth={activeTab === 'export' ? 3 : 2} />
            </button>
          </div>
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex flex-col items-center justify-center text-white">
            <div className="w-16 h-16 border-4 border-white/20 border-t-indigo-500 rounded-full animate-spin mb-4" />
            <p className="font-black text-xl tracking-tight animate-pulse">Analyzing Receipt...</p>
            <p className="text-white/50 text-sm mt-2 font-medium">Powered by Gemini 1.5 Flash</p>
          </div>
        )}

        {/* Hidden File Upload Component */}
        <FileUpload ref={fileUploadRef} onUpload={handleFileUpload} isLoading={isLoading} />

        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xl flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] p-6 shadow-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black text-slate-800">Settings</h3>
                <button onClick={() => setShowSettings(false)} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-5">
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Partner 1 Name</label>
                    <input 
                      type="text" 
                      value={settings.p1Name}
                      onChange={(e) => setSettings({...settings, p1Name: e.target.value})}
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Partner 2 Name</label>
                    <input 
                      type="text" 
                      value={settings.p2Name}
                      onChange={(e) => setSettings({...settings, p2Name: e.target.value})}
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="font-bold text-slate-700 text-sm">Enable 3rd Partner</span>
                    <button 
                      type="button"
                      onClick={() => setSettings({...settings, p3Enabled: !settings.p3Enabled})}
                      className={`w-12 h-7 rounded-full transition-colors relative ${settings.p3Enabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform ${settings.p3Enabled ? 'left-6' : 'left-1'}`} />
                    </button>
                  </div>

                  {settings.p3Enabled && (
                    <div className="animate-in slide-in-from-top-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Partner 3 Name</label>
                      <input 
                        type="text" 
                        value={settings.p3Name || ''}
                        onChange={(e) => setSettings({...settings, p3Name: e.target.value})}
                        className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Currency</label>
                    <div className="grid grid-cols-4 gap-2">
                      {CURRENCIES.map(c => (
                        <button
                          key={c.name}
                          type="button"
                          onClick={() => setSettings({...settings, currency: c.symbol})}
                          className={`py-2 rounded-xl text-sm font-bold border ${settings.currency === c.symbol ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                        >
                          {c.symbol}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
                  <button 
                    type="submit"
                    className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-indigo-200"
                  >
                    Save Changes
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                        logoutUser();
                        setShowSettings(false);
                    }}
                    className="w-full py-3 text-rose-500 bg-rose-50 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-rose-100 transition-all flex items-center justify-center gap-2"
                  >
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;