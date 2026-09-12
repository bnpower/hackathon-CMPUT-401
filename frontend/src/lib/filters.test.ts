import { describe, expect, it } from 'vitest';
import { createInitialState } from './demo';
import { DEFAULT_TRACKER_FILTERS, filterTrackerRows, formatTrackerDate, getTrackerRows, localDateKey, sortTrackerRows, type TrackerFilters, type TrackerRow } from './filters';

const state = createInitialState();
const rows = getTrackerRows(state.applications, state.jobs);
const filters = (overrides: Partial<TrackerFilters> = {}): TrackerFilters => ({ ...DEFAULT_TRACKER_FILTERS, ...overrides });
const ids = (result: TrackerRow[]) => result.map(row => row.application.id);

function datedRow(id: string, appliedDate: string | null): TrackerRow {
  return { job: rows[0].job, application: { ...rows[0].application, id, appliedDate, status: appliedDate ? 'Applied' : 'Saved' } };
}

// Construct instants in local time so these cases also run in non-UTC time zones.
const dateRows = [
  datedRow('before', new Date(2026, 8, 11, 23, 55).toISOString()),
  datedRow('start-of-day', new Date(2026, 8, 12, 0, 5).toISOString()),
  datedRow('end-of-day', new Date(2026, 8, 12, 23, 55).toISOString()),
  datedRow('after', new Date(2026, 8, 13, 0, 5).toISOString()),
  datedRow('unapplied', null),
  datedRow('invalid', 'invalid-date'),
];

 describe('tracker filters', () => {
  it('includes applied and saved-only entries in the all view', () => {
    expect(filterTrackerRows(rows, filters(), 'all')).toEqual(rows);
  });

  it('uses the bookmark flag, not Saved status, for the saved view', () => {
    const result = filterTrackerRows(rows, filters(), 'saved');
    expect(ids(result)).toEqual(['app-clio', 'app-1password']);
    expect(result.find(row => row.application.id === 'app-1password')?.application.status).toBe('Offer');
    const unbookmarkedSaved = { ...rows[2], application: { ...rows[2].application, saved: false } };
    expect(filterTrackerRows([unbookmarkedSaved], filters(), 'saved')).toEqual([]);
  });

  it('distinguishes a Saved status filter from bookmarked applications', () => {
    expect(ids(filterTrackerRows(rows, filters({ status: 'Saved' }), 'all'))).toEqual(['app-clio']);
    expect(ids(filterTrackerRows(rows, filters({ status: 'Offer' }), 'saved'))).toEqual(['app-1password']);
  });

  it('searches company names case-insensitively and trims whitespace', () => {
    expect(ids(filterTrackerRows(rows, filters({ query: '  WEALTH  ' }), 'all'))).toEqual(['app-wealthsimple']);
    expect(filterTrackerRows(rows, filters({ query: 'Platform Engineer' }), 'all')).toEqual([]);
    expect(filterTrackerRows(rows, filters({ query: '   ' }), 'all')).toEqual(rows);
  });

  it('combines company, location, level, status, and search filters', () => {
    const combined = filters({ query: 'fig', company: 'Figma', location: 'Remote, Canada', level: 'Entry-level', status: 'Applied' });
    expect(ids(filterTrackerRows(rows, combined, 'all'))).toEqual(['app-figma']);
    expect(filterTrackerRows(rows, { ...combined, location: 'Toronto, ON' }, 'all')).toEqual([]);
    expect(filterTrackerRows(rows, { ...combined, company: 'Fig' }, 'all')).toEqual([]);
    expect(filterTrackerRows(rows, { ...combined, level: 'Internship' }, 'all')).toEqual([]);
  });

  it('matches both ends of the selected local calendar day', () => {
    expect(ids(filterTrackerRows(dateRows, filters({ appliedDate: '2026-09-12', dateMode: 'on' }), 'all'))).toEqual(['start-of-day', 'end-of-day']);
  });

  it('treats before and after as exclusive of the whole selected day', () => {
    expect(ids(filterTrackerRows(dateRows, filters({ appliedDate: '2026-09-12', dateMode: 'before' }), 'all'))).toEqual(['before']);
    expect(ids(filterTrackerRows(dateRows, filters({ appliedDate: '2026-09-12', dateMode: 'after' }), 'all'))).toEqual(['after']);
  });

  it('does not filter dates until a day is selected', () => {
    expect(filterTrackerRows(dateRows, filters({ dateMode: 'before' }), 'all')).toEqual(dateRows);
  });

  it('excludes missing and invalid application dates from date filters', () => {
    for (const dateMode of ['on', 'before', 'after'] as const) {
      expect(filterTrackerRows(dateRows.slice(4), filters({ appliedDate: '2026-09-12', dateMode }), 'all')).toEqual([]);
    }
    expect(filterTrackerRows(dateRows, filters({ appliedDate: '2026-02-30' }), 'all')).toEqual([]);
  });

  it('returns an empty result for a company with no matches', () => {
    expect(filterTrackerRows(rows, filters({ query: 'Not a company' }), 'all')).toEqual([]);
  });

  it('gracefully ignores entries whose job is no longer available', () => {
    const applications = [...state.applications, { ...state.applications[0], id: 'missing-job', jobId: 'missing-job' }];
    expect(getTrackerRows(applications, state.jobs)).toEqual(rows);
    expect(applications).toHaveLength(state.applications.length + 1);
    expect(getTrackerRows([], state.jobs)).toEqual([]);
  });
});

