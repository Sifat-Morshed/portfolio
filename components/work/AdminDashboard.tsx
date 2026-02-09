import React, { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2, ShieldCheck, LogOut, RefreshCw, ExternalLink, DollarSign, Users, Send, AlertTriangle, Skull, UserPlus, FileText } from 'lucide-react';
import { useAuth } from '../../src/lib/work/AuthContext';
import AdminTable from './AdminTable';
import type { ApplicationRow, ApplicationStatus } from '../../src/lib/work/types';

const DEV_MODE = !import.meta.env.VITE_GOOGLE_CLIENT_ID && import.meta.env.DEV;

// Mock data for local dev testing
const MOCK_APPLICATIONS: ApplicationRow[] = DEV_MODE
  ? [
      {
        app_id: 'DEV-001',
        timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
        status: 'NEW',
        company_id: 'silverlight-research',
        role_id: 'global-setter',
        role_title: 'Remote Appointment Setter (Global)',
        full_name: 'Ayesha Khan',
        email: 'ayesha.k@example.com',
        phone: '+90 555 123 4567',
        nationality: 'Turkey',
        reference: 'LinkedIn job post',
        blacklist_acknowledged: 'true',
        cv_link: '',
        audio_link: '',
        notes: '',
        last_updated: new Date(Date.now() - 2 * 86400000).toISOString(),
        started_date: '',
        email_log: 'NEW',
        rejection_date: '',
      },
      {
        app_id: 'DEV-002',
        timestamp: new Date(Date.now() - 1 * 86400000).toISOString(),
        status: 'AUDIO_PASS',
        company_id: 'silverlight-research',
        role_id: 'bosnian-specialist',
        role_title: 'Senior Sales Specialist (Bosnia Exclusive)',
        full_name: 'Amir Hodžić',
        email: 'amir.h@example.com',
        phone: '+387 61 234 567',
        nationality: 'Bosnia and Herzegovina',
        reference: '',
        blacklist_acknowledged: 'true',
        cv_link: 'https://example.com/cv.pdf',
        audio_link: 'https://example.com/audio.mp3',
        notes: 'Strong English, great tone',
        last_updated: new Date(Date.now() - 12 * 3600000).toISOString(),
        started_date: '',
        email_log: 'NEW,AUDIO_PASS',
        rejection_date: '',
      },
      {
        app_id: 'DEV-003',
        timestamp: new Date(Date.now() - 5 * 86400000).toISOString(),
        status: 'INTERVIEW',
        company_id: 'silverlight-research',
        role_id: 'global-setter',
        role_title: 'Remote Appointment Setter (Global)',
        full_name: 'Carlos Mendez',
        email: 'carlos.m@example.com',
        phone: '+52 55 1234 5678',
        nationality: 'Mexico',
        reference: 'Friend referral',
        blacklist_acknowledged: 'true',
        cv_link: 'https://example.com/cv2.pdf',
        audio_link: 'https://example.com/audio2.mp3',
        notes: 'Scheduled for Monday',
        last_updated: new Date(Date.now() - 3 * 86400000).toISOString(),
        started_date: '',
        email_log: 'NEW,AUDIO_PASS,INTERVIEW',
        rejection_date: '',
      },
      {
        app_id: 'DEV-004',
        timestamp: new Date(Date.now() - 10 * 86400000).toISOString(),
        status: 'HIRED',
        company_id: 'silverlight-research',
        role_id: 'global-setter',
        role_title: 'Remote Appointment Setter (Global)',
        full_name: 'Maria Santos',
        email: 'maria.s@example.com',
        phone: '+27 82 345 6789',
        nationality: 'South Africa',
        reference: '',
        blacklist_acknowledged: 'true',
        cv_link: '',
        audio_link: 'https://example.com/audio3.mp3',
        notes: 'Started on Jan 28',
        last_updated: new Date(Date.now() - 7 * 86400000).toISOString(),
        started_date: new Date(Date.now() - 10 * 86400000).toISOString(),
        email_log: 'NEW,AUDIO_PASS,INTERVIEW,HIRED',
        rejection_date: '',
      },
      {
        app_id: 'DEV-005',
        timestamp: new Date(Date.now() - 8 * 86400000).toISOString(),
        status: 'REJECTED',
        company_id: 'silverlight-research',
        role_id: 'global-setter',
        role_title: 'Remote Appointment Setter (Global)',
        full_name: 'John Test',
        email: 'john.t@example.com',
        phone: '+1 555 000 1111',
        nationality: 'Philippines',
        reference: '',
        blacklist_acknowledged: 'false',
        cv_link: '',
        audio_link: '',
        notes: 'Did not meet English requirement',
        last_updated: new Date(Date.now() - 7 * 86400000).toISOString(),
        started_date: '',
        email_log: 'NEW,REJECTED',
        rejection_date: new Date(Date.now() - 7 * 86400000).toISOString(),
      },
    ]
  : [];

