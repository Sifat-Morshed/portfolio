import React, { useLayoutEffect, useRef, useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Phone, DollarSign, ArrowRight, Users, Globe, TrendingUp, Clock, ChevronDown, AlertCircle, Search } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { COMPANIES } from '../../src/lib/work/opportunities';

gsap.registerPlugin(ScrollTrigger);

// Comprehensive timezone list grouped by region (GoHighLevel-style)
const TIMEZONE_DATA: { region: string; zones: { label: string; tz: string; offset: string }[] }[] = [
  {
    region: 'United Kingdom',
    zones: [
      { label: 'London', tz: 'Europe/London', offset: 'GMT/BST' },
    ],
  },
  {
    region: 'United States',
    zones: [
      { label: 'New York (Eastern)', tz: 'America/New_York', offset: 'EST/EDT' },
      { label: 'Chicago (Central)', tz: 'America/Chicago', offset: 'CST/CDT' },
      { label: 'Denver (Mountain)', tz: 'America/Denver', offset: 'MST/MDT' },
      { label: 'Los Angeles (Pacific)', tz: 'America/Los_Angeles', offset: 'PST/PDT' },
      { label: 'Anchorage (Alaska)', tz: 'America/Anchorage', offset: 'AKST' },
      { label: 'Honolulu (Hawaii)', tz: 'Pacific/Honolulu', offset: 'HST' },
    ],
  },
  {
    region: 'Europe',
    zones: [
      { label: 'Paris', tz: 'Europe/Paris', offset: 'CET' },
      { label: 'Berlin', tz: 'Europe/Berlin', offset: 'CET' },
      { label: 'Sarajevo', tz: 'Europe/Sarajevo', offset: 'CET' },
      { label: 'Moscow', tz: 'Europe/Moscow', offset: 'MSK' },
      { label: 'Istanbul', tz: 'Europe/Istanbul', offset: 'TRT' },
      { label: 'Athens', tz: 'Europe/Athens', offset: 'EET' },
      { label: 'Warsaw', tz: 'Europe/Warsaw', offset: 'CET' },
      { label: 'Lisbon', tz: 'Europe/Lisbon', offset: 'WET' },
    ],
  },
  {
    region: 'Asia',
    zones: [
      { label: 'Dubai', tz: 'Asia/Dubai', offset: 'GST' },
      { label: 'Dhaka', tz: 'Asia/Dhaka', offset: 'BST' },
      { label: 'Kolkata (India)', tz: 'Asia/Kolkata', offset: 'IST' },
      { label: 'Singapore', tz: 'Asia/Singapore', offset: 'SGT' },
      { label: 'Tokyo', tz: 'Asia/Tokyo', offset: 'JST' },
      { label: 'Shanghai', tz: 'Asia/Shanghai', offset: 'CST' },
      { label: 'Manila', tz: 'Asia/Manila', offset: 'PHT' },
      { label: 'Jakarta', tz: 'Asia/Jakarta', offset: 'WIB' },
      { label: 'Karachi', tz: 'Asia/Karachi', offset: 'PKT' },
      { label: 'Seoul', tz: 'Asia/Seoul', offset: 'KST' },
      { label: 'Bangkok', tz: 'Asia/Bangkok', offset: 'ICT' },
    ],
  },
  {
    region: 'Americas',
    zones: [
      { label: 'Toronto', tz: 'America/Toronto', offset: 'EST/EDT' },
      { label: 'Vancouver', tz: 'America/Vancouver', offset: 'PST/PDT' },
      { label: 'Mexico City', tz: 'America/Mexico_City', offset: 'CST' },
      { label: 'Bogota', tz: 'America/Bogota', offset: 'COT' },
      { label: 'Sao Paulo', tz: 'America/Sao_Paulo', offset: 'BRT' },
      { label: 'Buenos Aires', tz: 'America/Argentina/Buenos_Aires', offset: 'ART' },
      { label: 'Lima', tz: 'America/Lima', offset: 'PET' },
    ],
  },
  {
    region: 'Australia & Pacific',
    zones: [
      { label: 'Sydney', tz: 'Australia/Sydney', offset: 'AEST' },
      { label: 'Melbourne', tz: 'Australia/Melbourne', offset: 'AEST' },
      { label: 'Brisbane', tz: 'Australia/Brisbane', offset: 'AEST' },
      { label: 'Perth', tz: 'Australia/Perth', offset: 'AWST' },
      { label: 'Auckland', tz: 'Pacific/Auckland', offset: 'NZST' },
    ],
  },
  {
    region: 'Africa & Middle East',
    zones: [
      { label: 'Cairo', tz: 'Africa/Cairo', offset: 'EET' },
      { label: 'Lagos', tz: 'Africa/Lagos', offset: 'WAT' },
      { label: 'Johannesburg', tz: 'Africa/Johannesburg', offset: 'SAST' },
      { label: 'Nairobi', tz: 'Africa/Nairobi', offset: 'EAT' },
    ],
  },
];

