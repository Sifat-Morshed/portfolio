import type { CompanyMeta } from './types';

// Company and Roles data
export const COMPANIES: CompanyMeta[] = [
  {
    companyId: 'silverlight-research',
    name: 'Silverlight Research',
    tagline: 'Market Research & Survey Calling',
    description:
      'Silverlight Research is a US-based market research company that conducts phone surveys for Fortune 500 clients. We never sell anything — we gather data. Our callers speak to real people, ask short survey questions, and help companies make better decisions.',
    industry: 'Market Research',
    roles: [
      {
        roleId: 'global-setter',
        title: 'Remote Appointment Setter (Global)',
        type: 'full-time',
        salaryUsd: '$200 – $300 USD/month',
        salaryBdt: '~৳27,000 – ৳40,500 BDT/month',
        tags: ['Remote', 'Worldwide', 'Cold Calling', 'Monthly Bonus'],
        shortDescription:
          'Join our core team contacting industry professionals. Your role will be assigned based on your voice assessment: either calling Industry Experts to join our network OR contacting Existing Clients to book software walkthroughs.',
        fullDescription:
          'Join our core team contacting industry professionals. Your role will be assigned based on your voice assessment: either calling Industry Experts to join our network OR contacting Existing Clients to book software walkthroughs. You will be fully trained on scripts and compliance before going live. This is a research-focused position — no hard selling required.',
        requirements: [
          '9 Hours/Day availability',
          'Fluent English — confidence is key',
          'Quiet environment with stable internet',
          'Basic computer literacy',
          'Willing to commit for a minimum of 1–2 weeks',
        ],
        perks: [
          'Base salary: $200 – $300 USD/month (~৳27,000 – ৳40,500 BDT)',
          'Monthly bonus opportunities',
          'Fully remote — work from anywhere',
          'No selling required',
          'Paid training provided',
        ],
      },
      {
        roleId: 'bosnian-specialist',
        title: 'Senior Sales Specialist (Bosnia Exclusive)',
        type: 'full-time',
        salaryUsd: '$700 USD Base/month',
        salaryBdt: '~৳94,500 BDT/month',
        bosnianOnly: true,
        tags: ['Bosnia Only', 'Premium Pay', 'Full-time', 'High-Ticket Sales'],
        shortDescription:
          'Exclusive high-ticket sales role for Bosnian residents. Focus on high-volume outbound appointment setting and expert recruitment. Premium base pay structure.',
        fullDescription:
          'Exclusive high-ticket sales role for Bosnian residents. Focus on high-volume outbound appointment setting and expert recruitment. Premium base pay structure. You will handle dedicated high-priority campaigns with higher volume and greater impact. Full training, script support, and direct team lead access included.',
        requirements: [
          'Must be located in Bosnia',
          'Strong sales background',
          'Full-time commitment',
          'Fluent English with clear pronunciation',
          'Minimum 1–2 weeks commitment required',
        ],
        perks: [
          'Premium base salary: $700 USD/month (~৳94,500 BDT)',
          'Additional performance bonuses',
          'Dedicated campaign assignments',
          'Direct team lead support',
          'Career growth into team lead roles',
        ],
      },
    ],
  },
];

export function getCompanyById(companyId: string): CompanyMeta | undefined {
  return COMPANIES.find((c) => c.companyId === companyId);
}

export function getRoleById(companyId: string, roleId: string) {
  const company = getCompanyById(companyId);
  if (!company) return undefined;
  return company.roles.find((r) => r.roleId === roleId);
}
