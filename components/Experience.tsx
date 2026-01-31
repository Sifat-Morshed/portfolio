import React from 'react';
import SectionTitle from './ui/SectionTitle';

const Experience: React.FC = () => {
  const experiences = [
    {
      role: "Appointment Setter",
      company: "PrimePath Home Services",
      location: "Columbus, OH",
      duration: "4 Months",
      description: "Cold-called US homeowners to schedule home inspection assessments.",
      tasks: [
        "Qualified leads based on homeowner interest & property eligibility.",
        "Maintained call logs and updated CRM entries accurately.",
        "Ensured utility status verification before booking."
      ]
    },
    {
      role: "Appointment Setter",
      company: "BrightLeaf Solar Solutions",
      location: "Walnut Creek, CA",
      duration: "4 Months",
      description: "Outbound calls to homeowners for solar & roof inspection appointments.",
      tasks: [
        "Provided daily reporting to team leader.",
        "Managed calendar logistics for field consultants.",
        "Followed up on warm leads to maximize conversion."
      ]
    }
  ];

  return (
    <section className="py-16 md:py-24 relative">
      <div className="container mx-auto px-6">
        <SectionTitle title="Experience" subtitle="Recent campaign history." />

        <div className="max-w-4xl mx-auto flex md:grid md:grid-cols-2 overflow-x-auto md:overflow-hidden snap-x snap-mandatory md:snap-none gap-6 md:gap-8 scrollbar-hide scroll-smooth">
            {experiences.map((exp, idx) => (
              <div key={idx} className="snap-center shrink-0 w-[85vw] first:ml-6 md:first:ml-0 last:mr-6 md:last:mr-0 md:w-auto bg-[#0f1419] border border-cyan-500/20 p-6 md:p-8 rounded-2xl hover:border-cyan-400/40 hover:shadow-lg hover:shadow-cyan-500/20 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg md:text-xl font-bold text-white">{exp.company}</h3>
                    <p className="text-primary text-sm font-medium">{exp.role}</p>
                  </div>
                  <span className="bg-white/5 text-slate-400 text-xs font-medium px-2 py-1 rounded h-fit">
                    {exp.duration}
                  </span>
                </div>
                
                <div className="text-xs text-slate-500 font-bold uppercase tracking-wide mb-4">{exp.location}</div>
                
                <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                  {exp.description}
                </p>

                <ul className="space-y-2">
                  {exp.tasks.map((task, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                      <span className="mt-1.5 w-1 h-1 rounded-full bg-primary shrink-0"></span>
                      <span className="leading-tight">{task}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
        </div>
      </div>
    </section>
  );
};

export default Experience;