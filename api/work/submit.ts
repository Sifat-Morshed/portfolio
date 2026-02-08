// Vercel Serverless Function: POST /api/work/submit
// Handles application submission with file uploads

import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as sheets from '../lib/google-sheets.js';
import * as drive from '../lib/google-drive.js';

// Simple rate limiter (in-memory map)
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_WINDOW = 10 * 60 * 1000; // 10 minutes

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const lastSubmission = rateLimitMap.get(ip);
  if (lastSubmission && now - lastSubmission < RATE_LIMIT_WINDOW) {
    return false;
  }
  rateLimitMap.set(ip, now);
  return true;
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
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

    // Validate CV file
    let cvLink = '';
    if (files.cv) {
      if (files.cv.mimetype !== 'application/pdf') {
        return res.status(400).json({ error: 'CV must be a PDF file' });
      }
      if (files.cv.buffer.length > 5 * 1024 * 1024) {
        return res.status(400).json({ error: 'CV must be under 5MB' });
      }

      const cvBuf = files.cv.buffer;
      cvLink = await drive.uploadFile(
        `cv_${sanitized.full_name.replace(/\s+/g, '_')}_${Date.now()}.pdf`,
        'application/pdf',
        new Uint8Array(cvBuf).buffer as ArrayBuffer
      );
    }

    // Validate audio file
    let audioLink = '';
    if (files.audio) {
      if (!files.audio.mimetype.startsWith('audio/')) {
        return res.status(400).json({ error: 'Audio must be an audio file' });
      }
      if (files.audio.buffer.length > 10 * 1024 * 1024) {
        return res.status(400).json({ error: 'Audio must be under 10MB' });
      }

      const ext = files.audio.mimetype.split('/')[1] || 'webm';
      const audioBuf = files.audio.buffer;
      audioLink = await drive.uploadFile(
        `audio_${sanitized.full_name.replace(/\s+/g, '_')}_${Date.now()}.${ext}`,
        files.audio.mimetype,
        new Uint8Array(audioBuf).buffer as ArrayBuffer
      );
    }

    // Generate UUID
    const appId = generateUUID();
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
    });

    // Send email notifications via nodemailer (if configured)
    try {
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
        });

        const siteUrl = process.env.SITE_URL || 'https://sifat-there.vercel.app';
        const adminNotifyEmail = process.env.ADMIN_NOTIFY_EMAIL || process.env.ADMIN_EMAIL || '';

        // 1. Confirmation email to applicant
        await transporter.sendMail({
          from: `"Sifat Morshed" <${process.env.EMAIL_SERVER_USER}>`,
          to: sanitized.email,
          subject: `Application Received – ${sanitized.role_title}`,
          html: `
            <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #0A0A0B; color: #e2e8f0; border-radius: 12px; overflow: hidden;">
              <div style="background: linear-gradient(135deg, #06b6d4, #3b82f6); padding: 24px 32px;">
                <h2 style="margin: 0; color: #fff; font-size: 20px;">Application Received ✓</h2>
              </div>
              <div style="padding: 32px;">
                <p style="color: #94a3b8;">Hi <strong style="color: #fff;">${sanitized.full_name}</strong>,</p>
                <p style="color: #94a3b8;">Your application for <strong style="color: #06b6d4;">${sanitized.role_title}</strong> has been received and is under review.</p>
                <div style="background: #111; border: 1px solid #222; border-radius: 8px; padding: 16px; margin: 20px 0;">
                  <p style="margin: 0 0 4px; color: #64748b; font-size: 12px;">Your Application ID:</p>
                  <p style="margin: 0; font-family: monospace; font-size: 18px; color: #06b6d4; font-weight: bold;">${appId}</p>
                </div>
                <p style="color: #94a3b8;">Track your status anytime:</p>
                <a href="${siteUrl}/work/status?id=${appId}" style="display: inline-block; background: #06b6d4; color: #fff; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">Check Status →</a>
                <p style="color: #64748b; font-size: 12px; margin-top: 24px;">Best regards,<br>Sifat Morshed</p>
              </div>
            </div>
          `,
        });

        // 2. Admin notification email (new application alert)
        if (adminNotifyEmail) {
          await transporter.sendMail({
            from: `"Work With Me Bot" <${process.env.EMAIL_SERVER_USER}>`,
            to: adminNotifyEmail,
            subject: `🔔 New Application: ${sanitized.full_name} — ${sanitized.role_title}`,
            html: `
              <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #0A0A0B; color: #e2e8f0; border-radius: 12px; overflow: hidden;">
                <div style="background: linear-gradient(135deg, #f59e0b, #ef4444); padding: 20px 32px;">
                  <h2 style="margin: 0; color: #fff; font-size: 18px;">🔔 New Application Received</h2>
                </div>
                <div style="padding: 24px 32px;">
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr><td style="color: #64748b; padding: 6px 0; font-size: 13px;">Name</td><td style="color: #fff; padding: 6px 0; font-weight: 600;">${sanitized.full_name}</td></tr>
                    <tr><td style="color: #64748b; padding: 6px 0; font-size: 13px;">Email</td><td style="color: #06b6d4; padding: 6px 0;">${sanitized.email}</td></tr>
                    <tr><td style="color: #64748b; padding: 6px 0; font-size: 13px;">Phone</td><td style="color: #fff; padding: 6px 0;">${sanitized.phone}</td></tr>
                    <tr><td style="color: #64748b; padding: 6px 0; font-size: 13px;">Nationality</td><td style="color: #fff; padding: 6px 0;">${sanitized.nationality}</td></tr>
                    <tr><td style="color: #64748b; padding: 6px 0; font-size: 13px;">Role</td><td style="color: #f59e0b; padding: 6px 0; font-weight: 600;">${sanitized.role_title}</td></tr>
                    <tr><td style="color: #64748b; padding: 6px 0; font-size: 13px;">Reference</td><td style="color: #fff; padding: 6px 0;">${sanitized.reference || '—'}</td></tr>
                    <tr><td style="color: #64748b; padding: 6px 0; font-size: 13px;">App ID</td><td style="font-family: monospace; color: #06b6d4; padding: 6px 0;">${appId}</td></tr>
                    <tr><td style="color: #64748b; padding: 6px 0; font-size: 13px;">Audio</td><td style="color: #fff; padding: 6px 0;">${audioLink ? '<a href="' + audioLink + '" style="color: #06b6d4;">Listen</a>' : 'None'}</td></tr>
                    <tr><td style="color: #64748b; padding: 6px 0; font-size: 13px;">CV</td><td style="color: #fff; padding: 6px 0;">${cvLink ? '<a href="' + cvLink + '" style="color: #06b6d4;">View</a>' : 'None'}</td></tr>
                  </table>
                  <div style="margin-top: 20px;">
                    <a href="${siteUrl}/work/admin" style="display: inline-block; background: #06b6d4; color: #fff; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">Open Admin Dashboard →</a>
                  </div>
                </div>
              </div>
            `,
          });
        }
      }
    } catch (emailErr) {
      console.error('Email notification failed (non-fatal):', emailErr);
    }

    return res.status(200).json({ app_id: appId });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Submission error:', message, error);
    return res.status(500).json({ error: `Submission failed: ${message}` });
  }
}
