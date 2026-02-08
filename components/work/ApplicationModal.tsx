import React, { useState, useEffect, useCallback } from 'react';
import { X, Upload, Loader2, CheckCircle, AlertTriangle, ChevronRight, ChevronLeft } from 'lucide-react';
import AudioUploader from './AudioUploader';
import GoogleSignInButton from './GoogleSignInButton';
import type { CompanyMeta, RoleMeta } from '../../src/lib/work/types';
import { getCountryOptions } from '../../src/lib/work/countries';
import { useAuth } from '../../src/lib/work/AuthContext';

interface ApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: CompanyMeta;
  role: RoleMeta;
  session: { user: { name: string; email: string } } | null;
  onSignIn: () => void;
}

type Step = 'auth' | 'identity' | 'blacklist' | 'audio' | 'success';

const COUNTRIES = getCountryOptions();

const ApplicationModal: React.FC<ApplicationModalProps> = ({
  isOpen,
  onClose,
  company,
  role,
  session,
  onSignIn,
}) => {
  const [step, setStep] = useState<Step>(session ? 'identity' : 'auth');
  const [fullName, setFullName] = useState(session?.user?.name || '');
  const [email, setEmail] = useState(session?.user?.email || '');
  const [phone, setPhone] = useState('');
  const [nationality, setNationality] = useState('');
  const [reference, setReference] = useState('');
  const [blacklistAcknowledged, setBlacklistAcknowledged] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [appId, setAppId] = useState('');
  const [error, setError] = useState('');

  const { devMode, devSignIn, isGsiLoaded } = useAuth();

  // If session arrives (user signed in), advance past auth
  useEffect(() => {
    if (session && step === 'auth') {
      setFullName(session.user.name || '');
      setEmail(session.user.email || '');
      setStep('identity');
    }
  }, [session, step]);

  const handleClose = useCallback(() => {
    setStep(session ? 'identity' : 'auth');
    setError('');
    onClose();
  }, [session, onClose]);

  if (!isOpen) return null;

  const handleCvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('CV must be a PDF file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('CV must be under 5MB');
        return;
      }
      setCvFile(file);
      setError('');
    }
  };

  const validateIdentity = () => {
    setError('');
    if (!fullName.trim()) { setError('Please enter your full name'); return false; }
    if (!email.trim()) { setError('Please sign in with Google first'); return false; }
    if (!phone.trim()) { setError('Please enter your phone number'); return false; }
    if (!nationality) { setError('Please select your nationality'); return false; }
    if (!cvFile) { setError('Please upload your CV (PDF)'); return false; }

    // Check Bosnia-only role
    if (role.bosnianOnly && nationality !== 'Bosnia and Herzegovina') {
      setError('This role is exclusively for Bosnian nationals.');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    setError('');

    if (!audioFile) {
      setError('Please upload your audio recording');
      return;
    }

    setIsSubmitting(true);

    try {
      // Dev mode: simulate successful submission
      if (devMode) {
        await new Promise((r) => setTimeout(r, 1200));
        setAppId('DEV-' + Math.random().toString(36).substring(2, 10).toUpperCase());
        setStep('success');
        return;
      }

      const formData = new FormData();
      formData.append('company_id', company.companyId);
      formData.append('role_id', role.roleId);
      formData.append('role_title', role.title);
      formData.append('full_name', fullName);
      formData.append('email', email);
      formData.append('phone', phone);
      formData.append('nationality', nationality);
      formData.append('reference', reference);
      formData.append('blacklist_acknowledged', String(blacklistAcknowledged));

      if (cvFile) {
        formData.append('cv', cvFile);
      }

      formData.append('audio', audioFile, audioFile.name);

      const res = await fetch('/api/work/submit', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Submission failed');
      }

      const data = await res.json();
      setAppId(data.app_id);
      setStep('success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Submission failed. Please try again.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step indicator
  const steps = ['Sign In', 'Details', 'Compliance', 'Upload'];
  const stepIndex = step === 'auth' ? 0 : step === 'identity' ? 1 : step === 'blacklist' ? 2 : step === 'audio' ? 3 : 4;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop — only close on direct click, not bubbled events */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) handleClose();
        }}
      />

      {/* Modal */}
      <div
        className="relative bg-[#0A0A0B] border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl shadow-primary/5"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 rounded-t-2xl shrink-0">
          <div>
            <h2 className="text-lg font-display font-bold text-white">
              {step === 'success' ? 'You\'re In!' : `Apply: ${role.title}`}
            </h2>
            <p className="text-xs text-slate-500">{company.name}</p>
          </div>
          <button onClick={handleClose} className="text-slate-500 hover:text-white transition-colors p-1">
            <X size={20} />
          </button>
        </div>

        {/* Progress Steps */}
        {step !== 'success' && (
          <div className="px-6 pt-4 pb-2 flex items-center gap-1">
            {steps.map((s, i) => (
              <React.Fragment key={s}>
                <div className={`flex items-center gap-1.5 text-xs font-medium ${
                  i < stepIndex ? 'text-primary' : i === stepIndex ? 'text-white' : 'text-slate-600'
                }`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    i < stepIndex ? 'bg-primary text-white' : i === stepIndex ? 'bg-white text-background' : 'bg-white/5 text-slate-600'
                  }`}>
                    {i < stepIndex ? '✓' : i + 1}
                  </span>
                  <span className="hidden sm:inline">{s}</span>
                </div>
                {i < steps.length - 1 && <div className={`flex-1 h-px ${i < stepIndex ? 'bg-primary/40' : 'bg-white/5'}`} />}
              </React.Fragment>
            ))}
          </div>
        )}

        <div className="p-6 space-y-5 overflow-y-auto" data-lenis-prevent>
          {/* Step: Auth */}
          {step === 'auth' && (
            <div className="text-center py-8">
              <p className="text-slate-300 mb-6">Sign in with Google to start your application.</p>
              {/* Custom Google Sign-In Button */}
              <div className="flex justify-center">
                <GoogleSignInButton label="Sign in with Google" />
              </div>
              {!isGsiLoaded && !devMode && (
                <div className="mt-4">
                  {!import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
                    <div className="text-sm text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3 max-w-xs mx-auto">
                      <p className="font-medium mb-1">Google Sign-In not configured</p>
                      <p className="text-xs text-amber-400/70">VITE_GOOGLE_CLIENT_ID is missing from environment. Create a <code className="text-amber-300">.env.local</code> file with your Google OAuth Client ID.</p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">Loading sign-in...</p>
                  )}
                </div>
              )}
              {/* Dev Mode quick sign-in */}
              {devMode && (
                <div className="mt-6">
                  <button
                    onClick={() => devSignIn(false)}
                    className="px-6 py-3 bg-primary/10 border border-primary/20 text-primary rounded-lg font-semibold text-sm hover:bg-primary/20 transition-colors"
                  >
                    Dev Mode: Sign in as Test Applicant
                  </button>
                  <p className="text-[10px] text-slate-600 mt-2">Only visible in local dev</p>
                </div>
              )}
            </div>
          )}

          {/* Step: Identity */}
          {step === 'identity' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-primary focus:outline-none transition-colors"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-slate-500 text-sm cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-1">Phone *</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-primary focus:outline-none transition-colors"
                    placeholder="+1 234 567 8900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-1">Nationality *</label>
                  <select
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-primary focus:outline-none transition-colors appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-[#0A0A0B]">Select country...</option>
                    {COUNTRIES.map((c) =>
                      c === '---' ? (
                        <option key="sep" disabled className="bg-[#0A0A0B]">──────────────</option>
                      ) : (
                        <option key={c} value={c} className="bg-[#0A0A0B]">{c}</option>
                      )
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-1">Reference (optional)</label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-primary focus:outline-none transition-colors"
                  placeholder="Who referred you?"
                />
              </div>

              {/* CV Upload */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Upload CV (PDF) *</label>
                <label className="flex items-center gap-3 px-4 py-3 border border-dashed border-white/10 rounded-lg cursor-pointer hover:border-primary/40 transition-colors">
                  <Upload size={18} className="text-slate-500" />
                  <span className="text-sm text-slate-400">
                    {cvFile ? cvFile.name : 'Choose PDF file...'}
                  </span>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleCvChange}
                    className="hidden"
                  />
                </label>
              </div>

              {error && (
                <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
                  {error}
                </p>
              )}

              <button
                onClick={() => validateIdentity() && setStep('blacklist')}
                className="w-full py-3 bg-white text-background rounded-lg font-semibold hover:bg-white/90 transition-colors text-sm flex items-center justify-center gap-2"
              >
                Continue <ChevronRight size={16} />
              </button>
            </>
          )}

          {/* Step: Blacklist Warning */}
          {step === 'blacklist' && (
            <>
              <div className="p-px rounded-xl bg-gradient-to-b from-amber-500/30 to-transparent">
                <div className="bg-surface rounded-xl p-5">
                  <div className="flex items-start gap-3 mb-4">
                    <AlertTriangle size={22} className="text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-base font-display font-bold text-white mb-2">
                        Compliance & Commitment Notice
                      </h3>
                      <p className="text-sm text-slate-300 leading-relaxed mb-3">
                        By proceeding, you acknowledge and agree to the following:
                      </p>
                      <ul className="space-y-2 text-sm text-slate-400">
                        <li className="flex items-start gap-2">
                          <span className="text-red-400 mt-1">•</span>
                          <span><strong className="text-white">Minimum 1–2 weeks commitment is mandatory.</strong> If you quit or go inactive before completing this period, you will be <strong className="text-red-400">permanently blacklisted</strong> from all future applications and <strong className="text-red-400">banned from partner agencies</strong>.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-amber-400 mt-1">•</span>
                          All calls must follow the provided script and compliance guidelines.
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-amber-400 mt-1">•</span>
                          You will respect Do-Not-Call (DNC) lists and blacklists at all times.
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-amber-400 mt-1">•</span>
                          Any violation of calling compliance may result in immediate termination.
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-amber-400 mt-1">•</span>
                          You represent yourself honestly and provide accurate personal information.
                        </li>
                      </ul>
                    </div>
                  </div>

                  <label className="flex items-start gap-3 p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                    <input
                      type="checkbox"
                      checked={blacklistAcknowledged}
                      onChange={(e) => setBlacklistAcknowledged(e.target.checked)}
                      className="mt-0.5 w-4 h-4 accent-primary"
                    />
                    <span className="text-sm text-white font-medium">
                      I acknowledge the minimum 1–2 week commitment and all compliance requirements above. I understand that failing to meet the minimum commitment will result in being permanently blacklisted. *
                    </span>
                  </label>
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
                  {error}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => { setError(''); setStep('identity'); }}
                  className="flex-1 py-3 bg-white/5 border border-white/10 text-white rounded-lg font-medium hover:bg-white/10 transition-colors text-sm flex items-center justify-center gap-2"
                >
                  <ChevronLeft size={16} /> Back
                </button>
                <button
                  onClick={() => {
                    if (!blacklistAcknowledged) {
                      setError('You must acknowledge the compliance notice to proceed.');
                      return;
                    }
                    setError('');
                    setStep('audio');
                  }}
                  className="flex-1 py-3 bg-white text-background rounded-lg font-semibold hover:bg-white/90 transition-colors text-sm flex items-center justify-center gap-2"
                >
                  Continue <ChevronRight size={16} />
                </button>
              </div>
            </>
          )}

          {/* Step: Audio Upload */}
          {step === 'audio' && (
            <>
              <AudioUploader onFileSelected={setAudioFile} />

              {/* Error */}
              {error && (
                <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
                  {error}
                </p>
              )}

              {/* Submit */}
              <div className="flex gap-3">
                <button
                  onClick={() => { setError(''); setStep('blacklist'); }}
                  className="flex-1 py-3 bg-white/5 border border-white/10 text-white rounded-lg font-medium hover:bg-white/10 transition-colors text-sm flex items-center justify-center gap-2"
                >
                  <ChevronLeft size={16} /> Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-white text-background rounded-lg font-semibold hover:bg-white/90 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Submitting...
                    </>
                  ) : (
                    'Submit Application'
                  )}
                </button>
              </div>
            </>
          )}

          {/* Step: Success */}
          {step === 'success' && (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-emerald-400" />
              </div>
              <h3 className="text-xl font-display font-bold text-white mb-2">Application Submitted!</h3>
              <p className="text-slate-300 mb-4">Your application has been received successfully.</p>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-4">
                <p className="text-xs text-slate-500 mb-1">Your Application ID:</p>
                <p className="font-mono text-primary font-bold text-lg break-all">{appId}</p>
              </div>
              <p className="text-sm text-slate-300 mb-6">
                Save this ID to track your application status. We'll also email you a confirmation.
              </p>
              <button
                onClick={handleClose}
                className="px-6 py-2.5 bg-white text-background rounded-lg font-semibold hover:bg-white/90 transition-colors text-sm"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplicationModal;
