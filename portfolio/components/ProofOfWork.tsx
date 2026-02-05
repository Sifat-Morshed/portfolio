import React, { useRef, useEffect } from 'react';
import { Database, Check, TrendingUp, Mic } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SectionTitle from './ui/SectionTitle';

gsap.registerPlugin(ScrollTrigger);

// --- Mock CRM Dashboard Visual ---
const CrmDashboard: React.FC = () => {
  return (
    <div className="w-full bg-[#0f1115] border border-white/10 rounded-xl overflow-hidden shadow-2xl flex flex-col">
      {/* Fake Browser Header */}
      <div className="bg-[#181a20] px-4 py-2 border-b border-white/5 flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-600"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-slate-600"></div>
        </div>
        <div className="mx-auto bg-[#0f1115] px-3 py-1 rounded text-[10px] text-slate-500 font-medium w-32 md:w-48 text-center border border-white/5 tracking-wide truncate">
          app.hubspot.com/dashboard
        </div>
      </div>
      
      {/* Dashboard Content */}
      <div className="p-4 md:p-6 grid gap-4 md:gap-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-white font-bold text-sm md:text-base">Sales Overview</h3>
          <span className="text-[10px] md:text-xs text-slate-500 bg-white/5 px-2 py-1 rounded">Last 30 Days</span>
        </div>
        
        {/* Metric Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
           <div className="bg-[#181a20] p-3 rounded-lg border border-white/5 flex sm:block justify-between items-center sm:items-start">
              <div className="text-slate-500 text-[10px] uppercase font-bold mb-0 sm:mb-1">Calls</div>
              <div className="text-white text-lg md:text-xl font-bold">2,450</div>
           </div>
           <div className="bg-[#181a20] p-3 rounded-lg border border-white/5 flex sm:block justify-between items-center sm:items-start">
              <div className="text-slate-500 text-[10px] uppercase font-bold mb-0 sm:mb-1">Connects</div>
              <div className="text-primary text-lg md:text-xl font-bold">342</div>
           </div>
           <div className="bg-[#181a20] p-3 rounded-lg border border-white/5 flex sm:block justify-between items-center sm:items-start">
              <div className="text-slate-500 text-[10px] uppercase font-bold mb-0 sm:mb-1">Booked</div>
              <div className="text-emerald-400 text-lg md:text-xl font-bold">48</div>
           </div>
        </div>

        {/* Fake List */}
        <div className="space-y-2">
           <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase font-bold px-2">
              <span>Lead Name</span>
              <span>Stage</span>
           </div>
           {[
             {n: 'Marcus J.', s: 'Qualified', c: 'text-emerald-400 bg-emerald-400/10'},
             {n: 'Sarah T.', s: 'Follow Up', c: 'text-amber-400 bg-amber-400/10'},
             {n: 'David B.', s: 'Interested', c: 'text-blue-400 bg-blue-400/10'},
             {n: 'Elena R.', s: 'No Answer', c: 'text-slate-400 bg-slate-400/10'}
           ].map((i, idx) => (
             <div key={idx} className="bg-[#181a20] p-3 rounded-lg border border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-3">
                   <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-[10px] text-white font-bold">
                     {i.n.charAt(0)}
                   </div>
                   <span className="text-sm text-slate-300 font-medium">{i.n}</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded border border-white/5 font-medium ${i.c}`}>{i.s}</span>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};

const ProofOfWork: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".pow-fade", {
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 85%",
          toggleActions: "play none none reverse"
        },
        y: 30, 
        opacity: 0,
        duration: 0.3,
        stagger: 0.04, 
        ease: "power2.out",
        force3D: true
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="proof" ref={containerRef} className="py-24 relative bg-background border-t border-white/5">
      <div className="container mx-auto px-6">
        <SectionTitle 
          title="Performance Data" 
          subtitle="Real results. No fluff."
        />

        <div className="flex md:grid md:grid-cols-2 overflow-x-auto md:overflow-hidden snap-x snap-mandatory md:snap-none gap-6 pb-4 md:pb-0 px-6 md:px-0 -mx-6 md:mx-0 scrollbar-hide scroll-smooth">
          
          {/* Left: CRM & Stats */}
          <div className="pow-fade space-y-6 md:space-y-8 snap-center shrink-0 w-[85vw] md:w-auto">
            <h3 className="text-xl md:text-2xl font-display font-bold text-white">CRM Management</h3>
            <p className="text-slate-400">
               I maintain pristine data hygiene in platforms like HubSpot and GoHighLevel. Every interaction is logged, every lead is categorized, and no follow-up is missed.
            </p>
            <CrmDashboard />
            <div className="grid grid-cols-2 gap-4">
               <div className="flex items-start gap-3">
                  <Check size={20} className="text-emerald-500 mt-1 shrink-0" />
                  <div>
                    <h5 className="text-white font-bold text-sm md:text-base">95% Accuracy</h5>
                    <p className="text-xs md:text-sm text-slate-500">Data entry & logging</p>
                  </div>
               </div>
               <div className="flex items-start gap-3">
                  <Database size={20} className="text-primary mt-1 shrink-0" />
                  <div>
                    <h5 className="text-white font-bold text-sm md:text-base">Zero Leakage</h5>
                    <p className="text-xs md:text-sm text-slate-500">Pipeline integrity</p>
                  </div>
               </div>
            </div>
          </div>

          {/* Right: Audio Samples (Placeholder) */}
          <div className="pow-fade space-y-6 md:space-y-8 snap-center shrink-0 w-[85vw] md:w-auto">
            <h3 className="text-xl md:text-2xl font-display font-bold text-white">Live Call Recordings</h3>
            <p className="text-slate-400">
               Live examples of objection handling, gatekeeper navigation, and appointment setting.
            </p>
            
            <div className="relative group overflow-hidden rounded-2xl bg-[#0c0c0e] border border-white/10 p-8 h-[250px] flex flex-col items-center justify-center text-center">
               <div className="absolute inset-0 bg-cyber-grid opacity-10"></div>
               <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full"></div>

               <div className="relative z-10 p-4 rounded-full bg-surfaceHighlight border border-white/10 mb-4 text-slate-400 group-hover:text-primary group-hover:border-primary/50 transition-all">
                  <Mic size={32} />
               </div>
               <h4 className="relative z-10 text-xl font-bold text-white mb-2">Coming Soon</h4>
               <p className="relative z-10 text-slate-500 text-sm max-w-xs mx-auto">
                 I am currently compiling a library of my best calls demonstrating complex objection handling and closing.
               </p>
            </div>

            <div className="bg-surfaceHighlight/50 p-6 rounded-2xl border border-white/5 mt-4 md:mt-8">
               <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="text-emerald-400" size={24} />
                  <h4 className="text-lg font-bold text-white">Conversion Impact</h4>
               </div>
               <p className="text-sm text-slate-400 leading-relaxed">
                 In my previous role, I helped increase the appointment show-rate by <span className="text-white font-bold">18%</span> simply by implementing a structured triple-touch confirmation sequence.
               </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default ProofOfWork;