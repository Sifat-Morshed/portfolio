// Vercel Serverless Function: POST /api/work/admin/self-destruct
// Multi-stage verification, all secrets from env vars — NOTHING in code

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
    const { password, final_answer } = req.body;

    // Both secrets come from env vars — never hardcoded
    const correctPass = process.env.SELF_DESTRUCT_PASS || '';
    const correctFinal = process.env.SELF_DESTRUCT_FINAL || '';

    if (!correctPass || !correctFinal) {
      return res.status(500).json({ error: 'Self-destruct not configured on server' });
    }

    if (!password || password !== correctPass) {
      return res.status(403).json({ error: 'Incorrect password' });
    }

    if (!final_answer || final_answer.trim().toLowerCase() !== correctFinal.trim().toLowerCase()) {
      return res.status(403).json({ error: 'Incorrect final answer' });
    }

    // Delete ALL applications one by one
    const allApps = await sheets.getAllApplications();
    let deleted = 0;

    for (const app of allApps) {
      try {
        await sheets.deleteApplication((app as Record<string, string>).app_id);
        deleted++;
      } catch (e) {
        console.error('Failed to delete app:', (app as Record<string, string>).app_id, e);
      }
    }

    return res.status(200).json({
      success: true,
      deleted,
      timestamp: new Date().toISOString(),
      message: 'All data has been permanently destroyed.',
    });
  } catch (error) {
    console.error('Self-destruct error:', error);
    const message = error instanceof Error ? error.message : 'Self-destruct failed';
    return res.status(500).json({ error: message });
  }
}
