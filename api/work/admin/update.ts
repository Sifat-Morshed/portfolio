// Vercel Serverless Function: PATCH /api/work/admin/update
// Admin has FULL override power — no locks. Emails client ONCE per status level.

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

const VALID_STATUSES = ['NEW', 'AUDIO_PASS', 'INTERVIEW', 'HIRED', 'REJECTED'];

const emailCounter = { date: '', count: 0 };
const MAX_EMAILS_PER_DAY = 80;

function canSendEmail(): boolean {
  const today = new Date().toISOString().slice(0, 10);
  if (emailCounter.date !== today) { emailCounter.date = today; emailCounter.count = 0; }
  return emailCounter.count < MAX_EMAILS_PER_DAY;
}
function trackEmailSent() {
  const today = new Date().toISOString().slice(0, 10);
  if (emailCounter.date !== today) { emailCounter.date = today; emailCounter.count = 0; }
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
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' });
  if (!verifyAdmin(req)) return res.status(403).json({ error: 'Forbidden' });

  try {
    const { app_id, status, notes } = req.body;
    if (!app_id || typeof app_id !== 'string') return res.status(400).json({ error: 'Missing app_id' });
    if (!status || !VALID_STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    // Fetch current application
    const app = await sheets.getApplicationById(app_id);
    if (!app) return res.status(404).json({ error: 'Application not found' });

    const currentStatus = app.status;
    const emailLog = (app.email_log || '').split(',').filter(Boolean);

    // NO LOCKS — Admin has full override power to change ANY status at ANY time

    // Email-once logic: only email client for a status they haven't been emailed about before
    const alreadyEmailed = emailLog.includes(status);
    const shouldEmail = !alreadyEmailed && status !== 'NEW' && status !== currentStatus;

    // Extra sheet fields
    const extraFields: Record<string, string> = {};

    // Set started_date on HIRED (only if first time)
    if (status === 'HIRED' && !app.started_date) {
      extraFields.started_date = new Date().toISOString();
    }

    // Clear started_date if moving AWAY from HIRED
    if (status !== 'HIRED' && currentStatus === 'HIRED') {
      extraFields.started_date = '';
    }

    // Set rejection_date on REJECTED
    if (status === 'REJECTED') {
      extraFields.rejection_date = new Date().toISOString();
    }
    // Clear rejection_date if moving AWAY from REJECTED
    if (status !== 'REJECTED' && currentStatus === 'REJECTED') {
      extraFields.rejection_date = '';
    }

    // Always log the transition internally, email or not
    const internalLog = [...emailLog, `${status}@${new Date().toISOString().slice(0,16)}`].join(',');
    extraFields.email_log = shouldEmail ? [...emailLog, status].join(',') : internalLog;

    // Update sheet (status + extra fields + row coloring)
    await sheets.updateApplicationStatus(app_id, status, notes, Object.keys(extraFields).length > 0 ? extraFields : undefined);

    // Send email only for qualifying transitions (first-time per status)
    const emailPromise = (async () => {
      try {
        if (!shouldEmail || !canSendEmail()) return;
        if (!process.env.EMAIL_SERVER_HOST || !process.env.EMAIL_SERVER_USER || !process.env.EMAIL_SERVER_PASSWORD) return;
        if (!app.email) return;

        const nodemailer = await import('nodemailer');
        const transporter = nodemailer.createTransport({
          host: process.env.EMAIL_SERVER_HOST, port: 587, secure: false,
          auth: { user: process.env.EMAIL_SERVER_USER, pass: process.env.EMAIL_SERVER_PASSWORD },
        });

        const siteUrl = process.env.SITE_URL || 'https://sifat-there.vercel.app';
        const statusLabels: Record<string, string> = {
          AUDIO_PASS: 'Audio Approved', INTERVIEW: 'Interview Stage',
          HIRED: 'Hired', REJECTED: 'Not Selected',
        };
        const statusColors: Record<string, string> = {
          AUDIO_PASS: '#eab308', INTERVIEW: '#3b82f6',
          HIRED: '#10b981', REJECTED: '#ef4444',
        };
        const stageDescriptions: Record<string, string> = {
          AUDIO_PASS: 'Great news! Your audio recording has been reviewed and approved. Your communication skills and tone stood out. You are now moving forward in the process.',
          INTERVIEW: 'Congratulations on reaching the interview stage! This means we see real potential in your profile. You will receive scheduling details shortly.',
          HIRED: 'Welcome to the team! You have successfully passed all stages and we are thrilled to have you on board. Expect an onboarding email within 24-48 hours.',
          REJECTED: 'After careful review, we have decided not to move forward with your application at this time. This does not reflect on your abilities -- we encourage you to apply again in the future.',
        };
        const nextSteps: Record<string, string> = {
          AUDIO_PASS: '<li style="padding:6px 0;color:#94a3b8;font-size:13px;">You may be contacted for a brief interview</li><li style="padding:6px 0;color:#94a3b8;font-size:13px;">Make sure your phone and email are reachable</li><li style="padding:6px 0;color:#94a3b8;font-size:13px;">Review the role details and prepare any questions</li>',
          INTERVIEW: '<li style="padding:6px 0;color:#94a3b8;font-size:13px;">Watch for a scheduling email with date and time</li><li style="padding:6px 0;color:#94a3b8;font-size:13px;">Prepare to discuss your experience and motivation</li><li style="padding:6px 0;color:#94a3b8;font-size:13px;">Be ready for a short live roleplay scenario</li>',
          HIRED: '<li style="padding:6px 0;color:#94a3b8;font-size:13px;">Onboarding email arriving within 24-48 hours</li><li style="padding:6px 0;color:#94a3b8;font-size:13px;">You will get access to training materials and systems</li><li style="padding:6px 0;color:#94a3b8;font-size:13px;">Your start date and schedule will be confirmed</li>',
          REJECTED: '<li style="padding:6px 0;color:#94a3b8;font-size:13px;">You can re-apply when new positions open</li><li style="padding:6px 0;color:#94a3b8;font-size:13px;">Keep building your skills and check back later</li>',
        };

        const sc = statusColors[status] || '#06b6d4';
        const sl = statusLabels[status] || status;

        await transporter.sendMail({
          from: `"Sifat Morshed" <${process.env.EMAIL_SERVER_USER}>`,
          replyTo: process.env.EMAIL_SERVER_USER,
          to: app.email,
          subject: `Application Update - ${sl}`,
          headers: { 'X-Mailer': 'SifatPortfolio/1.0', 'Precedence': 'bulk' },
          html: `
            <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#050505;border:1px solid #111113;border-radius:12px;overflow:hidden;">
              <div style="background:#0A0A0B;border-bottom:2px solid ${sc};padding:28px 32px;text-align:center;">
                <p style="margin:0 0 4px;color:#475569;font-size:11px;text-transform:uppercase;letter-spacing:2px;">Application Update</p>
                <h1 style="margin:0;color:${sc};font-size:24px;font-weight:700;">${sl}</h1>
                <p style="margin:8px 0 0;color:#64748b;font-size:13px;">${app.role_title}</p>
              </div>
              <div style="padding:28px 32px;background:#050505;">
                <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 20px;">Hi <strong style="color:#e2e8f0;">${app.full_name}</strong>,</p>
                <div style="background:#0A0A0B;border:1px solid #1e293b;border-left:3px solid ${sc};padding:16px 20px;margin:0 0 24px;border-radius:0 8px 8px 0;">
                  <p style="margin:0;color:#cbd5e1;font-size:14px;line-height:1.7;">${stageDescriptions[status] || ''}</p>
                </div>
                ${nextSteps[status] ? `
                <div style="margin:0 0 24px;">
                  <p style="color:#e2e8f0;font-size:14px;font-weight:600;margin:0 0 10px;">What happens next</p>
                  <ul style="list-style:none;padding:0;margin:0;">${nextSteps[status]}</ul>
                </div>` : ''}
                <div style="background:#0A0A0B;border:1px solid #1e293b;border-radius:8px;padding:14px 16px;margin:0 0 24px;">
                  <table style="width:100%;border-collapse:collapse;font-size:13px;">
                    <tr><td style="color:#64748b;padding:4px 0;">App ID</td><td style="color:#06b6d4;font-family:monospace;padding:4px 0;text-align:right;">${app_id}</td></tr>
                    <tr><td style="color:#64748b;padding:4px 0;">Role</td><td style="color:#e2e8f0;padding:4px 0;text-align:right;">${app.role_title}</td></tr>
                    <tr><td style="color:#64748b;padding:4px 0;">Applied</td><td style="color:#e2e8f0;padding:4px 0;text-align:right;">${new Date(app.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td></tr>
                  </table>
                </div>
                <div style="text-align:center;margin:0 0 24px;">
                  <a href="${siteUrl}/work/status?id=${app_id}" style="display:inline-block;background:${sc};color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Track Your Status</a>
                </div>
              </div>
              <div style="background:#0A0A0B;border-top:1px solid #1e293b;padding:16px 32px;text-align:center;">
                <p style="color:#475569;font-size:11px;margin:0;">Sifat Morshed &middot; <a href="${siteUrl}" style="color:#06b6d4;text-decoration:none;">sifat-there.vercel.app</a></p>
              </div>
            </div>
          `,
        });
        trackEmailSent();
      } catch (emailErr) {
        console.error('Status change email failed (non-fatal):', emailErr);
      }
    })();

    await Promise.race([emailPromise, new Promise((r) => setTimeout(r, 8000))]);

    // Trigger 7-day worker check when someone is hired
    if (status === 'HIRED') {
      check7DayWorkers().catch((e) => console.error('7-day check failed:', e));
    }

    return res.status(200).json({ success: true, email_sent: shouldEmail });
  } catch (error) {
    console.error('Admin update error:', error);
    const message = error instanceof Error ? error.message : 'Failed to update application';
    return res.status(500).json({ error: message });
  }
}

// Check all HIRED workers and send 7-day milestone email to admin
async function check7DayWorkers() {
  try {
    const all = await sheets.getAllApplications();
    const adminEmail = process.env.ADMIN_NOTIFY_EMAIL || process.env.ADMIN_EMAIL || '';
    if (!adminEmail) return;

    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    const completedWorkers = all.filter((a: Record<string, string>) => {
      if (a.status !== 'HIRED' || !a.started_date) return false;
      if ((a.email_log || '').includes('7DAY_NOTIFIED')) return false;
      const started = new Date(a.started_date).getTime();
      return started <= sevenDaysAgo && started > (sevenDaysAgo - 2 * 24 * 60 * 60 * 1000);
    });

    if (completedWorkers.length === 0) return;
    if (!process.env.EMAIL_SERVER_HOST || !process.env.EMAIL_SERVER_USER || !process.env.EMAIL_SERVER_PASSWORD) return;

    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST, port: 587, secure: false,
      auth: { user: process.env.EMAIL_SERVER_USER, pass: process.env.EMAIL_SERVER_PASSWORD },
    });

    const workerRows = completedWorkers.map((w: Record<string, string>) =>
      `<tr><td style="color:#fff;padding:6px 0;">${w.full_name}</td><td style="color:#06b6d4;padding:6px 0;">${w.role_title}</td><td style="color:#10b981;padding:6px 0;">${new Date(w.started_date).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</td></tr>`
    ).join('');

    await transporter.sendMail({
      from: `"Work With Me Bot" <${process.env.EMAIL_SERVER_USER}>`,
      to: adminEmail,
      subject: `7-Day Milestone: ${completedWorkers.length} worker(s) completed their first week`,
      html: `
        <div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#0A0A0B;color:#e2e8f0;border-radius:12px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#10b981,#06b6d4);padding:24px 32px;">
            <h2 style="margin:0;color:#fff;font-size:18px;">7-Day Worker Milestone</h2>
          </div>
          <div style="padding:24px 32px;">
            <p style="color:#94a3b8;">The following worker(s) have completed 7 days since being hired:</p>
            <table style="width:100%;border-collapse:collapse;font-size:13px;margin:16px 0;">
              <tr><td style="color:#64748b;padding:6px 0;font-weight:600;">Name</td><td style="color:#64748b;padding:6px 0;font-weight:600;">Role</td><td style="color:#64748b;padding:6px 0;font-weight:600;">Started</td></tr>
              ${workerRows}
            </table>
            <p style="color:#64748b;font-size:12px;margin-top:16px;">These workers are now counted in your Earnings tracker.</p>
          </div>
        </div>
      `,
    });

    // Mark each as notified
    for (const w of completedWorkers) {
      const wr = w as Record<string, string>;
      const newLog = (wr.email_log || '') ? `${wr.email_log},7DAY_NOTIFIED` : '7DAY_NOTIFIED';
      await sheets.updateApplicationStatus(wr.app_id, wr.status, undefined, { email_log: newLog });
    }
  } catch (e) {
    console.error('7-day worker check failed:', e);
  }
}
