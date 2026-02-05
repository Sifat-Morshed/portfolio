import React from 'react';

interface SectionTitleProps {
  title: string;
  subtitle: string;
  align?: 'left' | 'center';
}

const SectionTitle: React.FC<SectionTitleProps> = ({ title, subtitle, align = 'center' }) => {
  return (
    <div className={`mb-16 ${align === 'center' ? 'text-center' : 'text-left'} relative z-10`}>
      <h2 className="text-3xl md:text-5xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-white mb-4 tracking-tight drop-shadow-lg">
        {title} <span className="text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]">.</span>
      </h2>
      <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
        {subtitle}
      </p>
    </div>
  );
};

export default SectionTitle;