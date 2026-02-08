import React, { useLayoutEffect, useRef, useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Activity, ChevronDown, LogOut, Mail, Briefcase } from 'lucide-react';
import gsap from 'gsap';
import { AuthProvider, useAuth } from '../../src/lib/work/AuthContext';
import WorkErrorBoundary from './WorkErrorBoundary';

/* ───────── Inner layout (needs AuthProvider above it) ───────── */
const WorkLayoutInner: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const headerRef = useRef<HTMLDivElement>(null);
  const { user, signOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.work-nav-elem', {
        y: -10,
        opacity: 0,
        duration: 0.3,
        stagger: 0.05,
        ease: 'power2.out',
      });
    }, headerRef);
    return () => ctx.revert();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleContactUs = () => {
    setDropdownOpen(false);
    navigate('/');
    setTimeout(() => {
      const el = document.getElementById('contact');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 150);
  };

  const firstName = user?.name?.split(' ')[0] || 'User';

  return (
    <div className="min-h-screen bg-background">
      {/* Work Module Header */}
      <header
        ref={headerRef}
        className="sticky top-0 z-[100] bg-surface/80 backdrop-blur-xl border-b border-white/5"
      >
        <div className="container mx-auto px-4 md:px-6 py-3.5 flex items-center justify-between">
          {/* Left: back + logo */}
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="work-nav-elem flex items-center gap-2 text-sm text-slate-500 hover:text-white transition-colors"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Portfolio</span>
            </Link>
            <div className="work-nav-elem w-px h-5 bg-border" />
            <Link to="/work" className="work-nav-elem flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-indigo-500/20 border border-primary/20 flex items-center justify-center">
                <Phone size={14} className="text-primary" />
              </div>
              <span className="text-base font-display font-bold text-white hidden sm:inline">
                Work With Me
              </span>
            </Link>
          </div>

          {/* Right: actions */}
          <div className="work-nav-elem flex items-center gap-2 sm:gap-3">
            {/* Mobile-only: Get Hired to Dial standalone button */}
            <Link
              to="/work"
              className="md:hidden flex items-center gap-1.5 text-xs font-bold text-background bg-primary px-3 py-1.5 rounded-lg shadow-[0_0_12px_-3px_rgba(6,182,212,0.4)] transition-all"
            >
              <Briefcase size={12} />
              Get Hired to Dial
            </Link>

            {/* Check Status — always highlighted */}
            <Link
              to="/work/status"
              className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg transition-all ${
                location.pathname === '/work/status'
                  ? 'text-white bg-primary shadow-[0_0_16px_-4px_rgba(6,182,212,0.5)]'
                  : 'text-primary bg-primary/10 border border-primary/20 hover:bg-primary/20'
              }`}
            >
              <Activity size={14} />
              <span className="hidden sm:inline">Check Status</span>
            </Link>

            {/* Welcome dropdown or nothing if not logged in */}
            {user && (
              <div ref={dropdownRef} className="relative">
                <button
                  onClick={() => setDropdownOpen((v) => !v)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm font-medium text-white hover:bg-white/10 transition-colors"
                >
                  {user.image ? (
                    <img src={user.image} alt="" className="w-5 h-5 rounded-full" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                      {firstName[0]}
                    </div>
                  )}
                  <span className="hidden sm:inline max-w-[100px] truncate">{firstName}</span>
                  <ChevronDown size={14} className={`text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown */}
                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-[#0A0A0B] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-white/5">
                      <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                      <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={handleContactUs}
                      className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
                    >
                      <Mail size={14} /> Contact Us
                    </button>
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        signOut();
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-colors flex items-center gap-2"
                    >
                      <LogOut size={14} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 md:px-6 py-8 md:py-12">
        <WorkErrorBoundary>
          <Outlet />
        </WorkErrorBoundary>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <p className="text-sm text-slate-600">
            &copy; {new Date().getFullYear()} Sifat Morshed. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

/* ───────── Outer wrapper provides AuthContext ───────── */
const WorkLayout: React.FC = () => (
  <AuthProvider>
    <WorkLayoutInner />
  </AuthProvider>
);

export default WorkLayout;
