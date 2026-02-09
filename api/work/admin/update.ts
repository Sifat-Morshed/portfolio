// Vercel Serverless Function: PATCH /api/work/admin/update
// Update application status

import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as sheets from '../../lib/google-sheets.js';

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

// Daily email counter to avoid hitting Gmail limits
const emailCounter = { date: '', count: 0 };
const MAX_EMAILS_PER_DAY = 80;

function canSendEmail(): boolean {
  const today = new Date().toISOString().slice(0, 10);
  if (emailCounter.date !== today) {
    emailCounter.date = today;
    emailCounter.count = 0;
  }
  return emailCounter.count < MAX_EMAILS_PER_DAY;
}

function trackEmailSent() {
  const today = new Date().toISOString().slice(0, 10);
  if (emailCounter.date !== today) {
    emailCounter.date = today;
    emailCounter.count = 0;
  }
  emailCounter.count++;
}

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

    // Send status change email — parallel with response, timeout-guarded
    const emailPromise = (async () => {
      try {
        if (!canSendEmail()) {
          console.warn('Daily email limit reached, skipping status notification');
          return;
        }
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
              HIRED: 'Hired 🎉',
              REJECTED: 'Not Selected',
            };
            const statusColors: Record<string, string> = {
              NEW: '#94a3b8',
              AUDIO_PASS: '#eab308',
              INTERVIEW: '#3b82f6',
              HIRED: '#10b981',
              REJECTED: '#ef4444',
            };
            const statusEmoji: Record<string, string> = {
              NEW: '📋',
              AUDIO_PASS: '🎙️',
              INTERVIEW: '💼',
              HIRED: '🎉',
              REJECTED: '📝',
            };
            const stageDescriptions: Record<string, string> = {
              NEW: 'Your application has been received and is currently being reviewed by our team. We carefully evaluate every submission — your audio recording, CV, and profile details.',
              AUDIO_PASS: 'Great news! Your audio recording has been reviewed and approved. Your communication skills and tone stood out. You\'re now moving forward in the process.',
              INTERVIEW: 'Congratulations on reaching the interview stage! This means we see real potential in your profile. You\'ll receive a separate email shortly with scheduling details and what to prepare.',
              HIRED: 'Welcome to the team! 🎉 You\'ve successfully passed all stages and we\'re thrilled to have you on board. Expect an onboarding email within 24-48 hours with everything you need to get started.',
              REJECTED: 'After careful review, we\'ve decided not to move forward with your application at this time. This doesn\'t reflect on your abilities — we encourage you to apply again in the future when new positions open.',
            };
            const nextSteps: Record<string, string> = {
              NEW: '<li style="padding: 4px 0; color: #cbd5e1;">⏳ Typical review time: 1-3 business days</li><li style="padding: 4px 0; color: #cbd5e1;">📧 You\'ll receive an email when your status changes</li><li style="padding: 4px 0; color: #cbd5e1;">🔗 Track your status anytime using the link below</li>',
              AUDIO_PASS: '<li style="padding: 4px 0; color: #cbd5e1;">📞 You may be contacted for a brief interview</li><li style="padding: 4px 0; color: #cbd5e1;">✅ Make sure your phone/email is reachable</li><li style="padding: 4px 0; color: #cbd5e1;">📋 Review the role details and prepare any questions</li>',
              INTERVIEW: '<li style="padding: 4px 0; color: #cbd5e1;">📅 Watch for a scheduling email with date & time</li><li style="padding: 4px 0; color: #cbd5e1;">🎤 Prepare to discuss your experience and motivation</li><li style="padding: 4px 0; color: #cbd5e1;">💡 Be ready for a short live roleplay scenario</li>',
              HIRED: '<li style="padding: 4px 0; color: #cbd5e1;">📩 Onboarding email arriving within 24-48 hours</li><li style="padding: 4px 0; color: #cbd5e1;">🔐 You\'ll get access to training materials and systems</li><li style="padding: 4px 0; color: #cbd5e1;">📆 Your start date and schedule will be confirmed</li>',
              REJECTED: '<li style="padding: 4px 0; color: #cbd5e1;">🔄 You can re-apply when new positions open</li><li style="padding: 4px 0; color: #cbd5e1;">💪 Keep building your skills — we\'d love to see you again</li>',
            };

            await transporter.sendMail({
              from: `"Sifat Morshed" <${process.env.EMAIL_SERVER_USER}>`,
              replyTo: process.env.EMAIL_SERVER_USER,
              to: app.email,
              subject: `${statusEmoji[status] || '📋'} Application Update – ${statusLabels[status] || status}`,
              headers: {
                'X-Mailer': 'SifatPortfolio/1.0',
                'Precedence': 'bulk',
              },
              html: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #050505; color: #e2e8f0;">
                  <!-- Header -->
                  <div style="background: linear-gradient(135deg, ${statusColors[status] || '#06b6d4'}22, #0A0A0B); border-bottom: 1px solid ${statusColors[status] || '#06b6d4'}44; padding: 32px; text-align: center;">
                    <div style="font-size: 40px; margin-bottom: 12px;">${statusEmoji[status] || '📋'}</div>
                    <h1 style="margin: 0; color: #fff; font-size: 22px; font-weight: 700;">Application Status Update</h1>
                    <p style="margin: 8px 0 0; color: #64748b; font-size: 13px;">for ${app.role_title}</p>
                  </div>

                  <!-- Body -->
                  <div style="padding: 32px;">
                    <p style="color: #94a3b8; font-size: 15px; line-height: 1.6;">Hi <strong style="color: #fff;">${app.full_name}</strong>,</p>

                    <!-- Status Badge -->
                    <div style="background: #0A0A0B; border: 1px solid ${statusColors[status] || '#06b6d4'}33; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
                      <p style="margin: 0 0 8px; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Current Status</p>
                      <p style="margin: 0; font-size: 26px; font-weight: 800; color: ${statusColors[status] || '#06b6d4'};">${statusLabels[status] || status}</p>
                    </div>

                    <!-- Stage Description -->
                    <div style="background: #0A0A0B; border-left: 3px solid ${statusColors[status] || '#06b6d4'}; padding: 16px 20px; margin: 24px 0; border-radius: 0 8px 8px 0;">
                      <p style="margin: 0; color: #cbd5e1; font-size: 14px; line-height: 1.7;">${stageDescriptions[status] || ''}</p>
                    </div>

                    <!-- What Happens Next -->
                    <div style="margin: 28px 0;">
                      <h3 style="color: #fff; font-size: 15px; font-weight: 600; margin: 0 0 12px;">What happens next?</h3>
                      <ul style="list-style: none; padding: 0; margin: 0; font-size: 13px;">
                        ${nextSteps[status] || ''}
                      </ul>
                    </div>

                    <!-- Application Details -->
                    <div style="background: #0A0A0B; border: 1px solid #1e293b; border-radius: 8px; padding: 16px; margin: 24px 0;">
                      <p style="margin: 0 0 8px; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Application Details</p>
                      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                        <tr><td style="color: #64748b; padding: 4px 0;">ID</td><td style="color: #06b6d4; font-family: monospace; padding: 4px 0; text-align: right;">${app_id}</td></tr>
                        <tr><td style="color: #64748b; padding: 4px 0;">Role</td><td style="color: #fff; padding: 4px 0; text-align: right;">${app.role_title}</td></tr>
                        <tr><td style="color: #64748b; padding: 4px 0;">Applied</td><td style="color: #fff; padding: 4px 0; text-align: right;">${new Date(app.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td></tr>
                      </table>
                    </div>

                    <!-- CTA Button -->
                    <div style="text-align: center; margin: 28px 0;">
                      <a href="${siteUrl}/work/status?id=${app_id}" style="display: inline-block; background: #06b6d4; color: #fff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">View Full Status →</a>
                    </div>

                    <!-- Footer -->
                    <div style="border-top: 1px solid #1e293b; padding-top: 20px; margin-top: 32px; text-align: center;">
                      <p style="color: #475569; font-size: 12px; margin: 0 0 4px;">Best regards,</p>
                      <p style="color: #94a3b8; font-size: 13px; font-weight: 600; margin: 0;">Sifat Morshed</p>
                      <p style="color: #334155; font-size: 11px; margin: 12px 0 0;">This is an automated notification from <a href="${siteUrl}" style="color: #06b6d4; text-decoration: none;">sifat-there.vercel.app</a></p>
                    </div>
                  </div>
                </div>
              `,
            });
            trackEmailSent();
          }
        }
      } catch (emailErr) {
        console.error('Status change email failed (non-fatal):', emailErr);
      }
    })();

    // Wait max 8s for email, then respond anyway
    await Promise.race([emailPromise, new Promise((r) => setTimeout(r, 8000))]);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Admin update error:', error);
    return res.status(500).json({ error: 'Failed to update application' });
  }
}
