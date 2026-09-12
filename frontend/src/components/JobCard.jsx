import { useState } from 'react'
import {
  communicationIcon,
  formatDate,
  formatDateTime,
  relativeTime,
  stageMeta,
} from '../utils/format'
import './JobCard.css'

function initials(companyName) {
  return companyName
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
}

export default function JobCard({ application }) {
  const [expanded, setExpanded] = useState(false)
  const stage = stageMeta(application.stage)
  const openReminders = application.reminders.filter((r) => !r.is_completed)

  return (
    <article className="job-card">
      <header className="job-card__header">
        <div className="job-card__avatar" aria-hidden="true">
          {initials(application.company_name)}
        </div>
        <div className="job-card__heading">
          <h2>{application.position_title}</h2>
          <p className="job-card__company">{application.company_name}</p>
        </div>
        <span
          className="job-card__stage"
          style={{ '--stage-color': stage.color }}
        >
          {stage.label}
        </span>
      </header>

      <dl className="job-card__meta">
        {application.location && (
          <div>
            <dt>Location</dt>
            <dd>{application.location}</dd>
          </div>
        )}
        {application.date_applied && (
          <div>
            <dt>Applied</dt>
            <dd>{formatDate(application.date_applied)}</dd>
          </div>
        )}
        {application.salary_range && (
          <div>
            <dt>Salary</dt>
            <dd>{application.salary_range}</dd>
          </div>
        )}
      </dl>

      {application.notes && <p className="job-card__notes">{application.notes}</p>}

      <button
        type="button"
        className="job-card__toggle"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
      >
        <span>
          {openReminders.length > 0 && `${openReminders.length} reminder${openReminders.length > 1 ? 's' : ''} · `}
          {application.communications.length} update{application.communications.length === 1 ? '' : 's'} ·{' '}
          {application.status_history.length} stage change{application.status_history.length === 1 ? '' : 's'}
        </span>
        <span className="job-card__chevron">{expanded ? '▲' : '▼'}</span>
      </button>

      <div className={`job-card__details ${expanded ? 'is-expanded' : ''}`}>
        <div className="job-card__details-inner">
          {application.reminders.length > 0 && (
            <section>
              <h3>Reminders</h3>
              <ul className="job-card__list">
                {application.reminders.map((reminder) => (
                  <li key={reminder.id} className={reminder.is_completed ? 'is-completed' : ''}>
                    <span className="job-card__list-icon">{reminder.is_completed ? '✅' : '⏰'}</span>
                    <div>
                      <p className="job-card__list-title">{reminder.title}</p>
                      <p className="job-card__list-sub">
                        Due {relativeTime(reminder.due_at)}
                        {reminder.notes && ` — ${reminder.notes}`}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {application.status_history.length > 0 && (
            <section>
              <h3>Stage history</h3>
              <ul className="job-card__list">
                {application.status_history.map((entry) => (
                  <li key={entry.id}>
                    <span className="job-card__list-icon">📌</span>
                    <div>
                      <p className="job-card__list-title">
                        {stageMeta(entry.stage).label}
                        <span className="job-card__list-date"> · {formatDate(entry.changed_at)}</span>
                      </p>
                      {entry.note && <p className="job-card__list-sub">{entry.note}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {application.communications.length > 0 && (
            <section>
              <h3>Communications</h3>
              <ul className="job-card__list">
                {application.communications.map((comm) => (
                  <li key={comm.id}>
                    <span className="job-card__list-icon">{communicationIcon(comm.type)}</span>
                    <div>
                      <p className="job-card__list-title">
                        {comm.subject || comm.type}
                        <span className="job-card__list-date"> · {formatDateTime(comm.occurred_at)}</span>
                      </p>
                      <p className="job-card__list-sub">
                        {comm.direction === 'inbound' ? 'From' : 'To'} {comm.contact_name || 'unknown'}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {application.resumes.length > 0 && (
            <section>
              <h3>Resumes</h3>
              <ul className="job-card__list">
                {application.resumes.map((resume) => (
                  <li key={resume.id}>
                    <span className="job-card__list-icon">📄</span>
                    <div>
                      <p className="job-card__list-title">{resume.title}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {application.job_posting_url && (
            <a
              className="job-card__link"
              href={application.job_posting_url}
              target="_blank"
              rel="noreferrer"
            >
              View job posting ↗
            </a>
          )}
        </div>
      </div>
    </article>
  )
}
