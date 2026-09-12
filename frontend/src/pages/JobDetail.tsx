import {
    ArrowLeft,
    ArrowUpRight,
    Bell,
    Bookmark,
    BriefcaseBusiness,
    CalendarDays,
    Check,
    CheckCircle2,
    CircleDollarSign,
    FileText,
    Mail,
    MapPin,
    Monitor,
    Sparkles,
} from "lucide-react";
import { CompanyLogo, EmptyState, StatusBadge } from "../components/UI";
import { useApp } from "../store";
import { STATUSES, type Status } from "../types";
import { formatTrackerDate } from "../lib/filters";
import "./tracker.css";

interface JobDetailProps {
    jobId: string;
    onBack: () => void;
    onCustomize: (jobId: string) => void;
    onApply: (jobId: string) => void;
}

export default function JobDetail({ jobId, onBack, onCustomize, onApply }: JobDetailProps) {
    const { state, saveJob, updateStatus } = useApp();
    const job = state.jobs.find((item) => item.id === jobId);
    const application = state.applications.find((item) => item.jobId === jobId);
    const resume = state.resumes.find((item) => item.id === application?.resumeId);
    const hasApplied = Boolean(application?.appliedDate);
    const isBookmarked = Boolean(application?.saved);
    const notifications = [...(application?.notifications ?? [])].sort((a, b) => {
        const left = Date.parse(a.date);
        const right = Date.parse(b.date);
        if (Number.isNaN(left) !== Number.isNaN(right)) return Number.isNaN(left) ? 1 : -1;
        return Number.isNaN(left) ? 0 : right - left;
    });

    if (!job) {
        return (
            <div className="job-detail-page">
                <button type="button" className="btn btn-ghost job-detail-back" onClick={onBack}>
                    <ArrowLeft size={17} aria-hidden="true" />
                    Back to jobs
                </button>
                <header className="page-heading">
                    <h1>Job not found</h1>
                </header>
                <section className="panel job-detail-panel">
                    <EmptyState
                        icon={<BriefcaseBusiness size={28} />}
                        title="This opportunity is unavailable"
                        description="This job may no longer be in your demo workspace. Return to your jobs to find another opportunity."
                        action={
                            <button type="button" className="btn btn-secondary" onClick={onBack}>
                                Back to jobs
                            </button>
                        }
                    />
                </section>
            </div>
        );
    }

    return (
        <div className="job-detail-page">
            <div className="job-detail-topbar">
                <button type="button" className="btn btn-ghost job-detail-back" onClick={onBack}>
                    <ArrowLeft size={17} aria-hidden="true" />
                    Back to jobs
                </button>
                <span className="badge tracker-demo-label">
                    <span className="tracker-demo-dot" />
                    Demo opportunity
                </span>
            </div>

            <header className="panel job-detail-hero">
                <div className="job-detail-identity">
                    <CompanyLogo job={job} size="lg" />
                    <div className="job-detail-title">
                        <p className="eyebrow">
                            {job.company} <span aria-hidden="true">/</span> {job.department}
                        </p>
                        <h1>{job.position}</h1>
                        <div className="job-detail-meta">
                            <span>
                                <MapPin size={15} aria-hidden="true" />
                                {job.location}
                            </span>
                            <span>
                                <BriefcaseBusiness size={15} aria-hidden="true" />
                                {job.level}
                            </span>
                            <span>
                                <Monitor size={15} aria-hidden="true" />
                                {job.workplace}
                            </span>
                        </div>
                    </div>
                    <span className="job-detail-match">
                        <Sparkles size={15} aria-hidden="true" />
                        {job.match}% demo match
                    </span>
                </div>
                <div className="job-detail-hero-bottom">
                    <span className="job-detail-salary">
                        <CircleDollarSign size={18} aria-hidden="true" />
                        {job.salary}
                    </span>
                    <div className="job-detail-actions">
                        <button
                            type="button"
                            className={`btn btn-secondary job-detail-save${isBookmarked ? " job-detail-save--active" : ""}`}
                            aria-pressed={isBookmarked}
                            aria-label={`${isBookmarked ? "Remove bookmark for" : "Bookmark"} ${job.position} at ${job.company}`}
                            onClick={() => saveJob(job.id)}
                        >
                            <Bookmark size={17} fill={isBookmarked ? "currentColor" : "none"} aria-hidden="true" />
                            {isBookmarked ? "Bookmarked" : "Save job"}
                        </button>
                        <button type="button" className="btn btn-secondary" onClick={() => onCustomize(job.id)}>
                            <Sparkles size={17} aria-hidden="true" />
                            Customize resume
                        </button>
                        <button type="button" className="btn btn-primary" disabled={hasApplied} onClick={() => onApply(job.id)}>
                            {hasApplied ? <CheckCircle2 size={17} aria-hidden="true" /> : <ArrowUpRight size={17} aria-hidden="true" />}
                            {hasApplied ? "Application recorded" : "Apply in demo"}
                        </button>
                    </div>
                </div>
            </header>

            <div className="job-detail-layout">
                <article className="panel job-detail-panel job-detail-description" aria-label="Job description">
                    <section>
                        <p className="eyebrow">THE OPPORTUNITY</p>
                        <h2>About the role</h2>
                        <p className="job-detail-prose">{job.description}</p>
                    </section>
                    <section>
                        <h2>What you’ll bring</h2>
                        {job.requirements.length > 0 ? (
                            <ul className="job-detail-requirements">
                                {job.requirements.map((requirement, index) => (
                                    <li key={`${index}-${requirement}`}>
                                        <Check size={17} aria-hidden="true" />
                                        <span>{requirement}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="muted">No specific requirements were listed for this demo role.</p>
                        )}
                    </section>
                    <section>
                        <h2>Skills & tools</h2>
                        {job.skills.length > 0 ? (
                            <ul className="job-detail-skills" aria-label="Job skills">
                                {job.skills.map((skill, index) => (
                                    <li key={`${index}-${skill}`} className="badge">
                                        {skill}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="muted">No skills were listed.</p>
                        )}
                    </section>
                    <section>
                        <h2>About {job.company}</h2>
                        <p className="job-detail-prose">{job.about}</p>
                    </section>
                    <p className="job-detail-posted muted">
                        <CalendarDays size={15} aria-hidden="true" />
                        Posted <time dateTime={job.postedAt}>{formatTrackerDate(job.postedAt, "Date unavailable")}</time>
                    </p>
                </article>

                <aside className="job-detail-sidebar" aria-label="Your application">
                    <section className="panel job-detail-panel job-detail-application">
                        <div className="section-heading job-detail-section-heading">
                            <h2>Your application</h2>
                            <FileText size={19} aria-hidden="true" />
                        </div>
                        <dl className="job-detail-summary">
                            <div>
                                <dt>Current status</dt>
                                <dd>{application ? <StatusBadge status={application.status} /> : <span className="badge">Not tracked</span>}</dd>
                            </div>
                            <div>
                                <dt>Apply date</dt>
                                <dd>
                                    {application?.appliedDate ? (
                                        <time dateTime={application.appliedDate}>{formatTrackerDate(application.appliedDate)}</time>
                                    ) : (
                                        "Not applied"
                                    )}
                                </dd>
                            </div>
                            <div>
                                <dt>Resume type</dt>
                                <dd>
                                    {resume
                                        ? resume.jobId === null
                                            ? "Master resume"
                                            : "Custom resume"
                                        : application?.resumeId
                                          ? "Resume unavailable"
                                          : hasApplied
                                            ? "Not recorded"
                                            : "Choose when applying"}
                                </dd>
                            </div>
                            {resume && (
                                <div className="job-detail-resume-name">
                                    <dt>Resume used</dt>
                                    <dd>
                                        <FileText size={15} aria-hidden="true" />
                                        <span>{resume.name}</span>
                                    </dd>
                                </div>
                            )}
                            <div>
                                <dt>Bookmark</dt>
                                <dd>
                                    {isBookmarked ? (
                                        <span className="job-detail-bookmarked">
                                            <Bookmark size={14} fill="currentColor" aria-hidden="true" />
                                            Saved to your list
                                        </span>
                                    ) : (
                                        "Not bookmarked"
                                    )}
                                </dd>
                            </div>
                        </dl>
                        <div className="field job-detail-status-field">
                            <label htmlFor="job-detail-status">Update pipeline status</label>
                            <select
                                id="job-detail-status"
                                className="input"
                                value={hasApplied && application ? application.status : "unapplied"}
                                disabled={!hasApplied}
                                aria-describedby="job-detail-status-help"
                                onChange={(event) => {
                                    if (application && hasApplied) updateStatus(application.id, event.target.value as Status);
                                }}
                            >
                                {!hasApplied && <option value="unapplied">Apply first to set a status</option>}
                                {STATUSES.filter((status) => status !== "Saved").map((status) => (
                                    <option key={status}>{status}</option>
                                ))}
                            </select>
                            <p id="job-detail-status-help" className="muted">
                                {hasApplied
                                    ? "Update your progress here. Bookmarking this job won’t change its pipeline status."
                                    : "Record a demo application with a resume before moving this job into the pipeline. Saving only adds a bookmark."}
                            </p>
                        </div>
                        {hasApplied && (
                            <p className="job-detail-resume-note muted">
                                Customizing creates a resume for this role; it does not replace the resume already recorded with this application.
                            </p>
                        )}
                    </section>
                    <section className="job-detail-demo-note">
                        <span className="job-detail-note-icon">
                            <Sparkles size={20} aria-hidden="true" />
                        </span>
                        <div>
                            <h2>A practice run, with possibility.</h2>
                            <p>
                                This is a demo opportunity. Applying records your selected resume in HirePower; no application or message is sent to{" "}
                                {job.company}.
                            </p>
                        </div>
                    </section>
                </aside>
            </div>

            <section className="panel job-detail-history" aria-labelledby="job-detail-history-heading">
                <div className="job-detail-history-header">
                    <div>
                        <p className="eyebrow">YOUR ACTIVITY</p>
                        <h2 id="job-detail-history-heading">
                            Notification history <span className="job-detail-history-count">{notifications.length}</span>
                        </h2>
                    </div>
                    <span className="badge tracker-demo-label">
                        <Bell size={13} aria-hidden="true" />
                        Demo history
                    </span>
                </div>
                <p className="job-detail-history-hint muted">
                    Activity for your {job.company} · {job.position} application only, newest first. Email entries are simulated—not real employer messages.
                    Status changes are recorded locally.
                </p>
                {notifications.length > 0 ? (
                    <div
                        className="tracker-table-scroll"
                        role="region"
                        aria-label="Job notification history; scroll horizontally for more columns"
                        tabIndex={0}
                    >
                        <table className="tracker-table job-detail-history-table">
                            <caption className="tracker-sr-only">
                                Demo notifications for {job.position} at {job.company}, newest first. Times are local.
                            </caption>
                            <thead>
                                <tr>
                                    <th scope="col">Notification</th>
                                    <th scope="col">Channel</th>
                                    <th scope="col">
                                        Date & time <span className="job-detail-local-time">(local)</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {notifications.map((notification) => {
                                    const date = new Date(notification.date);
                                    const validDate = !Number.isNaN(date.getTime());
                                    return (
                                        <tr key={notification.id}>
                                            <td>
                                                <strong className="job-detail-notification-title">{notification.title}</strong>
                                                <p className="job-detail-notification-message muted">{notification.message}</p>
                                            </td>
                                            <td>
                                                <span className="job-detail-channel">
                                                    {notification.channel === "Email" ? (
                                                        <Mail size={14} aria-hidden="true" />
                                                    ) : (
                                                        <Bell size={14} aria-hidden="true" />
                                                    )}
                                                    {notification.channel}
                                                </span>
                                                <span className="tracker-cell-secondary">
                                                    {notification.channel === "Email" ? "Simulated email" : "Demo activity"}
                                                </span>
                                            </td>
                                            <td>
                                                {validDate ? (
                                                    <time dateTime={notification.date}>
                                                        {formatTrackerDate(notification.date, "Date unavailable")}
                                                        <span className="tracker-cell-secondary">
                                                            {date.toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" })}
                                                        </span>
                                                    </time>
                                                ) : (
                                                    <span className="muted">Date unavailable</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="job-detail-history-empty">
                        <EmptyState
                            icon={<Bell size={25} />}
                            title="A fresh page in your story"
                            description={
                                hasApplied
                                    ? "No notifications are recorded for this job yet. Updating your pipeline status will add demo activity here."
                                    : "No notifications for this job yet. Record a demo application to start its history."
                            }
                        />
                    </div>
                )}
            </section>
        </div>
    );
}
