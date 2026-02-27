// Vercel Serverless Function: /api/work/check-country
// Public endpoint to check if a country is blocked from applying

import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as sheets from '../lib/google-sheets.js';

function setCors(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin || '';
  const allowed = (process.env.ALLOWED_ORIGIN || 'https://sifat-there.vercel.app').replace(/\/$/, '');
  const isAllowed = origin === allowed || origin.endsWith('.vercel.app');
  res.setHeader('Access-Control-Allow-Origin', isAllowed ? origin : allowed);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    // Check if country is blocked OR return all blocked countries
    try {
      const { country } = req.query;
      
      const blockedCountries = await (sheets as any).getBlockedCountries();

      // If country param provided, check single country
      if (country && typeof country === 'string') {
        const isBlocked = blockedCountries.includes(country);
        return res.status(200).json({ blocked: isBlocked });
      }

      // No country param, return all blocked countries for frontend notice
      return res.status(200).json({ blockedCountries });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Check country error:', message, error);
      return res.status(500).json({ error: 'Failed to check country status', detail: message });
    }
  }

  if (req.method === 'POST') {
    // Store interested applicant
    try {
      const { email, full_name, country, company_id, role_id, role_title } = req.body;

      if (!email || !country) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      await (sheets as any).addInterestedApplicant({
        timestamp: new Date().toISOString(),
        email,
        full_name: full_name || '',
        country,
        company_id: company_id || '',
        role_id: role_id || '',
        role_title: role_title || '',
      });

      return res.status(200).json({ success: true });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Store interested applicant error:', message, error);
      return res.status(500).json({ error: 'Failed to store your information', detail: message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