const AdminDashboard: React.FC = () => {
  const { user, isAdmin, isLoading: authLoading, signOut } = useAuth();
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchApplications = useCallback(async () => {
    if (!user?.email) return;

    setIsLoading(true);
    setError('');

    // In dev mode (no Google Client ID), use mock data
    if (DEV_MODE) {
      await new Promise((r) => setTimeout(r, 500)); // simulate loading
      setApplications(MOCK_APPLICATIONS);
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/work/admin/list', {
        headers: {
          Authorization: `Bearer ${user.email}`,
        },
      });

      if (res.status === 403) {
        setError('Access denied. Make sure ADMIN_EMAIL in Vercel matches your Google email exactly.');
        return;
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server error (${res.status})`);
      }

      const data = await res.json();
      setApplications(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to load applications: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    if (isAdmin && user?.email) {
      fetchApplications();
    }
  }, [isAdmin, user?.email, fetchApplications]);

  // Redirect if not authenticated
  if (!authLoading && !user) {
    return <Navigate to="/work/admin/login" replace />;
  }

  // Redirect if not admin
  if (!authLoading && user && !isAdmin) {
    return <Navigate to="/work/admin/login" replace />;
  }

  const handleStatusChange = async (appId: string, status: ApplicationStatus, notes?: string) => {
    // Dev mode: update mock data locally + persist to localStorage for StatusPage sync
    if (DEV_MODE) {
      setApplications((prev) => {
        const updated = prev.map((app) =>
          app.app_id === appId
            ? { ...app, status, notes: notes ?? app.notes, last_updated: new Date().toISOString() }
            : app
        );
        // Persist to localStorage so StatusPage can read updated statuses
        try { localStorage.setItem('dev_applications', JSON.stringify(updated)); } catch { /* ignore */ }
        return updated;
      });
      return;
    }

    try {
      const res = await fetch('/api/work/admin/update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.email || ''}`,
        },
        body: JSON.stringify({ app_id: appId, status, notes }),
      });

      if (!res.ok) {
        throw new Error('Update failed');
      }

      // Refresh data
      await fetchApplications();
    } catch {
      alert('Failed to update application status');
    }
  };

  const handleExport = async () => {
    try {
      let csv: string;

      if (DEV_MODE) {
        // Generate CSV from local mock data
        const cols = ['app_id','timestamp','status','company_id','role_id','role_title','full_name','email','phone','nationality','reference','blacklist_acknowledged','cv_link','audio_link','notes','last_updated'];
        const header = cols.join(',');
        const rows = applications.map((app) =>
          cols.map((col) => {
            const val = (app as Record<string, string>)[col] || '';
            return val.includes(',') || val.includes('"') ? `"${val.replace(/"/g, '""')}"` : val;
          }).join(',')
        );
        csv = [header, ...rows].join('\n');
      } else {
        const res = await fetch('/api/work/admin/export', {
          headers: {
            Authorization: `Bearer ${user?.email || ''}`,
          },
        });
        if (!res.ok) throw new Error('Export failed');
        csv = await res.text();
      }

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `applications_${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Failed to export applications');
    }
  };

  const handleDelete = async (appId: string) => {
    if (DEV_MODE) {
      setApplications((prev) => {
        const updated = prev.filter((app) => app.app_id !== appId);
        try { localStorage.setItem('dev_applications', JSON.stringify(updated)); } catch { /* ignore */ }
        return updated;
      });
      return;
    }

    try {
      const res = await fetch('/api/work/admin/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.email || ''}`,
        },
        body: JSON.stringify({ app_id: appId }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Delete failed');
      }

      await fetchApplications();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete application');
    }
  };

  const handleBulkDelete = async (appIds: string[]) => {
    if (DEV_MODE) {
      setApplications((prev) => {
        const updated = prev.filter((app) => !appIds.includes(app.app_id));
        try { localStorage.setItem('dev_applications', JSON.stringify(updated)); } catch { /* ignore */ }
        return updated;
      });
      return;
    }

    try {
      const res = await fetch('/api/work/admin/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.email || ''}`,
        },
        body: JSON.stringify({ app_ids: appIds }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Bulk delete failed');
      }

      const data = await res.json();
      if (data.failed > 0) {
        alert(`Deleted ${data.deleted} of ${appIds.length}. ${data.failed} failed.`);
      }

      await fetchApplications();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to bulk delete');
    }
  };

  // Calculate earnings stats: workers who have been hired for >= 7 days
  const earningsStats = (() => {
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const hiredApps = applications.filter((a) => a.status === 'HIRED' && a.started_date);
    const activeWorkers = hiredApps.filter((a) => (Date.now() - new Date(a.started_date!).getTime()) >= sevenDaysMs);
    return { totalHired: hiredApps.length, activeWorkers: activeWorkers.length };
  })();

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Dev Mode Banner */}
      {DEV_MODE && (
        <div className="mb-6 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3">
          <span className="text-amber-400 text-lg font-bold">DEV</span>
          <div>
            <p className="text-sm font-medium text-amber-400">Dev Mode — Mock Data</p>
            <p className="text-xs text-amber-400/60">Showing {applications.length} sample applications. API calls are simulated. Deploy to Vercel with env vars for real Sheets integration.</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck size={20} className="text-green-400" />
            <h1 className="text-2xl font-display font-bold text-white">Admin Dashboard</h1>
          </div>
          <p className="text-sm text-slate-300">
            Manage applications · Signed in as <span className="text-primary">{user?.email}</span>
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <SelfDestructButton userEmail={user?.email || ''} />
          {import.meta.env.VITE_GOOGLE_SHEET_URL && (
            <a
              href={import.meta.env.VITE_GOOGLE_SHEET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-sm text-emerald-400 hover:bg-emerald-500/20 transition-colors"
            >
              <ExternalLink size={14} /> Google Sheet
            </a>
          )}
          {DEV_MODE && !import.meta.env.VITE_GOOGLE_SHEET_URL && (
            <span className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/5 rounded-lg text-sm text-slate-600 cursor-default" title="Add VITE_GOOGLE_SHEET_URL to .env.local to enable">
              <ExternalLink size={14} /> Sheet (not configured)
            </span>
          )}
          <button
            onClick={fetchApplications}
            className="flex items-center gap-2 px-4 py-2 bg-surfaceHighlight border border-border rounded-lg text-sm text-white hover:border-primary transition-colors"
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            onClick={signOut}
            className="flex items-center gap-2 px-4 py-2 bg-surfaceHighlight border border-border rounded-lg text-sm text-slate-400 hover:text-red-400 hover:border-red-400/30 transition-colors"
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="text-primary animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-12 px-4">
          <p className="text-red-400 mb-4 text-sm break-words whitespace-pre-wrap">{error}</p>
          <button
            onClick={fetchApplications}
            className="px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-lg text-sm hover:bg-primary/20 transition-colors"
          >
            Try again
          </button>
        </div>
      ) : (
        <>
        {/* Earnings / Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Total Applications</p>
            <p className="text-2xl font-bold text-white">{applications.length}</p>
          </div>
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <Users size={12} className="text-emerald-400" />
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Hired</p>
            </div>
            <p className="text-2xl font-bold text-emerald-400">{earningsStats.totalHired}</p>
          </div>
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <DollarSign size={12} className="text-emerald-400" />
              <p className="text-[10px] text-emerald-400 uppercase tracking-wider">Earnings Eligible</p>
            </div>
            <p className="text-2xl font-bold text-emerald-300">{earningsStats.activeWorkers}</p>
            <p className="text-[10px] text-slate-600 mt-0.5">Workers 7+ days active</p>
          </div>
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Rejection Rate</p>
            <p className="text-2xl font-bold text-slate-300">{applications.length ? Math.round((applications.filter(a => a.status === 'REJECTED').length / applications.length) * 100) : 0}%</p>
          </div>
        </div>

        <AdminTable
          applications={applications}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
          onBulkDelete={handleBulkDelete}
          onExport={handleExport}
        />

        {/* Manual Application Logger */}
        <ManualApplicationLogger userEmail={user?.email || ''} onLogged={fetchApplications} />

        {/* Manual Email Sender */}
        <ManualEmailSender userEmail={user?.email || ''} />
        </>
      )}
    </div>
  );
};

