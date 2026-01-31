import React, { useLayoutEffect, useRef } from 'react';
import { MessageCircle, Play, BarChart2 } from 'lucide-react';
import gsap from 'gsap';

const Hero: React.FC = () => {
  const comp = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".hero-elem", {
        y: 20,
        opacity: 0,
        duration: 0.3,
        stagger: 0.03,
        ease: "power2.out",
        force3D: true
      });
    }, comp);
    return () => ctx.revert();
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      // Use setTimeout to ensure Lenis smooth scroll works properly
      setTimeout(() => {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  return (
    <div ref={comp} className="relative min-h-screen flex items-center justify-center pt-28 pb-16 md:pt-32 md:pb-24 px-6 overflow-hidden">
      
      {/* Background Image with Visible Overlay */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069')] bg-cover bg-center opacity-30"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/80 to-background"></div>
      </div>
      
      {/* Subtle Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] md:w-[800px] md:h-[800px] bg-secondary/10 rounded-full blur-[100px] md:blur-[150px] pointer-events-none opacity-30 z-[1]"></div>

      <div className="container max-w-5xl mx-auto text-center relative z-10">
        
        {/* Status Badge */}
        <div className="hero-elem inline-flex items-center gap-2 mb-6 md:mb-8 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-slate-300 text-xs md:text-sm font-medium">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          Accepting New Clients
        </div>
        
        {/* Headline */}
        <h1 className="hero-elem text-4xl md:text-6xl lg:text-7xl font-display font-extrabold text-white mb-6 md:mb-8 tracking-tight leading-[1.1]">
          Cold Calling & <br className="hidden md:block"/> Appointment Setting. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-white to-primaryGlow">
             Engineered to Convert.
          </span>
        </h1>
        
        {/* Subhead */}
        <p className="hero-elem text-base md:text-xl text-slate-400 mb-10 md:mb-12 max-w-3xl mx-auto leading-relaxed">
          I combine human sales psychology with technical CRM precision to fill calendars for US Solar & Home Service agencies.
        </p>
        
        {/* Action Area */}
        <div className="hero-elem flex flex-col items-center gap-6 md:gap-8">
          
          {/* Primary CTA */}
          <button 
            onClick={() => scrollToSection('contact')}
            className="group relative w-full sm:w-auto px-8 py-4 md:px-10 md:py-5 bg-white text-background text-base md:text-lg font-bold rounded-xl overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] min-w-[200px] animate-pulse-glow"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white via-slate-200 to-white opacity-100 group-hover:opacity-90 transition-opacity"></div>
            <div className="absolute inset-0 rounded-xl bg-white opacity-30 blur-xl animate-pulse-slow"></div>
            <span className="relative z-10 flex items-center justify-center gap-2">
              <MessageCircle size={20} className="fill-current" />
              Let's Talk
            </span>
          </button>
          
          {/* Secondary Actions */}
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 w-full sm:w-auto">
            <button 
              onClick={() => scrollToSection('proof')}
              className="flex justify-center items-center gap-2 px-5 py-3 md:py-2.5 rounded-lg bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-400/30 text-slate-200 text-sm font-medium hover:text-white hover:border-blue-400/60 hover:from-blue-500/20 hover:to-cyan-500/20 transition-all w-full sm:w-auto shadow-lg shadow-blue-500/10"
            >
              <BarChart2 size={16} className="text-blue-400" />
              View Performance
            </button>
            <button 
              onClick={() => scrollToSection('proof')}
              className="flex justify-center items-center gap-2 px-5 py-3 md:py-2.5 rounded-lg bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-400/30 text-slate-200 text-sm font-medium hover:text-white hover:border-emerald-400/60 hover:from-emerald-500/20 hover:to-green-500/20 transition-all w-full sm:w-auto shadow-lg shadow-emerald-500/10"
            >
              <Play size={16} className="text-emerald-400 fill-current" />
              Call Recordings
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Hero;