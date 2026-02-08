// Diagnostic endpoint: GET /api/work/debug
// Tests env vars and Google Sheets connectivity
// DELETE THIS FILE after debugging

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const checks: Record<string, unknown> = {};

  // 1. Check env vars exist (don't reveal values)
  const envVars = [
    'GOOGLE_SERVICE_ACCOUNT_EMAIL',
    'GOOGLE_PRIVATE_KEY',
    'GOOGLE_SHEET_ID',
    'GOOGLE_DRIVE_FOLDER_ID',
    'GOOGLE_CLIENT_ID',
    'ADMIN_EMAIL',
    'ALLOWED_ORIGIN',
    'SITE_URL',
    'EMAIL_SERVER_HOST',
    'EMAIL_SERVER_USER',
    'EMAIL_SERVER_PASSWORD',
  ];

  checks.envVars = {};
  for (const v of envVars) {
    const val = process.env[v] || '';
    (checks.envVars as Record<string, string>)[v] = val
      ? `SET (${val.length} chars, starts: ${val.substring(0, 12)}...)`
      : 'MISSING';
  }

  // 2. Test _lib import
  try {
    const sheets = await import('../_lib/google-sheets');
    checks.importTest = `OK - google-sheets has exports: ${Object.keys(sheets).join(', ')}`;
  } catch (err: unknown) {
    checks.importTest = `FAIL: ${err instanceof Error ? err.message : String(err)}`;
  }

  // 3. Test JWT signing & Google token exchange
  try {
    const serviceEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '';
    const privateKey = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

    if (!serviceEmail || !privateKey) {
      checks.googleAuth = 'SKIP - missing credentials';
    } else {
      // Attempt to sign a JWT
      const now = Math.floor(Date.now() / 1000);
      const header = { alg: 'RS256', typ: 'JWT' };
      const payload = {
        iss: serviceEmail,
        scope: 'https://www.googleapis.com/auth/spreadsheets',
        aud: 'https://oauth2.googleapis.com/token',
        iat: now,
        exp: now + 3600,
      };

      const encoder = new TextEncoder();
      const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
      const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
      const unsignedToken = `${headerB64}.${payloadB64}`;

      const pemContents = privateKey
        .replace('-----BEGIN PRIVATE KEY-----', '')
        .replace('-----END PRIVATE KEY-----', '')
        .replace(/\s/g, '');

      const binaryDer = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

      const cryptoKey = await crypto.subtle.importKey(
        'pkcs8',
        binaryDer.buffer,
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        false,
        ['sign']
      );

      const signature = await crypto.subtle.sign(
        'RSASSA-PKCS1-v1_5',
        cryptoKey,
        encoder.encode(unsignedToken)
      );

      const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');

      const jwt = `${unsignedToken}.${signatureB64}`;

      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: jwt,
        }),
      });

      const tokenData = await tokenRes.json();
      if (tokenData.access_token) {
        checks.googleAuth = `OK - got access token (${tokenData.access_token.substring(0, 20)}...)`;

        // 4. Test Sheets read
        const sheetId = process.env.GOOGLE_SHEET_ID || '';
        if (sheetId) {
          const sheetRes = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Applications!A1:A2`,
            { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
          );
          const sheetData = await sheetRes.json();
          if (sheetRes.ok) {
            checks.sheetsRead = `OK - got ${JSON.stringify(sheetData.values || [])}`;
          } else {
            checks.sheetsRead = `FAIL (${sheetRes.status}): ${JSON.stringify(sheetData.error || sheetData)}`;
          }
        }
      } else {
        checks.googleAuth = `FAIL: ${JSON.stringify(tokenData)}`;
      }
    }
  } catch (err: unknown) {
    checks.googleAuth = `ERROR: ${err instanceof Error ? err.message : String(err)}`;
  }

  return res.status(200).json(checks);
}
