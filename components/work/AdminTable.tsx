import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Search, Download, ExternalLink, Play, Filter, FileDown, Phone, Mail, Globe, User } from 'lucide-react';
import type { ApplicationRow, ApplicationStatus } from '../../src/lib/work/types';

interface AdminTableProps {
  applications: ApplicationRow[];
  onStatusChange: (appId: string, status: ApplicationStatus, notes?: string) => void;
  onExport: () => void;
}

const STATUS_OPTIONS: ApplicationStatus[] = [
  'NEW',
  'AUDIO_PASS',
  'INTERVIEW',
  'HIRED',
  'REJECTED',
];

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  NEW: 'bg-white/10 text-white',
  AUDIO_PASS: 'bg-yellow-500/20 text-yellow-300',
  INTERVIEW: 'bg-blue-500/20 text-blue-300',
  HIRED: 'bg-emerald-500/20 text-emerald-300',
  REJECTED: 'bg-red-500/20 text-red-300',
};

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  NEW: 'New',
  AUDIO_PASS: 'Audio Pass',
  INTERVIEW: 'Interview',
  HIRED: 'Hired',
  REJECTED: 'Rejected',
};

// Quick filters for common role categories
const QUICK_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Bosnian Specialists', value: 'bosnian-specialist' },
  { label: 'Global Setters', value: 'global-setter' },
];

type SortField = 'timestamp' | 'full_name' | 'status' | 'role_id';
type SortDir = 'asc' | 'desc';

