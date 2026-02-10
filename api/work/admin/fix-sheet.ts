// Temporary utility to fix sheet structure - add header row if missing
import type { VercelRequest, VercelResponse } from '@vercel/node';

const COLUMNS = [
  'app_id', 'timestamp', 'status', 'company_id', 'role_id', 'role_title',
  'full_name', 'email', 'phone', 'nationality', 'reference',
  'blacklist_acknowledged', 'cv_link', 'audio_link', 'notes', 'last_updated',
  'started_date', 'email_log', 'rejection_date',
];

function getConfig() {
  return {
    serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '',
    privateKey: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    sheetId: process.env.GOOGLE_SHEET_ID || '',
  };
}

async function getAccessToken() {
  const config = getConfig();
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: config.serviceAccountEmail,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };
  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const unsignedToken = `${headerB64}.${payloadB64}`;
  const pemContents = config.privateKey.replace('-----BEGIN PRIVATE KEY-----', '').replace('-----END PRIVATE KEY-----', '').replace(/\s/g, '');
  const binaryDer = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey('pkcs8', binaryDer.buffer, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, encoder.encode(unsignedToken));
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const jwt = `${unsignedToken}.${signatureB64}`;
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }),
  });
  const tokenData = await tokenRes.json() as { access_token?: string };
  if (!tokenData.access_token) throw new Error('Failed to get access token');
  return tokenData.access_token;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(403).json({ error: 'Forbidden' });
  const email = authHeader.replace('Bearer ', '').trim();
  if (email !== process.env.ADMIN_EMAIL) return res.status(403).json({ error: 'Forbidden' });

  try {
    const config = getConfig();
    const token = await getAccessToken();

    // Insert header row at A1
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.sheetId}/values/Applications!A1:S1?valueInputOption=USER_ENTERED`;
    const res2 = await fetch(url, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [COLUMNS] }),
    });

    if (!res2.ok) {
      const error = await res2.text();
      throw new Error(`Failed to add header: ${error}`);
    }

    return res.status(200).json({ success: true, message: 'Header row added to A1:S1. Now manually move your data rows to start from A2.' });
  } catch (error) {
    console.error('Fix sheet error:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}
