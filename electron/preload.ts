import { ipcRenderer, contextBridge } from 'electron';

const api = {
    // IPC Wrapper
    invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
    on: (channel: string, listener: (event: any, ...args: any[]) => void) => {
        const sub = (_: any, ...args: any[]) => listener(_, ...args);
        ipcRenderer.on(channel, sub);
        return () => ipcRenderer.off(channel, sub);
    },

    // Specific Methods
    getAccounts: () => ipcRenderer.invoke('get-full-data'),
    switchAccount: (id: string) => ipcRenderer.invoke('switch-account', id),
    refreshToken: (id: string) => ipcRenderer.invoke('refresh-token', id),

    // Monitoring
    startMonitor: () => ipcRenderer.invoke('start-monitor'),
    stopMonitor: () => ipcRenderer.invoke('stop-monitor'),
    getMonitorStatus: () => ipcRenderer.invoke('get-monitor-status'),

    // Auth
    addAccount: () => ipcRenderer.invoke('add-account')
};

contextBridge.exposeInMainWorld('api', api);

export type ElectronAPI = typeof api;
