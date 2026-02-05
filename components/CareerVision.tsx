import React, { useRef, useEffect } from 'react';
import { TrendingUp, Building2, Target } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SectionTitle from './ui/SectionTitle';

gsap.registerPlugin(ScrollTrigger);

const CareerVision: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Desktop Timeline Line
      gsap.fromTo(".timeline-line-progress-desktop", 
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: "none",
          transformOrigin: "left",
          scrollTrigger: {
            trigger: ".timeline-desktop-container",
            start: "top 70%",
            end: "bottom 30%",
            scrub: 0.5,
          }
        }
      );

      // Mobile Timeline Line
      gsap.fromTo(".timeline-line-progress-mobile", 
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          transformOrigin: "top",
          scrollTrigger: {
            trigger: ".timeline-mobile-container",
            start: "top 70%",
            end: "bottom 30%",
            scrub: 0.5,
          }
        }
      );

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const timelineStages = [
    {
      title: "Cold Outreach",
      subtitle: "Foundation",
      desc: "I learned how to dial fast and talk faster. Getting someone's attention in 5 seconds is everything.",
      status: "active"
    },
    {
      title: "Appt. Setting",
      subtitle: "Current Mastery",
      desc: "This is where I'm at. Qualifying leads properly, managing pipelines, turning conversations into booked calls.",
      status: "active"
    },
    {
      title: "Closing",
      subtitle: "Development",
      desc: "Working on this now. Learning to negotiate better and see deals through from start to finish.",
      status: "future"
    },
    {
      title: "Acquisitions",
      subtitle: "Goal",
      desc: "The endgame. I want to be the guy evaluating deals and making the big moves.",
      status: "future"
    }
  ];

  return (
    <section id="career-vision" ref={sectionRef} className="py-12 md:py-20 bg-[#08090c] relative border-t border-white/5 overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="container mx-auto px-6 relative z-10">
        <SectionTitle 
          title="Career Vision" 
          subtitle="Growth mindset. Long-term ambition."
        />

        {/* 1. Intro Paragraph - Compact */}
        <div className="vision-intro max-w-3xl mx-auto text-center mb-6 md:mb-8">
          <p className="text-sm md:text-base text-slate-300 leading-relaxed">
            Sales taught me early on: it's not just about how many calls you make—it's about staying sharp and sticking to a system. Right now, I'm great at getting people in the door. But my real goal? Learning how to close the deal myself. I'm focusing on negotiation and want to eventually work in real estate or bigger acquisitions.
          </p>
        </div>

        {/* 2. Three Growth Cards - Compact Grid */}
        <div className="vision-grid flex md:grid md:grid-cols-3 overflow-x-auto md:overflow-visible snap-x snap-mandatory gap-4 pb-4 md:pb-0 px-6 md:px-0 -mx-6 md:mx-0 scrollbar-hide scroll-smooth mb-6 md:mb-8">
          
          <div className="vision-card p-4 md:p-5 rounded-xl bg-[#0a0b0f] border border-cyan-500/10 hover:border-cyan-400/30 hover:shadow-lg hover:shadow-cyan-500/10 transition-all group snap-center shrink-0 w-[85vw] md:w-auto">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-1.5 bg-gradient-to-br from-cyan-500/10 to-emerald-500/10 rounded-lg border border-cyan-500/20 text-cyan-400 group-hover:bg-gradient-to-br group-hover:from-cyan-500 group-hover:to-emerald-500 group-hover:text-background transition-colors shadow-lg group-hover:shadow-cyan-500/50">
                <TrendingUp size={16} />
              </div>
              <h3 className="font-bold text-white text-sm">Caller to Closer</h3>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              I'm moving from setting appointments to actually closing deals. That means learning how people think and what makes them say yes.
            </p>
          </div>

          <div className="vision-card p-4 md:p-5 rounded-xl bg-[#0a0b0f] border border-purple-500/10 hover:border-purple-400/30 hover:shadow-lg hover:shadow-purple-500/10 transition-all group snap-center shrink-0 w-[85vw] md:w-auto">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-1.5 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20 text-purple-400 group-hover:bg-gradient-to-br group-hover:from-purple-500 group-hover:to-pink-500 group-hover:text-white transition-colors shadow-lg group-hover:shadow-purple-500/50">
                <Building2 size={16} />
              </div>
              <h3 className="font-bold text-white text-sm">Real Estate Focus</h3>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              I'm interested in real estate acquisitions. It's about understanding what sellers actually want and building trust over time.
            </p>
          </div>

          <div className="vision-card p-4 md:p-5 rounded-xl bg-[#0a0b0f] border border-emerald-500/10 hover:border-emerald-400/30 hover:shadow-lg hover:shadow-emerald-500/10 transition-all group snap-center shrink-0 w-[85vw] md:w-auto">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-1.5 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-lg border border-emerald-500/20 text-emerald-400 group-hover:bg-gradient-to-br group-hover:from-emerald-500 group-hover:to-teal-500 group-hover:text-white transition-colors shadow-lg group-hover:shadow-emerald-500/50">
                <Target size={16} />
              </div>
              <h3 className="font-bold text-white text-sm">Revenue Impact</h3>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              I want to work somewhere competitive. My goal is to hit 7 figures in annual sales by actually being good at what I do.
            </p>
          </div>

        </div>

        {/* 3. Visual Timeline - Compact Hybrid Layout */}
        <div className="timeline-section-trigger max-w-5xl mx-auto">
          <h3 className="text-lg font-display font-bold text-white mb-4 md:mb-6 text-center">Trajectory</h3>
          
          {/* DESKTOP: Horizontal Timeline */}
          <div className="timeline-desktop-container hidden md:grid grid-cols-4 gap-4 relative mt-6">
             {/* Horizontal Line Background */}
             <div className="absolute top-[9px] left-0 w-full h-0.5 bg-white/10"></div>
             {/* Horizontal Line Progress */}
             <div className="timeline-line-progress-desktop absolute top-[9px] left-0 w-full h-0.5 bg-gradient-to-r from-primary to-emerald-500 origin-left scale-x-0"></div>

             {timelineStages.map((stage, idx) => (
                <div key={idx} className="timeline-item relative pt-6 text-center px-2 group">
                   {/* Node Dot */}
                   <div className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full border-4 border-[#08090c] bg-surfaceHighlight z-10 shadow-neon group-hover:scale-110 transition-transform flex items-center justify-center">
                      <div className={`w-2 h-2 rounded-full ${stage.status === 'active' ? 'bg-primary' : 'bg-slate-600'}`}></div>
                   </div>
                   
                   <div className="text-[10px] font-bold text-primary mb-1 uppercase tracking-wider opacity-80">{stage.subtitle}</div>
                   <h4 className="text-sm font-bold text-white mb-1">{stage.title}</h4>
                   <p className="text-[11px] text-slate-400 leading-relaxed max-w-[180px] mx-auto">{stage.desc}</p>
                </div>
             ))}
          </div>

          {/* MOBILE: Compact Vertical List */}
          <div className="timeline-mobile-container md:hidden relative pl-4 ml-2 space-y-4 border-l border-white/10">
             {/* Vertical Line Progress */}
             <div className="timeline-line-progress-mobile absolute top-0 left-[-1px] w-[2px] h-full bg-gradient-to-b from-primary to-emerald-500 origin-top scale-y-0"></div>

            {timelineStages.map((stage, idx) => (
              <div key={idx} className="timeline-item relative pl-6">
                 {/* Node Dot */}
                 <div className="absolute top-1 left-[-21px] w-4 h-4 rounded-full border-2 border-[#08090c] bg-surfaceHighlight z-10 flex items-center justify-center">
                    <div className={`w-1.5 h-1.5 rounded-full ${stage.status === 'active' ? 'bg-primary' : 'bg-slate-600'}`}></div>
                 </div>

                 <div className="flex flex-col gap-0.5">
                   <div className="flex items-center gap-2">
                     <span className="text-[10px] font-bold text-primary uppercase tracking-wider">{stage.subtitle}</span>
                     <span className="text-white/20 text-[10px]">•</span>
                     <h4 className="text-sm font-bold text-white">{stage.title}</h4>
                   </div>
                   <p className="text-xs text-slate-400 leading-tight">{stage.desc}</p>
                 </div>
              </div>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
};

export default CareerVision;