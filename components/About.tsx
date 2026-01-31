import React, { useRef, useEffect } from 'react';
import { Linkedin, Facebook, Instagram, Quote, Github, Code2 } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SectionTitle from './ui/SectionTitle';

gsap.registerPlugin(ScrollTrigger);

const About: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from([".about-image", ".about-content"], {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
          toggleActions: "play none none reverse"
        },
        y: 30,
        opacity: 0,
        duration: 0.4,
        stagger: 0.06,
        ease: "power2.out",
        force3D: true
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="about" ref={sectionRef} className="py-16 md:py-24 bg-[#0a0e14] relative overflow-hidden border-t border-white/10">
      {/* Background Decor */}
      <div className="absolute top-1/2 left-0 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[100px] pointer-events-none -translate-y-1/2"></div>

      <div className="container mx-auto px-6 relative z-10">
        <SectionTitle title="About Me" subtitle=" The human behind the dialer." />

        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 max-w-6xl mx-auto">
          
          {/* 1. Image Section */}
          <div className="about-image w-full md:w-1/2 flex justify-center md:justify-end">
            <div className="relative group w-full max-w-[320px] sm:max-w-[360px] md:max-w-[400px]">
              {/* Image Frame - Natural Color + Premium Glow Effect */}
              <div className="w-full aspect-square rounded-2xl overflow-hidden border-2 border-cyan-500/30 relative z-10 transition-all duration-500 shadow-2xl shadow-cyan-500/30 group-hover:shadow-[0_0_60px_-10px_rgba(6,182,212,0.8)] group-hover:border-cyan-400/60">
                <img 
                  src="/sfat.jpg" 
                  alt="Sifat Morshed" 
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                  loading="eager"
                />
              </div>
              {/* Decorative Elements */}
              <div className="absolute -bottom-4 -right-4 w-full h-full border-2 border-cyan-500/20 rounded-2xl -z-0 transition-transform duration-500 group-hover:translate-x-2 group-hover:translate-y-2 shadow-lg shadow-cyan-500/10"></div>
              <div className="absolute -top-4 -left-4 w-20 h-20 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-2xl"></div>
            </div>
          </div>

          {/* 2. Content Section */}
          <div className="about-content w-full md:w-1/2 text-left space-y-6">
            <div className="relative">
              <Quote className="absolute -top-6 -left-4 text-white/5 w-16 h-16 transform -scale-x-100" />
              <p className="text-xl md:text-2xl font-display font-bold text-white leading-relaxed">
                "I don't just read scripts. I build relationships."
              </p>
            </div>

            <p className="text-slate-400 text-base leading-relaxed">
              Hey, I'm <span className="text-white font-bold">Sifat Morshed</span>. I'm based in Dhaka and I help US companies actually talk to the people they're trying to reach.
            </p>

            <p className="text-slate-400 text-base leading-relaxed">
              Here's the thing—appointment setting isn't about hitting numbers. It's about grabbing attention and keeping it. I mix solid CRM systems with good old-fashioned persistence to bring you leads that don't just show up, but actually <span className="text-primary">close</span>.
            </p>

            {/* Social Links */}
            <div className="pt-4">
              <h4 className="text-xs font-bold tracking-widest text-slate-500 uppercase mb-4">Connect with me</h4>
              <div className="flex gap-4">
                <a href="https://www.linkedin.com/in/sifat-morshed-750746217/" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:bg-blue-500 hover:text-white transition-all border border-white/10">
                  <Linkedin size={18} />
                </a>
                <a href="https://github.com/Sifat-Morshed" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:bg-slate-700 hover:text-white transition-all border border-white/10">
                  <Github size={18} />
                </a>
                <a href="https://leetcode.com/u/sifat-morshed/" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:bg-orange-600 hover:text-white transition-all border border-white/10">
                  <Code2 size={18} />
                </a>
                <a href="https://www.facebook.com/SifatmorshedOfficial" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white transition-all border border-white/10">
                  <Facebook size={18} />
                </a>
                <a href="https://www.instagram.com/sifattttmorshed/" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:bg-pink-600 hover:text-white transition-all border border-white/10">
                  <Instagram size={18} />
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default About;