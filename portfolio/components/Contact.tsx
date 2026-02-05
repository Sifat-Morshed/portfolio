import React, { useState } from 'react';
import { Mail, MessageCircle, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import SectionTitle from './ui/SectionTitle';

const Contact: React.FC = () => {
  const email = "sifatmorshed123@gmail.com";
  const whatsappLink = "https://wa.link/n3f4zo";

  // AI Feature States
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [hasGenerated, setHasGenerated] = useState(false);

  const generateWithAI = async () => {
    if (!name.trim()) return;
    setLoading(true);
    
    // Simple message generator - no external APIs needed
    setTimeout(() => {
      setGeneratedMessage(`Hi Sifat, this is ${name}. I saw your portfolio and was impressed by your appointment setting frameworks. Are you available for a brief chat this week?`);
      setHasGenerated(true);
      setLoading(false);
    }, 1500);
  };

  const sendWhatsApp = () => {
    const encoded = encodeURIComponent(generatedMessage);
    window.open(`https://wa.me/1939500021?text=${encoded}`, '_blank');
  };

  return (
    <section id="contact" className="py-24 bg-[#0a0e14] border-t border-white/10">
      <div className="container mx-auto px-6">
        <SectionTitle title="Ready to Scale?" subtitle="Direct line to me." />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          
          {/* Left: Contact Context */}
          <div className="space-y-6 order-2 lg:order-1">
            <div className="bg-[#0f1419] p-8 rounded-2xl border border-cyan-500/20 relative overflow-hidden group hover:border-cyan-400/40 hover:shadow-lg hover:shadow-cyan-500/10 transition-all">
               <div className="absolute top-0 right-0 p-6 opacity-10 text-emerald-500 group-hover:scale-110 transition-transform">
                 <MessageCircle size={80} />
               </div>
               <h3 className="text-2xl font-bold text-white mb-2">Hit Me on WhatsApp</h3>
               <p className="text-slate-400 mb-6">I check this all the time. Fastest way to reach me.</p>
               <a 
                 href={whatsappLink} 
                 target="_blank"
                 rel="noreferrer"
                 className="inline-flex items-center gap-2 text-emerald-400 font-bold hover:gap-3 transition-all"
               >
                 Open Chat <ArrowRight size={18} />
               </a>
            </div>

            <div className="bg-[#0f1419] p-8 rounded-2xl border border-cyan-500/20 relative overflow-hidden group hover:border-cyan-400/40 hover:shadow-lg hover:shadow-cyan-500/10 transition-all">
               <div className="absolute top-0 right-0 p-6 opacity-5 text-white group-hover:scale-110 transition-transform">
                 <Mail size={80} />
               </div>
               <h3 className="text-2xl font-bold text-white mb-2">Or Shoot Me an Email</h3>
               <p className="text-slate-400 mb-6">If you've got a longer pitch or job details to share.</p>
               <a 
                 href={`mailto:${email}`} 
                 className="inline-flex items-center gap-2 text-white font-bold hover:gap-3 transition-all"
               >
                 {email} <ArrowRight size={18} />
               </a>
            </div>
          </div>

          {/* Right: AI Quick Send */}
          <div className="bg-[#0c0c0e] border border-white/10 rounded-3xl p-8 lg:p-10 order-1 lg:order-2 shadow-2xl relative overflow-hidden">
             {/* Background Image Overlay */}
             <div className="absolute inset-0 z-0 opacity-20">
               <img src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=1000" className="w-full h-full object-cover" alt="Office Abstract" />
               <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0e] via-[#0c0c0e]/80 to-transparent"></div>
             </div>

             <div className="relative z-10">
               <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-6">
                 <Sparkles size={14} /> AI Draft
               </div>
               
               <h3 className="text-3xl font-display font-bold text-white mb-4">Not sure what to say?</h3>
               <p className="text-slate-400 mb-8">
                 Drop your name or company below. I'll write you a quick intro message you can send right away.
               </p>

               {!hasGenerated ? (
                 <div className="space-y-4">
                   <input 
                     type="text" 
                     placeholder="e.g. John from SolarCity"
                     className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-primary/50 transition-colors placeholder:text-slate-600"
                     value={name}
                     onChange={(e) => setName(e.target.value)}
                   />
                   <button 
                     onClick={generateWithAI}
                     disabled={!name || loading}
                     className="w-full bg-white text-background font-bold text-lg py-4 rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center gap-2"
                   >
                     {loading ? 'Writing...' : 'Generate Message'}
                   </button>
                 </div>
               ) : (
                 <div className="animate-in fade-in slide-in-from-bottom-4">
                   <div className="bg-white/10 border border-white/10 p-5 rounded-xl mb-6 relative">
                     <p className="text-slate-200 italic">"{generatedMessage}"</p>
                     <div className="absolute -top-3 -right-3 bg-emerald-500 text-white p-1 rounded-full">
                       <CheckCircle2 size={16} />
                     </div>
                   </div>
                   <button 
                     onClick={sendWhatsApp}
                     className="w-full bg-emerald-500 text-white font-bold text-lg py-4 rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20 flex justify-center gap-2 items-center"
                   >
                     <MessageCircle size={20} /> Send on WhatsApp
                   </button>
                   <button 
                     onClick={() => { setHasGenerated(false); setName(''); }}
                     className="w-full text-slate-500 text-sm mt-4 hover:text-white"
                   >
                     Start Over
                   </button>
                 </div>
               )}
             </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Contact;