// Vercel Serverless Function: GET /api/work/admin/list
// Fetch all applications for admin dashboard

import type { VercelRequest, VercelResponse } from '@vercel/node';

function verifyAdmin(req: VercelRequest): boolean {
  const authHeader = req.headers.authorization;
  if (!authHeader) return false;

  try {
    // Expects: "Bearer <email>"
    const email = authHeader.replace('Bearer ', '').trim();
    if (email !== process.env.ADMIN_EMAIL) return false;

    // If ADMIN_API_SECRET is set, also verify the x-admin-secret header
    const secret = process.env.ADMIN_API_SECRET;
    if (secret) {
      const provided = req.headers['x-admin-secret'] as string;
      if (provided !== secret) return false;
    }

    return true;
  } catch {
    return false;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    const origin = req.headers.origin || '';
    const allowed = process.env.ALLOWED_ORIGIN || 'https://sifat-there.vercel.app';
    res.setHeader('Access-Control-Allow-Origin', origin === allowed ? origin : allowed);
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-secret');
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!verifyAdmin(req)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const sheets = await import('../../../src/lib/work/google-sheets');
    const applications = await sheets.getAllApplications();

    return res.status(200).json(applications);
  } catch (error) {
    console.error('Admin list error:', error);
    return res.status(500).json({ error: 'Failed to fetch applications' });
  }
}
