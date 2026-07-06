import React from 'react';
import SectionTitle from './ui/SectionTitle';

const Experience: React.FC = () => {
  const experiences = [
    {
      role: "Appointment Setter",
      company: "PrimePath Home Services",
      location: "Columbus, OH",
      duration: "4 Months",
      startDate: '2021-11-01',
      endDate: '2022-02-28',
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
      startDate: '2021-05-01',
      endDate: '2021-08-31',
      description: "Outbound calls to homeowners for solar & roof inspection appointments.",
      tasks: [
        "Provided daily reporting to team leader.",
        "Managed calendar logistics for field consultants.",
        "Followed up on warm leads to maximize conversion."
      ]
    }
    ,
    {
      role: "Total Experience",
      company: "Professional Summary",
      location: "",
      duration: "3 Years",
      description: "Cumulative experience across outbound sales, appointment setting, recruiting and contract research.",
      tasks: [
        "3 years total experience in outbound sales and client-facing roles.",
        "Experienced with CRM workflows, scheduling, recruiting and closing."
      ]
    },
    {
      role: "Appointment Setter",
      company: "21ideas LLC",
      location: "Remote / US Clients",
      duration: "7 Months",
      startDate: '2023-06-01',
      endDate: '2023-12-31',
      description: "B2B appointment setting for IT and AI services at 21ideas LLC — outreach to technical buyers and decision makers.",
      tasks: [
        "Prospected and qualified B2B leads for IT/AI service discussions and demos.",
        "Managed CRM workflows and produced daily reporting for technical sales leads.",
        "Onboarded and coached new agents on technical call flows and objection handling."
      ]
    },
    {
      role: "Sales Closer",
      company: "21ideas LLC",
      location: "Remote / US Clients",
      duration: "5 Months",
      startDate: '2024-01-01',
      endDate: '2024-05-31',
      description: "B2B sales closer for IT and AI offerings — responsible for discovery, negotiation and closing with technical buyers.",
      tasks: [
        "Conducted technical discovery calls and positioned AI/IT solutions to stakeholders.",
        "Negotiated terms and closed contracts, coordinating handoffs to delivery teams.",
        "Maintained automated follow-up sequences and account handover documentation." 
      ]
    },
    {
      role: "Recruiter & HR",
      company: "21ideas LLC",
      location: "Remote",
      duration: "11 Months",
      startDate: '2024-06-01',
      endDate: '2026-05-31',
      description: "Recruiter & HR supporting sales and technical hiring for a B2B IT/AI services company.",
      tasks: [
        "Led full-cycle recruiting for sales and entry-level technical roles.",
        "Managed onboarding, payroll coordination and performance feedback loops.",
        "Designed role-specific screening questions and practical assessments for technical candidates." 
      ]
    },
    {
      role: "Independent Contractor",
      company: "Silverlight Research",
      location: "Remote",
      duration: "6 Months",
      startDate: '2025-11-01',
      endDate: '2026-05-31',
      description: "B2B contracting for lead research and outreach focused on IT and AI services.",
      tasks: [
        "Researched and verified B2B lead contact details and company eligibility.",
        "Built outreach lists and supported pilot campaigns targeting IT/AI buyers.",
        "Provided concise reporting and data delivery tailored for technical teams." 
      ]
    }
  ];

  // add independent Apple device reselling experience
  experiences.unshift({
    role: 'Independent Reseller',
    company: 'Apple Device Reselling',
    location: 'Independent / B2B & B2C',
    duration: 'Ongoing',
    startDate: '2019-03-01',
    endDate: undefined,
    description: 'Independent reseller of refurbished Apple devices, handling procurement, repairs, and B2B sales to local businesses.',
    tasks: [
      'Sourced and refurbished Apple devices for resale.',
      'Managed sales channels, pricing and buyer relationships.',
      'Coordinated logistics, repairs and quality verification.'
    ]
  });

  // pull out the top summary so we can render it above the card list
  const summary = experiences.find((e) => e.role === 'Total Experience');
  const list = experiences
    .filter((e) => e.role !== 'Total Experience')
    // sort by startDate (earliest first) for a timeline flow
    .sort((a, b) => {
      const aStart = a.startDate ? new Date(a.startDate).getTime() : 0;
      const bStart = b.startDate ? new Date(b.startDate).getTime() : 0;
      return aStart - bStart;
    });

  const formatDate = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
  };

  const formatDuration = (exp: (typeof experiences)[number]) => {
    const rangeStart = exp.startDate ? formatDate(exp.startDate) : '';
    const rangeEnd = exp.endDate ? formatDate(exp.endDate) : 'Present';
    return rangeStart ? `${exp.duration} • ${rangeStart} — ${rangeEnd}` : exp.duration;
  };

  return (
    <section className="py-16 md:py-24 relative">
      <div className="container mx-auto px-6">
        <SectionTitle title="Experience" subtitle="Recent campaign history." />

        {/* Top summary — rendered above the cards so it is prominent */}
        {summary && (
          <div className="max-w-4xl mx-auto mb-6">
            <div className="bg-gradient-to-br from-cyan-500/8 to-emerald-500/8 border border-cyan-500/12 rounded-2xl p-6 md:p-8">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-slate-400 uppercase tracking-wide">Professional Summary</div>
                  <h3 className="text-2xl font-bold text-white">{summary.duration}</h3>
                </div>
                <div className="text-sm text-slate-300 max-w-xl">
                  <p className="leading-relaxed">{summary.description}</p>
                  <ul className="mt-3 space-y-1 text-slate-400">
                    {summary.tasks.map((t, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-1.5 w-2 h-2 rounded-full bg-primary shrink-0" />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-4xl mx-auto flex md:grid md:grid-cols-2 overflow-x-auto md:overflow-hidden snap-x snap-mandatory md:snap-none gap-6 md:gap-8 scrollbar-hide scroll-smooth">
            {list.map((exp, idx) => (
              <div key={idx} className="snap-center shrink-0 w-[85vw] first:ml-6 md:first:ml-0 last:mr-6 md:last:mr-0 md:w-auto bg-surfaceHighlight/40 border border-cyan-500/12 p-6 md:p-8 rounded-2xl hover:border-cyan-400/30 hover:shadow-lg hover:shadow-cyan-500/12 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg md:text-xl font-bold text-white">{exp.company}</h3>
                    <p className="text-primary text-sm font-medium">{exp.role}</p>
                  </div>
                  <span className="bg-white/5 text-slate-400 text-xs font-medium px-2 py-1 rounded h-fit">
                    {formatDuration(exp)}
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