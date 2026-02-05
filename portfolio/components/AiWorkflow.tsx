import React from 'react';
import { Target, Clock, ShieldCheck } from 'lucide-react';

const Objectives: React.FC = () => {
  return (
    <section className="py-24 bg-[#0a0e14] border-y border-white/10">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
           <h2 className="text-3xl font-display font-bold text-white mb-4">
             What I Optimize For
           </h2>
           <p className="text-slate-400">
             Metrics that actually impact your bottom line.
           </p>
        </div>

        <div className="flex md:grid md:grid-cols-3 overflow-x-auto md:overflow-visible snap-x snap-mandatory gap-4 pb-4 md:pb-0 px-6 md:px-0 -mx-6 md:mx-0 scrollbar-hide scroll-smooth">
          
          <div className="bg-[#0a0b0f] p-8 rounded-2xl border border-cyan-500/10 flex flex-col items-center text-center hover:border-cyan-400/30 hover:shadow-lg hover:shadow-cyan-500/10 transition-all snap-center shrink-0 w-[85vw] md:w-auto">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 rounded-full flex items-center justify-center text-cyan-400 mb-6 shadow-lg shadow-cyan-500/20">
              <Target size={24} />
            </div>
            <h4 className="text-xl font-bold text-white mb-3">Qualified Shows</h4>
            <p className="text-slate-400 text-sm leading-relaxed">
              I don't just book "meetings". I book qualified homeowners who know why we are meeting and have the capacity to buy.
            </p>
          </div>

          <div className="bg-[#0a0b0f] p-8 rounded-2xl border border-purple-500/10 flex flex-col items-center text-center hover:border-purple-400/30 hover:shadow-lg hover:shadow-purple-500/10 transition-all snap-center shrink-0 w-[85vw] md:w-auto">
             <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center text-purple-400 mb-6 shadow-lg shadow-purple-500/20">
              <Clock size={24} />
            </div>
            <h4 className="text-xl font-bold text-white mb-3">Respect & Efficiency</h4>
            <p className="text-slate-400 text-sm leading-relaxed">
              I respect the prospect's time and your brand reputation. No aggression, just professional persistence.
            </p>
          </div>

          <div className="bg-[#0a0b0f] p-8 rounded-2xl border border-emerald-500/10 flex flex-col items-center text-center hover:border-emerald-400/30 hover:shadow-lg hover:shadow-emerald-500/10 transition-all snap-center shrink-0 w-[85vw] md:w-auto">
             <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-full flex items-center justify-center text-emerald-400 mb-6 shadow-lg shadow-emerald-500/20">
              <ShieldCheck size={24} />
            </div>
            <h4 className="text-xl font-bold text-white mb-3">Data Integrity</h4>
            <p className="text-slate-400 text-sm leading-relaxed">
              If it's not in the CRM, it didn't happen. I ensure 100% accurate logging of dispositions, notes, and follow-up tasks.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Objectives;