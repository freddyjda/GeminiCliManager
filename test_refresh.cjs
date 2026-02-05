const https = require('https');

// Same credentials as our app
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

// Read freddyjda2's current credentials
const fs = require('fs');
const path = require('path');
const homedir = require('os').homedir();

const credsPath = path.join(homedir, '.gemini', 'cli-users', 'freddyjda2_gmail_com_oauth_creds.json');
const creds = JSON.parse(fs.readFileSync(credsPath, 'utf8'));

console.log('=== Token Refresh Test ===');
console.log('Token expires at:', new Date(creds.expiry_date).toLocaleString());
console.log('Current time:', new Date().toLocaleString());
console.log('Token expired?', Date.now() > creds.expiry_date);
console.log('');
console.log('Attempting refresh...');

const postData = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    refresh_token: creds.refresh_token,
    grant_type: 'refresh_token',
}).toString();

const req = https.request({
    hostname: 'oauth2.googleapis.com',
    port: 443,
    path: '/token',
    method: 'POST',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': postData.length
    }
}, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Response:', data);

        if (res.statusCode === 200) {
            const newTokens = JSON.parse(data);
            console.log('\n✅ SUCCESS! New token obtained.');
            console.log('New expiry:', new Date(Date.now() + newTokens.expires_in * 1000).toLocaleString());
        } else {
            console.log('\n❌ FAILED. Token refresh rejected.');
        }
    });
});

req.on('error', (e) => console.error('Request error:', e));
req.write(postData);
req.end();
