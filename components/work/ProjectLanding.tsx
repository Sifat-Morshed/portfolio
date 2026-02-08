import React, { useState, useLayoutEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, Tag, CheckCircle, Star, DollarSign } from 'lucide-react';
import gsap from 'gsap';
import { getCompanyById, getRoleById } from '../../src/lib/work/opportunities';
import ApplicationModal from './ApplicationModal';
import { useAuth } from '../../src/lib/work/AuthContext';

const ProjectLanding: React.FC = () => {
  const { companyId, roleId } = useParams<{ companyId: string; roleId: string }>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user, signIn } = useAuth();
  const comp = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.role-elem', {
        y: 25,
        opacity: 0,
        duration: 0.35,
        stagger: 0.04,
        ease: 'power2.out',
        force3D: true,
      });
    }, comp);
    return () => ctx.revert();
  }, []);

  const company = companyId ? getCompanyById(companyId) : undefined;
  const role = companyId && roleId ? getRoleById(companyId, roleId) : undefined;

  // Fallback: if old-style route /:projectId is used, try to find company
  if (!company && companyId && !roleId) {
    // Legacy route - redirect to /work
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-display font-bold text-white mb-4">Page Not Found</h2>
        <p className="text-textMuted mb-6">This listing has been updated.</p>
        <Link to="/work" className="text-primary hover:text-primaryGlow transition-colors text-sm font-medium">
          &larr; Browse all positions
        </Link>
      </div>
    );
  }

  if (!company || !role) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-display font-bold text-white mb-4">Role Not Found</h2>
        <p className="text-textMuted mb-6">The role you're looking for doesn't exist or has been filled.</p>
        <Link to="/work" className="text-primary hover:text-primaryGlow transition-colors text-sm font-medium">
          &larr; Browse all positions
        </Link>
      </div>
    );
  }

  return (
    <div ref={comp} className="max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <Link
        to="/work"
        className="role-elem inline-flex items-center gap-2 text-sm text-slate-500 hover:text-white transition-colors mb-8"
      >
        <ArrowLeft size={16} /> All Positions
      </Link>

      {/* Company Name */}
      <p className="role-elem text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
        {company.name} · {company.industry}
      </p>

      {/* Role Hero */}
      <div className="role-elem mb-8">
        <div className="flex items-center gap-3 mb-4">
          {role.bosnianOnly ? (
            <span className="text-xs font-bold uppercase text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30 shadow-[0_0_12px_-3px_rgba(251,191,36,0.3)]">
              Bosnia Residents Only
            </span>
          ) : (
            <span className="text-xs font-bold uppercase text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
              Remote / Worldwide
            </span>
          )}
          <span className="text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full">
            {role.type}
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
          {role.title}
        </h1>
        <div className="flex flex-wrap gap-4 text-sm text-slate-300">
          <span className="flex items-center gap-1"><MapPin size={14} /> Remote</span>
          <span className="flex items-center gap-1"><Clock size={14} /> {role.type}</span>
          <span className="flex items-center gap-1.5">
            <DollarSign size={14} className="text-emerald-400" />
            <span className="text-emerald-400 font-semibold">{role.salaryUsd}</span>
            <span className="text-slate-500">{role.salaryBdt}</span>
          </span>
        </div>
      </div>

      {/* Description */}
      <div className="role-elem p-px rounded-2xl bg-gradient-to-b from-white/10 to-transparent mb-8">
        <div className="bg-surface rounded-2xl p-6 md:p-8">
          <h2 className="text-lg font-display font-bold text-white mb-3">About This Role</h2>
          <p className="text-slate-300 leading-relaxed">{role.fullDescription}</p>
        </div>
      </div>

      {/* Requirements */}
      <div className="role-elem p-px rounded-2xl bg-gradient-to-b from-indigo-500/20 to-transparent mb-8">
        <div className="bg-surface rounded-2xl p-6 md:p-8">
          <h2 className="text-lg font-display font-bold text-white mb-4">Requirements</h2>
          <ul className="space-y-3">
            {role.requirements.map((req, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                <CheckCircle size={16} className="text-primary shrink-0 mt-0.5" />
                {req}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Perks */}
      <div className="role-elem p-px rounded-2xl bg-gradient-to-b from-emerald-500/20 to-transparent mb-8">
        <div className="bg-surface rounded-2xl p-6 md:p-8">
          <h2 className="text-lg font-display font-bold text-white mb-4">What You Get</h2>
          <ul className="space-y-3">
            {role.perks.map((perk, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                <Star size={16} className="text-amber-400 shrink-0 mt-0.5" />
                {perk}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Tags */}
      <div className="role-elem flex flex-wrap gap-2 mb-8">
        {role.tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 text-sm text-slate-400 bg-surfaceHighlight border border-border px-3 py-1.5 rounded-lg"
          >
            <Tag size={12} /> {tag}
          </span>
        ))}
      </div>

      {/* Apply CTA */}
      <div className="role-elem sticky bottom-0 bg-background/80 backdrop-blur-md border-t border-white/5 -mx-4 px-4 py-4 md:static md:bg-transparent md:border-0 md:mx-0 md:px-0 md:py-0">
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full md:w-auto px-8 py-3.5 bg-white text-background rounded-xl font-display font-bold text-lg hover:bg-white/90 hover:shadow-[0_0_30px_-5px_rgba(255,255,255,0.4)] transition-all"
        >
          Apply Now
        </button>
      </div>

      {/* Application Modal */}
      <ApplicationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        company={company}
        role={role}
        session={user ? { user } : null}
        onSignIn={signIn}
      />
    </div>
  );
};

export default ProjectLanding;
