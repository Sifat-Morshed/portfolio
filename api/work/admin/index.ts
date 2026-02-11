// Vercel Serverless Function: /api/work/admin
// Consolidated admin endpoint — routes by ?action= query parameter
// Merges: list, update, delete, bulk-delete, export, send-email, manual-log, self-destruct
// This keeps us under Vercel Hobby's 12-function limit

import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as sheets from '../../lib/google-sheets.js';

// ─── Shared Helpers ────────────────────────────────────────────────────────────

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

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

// ─── Main Router ───────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!verifyAdmin(req)) return res.status(403).json({ error: 'Forbidden' });

  const action = (req.query.action as string) || '';

  switch (action) {
    case 'list':               return handleList(req, res);
    case 'update':             return handleUpdate(req, res);
    case 'delete':             return handleDelete(req, res);
    case 'bulk-delete':        return handleBulkDelete(req, res);
    case 'export':             return handleExport(req, res);
    case 'send-email':         return handleSendEmail(req, res);
    case 'manual-log':         return handleManualLog(req, res);
    case 'self-destruct':      return handleSelfDestruct(req, res);
    case 'get-blocked':        return handleGetBlockedCountries(req, res);
    case 'update-blocked':     return handleUpdateBlockedCountries(req, res);
    case 'list-interested':    return handleListInterested(req, res);
    case 'notify-interested':  return handleNotifyInterested(req, res);
    default:
      return res.status(400).json({ error: `Unknown action: ${action}` });
  }
}

// ─── LIST ──────────────────────────────────────────────────────────────────────

async function handleList(_req: VercelRequest, res: VercelResponse) {
  try {
    const applications = await (sheets as any).getAllApplications();
    return res.status(200).json(applications);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Admin list error:', message, error);
    return res.status(500).json({ error: 'Failed to fetch applications', detail: message });
  }
}

// ─── UPDATE ────────────────────────────────────────────────────────────────────

const VALID_STATUSES = ['NEW', 'AUDIO_PASS', 'INTERVIEW', 'HIRED', 'REJECTED'];

