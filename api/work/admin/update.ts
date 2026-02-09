// Vercel Serverless Function: PATCH /api/work/admin/update
// Forward-only emails, REJECTED 30-min lock, HIRED start date, 7-day notify

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

const STATUS_RANK: Record<string, number> = {
  NEW: 0, AUDIO_PASS: 1, INTERVIEW: 2, HIRED: 3, REJECTED: 3,
};

const REJECTION_LOCK_MS = 30 * 60 * 1000; // 30-minute grace window

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

    // REJECTED LOCK: 30-min grace then permanent
    if (currentStatus === 'REJECTED') {
      const lastUpdated = new Date(app.last_updated).getTime();
      if (Date.now() - lastUpdated > REJECTION_LOCK_MS) {
        return res.status(400).json({ error: 'This application is permanently locked as Rejected. The 30-minute grace window has passed.' });
      }
    }

    // HIRED LOCK: cannot change once hired
    if (currentStatus === 'HIRED' && status !== 'HIRED') {
      return res.status(400).json({ error: 'Hired applications cannot have their status changed.' });
    }

    // Forward-only email logic
    const isForwardMove = STATUS_RANK[status] > STATUS_RANK[currentStatus];
    const alreadyEmailed = emailLog.includes(status);

    // Extra sheet fields
    const extraFields: Record<string, string> = {};

    // Set started_date on HIRED
    if (status === 'HIRED' && !app.started_date) {
      extraFields.started_date = new Date().toISOString();
    }

    // Email decision: forward moves OR first-time rejection only
    const shouldEmail = (isForwardMove && !alreadyEmailed && status !== 'NEW') ||
                        (status === 'REJECTED' && !alreadyEmailed);

    if (shouldEmail) {
      extraFields.email_log = [...emailLog, status].join(',');
    }

    // Update sheet (status + extra fields + row coloring)
    await sheets.updateApplicationStatus(app_id, status, notes, Object.keys(extraFields).length > 0 ? extraFields : undefined);

    // Send email only for qualifying transitions
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
          NEW: 'Under Review', AUDIO_PASS: 'Audio Approved', INTERVIEW: 'Interview Stage',
          HIRED: 'Hired', REJECTED: 'Not Selected',
        };
        const statusColors: Record<string, string> = {
          NEW: '#94a3b8', AUDIO_PASS: '#eab308', INTERVIEW: '#3b82f6',
          HIRED: '#10b981', REJECTED: '#ef4444',
        };
        const stageDescriptions: Record<string, string> = {
          NEW: 'Your application has been received and is currently being reviewed by our team. We carefully evaluate every submission.',
          AUDIO_PASS: 'Great news! Your audio recording has been reviewed and approved. Your communication skills and tone stood out. You are now moving forward in the process.',
          INTERVIEW: 'Congratulations on reaching the interview stage! This means we see real potential in your profile. You will receive scheduling details shortly.',
          HIRED: 'Welcome to the team! You have successfully passed all stages and we are thrilled to have you on board. Expect an onboarding email within 24-48 hours.',
          REJECTED: 'After careful review, we have decided not to move forward with your application at this time. This does not reflect on your abilities -- we encourage you to apply again in the future.',
        };
        const nextSteps: Record<string, string> = {
          NEW: '<li style="padding:4px 0;color:#cbd5e1;">Typical review time: 1-3 business days</li><li style="padding:4px 0;color:#cbd5e1;">You will receive an email when your status changes</li><li style="padding:4px 0;color:#cbd5e1;">Track your status anytime using the link below</li>',
          AUDIO_PASS: '<li style="padding:4px 0;color:#cbd5e1;">You may be contacted for a brief interview</li><li style="padding:4px 0;color:#cbd5e1;">Make sure your phone and email are reachable</li><li style="padding:4px 0;color:#cbd5e1;">Review the role details and prepare any questions</li>',
          INTERVIEW: '<li style="padding:4px 0;color:#cbd5e1;">Watch for a scheduling email with date and time</li><li style="padding:4px 0;color:#cbd5e1;">Prepare to discuss your experience and motivation</li><li style="padding:4px 0;color:#cbd5e1;">Be ready for a short live roleplay scenario</li>',
          HIRED: '<li style="padding:4px 0;color:#cbd5e1;">Onboarding email arriving within 24-48 hours</li><li style="padding:4px 0;color:#cbd5e1;">You will get access to training materials and systems</li><li style="padding:4px 0;color:#cbd5e1;">Your start date and schedule will be confirmed</li>',
          REJECTED: '<li style="padding:4px 0;color:#cbd5e1;">You can re-apply when new positions open</li><li style="padding:4px 0;color:#cbd5e1;">Keep building your skills</li>',
        };

        await transporter.sendMail({
          from: `"Sifat Morshed" <${process.env.EMAIL_SERVER_USER}>`,
          replyTo: process.env.EMAIL_SERVER_USER,
          to: app.email,
          subject: `Application Update - ${statusLabels[status] || status}`,
          headers: { 'X-Mailer': 'SifatPortfolio/1.0', 'Precedence': 'bulk' },
          html: `
            <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#050505;color:#e2e8f0;">
              <div style="background:linear-gradient(135deg,${statusColors[status] || '#06b6d4'}22,#0A0A0B);border-bottom:1px solid ${statusColors[status] || '#06b6d4'}44;padding:32px;text-align:center;">
                <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">Application Status Update</h1>
                <p style="margin:8px 0 0;color:#64748b;font-size:13px;">for ${app.role_title}</p>
              </div>
              <div style="padding:32px;">
                <p style="color:#94a3b8;font-size:15px;line-height:1.6;">Hi <strong style="color:#fff;">${app.full_name}</strong>,</p>
                <div style="background:#0A0A0B;border:1px solid ${statusColors[status] || '#06b6d4'}33;border-radius:12px;padding:24px;margin:24px 0;text-align:center;">
                  <p style="margin:0 0 8px;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Current Status</p>
                  <p style="margin:0;font-size:26px;font-weight:800;color:${statusColors[status] || '#06b6d4'};">${statusLabels[status] || status}</p>
                </div>
                <div style="background:#0A0A0B;border-left:3px solid ${statusColors[status] || '#06b6d4'};padding:16px 20px;margin:24px 0;border-radius:0 8px 8px 0;">
                  <p style="margin:0;color:#cbd5e1;font-size:14px;line-height:1.7;">${stageDescriptions[status] || ''}</p>
                </div>
                <div style="margin:28px 0;">
                  <h3 style="color:#fff;font-size:15px;font-weight:600;margin:0 0 12px;">What happens next?</h3>
                  <ul style="list-style:none;padding:0;margin:0;font-size:13px;">${nextSteps[status] || ''}</ul>
                </div>
                <div style="background:#0A0A0B;border:1px solid #1e293b;border-radius:8px;padding:16px;margin:24px 0;">
                  <p style="margin:0 0 8px;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Application Details</p>
                  <table style="width:100%;border-collapse:collapse;font-size:13px;">
                    <tr><td style="color:#64748b;padding:4px 0;">ID</td><td style="color:#06b6d4;font-family:monospace;padding:4px 0;text-align:right;">${app_id}</td></tr>
                    <tr><td style="color:#64748b;padding:4px 0;">Role</td><td style="color:#fff;padding:4px 0;text-align:right;">${app.role_title}</td></tr>
                    <tr><td style="color:#64748b;padding:4px 0;">Applied</td><td style="color:#fff;padding:4px 0;text-align:right;">${new Date(app.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td></tr>
                  </table>
                </div>
                <div style="text-align:center;margin:28px 0;">
                  <a href="${siteUrl}/work/status?id=${app_id}" style="display:inline-block;background:#06b6d4;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">View Full Status</a>
                </div>
                <div style="border-top:1px solid #1e293b;padding-top:20px;margin-top:32px;text-align:center;">
                  <p style="color:#475569;font-size:12px;margin:0 0 4px;">Best regards,</p>
                  <p style="color:#94a3b8;font-size:13px;font-weight:600;margin:0;">Sifat Morshed</p>
                  <p style="color:#334155;font-size:11px;margin:12px 0 0;">This is an automated notification from <a href="${siteUrl}" style="color:#06b6d4;text-decoration:none;">sifat-there.vercel.app</a></p>
                </div>
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
