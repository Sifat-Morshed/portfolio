// Vercel Serverless Function: POST /api/work/submit
// Handles application submission with file uploads

import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as sheets from '../lib/google-sheets.js';

// Simple rate limiter (in-memory map)
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_WINDOW = 10 * 60 * 1000; // 10 minutes

// Daily email counter to avoid hitting Gmail limits (500/day free)
const emailCounter = { date: '', count: 0 };
const MAX_EMAILS_PER_DAY = 80; // stay well under 500

function canSendEmail(): boolean {
  const today = new Date().toISOString().slice(0, 10);
  if (emailCounter.date !== today) {
    emailCounter.date = today;
    emailCounter.count = 0;
  }
  return emailCounter.count < MAX_EMAILS_PER_DAY;
}

function trackEmailSent(n = 1) {
  const today = new Date().toISOString().slice(0, 10);
  if (emailCounter.date !== today) {
    emailCounter.date = today;
    emailCounter.count = 0;
  }
  emailCounter.count += n;
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const lastSubmission = rateLimitMap.get(ip);
  if (lastSubmission && now - lastSubmission < RATE_LIMIT_WINDOW) {
    return false;
  }
  rateLimitMap.set(ip, now);
  return true;
}

/**
 * Generate a short, human-friendly application ID.
 * Format: SM-XXXX-YY  (10 chars total)
 *   SM     = brand prefix
 *   XXXX   = 4-char alphanumeric (base-36 from crypto-random)
 *   YY     = 2-digit year
 * Example: SM-7K2F-25
 * Collision space: 36^4 = 1,679,616 per year — plenty for this scale.
 */
function generateAppId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I to avoid confusion
  let code = '';
  const bytes = new Uint8Array(4);
  globalThis.crypto.getRandomValues(bytes);
  for (let i = 0; i < 4; i++) {
    code += chars[bytes[i] % chars.length];
  }
  const year = new Date().getFullYear().toString().slice(-2);
  return `SM-${code}-${year}`;
}

// Validate phone format (basic)
function isValidPhone(phone: string): boolean {
  return /^[\d\s\+\-\(\)]{7,20}$/.test(phone);
}

// Strip HTML tags from string
function stripTags(str: string): string {
  return str.replace(/<[^>]*>/g, '').trim();
}

export const config = {
  api: {
    bodyParser: false,
  },
};

