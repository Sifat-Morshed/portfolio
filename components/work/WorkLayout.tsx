import React, { useLayoutEffect, useRef } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Phone, Activity } from 'lucide-react';
import gsap from 'gsap';
import { AuthProvider } from '../../src/lib/work/AuthContext';
import WorkErrorBoundary from './WorkErrorBoundary';

const WorkLayout: React.FC = () => {
  const location = useLocation();
  const headerRef = useRef<HTMLDivElement>(null);

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

  return (
    <AuthProvider>
      <div className="min-h-screen bg-background">
        {/* Work Module Header */}
        <header
          ref={headerRef}
          className="sticky top-0 z-[100] bg-surface/80 backdrop-blur-xl border-b border-white/5"
        >
          <div className="container mx-auto px-4 md:px-6 py-3.5 flex items-center justify-between">
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
                <span className="text-base font-display font-bold text-white">
                  Work With Me
                </span>
              </Link>
            </div>

            <div className="work-nav-elem flex items-center gap-3">
              <Link
                to="/work/status"
                className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-all ${
                  location.pathname === '/work/status'
                    ? 'text-primary bg-primary/10'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Activity size={14} />
                Check Status
              </Link>
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
    </AuthProvider>
  );
};

export default WorkLayout;
