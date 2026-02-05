/**
 * GeminiFileService
 * Reads and writes Gemini CLI account files - ALL from cli-users folder
 */
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface GeminiAccount {
    id: string;
    email: string;
    accessToken: string;
    refreshToken: string;
    expiryDate: number;
    isActive: boolean;
    filePath: string;
}

export class GeminiFileService {
    private geminiDir: string;
    private cliUsersDir: string;
    private activeFilePath: string;

    constructor() {
        this.geminiDir = path.join(os.homedir(), '.gemini');
        this.cliUsersDir = path.join(this.geminiDir, 'cli-users');
        this.activeFilePath = path.join(this.cliUsersDir, '_active_account.txt');

        // Ensure directory exists
        if (!fs.existsSync(this.cliUsersDir)) {
            fs.mkdirSync(this.cliUsersDir, { recursive: true });
        }
    }

    /**
     * Get the currently active account ID from our tracking file
     */
    private getActiveAccountId(): string | null {
        if (fs.existsSync(this.activeFilePath)) {
            return fs.readFileSync(this.activeFilePath, 'utf-8').trim();
        }
        return null;
    }

    /**
     * Set the active account ID
     */
    private setActiveAccountId(accountId: string): void {
        fs.writeFileSync(this.activeFilePath, accountId);
    }

    /**
     * Get all accounts from cli-users folder
     */
    async getAllAccounts(): Promise<GeminiAccount[]> {
        const accounts: GeminiAccount[] = [];
        const activeId = this.getActiveAccountId();

        // Check for updates from external CLI (Reverse Sync)
        if (activeId) {
            this.syncFromMainGeminiDir(activeId);
        }

        if (!fs.existsSync(this.cliUsersDir)) {
            return accounts;
        }

        const files = fs.readdirSync(this.cliUsersDir);
        const oauthFiles = files.filter(f => f.endsWith('_oauth_creds.json'));

        for (const oauthFile of oauthFiles) {
            const prefix = oauthFile.replace('_oauth_creds.json', '');
            const googleAccountsFile = `${prefix}_google_accounts.json`;
            const oauthPath = path.join(this.cliUsersDir, oauthFile);
            const googlePath = path.join(this.cliUsersDir, googleAccountsFile);

            if (fs.existsSync(googlePath)) {
                try {
                    const oauthCreds = JSON.parse(fs.readFileSync(oauthPath, 'utf-8'));
                    const googleAccounts = JSON.parse(fs.readFileSync(googlePath, 'utf-8'));
                    const email = googleAccounts.default || googleAccounts.active || '';
                    const isActive = prefix === activeId;

                    accounts.push({
                        id: prefix,
                        email: email,
                        accessToken: oauthCreds.access_token,
                        refreshToken: oauthCreds.refresh_token,
                        expiryDate: oauthCreds.expiry_date,
                        isActive: isActive,
                        filePath: oauthPath,
                    });
                } catch (e) {
                    console.error(`Failed to parse ${oauthFile}:`, e);
                }
            }
        }

        // If no active account set but we have accounts, set the first one as active
        if (!activeId && accounts.length > 0) {
            accounts[0].isActive = true;
            this.setActiveAccountId(accounts[0].id);
            // Copy to main gemini dir for CLI compatibility
            this.syncToMainGeminiDir(accounts[0].id);
        }

        // Sort: active first, then alphabetically
        accounts.sort((a, b) => {
            if (a.isActive) return -1;
            if (b.isActive) return 1;
            return a.email.localeCompare(b.email);
        });

        return accounts;
    }

    /**
     * Check if main .gemini files are newer than our internal copy
     * If so, sync them BACK to our internal copy (Official CLI updated them)
     */
    private syncFromMainGeminiDir(accountId: string): void {
        const mainOauthPath = path.join(this.geminiDir, 'oauth_creds.json');
        const mainGooglePath = path.join(this.geminiDir, 'google_accounts.json');

        const internalOauthPath = path.join(this.cliUsersDir, `${accountId}_oauth_creds.json`);

        if (fs.existsSync(mainOauthPath) && fs.existsSync(internalOauthPath)) {
            try {
                const mainStats = fs.statSync(mainOauthPath);
                const internalStats = fs.statSync(internalOauthPath);

                // If main file is newer (> 2 seconds to avoid loops), copy it back
                if (mainStats.mtimeMs > internalStats.mtimeMs + 2000) {
                    // Verify it belongs to the same account (simple default email check)
                    if (fs.existsSync(mainGooglePath)) {
                        const mainGoogle = JSON.parse(fs.readFileSync(mainGooglePath, 'utf-8'));
                        // We could check email match here if we want to be strict
                        // But for now we assume if it's the active account, it matches
                    }

                    console.log(`[Sync] Updating internal credentials for ${accountId} from external CLI changes`);
                    fs.copyFileSync(mainOauthPath, internalOauthPath);
                }
            } catch (e) {
                console.error('[Sync] Error syncing from main dir:', e);
            }
        }
    }

    /**
     * Get the active account
     */
    async getActiveAccount(): Promise<GeminiAccount | null> {
        const accounts = await this.getAllAccounts();
        return accounts.find(a => a.isActive) || null;
    }

    /**
     * Sync account files to main .gemini dir so CLI can use them
     */
    private syncToMainGeminiDir(accountId: string): void {
        const oauthSource = path.join(this.cliUsersDir, `${accountId}_oauth_creds.json`);
        const googleSource = path.join(this.cliUsersDir, `${accountId}_google_accounts.json`);

        if (fs.existsSync(oauthSource)) {
            fs.copyFileSync(oauthSource, path.join(this.geminiDir, 'oauth_creds.json'));
        }
        if (fs.existsSync(googleSource)) {
            fs.copyFileSync(googleSource, path.join(this.geminiDir, 'google_accounts.json'));
        }
    }

    /**
     * Switch to a different account
     */
    async switchAccount(accountId: string): Promise<void> {
        const oauthSource = path.join(this.cliUsersDir, `${accountId}_oauth_creds.json`);
        const googleSource = path.join(this.cliUsersDir, `${accountId}_google_accounts.json`);

        if (!fs.existsSync(oauthSource) || !fs.existsSync(googleSource)) {
            throw new Error('Account not found');
        }

        // Update our active tracking
        this.setActiveAccountId(accountId);

        // Copy to main gemini dir for CLI compatibility
        this.syncToMainGeminiDir(accountId);
    }

    /**
     * Update tokens for an account
     */
    async updateTokens(accountId: string, accessToken: string, expiryDate: number): Promise<void> {
        const oauthPath = path.join(this.cliUsersDir, `${accountId}_oauth_creds.json`);

        if (!fs.existsSync(oauthPath)) throw new Error('Account file not found');

        const creds = JSON.parse(fs.readFileSync(oauthPath, 'utf-8'));
        creds.access_token = accessToken;
        creds.expiry_date = expiryDate;
        fs.writeFileSync(oauthPath, JSON.stringify(creds, null, 2));

        // If this is the active account, also update main gemini dir
        if (accountId === this.getActiveAccountId()) {
            this.syncToMainGeminiDir(accountId);
        }
    }

    /**
     * Debug info
     */
    async getDebugInfo(): Promise<any> {
        return {
            homeDir: os.homedir(),
            geminiDir: this.geminiDir,
            cliUsersDir: this.cliUsersDir,
            geminiExists: fs.existsSync(this.geminiDir),
            activeAccountId: this.getActiveAccountId(),
            files: fs.existsSync(this.cliUsersDir) ? fs.readdirSync(this.cliUsersDir) : [],
        };
    }
}