async function handleUpdate(req: VercelRequest, res: VercelResponse) {
  try {
    const { app_id, status, notes } = req.body;
    if (!app_id || typeof app_id !== 'string') return res.status(400).json({ error: 'Missing app_id' });
    if (!status || !VALID_STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const app = await (sheets as any).getApplicationById(app_id);
    if (!app) return res.status(404).json({ error: 'Application not found' });

    const currentStatus = app.status;
    const emailLog = (app.email_log || '').split(',').filter(Boolean);
    const alreadyEmailed = emailLog.includes(status);
    const shouldEmail = !alreadyEmailed && status !== 'NEW' && status !== currentStatus;

    const extraFields: Record<string, string> = {};
    if (status === 'HIRED' && !app.started_date) extraFields.started_date = new Date().toISOString();
    if (status !== 'HIRED' && currentStatus === 'HIRED') extraFields.started_date = '';
    if (status === 'REJECTED') extraFields.rejection_date = new Date().toISOString();
    if (status !== 'REJECTED' && currentStatus === 'REJECTED') extraFields.rejection_date = '';

    const internalLog = [...emailLog, `${status}@${new Date().toISOString().slice(0,16)}`].join(',');
    extraFields.email_log = shouldEmail ? [...emailLog, status].join(',') : internalLog;

    await (sheets as any).updateApplicationStatus(app_id, status, notes, Object.keys(extraFields).length > 0 ? extraFields : undefined);

    // Send email for qualifying transitions
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

        const emailHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light only"><style>:root{color-scheme:light only;}body,table,td{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}u+.body .gm{display:block!important;}</style></head><body style="margin:0;padding:0;background-color:#050505;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#050505" style="background-color:#050505;"><tr><td align="center" style="padding:20px 0;">
            <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="#050505" style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;background-color:#050505;border:1px solid #111113;border-radius:12px;overflow:hidden;">
              <tr><td bgcolor="#0A0A0B" style="background-color:#0A0A0B;border-bottom:2px solid ${sc};padding:28px 32px;text-align:center;">
                <p style="margin:0 0 4px;color:#475569;font-size:11px;text-transform:uppercase;letter-spacing:2px;">Application Update</p>
                <h1 style="margin:0;color:${sc};font-size:24px;font-weight:700;">${sl}</h1>
                <p style="margin:8px 0 0;color:#64748b;font-size:13px;">${app.role_title}</p>
              </td></tr>
              <tr><td bgcolor="#050505" style="background-color:#050505;padding:28px 32px;">
                <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 20px;">Hi <strong style="color:#e2e8f0;">${app.full_name}</strong>,</p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="#0A0A0B" style="background-color:#0A0A0B;border:1px solid #1e293b;border-left:3px solid ${sc};padding:16px 20px;border-radius:0 8px 8px 0;">
                  <p style="margin:0;color:#cbd5e1;font-size:14px;line-height:1.7;">${stageDescriptions[status] || ''}</p>
                </td></tr></table>
                ${nextSteps[status] ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;"><tr><td>
                  <p style="color:#e2e8f0;font-size:14px;font-weight:600;margin:0 0 10px;">What happens next</p>
                  <ul style="list-style:none;padding:0;margin:0;">${nextSteps[status]}</ul>
                </td></tr></table>` : ''}
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;"><tr><td bgcolor="#0A0A0B" style="background-color:#0A0A0B;border:1px solid #1e293b;border-radius:8px;padding:14px 16px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:13px;">
                    <tr><td style="color:#64748b;padding:4px 0;">App ID</td><td style="color:#06b6d4;font-family:monospace;padding:4px 0;text-align:right;">${app_id}</td></tr>
                    <tr><td style="color:#64748b;padding:4px 0;">Role</td><td style="color:#e2e8f0;padding:4px 0;text-align:right;">${app.role_title}</td></tr>
                    <tr><td style="color:#64748b;padding:4px 0;">Applied</td><td style="color:#e2e8f0;padding:4px 0;text-align:right;">${new Date(app.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td></tr>
                  </table>
                </td></tr></table>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;"><tr><td align="center">
                  <a href="${siteUrl}/work/status?id=${app_id}" style="display:inline-block;background-color:${sc};color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Track Your Status</a>
                </td></tr></table>
              </td></tr>
              <tr><td bgcolor="#0A0A0B" style="background-color:#0A0A0B;border-top:1px solid #1e293b;padding:16px 32px;text-align:center;">
                <p style="color:#475569;font-size:11px;margin:0;">Sifat Morshed &middot; <a href="${siteUrl}" style="color:#06b6d4;text-decoration:none;">sifat-there.vercel.app</a></p>
              </td></tr>
            </table>
        </td></tr></table></body></html>`;

        await transporter.sendMail({
          from: `"Sifat Morshed" <${process.env.EMAIL_SERVER_USER}>`,
          replyTo: process.env.EMAIL_SERVER_USER,
          to: app.email,
          subject: `Application Update - ${sl}`,
          headers: { 'X-Mailer': 'SifatPortfolio/1.0', 'Precedence': 'bulk' },
          html: emailHtml,
        });
        trackEmailSent();
      } catch (emailErr) {
        console.error('Status change email failed (non-fatal):', emailErr);
      }
    })();

    await Promise.race([emailPromise, new Promise((r) => setTimeout(r, 8000))]);

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

async function check7DayWorkers() {
  try {
    const all = await (sheets as any).getAllApplications();
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
      html: `<div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#0A0A0B;color:#e2e8f0;border-radius:12px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#10b981,#06b6d4);padding:24px 32px;"><h2 style="margin:0;color:#fff;font-size:18px;">7-Day Worker Milestone</h2></div>
        <div style="padding:24px 32px;">
          <p style="color:#94a3b8;">The following worker(s) have completed 7 days since being hired:</p>
          <table style="width:100%;border-collapse:collapse;font-size:13px;margin:16px 0;">
            <tr><td style="color:#64748b;padding:6px 0;font-weight:600;">Name</td><td style="color:#64748b;padding:6px 0;font-weight:600;">Role</td><td style="color:#64748b;padding:6px 0;font-weight:600;">Started</td></tr>
            ${workerRows}
          </table>
          <p style="color:#64748b;font-size:12px;margin-top:16px;">These workers are now counted in your Earnings tracker.</p>
        </div>
      </div>`,
    });

    for (const w of completedWorkers) {
      const wr = w as Record<string, string>;
      const newLog = (wr.email_log || '') ? `${wr.email_log},7DAY_NOTIFIED` : '7DAY_NOTIFIED';
      await (sheets as any).updateApplicationStatus(wr.app_id, wr.status, undefined, { email_log: newLog });
    }
  } catch (e) {
    console.error('7-day worker check failed:', e);
  }
}

