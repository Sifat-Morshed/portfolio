import React, { useRef, useEffect, useLayoutEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../src/lib/work/AuthContext';
import { ShieldCheck, LogOut } from 'lucide-react';
import gsap from 'gsap';

const AdminLogin: React.FC = () => {
  const { user, isAdmin, signOut, renderGoogleButton, isGsiLoaded, devMode, devSignIn } = useAuth();
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const comp = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.admin-elem', {
        y: 20,
        opacity: 0,
        duration: 0.35,
        stagger: 0.05,
        ease: 'power2.out',
      });
    }, comp);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (!user && isGsiLoaded && googleBtnRef.current) {
      renderGoogleButton(googleBtnRef.current);
    }
  }, [user, isGsiLoaded, renderGoogleButton]);

  // If already logged in as admin, auto-redirect
  if (user && isAdmin) {
    return <Navigate to="/work/admin" replace />;
  }

  // If logged in but not admin
  if (user && !isAdmin) {
    return (
      <div ref={comp} className="max-w-md mx-auto text-center py-12">
        <div className="admin-elem w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
          <ShieldCheck size={28} className="text-red-400" />
        </div>
        <h2 className="admin-elem text-xl font-display font-bold text-white mb-2">Access Denied</h2>
        <p className="admin-elem text-slate-300 mb-6">
          You are signed in as <span className="text-white">{user.email}</span>, but this account does not have admin access.
        </p>
        <button
          onClick={signOut}
          className="admin-elem inline-flex items-center gap-2 px-6 py-2.5 bg-white text-background rounded-lg font-semibold text-sm hover:bg-white/90 transition-colors"
        >
          <LogOut size={14} /> Sign Out & Try Again
        </button>
      </div>
    );
  }

  return (
    <div ref={comp} className="max-w-md mx-auto text-center py-12">
      <div className="admin-elem w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
        <ShieldCheck size={28} className="text-primary" />
      </div>
      <h1 className="admin-elem text-2xl font-display font-bold text-white mb-3">Admin Login</h1>
      <p className="admin-elem text-slate-300 mb-8">
        Sign in with your authorized Google account to access the admin dashboard.
      </p>
      {/* Google rendered button */}
      <div className="admin-elem flex justify-center">
        <div ref={googleBtnRef} />
      </div>
      {!isGsiLoaded && !devMode && (
        <p className="text-xs text-slate-600 mt-4">Loading sign-in...</p>
      )}
      {/* Dev Mode Buttons */}
      {devMode && (
        <div className="admin-elem mt-6 space-y-3">
          <div className="p-px rounded-xl bg-gradient-to-b from-amber-500/30 to-transparent">
            <div className="bg-surface rounded-xl p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3">Dev Mode — No Google Client ID detected</p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    localStorage.removeItem('work_session');
                    devSignIn(true);
                  }}
                  className="w-full px-4 py-3 bg-primary/10 border border-primary/20 text-primary rounded-lg font-semibold text-sm hover:bg-primary/20 transition-colors"
                >
                  Sign in as Dev Admin
                </button>
                <button
                  onClick={() => {
                    localStorage.removeItem('work_session');
                    devSignIn(false);
                  }}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 text-slate-400 rounded-lg font-medium text-sm hover:bg-white/10 transition-colors"
                >
                  Sign in as Dev Applicant
                </button>
              </div>
              <p className="text-[10px] text-slate-600 mt-3">These buttons only appear in local dev. Add VITE_GOOGLE_CLIENT_ID to .env.local for real Google auth.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLogin;
