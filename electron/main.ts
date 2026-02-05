import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';

import { fileURLToPath } from 'url';
import { AuthService } from './services/AuthService';
import { GeminiFileService } from './services/GeminiFileService';
import { QuotaService } from './services/QuotaService';
import { TokenRefreshService } from './services/TokenRefreshService';
import { QuotaMonitorService } from './services/QuotaMonitorService';

// Define dirname for ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.env.APP_ROOT = path.join(__dirname, '..');

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST;

let win: BrowserWindow | null;
const fileService = new GeminiFileService();
const authService = new AuthService();
const quotaService = new QuotaService();
const refreshService = new TokenRefreshService(fileService);
const monitorService = new QuotaMonitorService(fileService, quotaService);

refreshService.startBackgroundRefresh();

function createWindow() {
    win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.mjs'),
        },
        backgroundColor: '#1e1e1e', // Dark mode base
        icon: path.join(process.env.VITE_PUBLIC as string, 'icon.jpg'),
    });

    monitorService.setWindow(win);

    // Test active push message to React-Electron
    win.webContents.on('did-finish-load', () => {
        win?.webContents.send('main-process-message', (new Date).toLocaleString());
    });

    // Open DevTools
    // win.webContents.openDevTools();

    if (VITE_DEV_SERVER_URL) {
        win.loadURL(VITE_DEV_SERVER_URL);
    } else {
        // win.loadFile('dist/index.html')
        win.loadFile(path.join(RENDERER_DIST, 'index.html'));
    }
}

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
        win = null;
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

app.whenReady().then(createWindow);

// --- IPC Handlers ---
ipcMain.handle('get-accounts', () => fileService.getAllAccounts());
ipcMain.handle('get-active', () => fileService.getActiveAccount());
ipcMain.handle('switch-account', (_, id) => fileService.switchAccount(id));
ipcMain.handle('refresh-token', (_, id) => refreshService.refreshAccount(id));

ipcMain.handle('add-account', () => authService.startLoginFlow());

ipcMain.handle('get-full-data', async () => {
    const accounts = await fileService.getAllAccounts();
    const result = [];
    for (const acc of accounts) {
        const q = await quotaService.fetchQuota(acc.accessToken);
        result.push({ ...acc, quota: q });
    }
    return result;
});

// Monitoring
ipcMain.handle('start-monitor', () => { monitorService.start(); return true; });
ipcMain.handle('stop-monitor', () => { monitorService.stop(); return true; });
ipcMain.handle('get-monitor-status', () => monitorService.getStatus());

