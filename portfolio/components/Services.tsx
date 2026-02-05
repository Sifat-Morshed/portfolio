import React, { useRef, useLayoutEffect } from 'react';
import { PhoneOutgoing, Target, CalendarCheck2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SectionTitle from './ui/SectionTitle';

gsap.registerPlugin(ScrollTrigger);

interface ServiceCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  index: number;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ title, description, icon: Icon }) => (
  <div className="service-card snap-center shrink-0 w-[85vw] md:w-auto h-full p-px rounded-3xl bg-gradient-to-b from-cyan-500/30 to-transparent hover:from-cyan-400/50 hover:to-emerald-500/30 transition-all duration-300 group">
    <div className="h-full bg-[#0f1419] rounded-[23px] p-6 md:p-8 relative overflow-hidden border border-cyan-500/20 group-hover:border-cyan-400/50 transition-all">
      <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-cyan-500/10 to-emerald-500/10 border border-cyan-500/20 rounded-2xl flex items-center justify-center mb-5 md:mb-6 text-cyan-400 group-hover:bg-gradient-to-br group-hover:from-cyan-500 group-hover:to-emerald-500 group-hover:text-background group-hover:border-cyan-400 transition-all shadow-lg group-hover:shadow-cyan-500/50">
        <Icon size={24} className="md:w-7 md:h-7" strokeWidth={1.5} />
      </div>
      <h3 className="text-lg md:text-xl font-bold text-white mb-3 font-display">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
    </div>
  </div>
);

const Services: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".service-card").forEach((card, i) => {
        gsap.fromTo(card,
          { autoAlpha: 0, y: 50 },
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

  const services = [
    {
      title: "Cold Calling",
      description: "I make 100+ calls a day. I know how to sound friendly, get past gatekeepers, and actually talk to the person who matters.",
      icon: PhoneOutgoing
    },
    {
      title: "Lead Qualification",
      description: "Not every lead is worth chasing. I check everything—utility bills, roof condition, credit—before I book an appointment.",
      icon: Target
    },
    {
      title: "Calendar Logistics",
      description: "Booked appointments mean nothing if they don't show up. I follow up, confirm, and handle reschedules so you don't lose deals.",
      icon: CalendarCheck2
    }
  ];

  return (
    <section ref={sectionRef} id="what-i-do" className="py-16 md:py-24 relative z-10 bg-[#0a0e14] border-y border-white/10">
      <div className="absolute inset-0 bg-[size:40px_40px] bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] opacity-50 pointer-events-none"></div>
      
      <div className="container mx-auto px-6 relative z-10">
        <SectionTitle 
          title="Capabilities" 
          subtitle="Core competencies."
        />
        
        {/* Mobile: Horizontal Snap Scroll. Desktop: Grid */}
        <div className="flex md:grid md:grid-cols-3 overflow-x-auto md:overflow-visible snap-x snap-mandatory gap-4 pb-4 md:pb-0 px-6 md:px-0 -mx-6 md:mx-0 scrollbar-hide scroll-smooth">
          {services.map((service, idx) => (
            <ServiceCard key={idx} {...service} index={idx} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;