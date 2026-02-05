import React, { useState } from 'react';
import { Lock, Search, MessageSquare, CheckCircle2, ChevronRight, Zap } from 'lucide-react';
import SectionTitle from './ui/SectionTitle';

const stages = [
  {
    id: 1,
    title: "Opener",
    fullTitle: "The Pattern Interrupt",
    icon: Lock,
    short: "0-10s",
    color: "text-blue-400",
    desc: "Lowering resistance immediately.",
    detail: "Most callers sound like callers. I sound like a confused neighbor. By using a 'permission-based' opener (e.g., 'I know I'm an interruption, can I get 27 seconds?'), I give them control, which paradoxically keeps them on the line."
  },
  {
    id: 2,
    title: "Discovery",
    fullTitle: "Pain Discovery",
    icon: Search,
    short: "10-60s",
    color: "text-amber-400",
    desc: "Finding the bleeding neck.",
    detail: "I don't pitch until I find pain. I use 'The Black Swan' labeling technique: 'It sounds like your current electric bill is frustrating you.' Once they confirm the pain verbally, the sale becomes about solving a problem, not buying a product."
  },
  {
    id: 3,
    title: "Pitch",
    fullTitle: "Solution & Pivot",
    icon: MessageSquare,
    short: "60-120s",
    color: "text-purple-400",
    desc: "Tailored solution & objection isolation.",
    detail: "When they say 'Not interested', I don't fight. I agree. 'That's perfectly fair.' Then I pivot. 'Just out of curiosity, is it that you don't believe solar works, or just that you don't want another bill?' This isolates the true objection."
  },
  {
    id: 4,
    title: "Close",
    fullTitle: "The Micro-Close",
    icon: CheckCircle2,
    short: "2min+",
    color: "text-emerald-400",
    desc: "Securing the calendar commitment.",
    detail: "I never ask 'Do you want to meet?'. I ask 'Does Tuesday at 2pm or Wednesday at 10am work better to just see the numbers?'. This is the Option Close. It assumes the appointment is happening and reduces decision fatigue."
  }
];

const CallBreakdown: React.FC = () => {
  const [activeStage, setActiveStage] = useState(stages[0]);

  return (
    <section className="py-16 md:py-24 bg-surface border-y border-white/5 overflow-hidden">
      <div className="container mx-auto px-4 md:px-6">
        <SectionTitle title="Anatomy of a Call" subtitle="My psychological framework." />

        <div className="max-w-6xl mx-auto mt-8 md:mt-12 flex flex-col lg:flex-row gap-6 lg:gap-12 items-start">
          
          {/* Mobile: Horizontal Scroll Tabs */}
          <div className="w-full lg:w-1/3 flex lg:flex-col overflow-x-auto pb-4 lg:pb-0 gap-3 no-scrollbar snap-x">
            {stages.map((stage) => (
              <button
                key={stage.id}
                onClick={() => setActiveStage(stage)}
                className={`snap-center shrink-0 flex items-center gap-3 p-4 rounded-xl border transition-all duration-300 min-w-[160px] lg:min-w-0 text-left ${activeStage.id === stage.id ? 'bg-white/10 border-primary text-white shadow-neon' : 'bg-surfaceHighlight border-white/5 text-slate-400 hover:bg-white/5'}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${activeStage.id === stage.id ? 'bg-primary text-background' : 'bg-black/40 text-slate-500'}`}>
                  <stage.icon size={18} />
                </div>
                <div>
                  <h3 className={`text-sm font-bold ${activeStage.id === stage.id ? 'text-white' : 'text-slate-400'}`}>{stage.title}</h3>
                  <p className="text-[10px] font-bold tracking-wide opacity-60">{stage.short}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Content View */}
          <div className="flex-1 w-full bg-surfaceHighlight/50 border border-white/10 rounded-2xl p-6 md:p-10 relative overflow-hidden min-h-[300px] md:min-h-[400px] flex flex-col justify-center">
            {/* Background Texture */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
            <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-${activeStage.color.split('-')[1]}-500/10 to-transparent blur-3xl rounded-full -translate-y-1/2 translate-x-1/2`}></div>

            <div className="relative z-10 animate-in fade-in slide-in-from-right-4 duration-300 key={activeStage.id}">
              <div className="flex items-center gap-2 mb-4">
                <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded bg-white/5 border border-white/10 ${activeStage.color}`}>
                  Stage 0{activeStage.id}
                </span>
                <span className="h-px w-8 bg-white/10"></span>
                <span className="text-slate-500 text-xs font-medium tracking-wide">{activeStage.short}</span>
              </div>
              
              <h3 className="text-2xl md:text-3xl font-display font-bold text-white mb-4 leading-tight">
                {activeStage.fullTitle}
              </h3>

              <p className="text-sm md:text-base text-slate-300 mb-6 font-medium">
                {activeStage.desc}
              </p>
              
              <div className="bg-[#0a0a0b] border border-white/5 rounded-xl p-5 md:p-6 shadow-inner relative overflow-hidden group">
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${activeStage.color.replace('text-', 'bg-')}`}></div>
                <Zap size={16} className={`absolute top-4 right-4 ${activeStage.color} opacity-50`} />
                <p className="text-sm md:text-base text-slate-400 leading-relaxed font-sans italic">
                  "{activeStage.detail}"
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default CallBreakdown;