// Flat list for search
const ALL_ZONES = TIMEZONE_DATA.flatMap(g => g.zones);

const WorkListing: React.FC = () => {
  const comp = useRef<HTMLDivElement>(null);

  // Timezone converter state
  const [homeTz, setHomeTz] = useState(''); // user's auto-detected timezone
  const [workTz, setWorkTz] = useState('Europe/London'); // the country they want to check shift for
  const [homeTime, setHomeTime] = useState('');
  const [workTime, setWorkTime] = useState('');
  const [homeSeconds, setHomeSeconds] = useState('');
  const [workSeconds, setWorkSeconds] = useState('');
  const [showTzPicker, setShowTzPicker] = useState(false);
  const [tzSearch, setTzSearch] = useState('');
  const [blockedCountries, setBlockedCountries] = useState<string[]>([]);
  const [loadingBlocked, setLoadingBlocked] = useState(true);
  const [companies, setCompanies] = useState(COMPANIES);
  const [loadingJobs, setLoadingJobs] = useState(false);

  // Auto-detect user timezone
  useEffect(() => {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setHomeTz(detected);
  }, []);

  useEffect(() => {
    // Fetch dynamic job postings
    const fetchJobs = async () => {
      setLoadingJobs(true);
      try {
        const response = await fetch('/api/work/jobs');
        if (response.ok) {
          const data = await response.json();
          if (data.companies && Array.isArray(data.companies) && data.companies.length > 0) {
            setCompanies(data.companies);
          }
        }
      } catch (error) {
        console.error('Failed to fetch jobs, using static data:', error);
      } finally {
        setLoadingJobs(false);
      }
    };
    fetchJobs();
  }, []);

  useEffect(() => {
    // Fetch blocked countries
    const fetchBlockedCountries = async () => {
      try {
        const response = await fetch('/api/work/check-country');
        if (response.ok) {
          const data = await response.json();
          if (data.blockedCountries && Array.isArray(data.blockedCountries)) {
            setBlockedCountries(data.blockedCountries.filter((c: string) => c.trim() !== '' && c.toLowerCase() !== 'country'));
          }
        }
      } catch (error) {
        console.error('Failed to fetch blocked countries:', error);
      } finally {
        setLoadingBlocked(false);
      }
    };
    fetchBlockedCountries();
  }, []);

  // Live clock update
  useEffect(() => {
    if (!homeTz || !workTz) return;

    const updateTimes = () => {
      const now = new Date();
      const fmt = (tz: string) => new Intl.DateTimeFormat('en-GB', {
        timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
      }).format(now);
      const fmtShort = (tz: string) => new Intl.DateTimeFormat('en-GB', {
        timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: true,
      }).format(now);

      setHomeTime(fmtShort(homeTz));
      setWorkTime(fmtShort(workTz));
      setHomeSeconds(fmt(homeTz));
      setWorkSeconds(fmt(workTz));
    };
    updateTimes();
    const interval = setInterval(updateTimes, 1000);
    return () => clearInterval(interval);
  }, [homeTz, workTz]);

  // Convert work country's 9-5 to user's local time
  const getShiftInMyTime = (workHour: number) => {
    const now = new Date();
    // Create a date at the given hour in the WORK timezone
    const workDate = new Date(now.toLocaleString('en-US', { timeZone: workTz }));
    workDate.setHours(workHour, 0, 0, 0);
    const workOffset = new Date(now.toLocaleString('en-US', { timeZone: workTz })).getTime();
    const homeOffset = new Date(now.toLocaleString('en-US', { timeZone: homeTz || undefined })).getTime();
    const diffMs = homeOffset - workOffset;
    const localDate = new Date(workDate.getTime() + diffMs);
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit', minute: '2-digit', hour12: true,
    }).format(localDate);
  };

  // Get friendly labels
  const getHomeTzLabel = () => {
    const match = ALL_ZONES.find(z => z.tz === homeTz);
    return match ? `${match.label} (${match.offset})` : homeTz ? homeTz.replace(/_/g, ' ').split('/').pop() : 'Detecting...';
  };

  const getWorkTzLabel = () => {
    const match = ALL_ZONES.find(z => z.tz === workTz);
    return match ? `${match.label} (${match.offset})` : workTz.replace(/_/g, ' ').split('/').pop() || 'Select';
  };

  // Filtered timezones for search
  const filteredTzData = useMemo(() => {
    if (!tzSearch.trim()) return TIMEZONE_DATA;
    const q = tzSearch.toLowerCase();
    return TIMEZONE_DATA.map(g => ({
      ...g,
      zones: g.zones.filter(z => z.label.toLowerCase().includes(q) || z.tz.toLowerCase().includes(q) || z.offset.toLowerCase().includes(q) || g.region.toLowerCase().includes(q)),
    })).filter(g => g.zones.length > 0);
  }, [tzSearch]);

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

      {/* World Clock — Timezone Converter */}
      <div className="stat-item mb-16 md:mb-20 p-px rounded-2xl bg-gradient-to-b from-indigo-500/20 to-transparent">
        <div className="bg-surface rounded-2xl p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <Clock size={16} className="text-indigo-400" />
              </div>
              <div>
                <h3 className="text-base font-display font-bold text-white">World Clock</h3>
                <p className="text-xs text-slate-500">Pick a work country → see shift hours in your local time</p>
              </div>
            </div>

            {/* Work Country Timezone Selector (GoHighLevel style) */}
            <div className="relative">
              <button
                onClick={() => { setShowTzPicker(!showTzPicker); setTzSearch(''); }}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white hover:border-indigo-500/30 transition-colors min-w-[220px]"
              >
                <Globe size={14} className="text-indigo-400 shrink-0" />
                <span className="truncate">{getWorkTzLabel()}</span>
                <ChevronDown size={14} className={`text-slate-500 transition-transform ml-auto shrink-0 ${showTzPicker ? 'rotate-180' : ''}`} />
              </button>

              {showTzPicker && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-[#0A0A0B] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                  {/* Search */}
                  <div className="p-3 border-b border-white/5">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        value={tzSearch}
                        onChange={(e) => setTzSearch(e.target.value)}
                        placeholder="Search city or timezone..."
                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/30"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {filteredTzData.map((group) => (
                      <div key={group.region}>
                        <p className="px-4 py-2 text-[10px] uppercase tracking-wider text-slate-600 bg-white/[0.02] sticky top-0 font-semibold">{group.region}</p>
                        {group.zones.map((zone) => (
                          <button
                            key={zone.tz}
                            onClick={() => { setWorkTz(zone.tz); setShowTzPicker(false); setTzSearch(''); }}
                            className={`w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors flex items-center justify-between ${workTz === zone.tz ? 'text-indigo-400 bg-indigo-500/5' : 'text-slate-300'}`}
                          >
                            <span>{zone.label}</span>
                            <span className="text-[10px] text-slate-600 font-mono">{zone.offset}</span>
                          </button>
                        ))}
                      </div>
                    ))}
                    {filteredTzData.length === 0 && (
                      <p className="px-4 py-6 text-sm text-slate-600 text-center">No results for "{tzSearch}"</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Time Display Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
            {/* Work Country Time */}
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 text-center">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-3 font-semibold">Work Country Time</p>
              <p className="text-3xl md:text-4xl font-display font-extrabold text-white tracking-tight mb-1">{workTime || '--:--'}</p>
              <p className="text-xs text-slate-500 font-mono">{workSeconds || ''}</p>
              <p className="text-[10px] text-slate-600 mt-2 truncate">{getWorkTzLabel()}</p>
            </div>

            {/* Your Local Time */}
            <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-6 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-primary" />
              <p className="text-[10px] uppercase tracking-widest text-indigo-400 mb-3 font-semibold">Your Local Time</p>
              <p className="text-3xl md:text-4xl font-display font-extrabold text-white tracking-tight mb-1">{homeTime || '--:--'}</p>
              <p className="text-xs text-indigo-400/60 font-mono">{homeSeconds || ''}</p>
              <p className="text-[10px] text-slate-600 mt-2 truncate">{getHomeTzLabel()}</p>
            </div>

            {/* Tentative Shift Hours */}
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-emerald-400" />
              <p className="text-[10px] uppercase tracking-widest text-emerald-400 mb-3 font-semibold">Your Shift Hours</p>
              <p className="text-2xl md:text-3xl font-display font-extrabold text-white tracking-tight mb-1">
                {homeTz ? `${getShiftInMyTime(9)} – ${getShiftInMyTime(17)}` : '--'}
              </p>
              <p className="text-xs text-emerald-400/50 mt-1">9:00 AM – 5:00 PM {getWorkTzLabel()}</p>
              <p className="text-[10px] text-slate-600 mt-2">Converted to your local time</p>
            </div>
          </div>

          <p className="text-[10px] text-slate-600 mt-4 text-center">Select a different work country above to see what the 9–5 shift means in your timezone.</p>
        </div>
      </div>

      {/* Blocked Countries Notice */}
      {!loadingBlocked && blockedCountries.length > 0 && (
        <div className="mb-16 md:mb-20 p-px rounded-2xl bg-gradient-to-b from-red-500/20 to-transparent">
          <div className="bg-surface rounded-2xl p-6 md:p-8">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                <AlertCircle size={16} className="text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-display font-bold text-white mb-2">Application Restrictions</h3>
                <p className="text-sm text-slate-300 mb-3">
                  We are currently not accepting applications from the following {blockedCountries.length === 1 ? 'country' : 'countries'}:
                </p>
                <div className="flex flex-wrap gap-2">
                  {blockedCountries.map((country) => (
                    <span
                      key={country}
                      className="text-xs font-semibold uppercase tracking-wider text-red-400 bg-red-500/10 px-3 py-1.5 rounded-full border border-red-500/30"
                    >
                      {country}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-3">
                  If you're located in one of these regions, your application will be automatically declined. This restriction is temporary and subject to change.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Companies Section */}
      <div id="companies" className="company-grid">
        {companies.map((company) => (
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
              {company.roles.map((role) => {
                const roleHiring = role.isHiring !== false;
                const CardWrapper = roleHiring ? Link : 'div';
                const cardProps = roleHiring 
                  ? { to: `/work/${company.companyId}/${role.roleId}` } 
                  : {};
                
                return (
                <CardWrapper
                  key={role.roleId}
                  {...(cardProps as any)}
                  className={`company-card group block p-px rounded-3xl transition-all duration-300 relative ${
                    !roleHiring 
                      ? 'grayscale opacity-60 cursor-not-allowed bg-gradient-to-b from-slate-500/20 to-transparent'
                      : role.bosnianOnly
                        ? 'bg-gradient-to-b from-amber-400/50 via-amber-500/20 to-transparent hover:from-amber-400/70 hover:shadow-[0_0_40px_-10px_rgba(251,191,36,0.3)]'
                        : 'bg-gradient-to-b from-cyan-500/30 to-transparent hover:from-cyan-500/50'
                  }`}
                  title={!roleHiring ? 'Not hiring for this role right now' : ''}
                >
                  <div className="h-full bg-surface rounded-3xl p-6 flex flex-col">
                    {/* Not hiring overlay */}
                    {!roleHiring && (
                      <div className="absolute inset-0 bg-black/40 rounded-3xl z-10 flex items-center justify-center">
                        <div className="bg-surface/95 border border-white/10 rounded-xl px-5 py-3 text-center shadow-2xl">
                          <p className="text-sm font-bold text-slate-300">Not hiring right now</p>
                          <p className="text-xs text-slate-500 mt-1">Check back later for openings</p>
                        </div>
                      </div>
                    )}

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
                    {roleHiring && (
                      <div className="flex items-center gap-2 text-sm font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity mt-auto">
                        Apply Now <ArrowRight size={16} />
                      </div>
                    )}
                  </div>
                </CardWrapper>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkListing;
