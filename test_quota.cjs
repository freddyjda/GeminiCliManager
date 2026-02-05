const https = require('https');
const fs = require('fs');
const path = require('path');
const homedir = require('os').homedir();

const credsPath = path.join(homedir, '.gemini', 'cli-users', 'freddyjda2_gmail_com_oauth_creds.json');
const creds = JSON.parse(fs.readFileSync(credsPath, 'utf8'));

const QUOTA_URL = '/v1internal:retrieveUserQuota';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

console.log('=== Quota API Test ===');
console.log('Using token expiring:', new Date(creds.expiry_date).toLocaleString());

const postData = JSON.stringify({});

const req = https.request({
    hostname: 'cloudcode-pa.googleapis.com',
    port: 443,
    path: QUOTA_URL,
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${creds.access_token}`,
        'User-Agent': USER_AGENT,
        'Content-Type': 'application/json',
        'Content-Length': postData.length
    }
}, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        console.log('Status:', res.statusCode);
        if (res.statusCode === 200) {
            const parsed = JSON.parse(data);
            console.log('Buckets found:', parsed.buckets?.length || 0);
            if (parsed.buckets) {
                parsed.buckets.forEach(b => {
                    if (b.tokenType === 'REQUESTS') {
                        console.log(`  ${b.modelId}: ${Math.floor(b.remainingFraction * 100)}%`);
                    }
                });
            }
        } else {
            console.log('Error response:', data);
        }
    });
});

req.on('error', (e) => console.error('Request error:', e));
req.write(postData);
req.end();
