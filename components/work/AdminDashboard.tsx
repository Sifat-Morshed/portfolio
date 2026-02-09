import React, { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2, ShieldCheck, LogOut, RefreshCw, ExternalLink, DollarSign, Users, Send, AlertTriangle, Skull } from 'lucide-react';
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
          onExport={handleExport}
        />

        {/* Manual Email Sender */}
        <ManualEmailSender userEmail={user?.email || ''} />

        {/* Self-Destruct */}
        <SelfDestructSection userEmail={user?.email || ''} />
        </>
      )}
    </div>
  );
};

// ─── Manual Email Sender ───────────────────────────────────────────────────────
const ManualEmailSender: React.FC<{ userEmail: string }> = ({ userEmail }) => {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

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
      setTo(''); setSubject(''); setContent('');
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
      <p className="text-xs text-slate-500 mb-4">Send emails using the portfolio dark theme template. Content will be formatted automatically.</p>
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
        rows={4} placeholder="Email content (supports line breaks)..."
        className="w-full px-3 py-2 bg-[#0A0A0B] border border-white/10 rounded-lg text-sm text-white focus:border-primary focus:outline-none resize-none mb-3"
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

// ─── Self-Destruct ─────────────────────────────────────────────────────────────
const SelfDestructSection: React.FC<{ userEmail: string }> = ({ userEmail }) => {
  const [stage, setStage] = useState(0); // 0=hidden, 1-3=confirms, 4=password, 5=final question
  const [password, setPassword] = useState('');
  const [finalAnswer, setFinalAnswer] = useState('');
  const [destroying, setDestroying] = useState(false);
  const [destroyed, setDestroyed] = useState<string | null>(null);
  const [error, setError] = useState('');

  const confirmMessages = [
    'Are you sure you want to activate self-destruct? This will permanently delete ALL data.',
    'This action is IRREVERSIBLE. All applications, files, and records will be gone forever.',
    'Final warning: There is NO undo. Everything will be destroyed. Continue?',
  ];

  const handleConfirm = () => {
    if (stage < 3) { setStage(stage + 1); setError(''); }
    else if (stage === 3) { setStage(4); setError(''); }
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
      if (!res.ok) { setError(data.error || 'Self-destruct failed'); setDestroying(false); return; }
      setDestroyed(data.timestamp);
    } catch {
      setError('Self-destruct request failed'); setDestroying(false);
    }
  };

  if (destroyed) {
    return (
      <div className="mt-8 bg-red-500/5 border border-red-500/20 rounded-xl p-12 text-center">
        <Skull size={48} className="text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-red-400 mb-2">All Data Destroyed</h3>
        <p className="text-sm text-slate-500">Destruction completed at {new Date(destroyed).toLocaleString()}</p>
        <p className="text-xs text-slate-600 mt-2">There is nothing left.</p>
      </div>
    );
  }

  return (
    <div className="mt-8 bg-white/[0.01] border border-red-500/10 rounded-xl p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-red-400/60" />
          <h3 className="text-sm font-medium text-red-400/60">Danger Zone</h3>
        </div>
        {stage === 0 && (
          <button
            onClick={() => setStage(1)}
            className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs font-medium hover:bg-red-500/20 transition-colors"
          >
            Self-Destruct
          </button>
        )}
      </div>

      {stage >= 1 && stage <= 3 && (
        <div className="mt-4 p-4 bg-red-500/5 border border-red-500/20 rounded-lg">
          <p className="text-sm text-red-300 mb-3">{confirmMessages[stage - 1]}</p>
          <div className="flex gap-2">
            <button onClick={handleConfirm} className="px-4 py-1.5 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-xs font-medium hover:bg-red-500/30 transition-colors">
              Yes, Continue ({stage}/5)
            </button>
            <button onClick={() => { setStage(0); setPassword(''); setFinalAnswer(''); setError(''); }} className="px-4 py-1.5 bg-white/5 border border-white/10 text-slate-400 rounded-lg text-xs font-medium hover:bg-white/10 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {stage === 4 && (
        <div className="mt-4 p-4 bg-red-500/5 border border-red-500/20 rounded-lg">
          <p className="text-sm text-red-300 mb-1">Enter the self-destruct password</p>
          <p className="text-xs text-slate-600 mb-3">Hint: "Money is?"</p>
          <input
            type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="Password..."
            className="w-full px-3 py-2 bg-[#0A0A0B] border border-red-500/20 rounded-lg text-sm text-white focus:border-red-400 focus:outline-none mb-2"
          />
          <div className="flex gap-2">
            <button onClick={handlePasswordSubmit} className="px-4 py-1.5 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-xs font-medium hover:bg-red-500/30 transition-colors">
              Continue (4/5)
            </button>
            <button onClick={() => { setStage(0); setPassword(''); setFinalAnswer(''); setError(''); }} className="px-4 py-1.5 bg-white/5 border border-white/10 text-slate-400 rounded-lg text-xs font-medium hover:bg-white/10 transition-colors">
              Cancel
            </button>
          </div>
          {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
        </div>
      )}

      {stage === 5 && (
        <div className="mt-4 p-4 bg-red-500/5 border border-red-500/20 rounded-lg">
          <p className="text-sm text-red-300 mb-1">Final question: Who is the love of your life?</p>
          <input
            type="text" value={finalAnswer} onChange={(e) => setFinalAnswer(e.target.value)}
            placeholder="Your answer..."
            className="w-full px-3 py-2 bg-[#0A0A0B] border border-red-500/20 rounded-lg text-sm text-white focus:border-red-400 focus:outline-none mb-2"
          />
          <div className="flex gap-2">
            <button onClick={handleFinalSubmit} disabled={destroying} className="px-4 py-1.5 bg-red-600/30 border border-red-500/40 text-red-300 rounded-lg text-xs font-bold hover:bg-red-600/50 transition-colors disabled:opacity-50">
              {destroying ? 'Destroying...' : 'DESTROY EVERYTHING (5/5)'}
            </button>
            <button onClick={() => { setStage(0); setPassword(''); setFinalAnswer(''); setError(''); }} className="px-4 py-1.5 bg-white/5 border border-white/10 text-slate-400 rounded-lg text-xs font-medium hover:bg-white/10 transition-colors">
              Cancel
            </button>
          </div>
          {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
