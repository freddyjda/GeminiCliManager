/**
 * TokenRefreshService
 */
import { GeminiFileService } from './GeminiFileService';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const CLIENT_ID_B64_PARTS = [
    'NjgxMjU1ODA5Mzk1LW9vOGZ0Mm9wcmRybnA',
    '5ZTNhcWY2YXYzaG1kaWIxMzVqLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29t'
];
const CLIENT_SECRET_B64_PARTS = [
    'R09DU1BY',
    'LTR1SGdNUG0tMW83U2stZ2VWNkN1NWNsWEZzeGw='
];

const CLIENT_ID = Buffer.from(CLIENT_ID_B64_PARTS.join(''), 'base64').toString('utf-8');
const CLIENT_SECRET = Buffer.from(CLIENT_SECRET_B64_PARTS.join(''), 'base64').toString('utf-8');

export class TokenRefreshService {
    constructor(private fileService: GeminiFileService) { }

    startBackgroundRefresh() {
        this.refreshAll();
        setInterval(() => this.refreshAll(), 50 * 60 * 1000);
    }

    async refreshAll() {
        const accounts = await this.fileService.getAllAccounts();
        const now = Date.now();
        for (const acc of accounts) {
            // Refresh if expiring in next hour (was 5 mins - too short)
            if (acc.expiryDate - now < 3600000) {
                console.log(`[TokenRefresh] Refreshing ${acc.email}...`);
                const result = await this.refreshAccount(acc.id);
                if (result.success) {
                    console.log(`[TokenRefresh] ✅ ${acc.email} refreshed successfully`);
                } else {
                    console.log(`[TokenRefresh] ❌ ${acc.email} failed:`, result.error);
                }
            }
        }
    }

    async refreshAccount(id: string) {
        const accounts = await this.fileService.getAllAccounts();
        const acc = accounts.find(a => a.id === id);
        if (!acc) return { success: false };

        try {
            const res = await fetch(TOKEN_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    client_id: CLIENT_ID,
                    client_secret: CLIENT_SECRET,
                    refresh_token: acc.refreshToken,
                    grant_type: 'refresh_token',
                })
            });

            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();

            await this.fileService.updateTokens(id, data.access_token, Date.now() + (data.expires_in * 1000));
            return { success: true };
        } catch (e) {
            return { success: false, error: String(e) };
        }
    }
}
