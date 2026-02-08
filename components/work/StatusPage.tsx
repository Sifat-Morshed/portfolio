import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Loader2 } from 'lucide-react';
import gsap from 'gsap';
import StatusTimeline from './StatusTimeline';
import type { StatusResponse } from '../../src/lib/work/types';

const DEV_MODE = !import.meta.env.VITE_GOOGLE_CLIENT_ID && import.meta.env.DEV;

const StatusPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [appId, setAppId] = useState(searchParams.get('id') || '');
  const [data, setData] = useState<StatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const comp = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.status-elem', {
        y: 20,
        opacity: 0,
        duration: 0.35,
        stagger: 0.04,
        ease: 'power2.out',
      });
    }, comp);
    return () => ctx.revert();
  }, []);

  // Auto-fetch if ID is in URL
  useEffect(() => {
    const urlId = searchParams.get('id');
    if (urlId) {
      setAppId(urlId);
      fetchStatus(urlId);
    }
  }, [searchParams]);

  const fetchStatus = async (id: string) => {
    if (!id.trim()) {
      setError('Please enter an Application ID');
      return;
    }

    setIsLoading(true);
    setError('');
    setData(null);

    // Dev mode: look up from localStorage (shared with admin dashboard)
    if (DEV_MODE) {
      await new Promise((r) => setTimeout(r, 400));
      const trimmedId = id.trim();
      if (trimmedId.startsWith('DEV-')) {
        // Check if admin has saved updated status to localStorage
        const stored = localStorage.getItem('dev_applications');
        let match: StatusResponse | null = null;
        if (stored) {
          try {
            const apps = JSON.parse(stored) as Array<Record<string, string>>;
            const found = apps.find((a) => a.app_id === trimmedId);
            if (found) {
              match = {
                app_id: found.app_id,
                status: found.status as StatusResponse['status'],
                company_id: found.company_id,
                role_title: found.role_title || 'Remote Appointment Setter (Global)',
                timestamp: found.timestamp,
                last_updated: found.last_updated,
              };
            }
          } catch { /* ignore parse error */ }
        }
        setData(match || {
          app_id: trimmedId,
          status: 'NEW',
          company_id: 'silverlight-research',
          role_id: 'global-setter',
          role_title: 'Remote Appointment Setter (Global)',
          timestamp: new Date().toISOString(),
          last_updated: new Date().toISOString(),
        });
      } else {
        setError('Application not found. In dev mode, only DEV-xxx IDs are recognized.');
      }
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/work/status?id=${encodeURIComponent(id.trim())}`);

      if (res.status === 404) {
        setError('Application not found. Please check your ID and try again.');
        return;
      }

      if (!res.ok) {
        throw new Error('Failed to fetch status');
      }

      const result = await res.json();
      setData(result);
    } catch {
      setError('Unable to check status. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStatus(appId);
  };

  return (
    <div ref={comp} className="max-w-xl mx-auto">
      {/* Header */}
      <div className="status-elem text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-display font-bold text-white mb-3">
          Check Application Status
        </h1>
        <p className="text-slate-300">
          Enter your Application ID to view your current status.
        </p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSubmit} className="status-elem mb-8">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={appId}
              onChange={(e) => setAppId(e.target.value)}
              placeholder="Enter your Application ID..."
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-primary focus:outline-none transition-colors font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-3 bg-white text-background rounded-xl font-semibold hover:bg-white/90 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Check'}
          </button>
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-6 text-center">
          {error}
        </div>
      )}

      {/* Timeline */}
      {data && <StatusTimeline data={data} />}
    </div>
  );
};

export default StatusPage;