// ─── DELETE ────────────────────────────────────────────────────────────────────

async function handleDelete(req: VercelRequest, res: VercelResponse) {
  try {
    const { app_id } = req.body || {};
    if (!app_id || typeof app_id !== 'string') return res.status(400).json({ error: 'Missing app_id' });
    await (sheets as any).deleteApplication(app_id);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Admin delete error:', error);
    return res.status(500).json({ error: 'Failed to delete application' });
  }
}

// ─── BULK DELETE ───────────────────────────────────────────────────────────────

async function handleBulkDelete(req: VercelRequest, res: VercelResponse) {
  try {
    const { app_ids } = req.body || {};
    if (!Array.isArray(app_ids) || app_ids.length === 0) return res.status(400).json({ error: 'app_ids must be a non-empty array' });
    if (app_ids.length > 50) return res.status(400).json({ error: 'Maximum 50 deletions at once' });

    const results: { id: string; success: boolean; error?: string }[] = [];
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
    return res.status(200).json({ success: true, deleted: succeeded, failed, details: failed > 0 ? results.filter(r => !r.success) : undefined });
  } catch (error) {
    console.error('Bulk delete error:', error);
    return res.status(500).json({ error: 'Failed to bulk delete applications' });
  }
}

// ─── EXPORT ────────────────────────────────────────────────────────────────────

