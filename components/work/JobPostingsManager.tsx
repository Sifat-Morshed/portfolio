import React, { useState, useEffect } from 'react';
import { Briefcase, Plus, Edit2, Trash2, Save, X, Loader2, Upload } from 'lucide-react';
import { COMPANIES } from '../../src/lib/work/opportunities';

interface JobPosting {
  company_id: string;
  company_name: string;
  company_tagline: string;
  company_description: string;
  company_industry: string;
  role_id: string;
  role_title: string;
  role_type: string;
  salary_usd: string;
  salary_bdt: string;
  bosnian_only: string;
  tags: string;
  short_description: string;
  full_description: string;
  requirements: string;
  perks: string;
  blocked_countries: string;
  is_hiring: string;
  created_at: string;
  updated_at: string;
}

interface JobPostingsManagerProps {
  userEmail: string;
}

const JobPostingsManager: React.FC<JobPostingsManagerProps> = ({ userEmail }) => {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState<JobPosting | null>(null);
  const [formData, setFormData] = useState<Partial<JobPosting>>({
    company_id: '',
    company_name: '',
    company_tagline: '',
    company_description: '',
    company_industry: '',
    role_id: '',
    role_title: '',
    role_type: 'Full-time',
    salary_usd: '',
    salary_bdt: '',
    bosnian_only: 'false',
    tags: '',
    short_description: '',
    full_description: '',
    requirements: '',
    perks: '',
    blocked_countries: '',
    is_hiring: 'true',
  });

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/work/admin?action=list-jobs', {
        headers: { Authorization: `Bearer ${userEmail}` },
      });
      if (!res.ok) throw new Error('Failed to fetch jobs');
      const data = await res.json();
      setJobs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [userEmail]);

  const handleCreate = async () => {
    if (!formData.company_id || !formData.role_id || !formData.role_title) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const res = await fetch('/api/work/admin?action=create-job', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userEmail}`,
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Failed to create job');

      alert('Job posting created successfully');
      setShowForm(false);
      setFormData({
        company_id: '',
        company_name: '',
        company_tagline: '',
        company_description: '',
        company_industry: '',
        role_id: '',
        role_title: '',
        role_type: 'Full-time',
        salary_usd: '',
        salary_bdt: '',
        bosnian_only: 'false',
        tags: '',
        short_description: '',
        full_description: '',
        requirements: '',
        perks: '',
        blocked_countries: '',
        is_hiring: 'true',
      });
      await fetchJobs();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create job');
    }
  };

  const handleUpdate = async () => {
    if (!editingJob) return;

    try {
      const updates = { ...formData };
      delete updates.company_id;
      delete updates.role_id;
      delete updates.created_at;
      delete updates.updated_at;

      const res = await fetch('/api/work/admin?action=update-job', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userEmail}`,
        },
        body: JSON.stringify({
          company_id: editingJob.company_id,
          role_id: editingJob.role_id,
          updates,
        }),
      });

      if (!res.ok) throw new Error('Failed to update job');

      alert('Job posting updated successfully');
      setEditingJob(null);
      setShowForm(false);
      await fetchJobs();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update job');
    }
  };

  const handleDelete = async (companyId: string, roleId: string) => {
    if (!confirm(`Delete job ${roleId}? This cannot be undone.`)) return;

    try {
      const res = await fetch('/api/work/admin?action=delete-job', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userEmail}`,
        },
        body: JSON.stringify({ company_id: companyId, role_id: roleId }),
      });

      if (!res.ok) throw new Error('Failed to delete job');

      alert('Job posting deleted successfully');
      await fetchJobs();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete job');
    }
  };

  const openEditForm = (job: JobPosting) => {
    setEditingJob(job);
    setFormData(job);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingJob(null);
    setFormData({
      company_id: '',
      company_name: '',
      company_tagline: '',
      company_description: '',
      company_industry: '',
      role_id: '',
      role_title: '',
      role_type: 'Full-time',
      salary_usd: '',
      salary_bdt: '',
      bosnian_only: 'false',
      tags: '',
      short_description: '',
      full_description: '',
      requirements: '',
      perks: '',
      blocked_countries: '',
      is_hiring: 'true',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Briefcase size={20} className="text-primary" />
          <h3 className="text-lg font-bold text-white">Job Postings Management</h3>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-lg text-sm hover:bg-primary/20 transition-colors"
        >
          <Plus size={16} />
          Create Job
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Job Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-surface border border-white/10 rounded-2xl p-6 max-w-3xl w-full my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">
                {editingJob ? 'Edit Job Posting' : 'Create New Job Posting'}
              </h3>
              <button onClick={closeForm} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
              {/* Company Info */}
              <div className="col-span-2">
                <h4 className="text-sm font-semibold text-primary mb-3">Company Information</h4>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Company ID *</label>
                <input
                  type="text"
                  value={formData.company_id}
                  onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                  disabled={!!editingJob}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white disabled:opacity-50"
                  placeholder="e.g. silverlight-research"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Company Name *</label>
                <input
                  type="text"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                  placeholder="e.g. Silverlight Research"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs text-slate-400 mb-1">Company Tagline</label>
                <input
                  type="text"
                  value={formData.company_tagline}
                  onChange={(e) => setFormData({ ...formData, company_tagline: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                  placeholder="e.g. B2B Lead Generation & Market Research"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs text-slate-400 mb-1">Company Description</label>
                <textarea
                  value={formData.company_description}
                  onChange={(e) => setFormData({ ...formData, company_description: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white h-20"
                  placeholder="Brief description of the company"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Industry</label>
                <input
                  type="text"
                  value={formData.company_industry}
                  onChange={(e) => setFormData({ ...formData, company_industry: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                  placeholder="e.g. Market Research"
                />
              </div>

              {/* Role Info */}
              <div className="col-span-2 mt-4">
                <h4 className="text-sm font-semibold text-primary mb-3">Role Information</h4>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Role ID *</label>
                <input
                  type="text"
                  value={formData.role_id}
                  onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                  disabled={!!editingJob}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white disabled:opacity-50"
                  placeholder="e.g. global-setter"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Role Title *</label>
                <input
                  type="text"
                  value={formData.role_title}
                  onChange={(e) => setFormData({ ...formData, role_title: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                  placeholder="e.g. Remote Appointment Setter"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Role Type</label>
                <select
                  value={formData.role_type}
                  onChange={(e) => setFormData({ ...formData, role_type: e.target.value })}
                  className="w-full bg-[#0A0A0B] text-white border border-white/10 rounded-lg px-3 py-2 text-sm appearance-none cursor-pointer"
                >
                  <option value="Full-time" className="bg-[#0A0A0B] text-white">Full-time</option>
                  <option value="Part-time" className="bg-[#0A0A0B] text-white">Part-time</option>
                  <option value="Contract" className="bg-[#0A0A0B] text-white">Contract</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Salary USD</label>
                <input
                  type="text"
                  value={formData.salary_usd}
                  onChange={(e) => setFormData({ ...formData, salary_usd: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                  placeholder="$200–$700/mo"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Salary BDT</label>
                <input
                  type="text"
                  value={formData.salary_bdt}
                  onChange={(e) => setFormData({ ...formData, salary_bdt: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                  placeholder="৳22,000–৳77,000/mo"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Bosnian Only</label>
                <select
                  value={formData.bosnian_only}
                  onChange={(e) => setFormData({ ...formData, bosnian_only: e.target.value })}
                  className="w-full bg-[#0A0A0B] text-white border border-white/10 rounded-lg px-3 py-2 text-sm appearance-none cursor-pointer"
                >
                  <option value="false" className="bg-[#0A0A0B] text-white">No (Global)</option>
                  <option value="true" className="bg-[#0A0A0B] text-white">Yes (Bosnia Only)</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-xs text-slate-400 mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                  placeholder="e.g. Remote, English, Sales"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs text-slate-400 mb-1">Short Description</label>
                <textarea
                  value={formData.short_description}
                  onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white h-20"
                  placeholder="Brief 1-2 sentence summary"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs text-slate-400 mb-1">Full Description</label>
                <textarea
                  value={formData.full_description}
                  onChange={(e) => setFormData({ ...formData, full_description: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white h-32"
                  placeholder="Detailed job description"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs text-slate-400 mb-1">Requirements (comma-separated)</label>
                <textarea
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white h-24"
                  placeholder="e.g. Fluent English, Internet connection, Quiet workspace"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs text-slate-400 mb-1">Perks (comma-separated)</label>
                <textarea
                  value={formData.perks}
                  onChange={(e) => setFormData({ ...formData, perks: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white h-24"
                  placeholder="e.g. Weekly payouts, Flexible schedule, Training provided"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs text-slate-400 mb-1">Blocked Countries (comma-separated)</label>
                <input
                  type="text"
                  value={formData.blocked_countries || ''}
                  onChange={(e) => setFormData({ ...formData, blocked_countries: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                  placeholder="e.g. Bangladesh, India (leave empty to allow all countries)"
                />
                <p className="text-xs text-slate-500 mt-1">Applicants from these countries will be blocked for this specific job</p>
              </div>

              <div className="col-span-2">
                <label className="block text-xs text-slate-400 mb-2">Hiring Status</label>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, is_hiring: formData.is_hiring === 'true' ? 'false' : 'true' })}
                  className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${
                    formData.is_hiring === 'true' ? 'bg-emerald-500' : 'bg-slate-600'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                      formData.is_hiring === 'true' ? 'translate-x-8' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className={`ml-3 text-sm font-medium ${formData.is_hiring === 'true' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formData.is_hiring === 'true' ? 'Actively Hiring' : 'Not Hiring'}
                </span>
                <p className="text-xs text-slate-500 mt-1">When disabled, this role will appear grayed out with a "Not hiring" notice on the public page</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
              <button
                onClick={closeForm}
                className="px-4 py-2 bg-white/5 text-slate-300 border border-white/10 rounded-lg text-sm hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editingJob ? handleUpdate : handleCreate}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-black border border-primary rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                <Save size={16} />
                {editingJob ? 'Update Job' : 'Create Job'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Jobs List */}
      <div className="space-y-3">
        {jobs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500 mb-4">No job postings in sheet yet.</p>
            <button
              onClick={async () => {
                if (!confirm('Import existing roles from static data into the sheet?')) return;
                try {
                  setLoading(true);
                  for (const company of COMPANIES) {
                    for (const role of company.roles) {
                      await fetch('/api/work/admin?action=create-job', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userEmail}` },
                        body: JSON.stringify({
                          company_id: company.companyId,
                          company_name: company.name,
                          company_tagline: company.tagline,
                          company_description: company.description,
                          company_industry: company.industry,
                          role_id: role.roleId,
                          role_title: role.title,
                          role_type: role.type,
                          salary_usd: role.salaryUsd,
                          salary_bdt: role.salaryBdt,
                          bosnian_only: role.bosnianOnly ? 'true' : 'false',
                          tags: role.tags.join(', '),
                          short_description: role.shortDescription,
                          full_description: role.fullDescription,
                          requirements: role.requirements.join(', '),
                          perks: role.perks.join(', '),
                          is_hiring: 'true',
                        }),
                      });
                    }
                  }
                  alert('Imported successfully');
                  await fetchJobs();
                } catch (err) {
                  alert('Import failed');
                } finally {
                  setLoading(false);
                }
              }}
              className="flex items-center gap-2 px-4 py-2 mx-auto bg-primary/10 text-primary border border-primary/20 rounded-lg text-sm hover:bg-primary/20 transition-colors"
            >
              <Upload size={16} />
              Import Existing Roles from Site
            </button>
          </div>
        ) : (
          jobs.map((job) => (
            <div
              key={`${job.company_id}-${job.role_id}`}
              className={`border rounded-xl p-4 transition-all ${
                job.is_hiring === 'false' 
                  ? 'bg-white/[0.01] border-white/5 opacity-60 grayscale' 
                  : 'bg-white/[0.03] border-white/10'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-primary font-semibold uppercase tracking-wider">
                      {job.company_name}
                    </span>
                    {job.bosnian_only === 'true' && (
                      <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                        Bosnia Only
                      </span>
                    )}
                    {job.is_hiring === 'false' ? (
                      <span className="text-[10px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/30">
                        Not Hiring
                      </span>
                    ) : (
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        Hiring
                      </span>
                    )}
                  </div>
                  <h4 className="text-base font-bold text-white mb-1">{job.role_title}</h4>
                  <p className="text-sm text-slate-400 mb-2">{job.short_description}</p>
                  <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                    <span>{job.role_type}</span>
                    {job.salary_usd && <span>• {job.salary_usd}</span>}
                    <span>• ID: {job.role_id}</span>
                    {job.blocked_countries && <span>• 🚫 {job.blocked_countries}</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch('/api/work/admin?action=update-job', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userEmail}` },
                          body: JSON.stringify({ company_id: job.company_id, role_id: job.role_id, updates: { is_hiring: job.is_hiring === 'false' ? 'true' : 'false' } }),
                        });
                        if (!res.ok) throw new Error('Failed to toggle');
                        await fetchJobs();
                      } catch (err) { alert('Failed to toggle hiring status'); }
                    }}
                    title={job.is_hiring === 'false' ? 'Enable hiring' : 'Pause hiring'}
                    className={`p-2 border rounded-lg transition-colors ${
                      job.is_hiring === 'false'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                        : 'bg-orange-500/10 text-orange-400 border-orange-500/20 hover:bg-orange-500/20'
                    }`}
                  >
                    {job.is_hiring === 'false' ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                    )}
                  </button>
                  <button
                    onClick={() => openEditForm(job)}
                    className="p-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(job.company_id, job.role_id)}
                    className="p-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default JobPostingsManager;
