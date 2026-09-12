import { formatDate, localDate } from './state';
import { STATUSES, type Application, type Job, type Status } from '../types';

export type TrackerTab = 'all' | 'saved';
export type TrackerSortKey = 'company' | 'position' | 'location' | 'level' | 'status' | 'appliedDate';
export interface TrackerSort {
  key: TrackerSortKey;
  direction: 'asc' | 'desc';
}
export interface TrackerFilters {
  query: string;
  status: Status | '';
  location: string;
  level: string;
  company: string;
  dateMode: 'on' | 'before' | 'after';
  appliedDate: string;
}
export interface TrackerRow {
  application: Application;
  job: Job;
}
export const DEFAULT_TRACKER_FILTERS: TrackerFilters = {
  query: '', status: '', location: '', level: '', company: '', dateMode: 'on', appliedDate: '',
};

export function getTrackerRows(applications: Application[], jobs: Job[]): TrackerRow[] {
  const jobsById = new Map(jobs.map(job => [job.id, job]));
  return applications.flatMap(application => {
    const job = jobsById.get(application.jobId);
    return job ? [{ application, job }] : [];
  });
}

export function localDateKey(value: string | null): string | null {
  if (!value) return null;
  // Date-input values are local calendar days, not UTC-midnight timestamps.
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const normalized = dateOnly ? `${value}T12:00:00` : value;
  if (Number.isNaN(new Date(normalized).getTime())) return null;
  const key = localDate(normalized);
  return dateOnly && key !== value ? null : key;
}

export function formatTrackerDate(value: string | null, fallback = 'Not applied'): string {
  const key = localDateKey(value);
  return key ? formatDate(`${key}T12:00:00`) : fallback;
}

export function filterTrackerRows(rows: TrackerRow[], filters: TrackerFilters, tab: TrackerTab): TrackerRow[] {
  const query = filters.query.trim().toLocaleLowerCase();
  return rows.filter(({ application, job }) => {
    if (tab === 'saved' && !application.saved) return false;
    if (query && !job.company.toLocaleLowerCase().includes(query)) return false;
    if (filters.status && application.status !== filters.status) return false;
    if (filters.location && job.location !== filters.location) return false;
    if (filters.level && job.level !== filters.level) return false;
    if (filters.company && job.company !== filters.company) return false;
    if (filters.appliedDate) {
      const date = localDateKey(application.appliedDate);
      const target = localDateKey(filters.appliedDate);
      if (!date || !target) return false;
      if (filters.dateMode === 'on' && date !== target) return false;
      if (filters.dateMode === 'before' && date >= target) return false;
      if (filters.dateMode === 'after' && date <= target) return false;
    }
    return true;
  });
}

export function sortTrackerRows(rows: TrackerRow[], sort: TrackerSort): TrackerRow[] {
  const direction = sort.direction === 'asc' ? 1 : -1;
  const compareText = (left: string, right: string) => left.localeCompare(right, undefined, { sensitivity: 'base', numeric: true });
  return [...rows].sort((left, right) => {
    let comparison: number;
    if (sort.key === 'appliedDate') {
      const leftDate = left.application.appliedDate ? Date.parse(left.application.appliedDate) : NaN;
      const rightDate = right.application.appliedDate ? Date.parse(right.application.appliedDate) : NaN;
      // Unapplied or invalid dates stay at the bottom in either direction.
      if (Number.isNaN(leftDate) !== Number.isNaN(rightDate)) return Number.isNaN(leftDate) ? 1 : -1;
      comparison = Number.isNaN(leftDate) ? 0 : leftDate - rightDate;
    } else if (sort.key === 'status') {
      comparison = STATUSES.indexOf(left.application.status) - STATUSES.indexOf(right.application.status);
    } else {
      comparison = compareText(left.job[sort.key], right.job[sort.key]);
    }
    return comparison * direction || compareText(left.job.company, right.job.company)
      || compareText(left.job.position, right.job.position)
      || compareText(left.application.id, right.application.id);
  });
}
