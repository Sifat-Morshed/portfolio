import React, { useLayoutEffect, useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Phone, DollarSign, ArrowRight, Users, Globe, TrendingUp, Clock, ChevronDown } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { COMPANIES } from '../../src/lib/work/opportunities';

gsap.registerPlugin(ScrollTrigger);

// Major timezone suggestions grouped by region
const TIMEZONE_SUGGESTIONS: { region: string; zones: { label: string; tz: string }[] }[] = [
  {
    region: 'United Kingdom',
    zones: [{ label: 'London (GMT/BST)', tz: 'Europe/London' }],
  },
  {
    region: 'United States',
    zones: [
      { label: 'Eastern (New York)', tz: 'America/New_York' },
      { label: 'Central (Chicago)', tz: 'America/Chicago' },
      { label: 'Mountain (Denver)', tz: 'America/Denver' },
      { label: 'Pacific (Los Angeles)', tz: 'America/Los_Angeles' },
      { label: 'Alaska (Anchorage)', tz: 'America/Anchorage' },
      { label: 'Hawaii (Honolulu)', tz: 'Pacific/Honolulu' },
    ],
  },
  {
    region: 'Canada',
    zones: [
      { label: 'Eastern (Toronto)', tz: 'America/Toronto' },
      { label: 'Central (Winnipeg)', tz: 'America/Winnipeg' },
      { label: 'Mountain (Edmonton)', tz: 'America/Edmonton' },
      { label: 'Pacific (Vancouver)', tz: 'America/Vancouver' },
      { label: 'Atlantic (Halifax)', tz: 'America/Halifax' },
    ],
  },
  {
    region: 'Australia',
    zones: [
      { label: 'Sydney (AEST)', tz: 'Australia/Sydney' },
      { label: 'Melbourne (AEST)', tz: 'Australia/Melbourne' },
      { label: 'Brisbane (AEST)', tz: 'Australia/Brisbane' },
      { label: 'Perth (AWST)', tz: 'Australia/Perth' },
      { label: 'Adelaide (ACST)', tz: 'Australia/Adelaide' },
    ],
  },
  {
    region: 'Asia',
    zones: [
      { label: 'Dubai (GST)', tz: 'Asia/Dubai' },
      { label: 'Dhaka (BST)', tz: 'Asia/Dhaka' },
      { label: 'Kolkata (IST)', tz: 'Asia/Kolkata' },
      { label: 'Singapore (SGT)', tz: 'Asia/Singapore' },
      { label: 'Tokyo (JST)', tz: 'Asia/Tokyo' },
      { label: 'Shanghai (CST)', tz: 'Asia/Shanghai' },
      { label: 'Manila (PHT)', tz: 'Asia/Manila' },
      { label: 'Jakarta (WIB)', tz: 'Asia/Jakarta' },
      { label: 'Karachi (PKT)', tz: 'Asia/Karachi' },
    ],
  },
  {
    region: 'Europe',
    zones: [
      { label: 'Paris (CET)', tz: 'Europe/Paris' },
      { label: 'Berlin (CET)', tz: 'Europe/Berlin' },
      { label: 'Moscow (MSK)', tz: 'Europe/Moscow' },
      { label: 'Istanbul (TRT)', tz: 'Europe/Istanbul' },
      { label: 'Athens (EET)', tz: 'Europe/Athens' },
      { label: 'Warsaw (CET)', tz: 'Europe/Warsaw' },
      { label: 'Sarajevo (CET)', tz: 'Europe/Sarajevo' },
    ],
  },
  {
    region: 'Africa',
    zones: [
      { label: 'Cairo (EET)', tz: 'Africa/Cairo' },
      { label: 'Lagos (WAT)', tz: 'Africa/Lagos' },
      { label: 'Johannesburg (SAST)', tz: 'Africa/Johannesburg' },
      { label: 'Nairobi (EAT)', tz: 'Africa/Nairobi' },
    ],
  },
  {
    region: 'Americas',
    zones: [
      { label: 'Mexico City (CST)', tz: 'America/Mexico_City' },
      { label: 'Bogota (COT)', tz: 'America/Bogota' },
      { label: 'Sao Paulo (BRT)', tz: 'America/Sao_Paulo' },
      { label: 'Buenos Aires (ART)', tz: 'America/Argentina/Buenos_Aires' },
      { label: 'Lima (PET)', tz: 'America/Lima' },
    ],
  },
];

