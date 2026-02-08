// Vercel Serverless Function: GET /api/work/status?id=xxx
// Poll application status by App ID

import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as sheets from '../_lib/google-sheets';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS on every response
  const origin = req.headers.origin || '';
  const allowed = (process.env.ALLOWED_ORIGIN || 'https://sifat-there.vercel.app').replace(/\/$/, '');
  const isAllowed = origin === allowed || origin.endsWith('.vercel.app');
  res.setHeader('Access-Control-Allow-Origin', isAllowed ? origin : allowed);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Missing application ID' });
    }

    const app = await sheets.getApplicationById(id);

    if (!app) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Return only public-safe fields
    return res.status(200).json({
      app_id: app.app_id,
      status: app.status,
      company_id: app.company_id,
      role_id: app.role_id,
      role_title: app.role_title,
      timestamp: app.timestamp,
      last_updated: app.last_updated,
    });
  } catch (error) {
    console.error('Status check error:', error);
    return res.status(500).json({ error: 'Failed to check status' });
  }
}
