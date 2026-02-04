import { useState, useEffect } from 'react';
import { Power, RefreshCw, Zap, Plus } from 'lucide-react';

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
        window.api.getMonitorStatus().then((s: any) => setMonitoring(s.isMonitoring));

        // Listen for auto-switch
        const cleanup = window.api.on('quota-switch-notification', (_: any, data: any) => {
            setMsg(`Auto-switched to ${data.newAccount}`);
            setTimeout(() => setMsg(''), 5000);
            loadData();
        });

        return cleanup;
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await window.api.getAccounts();
            setAccounts(data);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    const handleSwitch = async (id: string) => {
        await window.api.switchAccount(id);
        loadData();
    };

    const handleAddAccount = async () => {
        setAdding(true);
        setMsg('Opening Google login in your browser...');
        try {
            const result = await window.api.addAccount();
            setMsg(result || 'Login completed! Refreshing accounts...');
            loadData();
        } catch (e: any) {
            console.error('Add account error:', e);
            setMsg(`Error: ${e?.message || e?.toString() || 'Unknown error'}`);
        }
        setAdding(false);
    };

    if (!window.api) {
        return (
            <div className="min-h-screen bg-red-900 text-white p-8 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-3xl font-bold mb-4">Connection Error</h1>
                    <p>Electron API is missing.</p>
                    <p className="text-sm opacity-70 mt-2">The preload script failed to load.</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-4 py-2 bg-red-700 hover:bg-red-600 rounded"
                    >
                        Reload App
                    </button>
                </div>
            </div>
        );
    }

    const toggleMonitor = async () => {
        if (monitoring) {
            await window.api.stopMonitor();
            setMonitoring(false);
        } else {
            await window.api.startMonitor();
            setMonitoring(true);
        }
    };

    if (loading && accounts.length === 0) return <div className="p-8 text-white">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8 font-sans">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold">Gemini Manager</h1>
                    <p className="text-gray-400 text-sm">Clean Build v1.0</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={toggleMonitor}
                        className={`flex items-center gap-2 px-4 py-2 rounded ${monitoring ? 'bg-green-600' : 'bg-gray-700'}`}
                    >
                        <Zap size={16} /> {monitoring ? 'Monitor ON' : 'Monitor OFF'}
                    </button>
                    <button onClick={loadData} className="p-2 bg-blue-600 rounded hover:bg-blue-700">
                        <RefreshCw size={16} />
                    </button>
                    <button
                        onClick={handleAddAccount}
                        disabled={adding}
                        className={`p-2 rounded ${adding ? 'bg-gray-600' : 'bg-purple-600 hover:bg-purple-700'}`}
                    >
                        <Plus size={16} />
                    </button>
                </div>
            </div>

            {msg && (
                <div className="mb-4 p-3 bg-purple-900/50 border border-purple-500 rounded text-purple-100">
                    {msg}
                </div>
            )}

            {/* Active Account Section */}
            {activeAccount && (
                <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-4 text-green-400">Active Account</h2>
                    <div className="p-6 rounded-lg border border-green-500 bg-green-900/20 shadow-lg">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <div className="text-2xl font-bold">{activeAccount.email}</div>
                                <div className="text-sm text-gray-400">{activeAccount.id}</div>
                            </div>
                            <span className="bg-green-600 px-3 py-1 rounded text-sm font-bold shadow">ACTIVE</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {activeAccount.quota?.models ? Object.entries(activeAccount.quota.models)
                                .filter(([k]: any) => k.includes('gemini-3'))
                                .map(([k, v]: any) => (
                                    <div key={k} className="flex justify-between p-3 bg-gray-800/50 rounded items-center">
                                        <span className="text-gray-300 font-medium">{k.replace('models/', '')}</span>
                                        <div className="text-right">
                                            <div className={`text-lg font-bold ${v.percentage > 80 ? 'text-green-400' : v.percentage > 20 ? 'text-yellow-400' : 'text-red-400'}`}>
                                                {v.percentage}%
                                            </div>
                                            <div className="text-xs text-gray-500">Remaining</div>
                                        </div>
                                    </div>
                                )) : <div className="text-gray-500">No quota data available</div>}
                        </div>
                    </div>
                </div>
            )}

            {/* Backup Accounts Section */}
            {backupAccounts.length > 0 && (
                <div>
                    <h2 className="text-xl font-semibold mb-4 text-blue-400">Backup Accounts</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {backupAccounts.map(acc => (
                            <div key={acc.id} className="p-4 rounded border border-gray-700 bg-gray-800 hover:border-gray-600 transition-colors">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="font-bold truncate" title={acc.email}>{acc.email}</div>
                                        <div className="text-xs text-gray-400">{acc.id}</div>
                                    </div>
                                </div>

                                <div className="space-y-2 mb-4">
                                    {acc.quota?.models ? Object.entries(acc.quota.models)
                                        .filter(([k]: any) => k.includes('gemini-3'))
                                        .map(([k, v]: any) => (
                                            <div key={k} className="flex justify-between items-center text-sm gap-2">
                                                <span className="text-gray-400 font-medium">{k.replace('models/', '')}</span>
                                                <span className={`${v.percentage > 80 ? 'text-green-400' : 'text-red-400'} whitespace-nowrap`}>{v.percentage}%</span>
                                            </div>
                                        )) : <div className="text-gray-500 text-sm">No quota data</div>}
                                </div>

                                <button
                                    onClick={() => handleSwitch(acc.id)}
                                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded flex items-center justify-center gap-2 text-sm transition-colors"
                                >
                                    <Power size={14} /> Switch to this
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}


        </div>
    );
}

export default App;
