import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { createInitialState } from './lib/demo';
import { changeStatus, recordApplication, toggleSaved } from './lib/state';
import type { AppState, Profile, Resume, Status } from './types';

const STORAGE_KEY = 'hirepower-demo-v1';
function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as AppState;
      if (saved.profile && Array.isArray(saved.jobs) && Array.isArray(saved.applications) && Array.isArray(saved.resumes) && saved.resumes.some(resume => resume.id === 'master')) return saved;
    }
  } catch { /* A private browser or old demo snapshot can fall back to a fresh session. */ }
  return createInitialState();
}
interface AppContextValue {
  state: AppState;
  toastMessage: string;
  toast: (message: string) => void;
  saveJob: (jobId: string) => void;
  applyJob: (jobId: string, resumeId?: string) => void;
  updateStatus: (applicationId: string, status: Status) => void;
  removeApplications: (ids: string[]) => void;
  saveResume: (resume: Resume) => void;
  createCustomResume: (jobId: string) => Resume;
  deleteResume: (id: string) => void;
  updateProfile: (profile: Profile) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  completeOnboarding: (profile: Profile, resume: Resume) => void;
  signInDemo: (fullName: string, email: string) => void;
  signOut: () => void;
  resetDemo: () => void;
}
const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(loadState);
  const [toastMessage, setToastMessage] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const storageWarningShown = useRef(false);
  function toast(message: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMessage(message);
    toastTimer.current = setTimeout(() => setToastMessage(''), 5000);
  }
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch { if (!storageWarningShown.current) { toast('Browser storage is unavailable. Changes will last only for this session.'); storageWarningShown.current = true; } }
    document.documentElement.dataset.theme = state.theme;
    document.documentElement.style.colorScheme = state.theme;
  }, [state]);
  const value: AppContextValue = {
    state, toastMessage, toast,
    saveJob(jobId) {
      const saved = state.applications.find(app => app.jobId === jobId)?.saved;
      setState(current => toggleSaved(current, jobId));
      toast(saved ? 'Job removed from your saved list.' : 'Saved for later. Your next chapter can wait a little.');
    },
    applyJob(jobId, resumeId = 'master') {
      setState(current => recordApplication(current, jobId, resumeId));
      toast('Application added to your demo tracker. Nothing was sent to the employer.');
    },
    updateStatus(applicationId, status) { setState(current => changeStatus(current, applicationId, status)); toast('Application status updated.'); },
    removeApplications(ids) { setState(current => ({ ...current, applications: current.applications.filter(app => !ids.includes(app.id)) })); toast(`${ids.length} ${ids.length === 1 ? 'entry' : 'entries'} removed from your tracker.`); },
    saveResume(resume) { setState(current => ({ ...current, resumes: [...current.resumes.filter(item => item.id !== resume.id), { ...resume, updatedAt: new Date().toISOString() }] })); toast('Resume saved. Looking good!'); },
    createCustomResume(jobId) {
      const job = state.jobs.find(item => item.id === jobId)!;
      const resume = structuredClone(state.resumes.find(item => item.id === 'master')!);
      resume.id = crypto.randomUUID(); resume.jobId = jobId; resume.name = `${job.company} · ${job.position}`; resume.updatedAt = new Date().toISOString();
      setState(current => ({ ...current, resumes: [...current.resumes, resume] }));
      return resume;
    },
    deleteResume(id) {
      if (id === 'master' || state.applications.some(app => app.resumeId === id)) { toast('Resumes used by an application cannot be deleted.'); return; }
      setState(current => ({ ...current, resumes: current.resumes.filter(resume => resume.id !== id) })); toast('Custom resume deleted.');
    },
    updateProfile(profile) { setState(current => ({ ...current, profile, session: current.session ? { fullName: profile.fullName, email: profile.email } : null, resumes: current.resumes.map(resume => resume.id === 'master' ? { ...resume, contact: { fullName: profile.fullName, email: profile.email, phone: profile.phone, location: profile.location, website: profile.website, linkedin: profile.linkedin } } : resume) })); toast('Your preferences are all up to date.'); },
    setTheme(theme) { setState(current => ({ ...current, theme })); },
    completeOnboarding(profile, resume) { setState(current => ({ ...current, profile, onboarded: true, resumes: [resume, ...current.resumes.filter(item => item.id !== 'master')] })); toast('You’re all set. Let’s find your next chapter.'); },
    signInDemo(fullName, email) { setState(current => ({ ...current, session: { fullName, email }, profile: { ...current.profile, fullName, email } })); },
    signOut() { setState(current => ({ ...current, session: null })); toast('Signed out of your demo session.'); },
    resetDemo() { setState(createInitialState()); toast('Demo workspace reset. A fresh start!'); },
  };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp must be used within AppProvider');
  return value;
}
