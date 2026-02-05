import { useState, useEffect } from 'react';
import { Power, RefreshCw, Zap, Plus, Rocket, ShieldCheck, Users } from 'lucide-react';

declare global {
    interface Window {
        api: any;
    }
}

function App() {
    const [accounts, setAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [monitoring, setMonitoring] = useState(false);
    const [msg, setMsg] = useState('');
    const [adding, setAdding] = useState(false);

    const activeAccount = accounts.find(a => a.isActive);
    const backupAccounts = accounts.filter(a => !a.isActive);

    // Initial Load
    useEffect(() => {
        loadData();
        if (window.api) {
            window.api.getMonitorStatus().then((s: any) => setMonitoring(s.isMonitoring));

            // Listen for auto-switch
            const cleanup = window.api.on('quota-switch-notification', (_: any, data: any) => {
                setMsg(`🚀 Auto-jump initiated! Now under command of ${data.newAccount}`);
                setTimeout(() => setMsg(''), 5000);
                loadData();
            });

            return cleanup;
        }
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            if (window.api) {
                const data = await window.api.getAccounts();
                setAccounts(data);
            }
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    const handleSwitch = async (id: string) => {
        if (window.api) {
            await window.api.switchAccount(id);
            loadData();
        }
    };

    const handleAddAccount = async () => {
        setAdding(true);
        setMsg('🔭 Scanning for new frequencies... (Check your browser)');
        try {
            if (window.api) {
                const result = await window.api.addAccount();
                setMsg(result || '🎉 New crew member welcomed aboard! Refreshing manifest...');
                loadData();
                setTimeout(() => setMsg(''), 5000);
            }
        } catch (e: any) {
            console.error('Add account error:', e);
            setMsg(`💥 Hull breach detected: ${e?.message || e?.toString() || 'Unknown error'}`);
        }
        setAdding(false);
    };

    const toggleMonitor = async () => {
        if (window.api) {
            if (monitoring) {
                await window.api.stopMonitor();
                setMonitoring(false);
            } else {
                await window.api.startMonitor();
                setMonitoring(true);
            }
        }
    };

    if (!window.api) {
        return (
            <div className="min-h-screen flex items-center justify-center p-8">
                <div className="glass-panel p-8 rounded-2xl max-w-md text-center animate-glow text-red-100 border-red-500/30">
                    <h1 className="text-3xl font-bold mb-4 flex items-center justify-center gap-2">
                        Houston, we have a problem 🛰️
                    </h1>
                    <p className="mb-6">The main data link is severed (Electron API missing).</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="btn-primary bg-red-600 hover:bg-red-500 w-full"
                    >
                        Re-initialize Systems
                    </button>
                </div>
            </div>
        );
    }

    if (loading && accounts.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center animate-pulse">
                    <Rocket className="w-12 h-12 text-cyan-400 mx-auto mb-4 animate-float" />
                    <h2 className="text-xl font-medium text-cyan-100">Igniting thrusters...</h2>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-6 font-sans relative">
            {/* Header */}
            <header className="flex justify-between items-center mb-10 glass-panel p-4 rounded-xl sticky top-4 z-50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 shadow-lg shadow-cyan-500/30 flex items-center justify-center">
                        <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="currentColor">
                            <circle cx="8" cy="12" r="2" />
                            <circle cx="16" cy="12" r="2" />
                            <path d="M8 12 L16 12" stroke="currentColor" strokeWidth="2" fill="none" />
                        </svg>
                    </div>

                    <div>
                        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-purple-300">
                            Gemini Command
                        </h1>
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            Systems Nominal v1.0
                        </p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={toggleMonitor}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 border ${monitoring
                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                            : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-700/50'
                            }`}
                        title="Toggle Automatic Switching"
                    >
                        <Zap size={16} className={monitoring ? 'fill-current' : ''} />
                        <span className="hidden sm:inline">{monitoring ? 'Auto-Pilot ON' : 'Manual Mode'}</span>
                    </button>

                    <button
                        onClick={loadData}
                        className="btn-secondary p-2 aspect-square flex items-center justify-center"
                        title="Refresh Data"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>

                    <button
                        onClick={handleAddAccount}
                        disabled={adding}
                        className="btn-primary p-2 aspect-square flex items-center justify-center"
                        title="Add New Account"
                    >
                        <Plus size={20} />
                    </button>
                </div>
            </header>

            {/* Notification Toast */}
            {msg && (
                <div className="fixed bottom-6 right-6 z-50 animate-float">
                    <div className="glass-panel p-4 rounded-lg flex items-center gap-3 border-l-4 border-l-purple-500 text-purple-100 max-w-md">
                        <div className="p-2 bg-purple-500/20 rounded-full">
                            <ShieldCheck size={20} />
                        </div>
                        {msg}
                    </div>
                </div>
            )}

            <main className="max-w-5xl mx-auto space-y-8">
                {/* Active Account Section */}
                {activeAccount && (
                    <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="flex items-center gap-2 mb-4 text-cyan-300/80 uppercase tracking-widest text-xs font-bold pl-2">
                            <Rocket size={14} /> Commander on Deck
                        </div>

                        <div className="glass-panel p-8 rounded-2xl relative overflow-hidden group">
                            {/* Background decoration */}
                            <div className="absolute top-0 right-0 p-32 bg-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-cyan-500/20 transition-all duration-700"></div>

                            <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-start gap-6">
                                <div>
                                    <div className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 mb-2">
                                        {activeAccount.email}
                                    </div>
                                    <div className="text-sm text-slate-400 font-mono bg-black/30 w-fit px-3 py-1 rounded-full border border-white/5">
                                        ID: {activeAccount.id}
                                    </div>
                                </div>
                                <span className="bg-gradient-to-r from-emerald-600 to-teal-500 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-2 w-fit">
                                    <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                                    ONLINE
                                </span>
                            </div>

                            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
                                {activeAccount.quota?.models && Object.keys(activeAccount.quota.models).length > 0 ? Object.entries(activeAccount.quota.models)
                                    .filter(([k]: any) => k.includes('gemini-3'))
                                    .map(([k, v]: any) => (
                                        <div key={k} className="bg-black/40 border border-white/5 rounded-xl p-4 hover:border-white/20 transition-all">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-slate-300 font-medium text-sm truncate pr-2" title={k}>
                                                    {k.replace('models/', '')}
                                                </span>
                                                <span className={`text-xs px-2 py-0.5 rounded font-bold ${v.percentage > 50 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                                    }`}>
                                                    {v.percentage > 0 ? 'READY' : 'DEPLETED'}
                                                </span>
                                            </div>

                                            <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
                                                <div
                                                    className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ${v.percentage > 80 ? 'bg-gradient-to-r from-emerald-500 to-green-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' :
                                                        v.percentage > 20 ? 'bg-gradient-to-r from-yellow-500 to-orange-400' :
                                                            'bg-gradient-to-r from-red-600 to-red-500'
                                                        }`}
                                                    style={{ width: `${v.percentage}%` }}
                                                ></div>
                                            </div>
                                            <div className="flex justify-between mt-2 text-xs text-slate-500">
                                                <span>Fuel Level</span>
                                                <span className="text-slate-300 font-mono">{v.percentage}%</span>
                                            </div>
                                        </div>
                                    )) : (
                                    <div className="text-red-400 bg-red-900/20 border border-red-500/30 p-4 rounded-xl w-full col-span-full flex flex-col items-center justify-center gap-2 animate-pulse">
                                        <div className="font-bold flex items-center gap-2">
                                            <ShieldCheck className="w-5 h-5" /> SYSTEMS OFFLINE
                                        </div>
                                        <p className="text-sm opacity-80">New login required to restore power.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                )}

                {/* Backup Accounts Section */}
                {backupAccounts.length > 0 && (
                    <section className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-150">
                        <div className="flex items-center gap-2 mb-4 text-purple-300/80 uppercase tracking-widest text-xs font-bold pl-2">
                            <Users size={14} /> Reserve Crew
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {backupAccounts.map(acc => (
                                <div key={acc.id} className="glass-card p-5 rounded-xl group relative">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="overflow-hidden">
                                            <div className="font-bold truncate text-slate-200 group-hover:text-white transition-colors" title={acc.email}>
                                                {acc.email}
                                            </div>
                                            <div className="text-xs text-slate-500 font-mono truncate">{acc.id}</div>
                                        </div>
                                    </div>

                                    <div className="space-y-3 mb-6">
                                        {acc.quota?.models && Object.keys(acc.quota.models).length > 0 ? Object.entries(acc.quota.models)
                                            .filter(([k]: any) => k.includes('gemini-3'))
                                            .slice(0, 2) // Show only first 2 to save space
                                            .map(([k, v]: any) => (
                                                <div key={k} className="flex justify-between items-center text-xs">
                                                    <span className="text-slate-400 truncate max-w-[120px]">{k.replace('models/', '')}</span>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full ${v.percentage > 50 ? 'bg-slate-400' : 'bg-red-900'
                                                                    }`}
                                                                style={{ width: `${v.percentage}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="font-mono text-slate-500 w-8 text-right">{v.percentage}%</span>
                                                    </div>
                                                </div>
                                            )) : (
                                            <div className="flex items-center gap-2 text-red-400 text-xs bg-red-900/20 p-2 rounded border border-red-500/20">
                                                <ShieldCheck size={14} />
                                                <span>New login required</span>
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => handleSwitch(acc.id)}
                                        className="w-full py-2.5 rounded-lg border border-purple-500/30 text-purple-300 
                                                 hover:bg-purple-500/20 hover:border-purple-500/60 hover:text-white 
                                                 transition-all duration-300 flex items-center justify-center gap-2 group-hover:translate-y-[-2px]"
                                    >
                                        <Power size={14} /> Take Command
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {accounts.length === 0 && !loading && (
                    <div className="text-center py-20 text-slate-500 animate-in fade-in zoom-in duration-500">
                        <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700">
                            <Users size={32} />
                        </div>
                        <h3 className="text-xl font-medium text-slate-300 mb-2">Crew Roster Empty</h3>
                        <p>No accounts detected locally.</p>
                        <p className="text-sm mt-4">Click the <Plus className="inline w-4 h-4 mx-1" /> button to recruit your first account.</p>
                    </div>
                )}
            </main>
        </div>
    );
}

export default App;
