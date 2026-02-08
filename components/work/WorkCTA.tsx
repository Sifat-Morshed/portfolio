import React, { useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Phone, ArrowRight, DollarSign, Globe } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const WorkCTA: React.FC = () => {
  const comp = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.work-cta-elem',
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          stagger: 0.08,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: comp.current,
            start: 'top 85%',
          },
        }
      );
    }, comp);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={comp} id="work-cta" className="py-20 md:py-28 px-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="container max-w-4xl mx-auto relative">
        {/* Card with gradient border */}
        <div className="work-cta-elem p-px rounded-3xl bg-gradient-to-b from-cyan-500/30 via-indigo-500/10 to-transparent">
          <div className="bg-surface rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
            {/* Inner glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

            {/* Badge */}
            <div className="work-cta-elem inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs md:text-sm font-medium mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Now Hiring Remote Callers
            </div>

            {/* Headline */}
            <h2 className="work-cta-elem text-3xl md:text-4xl lg:text-5xl font-display font-extrabold text-white mb-4 tracking-tight">
              Work{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primaryGlow">
                With Me
              </span>
            </h2>

            {/* Description */}
            <p className="work-cta-elem text-base md:text-lg text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              Join the remote team — make research & appointment calls, earn $200–$700/month, and grow into leadership roles. 
              No sales experience needed.
            </p>

            {/* Quick stats */}
            <div className="work-cta-elem flex flex-wrap justify-center gap-6 mb-8">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <DollarSign size={16} className="text-emerald-400" />
                <span><strong className="text-white">$200 – $700</strong>/month <span className="text-slate-500">(~৳27,000 – ৳94,500)</span></span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Globe size={16} className="text-primary" />
                <span><strong className="text-white">100%</strong> Remote</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Phone size={16} className="text-indigo-400" />
                <span><strong className="text-white">No</strong> Selling Required</span>
              </div>
            </div>

            {/* CTA Button */}
            <div className="work-cta-elem">
              <Link
                to="/work"
                className="group relative inline-flex items-center gap-2 px-8 py-4 bg-white text-background text-base font-bold rounded-xl overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white via-slate-200 to-white opacity-100 group-hover:opacity-90 transition-opacity" />
                <span className="relative z-10 flex items-center gap-2">
                  View Positions <ArrowRight size={18} />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WorkCTA;
