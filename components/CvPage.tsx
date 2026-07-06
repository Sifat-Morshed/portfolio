import React, { useState } from 'react';
import { ArrowLeft, Download, Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { generateCV } from '../src/utils/generatePDF';

const CvPage: React.FC = () => {
  const [showReferences, setShowReferences] = useState(true);
  const experienceTimeline = [
    {
      title: 'Independent Reseller',
      company: 'Apple Device Reselling (Independent)',
      dates: 'Mar 2019 - Present',
      duration: 'Ongoing',
      accent: 'indigo',
      bullets: [
        'Sourced, refurbished and sold Apple devices to B2B and B2C buyers.',
        'Managed pricing, repair logistics and customer relationships.'
      ]
    },
    {
      title: 'Appointment Setter',
      company: 'BrightLeaf Solar Solutions (Walnut Creek, CA)',
      dates: 'May 2021 - Aug 2021',
      duration: '4 Months',
      accent: 'emerald',
      bullets: [
        'Outbound calls to homeowners for solar and roof inspection appointments.',
        'Provided daily reporting to team leader.'
      ],
      reference: 'David Harrison - Lead Talent Acquisition Specialist & HR Generalist'
    },
    {
      title: 'Appointment Setter',
      company: 'PrimePath Home Services (Columbus, OH)',
      dates: 'Nov 2021 - Feb 2022',
      duration: '4 Months',
      accent: 'cyan',
      bullets: [
        'Cold-called US homeowners to schedule home inspection assessments.',
        'Qualified leads based on homeowner interest, property eligibility, and utility status.',
        'Maintained call logs and updated CRM entries accurately.'
      ],
      reference: 'Jennifer Simpson - Employee Services Representative'
    },
    {
      title: 'Appointment Setter',
      company: '21ideas LLC (Remote)',
      dates: 'Aug 2023 - May 2024',
      duration: '10 Months',
      accent: 'cyan',
      bullets: [
        'Prospected and qualified B2B leads for IT and AI service discussions and demos.',
        'Managed CRM workflows and produced daily reporting for technical sales leads.',
        'Onboarded and coached new agents on technical call flows and objection handling.'
      ],
      reference: 'PETUKHOV VLADIMIR (Denis) - Founder, 21 Ideas LLC, Florida'
    },
    {
      title: 'Sales Closer',
      company: '21ideas LLC (Remote)',
      dates: 'Jun 2024 - Nov 2024',
      duration: '6 Months',
      accent: 'emerald',
      bullets: [
        'Conducted technical discovery calls and positioned AI and IT solutions to stakeholders.',
        'Negotiated terms and closed contracts, coordinating handoffs to delivery teams.',
        'Maintained automated follow-up sequences and account handover documentation.'
      ]
    },
    {
      title: 'Recruiter & HR',
      company: '21ideas LLC (Remote)',
      dates: 'Jun 2024 - May 2026',
      duration: '1 Year',
      accent: 'purple',
      bullets: [
        'Led full-cycle recruiting for sales and entry-level technical roles.',
        'Managed onboarding, payroll coordination and performance feedback loops.',
        'Designed role-specific screening questions and practical assessments for technical candidates.'
      ],
      reference: 'PETUKHOV VLADIMIR (Denis) - Founder, 21 Ideas LLC, Florida'
    },
    {
      title: 'Independent Contractor',
      company: 'Silverlight Research (Remote)',
      dates: 'Nov 2025 - May 2026',
      duration: '6 Months',
      accent: 'yellow',
      bullets: [
        'Researched and verified B2B lead contact details for IT and AI service buyers.',
        'Built outreach lists and supported pilot campaigns targeting technical stakeholders.',
        'Provided concise reporting and data delivery tailored for technical teams.'
      ],
      reference: 'Karla - HR & Recruiter, Silverlight Research Center'
    }
  ];

  const references = [
    { org: 'PrimePath Home Services', name: 'Jennifer Simpson', title: 'Employee Services Representative' },
    { org: 'BrightLeaf Solar Solutions', name: 'David Harrison', title: 'Lead Talent Acquisition Specialist & HR Generalist' },
    { org: '21ideas LLC', name: 'PETUKHOV VLADIMIR (Denis)', title: 'Founder, 21 Ideas LLC, Florida' },
    { org: 'Silverlight Research', name: 'Karla', title: 'HR & Recruiter, Silverlight Research Center' }
  ];

  return (
    <div className='min-h-screen bg-gradient-to-b from-[#0a0e14] via-background to-[#0a0e14] text-slate-300 font-sans selection:bg-primary/30'>
      <div className='fixed top-20 right-0 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none'></div>
      <div className='fixed bottom-0 left-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none'></div>

      <nav className='fixed top-0 left-0 w-full z-50 bg-background/90 backdrop-blur-xl border-b border-cyan-500/20 shadow-lg shadow-cyan-500/5'>
        <div className='container mx-auto px-6 h-16 flex justify-between items-center'>
          <Link to='/' className='flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-cyan-400 transition-colors group'>
            <ArrowLeft size={16} className='group-hover:-translate-x-1 transition-transform' /> Back to Portfolio
          </Link>
          <button onClick={generateCV} className='flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-emerald-500 text-white rounded-lg text-sm font-bold hover:shadow-lg hover:shadow-cyan-500/30 transition-all hover:scale-105'>
            <Download size={16} /> Download PDF
          </button>
        </div>
      </nav>

      <main className='container mx-auto px-4 md:px-6 py-32 max-w-4xl relative z-10'>
        <header className='mb-16 border-b-2 border-gradient-to-r from-cyan-500/30 via-emerald-500/30 to-purple-500/30 pb-12 relative'>
          <div className='absolute -top-4 left-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl'></div>
          <h1 className='text-4xl md:text-6xl font-display font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-200 to-white mb-4 tracking-tight'>SIFAT MORSHED</h1>
          <p className='text-xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 font-bold mb-8'>Outbound Sales Specialist & Appointment Setter</p>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4 text-sm'>
            <div className='flex items-center gap-3 text-slate-300 group'><div className='w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform'><Phone size={16} /></div><span>+880 1867001744</span></div>
            <div className='flex items-center gap-3 text-slate-300 group'><div className='w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform'><Mail size={16} /></div><span>sifatmorshed123@gmail.com</span></div>
            <div className='flex items-center gap-3 text-slate-300 group'><div className='w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/30 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform'><MapPin size={16} /></div><span>Dhaka-1219, Bangladesh</span></div>
          </div>
        </header>

        <section className='mb-16'>
          <h2 className='text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 uppercase tracking-widest mb-6 flex items-center gap-2'><span className='w-2 h-2 rounded-full bg-cyan-400 animate-pulse'></span>Professional Summary</h2>
          <div className='bg-gradient-to-br from-cyan-500/10 to-emerald-500/10 border border-cyan-500/20 rounded-2xl p-8 shadow-lg shadow-cyan-500/10'>
            <p className='text-lg text-slate-200 leading-relaxed'>Motivated and confident appointment setter with experience in outbound calling, lead qualification, and setting home-service and solar appointments for US clients. Skilled in communication, objection handling, and building rapport quickly over the phone. Strong work ethic, consistent performance, and ability to meet weekly KPIs.</p>
          </div>
        </section>

        <section className='mb-16'>
          <h2 className='text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 uppercase tracking-widest mb-8 flex items-center gap-2'>
            <span className='w-2 h-2 rounded-full bg-emerald-400 animate-pulse'></span>
            Experience
          </h2>
          <div className='relative border-l-2 border-cyan-500/30 pl-8 space-y-12'>
            {experienceTimeline.map((job, index) => (
              <div key={index} className='relative'>
                <div
                  className={`absolute -left-[41px] top-1 w-6 h-6 rounded-full border-4 border-background shadow-lg ${job.accent === 'emerald'
                    ? 'bg-gradient-to-br from-emerald-400 to-green-500 shadow-emerald-500/50'
                    : job.accent === 'purple'
                      ? 'bg-gradient-to-br from-purple-400 to-pink-500 shadow-purple-500/50'
                      : job.accent === 'yellow'
                        ? 'bg-gradient-to-br from-yellow-400 to-orange-500 shadow-yellow-500/50'
                        : job.accent === 'indigo'
                          ? 'bg-gradient-to-br from-indigo-400 to-blue-500 shadow-indigo-500/50'
                          : 'bg-gradient-to-br from-cyan-400 to-blue-500 shadow-cyan-500/50'}`}
                />
                <div
                  className={`border rounded-xl p-6 ${job.accent === 'emerald'
                    ? 'bg-gradient-to-br from-emerald-500/5 to-green-500/5 border-emerald-500/20'
                    : job.accent === 'purple'
                      ? 'bg-gradient-to-br from-purple-500/5 to-pink-500/5 border-purple-500/20'
                      : job.accent === 'yellow'
                        ? 'bg-gradient-to-br from-yellow-500/5 to-orange-500/5 border-yellow-500/20'
                        : job.accent === 'indigo'
                          ? 'bg-gradient-to-br from-indigo-500/5 to-blue-500/5 border-indigo-500/20'
                          : 'bg-gradient-to-br from-blue-500/5 to-cyan-500/5 border-blue-500/20'}`}
                >
                  <div className='flex flex-col gap-2 mb-2'>
                    <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-2'>
                      <div>
                        <h3 className='text-xl font-bold text-white'>{job.title}</h3>
                        <p
                          className={`font-medium ${job.accent === 'emerald'
                            ? 'text-emerald-400'
                            : job.accent === 'purple'
                              ? 'text-purple-400'
                              : job.accent === 'yellow'
                                ? 'text-yellow-400'
                                : job.accent === 'indigo'
                                  ? 'text-indigo-400'
                                  : 'text-cyan-400'}`}
                        >
                          {job.company}
                        </p>
                      </div>
                      <div className='text-right'>
                        <p className='text-sm text-slate-500 font-mono'>{job.dates}</p>
                        <p className='text-xs text-slate-400 uppercase tracking-wider'>{job.duration}</p>
                      </div>
                    </div>
                  </div>
                  <ul
                    className={`list-disc list-inside space-y-2 text-slate-300 ${job.accent === 'emerald'
                      ? 'marker:text-emerald-400'
                      : job.accent === 'purple'
                        ? 'marker:text-purple-400'
                        : job.accent === 'yellow'
                          ? 'marker:text-yellow-400'
                          : job.accent === 'indigo'
                            ? 'marker:text-indigo-400'
                            : 'marker:text-cyan-400'}`}
                  >
                    {job.bullets.map((bullet, bulletIndex) => (
                      <li key={bulletIndex}>{bullet}</li>
                    ))}
                  </ul>
                  {job.reference && (
                    <div className='mt-4 text-sm text-slate-400'>
                      <div className='font-medium text-slate-200'>Reference</div>
                      <div>{job.reference}</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-12'>
          <section>
            <h2 className='text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 uppercase tracking-widest mb-6 flex items-center gap-2'><span className='w-2 h-2 rounded-full bg-purple-400 animate-pulse'></span>Education</h2>
            <div className='space-y-4'>
              <div className='bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-5 hover:border-purple-400/40 transition-all'><h3 className='text-white font-bold flex items-center gap-2'><span className='text-purple-400'>??</span>BSc in Computer Science & Engineering</h3><p className='text-slate-400 text-sm mt-1'>Southeast University (Present)</p></div>
              <div className='bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-5 hover:border-blue-400/40 transition-all'><h3 className='text-white font-bold flex items-center gap-2'><span className='text-blue-400'>??</span>Higher Secondary School Certificate (H.S.C)</h3></div>
              <div className='bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/20 rounded-xl p-5 hover:border-emerald-400/40 transition-all'><h3 className='text-white font-bold flex items-center gap-2'><span className='text-emerald-400'>??</span>Secondary School Certificate (S.S.C)</h3></div>
            </div>
          </section>

          <section>
            <h2 className='text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 uppercase tracking-widest mb-6 flex items-center gap-2'><span className='w-2 h-2 rounded-full bg-cyan-400 animate-pulse'></span>Skills</h2>
            <div className='flex flex-wrap gap-2'>
              {[
                { skill: 'Outbound Prospecting', color: 'from-cyan-500/20 to-blue-500/20 border-cyan-400/30 text-cyan-300' },
                { skill: 'CRM Proficiency', color: 'from-emerald-500/20 to-green-500/20 border-emerald-400/30 text-emerald-300' },
                { skill: 'Lead Qualification', color: 'from-purple-500/20 to-pink-500/20 border-purple-400/30 text-purple-300' },
                { skill: 'Solar Energy Sector', color: 'from-yellow-500/20 to-orange-500/20 border-yellow-400/30 text-yellow-300' },
                { skill: 'B2B IT/AI Sales', color: 'from-indigo-500/20 to-blue-500/20 border-indigo-400/30 text-indigo-300' },
                { skill: 'Objection Handling', color: 'from-red-500/20 to-pink-500/20 border-red-400/30 text-red-300' },
                { skill: 'English Fluency (C1)', color: 'from-blue-500/20 to-indigo-500/20 border-blue-400/30 text-blue-300' },
                { skill: 'Scheduling', color: 'from-teal-500/20 to-cyan-500/20 border-teal-400/30 text-teal-300' }
              ].map((item, idx) => <span key={idx} className={`px-4 py-2 bg-gradient-to-br ${item.color} rounded-lg text-sm font-medium border hover:scale-105 transition-transform`}>{item.skill}</span>)}
            </div>
          </section>
        </div>

        <section className='mt-12 mb-8'>
          <div className='flex items-center justify-between gap-4 mb-4'>
            <h2 className='text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 uppercase tracking-widest'>References</h2>
            <button onClick={() => setShowReferences((value) => !value)} className='text-xs font-bold uppercase tracking-wider text-slate-300 bg-white/5 border border-white/10 rounded-full px-3 py-1 hover:bg-white/10 transition-colors'>{showReferences ? 'Hide references' : 'Show references'}</button>
          </div>
          {showReferences && (
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {references.map((reference, index) => <div key={index} className='bg-surfaceHighlight/30 border border-white/5 rounded-xl p-4'><div className='font-bold text-white'>{reference.org}</div><div className='text-slate-300 text-sm'>{reference.name} � {reference.title}</div></div>)}
            </div>
          )}
        </section>
      </main>

      <footer className='py-8 text-center text-slate-600 text-sm border-t border-white/5 bg-surfaceHighlight/20'>
        <p>Generated by Sifat Morshed Portfolio System</p>
      </footer>
    </div>
  );
};

export default CvPage;