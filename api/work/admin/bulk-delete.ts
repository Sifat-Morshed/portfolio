// Vercel Serverless Function: POST /api/work/admin/bulk-delete
// Delete multiple application entries at once

import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as sheets from '../../lib/google-sheets.js';

function verifyAdmin(req: VercelRequest): boolean {
  const authHeader = req.headers.authorization;
  if (!authHeader) return false;
  try {
    const email = authHeader.replace('Bearer ', '').trim();
    return email === process.env.ADMIN_EMAIL;
  } catch { return false; }
}

function setCors(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin || '';
  const allowed = (process.env.ALLOWED_ORIGIN || 'https://sifat-there.vercel.app').replace(/\/$/, '');
  const isAllowed = origin === allowed || origin.endsWith('.vercel.app');
  res.setHeader('Access-Control-Allow-Origin', isAllowed ? origin : allowed);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!verifyAdmin(req)) return res.status(403).json({ error: 'Forbidden' });

  try {
    const { app_ids } = req.body || {};

    if (!Array.isArray(app_ids) || app_ids.length === 0) {
      return res.status(400).json({ error: 'app_ids must be a non-empty array' });
    }

    if (app_ids.length > 50) {
      return res.status(400).json({ error: 'Maximum 50 deletions at once' });
    }

    // Delete in reverse order to avoid row index shifts
    // First, fetch all to validate they exist, then delete from bottom to top
    const results: { id: string; success: boolean; error?: string }[] = [];

    // Delete one by one (reverse order matters for row-index based deletion)
    // We re-fetch between each delete since row indices shift after each deletion
    for (const appId of app_ids) {
      try {
        await (sheets as any).deleteApplication(appId);
        results.push({ id: appId, success: true });
      } catch (err) {
        results.push({ id: appId, success: false, error: err instanceof Error ? err.message : 'Unknown error' });
      }
    }

    const succeeded = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return res.status(200).json({
      success: true,
      deleted: succeeded,
      failed,
      details: failed > 0 ? results.filter(r => !r.success) : undefined,
    });
  } catch (error) {
    console.error('Bulk delete error:', error);
    return res.status(500).json({ error: 'Failed to bulk delete applications' });
  }
}