describe('local calendar dates', () => {
  it('converts timestamp instants to the local day rather than slicing UTC', () => {
    expect(localDateKey(new Date(2026, 8, 12, 0, 5).toISOString())).toBe('2026-09-12');
    expect(localDateKey(new Date(2026, 8, 12, 23, 55).toISOString())).toBe('2026-09-12');
  });

  it('keeps date-only input unchanged and rejects invalid calendar days', () => {
    expect(localDateKey('2026-09-12')).toBe('2026-09-12');
    expect(localDateKey('2028-02-29')).toBe('2028-02-29');
    expect(localDateKey('2026-02-29')).toBeNull();
    expect(localDateKey('2026-13-01')).toBeNull();
    expect(localDateKey('not-a-date')).toBeNull();
    expect(localDateKey(null)).toBeNull();
  });

  it('formats date-only values without shifting the calendar day', () => {
    const expected = new Intl.DateTimeFormat('en-CA', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(2026, 8, 12, 12));
    expect(formatTrackerDate('2026-09-12')).toBe(expected);
    expect(formatTrackerDate(new Date(2026, 8, 12, 0, 5).toISOString())).toBe(expected);
    expect(formatTrackerDate(null)).toBe('Not applied');
    expect(formatTrackerDate('bad-date', 'Date unavailable')).toBe('Date unavailable');
  });
});

describe('tracker sorting', () => {
  it('sorts companies in both directions without mutating the source', () => {
    const original = ids(rows);
    expect(sortTrackerRows(rows, { key: 'company', direction: 'asc' }).map(row => row.job.company)).toEqual(['1Password', 'Ada', 'Clio', 'Figma', 'Wealthsimple']);
    expect(sortTrackerRows(rows, { key: 'company', direction: 'desc' }).map(row => row.job.company)).toEqual(['Wealthsimple', 'Figma', 'Clio', 'Ada', '1Password']);
    expect(ids(rows)).toEqual(original);
  });

  it.each(['position', 'location', 'level'] as const)('sorts the %s column', key => {
    const result = sortTrackerRows(rows, { key, direction: 'asc' });
    const values = result.map(row => row.job[key]);
    expect(values).toEqual([...values].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base', numeric: true })));
  });

  it('sorts statuses in pipeline order', () => {
    expect(sortTrackerRows(rows, { key: 'status', direction: 'asc' }).map(row => row.application.status)).toEqual(['Applied', 'Interview', 'Offer', 'Rejection', 'Saved']);
  });

  it('sorts actual timestamps and keeps unapplied or invalid dates last in either direction', () => {
    expect(ids(sortTrackerRows(dateRows, { key: 'appliedDate', direction: 'asc' }))).toEqual(['before', 'start-of-day', 'end-of-day', 'after', 'invalid', 'unapplied']);
    expect(ids(sortTrackerRows(dateRows, { key: 'appliedDate', direction: 'desc' }))).toEqual(['after', 'end-of-day', 'start-of-day', 'before', 'invalid', 'unapplied']);
  });

  it('uses a deterministic tie-breaker for equal sort values', () => {
    const tied = [datedRow('b', '2026-09-12T12:00:00Z'), datedRow('a', '2026-09-12T12:00:00Z')];
    expect(ids(sortTrackerRows(tied, { key: 'appliedDate', direction: 'desc' }))).toEqual(['a', 'b']);
  });
});
