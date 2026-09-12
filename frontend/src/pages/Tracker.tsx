import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, Bookmark, BriefcaseBusiness, Check, ChevronRight, FileText, Search, SlidersHorizontal, Trash2, X } from 'lucide-react';
import { CompanyLogo, EmptyState, Modal, StatusBadge } from '../components/UI';
import { useApp } from '../store';
import { STATUSES, type Status } from '../types';
import { DEFAULT_TRACKER_FILTERS, filterTrackerRows, formatTrackerDate, getTrackerRows, sortTrackerRows, type TrackerFilters, type TrackerSort, type TrackerSortKey, type TrackerTab } from '../lib/filters';
import './tracker.css';

interface TrackerProps {
  onOpenJob: (jobId: string) => void;
  initialTab?: TrackerTab;
}

export default function Tracker({ onOpenJob, initialTab = 'all' }: TrackerProps) {
  const { state, saveJob, updateStatus, removeApplications } = useApp();
  const [tab, setTab] = useState<TrackerTab>(initialTab);
  const [filters, setFilters] = useState<TrackerFilters>({ ...DEFAULT_TRACKER_FILTERS });
  const [sort, setSort] = useState<TrackerSort>({ key: 'appliedDate', direction: 'desc' });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [removalIds, setRemovalIds] = useState<string[] | null>(null);

  useEffect(() => {
    setTab(initialTab);
    setSelectedIds(new Set());
  }, [initialTab]);

  const allRows = getTrackerRows(state.applications, state.jobs);
  const bookmarkedCount = allRows.filter(row => row.application.saved).length;
  const tabCount = tab === 'saved' ? bookmarkedCount : allRows.length;
  const rows = sortTrackerRows(filterTrackerRows(allRows, filters, tab), sort);
  const selectedRows = rows.filter(row => selectedIds.has(row.application.id));
  const allSelected = rows.length > 0 && selectedRows.length === rows.length;
  const someSelected = selectedRows.length > 0 && !allSelected;
  const pendingRows = allRows.filter(row => removalIds?.includes(row.application.id));
  const filterCount = [filters.query.trim(), filters.status, filters.location, filters.level, filters.company, filters.appliedDate].filter(Boolean).length;
  const options = (key: 'company' | 'location' | 'level') => [...new Set(allRows.map(row => row.job[key]))].sort((a, b) => a.localeCompare(b));

  function updateFilter<K extends keyof TrackerFilters>(key: K, value: TrackerFilters[K]) {
    setFilters(current => ({ ...current, [key]: value }));
    setSelectedIds(new Set());
  }

  function clearFilters() {
    setFilters({ ...DEFAULT_TRACKER_FILTERS });
    setSelectedIds(new Set());
  }

  function changeTab(next: TrackerTab) {
    setTab(next);
    setSelectedIds(new Set());
  }

  function toggleRow(id: string) {
    setSelectedIds(current => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function sortHeader(key: TrackerSortKey, label: string) {
    const active = sort.key === key;
    const Icon = !active ? ArrowUpDown : sort.direction === 'asc' ? ArrowUp : ArrowDown;
    return (
      <th scope="col" aria-sort={active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
        <button
          type="button"
          className={`tracker-sort${active ? ' tracker-sort--active' : ''}`}
          onClick={() => setSort(current => ({ key, direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc' }))}
          aria-label={`Sort by ${label.toLowerCase()}, ${active && sort.direction === 'asc' ? 'descending' : 'ascending'}`}
        >
          {label}<Icon size={13} aria-hidden="true" />
        </button>
      </th>
    );
  }

  return (
    <div className="tracker-page">
      <header className="page-heading tracker-heading">
        <div>
          <p className="eyebrow">YOUR NEXT CHAPTER</p>
          <h1>Application tracker</h1>
          <p className="muted">A little structure. A lot of possibility. Keep every opportunity in view.</p>
        </div>
        <span className="badge tracker-demo-label"><span className="tracker-demo-dot" />Demo workspace</span>
      </header>

      <div className="tracker-stats" aria-label="Application overview">
        <div className="panel tracker-stat">
          <span className="tracker-stat-icon"><BriefcaseBusiness size={19} aria-hidden="true" /></span>
          <div><strong>{allRows.filter(row => Boolean(row.application.appliedDate)).length}</strong><span>Applied jobs</span></div>
        </div>
        <div className="panel tracker-stat">
          <span className="tracker-stat-icon"><Check size={19} aria-hidden="true" /></span>
          <div><strong>{allRows.filter(row => row.application.status === 'Interview').length}</strong><span>In interview</span></div>
        </div>
        <div className="panel tracker-stat">
          <span className="tracker-stat-icon tracker-stat-icon--warm"><BriefcaseBusiness size={19} aria-hidden="true" /></span>
          <div><strong>{allRows.filter(row => row.application.status === 'Offer' || row.application.status === 'Accepted').length}</strong><span>Offers & accepted</span></div>
        </div>
        <div className="panel tracker-stat">
          <span className="tracker-stat-icon"><Bookmark size={19} aria-hidden="true" /></span>
          <div><strong>{bookmarkedCount}</strong><span>Bookmarked jobs</span></div>
        </div>
      </div>

      <section className="panel tracker-workspace" aria-label="Tracked jobs">
        <div className="tracker-topbar">
          <div className="tracker-tabs" role="group" aria-label="Tracker view">
            <button type="button" className={`tracker-tab${tab === 'all' ? ' tracker-tab--active' : ''}`} aria-pressed={tab === 'all'} onClick={() => changeTab('all')}>
              All jobs <span>{allRows.length}</span>
            </button>
            <button type="button" className={`tracker-tab${tab === 'saved' ? ' tracker-tab--active' : ''}`} aria-pressed={tab === 'saved'} onClick={() => changeTab('saved')}>
              <Bookmark size={15} aria-hidden="true" />Saved <span>{bookmarkedCount}</span>
            </button>
          </div>
          <div className="tracker-search">
            <Search size={18} aria-hidden="true" />
            <label className="tracker-sr-only" htmlFor="tracker-company-search">Search by company</label>
            <input id="tracker-company-search" className="input" type="search" placeholder="Search companies…" value={filters.query} onChange={event => updateFilter('query', event.target.value)} />
          </div>
        </div>
        <p className="tracker-tab-hint muted">Saved is your bookmark list, including jobs you’ve applied to. A “Saved” status means you haven’t applied yet.</p>

        <div className="tracker-filters">
          <div className="tracker-filter-heading">
            <span><SlidersHorizontal size={15} aria-hidden="true" />Filters{filterCount > 0 ? ` · ${filterCount}` : ''}</span>
            {filterCount > 0 && <button type="button" className="btn btn-ghost tracker-clear" onClick={clearFilters}><X size={14} aria-hidden="true" />Clear filters</button>}
          </div>
          <div className="tracker-filter-grid">
            <div className="field tracker-filter">
              <label htmlFor="tracker-status-filter">Status</label>
              <select id="tracker-status-filter" className="input" value={filters.status} onChange={event => updateFilter('status', event.target.value as Status | '')}>
                <option value="">All statuses</option>
                {STATUSES.map(status => <option key={status} value={status}>{status === 'Saved' ? 'Saved (not applied)' : status}</option>)}
              </select>
            </div>
            <div className="field tracker-filter">
              <label htmlFor="tracker-location-filter">Location</label>
              <select id="tracker-location-filter" className="input" value={filters.location} onChange={event => updateFilter('location', event.target.value)}>
                <option value="">All locations</option>
                {options('location').map(location => <option key={location}>{location}</option>)}
              </select>
            </div>
            <div className="field tracker-filter">
              <label htmlFor="tracker-level-filter">Level</label>
              <select id="tracker-level-filter" className="input" value={filters.level} onChange={event => updateFilter('level', event.target.value)}>
                <option value="">All levels</option>
                {options('level').map(level => <option key={level}>{level}</option>)}
              </select>
            </div>
            <div className="field tracker-filter">
              <label htmlFor="tracker-company-filter">Company</label>
              <select id="tracker-company-filter" className="input" value={filters.company} onChange={event => updateFilter('company', event.target.value)}>
                <option value="">All companies</option>
                {options('company').map(company => <option key={company}>{company}</option>)}
              </select>
            </div>
            <div className="field tracker-filter tracker-date-filter">
              <label htmlFor="tracker-applied-date">Apply date</label>
              <div className="tracker-date-inputs">
                <select className="input" aria-label="Apply date comparison" value={filters.dateMode} onChange={event => updateFilter('dateMode', event.target.value as TrackerFilters['dateMode'])}>
                  <option value="on">On</option><option value="before">Before</option><option value="after">After</option>
                </select>
                <input id="tracker-applied-date" className="input" type="date" aria-describedby="tracker-date-hint" value={filters.appliedDate} onChange={event => updateFilter('appliedDate', event.target.value)} />
              </div>
            </div>
          </div>
          <p id="tracker-date-hint" className="tracker-filter-hint muted">Dates use your local time. Before and after exclude the selected day; unapplied jobs don’t match a date filter.</p>
        </div>

        <div className="tracker-results-bar">
          <p className="muted" role="status">Showing <strong>{rows.length}</strong> of {tabCount} {tabCount === 1 ? 'job' : 'jobs'}</p>
          {selectedRows.length > 0 && (
            <div className="tracker-selection">
              <span>{selectedRows.length} selected</span>
              <button type="button" className="btn btn-ghost" onClick={() => setSelectedIds(new Set())}>Deselect</button>
              <button type="button" className="btn btn-secondary tracker-remove" onClick={() => setRemovalIds(selectedRows.map(row => row.application.id))}>
                <Trash2 size={15} aria-hidden="true" />Remove selected
              </button>
            </div>
          )}
        </div>

        {rows.length > 0 ? (
          <div className="tracker-table-scroll" role="region" aria-label="Application tracker table; scroll horizontally for more columns" tabIndex={0}>
            <table className="tracker-table">
              <caption className="tracker-sr-only">{tab === 'saved' ? 'Bookmarked jobs' : 'All tracked jobs'}. Open a job using its role button. Sort using column headers.</caption>
              <thead>
                <tr>
                  <th scope="col" className="tracker-checkbox-cell">
                    <input type="checkbox" className="tracker-checkbox" aria-label="Select all visible jobs" checked={allSelected} ref={node => { if (node) node.indeterminate = someSelected; }} onChange={() => setSelectedIds(allSelected ? new Set() : new Set(rows.map(row => row.application.id)))} />
                  </th>
                  {sortHeader('company', 'Company')}
                  {sortHeader('position', 'Role')}
                  {sortHeader('location', 'Location')}
                  {sortHeader('level', 'Level')}
                  {sortHeader('status', 'Status')}
                  {sortHeader('appliedDate', 'Apply date')}
                  <th scope="col">Resume type</th>
                  <th scope="col"><span className="tracker-sr-only">Bookmark</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ application, job }) => {
                  const resume = state.resumes.find(item => item.id === application.resumeId);
                  const jobLabel = `${job.position} at ${job.company}`;
                  return (
                    <tr key={application.id} className={selectedIds.has(application.id) ? 'tracker-row tracker-row--selected' : 'tracker-row'} onClick={event => {
                      if (event.target instanceof Element && event.target.closest('button, a, input, select, textarea, label')) return;
                      onOpenJob(job.id);
                    }}>
                      <td className="tracker-checkbox-cell"><input type="checkbox" className="tracker-checkbox" aria-label={`Select ${jobLabel}`} checked={selectedIds.has(application.id)} onChange={() => toggleRow(application.id)} /></td>
                      <td><div className="tracker-company"><CompanyLogo job={job} size="sm" /><span>{job.company}</span></div></td>
                      <td>
                        <button type="button" className="tracker-job-link" aria-label={`View ${jobLabel}`} onClick={() => onOpenJob(job.id)}>{job.position}<ChevronRight size={14} aria-hidden="true" /></button>
                        <span className="tracker-cell-secondary">{job.department}</span>
                      </td>
                      <td><span className="tracker-cell-main">{job.location}</span><span className="tracker-cell-secondary">{job.workplace}</span></td>
                      <td><span className="tracker-level">{job.level}</span></td>
                      <td>
                        {application.appliedDate ? (
                          <select className={`input tracker-status-select tracker-status-select--${application.status.toLowerCase()}`} aria-label={`Pipeline status for ${jobLabel}`} value={application.status} onChange={event => updateStatus(application.id, event.target.value as Status)}>
                            {STATUSES.filter(status => status !== 'Saved').map(status => <option key={status}>{status}</option>)}
                          </select>
                        ) : (
                          <div className="tracker-saved-status"><StatusBadge status={application.status} /><button type="button" className="tracker-inline-action" aria-label={`Open ${jobLabel} to apply before changing status`} onClick={() => onOpenJob(job.id)}>Apply first<ChevronRight size={12} aria-hidden="true" /></button></div>
                        )}
                      </td>
                      <td className="tracker-date-cell">{application.appliedDate ? <time dateTime={application.appliedDate}>{formatTrackerDate(application.appliedDate)}</time> : <span className="muted">Not applied</span>}</td>
                      <td>
                        {resume ? <div className="tracker-resume"><FileText size={14} aria-hidden="true" /><span title={resume.name}>{resume.jobId === null ? 'Master resume' : 'Custom resume'}</span></div> : <span className="tracker-cell-secondary">{application.resumeId ? 'Resume unavailable' : application.appliedDate ? 'Not recorded' : 'Choose when applying'}</span>}
                      </td>
                      <td><button type="button" className={`icon-button tracker-bookmark${application.saved ? ' tracker-bookmark--active' : ''}`} aria-label={`${application.saved ? 'Remove bookmark for' : 'Bookmark'} ${jobLabel}`} title={application.saved ? 'Remove bookmark' : 'Bookmark job'} aria-pressed={application.saved} onClick={() => { saveJob(job.id); setSelectedIds(current => new Set([...current].filter(id => id !== application.id))); }}><Bookmark size={18} fill={application.saved ? 'currentColor' : 'none'} aria-hidden="true" /></button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="tracker-empty">
            <EmptyState
              icon={filterCount > 0 ? <Search size={27} /> : tab === 'saved' ? <Bookmark size={27} /> : <BriefcaseBusiness size={27} />}
              title={filterCount > 0 ? 'No jobs match these filters' : tab === 'saved' ? 'A little room for possibility' : 'Your next chapter starts here'}
              description={filterCount > 0 ? 'Try another company or loosen a filter. Date filters only include jobs you’ve applied to.' : tab === 'saved' ? 'Bookmark a role in Discover or your tracker to keep it close. Applied jobs can be bookmarked, too.' : 'Find a role in Discover, then save it for later or record a demo application. It will appear here.'}
              action={filterCount > 0 ? <button type="button" className="btn btn-secondary" onClick={clearFilters}>Clear filters</button> : tab === 'saved' && allRows.length > 0 ? <button type="button" className="btn btn-secondary" onClick={() => changeTab('all')}>View all jobs</button> : undefined}
            />
          </div>
        )}
        <footer className="tracker-footer muted">Your progress, all in one place. This is a demo tracker; nothing is sent to employers.</footer>
      </section>

      {removalIds !== null && (
        <Modal title={`Remove ${pendingRows.length === 1 ? 'this job' : `${pendingRows.length} jobs`}?`} onClose={() => setRemovalIds(null)}>
          <div className="tracker-removal-dialog">
            <p>This removes the selected tracker entries, their bookmarks, and their notification history. Your resumes will stay in your workspace.</p>
            <ul className="tracker-removal-list">{pendingRows.map(({ application, job }) => <li key={application.id}><strong>{job.company}</strong><span>{job.position}</span></li>)}</ul>
            <p className="muted">This cannot be undone. It does not withdraw an application or contact an employer.</p>
            <div className="tracker-dialog-actions">
              <button type="button" className="btn btn-secondary" autoFocus onClick={() => setRemovalIds(null)}>Cancel</button>
              <button type="button" className="btn tracker-danger-button" disabled={pendingRows.length === 0} onClick={() => {
                removeApplications(pendingRows.map(row => row.application.id));
                setSelectedIds(new Set());
                setRemovalIds(null);
              }}><Trash2 size={16} aria-hidden="true" />Remove {pendingRows.length === 1 ? 'job' : `${pendingRows.length} jobs`}</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
