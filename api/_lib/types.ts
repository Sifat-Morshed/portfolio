// TypeScript interfaces for Work With Me API (server-side copy)

export type ApplicationStatus =
  | 'NEW'
  | 'AUDIO_PASS'
  | 'INTERVIEW'
  | 'HIRED'
  | 'REJECTED';

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
  blacklist_acknowledged: string;
  cv_link: string;
  audio_link: string;
  notes: string;
  last_updated: string;
}
