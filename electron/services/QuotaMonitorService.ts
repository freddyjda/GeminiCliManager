import { BrowserWindow } from 'electron';
import { GeminiFileService } from './GeminiFileService';
import { QuotaService } from './QuotaService';

export class QuotaMonitorService {
    private interval: NodeJS.Timeout | null = null;
    private win: BrowserWindow | null = null;
    private targetModel = 'gemini-3-pro-preview';

    constructor(
        private fileService: GeminiFileService,
        private quotaService: QuotaService
    ) { }

    setWindow(win: BrowserWindow) {
        this.win = win;
    }

    start() {
        if (this.interval) return;
        this.check();
        this.interval = setInterval(() => this.check(), 60000);
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    private async check() {
        const active = await this.fileService.getActiveAccount();
        if (!active) return;

        const quota = await this.quotaService.fetchQuota(active.accessToken);
        const modelQ = quota.models[this.targetModel];

        if (modelQ && modelQ.percentage <= 20) {
            console.log('Quota low, searching for better account...');
            await this.switchAccount(active.id);
        }
    }

    private async switchAccount(currentId: string) {
        const accounts = await this.fileService.getAllAccounts();
        let bestAcc = null;
        let bestQ = -1;

        for (const acc of accounts) {
            if (acc.id === currentId) continue;
            const q = await this.quotaService.fetchQuota(acc.accessToken);
            const val = q.models[this.targetModel]?.percentage || 0;
            if (val > 80 && val > bestQ) {
                bestQ = val;
                bestAcc = acc;
            }
        }

        if (bestAcc) {
            await this.fileService.switchAccount(bestAcc.id);
            this.win?.webContents.send('quota-switch-notification', {
                newAccount: bestAcc.email
            });
        }
    }

    getStatus() {
        return { isMonitoring: !!this.interval };
    }
}
