import React, { useLayoutEffect, useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Phone, DollarSign, ArrowRight, Users, Globe, TrendingUp, Clock } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { COMPANIES } from '../../src/lib/work/opportunities';

gsap.registerPlugin(ScrollTrigger);

const WorkListing: React.FC = () => {
  const comp = useRef<HTMLDivElement>(null);

  // Timezone converter state
  const [localTz, setLocalTz] = useState('');
  const [ukTime, setUkTime] = useState('');
  const [localTime, setLocalTime] = useState('');
  const [shiftStart] = useState(9); // 9 AM UK
  const [shiftEnd] = useState(18); // 6 PM UK

  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setLocalTz(tz);

    const updateTimes = () => {
      const now = new Date();
      const ukFmt = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/London',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      const localFmt = new Intl.DateTimeFormat('en-GB', {
        timeZone: tz,
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      setUkTime(ukFmt.format(now));
      setLocalTime(localFmt.format(now));
    };
    updateTimes();
    const interval = setInterval(updateTimes, 60000);
    return () => clearInterval(interval);
  }, []);

  // Convert UK hours to local timezone display
  const getLocalShiftTime = (ukHour: number) => {
    const now = new Date();
    // Create a date at the given UK hour today
    const ukDate = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/London' }));
    ukDate.setHours(ukHour, 0, 0, 0);
    // Get the offset difference
    const ukOffset = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/London' })).getTime();
    const localOffset = new Date(now.toLocaleString('en-US', { timeZone: localTz || undefined })).getTime();
    const diffMs = localOffset - ukOffset;
    const localDate = new Date(ukDate.getTime() + diffMs);
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(localDate);
  };

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Hero elements fade in
      gsap.from('.work-hero-elem', {
        y: 30,
        opacity: 0,
        duration: 0.4,
        stagger: 0.05,
        ease: 'power2.out',
        force3D: true,
      });

      // Company cards animate on scroll
      gsap.fromTo(
        '.company-card',
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.15,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: '.company-grid',
            start: 'top 85%',
          },
        }
      );

      // Stats counter animation
      gsap.fromTo(
        '.stat-item',
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.4,
          stagger: 0.1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: '.stats-row',
            start: 'top 90%',
          },
        }
      );
    }, comp);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={comp}>
      {/* Hero Section */}
      <div className="relative text-center py-12 md:py-20 overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] md:w-[700px] md:h-[700px] bg-primary/8 rounded-full blur-[120px] pointer-events-none" />

        {/* Badge */}
        <div className="work-hero-elem relative inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs md:text-sm font-medium mb-6 md:mb-8">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          Actively Hiring · Remote Positions
        </div>

        {/* Headline */}
        <h1 className="work-hero-elem text-4xl md:text-6xl lg:text-7xl font-display font-extrabold text-white mb-6 md:mb-8 tracking-tight leading-[1.1]">
          Get Hired <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-white to-primaryGlow">
            to Dial.
          </span>
        </h1>

        {/* Subheadline */}
        <p className="work-hero-elem text-base md:text-xl text-slate-300 mb-8 md:mb-10 max-w-2xl mx-auto leading-relaxed">
          Join our remote calling team and earn <span className="text-white font-semibold">$200 – $700/month</span>{' '}
          <span className="text-slate-500">(~৳27,000 – ৳94,500)</span>. No selling. No pitching. Just research calls.
        </p>

        {/* CTA */}
        <div className="work-hero-elem">
          <a
            href="#companies"
            className="group relative inline-flex items-center gap-2 px-8 py-4 bg-white text-background text-base md:text-lg font-bold rounded-xl overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] animate-pulse-glow"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white via-slate-200 to-white opacity-100 group-hover:opacity-90 transition-opacity" />
            <div className="absolute inset-0 rounded-xl bg-white opacity-30 blur-xl animate-pulse-slow" />
            <span className="relative z-10 flex items-center gap-2">
              <Phone size={20} className="fill-current" />
              View Open Roles
            </span>
          </a>
        </div>
      </div>

      {/* Stats Row */}
      <div className="stats-row grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-16 md:mb-20">
        {[
          { icon: DollarSign, label: 'Monthly Earnings', value: '$200–$700 USD', color: 'text-emerald-400' },
          { icon: Globe, label: 'Work Location', value: '100% Remote', color: 'text-primary' },
          { icon: Users, label: 'Team Size', value: '50+ Callers', color: 'text-indigo-400' },
          { icon: TrendingUp, label: 'Growth Path', value: 'Team Lead Track', color: 'text-amber-400' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="stat-item p-px rounded-2xl bg-gradient-to-b from-white/10 to-transparent"
          >
            <div className="h-full bg-surface rounded-2xl p-5 text-center">
              <stat.icon size={22} className={`${stat.color} mx-auto mb-2`} />
              <p className="text-lg md:text-xl font-display font-bold text-white">{stat.value}</p>
              <p className="text-xs text-slate-400 mt-1">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Timezone Converter Widget */}
      <div className="stat-item mb-16 md:mb-20 p-px rounded-2xl bg-gradient-to-b from-indigo-500/20 to-transparent">
        <div className="bg-surface rounded-2xl p-5 md:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} className="text-indigo-400" />
            <h3 className="text-sm font-display font-bold text-white">Work Hours — Timezone Converter</h3>
          </div>
          <p className="text-xs text-slate-500 mb-4">All shifts are scheduled in UK time (GMT/BST). Here's what that means for you:</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* UK Current */}
            <div className="bg-white/5 rounded-xl p-4 text-center">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">UK Time Now</p>
              <p className="text-lg font-display font-bold text-white">{ukTime || '--:--'}</p>
              <p className="text-[10px] text-slate-600">Europe/London</p>
            </div>
            {/* Local Current */}
            <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 text-center">
              <p className="text-[10px] uppercase tracking-wider text-primary mb-1">Your Time Now</p>
              <p className="text-lg font-display font-bold text-white">{localTime || '--:--'}</p>
              <p className="text-[10px] text-slate-600 truncate">{localTz || 'Detecting...'}</p>
            </div>
            {/* Shift Hours Converted */}
            <div className="bg-white/5 rounded-xl p-4 text-center">
              <p className="text-[10px] uppercase tracking-wider text-emerald-400 mb-1">Shift Hours (Your Time)</p>
              <p className="text-lg font-display font-bold text-white">
                {localTz ? `${getLocalShiftTime(shiftStart)} – ${getLocalShiftTime(shiftEnd)}` : '--'}
              </p>
              <p className="text-[10px] text-slate-600">9:00 AM – 6:00 PM UK</p>
            </div>
          </div>
        </div>
      </div>

      {/* Companies Section */}
      <div id="companies" className="company-grid">
        {COMPANIES.map((company) => (
          <div key={company.companyId} className="mb-12">
            {/* Company Header */}
            <div className="mb-8">
              <span className="inline-block text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full mb-3">
                {company.industry}
              </span>
              <h2 className="text-2xl md:text-3xl font-display font-bold text-white mb-2">
                {company.name}
              </h2>
              <p className="text-slate-300 max-w-2xl">{company.tagline}</p>
            </div>

            {/* Role Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {company.roles.map((role) => (
                <Link
                  key={role.roleId}
                  to={`/work/${company.companyId}/${role.roleId}`}
                  className={`company-card group block p-px rounded-3xl transition-all duration-300 ${
                    role.bosnianOnly
                      ? 'bg-gradient-to-b from-amber-400/50 via-amber-500/20 to-transparent hover:from-amber-400/70 hover:shadow-[0_0_40px_-10px_rgba(251,191,36,0.3)]'
                      : 'bg-gradient-to-b from-cyan-500/30 to-transparent hover:from-cyan-500/50'
                  }`}
                >
                  <div className="h-full bg-surface rounded-3xl p-6 flex flex-col">
                    {/* Role badge */}
                    <div className="flex items-center gap-2 mb-4">
                      {role.bosnianOnly ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/30 shadow-[0_0_12px_-3px_rgba(251,191,36,0.3)]">
                          Bosnia Residents Only
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
                          Remote / Worldwide
                        </span>
                      )}
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 bg-surfaceHighlight px-2 py-0.5 rounded-full">
                        {role.type}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-display font-bold text-white mb-2 group-hover:text-primary transition-colors">
                      {role.title}
                    </h3>

                    {/* Salary */}
                    <div className="mb-4">
                      <span className="text-lg font-bold text-emerald-400">{role.salaryUsd}</span>
                      <span className="text-sm text-slate-500 ml-2">{role.salaryBdt}</span>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-slate-300 leading-relaxed mb-5 flex-grow">
                      {role.shortDescription}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-5">
                      {role.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs text-slate-400 bg-surfaceHighlight border border-border px-2.5 py-1 rounded-md"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* CTA */}
                    <div className="flex items-center gap-2 text-sm font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity mt-auto">
                      Apply Now <ArrowRight size={16} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkListing;
