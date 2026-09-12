import type { AppState, Application, Status } from '../types';

export function toggleSaved(state: AppState, jobId: string): AppState {
  if (!state.jobs.some(job => job.id === jobId)) return state;
  const existing = state.applications.find(app => app.jobId === jobId);
  if (existing?.status === 'Saved' && existing.saved) return { ...state, applications: state.applications.filter(app => app.id !== existing.id) };
  if (existing) return { ...state, applications: state.applications.map(app => app.id === existing.id ? { ...app, saved: !app.saved } : app) };
  const saved: Application = { id: crypto.randomUUID(), jobId, status: 'Saved', appliedDate: null, resumeId: null, saved: true, notifications: [] };
  return { ...state, applications: [...state.applications, saved] };
}

export function recordApplication(state: AppState, jobId: string, resumeId: string): AppState {
  if (!state.jobs.some(job => job.id === jobId)) return state;
  const resume = state.resumes.find(item => item.id === resumeId);
  if (!resume || (resume.jobId !== null && resume.jobId !== jobId)) return state;
  const existing = state.applications.find(app => app.jobId === jobId);
  if (existing?.appliedDate) return state;
  const now = new Date().toISOString();
  const application: Application = {
    id: existing?.id ?? crypto.randomUUID(), jobId, status: 'Applied', appliedDate: now, resumeId, saved: existing?.saved ?? false,
    notifications: [{ id: crypto.randomUUID(), title: 'Application recorded', message: `Added to your demo tracker with ${resume.jobId ? 'a custom resume' : 'your master resume'}. No application was sent to the employer.`, date: now, channel: 'In-app' }, ...(existing?.notifications ?? [])],
  };
  return { ...state, applications: [...state.applications.filter(app => app.jobId !== jobId), application] };
}

export function changeStatus(state: AppState, applicationId: string, status: Status): AppState {
  return { ...state, applications: state.applications.map(app => {
    if (app.id !== applicationId || app.status === status) return app;
    // A saved-only job must be applied with a resume before entering the pipeline.
    if (!app.appliedDate && status !== 'Saved') return app;
    if (app.appliedDate && status === 'Saved') return app;
    return { ...app, status, notifications: [{ id: crypto.randomUUID(), title: `Status changed to ${status}`, message: `You updated this application to ${status}.`, date: new Date().toISOString(), channel: 'In-app' as const }, ...app.notifications] };
  }) };
}

export function formatDate(value: string | null, options?: Intl.DateTimeFormatOptions) {
  if (!value) return 'Not applied';
  return new Intl.DateTimeFormat('en-CA', options ?? { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
}

export function localDate(value: string) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
