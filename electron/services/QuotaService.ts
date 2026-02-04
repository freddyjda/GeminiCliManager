/**
 * QuotaService
 * Fetches quota from Google Internal API
 */
export interface QuotaData {
    models: Record<string, {
        percentage: number;
        resetTime: string;
    }>;
}

const QUOTA_URL = 'https://cloudcode-pa.googleapis.com/v1internal:retrieveUserQuota';
const LOAD_PROJECT_URL = 'https://cloudcode-pa.googleapis.com/v1internal:loadCodeAssist';
// Using a generic VSCode UA to mimic the CLI behavior
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Electron/28.0.0 Safari/537.36';

export class QuotaService {
    async fetchQuota(accessToken: string): Promise<QuotaData> {
        try {
            const projectId = await this.getProjectId(accessToken);
            const payload: any = {};
            if (projectId) payload['project'] = projectId;

            const res = await fetch(QUOTA_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'User-Agent': USER_AGENT,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) return { models: {} };

            const data = await res.json() as any;
            const result: QuotaData = { models: {} };

            if (data.buckets && Array.isArray(data.buckets)) {
                for (const bucket of data.buckets) {
                    if (bucket.tokenType === 'REQUESTS' && bucket.modelId) {
                        result.models[bucket.modelId] = {
                            percentage: Math.floor(bucket.remainingFraction * 100),
                            resetTime: bucket.resetTime
                        };
                    }
                }
            }
            return result;
        } catch (e) {
            console.error('Quota fetch error:', e);
            return { models: {} };
        }
    }

    private async getProjectId(token: string): Promise<string | null> {
        try {
            const res = await fetch(LOAD_PROJECT_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'User-Agent': USER_AGENT,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    metadata: { ideType: 'IDE_UNSPECIFIED' }
                }),
            });
            if (res.ok) {
                const d = await res.json() as any;
                return d.cloudaicompanionProject || null;
            }
        } catch { }
        return null;
    }
}
