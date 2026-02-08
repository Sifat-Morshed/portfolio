import React from 'react';
import { CheckCircle, Circle, Clock, XCircle, Sparkles } from 'lucide-react';
import type { ApplicationStatus, StatusResponse } from '../../src/lib/work/types';
import { STATUS_ORDER, CLOSED_STATUSES } from '../../src/lib/work/types';

interface StatusTimelineProps {
  data: StatusResponse;
}

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  NEW: 'Application Received',
  AUDIO_PASS: 'Audio Approved',
  INTERVIEW: 'Interview Stage',
  HIRED: 'Hired',
  REJECTED: 'Not Selected',
};

const STATUS_DESCRIPTIONS: Record<ApplicationStatus, string> = {
  NEW: 'Your application is being reviewed by our team.',
  AUDIO_PASS: 'Your audio passed! Moving to the next stage.',
  INTERVIEW: 'You\'ve been selected for an interview.',
  HIRED: 'Congratulations! Welcome to the team.',
  REJECTED: 'Unfortunately, your application was not selected this time.',
};

const StatusTimeline: React.FC<StatusTimelineProps> = ({ data }) => {
  const isClosed = CLOSED_STATUSES.includes(data.status);
  const currentIndex = STATUS_ORDER.indexOf(data.status);

  const getStepState = (_stepStatus: ApplicationStatus, index: number): 'completed' | 'active' | 'pending' => {
    if (isClosed) {
      if (index === 0) return 'completed';
      return 'pending';
    }
    if (index < currentIndex) return 'completed';
    if (index === currentIndex) return 'active';
    return 'pending';
  };

  return (
    <div className="p-px rounded-2xl bg-gradient-to-b from-white/10 to-transparent">
      <div className="bg-[#0A0A0B] rounded-2xl p-6 md:p-8">
        {/* Header */}
        <div className="mb-6">
          <h3 className="text-lg font-display font-bold text-white mb-1">
            {data.role_title}
          </h3>
          <p className="text-sm text-textMuted">
            Application ID: <span className="font-mono text-primary">{data.app_id}</span>
          </p>
          <p className="text-xs text-slate-600 mt-1">
            Submitted: {new Date(data.timestamp).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Current Status Badge */}
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6 ${
          data.status === 'HIRED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
          isClosed ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
          'bg-primary/10 text-primary border border-primary/20'
        }`}>
          {data.status === 'HIRED' ? <Sparkles size={14} /> : isClosed ? <XCircle size={14} /> : <Clock size={14} />}
          {STATUS_LABELS[data.status]}
        </div>

        {/* Timeline */}
        <div className="space-y-0">
          {STATUS_ORDER.map((stepStatus, index) => {
            const state = getStepState(stepStatus, index);
            return (
              <div key={stepStatus} className="flex items-start gap-4">
                {/* Icon */}
                <div className="flex flex-col items-center">
                  {state === 'completed' ? (
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <CheckCircle size={16} className="text-emerald-400" />
                    </div>
                  ) : state === 'active' ? (
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
                      <Clock size={16} className="text-primary" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center">
                      <Circle size={16} className="text-slate-700" />
                    </div>
                  )}
                  {index < STATUS_ORDER.length - 1 && (
                    <div className={`w-px h-10 ${state === 'completed' ? 'bg-emerald-500/30' : 'bg-white/5'}`} />
                  )}
                </div>

                {/* Label */}
                <div className="pb-10">
                  <p className={`text-sm font-medium ${
                    state === 'completed' ? 'text-emerald-400' :
                    state === 'active' ? 'text-white' :
                    'text-slate-600'
                  }`}>
                    {STATUS_LABELS[stepStatus]}
                  </p>
                  {state === 'active' && (
                    <p className="text-xs text-slate-500 mt-0.5">{STATUS_DESCRIPTIONS[stepStatus]}</p>
                  )}
                </div>
              </div>
            );
          })}

          {/* Show rejection if applicable */}
          {isClosed && (
            <div className="flex items-start gap-4 mt-2">
              <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
                <XCircle size={16} className="text-red-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-red-400">{STATUS_LABELS[data.status]}</p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Updated: {new Date(data.last_updated).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatusTimeline;
