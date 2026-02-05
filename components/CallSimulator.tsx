import React, { useState } from 'react';
import { MessageSquare, ArrowRight, Lightbulb, User, RefreshCcw, Mic, Volume2 } from 'lucide-react';
import SectionTitle from './ui/SectionTitle';

const scenarios = [
  {
    id: 'busy',
    label: 'Too Busy',
    category: 'Opening',
    objection: "Look, I'm walking into a meeting right now, I don't have time.",
    response: "Totally understand. I'll be 20 seconds. If I'm irrelevant, you can hang up. Fair enough?",
    reasoning: "Permission based opener. Acknowledging their time constraints disarms them."
  },
  {
    id: 'vendor',
    label: 'Have Vendor',
    category: 'Competition',
    objection: "We already use a company for our leads, we're good.",
    response: "That's great. I'm not asking you to fire them. I'm just asking to be your Plan B. Would you be opposed to seeing a 2-minute comparison?",
    reasoning: "The 'Backup Plan' strategy removes the threat of replacement. 'Would you be opposed' is harder to say 'Yes' to than 'Do you want'."
  },
  {
    id: 'email',
    label: 'Send Email',
    category: 'Brush Off',
    objection: "Just send me an email with your pricing.",
    response: "I'd love to, but my pricing depends on your territory. If you can answer just one question, I can send you a quote that actually makes sense.",
    reasoning: "The 'Just send an email' is a polite hangup. By adding a condition, you regain control."
  },
  {
    id: 'price',
    label: 'Too Expensive',
    category: 'Objection',
    objection: "We don't have budget for new setters right now.",
    response: "I hear that a lot. But if I only got paid when I actually booked an appointment, would that change things?",
    reasoning: "Moving the conversation from 'Cost' to 'Value'. Removing the risk shifts the focus back to opportunity."
  },
  {
    id: 'gatekeeper',
    label: 'Gatekeeper',
    category: 'Access',
    objection: "What is this regarding? I screen his calls.",
    response: "It's regarding the sales team's Q4 targets. I have some data he asked to see last quarter. Is he in this afternoon?",
    reasoning: "Sounding authoritative. 'Q4 targets' sounds internal. 'Is he in?' prompts a direct answer."
  }
];

const CallSimulator: React.FC = () => {
  const [activeScenario, setActiveScenario] = useState(scenarios[0]);
  const [revealed, setRevealed] = useState(false);

  const handleSelect = (scenario: typeof scenarios[0]) => {
    setActiveScenario(scenario);
    setRevealed(false);
  };

  return (
    <section className="py-16 md:py-24 bg-surfaceHighlight/30 border-t border-white/5">
      <div className="container mx-auto px-4 md:px-6">
        <SectionTitle title="Live Scenario Lab" subtitle="Choose a roadblock." />

        <div className="max-w-4xl mx-auto mt-8 md:mt-12">
          
          {/* Mobile: Horizontal Scroll Chips */}
          <div className="flex overflow-x-auto pb-4 gap-2 no-scrollbar mb-6 snap-x">{
            {scenarios.map((s) => (
              <button
                key={s.id}
                onClick={() => handleSelect(s)}
                className={`snap-start shrink-0 px-4 py-2 rounded-full border text-sm font-medium transition-all whitespace-nowrap ${activeScenario.id === s.id ? 'bg-primary text-background border-primary shadow-neon' : 'bg-surface border-white/10 text-slate-400 hover:border-white/30'}`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Chat Interface Container */}
          <div className="bg-[#0c0c0e] border border-white/10 rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl relative min-h-[400px] flex flex-col">
            
            {/* Header */}
            <div className="bg-[#151518] px-4 py-3 border-b border-white/5 flex justify-between items-center">
               <div className="flex items-center gap-2">
                 <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center text-white text-xs font-bold">
                   P
                 </div>
                 <div>
                   <h4 className="text-white text-sm font-bold">Prospect</h4>
                   <p className="text-[10px] text-red-400 flex items-center gap-1">
                     <Volume2 size={10} /> Speaking...
                   </p>
                 </div>
               </div>
               <button onClick={() => setRevealed(false)} className="p-2 rounded-full hover:bg-white/5 text-slate-500 transition-colors" title="Reset">
                 <RefreshCcw size={16} />
               </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-4 md:p-6 space-y-6 flex flex-col">
              
              {/* Prospect Message */}
              <div className="flex gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 mt-1">
                  <User size={14} className="text-slate-400" />
                </div>
                <div className="bg-[#1e1e24] p-4 rounded-2xl rounded-tl-none border border-white/5 max-w-[85%]">
                   <p className="text-slate-200 text-sm md:text-base leading-relaxed">
                     "{activeScenario.objection}"
                   </p>
                </div>
              </div>

              {/* Interaction or Response */}
              <div className="flex-1 flex flex-col items-end justify-center">
                 {!revealed ? (
                   <button 
                     onClick={() => setRevealed(true)}
                     className="mt-auto px-6 py-3 bg-primary/10 border border-primary/20 text-primary rounded-full font-bold text-sm hover:bg-primary/20 transition-all flex items-center gap-2 animate-pulse"
                   >
                     <Mic size={16} /> Reveal Rebuttal
                   </button>
                 ) : (
                   <div className="flex flex-col items-end gap-2 w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
                      
                      {/* My Response */}
                      <div className="flex gap-3 flex-row-reverse w-full">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-1 border border-emerald-500/30">
                          <span className="text-emerald-500 text-xs font-bold">ME</span>
                        </div>
                        <div className="bg-emerald-600/10 p-4 rounded-2xl rounded-tr-none border border-emerald-500/20 max-w-[85%] text-right">
                           <p className="text-emerald-50 text-sm md:text-base leading-relaxed">
                             "{activeScenario.response}"
                           </p>
                        </div>
                      </div>

                      {/* Insight Box - Compact */}
                      <div className="mt-4 w-full bg-surfaceHighlight p-3 rounded-lg border border-white/5 flex gap-3">
                         <div className="shrink-0 w-8 h-8 rounded bg-amber-500/10 flex items-center justify-center text-amber-500">
                           <Lightbulb size={16} />
                         </div>
                         <div>
                           <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Strategy</h5>
                           <p className="text-xs text-slate-300 leading-relaxed">
                             {activeScenario.reasoning}
                           </p>
                         </div>
                      </div>

                   </div>
                 )}
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default CallSimulator;