const AdminTable: React.FC<AdminTableProps> = ({ applications, onStatusChange, onExport }) => {
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    let data = [...applications];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (a) =>
          a.full_name.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q) ||
          a.app_id.toLowerCase().includes(q) ||
          (a.nationality || '').toLowerCase().includes(q)
      );
    }

    // Filter by role
    if (filterRole) {
      data = data.filter((a) => a.role_id === filterRole);
    }

    // Filter by status
    if (filterStatus) {
      data = data.filter((a) => a.status === filterStatus);
    }

    // Sort
    data.sort((a, b) => {
      const aVal = (a as Record<string, string>)[sortField] || '';
      const bVal = (b as Record<string, string>)[sortField] || '';
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return data;
  }, [applications, search, filterRole, filterStatus, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) =>
    sortField === field ? (
      sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
    ) : null;

  const handleStatusSelect = (appId: string, newStatus: ApplicationStatus) => {
    onStatusChange(appId, newStatus, editNotes[appId]);
  };

  return (
    <div className="space-y-4">
      {/* Quick Role Filters */}
      <div className="flex flex-wrap gap-2">
        {QUICK_FILTERS.map((qf) => (
          <button
            key={qf.value}
            onClick={() => setFilterRole(qf.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filterRole === qf.value
                ? 'bg-primary/20 text-primary border border-primary/30'
                : 'bg-white/5 text-slate-400 border border-white/5 hover:border-white/10'
            }`}
          >
            {qf.label}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, nationality..."
              className="pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:border-primary focus:outline-none w-64"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-[#0A0A0B] border border-white/10 rounded-lg text-sm text-white focus:border-primary focus:outline-none appearance-none cursor-pointer"
          >
            <option value="" className="bg-[#0A0A0B] text-white">All Statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s} className="bg-[#0A0A0B] text-white">{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>

        {/* Export */}
        <button
          onClick={onExport}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white hover:border-primary transition-colors"
        >
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* Desktop Table — hidden on mobile */}
      <div className="hidden md:block overflow-x-auto border border-white/10 rounded-xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.02]">
              <th
                className="text-left px-4 py-3 text-slate-500 font-medium cursor-pointer select-none"
                onClick={() => toggleSort('timestamp')}
              >
                <span className="flex items-center gap-1">Date <SortIcon field="timestamp" /></span>
              </th>
              <th
                className="text-left px-4 py-3 text-slate-500 font-medium cursor-pointer select-none"
                onClick={() => toggleSort('full_name')}
              >
                <span className="flex items-center gap-1">Name <SortIcon field="full_name" /></span>
              </th>
              <th className="text-left px-4 py-3 text-slate-500 font-medium">Email</th>
              <th className="text-left px-4 py-3 text-slate-500 font-medium">Nationality</th>
              <th
                className="text-left px-4 py-3 text-slate-500 font-medium cursor-pointer select-none"
                onClick={() => toggleSort('role_id')}
              >
                <span className="flex items-center gap-1">Role <SortIcon field="role_id" /></span>
              </th>
              <th
                className="text-left px-4 py-3 text-slate-500 font-medium cursor-pointer select-none"
                onClick={() => toggleSort('status')}
              >
                <span className="flex items-center gap-1">Status <SortIcon field="status" /></span>
              </th>
              <th className="text-left px-4 py-3 text-slate-500 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-600">
                  No applications found
                </td>
              </tr>
            ) : (
              filtered.map((app) => (
                <React.Fragment key={app.app_id}>
                  <tr
                    className="border-b border-white/5 hover:bg-white/[0.02] cursor-pointer transition-colors"
                    onClick={() => setExpandedId(expandedId === app.app_id ? null : app.app_id)}
                  >
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                      {new Date(app.timestamp).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-white font-medium">{app.full_name}</td>
                    <td className="px-4 py-3 text-slate-400">{app.email}</td>
                    <td className="px-4 py-3 text-slate-400">{app.nationality || '—'}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{app.role_title}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[app.status] || 'bg-white/10 text-white'}`}>
                        {STATUS_LABELS[app.status] || app.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <ChevronDown
                        size={16}
                        className={`text-slate-500 transition-transform ${expandedId === app.app_id ? 'rotate-180' : ''}`}
                      />
                    </td>
                  </tr>

                  {/* Expanded Quick View */}
                  {expandedId === app.app_id && (
                    <tr className="bg-white/[0.02]">
                      <td colSpan={7} className="px-4 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Details */}
                          <div className="space-y-2">
                            <p className="text-xs text-slate-600">App ID</p>
                            <p className="text-sm font-mono text-primary break-all">{app.app_id}</p>
                            <p className="text-xs text-slate-600 mt-2">Phone</p>
                            <p className="text-sm text-white">{app.phone || '—'}</p>
                            <p className="text-xs text-slate-600 mt-2">Reference</p>
                            <p className="text-sm text-white">{app.reference || '—'}</p>
                            <p className="text-xs text-slate-600 mt-2">Blacklist Acknowledged</p>
                            <p className="text-sm text-white">{app.blacklist_acknowledged === 'true' ? 'Yes' : 'No'}</p>
                          </div>

                          {/* Media Links */}
                          <div className="space-y-3">
                            {app.cv_link && (
                              <a
                                href={app.cv_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm text-primary hover:text-primaryGlow transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ExternalLink size={14} /> View CV
                              </a>
                            )}
                            {app.audio_link && (
                              <div onClick={(e) => e.stopPropagation()}>
                                <p className="text-xs text-slate-600 mb-2">Audio Sample</p>
                                <audio controls className="w-full h-8" src={app.audio_link}>
                                  <a href={app.audio_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary">
                                    <Play size={14} /> Play Audio
                                  </a>
                                </audio>
                                <a
                                  href={app.audio_link}
                                  download={`audio_${app.full_name.replace(/\s+/g, '_')}_${app.app_id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-xs text-primary hover:text-primaryGlow transition-colors mt-2"
                                >
                                  <FileDown size={12} /> Download Audio
                                </a>
                              </div>
                            )}
                          </div>

                          {/* Status Update */}
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs text-slate-600 mb-1">Update Status</label>
                              <select
                                value={app.status}
                                onChange={(e) => handleStatusSelect(app.app_id, e.target.value as ApplicationStatus)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full px-3 py-2 bg-[#0A0A0B] border border-white/10 rounded-lg text-sm text-white focus:border-primary focus:outline-none appearance-none cursor-pointer"
                              >
                                {STATUS_OPTIONS.map((s) => (
                                  <option key={s} value={s} className="bg-[#0A0A0B] text-white">{STATUS_LABELS[s]}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-slate-600 mb-1">Notes</label>
                              <textarea
                                value={editNotes[app.app_id] ?? app.notes}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  setEditNotes((prev) => ({ ...prev, [app.app_id]: e.target.value }));
                                }}
                                onClick={(e) => e.stopPropagation()}
                                rows={2}
                                className="w-full px-3 py-2 bg-[#0A0A0B] border border-white/10 rounded-lg text-sm text-white focus:border-primary focus:outline-none resize-none"
                                placeholder="Internal notes..."
                              />
                              {editNotes[app.app_id] !== undefined && editNotes[app.app_id] !== app.notes && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onStatusChange(app.app_id, app.status, editNotes[app.app_id]);
                                    setEditNotes((prev) => { const n = { ...prev }; delete n[app.app_id]; return n; });
                                  }}
                                  className="mt-2 px-3 py-1.5 bg-primary/10 border border-primary/20 text-primary rounded-lg text-xs font-medium hover:bg-primary/20 transition-colors"
                                >
                                  Save Notes
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Layout — visible only on mobile */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-600 bg-white/[0.02] border border-white/10 rounded-xl">
            No applications found
          </div>
        ) : (
          filtered.map((app) => {
            const isExpanded = expandedId === app.app_id;
            return (
              <div key={app.app_id} className="border border-white/10 rounded-xl overflow-hidden bg-white/[0.01]">
                {/* Card Header — always visible */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : app.app_id)}
                  className="w-full px-4 py-3.5 flex items-center gap-3 text-left"
                >
                  {/* Avatar circle with initials */}
                  <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-primary">
                      {app.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white truncate">{app.full_name}</p>
                      <span className={`shrink-0 inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_COLORS[app.status] || 'bg-white/10 text-white'}`}>
                        {STATUS_LABELS[app.status] || app.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate">{app.role_title} · {new Date(app.timestamp).toLocaleDateString()}</p>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`text-slate-500 shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Expanded Card Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-4 border-t border-white/5 pt-3">
                    {/* Contact Info */}
                    <div className="grid grid-cols-1 gap-2.5">
                      <div className="flex items-center gap-2.5 text-sm">
                        <Mail size={13} className="text-slate-600 shrink-0" />
                        <a href={`mailto:${app.email}`} className="text-primary truncate text-xs">{app.email}</a>
                      </div>
                      <div className="flex items-center gap-2.5 text-sm">
                        <Phone size={13} className="text-slate-600 shrink-0" />
                        <span className="text-white text-xs">{app.phone || '—'}</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-sm">
                        <Globe size={13} className="text-slate-600 shrink-0" />
                        <span className="text-white text-xs">{app.nationality || '—'}</span>
                      </div>
                    </div>

                    {/* App ID + Meta */}
                    <div className="bg-white/[0.03] rounded-lg p-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-600 uppercase tracking-wider">App ID</span>
                        <span className="font-mono text-xs text-primary">{app.app_id}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-600 uppercase tracking-wider">Reference</span>
                        <span className="text-xs text-white">{app.reference || '—'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-600 uppercase tracking-wider">Compliance</span>
                        <span className={`text-xs ${app.blacklist_acknowledged === 'true' ? 'text-emerald-400' : 'text-red-400'}`}>
                          {app.blacklist_acknowledged === 'true' ? '✓ Acknowledged' : '✗ Not acknowledged'}
                        </span>
                      </div>
                    </div>

                    {/* Media */}
                    {(app.cv_link || app.audio_link) && (
                      <div className="flex flex-wrap gap-2">
                        {app.cv_link && (
                          <a
                            href={app.cv_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-lg text-xs text-primary"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink size={12} /> View CV
                          </a>
                        )}
                        {app.audio_link && (
                          <a
                            href={app.audio_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-lg text-xs text-primary"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Play size={12} /> Play Audio
                          </a>
                        )}
                      </div>
                    )}

                    {/* Audio Player (inline on mobile) */}
                    {app.audio_link && (
                      <div onClick={(e) => e.stopPropagation()}>
                        <audio controls className="w-full h-8" src={app.audio_link}>
                          <a href={app.audio_link}>Play Audio</a>
                        </audio>
                      </div>
                    )}

                    {/* Status Update */}
                    <div className="space-y-2">
                      <label className="block text-[10px] text-slate-600 uppercase tracking-wider">Update Status</label>
                      <select
                        value={app.status}
                        onChange={(e) => handleStatusSelect(app.app_id, e.target.value as ApplicationStatus)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full px-3 py-2.5 bg-[#0A0A0B] border border-white/10 rounded-lg text-sm text-white focus:border-primary focus:outline-none appearance-none cursor-pointer"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s} className="bg-[#0A0A0B] text-white">{STATUS_LABELS[s]}</option>
                        ))}
                      </select>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                      <label className="block text-[10px] text-slate-600 uppercase tracking-wider">Notes</label>
                      <textarea
                        value={editNotes[app.app_id] ?? app.notes}
                        onChange={(e) => {
                          e.stopPropagation();
                          setEditNotes((prev) => ({ ...prev, [app.app_id]: e.target.value }));
                        }}
                        onClick={(e) => e.stopPropagation()}
                        rows={2}
                        className="w-full px-3 py-2 bg-[#0A0A0B] border border-white/10 rounded-lg text-sm text-white focus:border-primary focus:outline-none resize-none"
                        placeholder="Internal notes..."
                      />
                      {editNotes[app.app_id] !== undefined && editNotes[app.app_id] !== app.notes && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onStatusChange(app.app_id, app.status, editNotes[app.app_id]);
                            setEditNotes((prev) => { const n = { ...prev }; delete n[app.app_id]; return n; });
                          }}
                          className="w-full py-2 bg-primary/10 border border-primary/20 text-primary rounded-lg text-xs font-medium hover:bg-primary/20 transition-colors"
                        >
                          Save Notes
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <p className="text-xs text-slate-600">{filtered.length} of {applications.length} applications</p>
    </div>
  );
};

export default AdminTable;