const WorkListing: React.FC = () => {
  const comp = useRef<HTMLDivElement>(null);

  // Timezone converter state
  const [selectedTz, setSelectedTz] = useState('');
  const [ukTime, setUkTime] = useState('');
  const [localTime, setLocalTime] = useState('');
  const [ukSeconds, setUkSeconds] = useState('');
  const [localSeconds, setLocalSeconds] = useState('');
  const [shiftStart] = useState(9);
  const [shiftEnd] = useState(18);
  const [showTzPicker, setShowTzPicker] = useState(false);

  useEffect(() => {
    const detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setSelectedTz(detectedTz);
  }, []);

  useEffect(() => {
    if (!selectedTz) return;

    const updateTimes = () => {
      const now = new Date();
      const ukFmt = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/London',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
      });
      const localFmt = new Intl.DateTimeFormat('en-GB', {
        timeZone: selectedTz,
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
      });
      const ukFormatted = ukFmt.format(now);
      const localFormatted = localFmt.format(now);
      setUkTime(ukFormatted.slice(0, -3)); // without seconds for main display
      setLocalTime(localFormatted.slice(0, -3));
      setUkSeconds(ukFormatted);
      setLocalSeconds(localFormatted);
    };
    updateTimes();
    const interval = setInterval(updateTimes, 1000); // realtime every second
    return () => clearInterval(interval);
  }, [selectedTz]);

  // Convert UK hours to selected timezone display
  const getLocalShiftTime = (ukHour: number) => {
    const now = new Date();
    const ukDate = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/London' }));
    ukDate.setHours(ukHour, 0, 0, 0);
    const ukOffset = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/London' })).getTime();
    const localOffset = new Date(now.toLocaleString('en-US', { timeZone: selectedTz || undefined })).getTime();
    const diffMs = localOffset - ukOffset;
    const localDate = new Date(ukDate.getTime() + diffMs);
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit', minute: '2-digit', hour12: true,
    }).format(localDate);
  };

  // Get a friendly name for the selected timezone
  const getSelectedTzLabel = () => {
    for (const group of TIMEZONE_SUGGESTIONS) {
      const match = group.zones.find((z) => z.tz === selectedTz);
      if (match) return match.label;
    }
    return selectedTz ? selectedTz.replace(/_/g, ' ').split('/').pop() : 'Detecting...';
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

      {/* Timezone Converter Widget — Redesigned */}
      <div className="stat-item mb-16 md:mb-20 p-px rounded-2xl bg-gradient-to-b from-indigo-500/20 to-transparent">
        <div className="bg-surface rounded-2xl p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <Clock size={16} className="text-indigo-400" />
              </div>
              <div>
                <h3 className="text-base font-display font-bold text-white">Work Hours - Timezone Converter</h3>
                <p className="text-xs text-slate-500">All shifts scheduled in UK time (GMT/BST)</p>
              </div>
            </div>

            {/* Timezone Selector */}
            <div className="relative">
              <button
                onClick={() => setShowTzPicker(!showTzPicker)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white hover:border-indigo-500/30 transition-colors"
              >
                <Globe size={14} className="text-indigo-400" />
                <span className="truncate max-w-[200px]">{getSelectedTzLabel()}</span>
                <ChevronDown size={14} className={`text-slate-500 transition-transform ${showTzPicker ? 'rotate-180' : ''}`} />
              </button>

              {showTzPicker && (
                <div className="absolute right-0 md:right-0 top-full mt-2 w-72 max-h-80 overflow-y-auto bg-[#0A0A0B] border border-white/10 rounded-xl shadow-2xl z-50">
                  {TIMEZONE_SUGGESTIONS.map((group) => (
                    <div key={group.region}>
                      <p className="px-4 py-2 text-[10px] uppercase tracking-wider text-slate-600 bg-white/[0.02] sticky top-0 font-semibold">{group.region}</p>
                      {group.zones.map((zone) => (
                        <button
                          key={zone.tz}
                          onClick={() => { setSelectedTz(zone.tz); setShowTzPicker(false); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-white/5 transition-colors ${selectedTz === zone.tz ? 'text-indigo-400 bg-indigo-500/5' : 'text-slate-300'}`}
                        >
                          {zone.label}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Time Display Grid — Bigger Boxes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
            {/* UK Current Time */}
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 text-center">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-3 font-semibold">UK Time Now</p>
              <p className="text-3xl md:text-4xl font-display font-extrabold text-white tracking-tight mb-1">{ukTime || '--:--'}</p>
              <p className="text-xs text-slate-500 font-mono">{ukSeconds || ''}</p>
              <p className="text-[10px] text-slate-600 mt-2">Europe/London</p>
            </div>

            {/* Selected Timezone Current Time */}
            <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-6 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-primary" />
              <p className="text-[10px] uppercase tracking-widest text-indigo-400 mb-3 font-semibold">Your Time Now</p>
              <p className="text-3xl md:text-4xl font-display font-extrabold text-white tracking-tight mb-1">{localTime || '--:--'}</p>
              <p className="text-xs text-indigo-400/60 font-mono">{localSeconds || ''}</p>
              <p className="text-[10px] text-slate-600 mt-2 truncate">{getSelectedTzLabel()}</p>
            </div>

            {/* Tentative Shift Hours */}
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-emerald-400" />
              <div className="flex items-center justify-center gap-1.5 mb-3">
                <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-semibold">Tentative Shift Hours</p>
              </div>
              <p className="text-2xl md:text-3xl font-display font-extrabold text-white tracking-tight mb-1">
                {selectedTz ? `${getLocalShiftTime(shiftStart)} - ${getLocalShiftTime(shiftEnd)}` : '--'}
              </p>
              <p className="text-xs text-emerald-400/50 mt-1">9:00 AM - 6:00 PM UK</p>
              <p className="text-[10px] text-slate-600 mt-2">Converted to your timezone</p>
            </div>
          </div>

          <p className="text-[10px] text-slate-600 mt-4 text-center">Shift times are tentative and may vary based on role. Select a different timezone above to compare.</p>
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
