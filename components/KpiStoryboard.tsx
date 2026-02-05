import React, { useRef, useEffect } from 'react';
import { Phone, CalendarCheck, TrendingUp } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const MetricCard: React.FC<{ label: string; value: number; suffix: string; icon: React.ElementType; color: string; delay: number }> = ({ label, value, suffix, icon: Icon, color, delay }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const numberRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Fast Fade In with scale
      gsap.from(cardRef.current, {
        scrollTrigger: {
          trigger: cardRef.current,
          start: "top 90%",
          toggleActions: "play none none reverse"
        },
        y: 20,
        scale: 0.95,
        opacity: 0,
        duration: 0.25,
        delay: delay,
        ease: "power2.out",
        force3D: true
      });

      // Number Counting - Faster
      gsap.fromTo(numberRef.current, 
        { innerText: 0 },
        {
          innerText: value,
          duration: 0.8,
          delay: delay,
          ease: "power2.out",
          snap: { innerText: 1 },
          scrollTrigger: {
            trigger: cardRef.current,
            start: "top 90%",
          },
          onUpdate: function() {
            if (numberRef.current) {
              numberRef.current.innerText = Math.ceil(this.targets()[0].innerText).toLocaleString();
            }
          }
        }
      );
    }, cardRef);

    return () => ctx.revert();
  }, [value, delay]);

  return (
    <div ref={cardRef} className="group relative rounded-2xl bg-[#0a0b0f] border border-cyan-500/10 p-6 flex flex-col items-center text-center hover:border-cyan-400/30 hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-300">
      <div className={`mb-4 p-3 rounded-full ${color} shadow-lg`}>
        <Icon size={20} className={`${color.includes('blue') ? 'text-blue-400' : color.includes('amber') ? 'text-amber-400' : 'text-emerald-400'}`} />
      </div>
      <div className="flex items-baseline gap-1 mb-1">
        <span ref={numberRef} className="text-4xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 tracking-tight">0</span>
        <span className="text-xl font-bold text-cyan-400">{suffix}</span>
      </div>
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</h3>
    </div>
  );
};

const KpiStoryboard: React.FC = () => {
  return (
    <section className="py-10 md:py-16 bg-[#0a0e14] border-b border-white/10">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <MetricCard 
            label="Daily Dials" 
            value={120} 
            suffix="+" 
            icon={Phone} 
            color="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 shadow-blue-500/20"
            delay={0} 
          />
          <MetricCard 
            label="Booking Rate" 
            value={25} 
            suffix="%" 
            icon={CalendarCheck} 
            color="bg-gradient-to-br from-amber-500/20 to-orange-500/20 shadow-amber-500/20"
            delay={0.1} 
          />
          <MetricCard 
            label="Show Rate" 
            value={78} 
            suffix="%" 
            icon={TrendingUp} 
            color="bg-gradient-to-br from-emerald-500/20 to-green-500/20 shadow-emerald-500/20"
            delay={0.2} 
          />
        </div>
      </div>
    </section>
  );
};

export default KpiStoryboard;