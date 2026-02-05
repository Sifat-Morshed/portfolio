import React, { useEffect, useRef } from 'react';
import { 
  Lock, Search, MessageSquare, ShieldAlert, 
  CornerDownRight, CheckCircle2, AlertTriangle
} from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SectionTitle from './ui/SectionTitle';

gsap.registerPlugin(ScrollTrigger);

const SalesPlaybook: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".playbook-card").forEach((card) => {
        gsap.fromTo(card,
          { autoAlpha: 0, y: 60 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.6,
            ease: "power2.out",
            scrollTrigger: {
              trigger: card,
              start: "top 85%",
              end: "bottom 15%",
              toggleActions: "play none none reverse",
            }
          }
        );
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 bg-[#0a0e14] border-y border-white/10 relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">
        <SectionTitle title="Sales Playbook" subtitle="My operating system for persuasion." />

        <div className="max-w-5xl mx-auto space-y-16">
          
          {/* SECTION 1: CORE FRAMEWORKS */}
          <div>
            <div className="flex items-center gap-3 mb-8">
               <div className="h-px flex-1 bg-white/10"></div>
               <span className="text-primary font-bold tracking-widest text-xs uppercase">Core Psychology</span>
               <div className="h-px flex-1 bg-white/10"></div>
            </div>

            <div className="flex md:grid md:grid-cols-3 overflow-x-auto md:overflow-visible snap-x snap-mandatory gap-4 pb-4 md:pb-0 px-6 md:px-0 -mx-6 md:mx-0 scrollbar-hide scroll-smooth">
              {[
                {
                  icon: Lock,
                  title: "The Pattern Interrupt",
                  desc: "Lowering resistance immediately.",
                  why: "Most callers sound like scripted bots. I start with 'permission-based' openers (e.g., 'I know I'm an interruption...') to give control back to the prospect.",
                  color: "text-blue-400"
                },
                {
                  icon: Search,
                  title: "Labeling Pain",
                  desc: "Validating before pitching.",
                  why: "I don't sell until I hear a problem. I use 'Black Swan' labels ('It sounds like [problem] is frustrating you') to make them articulate their own pain first.",
                  color: "text-amber-400"
                },
                {
                  icon: MessageSquare,
                  title: "The Negative Reverse",
                  desc: "Using 'No' to get to 'Yes'.",
                  why: "People fight pressure. I remove it. 'If this isn't a priority right now, just tell me.' Paradoxically, this freedom makes them more likely to engage.",
                  color: "text-emerald-400"
                }
              ].map((item, idx) => (
                <div key={idx} className="playbook-card bg-[#0a0b0f] border border-white/5 p-8 rounded-2xl hover:border-cyan-400/20 hover:shadow-lg hover:shadow-cyan-500/10 transition-all snap-center shrink-0 w-[85vw] md:w-auto">
                  <item.icon size={28} className={`${item.color} mb-4 drop-shadow-lg`} />
                  <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-sm font-bold text-slate-500 mb-4 uppercase tracking-wide">{item.desc}</p>
                  <p className="text-slate-400 text-sm leading-relaxed border-l-2 border-white/10 pl-3">
                    {item.why}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 2: REAL SCENARIOS */}
          <div>
             <div className="flex items-center gap-3 mb-8">
               <div className="h-px flex-1 bg-white/10"></div>
               <span className="text-primary font-bold tracking-widest text-xs uppercase">Battle Tested Scripts</span>
               <div className="h-px flex-1 bg-white/10"></div>
            </div>

            <div className="flex md:block overflow-x-auto md:overflow-visible snap-x snap-mandatory gap-4 md:space-y-4 pb-4 md:pb-0 px-6 md:px-0 -mx-6 md:mx-0 scrollbar-hide scroll-smooth">
              {[
                {
                  objection: "I'm not interested.",
                  response: "Fair enough. Just so I don't call you again next quarter, is it that you don't do [Service], or you're already 100% happy with your current setup?",
                  reasoning: "Forces a logical choice. If they say 'Already happy', I pivot to 'Great, I just want to be Plan B'."
                },
                {
                  objection: "Just send me an email.",
                  response: "I can, but my emails are usually generic. If you answer just one question, I can make sure I only send what's actually relevant. Fair?",
                  reasoning: "Turning a brush-off into a micro-commitment. Regains control of the frame."
                },
                {
                  objection: "We already have a vendor.",
                  response: "That's great. I'm not asking you to fire them. I just want to be the backup option in case they ever drop the ball. Would you be opposed to seeing a 2-minute comparison?",
                  reasoning: "Lowers the stakes. 'Would you be opposed' is much harder to say 'Yes' to than 'Do you want'."
                }
              ].map((scene, idx) => (
                <div key={idx} className="playbook-card snap-center shrink-0 w-[90vw] md:w-auto bg-[#0c0c0e] border border-white/10 rounded-xl p-6 md:p-8 flex flex-col md:flex-row gap-6 md:gap-8 items-start">
                  <div className="md:w-1/3 shrink-0">
                    <div className="flex items-center gap-2 mb-2">
                       <ShieldAlert size={16} className="text-red-400" />
                       <span className="text-red-400 font-bold text-sm uppercase">Objection</span>
                    </div>
                    <p className="text-white font-display font-bold text-lg">"{scene.objection}"</p>
                  </div>
                  
                  <div className="md:w-2/3">
                    <div className="flex items-center gap-2 mb-2">
                       <CornerDownRight size={16} className="text-emerald-400" />
                       <span className="text-emerald-400 font-bold text-sm uppercase">My Response</span>
                    </div>
                    <p className="text-slate-200 text-base leading-relaxed mb-3">"{scene.response}"</p>
                    <div className="flex items-start gap-2 text-xs text-slate-500 bg-white/5 p-3 rounded-lg">
                      <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
                      {scene.reasoning}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 3: PATTERNS */}
          <div className="bg-surfaceHighlight/30 border border-white/5 rounded-2xl p-8 md:p-10 text-center">
            <h3 className="text-white font-bold text-lg mb-4">The Golden Rule of Cold Calling</h3>
            <div className="flex flex-col md:flex-row justify-center gap-8 md:gap-16 text-left max-w-3xl mx-auto">
              <div className="flex gap-4">
                 <AlertTriangle className="text-amber-500 shrink-0" />
                 <div>
                   <h4 className="text-white font-bold text-sm">Tone &gt; Words</h4>
                   <p className="text-slate-400 text-xs mt-1">
                     You can say the perfect script, but if you sound needy, you lose. I speak with the downward inflection of a consultant, not the upward inflection of a beggar.
                   </p>
                 </div>
              </div>
              <div className="flex gap-4">
                 <AlertTriangle className="text-amber-500 shrink-0" />
                 <div>
                   <h4 className="text-white font-bold text-sm">No means "Not Now"</h4>
                   <p className="text-slate-400 text-xs mt-1">
                     Objections are usually about timing, not the product. I classify leads based on timeline, ensuring the pipeline is full for next month, not just today.
                   </p>
                 </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default SalesPlaybook;