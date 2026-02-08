// Vercel Serverless Function: GET /api/work/admin/export
// Export all applications as CSV

import type { VercelRequest, VercelResponse } from '@vercel/node';

function verifyAdmin(req: VercelRequest): boolean {
  const authHeader = req.headers.authorization;
  if (!authHeader) return false;

  try {
    const email = authHeader.replace('Bearer ', '').trim();
    return email === process.env.ADMIN_EMAIL;
  } catch {
    return false;
  }
}

function setCors(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin || '';
  const allowed = process.env.ALLOWED_ORIGIN || 'https://sifat-there.vercel.app';
  res.setHeader('Access-Control-Allow-Origin', origin === allowed ? origin : allowed);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(req, res);

  if (req.method === 'OPTIONS') {
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
    const csv = await sheets.exportApplicationsCSV();

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="applications_${Date.now()}.csv"`);
    return res.status(200).send(csv);
  } catch (error) {
    console.error('Admin export error:', error);
    return res.status(500).json({ error: 'Failed to export applications' });
  }
}
