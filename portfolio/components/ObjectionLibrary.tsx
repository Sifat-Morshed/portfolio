import React, { useState } from 'react';
import { Plus, Minus, ShieldAlert } from 'lucide-react';
import SectionTitle from './ui/SectionTitle';

const objections = [
  {
    question: "We already have a vendor.",
    answer: "That's exactly why I'm calling. I'm not asking you to switch today. I just want to be your 'Plan B' in case they ever drop the ball. Would you be opposed to seeing a comparison quote just to keep them honest?",
    tag: "Switch"
  },
  {
    question: "Send me an email.",
    answer: "I certainly can, but my emails tend to be quite generic because I don't know exactly what you need yet. If you can give me 30 seconds to ask two quick questions, I can make sure I only send you what's actually relevant. Is that fair?",
    tag: "Brush Off"
  },
  {
    question: "It's too expensive.",
    answer: "I hear that a lot. Usually, when people say 'expensive', they mean the upfront cost is high, but the long-term ROI is unclear. If I could show you how this pays for itself in month 3, would it still be 'too expensive'?",
    tag: "Price"
  },
  {
    question: "I'm not the decision maker.",
    answer: "I appreciate you telling me that. Who would typically sign off on a project like this? ... Okay, and before I reach out to them, I'd love to get your opinion on it since you're the one dealing with the day-to-day.",
    tag: "Gatekeeper"
  }
];

const ObjectionLibrary: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-16 md:py-24 bg-background border-t border-white/5">
      <div className="container mx-auto px-4 md:px-6">
        <SectionTitle title="Objection Vault" subtitle="Turning 'No' into 'Maybe'." />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mt-8">
          
          {/* Decor Side - HIDDEN ON MOBILE to save space */}
          <div className="hidden lg:block lg:col-span-4">
            <div className="bg-surfaceHighlight p-8 rounded-2xl border border-white/5 h-full relative overflow-hidden flex flex-col justify-center">
               <div className="absolute top-0 right-0 p-8 opacity-5">
                 <ShieldAlert size={150} />
               </div>
               <div className="relative z-10">
                 <h3 className="text-2xl font-bold text-white mb-4">Philosophy</h3>
                 <p className="text-slate-400 leading-relaxed mb-6 text-sm">
                   An objection isn't a rejection—it's a request for more information. Most cold callers crumble under pressure. I thrive in it.
                 </p>
                 <div className="inline-block bg-primary/10 text-primary px-3 py-1.5 rounded-lg text-xs font-bold border border-primary/20">
                   100% Rebuttal Rate
                 </div>
               </div>
            </div>
          </div>

          {/* Accordion Side - Full width on mobile */}
          <div className="lg:col-span-8 space-y-3">
            {objections.map((obj, idx) => (
              <div 
                key={idx} 
                className={`border border-white/5 rounded-xl transition-all duration-300 overflow-hidden ${openIndex === idx ? 'bg-surfaceHighlight shadow-glass' : 'bg-transparent hover:bg-white/5'}`}
              >
                <button 
                  onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-4 md:p-6 text-left"
                >
                  <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                    <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded border ${openIndex === idx ? 'border-primary text-primary bg-primary/5' : 'border-white/10 text-slate-500'}`}>
                      {obj.tag}
                    </span>
                    <span className={`font-bold text-base md:text-lg truncate ${openIndex === idx ? 'text-white' : 'text-slate-300'}`}>
                      "{obj.question}"
                    </span>
                  </div>
                  <div className={`p-1.5 md:p-2 rounded-full transition-colors shrink-0 ${openIndex === idx ? 'bg-primary text-background' : 'bg-white/5 text-slate-400'}`}>
                    {openIndex === idx ? <Minus size={14} /> : <Plus size={14} />}
                  </div>
                </button>
                
                <div 
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${openIndex === idx ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}
                >
                  <div className="px-4 md:px-6 pb-6 pt-0 md:pl-[5.5rem]">
                    <p className="text-sm md:text-base text-slate-400 leading-relaxed border-l-2 border-white/10 pl-4">
                      {obj.answer}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
};

export default ObjectionLibrary;