// Parse multipart form data manually for Vercel
async function parseMultipart(req: VercelRequest): Promise<{
  fields: Record<string, string>;
  files: Record<string, { buffer: Buffer; filename: string; mimetype: string }>;
}> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => {
      const body = Buffer.concat(chunks);
      const contentType = req.headers['content-type'] || '';
      const boundaryMatch = contentType.match(/boundary=(.+)/);

      if (!boundaryMatch) {
        reject(new Error('No boundary found'));
        return;
      }

      const boundary = boundaryMatch[1];
      const parts = body.toString('binary').split(`--${boundary}`);
      const fields: Record<string, string> = {};
      const files: Record<string, { buffer: Buffer; filename: string; mimetype: string }> = {};

      for (const part of parts) {
        if (part === '' || part === '--\r\n' || part === '--') continue;

        const headerEnd = part.indexOf('\r\n\r\n');
        if (headerEnd === -1) continue;

        const headerStr = part.substring(0, headerEnd);
        const bodyStr = part.substring(headerEnd + 4, part.length - 2); // Remove trailing \r\n

        const nameMatch = headerStr.match(/name="([^"]+)"/);
        if (!nameMatch) continue;

        const name = nameMatch[1];
        const filenameMatch = headerStr.match(/filename="([^"]+)"/);
        const mimeMatch = headerStr.match(/Content-Type:\s*(.+)/i);

        if (filenameMatch && mimeMatch) {
          files[name] = {
            buffer: Buffer.from(bodyStr, 'binary'),
            filename: filenameMatch[1],
            mimetype: mimeMatch[1].trim(),
          };
        } else {
          fields[name] = bodyStr.trim();
        }
      }

      resolve({ fields, files });
    });
    req.on('error', reject);
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS on every response
  const origin = req.headers.origin || '';
  const allowed = (process.env.ALLOWED_ORIGIN || 'https://sifat-there.vercel.app').replace(/\/$/, '');
  const isAllowed = origin === allowed || origin.endsWith('.vercel.app');
  res.setHeader('Access-Control-Allow-Origin', isAllowed ? origin : allowed);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Rate limiting
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket?.remoteAddress || 'unknown';
    if (!checkRateLimit(ip)) {
      return res.status(429).json({ error: 'Too many submissions. Please wait 10 minutes.' });
    }

    const { fields, files } = await parseMultipart(req);

    // Validate required fields
    const requiredFields: string[] = ['company_id', 'role_id', 'role_title', 'full_name', 'email', 'phone', 'nationality'];
    for (const field of requiredFields) {
      if (!fields[field]) {
        return res.status(400).json({ error: `Missing required field: ${field}` });
      }
    }

    // Validate phone
    if (!isValidPhone(fields.phone)) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }

    // Sanitize inputs
    const sanitized = {
      company_id: stripTags(fields.company_id),
      role_id: stripTags(fields.role_id),
      role_title: stripTags(fields.role_title),
      full_name: stripTags(fields.full_name),
      email: stripTags(fields.email),
      phone: stripTags(fields.phone),
      nationality: stripTags(fields.nationality),
      reference: stripTags(fields.reference || ''),
      blacklist_acknowledged: fields.blacklist_acknowledged === 'true' ? 'true' : 'false',
    };

    // Duplicate submission check: 1 email = 1 submission only
    const existingApp = await sheets.getApplicationByEmail(sanitized.email);
    if (existingApp) {
      return res.status(409).json({
        error: 'duplicate',
        existing_id: existingApp.app_id,
        existing_name: existingApp.full_name,
        existing_role: existingApp.role_title,
        existing_date: existingApp.timestamp,
      });
    }

    // Validate CV file (stored in memory, emailed as attachment to admin)
    let cvLink = '';
    let cvAttachment: { filename: string; content: Buffer; contentType: string } | null = null;
    if (files.cv) {
      if (files.cv.mimetype !== 'application/pdf') {
        return res.status(400).json({ error: 'CV must be a PDF file' });
      }
      if (files.cv.buffer.length > 3 * 1024 * 1024) {
        return res.status(400).json({ error: 'CV must be under 3MB' });
      }
      const cvFilename = `cv_${sanitized.full_name.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
      cvAttachment = { filename: cvFilename, content: files.cv.buffer, contentType: 'application/pdf' };
      cvLink = `[emailed to admin]`;
    }

    // Validate audio file (stored in memory, emailed as attachment to admin)
    let audioLink = '';
    let audioAttachment: { filename: string; content: Buffer; contentType: string } | null = null;
    if (files.audio) {
      if (!files.audio.mimetype.startsWith('audio/')) {
        return res.status(400).json({ error: 'Audio must be an audio file' });
      }
      if (files.audio.buffer.length > 5 * 1024 * 1024) {
        return res.status(400).json({ error: 'Audio must be under 5MB' });
      }
      const ext = files.audio.mimetype.split('/')[1] || 'webm';
      const audioFilename = `audio_${sanitized.full_name.replace(/\s+/g, '_')}_${Date.now()}.${ext}`;
      audioAttachment = { filename: audioFilename, content: files.audio.buffer, contentType: files.audio.mimetype };
      audioLink = `[emailed to admin]`;
    }

    // Generate short app ID
    const appId = generateAppId();
    const now = new Date().toISOString();

    // Write to Google Sheets
    await sheets.appendApplication({
      app_id: appId,
      timestamp: now,
      status: 'NEW',
      company_id: sanitized.company_id,
      role_id: sanitized.role_id,
      role_title: sanitized.role_title,
      full_name: sanitized.full_name,
      email: sanitized.email,
      phone: sanitized.phone,
      nationality: sanitized.nationality,
      reference: sanitized.reference,
      blacklist_acknowledged: sanitized.blacklist_acknowledged,
      cv_link: cvLink,
      audio_link: audioLink,
      notes: '',
      last_updated: now,
      started_date: '',
      email_log: 'NEW',
      rejection_date: '',
    });

    // Send email notifications in background (don't block the response)
    const emailPromise = (async () => {
      try {
        if (!canSendEmail()) {
          console.warn('Daily email limit reached, skipping notifications');
          return;
        }
        if (process.env.EMAIL_SERVER_HOST && process.env.EMAIL_SERVER_USER && process.env.EMAIL_SERVER_PASSWORD) {
          const nodemailer = await import('nodemailer');
          const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_SERVER_HOST,
            port: 587,
            secure: false,
            auth: {
              user: process.env.EMAIL_SERVER_USER,
              pass: process.env.EMAIL_SERVER_PASSWORD,
            },
            pool: true,
            maxConnections: 1,
            rateDelta: 2000,
            rateLimit: 3,
          });

          const siteUrl = process.env.SITE_URL || 'https://sifat-there.vercel.app';
          const adminNotifyEmail = process.env.ADMIN_NOTIFY_EMAIL || process.env.ADMIN_EMAIL || '';

          // Fire both emails in PARALLEL for speed
          const emailJobs: Promise<unknown>[] = [];

          // 1. Confirmation email to applicant (Gmail dark mode safe)
          emailJobs.push(
            transporter.sendMail({
              from: `"Sifat Morshed" <${process.env.EMAIL_SERVER_USER}>`,
              replyTo: process.env.EMAIL_SERVER_USER,
              to: sanitized.email,
              subject: `Application Received - ${sanitized.role_title}`,
              headers: {
                'X-Mailer': 'SifatPortfolio/1.0',
                'Precedence': 'bulk',
              },
              html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light only"><style>:root{color-scheme:light only;}</style></head><body style="margin:0;padding:0;background-color:#050505;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#050505" style="background-color:#050505;"><tr><td align="center" style="padding:20px 0;">
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="#050505" style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;background-color:#050505;border:1px solid #111113;border-radius:12px;overflow:hidden;">
                  <tr><td bgcolor="#0A0A0B" style="background-color:#0A0A0B;border-bottom:2px solid #06b6d4;padding:28px 32px;text-align:center;">
                    <p style="margin:0 0 4px;color:#475569;font-size:11px;text-transform:uppercase;letter-spacing:2px;">New Application</p>
                    <h1 style="margin:0;color:#06b6d4;font-size:22px;font-weight:700;">Application Received</h1>
                  </td></tr>
                  <tr><td bgcolor="#050505" style="background-color:#050505;padding:28px 32px;">
                    <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 16px;">Hi <strong style="color:#e2e8f0;">${sanitized.full_name}</strong>,</p>
                    <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 20px;">Your application for <strong style="color:#06b6d4;">${sanitized.role_title}</strong> has been received and is under review.</p>
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
            })
          );

          // 2. Admin notification email with file attachments
          if (adminNotifyEmail) {
            const attachments: Array<{ filename: string; content: Buffer; contentType: string }> = [];
            if (cvAttachment) attachments.push(cvAttachment);
            if (audioAttachment) attachments.push(audioAttachment);

            emailJobs.push(
              transporter.sendMail({
                from: `"Work With Me Bot" <${process.env.EMAIL_SERVER_USER}>`,
                to: adminNotifyEmail,
                subject: `New Application: ${sanitized.full_name} - ${sanitized.role_title}`,
                attachments,
                html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light only"><style>:root{color-scheme:light only;}</style></head><body style="margin:0;padding:0;background-color:#050505;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#050505" style="background-color:#050505;"><tr><td align="center" style="padding:20px 0;">
                  <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="#050505" style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;background-color:#050505;border:1px solid #111113;border-radius:12px;overflow:hidden;">
                    <tr><td bgcolor="#0A0A0B" style="background-color:#0A0A0B;border-bottom:2px solid #f59e0b;padding:24px 32px;text-align:center;">
                      <p style="margin:0 0 4px;color:#475569;font-size:11px;text-transform:uppercase;letter-spacing:2px;">Admin Alert</p>
                      <h2 style="margin:0;color:#f59e0b;font-size:18px;font-weight:700;">New Application Received</h2>
                    </td></tr>
                    <tr><td bgcolor="#050505" style="background-color:#050505;padding:24px 32px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr><td style="color:#64748b;padding:6px 0;font-size:13px;">Name</td><td style="color:#e2e8f0;padding:6px 0;font-weight:600;">${sanitized.full_name}</td></tr>
                        <tr><td style="color:#64748b;padding:6px 0;font-size:13px;">Email</td><td style="color:#06b6d4;padding:6px 0;">${sanitized.email}</td></tr>
                        <tr><td style="color:#64748b;padding:6px 0;font-size:13px;">Phone</td><td style="color:#e2e8f0;padding:6px 0;">${sanitized.phone}</td></tr>
                        <tr><td style="color:#64748b;padding:6px 0;font-size:13px;">Nationality</td><td style="color:#e2e8f0;padding:6px 0;">${sanitized.nationality}</td></tr>
                        <tr><td style="color:#64748b;padding:6px 0;font-size:13px;">Role</td><td style="color:#f59e0b;padding:6px 0;font-weight:600;">${sanitized.role_title}</td></tr>
                        <tr><td style="color:#64748b;padding:6px 0;font-size:13px;">Reference</td><td style="color:#e2e8f0;padding:6px 0;">${sanitized.reference || '—'}</td></tr>
                        <tr><td style="color:#64748b;padding:6px 0;font-size:13px;">App ID</td><td style="font-family:monospace;color:#06b6d4;padding:6px 0;">${appId}</td></tr>
                        <tr><td style="color:#64748b;padding:6px 0;font-size:13px;">CV</td><td style="color:#e2e8f0;padding:6px 0;">${cvAttachment ? 'Attached' : 'None'}</td></tr>
                        <tr><td style="color:#64748b;padding:6px 0;font-size:13px;">Audio</td><td style="color:#e2e8f0;padding:6px 0;">${audioAttachment ? 'Attached' : 'None'}</td></tr>
                      </table>
                      ${(cvAttachment || audioAttachment) ? '<p style="color:#10b981;margin-top:16px;font-size:13px;">Files are attached to this email.</p>' : ''}
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:20px;"><tr><td align="center">
                        <a href="${siteUrl}/work/admin" style="display:inline-block;background-color:#06b6d4;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Open Admin Dashboard</a>
                      </td></tr></table>
                    </td></tr>
                    <tr><td bgcolor="#0A0A0B" style="background-color:#0A0A0B;border-top:1px solid #1e293b;padding:12px 32px;text-align:center;">
                      <p style="color:#475569;font-size:11px;margin:0;">Work With Me Bot</p>
                    </td></tr>
                  </table>
                </td></tr></table></body></html>`,
              })
            );
          }

          await Promise.allSettled(emailJobs);
          trackEmailSent(emailJobs.length);
        }
      } catch (emailErr) {
        console.error('Email notification failed (non-fatal):', emailErr);
      }
    })();

    // Wait for emails but with a timeout — don't let slow SMTP delay the response
    await Promise.race([emailPromise, new Promise((r) => setTimeout(r, 8000))]);

    return res.status(200).json({ app_id: appId });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Submission error:', message, error);
    return res.status(500).json({ error: `Submission failed: ${message}` });
  }
}
