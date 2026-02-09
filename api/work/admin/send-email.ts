// Vercel Serverless Function: POST /api/work/admin/send-email
// Admin manual email sender — uses same dark theme template

import type { VercelRequest, VercelResponse } from '@vercel/node';

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
    const { to, subject, content } = req.body;

    if (!to || typeof to !== 'string' || !to.includes('@')) {
      return res.status(400).json({ error: 'Valid email address required' });
    }
    if (!subject || typeof subject !== 'string') {
      return res.status(400).json({ error: 'Subject is required' });
    }
    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'Content is required' });
    }

    if (!process.env.EMAIL_SERVER_HOST || !process.env.EMAIL_SERVER_USER || !process.env.EMAIL_SERVER_PASSWORD) {
      return res.status(500).json({ error: 'Email server not configured' });
    }

    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST, port: 587, secure: false,
      auth: { user: process.env.EMAIL_SERVER_USER, pass: process.env.EMAIL_SERVER_PASSWORD },
    });

    const siteUrl = process.env.SITE_URL || 'https://sifat-there.vercel.app';

    // Convert line breaks to <br> for HTML
    const htmlContent = content.replace(/\n/g, '<br>');

    await transporter.sendMail({
      from: `"Sifat Morshed" <${process.env.EMAIL_SERVER_USER}>`,
      replyTo: process.env.EMAIL_SERVER_USER,
      to,
      subject,
      headers: { 'X-Mailer': 'SifatPortfolio/1.0' },
      html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light only"><style>:root{color-scheme:light only;}</style></head><body style="margin:0;padding:0;background-color:#050505;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#050505" style="background-color:#050505;"><tr><td align="center" style="padding:20px 0;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="#050505" style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;background-color:#050505;border:1px solid #111113;border-radius:12px;overflow:hidden;">
          <tr><td bgcolor="#0A0A0B" style="background-color:#0A0A0B;border-bottom:2px solid #06b6d4;padding:28px 32px;text-align:center;">
            <h1 style="margin:0;color:#e2e8f0;font-size:20px;font-weight:700;">${subject}</h1>
          </td></tr>
          <tr><td bgcolor="#050505" style="background-color:#050505;padding:28px 32px;">
            <div style="color:#94a3b8;font-size:14px;line-height:1.8;">${htmlContent}</div>
          </td></tr>
          <tr><td bgcolor="#0A0A0B" style="background-color:#0A0A0B;border-top:1px solid #1e293b;padding:16px 32px;text-align:center;">
            <p style="color:#475569;font-size:11px;margin:0;">Sifat Morshed &middot; <a href="${siteUrl}" style="color:#06b6d4;text-decoration:none;">sifat-there.vercel.app</a></p>
          </td></tr>
        </table>
      </td></tr></table></body></html>`,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Manual email error:', error);
    const message = error instanceof Error ? error.message : 'Failed to send email';
    return res.status(500).json({ error: message });
  }
}
