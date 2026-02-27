import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as sheets from '../lib/google-sheets.js';

// CORS helper
function setCors(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    try {
      const allJobs = await (sheets as any).getAllJobPostings();
      
      // Transform to frontend format
      const jobs = allJobs.map((job: any) => {
        // Parse comma-separated fields
        const tags = job.tags ? job.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [];
        const requirements = job.requirements ? job.requirements.split(',').map((r: string) => r.trim()).filter(Boolean) : [];
        const perks = job.perks ? job.perks.split(',').map((p: string) => p.trim()).filter(Boolean) : [];
        const blockedCountries = job.blocked_countries ? job.blocked_countries.split(',').map((c: string) => c.trim()).filter(Boolean) : [];

        const hiringVal = (job.is_hiring || '').toString().toLowerCase();
        const isHiring = hiringVal !== 'false';

        return {
          companyId: job.company_id,
          name: job.company_name,
          tagline: job.company_tagline,
          description: job.company_description,
          industry: job.company_industry,
          isHiring,
          roles: [{
            roleId: job.role_id,
            title: job.role_title,
            type: job.role_type,
            salaryUsd: job.salary_usd,
            salaryBdt: job.salary_bdt,
            bosnianOnly: (job.bosnian_only || '').toString().toLowerCase() === 'true',
            tags,
            shortDescription: job.short_description,
            fullDescription: job.full_description,
            requirements,
            perks,
            blockedCountries,
            isHiring, // per-role hiring status
          }]
        };
      });

      // Group by company
      const companiesMap = new Map<string, any>();
      jobs.forEach((job: any) => {
        if (companiesMap.has(job.companyId)) {
          const existing = companiesMap.get(job.companyId);
          existing.roles.push(job.roles[0]);
          // Company is hiring if ANY role is hiring
          if (job.isHiring) existing.isHiring = true;
        } else {
          companiesMap.set(job.companyId, job);
        }
      });

      const companies = Array.from(companiesMap.values());
      
      return res.status(200).json({ companies });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Get jobs error:', message, error);
      return res.status(500).json({ error: 'Failed to fetch jobs', detail: message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
