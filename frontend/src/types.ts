export const STATUSES = ['Applied', 'Interview', 'Offer', 'Rejection', 'Accepted', 'Ghosted', 'Saved'] as const;
export type Status = typeof STATUSES[number];
export const POSITIONS = ['Backend', 'Frontend', 'Fullstack', 'Embedded', 'DevOps', 'Data & AI', 'Mobile', 'Security'];
export const LOCATIONS = ['Toronto, ON', 'Vancouver, BC', 'Montréal, QC', 'Calgary, AB', 'Edmonton, AB', 'Ottawa, ON', 'Waterloo, ON', 'Remote, Canada'];
export const LEVELS = ['Entry-level', 'Internship', 'Full-time', 'Part-time'];
export type Page = 'discover' | 'tracker' | 'resumes' | 'settings';
export interface Job {
  id: string;
  company: string;
  logo: string;
  color: string;
  position: string;
  department: string;
  location: string;
  level: string;
  workplace: 'Remote' | 'Hybrid' | 'On-site';
  salary: string;
  description: string;
  requirements: string[];
  skills: string[];
  postedAt: string;
  match: number;
  featured?: boolean;
  about: string;
}
export interface JobNotification {
  id: string;
  title: string;
  message: string;
  date: string;
  channel: 'Email' | 'In-app';
}
export interface Application {
  id: string;
  jobId: string;
  status: Status;
  appliedDate: string | null;
  resumeId: string | null;
  saved: boolean;
  notifications: JobNotification[];
}
export interface Contact {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
}
export interface Profile extends Contact {
  positions: string[];
  locations: string[];
  levels: string[];
  weeklyGoal: number;
}
export const RESUME_SECTIONS = ['education', 'experience', 'skills', 'projects'] as const;
export type ResumeSection = typeof RESUME_SECTIONS[number];
export interface ResumeEntry {
  id: string;
  title: string;
  subtitle: string;
  location: string;
  period: string;
  details: string;
  visible: boolean;
}
export interface Resume {
  id: string;
  name: string;
  jobId: string | null;
  updatedAt: string;
  contact: Contact;
  sections: Record<ResumeSection, ResumeEntry[]>;
}
export interface AppState {
  profile: Profile;
  jobs: Job[];
  applications: Application[];
  resumes: Resume[];
  theme: 'light' | 'dark';
  onboarded: boolean;
  session: { fullName: string; email: string } | null;
}
