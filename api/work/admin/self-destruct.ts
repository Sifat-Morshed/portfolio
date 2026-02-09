// Vercel Serverless Function: POST /api/work/admin/self-destruct
// Multi-stage verification — nukes EVERYTHING: sheet data + entire GitHub repo
// Leaves only one static index.html stating the site is destroyed
// Secrets from env vars: SELF_DESTRUCT_PASS, SELF_DESTRUCT_FINAL, GITHUB_TOKEN

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

// GitHub API helpers
const REPO_OWNER = 'Sifat-Morshed';
const REPO_NAME = 'portfolio';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function githubApi(path: string, options: RequestInit = {}): Promise<any> {
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
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Site Terminated</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#050505;font-family:'Segoe UI',system-ui,-apple-system,sans-serif;color:#e2e8f0;overflow:hidden}
.container{text-align:center;padding:3rem 2rem;max-width:520px}
.icon{font-size:4rem;margin-bottom:1.5rem;opacity:0.6}
h1{font-size:1.75rem;font-weight:700;color:#ef4444;margin-bottom:0.75rem;letter-spacing:-0.02em}
p{color:#64748b;font-size:0.95rem;line-height:1.7;margin-bottom:0.5rem}
.date{font-family:monospace;color:#475569;font-size:0.8rem;margin-top:1.5rem;padding:0.5rem 1rem;background:#0A0A0B;border:1px solid #1e293b;border-radius:6px;display:inline-block}
.line{width:60px;height:2px;background:#ef4444;margin:1.5rem auto;opacity:0.4}
</style>
</head>
<body>
<div class="container">
<div class="icon">&#9760;</div>
<h1>This Site Has Been Permanently Shut Down</h1>
<div class="line"></div>
<p>All code, data, and files have been irreversibly destroyed by the owner.</p>
<p>There is nothing left here.</p>
<div class="date">Terminated: ${date}</div>
</div>
</body>
</html>`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!verifyAdmin(req)) return res.status(403).json({ error: 'Forbidden' });

  try {
    const { password, final_answer } = req.body;

    // Both secrets from env vars — never hardcoded
    const correctPass = process.env.SELF_DESTRUCT_PASS || '';
    const correctFinal = process.env.SELF_DESTRUCT_FINAL || '';

    if (!correctPass || !correctFinal) {
      return res.status(500).json({ error: 'Self-destruct not configured on server' });
    }

    if (!password || password !== correctPass) {
      return res.status(403).json({ error: 'Incorrect password' });
    }

    if (!final_answer || final_answer.trim().toLowerCase() !== correctFinal.trim().toLowerCase()) {
      return res.status(403).json({ error: 'Incorrect final answer' });
    }

    const timestamp = new Date().toISOString();
    const dateStr = new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'long' });
    const results: string[] = [];

    // Phase 1: Delete ALL Google Sheet data
    try {
      const allApps = await sheets.getAllApplications();
      let deleted = 0;
      for (const app of allApps) {
        try {
          await sheets.deleteApplication((app as Record<string, string>).app_id);
          deleted++;
        } catch (e) {
          console.error('Sheet delete fail:', (app as Record<string, string>).app_id, e);
        }
      }
      results.push(`Sheet: ${deleted} entries destroyed`);
    } catch (e) {
      results.push(`Sheet: failed - ${e instanceof Error ? e.message : 'unknown'}`);
    }

    // Phase 2: Nuke the entire GitHub repo — replace everything with one index.html
    if (process.env.GITHUB_TOKEN) {
      try {
        // Get the default branch's latest commit SHA
        const refResp = await githubApi('/git/ref/heads/main');
        const refData = await refResp.json();
        const latestCommitSha = refData.object.sha;

        // Get the tree for that commit
        const commitResp = await githubApi(`/git/commits/${latestCommitSha}`);
        const commitData = await commitResp.json();

        // Create a blob for the destruction page
        const pageContent = buildDestructionPage(dateStr);
        const blobResp = await githubApi('/git/blobs', {
          method: 'POST',
          body: JSON.stringify({
            content: Buffer.from(pageContent).toString('base64'),
            encoding: 'base64',
          }),
        });
        const blobData = await blobResp.json();

        // Create a new tree with ONLY index.html (this effectively deletes everything else)
        const treeResp = await githubApi('/git/trees', {
          method: 'POST',
          body: JSON.stringify({
            tree: [{
              path: 'index.html',
              mode: '100644',
              type: 'blob',
              sha: blobData.sha,
            }],
          }),
        });
        const treeData = await treeResp.json();

        // Create a new commit pointing to this empty tree
        const newCommitResp = await githubApi('/git/commits', {
          method: 'POST',
          body: JSON.stringify({
            message: `Site terminated - ${timestamp}`,
            tree: treeData.sha,
            parents: [latestCommitSha],
          }),
        });
        const newCommitData = await newCommitResp.json();

        // Force-update main to point to the new commit
        await githubApi('/git/refs/heads/main', {
          method: 'PATCH',
          body: JSON.stringify({
            sha: newCommitData.sha,
            force: true,
          }),
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

    return res.status(200).json({
      success: true,
      timestamp,
      results,
      message: 'Everything has been permanently destroyed.',
    });
  } catch (error) {
    console.error('Self-destruct error:', error);
    const message = error instanceof Error ? error.message : 'Self-destruct failed';
    return res.status(500).json({ error: message });
  }
}
