// TypeScript interfaces for Work With Me module

export type ApplicationStatus =
  | 'NEW'
  | 'AUDIO_PASS'
  | 'INTERVIEW'
  | 'HIRED'
  | 'REJECTED';

export const STATUS_ORDER: ApplicationStatus[] = [
  'NEW',
  'AUDIO_PASS',
  'INTERVIEW',
  'HIRED',
];

export const CLOSED_STATUSES: ApplicationStatus[] = ['REJECTED'];

export interface ApplicationRow {
  app_id: string;
  timestamp: string;
  status: ApplicationStatus;
  company_id: string;
  role_id: string;
  role_title: string;
  full_name: string;
  email: string;
  phone: string;
  nationality: string;
  reference: string;
  blacklist_acknowledged: string; // 'true' | 'false'
  cv_link: string;
  audio_link: string;
  notes: string;
  last_updated: string;
  started_date: string;   // ISO date when worker started (set on HIRED)
  email_log: string;      // comma-separated statuses that already triggered emails
  rejection_date: string; // ISO date when rejected (set on REJECTED)
}

// Status rank for forward-only progression
export const STATUS_RANK: Record<ApplicationStatus, number> = {
  NEW: 0,
  AUDIO_PASS: 1,
  INTERVIEW: 2,
  HIRED: 3,
  REJECTED: 3, // terminal — same rank as HIRED (both are final destinations)
};

export interface CompanyMeta {
  companyId: string;
  name: string;
  logo?: string;
  tagline: string;
  description: string;
  industry: string;
  roles: RoleMeta[];
}

export interface RoleMeta {
  roleId: string;
  title: string;
  type: 'full-time' | 'part-time' | 'contract' | 'freelance';
  salaryUsd: string;
  salaryBdt: string;
  bosnianOnly?: boolean;
  tags: string[];
  shortDescription: string;
  fullDescription: string;
  requirements: string[];
  perks: string[];
}

// Priority countries shown at top of nationality dropdown
export const PRIORITY_COUNTRIES = [
  'Bosnia and Herzegovina',
  'Turkey',
  'Mexico',
  'South Africa',
  'Romania',
  'Serbia',
  'Albania',
  'Philippines',
];

// The script applicants must read aloud for audio upload
// Part 1: ~30s self-introduction. Part 2: ~15-30s cold-call roleplay.
export const AUDIO_SCRIPT = `Part 1 (first 30 seconds): Speak naturally about yourself — your name, where you're from, any relevant experience you have, and why you're interested in this role.

Part 2 (next 15–30 seconds — Roleplay): You are calling a senior IT director named Mr. David Chen. He is busy and skeptical. Your goal is to introduce Silverlight Research, explain you're conducting a short industry survey (not selling anything), and convince him to stay on the line for 2 minutes of questions. Stay confident, handle his pushback, and keep it professional.`;

export interface SubmissionPayload {
  company_id: string;
  role_id: string;
  role_title: string;
  full_name: string;
  email: string;
  phone: string;
  nationality: string;
  reference?: string;
  blacklist_acknowledged: boolean;
  cv: File | null;
  audio: File | null;
}

export interface AuthSession {
  user: {
    name: string;
    email: string;
    image?: string;
  };
  accessToken?: string;
}

export interface StatusResponse {
  app_id: string;
  status: ApplicationStatus;
  role_title: string;
  company_id: string;
  timestamp: string;
  last_updated: string;
}