async function handleExport(_req: VercelRequest, res: VercelResponse) {
  try {
    const csv = await (sheets as any).exportApplicationsCSV();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="applications_${Date.now()}.csv"`);
    return res.status(200).send(csv);
  } catch (error) {
    console.error('Admin export error:', error);
    return res.status(500).json({ error: 'Failed to export applications' });
  }
}

// ─── SEND EMAIL ────────────────────────────────────────────────────────────────

async function handleSendEmail(req: VercelRequest, res: VercelResponse) {
  try {
    const { to, subject, content } = req.body;
    if (!to || typeof to !== 'string' || !to.includes('@')) return res.status(400).json({ error: 'Valid email address required' });
    if (!subject || typeof subject !== 'string') return res.status(400).json({ error: 'Subject is required' });
    if (!content || typeof content !== 'string') return res.status(400).json({ error: 'Content is required' });
    if (!process.env.EMAIL_SERVER_HOST || !process.env.EMAIL_SERVER_USER || !process.env.EMAIL_SERVER_PASSWORD) return res.status(500).json({ error: 'Email server not configured' });

    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST, port: 587, secure: false,
      auth: { user: process.env.EMAIL_SERVER_USER, pass: process.env.EMAIL_SERVER_PASSWORD },
    });

    const siteUrl = process.env.SITE_URL || 'https://sifat-there.vercel.app';
    const htmlContent = content.replace(/\n/g, '<br>');

    await transporter.sendMail({
      from: `"Sifat Morshed" <${process.env.EMAIL_SERVER_USER}>`,
      replyTo: process.env.EMAIL_SERVER_USER,
      to, subject,
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

// ─── MANUAL LOG ────────────────────────────────────────────────────────────────

async function handleManualLog(req: VercelRequest, res: VercelResponse) {
  try {
    const { full_name, email, phone, nationality, role_id, role_title, company_id, reference } = req.body || {};

    if (!full_name || typeof full_name !== 'string') return res.status(400).json({ error: 'Name is required' });
    if (!email || typeof email !== 'string' || !email.includes('@')) return res.status(400).json({ error: 'Valid email is required' });
    if (!phone || typeof phone !== 'string') return res.status(400).json({ error: 'Phone is required' });
    const cleanPhone = phone.replace(/\s/g, '');
    if (!/^\+[0-9]+$/.test(cleanPhone)) return res.status(400).json({ error: 'Phone must start with + and contain only numbers' });
    if (!nationality || typeof nationality !== 'string') return res.status(400).json({ error: 'Nationality is required' });
    if (!role_id || typeof role_id !== 'string') return res.status(400).json({ error: 'Role is required' });
    if (!role_title || typeof role_title !== 'string') return res.status(400).json({ error: 'Role title is required' });

    const existingApp = await (sheets as any).getApplicationByEmail(email);
    if (existingApp) {
      return res.status(409).json({ error: 'duplicate', existing_id: existingApp.app_id, existing_name: existingApp.full_name });
    }

    const appId = generateAppId();
    const now = new Date().toISOString();

    await (sheets as any).appendApplication({
      app_id: appId, timestamp: now, status: 'NEW',
      company_id: company_id || 'silverlight-research', role_id, role_title,
      full_name: full_name.trim(), email: email.trim().toLowerCase(), phone: phone.trim(),
      nationality: nationality.trim(), reference: (reference || '').trim(),
      blacklist_acknowledged: 'admin-logged', cv_link: '', audio_link: '',
      notes: 'Manually logged by admin', last_updated: now,
      started_date: '', email_log: 'NEW', rejection_date: '',
    });

    // Send confirmation email
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

// ─── SELF-DESTRUCT ─────────────────────────────────────────────────────────────

const REPO_OWNER = 'Sifat-Morshed';
const REPO_NAME = 'portfolio';

async function githubApi(path: string, options: RequestInit = {}): Promise<Response> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN not configured');
  const resp = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(options.headers || {}),
    },
  });
  if (!resp.ok && resp.status !== 404) {
    const text = await resp.text();
    throw new Error(`GitHub API ${resp.status}: ${text}`);
  }
  return resp;
}

function buildDestructionPage(date: string): string {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Site Terminated</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#050505;font-family:'Segoe UI',system-ui,-apple-system,sans-serif;color:#e2e8f0;overflow:hidden}.container{text-align:center;padding:3rem 2rem;max-width:520px}.icon{font-size:4rem;margin-bottom:1.5rem;opacity:0.6}h1{font-size:1.75rem;font-weight:700;color:#ef4444;margin-bottom:0.75rem;letter-spacing:-0.02em}p{color:#64748b;font-size:0.95rem;line-height:1.7;margin-bottom:0.5rem}.date{font-family:monospace;color:#475569;font-size:0.8rem;margin-top:1.5rem;padding:0.5rem 1rem;background:#0A0A0B;border:1px solid #1e293b;border-radius:6px;display:inline-block}.line{width:60px;height:2px;background:#ef4444;margin:1.5rem auto;opacity:0.4}</style>
</head><body><div class="container"><div class="icon">&#9760;</div><h1>This Site Has Been Permanently Shut Down</h1><div class="line"></div><p>All code, data, and files have been irreversibly destroyed by the owner.</p><p>There is nothing left here.</p><div class="date">Terminated: ${date}</div></div></body></html>`;
}

async function handleSelfDestruct(req: VercelRequest, res: VercelResponse) {
  try {
    const { password, final_answer } = req.body;
    const correctPass = process.env.SELF_DESTRUCT_PASS || '';
    const correctFinal = process.env.SELF_DESTRUCT_FINAL || '';

    if (!correctPass || !correctFinal) return res.status(500).json({ error: 'Self-destruct not configured on server' });
    if (!password || password !== correctPass) return res.status(403).json({ error: 'Incorrect password' });
    if (!final_answer || final_answer.trim().toLowerCase() !== correctFinal.trim().toLowerCase()) return res.status(403).json({ error: 'Incorrect final answer' });

    const timestamp = new Date().toISOString();
    const dateStr = new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'long' });
    const results: string[] = [];

    // Phase 1: Delete ALL Google Sheet data
    try {
      const allApps = await (sheets as any).getAllApplications();
      let deleted = 0;
      for (const app of allApps) {
        try { await (sheets as any).deleteApplication((app as Record<string, string>).app_id); deleted++; } catch (e) { console.error('Sheet delete fail:', (app as Record<string, string>).app_id, e); }
      }
      results.push(`Sheet: ${deleted} entries destroyed`);
    } catch (e) { results.push(`Sheet: failed - ${e instanceof Error ? e.message : 'unknown'}`); }

    // Phase 2: Nuke GitHub repo
    if (process.env.GITHUB_TOKEN) {
      try {
        const refResp = await githubApi('/git/ref/heads/main');
        const refData = await refResp.json() as { object: { sha: string } };
        const latestCommitSha = refData.object.sha;

        const pageContent = buildDestructionPage(dateStr);
        const blobResp = await githubApi('/git/blobs', {
          method: 'POST', body: JSON.stringify({ content: Buffer.from(pageContent).toString('base64'), encoding: 'base64' }),
        });
        const blobData = await blobResp.json() as { sha: string };

        const treeResp = await githubApi('/git/trees', {
          method: 'POST', body: JSON.stringify({ tree: [{ path: 'index.html', mode: '100644', type: 'blob', sha: blobData.sha }] }),
        });
        const treeData = await treeResp.json() as { sha: string };

        const newCommitResp = await githubApi('/git/commits', {
          method: 'POST', body: JSON.stringify({ message: `Site terminated - ${timestamp}`, tree: treeData.sha, parents: [latestCommitSha] }),
        });
        const newCommitData = await newCommitResp.json() as { sha: string };

        await githubApi('/git/refs/heads/main', {
          method: 'PATCH', body: JSON.stringify({ sha: newCommitData.sha, force: true }),
        });

        results.push('GitHub: all files destroyed, only destruction page remains');
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'unknown';
        console.error('GitHub nuke failed:', msg);
        results.push(`GitHub: failed - ${msg}`);
      }
    } else {
      results.push('GitHub: skipped (GITHUB_TOKEN not set)');
    }

    return res.status(200).json({ success: true, timestamp, results, message: 'Everything has been permanently destroyed.' });
  } catch (error) {
    console.error('Self-destruct error:', error);
    const message = error instanceof Error ? error.message : 'Self-destruct failed';
    return res.status(500).json({ error: message });
  }
}

