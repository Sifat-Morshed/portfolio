import React, { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2, ShieldCheck, LogOut, RefreshCw, ExternalLink } from 'lucide-react';
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
        <div className="text-center py-20">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchApplications}
            className="text-primary hover:text-primaryGlow transition-colors text-sm"
          >
            Try again
          </button>
        </div>
      ) : (
        <AdminTable
          applications={applications}
          onStatusChange={handleStatusChange}
          onExport={handleExport}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
