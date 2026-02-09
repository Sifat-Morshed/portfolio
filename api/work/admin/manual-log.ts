// Vercel Serverless Function: POST /api/work/admin/manual-log
// Admin manually logs an application — same as auto-submit but admin-initiated
// Applicant receives the same confirmation email as a normal submission

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

/**
 * Generate a short, human-friendly application ID (same logic as submit.ts)
 */
function generateAppId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  const bytes = new Uint8Array(4);
  globalThis.crypto.getRandomValues(bytes);
  for (let i = 0; i < 4; i++) {
    code += chars[bytes[i] % chars.length];
  }
  const year = new Date().getFullYear().toString().slice(-2);
  return `SM-${code}-${year}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!verifyAdmin(req)) return res.status(403).json({ error: 'Forbidden' });

  try {
    const { full_name, email, phone, nationality, role_id, role_title, company_id, reference } = req.body || {};

    // Validate required fields
    if (!full_name || typeof full_name !== 'string') return res.status(400).json({ error: 'Name is required' });
    if (!email || typeof email !== 'string' || !email.includes('@')) return res.status(400).json({ error: 'Valid email is required' });
    if (!phone || typeof phone !== 'string') return res.status(400).json({ error: 'Phone is required' });
    if (!nationality || typeof nationality !== 'string') return res.status(400).json({ error: 'Nationality is required' });
    if (!role_id || typeof role_id !== 'string') return res.status(400).json({ error: 'Role is required' });
    if (!role_title || typeof role_title !== 'string') return res.status(400).json({ error: 'Role title is required' });

    // Duplicate check
    const existingApp = await (sheets as any).getApplicationByEmail(email);
    if (existingApp) {
      return res.status(409).json({
        error: 'duplicate',
        existing_id: existingApp.app_id,
        existing_name: existingApp.full_name,
      });
    }

    const appId = generateAppId();
    const now = new Date().toISOString();

    // Write to Google Sheets (same structure as auto-submit)
    await (sheets as any).appendApplication({
      app_id: appId,
      timestamp: now,
      status: 'NEW',
      company_id: company_id || 'silverlight-research',
      role_id,
      role_title,
      full_name: full_name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      nationality: nationality.trim(),
      reference: (reference || '').trim(),
      blacklist_acknowledged: 'admin-logged',
      cv_link: '',
      audio_link: '',
      notes: 'Manually logged by admin',
      last_updated: now,
      started_date: '',
      email_log: 'NEW',
      rejection_date: '',
    });

    // Send confirmation email to applicant (same template as submit.ts)
    try {
      if (process.env.EMAIL_SERVER_HOST && process.env.EMAIL_SERVER_USER && process.env.EMAIL_SERVER_PASSWORD) {
        const nodemailer = await import('nodemailer');
        const transporter = nodemailer.createTransport({
          host: process.env.EMAIL_SERVER_HOST, port: 587, secure: false,
          auth: { user: process.env.EMAIL_SERVER_USER, pass: process.env.EMAIL_SERVER_PASSWORD },
        });

        const siteUrl = process.env.SITE_URL || 'https://sifat-there.vercel.app';

        await transporter.sendMail({
          from: `"Sifat Morshed" <${process.env.EMAIL_SERVER_USER}>`,
          replyTo: process.env.EMAIL_SERVER_USER,
          to: email.trim().toLowerCase(),
          subject: `Application Received - ${role_title}`,
          headers: { 'X-Mailer': 'SifatPortfolio/1.0', 'Precedence': 'bulk' },
          html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light only"><style>:root{color-scheme:light only;}</style></head><body style="margin:0;padding:0;background-color:#050505;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#050505" style="background-color:#050505;"><tr><td align="center" style="padding:20px 0;">
            <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="#050505" style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;background-color:#050505;border:1px solid #111113;border-radius:12px;overflow:hidden;">
              <tr><td bgcolor="#0A0A0B" style="background-color:#0A0A0B;border-bottom:2px solid #06b6d4;padding:28px 32px;text-align:center;">
                <p style="margin:0 0 4px;color:#475569;font-size:11px;text-transform:uppercase;letter-spacing:2px;">New Application</p>
                <h1 style="margin:0;color:#06b6d4;font-size:22px;font-weight:700;">Application Received</h1>
              </td></tr>
              <tr><td bgcolor="#050505" style="background-color:#050505;padding:28px 32px;">
                <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 16px;">Hi <strong style="color:#e2e8f0;">${full_name.trim()}</strong>,</p>
                <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 20px;">Your application for <strong style="color:#06b6d4;">${role_title}</strong> has been received and is under review.</p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="#0A0A0B" style="background-color:#0A0A0B;border:1px solid #1e293b;border-radius:8px;padding:16px;text-align:center;">
                  <p style="margin:0 0 4px;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Your Application ID</p>
                  <p style="margin:0;font-family:monospace;font-size:20px;color:#06b6d4;font-weight:700;">${appId}</p>
                </td></tr></table>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:20px;"><tr><td align="center">
                  <a href="${siteUrl}/work/status?id=${appId}" style="display:inline-block;background-color:#06b6d4;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Track Your Status</a>
                </td></tr></table>
              </td></tr>
              <tr><td bgcolor="#0A0A0B" style="background-color:#0A0A0B;border-top:1px solid #1e293b;padding:16px 32px;text-align:center;">
                <p style="color:#475569;font-size:11px;margin:0;">Sifat Morshed &middot; <a href="${siteUrl}" style="color:#06b6d4;text-decoration:none;">sifat-there.vercel.app</a></p>
              </td></tr>
            </table>
          </td></tr></table></body></html>`,
        });
      }
    } catch (emailErr) {
      console.error('Manual log email failed (non-fatal):', emailErr);
    }

    return res.status(200).json({ success: true, app_id: appId });
  } catch (error) {
    console.error('Manual log error:', error);
    const message = error instanceof Error ? error.message : 'Failed to log application';
    return res.status(500).json({ error: message });
  }
}