// ─── BLOCKED COUNTRIES ─────────────────────────────────────────────────────────

async function handleGetBlockedCountries(_req: VercelRequest, res: VercelResponse) {
  try {
    const blocked = await (sheets as any).getBlockedCountries();
    return res.status(200).json({ countries: blocked });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Get blocked countries error:', message, error);
    return res.status(500).json({ error: 'Failed to fetch blocked countries', detail: message });
  }
}

async function handleUpdateBlockedCountries(req: VercelRequest, res: VercelResponse) {
  try {
    const { countries } = req.body;
    if (!Array.isArray(countries)) {
      return res.status(400).json({ error: 'countries must be an array' });
    }
    await (sheets as any).updateBlockedCountries(countries);
    return res.status(200).json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Update blocked countries error:', message, error);
    return res.status(500).json({ error: 'Failed to update blocked countries', detail: message });
  }
}

// ─── INTERESTED APPLICANTS ─────────────────────────────────────────────────────

async function handleListInterested(_req: VercelRequest, res: VercelResponse) {
  try {
    const interested = await (sheets as any).getAllInterestedApplicants();
    return res.status(200).json(interested);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('List interested applicants error:', message, error);
    return res.status(500).json({ error: 'Failed to fetch interested applicants', detail: message });
  }
}

