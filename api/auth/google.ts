// Vercel Serverless Function: POST /api/auth/google
// Handles Google OAuth token verification and session creation

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    const origin = req.headers.origin || '';
    const allowed = process.env.ALLOWED_ORIGIN || 'https://sifat-there.vercel.app';
    res.setHeader('Access-Control-Allow-Origin', origin === allowed ? origin : allowed);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ error: 'Missing credential' });
    }

    // Verify Google ID token
    const verifyUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`;
    const verifyRes = await fetch(verifyUrl);

    if (!verifyRes.ok) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const payload = await verifyRes.json();

    // Verify client ID matches
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (payload.aud !== clientId) {
      return res.status(401).json({ error: 'Token audience mismatch' });
    }

    // Check email is verified
    if (payload.email_verified !== 'true' && payload.email_verified !== true) {
      return res.status(401).json({ error: 'Email not verified' });
    }

    const session = {
      user: {
        name: payload.name || '',
        email: payload.email || '',
        image: payload.picture || '',
      },
      isAdmin: payload.email === process.env.ADMIN_EMAIL,
    };

    return res.status(200).json(session);
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
}