// ─── Manual Application Logger ─────────────────────────────────────────────────
const ROLE_OPTIONS = [
  { id: 'global-setter', title: 'Remote Appointment Setter (Global)', company: 'silverlight-research' },
  { id: 'bosnian-specialist', title: 'Senior Sales Specialist (Bosnia Exclusive)', company: 'silverlight-research' },
];

const ManualApplicationLogger: React.FC<{ userEmail: string; onLogged: () => void }> = ({ userEmail, onLogged }) => {
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', nationality: '', role_id: ROLE_OPTIONS[0].id, reference: '' });
  const [logging, setLogging] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const selectedRole = ROLE_OPTIONS.find(r => r.id === form.role_id) || ROLE_OPTIONS[0];

  const handleLog = async () => {
    if (!form.full_name || !form.email || !form.phone || !form.nationality) {
      setResult({ ok: false, msg: 'Name, email, phone, and nationality are required' });
      return;
    }
    setLogging(true);
    setResult(null);
    try {
      const res = await fetch('/api/work/admin/manual-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userEmail}` },
        body: JSON.stringify({
          full_name: form.full_name,
          email: form.email,
          phone: form.phone,
          nationality: form.nationality,
          role_id: selectedRole.id,
          role_title: selectedRole.title,
          company_id: selectedRole.company,
          reference: form.reference,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'duplicate') {
          throw new Error(`Duplicate: ${data.existing_name} already applied (${data.existing_id})`);
        }
        throw new Error(data.error || 'Failed to log');
      }
      setResult({ ok: true, msg: `Logged successfully! App ID: ${data.app_id} — confirmation email sent.` });
      setForm({ full_name: '', email: '', phone: '', nationality: '', role_id: ROLE_OPTIONS[0].id, reference: '' });
      onLogged();
    } catch (err) {
      setResult({ ok: false, msg: err instanceof Error ? err.message : 'Failed to log application' });
    } finally {
      setLogging(false);
    }
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="mt-8 bg-white/[0.02] border border-white/10 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <UserPlus size={16} className="text-emerald-400" />
        <h3 className="text-lg font-bold text-white">Manual Application Logger</h3>
      </div>
      <p className="text-xs text-slate-500 mb-4">Log an application manually. The applicant will receive the same confirmation email as a normal submission.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <input type="text" value={form.full_name} onChange={set('full_name')} placeholder="Full Name *"
          className="px-3 py-2 bg-[#0A0A0B] border border-white/10 rounded-lg text-sm text-white focus:border-emerald-400 focus:outline-none" />
        <input type="email" value={form.email} onChange={set('email')} placeholder="Email *"
          className="px-3 py-2 bg-[#0A0A0B] border border-white/10 rounded-lg text-sm text-white focus:border-emerald-400 focus:outline-none" />
        <input type="tel" value={form.phone} onChange={set('phone')} placeholder="Phone *"
          className="px-3 py-2 bg-[#0A0A0B] border border-white/10 rounded-lg text-sm text-white focus:border-emerald-400 focus:outline-none" />
        <input type="text" value={form.nationality} onChange={set('nationality')} placeholder="Nationality *"
          className="px-3 py-2 bg-[#0A0A0B] border border-white/10 rounded-lg text-sm text-white focus:border-emerald-400 focus:outline-none" />
        <select value={form.role_id} onChange={set('role_id')}
          className="px-3 py-2 bg-[#0A0A0B] border border-white/10 rounded-lg text-sm text-white focus:border-emerald-400 focus:outline-none appearance-none cursor-pointer">
          {ROLE_OPTIONS.map(r => (
            <option key={r.id} value={r.id} className="bg-[#0A0A0B] text-white">{r.title}</option>
          ))}
        </select>
        <input type="text" value={form.reference} onChange={set('reference')} placeholder="Reference (optional)"
          className="px-3 py-2 bg-[#0A0A0B] border border-white/10 rounded-lg text-sm text-white focus:border-emerald-400 focus:outline-none" />
      </div>
      <div className="flex items-center gap-3">
        <button onClick={handleLog} disabled={logging}
          className="flex items-center gap-2 px-5 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-500/20 transition-colors disabled:opacity-50">
          {logging ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
          {logging ? 'Logging...' : 'Log Application'}
        </button>
        {result && (
          <p className={`text-xs ${result.ok ? 'text-emerald-400' : 'text-red-400'}`}>{result.msg}</p>
        )}
      </div>
    </div>
  );
};

// ─── Manual Email Sender with Templates ────────────────────────────────────────
const EMAIL_TEMPLATES: { label: string; subject: string; content: string }[] = [
  {
    label: 'Custom (blank)',
    subject: '',
    content: '',
  },
  {
    label: 'Application Received',
    subject: 'Application Received – [Role Title]',
    content: `Hi [Applicant Name],

Thank you for submitting your application. We've received it and it is currently under review.

Your application ID has been assigned and you can track your status anytime using the link provided in your confirmation email.

We'll be in touch soon with next steps. If you have any questions in the meantime, feel free to reply to this email.

Best regards,
Sifat Morshed`,
  },
  {
    label: 'Status Change / Update',
    subject: 'Application Update – [Role Title]',
    content: `Hi [Applicant Name],

We wanted to let you know that your application status has been updated.

Please check your application status page for the latest details. If you have any questions, don't hesitate to reach out.

Best regards,
Sifat Morshed`,
  },
  {
    label: 'Audio Script Request',
    subject: 'Action Required: Audio Recording – [Role Title]',
    content: `Hi [Applicant Name],

As part of your application process, we need you to record a short audio sample (45–60 seconds). This helps us evaluate your English communication and phone presence.

Please follow the instructions below carefully:

──────────────────

AUDIO RECORDING INSTRUCTIONS

Record yourself reading the script below. Keep it between 45 and 60 seconds. Use a quiet environment, speak clearly, and don't rush.

Part 1 – Introduction (~30 seconds):
Speak naturally about yourself — your name, where you're from, any relevant experience you have, and why you're interested in this role.

Part 2 – Cold Call Roleplay (~15–30 seconds):
You are calling a senior IT director named Mr. James. He is busy and skeptical. Your goal is to introduce Silverlight Research, explain you're conducting a short industry survey on the evolving cyber threats in enterprise infrastructure (not selling anything), and convince him to stay on the line for 2 minutes of questions.

Stay confident, handle his pushback, and keep it professional.

──────────────────

Once your recording is ready, you can upload it through your application status page or reply to this email with the audio file attached.

Accepted formats: MP3, WAV, M4A, WEBM (max 5 MB).

Sifat Morshed | Independent Contractor | Recruiting for: Silverlight Research`,
  },
];

const ManualEmailSender: React.FC<{ userEmail: string }> = ({ userEmail }) => {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(0);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const applyTemplate = (index: number) => {
    setSelectedTemplate(index);
    const t = EMAIL_TEMPLATES[index];
    setSubject(t.subject);
    setContent(t.content);
    setResult(null);
  };

  const handleSend = async () => {
    if (!to || !subject || !content) { setResult({ ok: false, msg: 'All fields are required' }); return; }
    setSending(true);
    setResult(null);
    try {
      const res = await fetch('/api/work/admin/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userEmail}` },
        body: JSON.stringify({ to, subject, content }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to send');
      }
      setResult({ ok: true, msg: 'Email sent successfully!' });
      setTo(''); setSubject(''); setContent(''); setSelectedTemplate(0);
    } catch (err) {
      setResult({ ok: false, msg: err instanceof Error ? err.message : 'Failed to send email' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mt-8 bg-white/[0.02] border border-white/10 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Send size={16} className="text-primary" />
        <h3 className="text-lg font-bold text-white">Manual Email Sender</h3>
      </div>
      <p className="text-xs text-slate-500 mb-4">Send emails using the portfolio dark theme template. Select a template to auto-fill, then edit as needed. Use <span className="text-primary font-mono">[Applicant Name]</span> and <span className="text-primary font-mono">[Role Title]</span> as placeholders.</p>

      {/* Template Selector */}
      <div className="flex flex-wrap gap-2 mb-4">
        {EMAIL_TEMPLATES.map((t, i) => (
          <button
            key={i}
            onClick={() => applyTemplate(i)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              selectedTemplate === i
                ? 'bg-primary/20 text-primary border border-primary/30'
                : 'bg-white/5 text-slate-400 border border-white/5 hover:border-white/10'
            }`}
          >
            <FileText size={12} />
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <input
          type="email" value={to} onChange={(e) => setTo(e.target.value)}
          placeholder="Recipient email..."
          className="px-3 py-2 bg-[#0A0A0B] border border-white/10 rounded-lg text-sm text-white focus:border-primary focus:outline-none"
        />
        <input
          type="text" value={subject} onChange={(e) => setSubject(e.target.value)}
          placeholder="Subject..."
          className="px-3 py-2 bg-[#0A0A0B] border border-white/10 rounded-lg text-sm text-white focus:border-primary focus:outline-none"
        />
      </div>
      <textarea
        value={content} onChange={(e) => setContent(e.target.value)}
        rows={selectedTemplate === 3 ? 14 : 6} placeholder="Email content (supports line breaks)..."
        className="w-full px-3 py-2 bg-[#0A0A0B] border border-white/10 rounded-lg text-sm text-white focus:border-primary focus:outline-none resize-none mb-3 leading-relaxed"
      />
      <div className="flex items-center gap-3">
        <button
          onClick={handleSend} disabled={sending}
          className="flex items-center gap-2 px-5 py-2 bg-primary/10 border border-primary/20 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors disabled:opacity-50"
        >
          {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          {sending ? 'Sending...' : 'Send Email'}
        </button>
        {result && (
          <p className={`text-xs ${result.ok ? 'text-emerald-400' : 'text-red-400'}`}>{result.msg}</p>
        )}
      </div>
    </div>
  );
};

// ─── Self-Destruct (top-right button + modal overlay) ─────────────────────────
const LOCKOUT_KEY = 'sd_lockout';
const FAILS_KEY = 'sd_fails';
const LOCKOUT_MS = 30 * 60 * 1000; // 30 minutes
const MAX_FAILS = 3;

function getLockoutEnd(): number {
  try { return parseInt(localStorage.getItem(LOCKOUT_KEY) || '0', 10); } catch { return 0; }
}
function getFailCount(): number {
  try { return parseInt(localStorage.getItem(FAILS_KEY) || '0', 10); } catch { return 0; }
}

const SelfDestructButton: React.FC<{ userEmail: string }> = ({ userEmail }) => {
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState(0); // 0=closed, 1-3=confirms, 4=password, 5=final
  const [password, setPassword] = useState('');
  const [finalAnswer, setFinalAnswer] = useState('');
  const [destroying, setDestroying] = useState(false);
  const [destroyed, setDestroyed] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [fails, setFails] = useState(getFailCount());
  const [locked, setLocked] = useState(Date.now() < getLockoutEnd());
  const [lockRemaining, setLockRemaining] = useState('');

  // Lockout countdown timer
  useEffect(() => {
    if (!locked) return;
    const iv = setInterval(() => {
      const end = getLockoutEnd();
      const remaining = end - Date.now();
      if (remaining <= 0) {
        setLocked(false);
        setLockRemaining('');
        localStorage.removeItem(LOCKOUT_KEY);
        localStorage.removeItem(FAILS_KEY);
        setFails(0);
        clearInterval(iv);
      } else {
        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        setLockRemaining(`${mins}m ${secs}s`);
      }
    }, 1000);
    return () => clearInterval(iv);
  }, [locked]);

  const reset = () => { setStage(0); setOpen(false); setPassword(''); setFinalAnswer(''); setError(''); };

  const recordFail = () => {
    const newFails = fails + 1;
    setFails(newFails);
    localStorage.setItem(FAILS_KEY, String(newFails));
    if (newFails >= MAX_FAILS) {
      const lockEnd = Date.now() + LOCKOUT_MS;
      localStorage.setItem(LOCKOUT_KEY, String(lockEnd));
      setLocked(true);
      reset();
    }
  };

  const handleOpen = () => {
    if (Date.now() < getLockoutEnd()) { setLocked(true); return; }
    setOpen(true); setStage(1); setError('');
  };

  const confirmMessages = [
    'Are you sure you want to activate self-destruct? This will permanently delete ALL data and the entire website.',
    'This action is IRREVERSIBLE. All applications, code, files, and records will be destroyed forever.',
    'Final warning: There is absolutely NO undo. The entire site will cease to exist. Continue?',
  ];

  const handleConfirm = () => {
    if (stage < 3) { setStage(stage + 1); setError(''); }
    else { setStage(4); setError(''); }
  };

  const handlePasswordSubmit = () => {
    if (!password.trim()) { setError('Enter the password'); return; }
    setStage(5); setError('');
  };

  const handleFinalSubmit = async () => {
    if (!finalAnswer.trim()) { setError('Answer the question'); return; }
    setDestroying(true); setError('');
    try {
      const res = await fetch('/api/work/admin/self-destruct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userEmail}` },
        body: JSON.stringify({ password, final_answer: finalAnswer }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Wrong password or wrong answer — push back to stage 1 + record fail
        recordFail();
        setPassword(''); setFinalAnswer('');
        setStage(locked ? 0 : 1);
        setError(data.error || 'Verification failed. Starting over.');
        setDestroying(false);
        return;
      }
      // Clear fail tracking on success
      localStorage.removeItem(FAILS_KEY);
      localStorage.removeItem(LOCKOUT_KEY);
      setDestroyed(data.timestamp);
    } catch {
      recordFail();
      setPassword(''); setFinalAnswer('');
      setStage(locked ? 0 : 1);
      setError('Request failed. Starting over.');
      setDestroying(false);
    }
  };

  // After destruction — fullscreen dark page
  if (destroyed) {
    return (
      <div className="fixed inset-0 z-[999] bg-[#050505] flex items-center justify-center">
        <div className="text-center px-6">
          <Skull size={64} className="text-red-600 mx-auto mb-6 animate-pulse" />
          <h1 className="text-3xl font-bold text-red-500 mb-3">This Site Has Been Permanently Shut Down</h1>
          <p className="text-slate-500 text-sm mb-2">All code, data, files, and the entire website have been irreversibly destroyed.</p>
          <p className="text-slate-500 text-xs mb-1">The GitHub repository now contains only a termination page.</p>
          <p className="text-slate-600 text-xs">Terminated at {new Date(destroyed).toLocaleString()}</p>
          <div className="mt-8 border-t border-white/5 pt-6">
            <p className="text-slate-700 text-xs">There is nothing left.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Small red button in top corner */}
      <button
        onClick={handleOpen}
        disabled={locked}
        className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        title={locked ? `Locked for ${lockRemaining}` : 'Self-Destruct'}
      >
        <Skull size={13} />
        {locked ? lockRemaining : ''}
      </button>

      {/* Modal overlay */}
      {open && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={reset} />
          <div className="relative bg-[#0A0A0B] border border-red-500/20 rounded-2xl w-full max-w-md p-6 shadow-2xl shadow-red-500/5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={18} className="text-red-400" />
              <h3 className="text-lg font-bold text-red-400">Self-Destruct Sequence</h3>
            </div>

            {fails > 0 && fails < MAX_FAILS && (
              <p className="text-[11px] text-yellow-400 mb-3">Warning: {MAX_FAILS - fails} attempt(s) remaining before 30-minute lockout</p>
            )}

            {stage >= 1 && stage <= 3 && (
              <div>
                <p className="text-sm text-red-300 mb-4">{confirmMessages[stage - 1]}</p>
                <div className="flex gap-2">
                  <button onClick={handleConfirm} className="flex-1 py-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-xs font-medium hover:bg-red-500/30 transition-colors">
                    Yes, Continue ({stage}/5)
                  </button>
                  <button onClick={reset} className="flex-1 py-2 bg-white/5 border border-white/10 text-slate-400 rounded-lg text-xs font-medium hover:bg-white/10 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {stage === 4 && (
              <div>
                <p className="text-sm text-red-300 mb-1">Enter the self-destruct password</p>
                <p className="text-xs text-slate-600 mb-3">Hint: "Money is?"</p>
                <input
                  type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                  placeholder="Password..." autoFocus
                  className="w-full px-3 py-2 bg-[#050505] border border-red-500/20 rounded-lg text-sm text-white focus:border-red-400 focus:outline-none mb-3"
                />
                <div className="flex gap-2">
                  <button onClick={handlePasswordSubmit} className="flex-1 py-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-xs font-medium hover:bg-red-500/30 transition-colors">
                    Continue (4/5)
                  </button>
                  <button onClick={reset} className="flex-1 py-2 bg-white/5 border border-white/10 text-slate-400 rounded-lg text-xs font-medium hover:bg-white/10 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {stage === 5 && (
              <div>
                <p className="text-sm text-red-300 mb-1">Final question: Who is the love of your life?</p>
                <input
                  type="text" value={finalAnswer} onChange={(e) => setFinalAnswer(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleFinalSubmit()}
                  placeholder="Your answer..." autoFocus
                  className="w-full px-3 py-2 bg-[#050505] border border-red-500/20 rounded-lg text-sm text-white focus:border-red-400 focus:outline-none mb-3"
                />
                <div className="flex gap-2">
                  <button onClick={handleFinalSubmit} disabled={destroying} className="flex-1 py-2 bg-red-600/30 border border-red-500/40 text-red-300 rounded-lg text-xs font-bold hover:bg-red-600/50 transition-colors disabled:opacity-50">
                    {destroying ? 'Destroying...' : 'DESTROY EVERYTHING (5/5)'}
                  </button>
                  <button onClick={reset} className="flex-1 py-2 bg-white/5 border border-white/10 text-slate-400 rounded-lg text-xs font-medium hover:bg-white/10 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {error && <p className="text-xs text-red-400 mt-3">{error}</p>}
          </div>
        </div>
      )}
    </>
  );
};

export default AdminDashboard;
