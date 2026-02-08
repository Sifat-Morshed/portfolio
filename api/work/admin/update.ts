// Vercel Serverless Function: PATCH /api/work/admin/update
// Update application status

import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as sheets from '../../_lib/google-sheets';

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

const VALID_STATUSES = [
  'NEW',
  'AUDIO_PASS',
  'INTERVIEW',
  'HIRED',
  'REJECTED',
];

function setCors(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin || '';
  const allowed = (process.env.ALLOWED_ORIGIN || 'https://sifat-there.vercel.app').replace(/\/$/, '');
  const isAllowed = origin === allowed || origin.endsWith('.vercel.app');
  res.setHeader('Access-Control-Allow-Origin', isAllowed ? origin : allowed);
  res.setHeader('Access-Control-Allow-Methods', 'PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!verifyAdmin(req)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const { app_id, status, notes } = req.body;

    if (!app_id || typeof app_id !== 'string') {
      return res.status(400).json({ error: 'Missing app_id' });
    }

    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    await sheets.updateApplicationStatus(app_id, status, notes);

    // Send status change email to the applicant (non-blocking)
    try {
      if (process.env.EMAIL_SERVER_HOST && process.env.EMAIL_SERVER_USER && process.env.EMAIL_SERVER_PASSWORD) {
        const app = await sheets.getApplicationById(app_id);
        if (app && app.email) {
          const nodemailer = await import('nodemailer');
          const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_SERVER_HOST,
            port: 587,
            secure: false,
            auth: {
              user: process.env.EMAIL_SERVER_USER,
              pass: process.env.EMAIL_SERVER_PASSWORD,
            },
          });

          const siteUrl = process.env.SITE_URL || 'https://sifat-there.vercel.app';
          const statusLabels: Record<string, string> = {
            NEW: 'Under Review',
            AUDIO_PASS: 'Audio Approved ✓',
            INTERVIEW: 'Interview Stage',
            HIRED: 'Hired',
            REJECTED: 'Not Selected',
          };
          const statusColors: Record<string, string> = {
            NEW: '#94a3b8',
            AUDIO_PASS: '#eab308',
            INTERVIEW: '#3b82f6',
            HIRED: '#10b981',
            REJECTED: '#ef4444',
          };

          await transporter.sendMail({
            from: `"Sifat Morshed" <${process.env.EMAIL_SERVER_USER}>`,
            to: app.email,
            subject: `Application Update – ${statusLabels[status] || status}`,
            html: `
              <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #0A0A0B; color: #e2e8f0; border-radius: 12px; overflow: hidden;">
                <div style="background: linear-gradient(135deg, ${statusColors[status] || '#06b6d4'}, ${status === 'HIRED' ? '#06b6d4' : '#1e293b'}); padding: 24px 32px;">
                  <h2 style="margin: 0; color: #fff; font-size: 20px;">Application Status Update</h2>
                </div>
                <div style="padding: 32px;">
                  <p style="color: #94a3b8;">Hi <strong style="color: #fff;">${app.full_name}</strong>,</p>
                  <p style="color: #94a3b8;">Your application for <strong style="color: #06b6d4;">${app.role_title}</strong> has been updated:</p>
                  <div style="background: #111; border: 1px solid #222; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
                    <p style="margin: 0 0 4px; color: #64748b; font-size: 12px;">Current Status</p>
                    <p style="margin: 0; font-size: 22px; font-weight: bold; color: ${statusColors[status] || '#06b6d4'};">${statusLabels[status] || status}</p>
                  </div>
                  ${status === 'HIRED' ? '<p style="color: #10b981; font-weight: 600;">Congratulations! Welcome to the team. We will be in touch shortly with next steps.</p>' : ''}
                  ${status === 'REJECTED' ? '<p style="color: #94a3b8;">Thank you for your interest. We encourage you to apply again in the future.</p>' : ''}
                  <a href="${siteUrl}/work/status?id=${app_id}" style="display: inline-block; background: #06b6d4; color: #fff; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin-top: 8px;">View Full Status →</a>
                  <p style="color: #64748b; font-size: 12px; margin-top: 24px;">Best regards,<br>Sifat Morshed</p>
                </div>
              </div>
            `,
          });
        }
      }
    } catch (emailErr) {
      console.error('Status change email failed (non-fatal):', emailErr);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Admin update error:', error);
    return res.status(500).json({ error: 'Failed to update application' });
  }
}