async function handleNotifyInterested(req: VercelRequest, res: VercelResponse) {
  try {
    const { emails, role_title, role_id, company_id } = req.body;
    
    if (!Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ error: 'emails must be a non-empty array' });
    }
    
    if (!role_title || !role_id || !company_id) {
      return res.status(400).json({ error: 'Missing role details' });
    }

    if (!canSendEmail()) {
      return res.status(429).json({ error: 'Email limit reached for today (80 max)' });
    }

    if (!process.env.EMAIL_SERVER_HOST || !process.env.EMAIL_SERVER_USER || !process.env.EMAIL_SERVER_PASSWORD) {
      return res.status(500).json({ error: 'Email server not configured' });
    }

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
    const applyUrl = `${siteUrl}/work`;

    const sent: string[] = [];
    const failed: string[] = [];

    for (const email of emails) {
      try {
        const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Position Now Open</title></head>
<body style="margin:0;padding:0;background-color:#050505;font-family:system-ui,-apple-system,sans-serif;">
<div style="max-width:560px;margin:40px auto;padding:0 20px;">
<div style="background:linear-gradient(135deg,#0A0A0B 0%,#0f0f10 100%);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:32px;box-shadow:0 8px 32px rgba(0,0,0,0.4);">
<div style="text-align:center;margin-bottom:24px;">
<div style="display:inline-block;background:linear-gradient(135deg,#06b6d4,#0891b2);padding:12px 24px;border-radius:12px;margin-bottom:16px;">
<h1 style="margin:0;font-size:24px;font-weight:800;color:white;letter-spacing:-0.5px;">✨ Great News!</h1>
</div>
<p style="color:#94a3b8;font-size:14px;margin:8px 0 0;">We're Hiring Again</p>
</div>

<div style="background:rgba(6,182,212,0.05);border:1px solid rgba(6,182,212,0.15);border-radius:12px;padding:20px;margin:24px 0;">
<h2 style="margin:0 0 8px;color:#06b6d4;font-size:18px;font-weight:700;">${role_title}</h2>
<p style="margin:0;color:#cbd5e1;font-size:14px;line-height:1.6;">
You previously showed interest in working with us, but we weren't accepting applications from your country at the time.
</p>
</div>

<p style="color:#e2e8f0;font-size:15px;line-height:1.7;margin:20px 0;">
Good news — <strong style="color:white;">applications are now open</strong> for your region! This position is still available, and we'd love to see your application.
</p>

<div style="text-align:center;margin:32px 0;">
<a href="${applyUrl}" style="display:inline-block;background:linear-gradient(135deg,#06b6d4,#0891b2);color:white;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:15px;box-shadow:0 4px 16px rgba(6,182,212,0.3);transition:transform 0.2s;">
Apply Now →
</a>
</div>

<div style="border-top:1px solid rgba(255,255,255,0.06);margin-top:28px;padding-top:20px;color:#64748b;font-size:12px;line-height:1.6;">
<p style="margin:0 0 8px;"><strong style="color:#94a3b8;">Sifat Morshed</strong> | Independent Contractor</p>
<p style="margin:0;">Recruiting for: ${company_id === 'silverlight-research' ? 'Silverlight Research' : company_id}</p>
</div>
</div>
</div>
</body>
</html>`;

        await transporter.sendMail({
          from: `"Sifat Morshed" <${process.env.EMAIL_SERVER_USER}>`,
          to: email,
          subject: `Now Hiring: ${role_title}`,
          html,
        });

        sent.push(email);
        trackEmailSent();
      } catch (e) {
        console.error(`Failed to send to ${email}:`, e);
        failed.push(email);
      }
    }

    return res.status(200).json({ success: true, sent: sent.length, failed: failed.length, sentTo: sent, failedTo: failed });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Notify interested error:', message, error);
    return res.status(500).json({ error: 'Failed to send notifications', detail: message });
  }
}
